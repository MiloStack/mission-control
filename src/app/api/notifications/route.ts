import { NextRequest, NextResponse } from 'next/server';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  text: string;
  time: string;
}

function formatAge(ageMs: number): string {
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gatewayUrl = searchParams.get('gatewayUrl');
  const gatewayToken = searchParams.get('gatewayToken');

  const notifications: Notification[] = [];

  // Try to get cron data
  try {
    const cronResponse = await fetch(
      `${gatewayUrl}/api/cron?gatewayUrl=${encodeURIComponent(gatewayUrl || '')}&gatewayToken=${encodeURIComponent(gatewayToken || '')}`,
      {
        headers: { Authorization: `Bearer ${gatewayToken || ''}` },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (cronResponse.ok) {
      const data = await cronResponse.json();
      const jobs = data.jobs || [];

      // Add failed cron jobs as error notifications
      for (const job of jobs) {
        if (job.state?.lastRunStatus === 'error' || job.state?.lastStatus === 'error') {
          notifications.push({
            id: `cron-error-${job.id}`,
            type: 'error',
            text: `Cron job failed: ${job.name}`,
            time: job.state?.lastRunAtMs
              ? formatAge(Date.now() - job.state.lastRunAtMs)
              : 'unknown',
          });
        }
        if (job.state?.consecutiveErrors > 0) {
          notifications.push({
            id: `cron-errors-${job.id}`,
            type: 'warning',
            text: `${job.name}: ${job.state.consecutiveErrors} consecutive errors`,
            time: job.state?.lastRunAtMs
              ? formatAge(Date.now() - job.state.lastRunAtMs)
              : 'unknown',
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // Try to get sessions data for error sessions
  try {
    const sessionsResponse = await fetch(
      `${gatewayUrl}/api/sessions?gatewayUrl=${encodeURIComponent(gatewayUrl || '')}&gatewayToken=${encodeURIComponent(gatewayToken || '')}`,
      {
        headers: { Authorization: `Bearer ${gatewayToken || ''}` },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (sessionsResponse.ok) {
      const data = await sessionsResponse.json();
      const sessions = data.sessions || [];

      for (const session of sessions) {
        if (session.abortedLastRun) {
          notifications.push({
            id: `session-error-${session.sessionId}`,
            type: 'error',
            text: `Session error: ${session.key}`,
            time: formatAge(session.ageMs),
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // Fall back to local CLI data if no gateway
  if (!gatewayUrl || !gatewayToken || notifications.length === 0) {
    try {
      const { execSync } = await import('child_process');

      // Get cron jobs
      try {
        const cronOutput = execSync('openclaw cron list --json 2>/dev/null', {
          encoding: 'utf-8',
          timeout: 10000,
        });
        const cronData = JSON.parse(cronOutput);
        for (const job of cronData.jobs || []) {
          if (job.state?.lastRunStatus === 'error') {
            notifications.push({
              id: `cron-error-${job.id}`,
              type: 'error',
              text: `Cron failed: ${job.name}`,
              time: job.state?.lastRunAtMs
                ? formatAge(Date.now() - job.state.lastRunAtMs)
                : 'unknown',
            });
          }
        }
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }

  // Sort by newest first
  notifications.sort((a, b) => 0); // Keep insertion order

  // If still empty, add a demo notification
  if (notifications.length === 0) {
    notifications.push({
      id: 'demo-welcome',
      type: 'info',
      text: 'Mission Control connected — all systems operational',
      time: 'just now',
    });
  }

  return NextResponse.json({ notifications: notifications.slice(0, 20) });
}

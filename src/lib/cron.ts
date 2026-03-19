export interface CronJob {
  id: string;
  agentId: string;
  sessionKey: string;
  name: string;
  enabled: boolean;
  schedule: {
    expr: string;
    kind: string;
    tz?: string;
  };
  sessionTarget: string;
  wakeMode: string;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastRunStatus?: string;
    lastStatus?: string;
    lastDurationMs?: number;
    lastDelivered?: boolean;
    consecutiveErrors?: number;
  };
}

export interface CronResponse {
  jobs: CronJob[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export function formatCronExpr(expr: string): string {
  // Simple cron expression formatter
  // "0 10 * * *" -> "Daily at 10:00 AM"
  // "0 9,14,19 * * *" -> "9am, 2pm, 7pm daily"
  const parts = expr.split(' ');
  if (parts.length < 5) return expr;

  const [minute, hour, , , dow] = parts;

  if (dow === '*' && hour.includes(',')) {
    const hours = hour.split(',').map((h) => {
      const h12 = parseInt(h, 10);
      const ampm = h12 >= 12 ? 'PM' : 'AM';
      const h12Disp = h12 % 12 || 12;
      return `${h12Disp}${ampm}`;
    });
    return `${hours.join(', ')} daily`;
  }

  if (dow === '*' && minute === '0') {
    const h12 = parseInt(hour, 10);
    const ampm = h12 >= 12 ? 'PM' : 'AM';
    const h12Disp = h12 % 12 || 12;
    return `Daily at ${h12Disp}:00 ${ampm}`;
  }

  if (dow !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayList = dow.split(',').map((d) => days[parseInt(d, 10)] || d).join(', ');
    const h12 = parseInt(hour, 10);
    const ampm = h12 >= 12 ? 'PM' : 'AM';
    const h12Disp = h12 % 12 || 12;
    return `${dayList} at ${h12Disp}:00 ${ampm}`;
  }

  return expr;
}

export function formatNextRun(nextRunAtMs?: number): string {
  if (!nextRunAtMs) return '—';

  const now = Date.now();
  const diff = nextRunAtMs - now;

  if (diff < 0) return 'Overdue';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;

  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

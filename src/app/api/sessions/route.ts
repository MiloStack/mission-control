import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gatewayUrl = searchParams.get('gatewayUrl');
  const gatewayToken = searchParams.get('gatewayToken');

  if (!gatewayUrl || !gatewayToken) {
    // Fall back to local CLI for development
    try {
      const { execSync } = await import('child_process');
      const output = execSync(
        'openclaw sessions --json 2>/dev/null | sed "/^\\[plugins\\]/d" | sed "/^\\s*$/d"',
        { encoding: 'utf-8', timeout: 15000, maxBuffer: 5 * 1024 * 1024 }
      );
      const lines = output.trim().split('\n').filter(l => l.trim());
      const sessions = [];
      for (const line of lines) {
        try { sessions.push(JSON.parse(line.trim())); } catch { /* skip */ }
      }
      return NextResponse.json({ sessions, count: sessions.length });
    } catch {
      return NextResponse.json({ sessions: [], count: 0 });
    }
  }

  // Try gateway HTTP API endpoints
  const base = gatewayUrl.replace(/\/$/, '');
  const endpoints = [
    `${base}/api/v1/sessions`,
    `${base}/api/sessions`,
    `${base}/sessions`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${gatewayToken}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        const sessions = Array.isArray(data) ? data : data.sessions ?? data.items ?? [];
        return NextResponse.json({ sessions, count: sessions.length });
      }
    } catch { /* try next */ }
  }

  return NextResponse.json({ sessions: [], count: 0 });
}

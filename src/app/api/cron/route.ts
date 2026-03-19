import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gatewayUrl = searchParams.get('gatewayUrl');
  const gatewayToken = searchParams.get('gatewayToken');

  if (!gatewayUrl || !gatewayToken) {
    // Fall back to local CLI for development
    try {
      const { execSync } = await import('child_process');
      const output = execSync('openclaw cron list --json 2>/dev/null', {
        encoding: 'utf-8',
        timeout: 10000,
      });
      return NextResponse.json(JSON.parse(output));
    } catch {
      return NextResponse.json({ jobs: [], total: 0 });
    }
  }

  try {
    const response = await fetch(`${gatewayUrl}/api/cron`, {
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return NextResponse.json(await response.json());
    }

    // Gateway doesn't expose cron API — return empty
    return NextResponse.json({ jobs: [], total: 0 });
  } catch {
    return NextResponse.json({ jobs: [], total: 0 });
  }
}

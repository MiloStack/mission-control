import { NextResponse } from 'next/server';

type Action = 'stop' | 'nudge' | 'restart';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gatewayUrl, gatewayToken, sessionId, action } = body as {
      gatewayUrl?: string;
      gatewayToken?: string;
      sessionId?: string;
      action?: Action;
    };

    if (!gatewayUrl || !gatewayToken || !sessionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authHeaders = {
      Authorization: `Bearer ${gatewayToken}`,
      'Content-Type': 'application/json',
    };

    // Try common action endpoint shapes used by gateway APIs.
    const attempts: Array<Promise<Response>> = [
      fetch(`${gatewayUrl}/api/sessions/${encodeURIComponent(sessionId)}/${action}`, {
        method: 'POST',
        headers: authHeaders,
      }),
      fetch(`${gatewayUrl}/api/sessions/${encodeURIComponent(sessionId)}/actions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action }),
      }),
      fetch(`${gatewayUrl}/api/session-action`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ sessionId, action }),
      }),
    ];

    for (const attempt of attempts) {
      try {
        const response = await attempt;
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const data = contentType.includes('application/json') ? await response.json() : null;
          return NextResponse.json({ ok: true, data });
        }
      } catch {
        // Ignore and continue to next attempt.
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          'Session action endpoint not available on this gateway yet. UI wiring is complete; backend action endpoint still needed.',
      },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

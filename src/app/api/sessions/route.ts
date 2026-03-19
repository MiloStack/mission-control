import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gatewayUrl = searchParams.get('gatewayUrl');
  const gatewayToken = searchParams.get('gatewayToken');

  if (!gatewayUrl || !gatewayToken) {
    return NextResponse.json({ error: 'Gateway URL and token required' }, { status: 400 });
  }

  try {
    // Try the gateway API endpoint for sessions
    const response = await fetch(`${gatewayUrl}/api/sessions`, {
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Try alternative endpoint
    const altResponse = await fetch(`${gatewayUrl}/api/agents/sessions`, {
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (altResponse.ok) {
      const data = await altResponse.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: `Gateway returned ${response.status}` },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect to gateway' },
      { status: 500 }
    );
  }
}

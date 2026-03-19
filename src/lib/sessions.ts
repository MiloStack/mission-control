import { getGatewayConfig } from './gateway';

export interface Session {
  key: string;
  updatedAt: number;
  ageMs: number;
  sessionId: string;
  systemSent: boolean;
  abortedLastRun: boolean;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalTokensFresh: boolean;
  model: string;
  modelProvider: string;
  contextTokens: number;
  agentId: string;
  kind: string;
}

export interface SessionsResponse {
  path: string;
  count: number;
  sessions: Session[];
}

export async function fetchSessions(): Promise<SessionsResponse> {
  const gateway = getGatewayConfig();

  if (!gateway?.url || !gateway?.token) {
    throw new Error('Gateway not configured');
  }

  // Try the gateway API endpoint for sessions
  try {
    const response = await fetch(`${gateway.url}/api/sessions`, {
      headers: {
        Authorization: `Bearer ${gateway.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return response.json();
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid gateway token');
    }
  } catch {
    // Gateway API not available, fall back to CLI
  }

  // Fall back to using the local CLI via a proxy endpoint
  // For now, throw an error indicating we need gateway API
  throw new Error('Gateway API not accessible. Ensure gateway is reachable at the configured URL.');
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`;
  }
  return tokens.toString();
}

export function formatAge(ageMs: number): string {
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getSessionStatus(session: Session): 'running' | 'idle' | 'error' | 'completed' {
  if (session.abortedLastRun) return 'error';
  const ageMs = Date.now() - session.updatedAt;
  // Active if updated within last 5 minutes
  if (ageMs < 5 * 60 * 1000) return 'running';
  if (session.kind.includes('cron')) return 'idle';
  return 'idle';
}

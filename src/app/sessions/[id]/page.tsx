'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getGatewayConfig, type GatewayConfig } from '@/lib/gateway';
import { formatAge, formatTokenCount, getSessionStatus, type Session } from '@/lib/sessions';

function statusColor(status: string) {
  if (status === 'running') return 'bg-emerald-400';
  if (status === 'idle') return 'bg-slate-400';
  if (status === 'error') return 'bg-red-400';
  return 'bg-yellow-400';
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [gateway, setGateway] = useState<GatewayConfig | null | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<'stop' | 'nudge' | 'restart' | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setGateway(getGatewayConfig());
  }, []);

  useEffect(() => {
    if (!gateway?.url || !gateway?.token) return;

    setSessionsLoading(true);

    // Use the API proxy we built
    fetch(`/api/sessions?gatewayUrl=${encodeURIComponent(gateway.url)}&gatewayToken=${encodeURIComponent(gateway.token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) {
          setSessions(data.sessions);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setSessionsLoading(false));
  }, [gateway]);

  if (gateway === undefined || sessionsLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-8">
          <span className="text-sm text-slate-300">Loading session…</span>
        </div>
      </main>
    );
  }

  if (!gateway) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-8">
          <div className="text-center">
            <p className="text-slate-300">Gateway not configured</p>
            <Link href="/connect" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
              Connect Gateway
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Find the specific session from the decoded ID
  const session = sessions.find(
    (s) =>
      s.sessionId === sessionId ||
      encodeURIComponent(s.sessionId) === sessionId ||
      s.key === sessionId
  );

  if (!session) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-8">
          <div className="text-center">
            <p className="text-slate-300">Session not found</p>
            <p className="mt-1 text-sm text-slate-500">ID: {sessionId}</p>
            <Link href="/" className="mt-4 inline-block text-sm text-emerald-400 hover:underline">
              ← Back to Control Center
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const status = getSessionStatus(session);
  const isCron = session.kind.includes('cron');

  const runAction = async (action: 'stop' | 'nudge' | 'restart') => {
    if (!gateway?.url || !gateway?.token) return;
    setActionBusy(action);
    setActionNotice(null);

    try {
      const response = await fetch('/api/session-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayUrl: gateway.url,
          gatewayToken: gateway.token,
          sessionId: session.sessionId,
          action,
        }),
      });

      const payload = await response.json();
      if (response.ok && payload?.ok) {
        setActionNotice({ type: 'success', text: `${action} request sent successfully.` });
      } else {
        setActionNotice({ type: 'error', text: payload?.error || `Failed to ${action} session.` });
      }
    } catch (error) {
      setActionNotice({
        type: 'error',
        text: error instanceof Error ? error.message : `Failed to ${action} session.`,
      });
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
              ← Control Center
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {session.key.split(':').pop() || session.key}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${statusColor(status)}`} />
                {status}
              </span>
              <span>·</span>
              <span>{session.model}</span>
              {isCron && (
                <>
                  <span>·</span>
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-300">
                    cron
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => runAction('stop')}
              disabled={actionBusy !== null}
              className="rounded-lg border border-red-600/50 bg-red-900/20 px-3 py-1.5 text-sm text-red-300 hover:bg-red-900/40 disabled:opacity-50"
            >
              {actionBusy === 'stop' ? 'Stopping...' : 'Stop'}
            </button>
            <button
              onClick={() => runAction('nudge')}
              disabled={actionBusy !== null}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {actionBusy === 'nudge' ? 'Nudging...' : 'Nudge'}
            </button>
            <button
              onClick={() => runAction('restart')}
              disabled={actionBusy !== null}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {actionBusy === 'restart' ? 'Restarting...' : 'Restart'}
            </button>
          </div>
        </header>

        {/* Action feedback */}
        {actionNotice && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-300 border border-red-500/20'
            }`}
          >
            {actionNotice.text}
          </div>
        )}

        {/* Session metadata */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Input Tokens', value: formatTokenCount(session.inputTokens) },
            { label: 'Output Tokens', value: formatTokenCount(session.outputTokens) },
            { label: 'Total Tokens', value: formatTokenCount(session.totalTokens) },
            { label: 'Context Size', value: formatTokenCount(session.contextTokens) },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-700 bg-surface p-4"
            >
              <p className="text-sm text-slate-300">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold">{item.value}</p>
            </article>
          ))}
        </section>

        {/* Session info */}
        <section className="mb-8 rounded-2xl border border-slate-700 bg-surface p-5">
          <h2 className="mb-4 text-lg font-semibold">Session Info</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { term: 'Session ID', desc: session.sessionId },
              { term: 'Key', desc: session.key },
              { term: 'Model', desc: session.model },
              { term: 'Provider', desc: session.modelProvider },
              { term: 'Kind', desc: session.kind },
              { term: 'Agent ID', desc: session.agentId },
              { term: 'Last Updated', desc: formatAge(session.ageMs) },
              { term: 'Aborted', desc: session.abortedLastRun ? 'Yes' : 'No' },
            ].map((item) => (
              <div key={item.term}>
                <dt className="text-xs text-slate-400">{item.term}</dt>
                <dd className="mt-0.5 truncate text-sm font-mono text-slate-200" title={item.desc}>
                  {item.desc}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Placeholder for conversation timeline */}
        <section className="rounded-2xl border border-slate-700 bg-surface p-5">
          <h2 className="mb-4 text-lg font-semibold">Conversation</h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
            Conversation history will appear here — requires gateway API support for message retrieval.
          </div>
        </section>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getGatewayConfig, type GatewayConfig } from '@/lib/gateway';
import { fetchSessions, formatAge, formatTokenCount, getSessionStatus, type Session } from '@/lib/sessions';
import { UsageChart, CostBreakdown } from '@/components/UsageChart';
import { formatNextRun, type CronJob } from '@/lib/cron';

const KPI_TEMPLATES = {
  activeSessions: { label: 'Active Sessions', value: '—', delta: '' },
  tokens24h: { label: 'Tokens (24h)', value: '—', delta: '' },
  estimatedCost: { label: 'Estimated Cost', value: '$0.00', delta: '' },
  scheduledJobs: { label: 'Scheduled Jobs', value: '—', delta: '' },
};

function statusColor(status: string) {
  if (status === 'running') return 'bg-emerald-400';
  if (status === 'idle') return 'bg-slate-400';
  if (status === 'error') return 'bg-red-400';
  return 'bg-yellow-400';
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-8 md:px-10">
        <div className="text-center">
          <div className="text-sm text-slate-300">Loading Mission Control…</div>
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-slate-700 bg-surface p-8 shadow-xl">
          <p className="text-sm text-slate-300">OpenClaw Mission Control</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Connect your gateway</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Mission Control needs a gateway URL and token before it can show sessions, automations,
            cost, and notifications.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { title: 'BYOA', copy: 'Connect your existing OpenClaw gateway in under 2 minutes.' },
              { title: 'One dashboard', copy: 'See sessions, cron jobs, notifications, usage, and cost.' },
              { title: 'Safe defaults', copy: 'Start with read-only visibility, then add controls.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-sm font-medium text-slate-100">{item.title}</p>
                <p className="mt-2 text-sm text-slate-300">{item.copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/connect"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Connect Gateway
            </Link>
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-300">
              Need your token? Check <code className="rounded bg-slate-800 px-1 py-0.5">config.toml</code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const [gateway, setGateway] = useState<GatewayConfig | null | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; text: string; time: string }>>([]);

  useEffect(() => {
    setGateway(getGatewayConfig());
  }, []);

  useEffect(() => {
    if (!gateway?.url || !gateway?.token) return;

    setSessionsLoading(true);
    setSessionsError(null);

    fetchSessions()
      .then((data) => {
        setSessions(data.sessions.slice(0, 10)); // Show latest 10
      })
      .catch((err) => {
        setSessionsError(err instanceof Error ? err.message : 'Failed to load sessions');
      })
      .finally(() => {
        setSessionsLoading(false);
      });

    // Fetch cron jobs
    fetch(`/api/cron?gatewayUrl=${encodeURIComponent(gateway.url)}&gatewayToken=${encodeURIComponent(gateway.token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs) {
          setCronJobs(data.jobs.slice(0, 8)); // Show up to 8 cron jobs
        }
      })
      .catch(() => {
        // ignore cron errors
      });

    // Fetch notifications
    fetch(`/api/notifications?gatewayUrl=${encodeURIComponent(gateway.url)}&gatewayToken=${encodeURIComponent(gateway.token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications.slice(0, 10));
        }
      })
      .catch(() => {
        // ignore
      });
  }, [gateway]);

  if (gateway === undefined) return <LoadingState />;
  if (!gateway) return <EmptyState />;

  // Compute KPIs from session data
  const kpis = [
    {
      ...KPI_TEMPLATES.activeSessions,
      value: sessions.filter((s) => getSessionStatus(s) === 'running').length.toString() || '—',
      delta: sessions.length > 0 ? `${sessions.length} total sessions` : '',
    },
    {
      ...KPI_TEMPLATES.tokens24h,
      value:
        sessions.length > 0
          ? formatTokenCount(sessions.reduce((sum, s) => sum + s.totalTokens, 0))
          : '—',
      delta: sessions.length > 0 ? 'All time' : '',
    },
    {
      ...KPI_TEMPLATES.estimatedCost,
      value: sessions.length > 0 ? '$0.00' : '$0.00', // TODO: real cost calc
      delta: '',
    },
    {
      ...KPI_TEMPLATES.scheduledJobs,
      value: cronJobs.length > 0 ? cronJobs.length.toString() : '—',
      delta: cronJobs.filter((j) => j.enabled).length > 0
        ? `${cronJobs.filter((j) => j.enabled).length} active`
        : '',
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-slate-300">OpenClaw Mission Control</p>
            <h1 className="text-3xl font-semibold tracking-tight">Control Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-700 bg-surface px-4 py-2 text-sm text-slate-200">
              Gateway:{' '}
              <span className="font-medium text-emerald-400">
                {gateway.name || new URL(gateway.url).hostname}
              </span>
            </div>
            <Link
              href="/connect"
              className="rounded-xl border border-slate-700 bg-surface px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Manage
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-700 bg-surface p-4 shadow-sm"
            >
              <p className="text-sm text-slate-300">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
              {item.delta && <p className="mt-2 text-xs text-emerald-300">{item.delta}</p>}
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-surface p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sessions</h2>
              {sessionsLoading && (
                <span className="text-xs text-slate-400">Loading…</span>
              )}
            </div>

            {sessionsError ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
                <p className="font-medium text-red-400">Failed to load sessions</p>
                <p className="mt-1 text-xs">{sessionsError}</p>
              </div>
            ) : sessions.length === 0 && !sessionsLoading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
                No sessions found. Sessions will appear here once your agent starts working.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <Link
                      key={session.key}
                      href={`/sessions/${encodeURIComponent(session.sessionId)}`}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3 transition hover:border-slate-600 hover:bg-slate-900/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{session.key}</p>
                          {session.kind.includes('cron') && (
                            <span className="inline-block rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-300">
                              cron
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {formatAge(session.ageMs)} · {formatTokenCount(session.totalTokens)} tokens
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3 text-xs text-slate-300">
                        <span>{session.model}</span>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${statusColor(status)}`}
                          />
                          {status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-700 bg-surface p-5">
            <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
            <div className="space-y-3 text-sm">
              {notifications.length === 0 ? (
                <p className="text-slate-400">No notifications.</p>
              ) : (
                notifications.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-lg border p-3 text-slate-200 ${
                      note.type === 'error'
                        ? 'border-red-500/20 bg-red-500/5'
                        : note.type === 'warning'
                        ? 'border-yellow-500/20 bg-yellow-500/5'
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <p className="text-sm">{note.text}</p>
                    <p className="mt-1 text-xs text-slate-400">{note.time}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-700 bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Usage + Cost</h2>
              <span className="text-xs text-slate-400">Demo data until usage API is wired</span>
            </div>
            <UsageChart />
            <div className="mt-5">
              <CostBreakdown />
            </div>
          </div>

          <section className="rounded-2xl border border-slate-700 bg-surface p-5">
            <h2 className="mb-4 text-lg font-semibold">Automation (Cron)</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {cronJobs.length === 0 ? (
                <p className="text-sm text-slate-400">No cron jobs found.</p>
              ) : (
                cronJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                  >
                    <p className="text-sm font-medium">{job.name}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Next run: {formatNextRun(job.state?.nextRunAtMs)}
                    </p>
                    <p
                      className={`mt-2 inline-block rounded px-2 py-1 text-xs ${
                        job.enabled
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {job.enabled ? 'enabled' : 'disabled'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

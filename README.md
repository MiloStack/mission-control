# Mission Control

A web dashboard for OpenClaw agents. Connect your gateway to see sessions, cron jobs, notifications, and usage in one place.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Gateway Connection

On first load, you'll be prompted to connect to an OpenClaw gateway. You'll need:

- **Gateway URL** — the public URL where your OpenClaw gateway is running (e.g. `https://your-gateway.example.com`)
- **Gateway Token** — your gateway authentication token

Find your token in `~/.config/openclaw/config.toml` under `[gateway.auth]`.

## Troubleshooting

### "Connection failed" when testing the gateway URL

1. **Check the URL is correct** — it must be the public URL of your gateway, not `localhost`.
2. **Check the gateway is running** — run `openclaw gateway status` on the machine hosting your gateway.
3. **Check the token is correct** — the token should match what's in your `config.toml`.
4. **Check CORS** — the gateway must allow requests from your Mission Control domain. Set `gateway.bind` to allow your Mission Control URL.

### Dashboard shows no sessions or cron jobs

1. Verify the gateway connection is marked as "Connected" in the header.
2. Check that the machine running the gateway has `openclaw` CLI available and responding.
3. Try clicking "Manage" → "Test Connection" to verify the URL + token are still valid.

### Sessions show as "idle" even when actively running

Sessions are marked as "running" if they were updated within the last 5 minutes. After 5 minutes of inactivity they show as "idle". This is expected behavior.

## Architecture

```
src/
  app/
    page.tsx              # Dashboard
    connect/page.tsx      # Gateway connection flow
    sessions/[id]/page.tsx # Session detail
    api/
      sessions/route.ts   # Proxy: gateway sessions
      cron/route.ts       # Proxy: gateway cron jobs
      notifications/route.ts # Notifications from cron/session states
      session-action/route.ts # Actions: stop/nudge/restart
  lib/
    gateway.ts            # Gateway config (localStorage)
    sessions.ts          # Session types + formatters
    cron.ts              # Cron types + formatters
  components/
    UsageChart.tsx        # Token/cost chart (Recharts)
```

## Tech Stack

Next.js · TypeScript · Tailwind CSS · Recharts · Radix UI

## Learn More

- [OpenClaw Docs](https://docs.openclaw.ai)
- [Next.js Docs](https://nextjs.org/docs)

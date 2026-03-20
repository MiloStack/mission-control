# Mission Control — Vercel Deployment Runbook

**Estimated time:** 5 minutes  
**Prerequisite:** Vercel account connected to GitHub

---

## Step 1: Connect GitHub Repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Project**
3. Find and select **`MiloStack/mission-control`**
4. Vercel auto-detects Next.js — no framework override needed

## Step 2: Add Environment Variables

In the Vercel project settings, go to **Environment Variables** and add:

| Name | Value | Notes |
| :--- | :--- | :--- |
| `GATEWAY_URL` | Your gateway public URL | e.g. `https://your-gateway.example.com` |
| `GATEWAY_TOKEN` | Your gateway auth token | From `~/.config/openclaw/config.toml` → `[gateway.auth]` |
| `NEXT_PUBLIC_APP_URL` | Leave blank or set to final URL | Vercel auto-sets this in production |

**Where to find your gateway token:**
```bash
cat ~/.config/openclaw/config.toml | grep -A5 "[gateway.auth]"
```

## Step 3: Deploy

1. Click **Deploy** (deploys the `master` branch automatically on push)
2. Wait ~2 minutes for build
3. Get your production URL (e.g. `mission-control.vercel.app`)

## Step 4: Verify

1. Visit your production URL
2. You should see the Mission Control connect screen
3. Enter your `GATEWAY_URL` and `GATEWAY_TOKEN`
4. Dashboard should load with sessions, cron, notifications

## Step 5: Custom Domain (optional)

In Vercel → **Settings → Domains**, add your custom domain (e.g. `agents.yourdomain.com`).

---

## Troubleshooting

### Build fails
- Check that `npm run build` passes locally first
- Verify all env vars are set before deploying

### Dashboard shows "Connection failed"
- Verify `GATEWAY_URL` is the public-facing URL, not `localhost`
- Check the gateway is running: `openclaw gateway status`
- Check CORS: gateway must allow your Mission Control domain in `gateway.bind`

### Cron jobs not showing
- Cron data comes from `openclaw cron list --json` via CLI on the gateway machine
- The machine running the gateway needs the `openclaw` CLI installed

---

## Auto-Deploy

Every push to `master` triggers a new deployment automatically. No manual redeploy needed after the initial setup.

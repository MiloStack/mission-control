'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GatewayConfig {
  url: string;
  token: string;
}

export default function ConnectPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GatewayConfig>({ url: '', token: '' });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleTest = async () => {
    if (!config.url || !config.token) {
      setTestResult({ success: false, message: 'Please enter both URL and token' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Try to fetch the gateway status
      const response = await fetch(`${config.url}/api/status`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({ success: true, message: `Connected to ${data.gateway?.name || 'gateway'} successfully` });
      } else {
        setTestResult({ success: false, message: `Connection failed: ${response.status} ${response.statusText}` });
      }
    } catch (error) {
      // Try alternative endpoints
      try {
        const altResponse = await fetch(`${config.url}/health`, {
          headers: {
            'Authorization': `Bearer ${config.token}`,
          },
        });
        if (altResponse.ok) {
          setTestResult({ success: true, message: 'Gateway connected (health endpoint)' });
        } else {
          setTestResult({ success: false, message: 'Could not reach gateway. Check URL and ensure it\'s accessible.' });
        }
      } catch {
        setTestResult({ success: false, message: 'Could not reach gateway. Check URL and ensure it\'s accessible.' });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!config.url || !config.token) {
      setTestResult({ success: false, message: 'Please enter both URL and token' });
      return;
    }

    setSaving(true);

    // Save to localStorage for MVP
    localStorage.setItem('mission-control-gateway', JSON.stringify(config));
    setSaved(true);

    setTimeout(() => {
      router.push('/');
    }, 1000);

    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-8">
          <p className="text-sm text-slate-300">OpenClaw Mission Control</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Connect Gateway</h1>
          <p className="mt-2 text-slate-300">
            Add your OpenClaw gateway URL and token to connect.
          </p>
        </header>

        <div className="rounded-2xl border border-slate-700 bg-surface p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Gateway URL
              </label>
              <input
                type="url"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://your-gateway.example.com"
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                The public URL where your OpenClaw gateway is running
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Gateway Token
              </label>
              <input
                type="password"
                value={config.token}
                onChange={(e) => setConfig({ ...config, token: e.target.value })}
                placeholder="oc_token_..."
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Your OpenClaw gateway authentication token
              </p>
            </div>

            {testResult && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-300 border border-red-500/20'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleTest}
                disabled={testing}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !config.url || !config.token}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="text-sm font-medium text-slate-200">Quick Setup</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            <li>• Run <code className="rounded bg-slate-700 px-1 py-0.5">openclaw gateway start</code> to start your gateway</li>
            <li>• Get the URL from your gateway configuration</li>
            <li>• Find your token in <code className="rounded bg-slate-700 px-1 py-0.5">~/.config/openclaw/config.toml</code></li>
          </ul>
        </div>
      </div>
    </main>
  );
}

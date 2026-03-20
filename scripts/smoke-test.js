#!/usr/bin/env node
/**
 * Mission Control — API Smoke Tests
 *
 * Run from the project root:
 *   node scripts/smoke-test.js
 *
 * Requires environment variables:
 *   GATEWAY_URL   — your gateway URL
 *   GATEWAY_TOKEN — your gateway token
 *   APP_URL       — where the app is running (default: http://localhost:3000)
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18790';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...opts.headers },
    ...opts,
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got ${res.status} ${contentType}`);
  }
  return res.json();
}

async function testGatewayHealth() {
  console.log('\n[Gateway Health]');
  try {
    const data = await fetchJson(`${GATEWAY_URL}/health`, {
      headers: { Authorization: `Bearer ${GATEWAY_TOKEN}` },
    });
    assert(typeof data === 'object', 'Gateway /health returns an object');
  } catch (err) {
    assert(false, `Gateway /health — ${err.message}`);
  }
}

async function testGatewaySessions() {
  console.log('\n[Gateway Sessions]');
  try {
    const data = await fetchJson(`${GATEWAY_URL}/api/v1/sessions`, {
      headers: { Authorization: `Bearer ${GATEWAY_TOKEN}` },
    });
    assert(Array.isArray(data.sessions), 'Gateway /api/v1/sessions returns { sessions: [...] }');
    assert(typeof data.count === 'number', 'Response includes count field');
  } catch (err) {
    assert(false, `Gateway sessions — ${err.message}`);
  }
}

async function testAppSessions() {
  console.log('\n[App /api/sessions]');
  try {
    const url = `${APP_URL}/api/sessions?gatewayUrl=${encodeURIComponent(GATEWAY_URL)}&gatewayToken=${encodeURIComponent(GATEWAY_TOKEN)}`;
    const data = await fetchJson(url);
    assert(Array.isArray(data.sessions), '/api/sessions returns { sessions: [...] }');
  } catch (err) {
    assert(false, `/api/sessions — ${err.message}`);
  }
}

async function testAppCron() {
  console.log('\n[App /api/cron]');
  try {
    const url = `${APP_URL}/api/cron?gatewayUrl=${encodeURIComponent(GATEWAY_URL)}&gatewayToken=${encodeURIComponent(GATEWAY_TOKEN)}`;
    const data = await fetchJson(url);
    assert(Array.isArray(data.jobs), '/api/cron returns { jobs: [...] }');
  } catch (err) {
    assert(false, `/api/cron — ${err.message}`);
  }
}

async function testAppNotifications() {
  console.log('\n[App /api/notifications]');
  try {
    const url = `${APP_URL}/api/notifications?gatewayUrl=${encodeURIComponent(GATEWAY_URL)}&gatewayToken=${encodeURIComponent(GATEWAY_TOKEN)}`;
    const data = await fetchJson(url);
    assert(Array.isArray(data.notifications), '/api/notifications returns { notifications: [...] }');
  } catch (err) {
    assert(false, `/api/notifications — ${err.message}`);
  }
}

async function main() {
  console.log(`Mission Control — API Smoke Tests`);
  console.log(`Gateway: ${GATEWAY_URL}`);
  console.log(`App:     ${APP_URL}`);
  console.log(`──────────────────────────────`);

  await testGatewayHealth();
  await testGatewaySessions();
  await testAppSessions();
  await testAppCron();
  await testAppNotifications();

  console.log(`\n──────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke test runner error:', err);
  process.exit(1);
});

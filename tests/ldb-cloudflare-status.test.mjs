import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/ldb-cloudflare-status.js';

const env = { CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'test-secret-only' };
async function call(handler, method = 'GET') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; } };
  await handler({ method }, res);
  return res;
}
test('missing configuration does not call provider', async () => {
  const r = await call(createHandler({ env: {}, fetcher: () => assert.fail('network') }));
  assert.equal(r.code, 503);
  assert.equal(r.body.status, 'CONFIGURATION_REQUIRED');
});
test('catalog connection uses GET only and does not claim production or free quota', async () => {
  const h = createHandler({ env, fetcher: async (url, options) => {
    assert.match(url, /^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/[a-f0-9]{32}\/ai\/models\/search\?/);
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer test-secret-only');
    return { ok: true, json: async () => ({ success: true, result: [{ name: 'model' }] }) };
  } });
  const r = await call(h);
  assert.equal(r.body.status, 'CONNECTED');
  for (const flag of ['inferenceTested', 'freePlanVerified', 'autoProductionReady']) assert.equal(r.body[flag], false);
  assert.ok(!JSON.stringify(r.body).includes(env.CLOUDFLARE_API_TOKEN));
  assert.ok(!JSON.stringify(r.body).includes(env.CLOUDFLARE_ACCOUNT_ID));
});
test('POST cannot trigger inference or a probe', async () => {
  const r = await call(createHandler({ env, fetcher: () => assert.fail('network') }), 'POST');
  assert.equal(r.code, 405);
});
test('simultaneous and repeated probes share cached result, then refresh', async () => {
  let calls = 0, clock = 0;
  const h = createHandler({ env, now: () => clock, fetcher: async () => {
    calls++; return { ok: true, json: async () => ({ success: true, result: [] }) };
  } });
  await Promise.all(Array.from({ length: 10 }, () => call(h)));
  assert.equal(calls, 1);
  clock = 300001;
  await call(h);
  assert.equal(calls, 2);
});
test('authorization and rate-limit responses expose no provider body', async () => {
  for (const [status, expected] of [[401, 'AUTHORIZATION_FAILED'], [403, 'AUTHORIZATION_FAILED'], [429, 'RATE_LIMITED'], [500, 'PROVIDER_UNAVAILABLE']]) {
    const r = await call(createHandler({ env, fetcher: async () => ({ ok: false, status, json: () => assert.fail('must not read error body') }) }));
    assert.equal(r.body.status, expected);
    assert.equal(r.code, 503);
  }
});
test('malformed success and network exceptions fail closed', async () => {
  for (const fetcher of [async () => ({ ok: true, json: async () => ({ success: true, result: 'bad' }) }),
    async () => { throw Error(env.CLOUDFLARE_API_TOKEN); }]) {
    const r = await call(createHandler({ env, fetcher }));
    assert.equal(r.code, 503);
    assert.equal(r.body.ok, false);
    assert.ok(!JSON.stringify(r.body).includes(env.CLOUDFLARE_API_TOKEN));
  }
});

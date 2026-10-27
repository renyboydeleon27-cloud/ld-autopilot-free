// Read-only connectivity probe. Never runs inference or returns credentials.
export function createHandler({ env = process.env, fetcher = globalThis.fetch, now = Date.now } = {}) {
  let cached;
  let pending;

  async function probe() {
    const account = env.CLOUDFLARE_ACCOUNT_ID || '';
    const token = env.CLOUDFLARE_API_TOKEN || '';
    const base = { provider: 'cloudflare-workers-ai', inferenceTested: false,
      freePlanVerified: false, autoProductionReady: false };
    if (!/^[a-f0-9]{32}$/i.test(account) || !token || /\s/.test(token)) {
      return { code: 503, body: { ...base, ok: false, status: 'CONFIGURATION_REQUIRED' } };
    }
    try {
      const response = await fetcher(
        `https://api.cloudflare.com/client/v4/accounts/${account}/ai/models/search?per_page=100`,
        { method: 'GET', redirect: 'error',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        const status = [401, 403].includes(response.status) ? 'AUTHORIZATION_FAILED'
          : response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE';
        return { code: 503, body: { ...base, ok: false, status } };
      }
      const data = await response.json();
      if (data?.success !== true || !Array.isArray(data.result)) {
        return { code: 503, body: { ...base, ok: false, status: 'INVALID_PROVIDER_RESPONSE' } };
      }
      return { code: 200, body: { ...base, ok: true, status: 'CONNECTED',
        catalogEntries: data.result.length, checkedAt: new Date(now()).toISOString() } };
    } catch {
      // Provider error bodies may contain private details. Never forward them.
      return { code: 503, body: { ...base, ok: false, status: 'PROVIDER_UNAVAILABLE' } };
    }
  }

  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, status: 'METHOD_NOT_ALLOWED' });
    }
    if (!cached || now() >= cached.until) {
      // Collapse simultaneous probes in this instance; bound provider traffic.
      if (!pending) pending = probe().then(result => {
        cached = { ...result, until: now() + (result.code === 200 ? 300000 : 30000) };
      }).finally(() => { pending = undefined; });
      await pending;
    }
    return res.status(cached.code).json(cached.body);
  };
}

export default createHandler();

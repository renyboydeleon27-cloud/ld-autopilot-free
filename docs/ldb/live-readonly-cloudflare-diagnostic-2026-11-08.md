# Read-only Cloudflare provider diagnostic — preview-only

## Goal
Unblock a genuine (non-inference) account telemetry check without asking the
owner to copy API tokens into a browser, GitHub issue, or ChatGPT.
The Vercel preview branch already has private CLOUDFLARE_ACCOUNT_ID and
CLOUDFLARE_API_TOKEN environment variables. This change does NOT expose them.

## Preview endpoint
GET /api/ldb-cloudflare-readiness

Only responds when VERCEL_ENV=preview and VERCEL_GIT_COMMIT_REF is exactly
feature/ldb-image-acceptance. The Vercel project enables Vercel Authentication
for preview deployment URLs. No query params or non-GET requests are accepted.
The endpoint returns sanitized status only, with no provider response bodies
or credentials. CORS is disabled and all responses are non-cacheable.

Backend invokes three **read-only** Cloudflare account metadata queries at
most: GET Workers script list, GraphQL schema introspection, and a narrowly
scoped account/date usage query when the expected metric is present.
Cloudflare's GraphQL API uses POST for read-only queries; no mutation,
Workers AI inference, Worker deployment, billing changes, Drive or Gmail
operations occur. When account scope or metrics are unavailable, it fails
closed, reporting NO_GO without fabricating usage.

Even a successful telemetry result is not independent proof of the Free
billing plan or quota available to a future render. The owner must still
verify account plan/current billing, choose a Free-eligible model, and
approve one isolated HOOK V5 render; 17 actual images and all 69 Drive and
Gmail delivery checks remain required before production acceptance.

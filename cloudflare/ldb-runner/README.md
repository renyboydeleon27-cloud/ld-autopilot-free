# LDB durable image runner — deployment candidate

This is a new Cloudflare SQLite Durable Object runner in the NER Studio repository.
It is NOT deployed, connected to the app UI, or a replacement for the existing Python
Drive/Gmail prototype. RUNNER_ENABLED and FREE_PLAN_CONFIRMED default to false.

## Verified image milestone (2026-10-28)

- Cloudflare model: @cf/black-forest-labs/flux-2-klein-4b, fixed four steps.
- Real response decoded successfully: 576 × 1024 JPEG, 431900 bytes.
- SHA-256: 55df65358ab5ccc02fb33820466dd557dcdb4d3d6900be3498bc84755edfc271
- Vercel deployment: dpl_4jJhyhcqbSWx5R63mCWep1Ps8MGV (READY).
- Main commit: e2cedbbae34d574216b97665115542ac4e98d24d.
- Sample: https://ld-autopilot-free.vercel.app/assets/ldb-cloudflare-portrait-smoke/sample.jpg
- Visual inspection: portrait illustrated scene, no visible text/marking; exact historical
  architecture not independently verified. RGB differences up to 7 mean strict grayscale
  is not yet guaranteed. This is an integration sample, not an approved episode panel.

## What this candidate provides

A singleton Durable Object, persistent scene claims and image chunks, alarm-driven
sequential processing, STOP/resume between scenes, request authentication, approval hash
verification, 40-attempt/day cap, and fail-closed handling of ambiguous inference.
The runner retains a single episode and refuses a different one until delivery/archive
is implemented. It intentionally has no delete, overwrite, or automatic cleanup endpoint.
Images are stored in <=64 KB chunks and checkpointed atomically with scene completion.
IMAGES_READY does not mean verified Drive delivery or production completion.

## Deployment prerequisites

Existing token has Workers AI Read/Edit only; add account-scoped Workers Scripts Edit
for deployment. Keep Workers Free and do not activate paid billing or paid fallback.
Wrangler setup may also request Account Settings Read for account discovery. Scope any
permission to account a437dda5f38ba6b10991684b8388760b only.

Use secure provider/CLI secret input, never chat, source control, or build logs:
- CLOUDFLARE_API_TOKEN: runtime Workers AI token.
- RUNNER_SECRET: independent random secret of at least 32 characters, server-only.

Use a separately scoped deployment credential when practical. Deploy wrangler.jsonc
with SQLite-backed Durable Objects. Keep the feature disabled until Cloudflare runtime
validation, image color normalization, Google OAuth, delivery, and app authentication
are ready. Do not place RUNNER_SECRET in mobile HTML or localStorage.

## Not yet implemented or verified

- Real Cloudflare Durable Object runtime tests and deployment.
- User/session authentication in the NER app and offline outbox synchronization.
- A secure Google OAuth callback, refresh-token vault, and account ownership checks.
- Drive file ID preallocation, checksum verification and idempotent recovery.
- Gmail milestones (sender renyboydeleon27@gmail.com, recipient dkael1250@gmail.com).
- Strict grayscale normalization for story panels; thumbnail keeps full color.
- Visual/historical audit, episode archival, and full 17-scene acceptance trial.

The Vercel project currently has only CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN,
and OPENAI_API_KEY configured. No Google OAuth or durable runner configuration exists.
OPENAI_API_KEY is never read by these new modules.

## Validation

node --test tests/ldb-durable-checkpoints.test.mjs tests/ldb-cloudflare-image.test.mjs tests/ldb-cloudflare-status.test.mjs

17 local unit tests pass. Durable storage tests use a serialized storage double and are
not proof of Cloudflare runtime behavior, CPU budget, or restart delivery guarantees.
Cloudflare alarms are at-least-once; an unresolved RENDERING claim pauses for review
instead of silently consuming quota twice. The image provider has no automatic retries.

Official references:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/changelog/post/2026-01-15-flux-2-klein-4b-workers-ai/
- https://developers.cloudflare.com/durable-objects/api/alarms/
- https://developers.cloudflare.com/workers/platform/pricing/

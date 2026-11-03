# Private Google Drive delivery bridge (development only)

Implementation date: November 2, 2026. The bridge uses a Cloudflare Worker service binding from the image runner to the Google credential vault. Google OAuth access and refresh tokens stay in the vault. Only the backend coordinator can call the runner-side bridge; the vault has a second secret-checked narrow /internal/drive/put and /internal/drive/capacity transport. All image/text payloads are bounded to 8,000,000 bytes and SHA-256 checked at both ends. The Drive adapter reconciles pre-generated IDs and verifies actual uploaded content. No general Gmail, OAuth token export, browser quality flag or percentage endpoint is added.

Both wrangler.jsonc configurations set DELIVERY_BRIDGE_ENABLED=false. The runner adds a GOOGLE_VAULT service binding to the existing ner-ldb-google-vault-quality script. Provision a distinct GOOGLE_DELIVERY_BRIDGE_SECRET (at least 32 unpredictable characters) directly in BOTH Workers using Cloudflare secrets; never store it in Git, chat, browser or logs. Before even considering enablement, confirm deployed vault availability, owner consent, authenticated service-binding behavior, correct Worker names, and no added paid API usage. Enable flags only in isolated development and keep RUNNER_ENABLED and VAULT_ENABLED under operator control.

Delivery remains blocked without a trusted 69-asset plan in the runner's Durable Object storage, a complete 17-image persisted job and a human visual PASS audit. The runner alarm only rehydrates an existing trusted checkpoint; it does NOT invent one or accept browser-submitted approval. It is still NOT full production readiness, and does not initiate any Google Flow video generation. No episode upload or Gmail milestone is claimed by this change.

Test: node --test tests/ldb-google-delivery-bridge.test.mjs (5 offline tests). The existing 69-asset STOP/resume/recovery tests still need GitHub CI review. Live service-binding + real Drive episode tests are pending and must be explicitly validated before production rollout. Existing app files, local InShot media and Google Drive assets are untouched.

## Production-wide STOP / Resume fix — November 2, 2026
A safety gap existed: POST /stop only stopped image checkpoints, allowing Drive delivery after IMAGES_READY. New owner-only controls atomically persist STOP across image and delivery states and cancel alarms. In-flight uploads are allowed to finish their current asset only, with no next asset. The alarm handler checks job.stop before advancing. Resume requires an enabled private delivery connector, a trusted 69-file audited plan, and a resumable checkpoint; unresolved in-flight uploads cannot be resumed. No new public approval, upload, email or token endpoint is added. Five targeted offline regression tests accompany the fix. Live deployment is unchanged and full provider acceptance remains pending.

## Safe Cloudflare Worker-to-Worker probe (2026-11-02)
A read-only authenticated probe was added to verify the exact service binding without permitting Google Drive uploads, Gmail sends, image generation or OAuth token refresh. Both Workers retain `DELIVERY_BRIDGE_ENABLED=false` and now also default `BRIDGE_PROBE_ENABLED=false`. Provision a UNIQUE 32+ character `GOOGLE_BRIDGE_PROBE_SECRET` in both Workers, separate from the actual delivery secret. The vault must already be properly provisioned and enabled for actual Google Drive delivery; the read-only binding probe has no OAuth dependency. In an isolated dev deployment set only `BRIDGE_PROBE_ENABLED=true` on both Workers and supply `RUNNER_SECRET` to the runner. A signed-in/owner-controlled GET `/delivery-bridge-probe` can then return `BRIDGE_AUTHENTICATED` while `RUNNER_ENABLED=false` and `DELIVERY_BRIDGE_ENABLED=false`. Do not expose the owner runner secret to the website or public JavaScript. A 200 response proves only the internal binding and authentication; it does **not** prove Drive, Gmail, visual image quality, or final production. Offline fake service-binding tests are not a live Cloudflare acceptance. No production deployment was performed by adding this code.


## 69-asset cross-worker transport regression
`tests/ldb-private-bridge-69-offline.test.mjs` joins the actual `ProductionDelivery` coordinator with the private client `createGoogleDeliveryBridge` and vault receiver `handleVaultDeliveryBridge` using a fake in-memory Drive. It tests all 69 text/image manifest entries and 10 required folders across reconstructed coordinator instances, STOP/Resume, failed checksum gating, and transient bridge failure. It never uses real image inference, Google OAuth, Google Drive or Gmail. It provides stronger offline integration evidence but DOES NOT prove the real Cloudflare service binding or user Drive account works. Keep all worker delivery flags disabled until live independent acceptance.


## Wrangler compile gate — November 2, 2026

GitHub Actions workflow `LDB Cloudflare offline compile gate` builds both Worker bundles with `wrangler deploy --dry-run` and checks that all production toggles remain OFF. It uses no Cloudflare credentials, does not deploy, send Gmail, upload to Google Drive, or generate images. It verifies the required Durable Object bindings and migrations and the private service-binding name. The runner and vault already have matching Cloudflare account IDs.

This only proves that both Workers can be compiled and configured safely. It does not verify a live Cloudflare service binding or any production assets. Never enable `RUNNER_ENABLED`, `VAULT_ENABLED`, `DELIVERY_BRIDGE_ENABLED`, or `FREE_PLAN_CONFIRMED` to make this check pass; the safety gate explicitly rejects enabled flags.

## Read-only probe without Google Vault credentials — November 3, 2026

Fixed a previously hidden live-test blocker: the Vault Worker initially required `VAULT_ENABLED=true`, `VAULT_SECRET`, and `VAULT_KEY` before even considering `/internal/bridge/health`. This meant a zero-Google-access probe could not run with production toggles OFF. The Vault edge now routes only that single authenticated path before the vault credential gate, directly to the independent probe handler. The probe never initializes the Durable Object, touches Google OAuth, accesses Drive/Gmail, or enables render. It still requires `BRIDGE_PROBE_ENABLED=true` on both Workers plus the separately provisioned `GOOGLE_BRIDGE_PROBE_SECRET` on both Workers and `RUNNER_SECRET` for the caller. Everything else remains OFF. This verifies only service-binding transport and the read-only secret, not real image production or Drive delivery. GitHub integration tests exercise disabled vault credentials, wrong secrets, POST refusal, and unknown-path refusal.


## Isolated Cloudflare binding probe (2026-11-03; NOT DEPLOYED)

The new `wrangler.probe.jsonc` configurations target **separate** Workers named `ner-ldb-vault-binding-probe` and `ner-ldb-runner-binding-probe`. They do not overwrite the existing quality Workers. The vault has no public workers.dev URL. Both allow only `BRIDGE_PROBE_ENABLED=true`; image rendering, Drive, Vault OAuth, and FREE_PLAN_CONFIRMED remain OFF. A GitHub Actions offline compile gate checks all four Worker bundles and refuses dangerous settings.

Before any actual deployment, an operator must confirm Cloudflare plan limits and authorize a test deployment in their own Cloudflare account. In a trusted local checkout of the development branch, use Wrangler dry runs:

```bash
node scripts/ldb-cloudflare-isolated-probe-gate.mjs
npx --yes wrangler@4 deploy --dry-run --config cloudflare/ldb-google-vault/wrangler.probe.jsonc
npx --yes wrangler@4 deploy --dry-run --config cloudflare/ldb-runner/wrangler.probe.jsonc
```

To actually deploy the isolated probes (requires operator login and approval; not done by CI), deploy Vault then Runner:

```bash
npx --yes wrangler@4 login
npx --yes wrangler@4 deploy --config cloudflare/ldb-google-vault/wrangler.probe.jsonc
npx --yes wrangler@4 deploy --config cloudflare/ldb-runner/wrangler.probe.jsonc
npx --yes wrangler@4 secret put GOOGLE_BRIDGE_PROBE_SECRET --config cloudflare/ldb-google-vault/wrangler.probe.jsonc
npx --yes wrangler@4 secret put GOOGLE_BRIDGE_PROBE_SECRET --config cloudflare/ldb-runner/wrangler.probe.jsonc
npx --yes wrangler@4 secret put RUNNER_SECRET --config cloudflare/ldb-runner/wrangler.probe.jsonc
```

Use the **same new 32+ character random** `GOOGLE_BRIDGE_PROBE_SECRET` in both isolated Workers and a **different new** 32+ character `RUNNER_SECRET` in Runner. Enter them only through the secret prompts; never publish them in GitHub, chats, screenshots or logs. On a trusted machine, export `LDB_PROBE_URL` (the actual Runner HTTPS workers.dev URL ending in `/delivery-bridge-probe`) and `LDB_RUNNER_SECRET` (same Runner secret) into the local process environment; do **not** pass secrets as command arguments. Then run `node scripts/ldb-live-binding-probe.mjs`. It only sends GET and refuses redirects, unsafe URLs and unexpected responses. A PASS proves **only** private Worker binding and authentication, not production or Drive delivery.

Cloudflare details: https://developers.cloudflare.com/workers/wrangler/commands/workers/ and https://developers.cloudflare.com/workers/configuration/secrets/ .

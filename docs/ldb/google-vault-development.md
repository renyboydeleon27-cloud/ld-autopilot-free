# Google vault and recovered reference milestone

Development only. No production merge, vault deployment, real Google authorization,
Drive upload, or Gmail message is claimed by this milestone.

## Implemented

- Google start requires vault configuration, PKCE and an encrypted HttpOnly state
  cookie. The callback rejects malformed/expired state before network access.
- Callback claims the state once in durable storage before token exchange. The
  vault retains a bounded set of 24 unexpired claims, each at most ten minutes.
- Google userinfo must return the exact configured sender with a verified email.
  Both `drive.file` and `gmail.send` must be granted. Neither access nor refresh
  tokens enter browser cookies, responses, source control or application logs.
- Dedicated Cloudflare SQLite Durable Object encrypts refresh credentials with
  AES-256-GCM and owner-bound authenticated data. Internal refresh provider caches
  access tokens only in memory, coalesces concurrent refreshes, sanitizes errors,
  and marks invalid_grant as reconnect-required. No HTTP token-export route exists.
- Vault worker is disabled by default and separately authenticated. Its only
  routes are authenticated status, one-time claim and credential save. The worker
  has not been deployed or validated against Cloudflare in this milestone.
- Reference importer fully decodes PNG/JPEG, checks portrait dimensions, rejects
  duplicate images, copies original bytes into a new directory and verifies SHA256.
  It never promotes a recovered image to visually approved or delivery-ready.

## Setup still required

Vercel server-only configuration: `LDB_GOOGLE_CLIENT_ID`,
`LDB_GOOGLE_CLIENT_SECRET`, `LDB_GOOGLE_COOKIE_KEY` (random 32-byte hex),
`LDB_GOOGLE_VAULT_URL` (exact HTTPS workers.dev origin) and
`LDB_GOOGLE_VAULT_SECRET` (random, at least 32 characters).

Vault secrets: `VAULT_KEY` (independent random 32-byte hex), `VAULT_SECRET`
(matching the Vercel vault secret), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
Keep `VAULT_ENABLED=false` until provisioning and authenticated route tests pass.
Keys must be stored directly in provider secret settings, never in chat or Git.
Do not rotate VAULT_KEY without a tested re-encryption/reconnect procedure.

The callback remains pinned to the already registered production callback. A
preview integration test requires a separately registered exact preview callback
and an explicit code/config change; it must not silently redirect into production.
No production deployment is authorized merely by these offline tests passing.

Next: test deployed vault with synthetic credentials, configure real credentials
through provider settings, complete owner consent, then implement delivery inside
the trusted backend. Durable upload identities, checksum verification, retry
bounds and Gmail milestone claims still need integration and live acceptance.
No paid service is enabled by the code or test workflow.

## Evidence

Local: 23 Python and 37 Node tests passed (60 total).
New tests cover tampered ciphertext, wrong owner, missing scope, replay, bounded
claim storage, refresh coalescing, invalid_grant and sanitized network failure.
Existing approval, prompt, image-provider and STOP/resume tests still pass.
Cloud and Google behavior is not proven by mocked offline tests.

22 recovered Library images fully decoded at 941x1672. A separate review ZIP
contains 17 candidate scene-mapped original images plus complete prompts and
narration. All image copies retain identical SHA256 values. Mapping/visual review
is pending: alternate HOOKs exist, the color thumbnail contains title text, and
fog-like depictions require care because CO2 itself is invisible. No recovered
images, private Library identifiers, or credentials are committed to GitHub.
The review ZIP is neither an automatic-render acceptance result nor a verified
Drive delivery. No originals or Android local project data were changed.

# Lake Nyos production-quality development — 2026-10-29

This branch is based on `feature/ldb-auto-studio-ui` at
`4b4893582503f3a52f6d33ffe7ab3f817398d034`. Do not merge or promote it until
cloud acceptance passes. No frontend, localStorage, service worker or PWA
navigation changes are included.

## Verified scope

The packager exports 17 image prompts, 16 Flow prompts including ENDING,
and 16 nonempty English narration files for the existing Lake Nyos submission.
Its authored expansion is bound to the original storyboard SHA-256, not a title
match. Original approved bytes are retained. Every Flow shot has 0–2s, 2–6s and
6–10s stages, one primary action and SFX-only directions. Narration estimates
are 7.2–9.2 seconds at 150 words/minute; no audio has been synthesized or timed.
Characters and actions are representative dramatizations, not witness testimony.
Sources are included in the audit. No image reference is embedded in the source bundle.

Run:

```
python -m pip install Pillow==12.3.0
python -m unittest discover -s tests -p 'test_ldb*py' -v
node --test tests/ldb-approved-render-job.test.mjs tests/ldb-cloudflare-image.test.mjs tests/ldb-durable-checkpoints.test.mjs tests/ldb-google-oauth.test.cjs tests/ldb-auto-studio-ui.test.cjs
python -m scripts.ldb_free_packager --bundle ldb-submissions/lake-nyos-1986-test/approved_bundle.json /tmp/new-ldb-package
```

The existing GitHub workflow runs the tests and packages the bundle on this
branch. It does not render images, call Google, deploy, or send email.
`render_job.json` is input for the authenticated server runner; it contains no secrets.

## Image backend candidate, disabled

The Durable Object runner and fixed-model Cloudflare adapter are carried forward
from the earlier runner work. This branch adds strict expanded-job validation,
ENDING Flow validation and authenticated checksum-verified raw-image download.
A separate `ner-ldb-runner-quality` script name prevents accidental replacement
of the previously deployed disabled runner. Both enable flags default to false.
Isolated HOOK-only Cloudflare test workers and static Vercel previews were subsequently deployed. Production Vercel remains unchanged. See hook-cloud-acceptance.json for the live test results.

API (server-to-server bearer authentication; never embed RUNNER_SECRET in HTML):

- POST /jobs with render_job.json
- GET /status
- POST /stop, POST /resume
- GET /images/HOOK (or another canonical scene ID): raw, visually unverified output

Approval files alone are not authentication. A trusted server must authenticate
the user before forwarding a job. This owner-facing gateway is not implemented.

SQLite-backed Durable Object checkpoints and chunks are persistent cloud storage;
unit tests use a serialized in-memory storage double. HOOK-only live alarm/checkpoint tests now also passed, as recorded in hook-cloud-acceptance.json.
One job is retained; starting a different job is blocked until an archival/delivery
lifecycle is implemented. Ambiguous inference failure is held for review rather
than automatically billed again. STOP lets an in-flight render finish and preserves it.

## Free allocation audit

Official pricing checked 2026-10-29:
https://developers.cloudflare.com/workers-ai/platform/pricing/

Workers Free includes 10,000 neurons/day; exhaustion fails until reset at
00:00 UTC. No Paid plan or AI Gateway credits are enabled here.
`@cf/black-forest-labs/flux-2-klein-4b` is listed at 26.05 neurons per output
512x512 tile. Budgeting 576x1024 conservatively as four tiles gives 104.2
neurons/render, or 1,771.4 for 17 first attempts. This is an estimate, not a
live balance check; other apps can consume account quota. The runner additionally
caps attempts at 40/day. Quality and reference-image identity are not guaranteed
by a free allocation. No OpenAI fallback exists in this path.

`ldb_image_quality.py` fully decodes real PNG/JPEG inputs and saves normalized
PNG copies to a NEW directory. Story frames become exact neutral grayscale;
THUMBNAIL retains color. Corrupt, square, nearly blank or grayscale thumbnail
inputs are rejected. SHA-256 and Drive-compatible MD5 are recorded. Originals
are read-only. Anatomy, history, continuity and unwanted-text checks stay PENDING.
This normalization utility is not yet connected to a deployed background pipeline.

## Observed blockers and remaining acceptance work

Vercel environment metadata inspected: only CLOUDFLARE_ACCOUNT_ID,
CLOUDFLARE_API_TOKEN and OPENAI_API_KEY exist. Secret values were not read.
Google client ID/secret, OAuth state key and encrypted credential-store integration
are missing. Existing callback explicitly discards returned tokens (test-only).
Do not mark Google connected because the APIs have been enabled in the console.

Remaining: owner authentication; provisioned disabled staging runtime credentials;
secure OAuth vault and consent; token refresh; Drive file IDs reserved before
upload plus checksum reconciliation/retries; durable Gmail milestone claims;
UI STOP/resume wiring; reference identity and visual QA; final 17-image trial with
app closed and verified Drive/Gmail. An HTTP timeout after Gmail submission is
ambiguous: it must not trigger blind re-sending. No 100% message until delivery
checksums have passed. The 17 conversation-approved reference images are not
available in this repo and must not be represented by generated placeholders.

This is PROMPTS_ONLY plus tested backend components, not completed AUTO production.

## Live HOOK acceptance update

Native Workers AI binding produced real JPEGs and the live STOP/resume, authentication, persistent checkpoint and download checksum checks passed. Two isolated one-image native trials are halted at TEST_PAUSED; the earlier REST trial remains held at NEEDS_REVIEW. No automatic inference retries occurred. Runtime control secrets were removed after each trial; the native workers never received a Cloudflare API token. Vercel Cloudflare credentials were temporarily restricted to the reviewed test branch for each preview build, then restored to production-only. Production alias still points at main commit e86ab41.

Visual quality is REJECTED: even the improved HOOK still shows an illuminated lantern. Do not deliver it as an approved final asset. Raw images require exact grayscale normalization; the offline normalization check passed but is not yet wired to cloud delivery. The reference images approved in chat must be compared before claiming continuity. Full episode generation, owner UI, Google vault, Drive and Gmail remain incomplete.

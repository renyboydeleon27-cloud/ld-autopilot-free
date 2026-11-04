# Isolated Cloudflare binding acceptance — 2026-11-04

The existing read-only service-binding route passed a real Cloudflare deployment test. This is not image-production or delivery acceptance.

## Evidence

- Source commit: 850770dc73ceb1870d936510fab3da08d8d50973
- Parent development commit: b0c89b29d285ea712cd44222d126ce888929f865
- Vercel diagnostic build: dpl_J36gDpPg1az3uxF3Dh8QSWaW8CMN
- [Sanitized live result](https://ld-autopilot-free-4bjip0pmn-renyboydeleon-5731.vercel.app/binding-probe.json)
- Worker names: ner-ldb-vault-binding-probe and ner-ldb-runner-binding-probe
- Status: BRIDGE_AUTHENTICATED; productionReady: false

## Verified behavior

The runner authenticated to the vault through its Cloudflare service binding. Requests without a secret or with a wrong secret returned 401; authenticated POST to the read-only probe returned 405. POST /jobs returned 503 even with the valid runner secret. Live settings matched all disabled production flags. The probe vault's workers.dev access was disabled. No Google credentials, AI token, or delivery secret was provisioned.

Both Workers remain deployed but their temporary probe secrets were deleted after the test (cleanupComplete: true). A new authorized test requires fresh secrets; rerunning the deployment script intentionally refuses existing Worker names.

Local verification: 16 tests passed in ldb-isolated-probe-config.test.mjs and ldb-google-delivery-bridge.test.mjs. The deployment script passed Node syntax validation and resolved both complete module graphs before upload.

The Cloudflare API credentials were temporarily scoped to this dedicated Preview branch for the diagnostic build, then restored to their original Production-only scope. The stable app Preview alias still points to dpl_6G176AN2qaPbzNDajZqSrFPecJnc. No production merge or alias promotion occurred. No paid plan or API was activated; this test did not audit the billing ledger.

## Remaining acceptance

Actual 17-image generation and visual quality, complete 69-file delivery, real milestone emails, and background STOP/resume remain unverified by this test. Earlier Google connection acceptance is a separate milestone and is not invalidated by these results.

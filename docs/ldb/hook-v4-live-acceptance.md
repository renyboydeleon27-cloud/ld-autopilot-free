# HOOK v4 live acceptance — 2026-11-04

The isolated cloud execution passed; the image is **not accepted for production**.

## Evidence
- Deployment: https://ld-autopilot-free-oa6sgvyda-renyboydeleon-5731.vercel.app
- Worker: ner-ldb-runner-quality-v4
- Model: @cf/black-forest-labs/flux-2-klein-4b
- Actual JPEG: 576×1024, 368754 bytes, SHA-256 0932a8a4e7cfed7c7babd8b354b7facc29debf294d041ef69cb864697a4e1c46
- Source commit: f23527311ec6e20ee26c7f7c9d3a3aa874ed8a37
- Storyboard approval hash remains 75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05.
- User screenshot on November 4 confirms Workers Free Active; earlier screenshot shows 0/10k neurons. This establishes pre-test plan evidence, not measured post-test usage or cost.

## Live checks passed
Unauthenticated requests blocked; STOP before rendering; resume starts rendering; one image persisted and downloaded with matching checksum. Job paused at 1/17 scenes. Runtime runner credential removed after test. No full production, Drive delivery, or Gmail milestone was triggered.

## Visual review
Lantern is unlit, artwork has anime outlines, portrait dimensions are correct, and no text or watermark is observed. Exact neutral RGB failed: maximum channel spread 7; 56.0543% of pixels have unequal RGB channels. Moon is visible although diagnostic direction requested illumination from outside the frame. Shoulder contact is not clearly depicted. Lantern grip needs further review. Historical accuracy and consistency with approved references remain unverified.

The test report's original visualAudit=PENDING is retained as immutable execution evidence; this separate review does not grant acceptance.

## Remaining release gates
Resolve strict B/W and composition checks, compare approved references, render and audit all 17 scenes within free quota, run the real 69-deliverable Drive/Gmail acceptance and live recovery tests. PR62's delivery-count fix is separate and not included in this deployment. Do not merge production based on this smoke test.

Cloud execution passing is not a completed episode. No production percentage is asserted.


## November 4 — HOOK V5 grayscale preparation (development only)
The cloud trial proved a real JPEG and valid checkpoint, but the source failed exact neutral RGB. This update adds a **separate, local review-only** Python tool (`scripts/ldb_hook_bw_audit.py`) that fully decodes a 576×1024 JPEG/PNG, reports unequal RGB-channel pixel counts, and writes a new lossless RGB PNG where every pixel satisfies R=G=B. The original rendered JPEG is never modified and both SHA-256 digests are recorded. The generated PNG is explicitly `GRAYSCALE_CANDIDATE_ONLY`: composition, historical accuracy, hands, moon framing and original reference continuity are still unverified and `productionDeliveryAllowed=false`. The tool never updates worker checkpoints or triggers inference/Drive/Gmail. Usage after obtaining the genuine HOOK image under an authorized secure workflow:

```bash
python -m scripts.ldb_hook_bw_audit --input ./HOOK.jpg --output-dir ./hook-review-only
```

A separate offline `scripts/ldb-prepare-hook-v5.mjs` rewords the HOOK diagnostic to prohibit a visible moon, clearly require shoulder contact and believable lantern grip, and request exact neutral R=G=B colors without altering the original storyboard approval hash or the other 16 scenes. It DOES NOT run inference; a new provider trial still requires current Free plan and quota evidence and explicit test authorization. Python and Node offline tests cover color correction, checksums, invalid input, no auto-approval, and approval-hash preservation.

### HOOK V5 real-package prompt-length regression (November 4, 2026)
The first V5 composition lock was about 760 characters and was found to exceed the provider's strict 2,048-character image_prompt limit when appended to the actual Lake Nyos package (approximately 2,264 characters). The new lock focuses only on visible shoulder contact, five-finger load-bearing lantern grip, an unlit lantern, moon outside the frame, and neutral R=G=B, reducing the extra text to approximately 494 characters while leaving the original storyboard and reference notes untouched. An additional automated Node test now runs the **real Python packager**, reads the actual approved HOOK prompt, applies V5, checks <=2048 and all 16 other scenes unchanged. This is an OFFLINE repair: no Cloudflare inference attempted, and no visual-acceptance claim.


### HOOK V5 isolated live entrypoint (November 4, 2026 — not executed)
The next one-image diagnostic is now wired to `scripts/ldb-run-hook-v5.mjs`, which invokes the free prompt packager, the approved-hash-preserving V5 composition fix and finally the one-image cloud test with `--hook-v5`. The cloud test uses **only** `ner-ldb-runner-quality-v5`; it refuses existing test Workers and rejects any name outside the V4/V5 allowlist. V5 refuses a missing/old V5 prompt before calling the Cloudflare API. It still requires `VERCEL_ENV=preview`, the explicit `--one-approved-hook-free-only` flag and same-day operator-verified `LDB_WORKERS_PLAN=free` / `LDB_FREE_PLAN_VERIFIED_DATE`. These declarations are not themselves billing proof: the operator must independently check the live Cloudflare dashboard/usage before starting. Production, V4 evidence, the 16 other images, real Drive and Gmail remain untouched. This commit does not deploy or run inference.


### Additional V5 direct CLI isolation guard (November 4, 2026)
The low-level `scripts/ldb-hook-cloud-test.mjs --hook-v5` entrypoint now checks the **same Preview environment and exact development Git branch** as the high-level V5 wrapper, before any provider call. It refuses Production, unrelated Preview branches and local direct execution. Normal V4 diagnostic behavior is unchanged. This prevents bypassing the V5 preview guard by calling the lower-level script directly. On the actual Vercel project, the Cloudflare account ID/API token are Production-scoped, not available to Preview deployments; no test inference was initiated and no production environment variables were copied to Preview. Current Free-plan and usage verification remain a separate required operator gate.


### Automatic non-approving HOOK V5 grayscale preview — November 4, 2026
The V5-only test runner now checks whether Pillow is available **before** any Cloudflare deployment or image inference. After a successful authorized HOOK V5 render, it runs the existing offline exact-grayscale processor on the saved image, preserving original bytes and SHA-256. The optional `--preview-compare` mode creates an isolated `review-only/index.html` with original versus neutral RGB PNG side by side, a checksum/pixel report, and prominent `NOT APPROVED` labels. The top-level HOOK preview gains a link to this comparison. All outputs are still review candidates; anatomy, continuity, historic accuracy and actual approval remain manual. This patch neither renders an image nor enables Drive/Gmail or paid usage.

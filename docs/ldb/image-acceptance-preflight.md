# Image acceptance preflight — 2026-11-04

## Completed
- Read-only account preflight on Vercel: https://ld-autopilot-free-8tplj82qn-renyboydeleon-5731.vercel.app/image-preflight.json
- Workers settings HTTP 200, default_usage_model standard. This field is not accepted as proof of a Free subscription.
- Subscription lookup HTTP 403 with the existing API token. No permission expansion attempted.
- Browser dashboard shows a sign-in page; no current plan or usage was read.
- No inference request made.
- Fixed the stale four-module upload list in ldb-hook-cloud-test.mjs: it now resolves the current runner's complete static module graph before any remote mutation. Current graph has 17 modules.
- New isolated target ner-ldb-runner-quality-v4; existing quality Workers are refused rather than overwritten.
- Explicit function-level freePlanConfirmed requirement, plus CLI Free-plan/date guard. The date must be verified by an operator; setting a flag does not itself verify billing.
- Delivery and bridge probe flags explicitly disabled for the one-image test.
- Seven tests pass: existing one-job/STOP/resume/checksum/cleanup tests plus unknown-plan and complete/cyclic/invalid module graph tests.

## Pricing evidence and limits
Official pricing checked 2026-11-04:
https://developers.cloudflare.com/workers-ai/platform/pricing/

FLUX.2 klein 4B: 26.05 neurons per output 512x512 tile. Conservative 576x1024 estimate: 4 tiles, 104.2 neurons per image, 1771.4 for 17 first attempts. Free allocation is 10000 neurons/day. These are estimates, not the account's remaining balance. No paid plan or API was enabled.

## Blocker before live inference
Obtain current evidence of Workers Free plan and today's Workers AI usage. Existing token cannot read subscriptions; use the owner's dashboard rather than requesting a stronger API token. Do not infer Free from the standard usage model.

Previous native HOOK generation already proved cloud rendering but failed visual QA (lantern looked lit). Do not reclassify it as approved. The next trial must preserve the original approved storyboard hash and show a visibly extinguished lantern with credible hands, anatomy, 2D anime style and scene continuity. Full 17-image and 69-file acceptance remain pending.

Vercel Cloudflare variables were restored to Production-only immediately after the read-only build was created. No main or production alias changes were made.

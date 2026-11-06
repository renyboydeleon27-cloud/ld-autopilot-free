# Follow-up review — November 6, 2026

Reviewed delivery cardinality/unique Drive IDs, durable milestones, STOP behavior, and the competing HOOK change in PR #63. This is a focused review, not proof of complete production readiness.

## Confirmed defect and fix

Milestone dispatch reused one snapshot across multiple awaited sends. STOP or NEEDS_REVIEW arriving during the 30% email did not prevent the following 50% send. Two regression tests reproduced the defect before the fix. Dispatch now re-reads durable state and verifies the same job and current milestone eligibility before each send. An already in-flight email cannot be recalled.

Validation: all 422 JavaScript tests passed; Runner Wrangler dry-run compilation passed. This is simulated notification coverage, not actual email evidence.

## PR #63 overlap

PR #63, commit eb853ec, implements another solution to the same HOOK length/contradictory-pose defect, based on 09ade8a. It replaces the old generated composition paragraph, whereas #61's 4b09c14 builds one consistent prompt from the approved visual. Both preserve the approval text and other scenes. Do not blindly merge the conflicting implementations. #61's real-packager regression already passes. PR #63 was not merged or closed.

## Official Cloudflare research

Sources checked November 6, 2026:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/
- https://developers.cloudflare.com/changelog/post/2026-01-15-flux-2-klein-4b-workers-ai/

Published allocation: 10,000 Neurons/day; reset at 00:00 UTC (03:00 Saudi Arabia). Paid-plan overages are billed; the Free plan requires an upgrade to exceed its allowance. Certain models require paid billing. The configured flux-2-klein-4b is not in the published paid-only list; pricing lists 26.05 Neurons per output 512x512 tile and 5.37 per input tile. This is public documentation, NOT evidence of this account's active plan, current remaining quota, or model authorization.

No inference should run based only on account-settings HTTP 200 or subscriptions HTTP 403. Obtain authenticated plan/usage evidence or a current dashboard view; leave Free-plan confirmation disabled until verified.

## Current blocker

Read-only Vercel metadata still shows CLOUDFLARE_API_TOKEN only in Production. The acceptance branch has its Account ID but no preview token. The user must enter a secret directly in Vercel for Preview / feature/ldb-image-acceptance. Do not expose or retrieve secret values. The Google credentials remain scoped to the production-quality preview branch.

No new cloud generation, Drive delivery, email, paid activation or production merge was performed by this review.

# Execution Order 4 — protected integration, 2026-11-12

## Reviewed integration

The acceptance head `40fc29a118858d1ff6698b391c1bb4700d35bfa4` is an ancestor of
executor head `89c5532858c74087f0b684216e6ab4377c6f7f53`. The integration is a
fast-forward: no conflict resolution, asset replacement or history rewrite is
needed. The 30-file delta contains executor workflows, safety checks, receipts,
diagnostics, tests and documentation; it does not change approved image files,
V4 evidence or delivery checkpoints.

GitHub reported the acceptance branch unprotected and repository rulesets empty.
This is distinct from the protected `ldb-hook-v5-free` Environment. Its approval
and branch restrictions must remain enabled. PR #66 is not merged into main.
The registered `ldb-free-production.yml` calls the reusable executor by a local
workflow path, so both execute the same selected branch commit.

## Additional coverage

Approval CI now runs all available `tests/*.test.mjs`, `tests/*.test.cjs` and
`test*.py`, including navigation and non-LDB regression coverage. Two subprocess
tests exercise the configuration CLI itself: missing settings exit nonzero,
credential-shaped sentinel values never appear in output, and successful
presence checks still report token scope, inference and render authorization
as unverified/false. These are simulated settings, not real token validation.

## Live diagnostics and acceptance limits

The executor preview at `89c5532` was READY. Its authenticated configuration-only
delivery endpoint returned HTTP 200, six missing Google configuration names,
zero verified Drive files and Gmail milestones, and `productionReady: false`.
It explicitly reported no Cloudflare, Google or Gmail calls.

The browser reached Vercel's login page rather than AUTO STUDIO. Desktop and
Android-sized visual/interactive acceptance therefore remain pending. HTTP
diagnostics and mocked UI tests are not a replacement for browser acceptance.

## Owner-only continuation

In GitHub Environment `ldb-hook-v5-free`, verify these four variables without
sharing credentials:

- `LDB_HOOK_V5_CLOUDFLARE_ACCOUNT_ID`: existing authorized account ID.
- `LDB_WORKERS_PLAN`: `free`, only after confirming the plan.
- `LDB_FREE_PLAN_VERIFIED_DATE`: actual verification day in UTC (`YYYY-MM-DD`).
- `LDB_HOOK_V5_ENV_REVIEW_APPROVED`: `true`, only after owner review.

Existing secret name: `LDB_HOOK_V5_CLOUDFLARE_API_TOKEN`. Presence does not prove
validity or account scope. No token retrieval/replacement is required here.

Use the registered **LDB approved FREE prompt production** workflow, select
`feature/ldb-image-acceptance`, and enter exactly `hook-v5-executor-check` in
`episode_folder`. Review and approve only the configuration-only Environment job.
This sentinel must not be replaced with a render request. Successful configuration
validation is not authorization for inference or evidence of live delivery.

Cloudflare execution remains **OWNER AUTHENTICATION / TOKEN VALIDATION REQUIRED**.
Real image generation, Drive delivery, Gmail milestones and production release
remain unauthorized/pending. No Cloudflare dashboard action is part of this batch.

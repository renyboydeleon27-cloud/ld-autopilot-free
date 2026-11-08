# NER AUTO STUDIO — V5 execution boundary hardening

## Problem
The V5 CLI wrapper checked the exact isolated Vercel preview, operator Free
plan attestation and current UTC day, but the exported hookCloudTest() function
did not enforce these V5-specific constraints. An alternate caller could
supply freePlanConfirmed:true and same-day environment dates and bypass the
preview-only guard before a cloud Worker deployment or paid inference.

## Fix
- assertV5InferenceGate runs INSIDE hookCloudTest before any Cloudflare API,
  module graph parsing, Worker script PUT, POST /jobs or AI inference.
- V5 requires exact preview branch, explicit FREE_PLAN_CONFIRMED:'true',
  LDB_WORKERS_PLAN:'free', both current UTC-day attestations and an actual
  same-session read-only usage report that passes the conservative <=9000
  neuron verification. Mere dates are NOT a quota report.
- Any existing V5 Worker in a verified script listing stops the invocation.
  The existing dedicated reviewer/cleanup flow is still required and does
  not remove any script without a separate explicit authorization.
- The direct HOOK V5 wrapper now refreshes the Cloudflare usage report prior
  to the actual hook-cloud-test CLI, closing the stale-report gap.
- New tests prove the direct function refuses production, other branches,
  Paid/unconfirmed/stale dates, missing/stale/truncated reports and existing
  V5 scripts, *without contacting the provider*. Existing V4 behavior
  remains unchanged.

## Still not cleared
The report and operator labels are not independent proof of Cloudflare
billing status. Last provider subscription diagnostic returned HTTP 403:
the Free plan must still be verified from the dashboard by the owner.
No inference was performed in this batch, no new images approved, and no
Google Drive/Gmail live deliveries were attempted.

# Cloudflare Free-day safety gate (2026-11-08)
Development-only change in PR #61.

New image inference now requires FREE_PLAN_CONFIRMED=true plus both
LDB_FREE_PLAN_VERIFIED_DATE and LDB_FREE_USAGE_VERIFIED_DATE to be the
current UTC date. The owner must independently verify their Workers Free
account and usage before setting these fields. They are only attestations,
not proof of actual billing or current neuron balance.

The Durable Object alarm and image provider check this at run time.
At UTC midnight, stale permissions prevent additional image requests;
a running render is still subject to its persisted watchdog and ambiguity
handling. Owner-authenticated STOP/status and independently approved
delivery-only Resume remain available with Free inference disabled.

Default Worker configuration has the dates unset and generation OFF.
Isolated HOOK diagnostics obtain the usage date from their read-only
preflight. No live render, email, Drive upload, paid service, or production
deployment is authorized by these code changes. Real 17-image visual QA
and full 69-file Drive/Gmail acceptance remain outstanding.

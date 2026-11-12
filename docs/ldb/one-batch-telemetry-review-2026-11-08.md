# One-batch Free-quota telemetry correction — 2026-11-08

Production gate stays closed. This is read-only preflight and owner status code.

## Fixed
- GraphQL zero-group success is treated as actual zero usage **only**
  when schema, account, HTTP, timestamp, query bound and Worker list
  verification are all complete. A missing account or missing groups
  field remains a failure.
- Instead of limit:1 and reading the first group, the usage query requests
  up to 100 groups and sums every numeric total. Exactly 100 returned
  groups is ambiguous (pagination might be truncated), so preflight
  refuses to authorize a render.
- Only an unambiguous total-neuron counter is allowed. A single input or
  output component is not the same as full daily usage.
- Authenticated runner GET /status now includes a sanitized inferenceGate
  summary that explains disabled runner, stale plan day or stale usage day.
  The boolean is eligibility according to configured attestations, **not**
  confirmation of provider billing or current Free-plan state.
- Tests cover empty/partial/truncated responses, over-quota groups,
  fake clocks, unauthorized telemetry, UTC rollover and secret omission.

## Next external acceptance
The real Cloudflare account still needs a fresh Free-plan check and this
preflight must run against the real provider before isolated HOOK V5 inference.
The previous V5 HOOK candidate remains visually rejected.
Do not equate code tests with 17 approved images, 69 real Google Drive
files, four inbox-confirmed Gmail milestones or a production release.

No AI requests, uploads, emails, paid services or production changes
were initiated by these development changes.

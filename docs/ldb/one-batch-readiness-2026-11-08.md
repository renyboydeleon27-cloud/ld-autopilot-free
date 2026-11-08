# NER AUTO STUDIO — One-batch readiness checkpoint (2026-11-08)

## What changed

- The LDB approval workflow now triggers for JavaScript cloud scripts
  (scripts/ldb*.mjs) and LDB regression tests (tests/ldb*.test.mjs)
  in BOTH push and pull_request events. Cloudflare Worker source changes
  remain covered. This prevents a script-only change from silently skipping
  important PR checks.
- A read-only, no-network command summarizes live preflight prerequisites
  in a single sanitized JSON report:
  node scripts/ldb-one-batch-readiness.mjs --read-only
- It examines an existing, freshly generated
  cloudflare/ldb-runner/public/live-preflight.json and the preview-only,
  same-UTC-day Free-plan operator attestation. It never fetches tokens,
  sends email, calls Workers AI, or modifies/deletes a Worker.
- The check always reports inferenceAuthorized:false, even when its
  validation passes: externally authenticated Free-plan billing eligibility,
  actual visual QA and production delivery are independent requirements.

## Remaining blockers

1. An operator still needs the current Cloudflare dashboard Free-plan
   verification and a read-only account telemetry report from the actual
   Cloudflare account.
2. The previously rejected HOOK V5 needs a new, explicitly gated isolated
   render and visual check before any 17-scene image acceptance.
3. Exactly 17 visual-accepted images and 69 actual checksum-verified
   Google Drive files, plus inbox-confirmed Gmail milestones and owner
   production approval, must be demonstrated separately.

This batch does not authorize inference or claim any real 17-image
production, Drive delivery, Gmail send, or live production merge.

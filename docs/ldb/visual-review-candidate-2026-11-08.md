# Staged image visual-review access — 2026-11-08

## Why this is needed
The quality/status endpoint listed 17 checksum-verified corrected candidates
but did not let an independent reviewer actually inspect those candidate
bytes. Review approval must never be inferred from staging or hashes alone.

## New read-only reviewer route
`GET /internal/quality/candidate/{SCENE}`
Where SCENE is exactly HOOK, P1–P14, ENDING or THUMBNAIL.

The route:
- Requires QUALITY_REVIEW_SECRET and both QUALITY_IMPORT_ENABLED and
  QUALITY_REVIEW_ENABLED, plus RUNNER_ENABLED. Staging-only, owner, and
  unauthenticated credentials cannot fetch the image.
- Works with DELIVERY_BRIDGE_ENABLED=false, avoiding Drive and Gmail access.
- Requires IMAGES_READY (17/17), no STOP, a source-matching stage audit and
  immutable stored image bytes with a verified SHA-256 digest.
- Returns the exact staged image/png bytes with no-store, nosniff, scene,
  checksum and `X-LDB-Visual-Audit: PENDING`. It never auto-approves.
- Cannot stage images, accept an audit, queue delivery, or call any AI provider.

An owner would still need a trusted reviewer workflow and independent
visual approval before enabling the 69-file delivery connector.

## Verified limitations
This is a development-only route. A green CI result demonstrates mocked
routing and storage integrity, not real visual acceptance, Cloudflare
generation, 69 verified Google Drive files, or any Gmail delivery.
All Worker feature switches remain OFF. No paid services are used.

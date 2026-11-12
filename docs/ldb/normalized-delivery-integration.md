# Normalized image handoff — November 5, 2026

The existing Python normalizer now runs the independent pixel audit before and after normalization. Only source tint is correctable; corrupt, transparent, animated, incorrectly sized or nearly uniform files remain blocked. The output audit binds the final PNG bytes to their source SHA-256 and remains visual_check=PENDING and delivery_ready=false.

The new server-only prepareNormalizedImageDelivery adapter accepts the original runner job, original sourceAssets, normalized assets, backend-loaded normalizationAudit and trusted approvedAudit. It verifies all 17 source/output hashes and pixel records, then uses the existing visual-review handoff to build delivery entries from the final PNG hashes. Original runner checkpoints are unchanged. Reviews for the original JPEG hashes cannot approve the corrected PNGs.

Trust boundary: normalization and visual audit records must be supplied by the trusted backend, not a browser. The JavaScript adapter verifies provenance; it does not decode pixels itself. The Python checker supplies the independent decoded pixel evidence.

Validation: 4 Python tests passed, including all 17 scene identifiers using synthetic image fixtures; 18 JavaScript tests passed (12 normalized-delivery plus 6 existing handoff tests). Changed source/final bytes, mismatched audit hashes, scene swaps, incomplete sets, story tint, monochrome thumbnails and absent visual review are blocked.

Not yet live: the persistent runner/delivery orchestrator still needs to invoke this path and persist the normalized bytes. No new inference, real image correction, cloud deployment, Drive upload, email or production merge occurred during this change. The last real HOOK remains visually unaccepted. These tests are not a completed production episode.

# Prepared HOOK persistence stage

The explicit preview-only HOOK test now invokes `python3 -m scripts.ldb_prepare_rendered_image` after saving the source render and read-only pixel audit. The stage verifies the source bytes against the paused checkpoint and persists a separately normalized PNG, hash-bound audit and READY marker under public/prepared. READY means the writes finished, not visual approval or delivery authorization. Consumers must require the marker and validate the PNG checksum against the audit.

The original JPEG and checkpoint are not rewritten. Existing destinations are rejected instead of overwritten. Pixel correction remains insufficient to pass visual review. The stage performs no network calls and no image inference itself.

Validation on November 5, 2026: three local persistence tests passed using synthetic images; JavaScript syntax check passed. Tests cover exact grayscale after correction, final hash binding, preserving originals, rejecting overwrite, rejecting source hash mismatch and rejecting an unpaused checkpoint.

This code is wired into the explicit test build, but that updated build has not been executed against Cloudflare. It does not yet persist normalized images back into the durable 17-scene runner or invoke the Google delivery bridge. No new inference, live deployment, Drive upload or Gmail notification was performed for this change. The existing v4 worker is not reusable for another create-worker test; use the correction stage on recovered original bytes or a separately authorized bounded test when live verification resumes.

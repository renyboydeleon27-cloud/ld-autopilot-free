# HOOK V5 format-aware evidence handling — Nov 8, 2026

Cloudflare Workers AI may return JPEG or PNG. The old V5 acceptance flow
always saved HOOK.jpg and assumed JPEG during offline grayscale review and
failure recovery. A PNG could be mislabeled and become unrecoverable.

The isolated V5 cloud test now verifies that the actual image signature,
dimensions, and Runner's saved MIME agree before claiming success.
The CLI writes HOOK.png or HOOK.jpg based on inspected image type and
records the sourceFile in report.json and image page. The wrapper reads
that verified filename for its offline Pillow audit. Both review and
no-inference recovery support PNG/JPEG while preserving original bytes,
outputting only pending-review grayscale candidates, and rejecting
MIME/filename mismatches or path-traversal attempts. Historic V5 JPEG
reports without sourceFile remain supported.

Unit tests use a real CRC-valid PNG source and a Pillow-decoded PNG source
and verify that they are never automatically approved. No Cloudflare AI
inference, Google uploads or Gmail sends were triggered. Free-plan
dashboard confirmation and actual HOOK V5 human approval are still pending.

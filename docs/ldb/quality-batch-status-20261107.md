# Read-only 17-image batch review status — November 7, 2026

Development only. A private \`GET /internal/quality/status\` on the Cloudflare Runner now summarizes which corrected images were persisted, checksum-recovered, or missing for the current 17-scene episode. It requires the separate \`QUALITY_REVIEW_SECRET\` and \`QUALITY_REVIEW_ENABLED=true\`, but deliberately works while \`DELIVERY_BRIDGE_ENABLED=false\`. Image staging uses a different secret and cannot read reviewer status.

Both the Worker edge and Durable Object repeat authorization. Every present candidate is loaded from immutable chunk storage, rehashed, and bound to its original runner SHA-256 before it is counted as STAGED. The JSON returns 17 scene IDs, per-candidate hashes and byte counts, missing count, and a review-readiness flag. It contains no token, image bytes, Google file IDs or artificial visual approval.

**Important:** \`REVIEW_CANDIDATES_READY\` means **all 17 corrected bytes are staged**, not that a human has approved the artwork. The response always has \`visualAudit:PENDING\`, \`deliveryReady:false\` and \`googleUploadsStarted:false\`; it has no effect on existing 69-file delivery or Gmail. STOP, incomplete render, missing images, or corrupted candidate data prevent it from claiming ready. No public UI route is created.

This shortens the future one-batch review workflow, but does not generate or visually approve images, deploy a Worker, upload files, or activate paid inference. The actual end-to-end acceptance still requires the 17 images, trusted visual review, verified 69-file delivery and Gmail milestone evidence.

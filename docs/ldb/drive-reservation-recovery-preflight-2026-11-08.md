# Google Drive reservation recovery preflight — November 8, 2026

The 69-file delivery coordinator has an independent durable checkpoint,
but DriveDelivery uses its own per-file durable ID reservation. Previously,
DriveDelivery obtained a Google OAuth token before checking even the
saved reservation fingerprint, and it did not validate the stored ID,
retry counter, status or related metadata before the first Drive GET.

This batch adds an exact-shape reservation check before requesting an
OAuth token or accessing Google. It validates the saved ID, filename,
parent folder, mimeType, byte count, SHA-256/MD5, attempts (0–3),
status, key and fingerprint. A corrupt reservation fails closed with a
static error and cannot start a new upload or reuse a wrong remote ID.
Inside a transaction, the current reservation is revalidated before an
upload-attempt increment to close the concurrent mutation gap.

Existing idempotent behavior is preserved: an already uploaded file
can be reconciled from its reserved ID after restart, including when
attempt 3 succeeded remotely but the final local acknowledgment was
lost. Reconciliation never creates a second file.

Mocked regression tests exercise corrupted IDs, extra private fields,
invalid retries, changed metadata, premature token fetch, and safe
third-attempt recovery. No real Google token, Drive file or Gmail
notification was accessed; Cloudflare Workers and production remain OFF.

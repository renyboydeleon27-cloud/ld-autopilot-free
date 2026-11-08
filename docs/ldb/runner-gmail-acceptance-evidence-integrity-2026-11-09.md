# Durable Runner Gmail evidence validation — November 9, 2026

The owner-only acceptance report previously counted a Runner
milestone checkpoint whenever the stored object merely had
`status: "SENT"`, even if it lacked an attempts counter, contained
unexpected private fields, or had an invalid retry count. That could
inflate the apparent number of Gmail notifications accepted.

The reader now classifies EXACT stored Runner shapes with status and
safe integer attempts (0–3, with zero permitted only for RETRY_WAIT).
Malformed fields or stale, incomplete records are reported as
INVALID_RECEIPT; storage failures as RECEIPT_UNAVAILABLE; missing
records as NOT_RECORDED. These codes never count as SENT and they
never expose raw provider values or exceptions.

An acceptance report with invalid or unavailable evidence adds the
explicit GMAIL_MILESTONE_RECEIPT_INTEGRITY_NOT_VERIFIED blocker.
The 4/4 number still only reflects Runner-side acknowledgment,
not Google Gmail inbox receipt, authenticated Worker-to-Worker
transport, Free-plan quota, or production release.

Adversarial offline tests inject fake SENT statuses, impossible retry
counts, secret-like metadata, storage exceptions, and all-four-valid
records. They confirm counts cannot inflate and no sensitive content
leaks into acceptance snapshots. No real emails, Google credentials,
Cloudflare mutations, paid inference, or production changes are made.

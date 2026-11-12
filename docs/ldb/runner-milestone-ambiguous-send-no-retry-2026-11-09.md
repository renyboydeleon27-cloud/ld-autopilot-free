# Runner Gmail milestone ambiguity: fail closed, no automatic resend (Nov 9, 2026)

## What changed

The Runner-side milestone dispatcher previously converted every Vault
notification exception into `RETRY_WAIT` and automatically scheduled a
30-second alarm for another attempt. A failed network response is NOT
evidence that Gmail did not accept the request. The Vault has its own
at-most-once receipt, but its Durable Object state may be unavailable
or disconnected from the Runner during an interrupted acknowledgement.

The dispatcher now records `UNCERTAIN` when a notification throws or
returns a malformed response and DOES NOT schedule a resend. This
status does not count as `SENT` and is reported for owner reconciliation.

It also upgrades legacy `RETRY_WAIT` receipts with attempts > 0 to
`UNCERTAIN` before any provider call, preventing duplicate emails
when an earlier run may already have reached Gmail. Only
`RETRY_WAIT, attempts:0` is safe to retry because it is written
after STOP cancels the claim before any network send.

An ambiguous 30% delivery does not block an independently earned
50% update forever, but never causes the 30% email to resend.

Tests cover network errors after a possibly successful send,
malformed Vault acknowledgements, pre-upgrade RETRY_WAIT states,
no resend alarms, and STOP-before-network recovery.

No real Google credentials, Gmail, Drive, Cloudflare Worker or paid
inference were accessed. Production remains NO-GO.

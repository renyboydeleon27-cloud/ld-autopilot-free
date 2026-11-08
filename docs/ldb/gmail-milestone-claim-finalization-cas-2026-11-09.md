# Gmail milestone finalization compare-and-set — November 9, 2026

The owner-only Gmail Vault adapter previously made an at-most-once
CLAIMED reservation, sent the request, and then unconditionally saved
SENT or UNCERTAIN using a plain storage.put(). If a concurrent operator
reconciliation or storage modification occurred during the Gmail
request, the old response could replace a newer durable receipt.

Now each new CLAIMED reservation includes a random 128-bit claimId.
Legacy CLAiMED/SENT/UNCERTAIN records remain readable without that
field. Every terminal receipt is written inside an atomic storage
transaction, only when the current durable claimId exactly matches
the sender's own reservation. If the record was changed, no stale
SENT status is written. If it was removed, a conservative UNCERTAIN
tombstone is written to prevent unintended retries.

The terminal record stores only status, milestone percentage and an
optional SHA-256 digest of the provider message ID. Neither the
owner token nor raw Gmail ID is stored in the receipt. SENT only
means Gmail API accepted the message; inbox arrival remains
unverified.

New tests simulate concurrent claim replacement, manual SENT/UNCERTAIN
reconciliation, claim deletion, corruption and successful completion.
No live Gmail requests, cloud mutations or production approvals.

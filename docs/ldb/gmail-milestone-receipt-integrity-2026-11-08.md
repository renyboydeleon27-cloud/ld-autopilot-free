# Gmail milestone durable receipt verification — Nov 8, 2026

The Vault's at-most-once Gmail milestone adapter previously returned
a cached record's `status` without validating its percentage or
record structure. A damaged record, including a synthetic `SENT`,
could masquerade as a Gmail acknowledgement after restart.

Now the adapter validates both existing and racing concurrent
receipts *before* requesting OAuth or sending to Gmail. The only
accepted stored states are the exact matching milestone percent and
CLAIMED / UNCERTAIN / SENT statuses, with an optional 64-character
SHA-256 digest of the provider message ID for newly SENT records.
Unknown fields, stale percentages, invalid statuses and malformed
digests fail closed and are never overwritten automatically.

A new Gmail success requires a plausible Google message ID
(alphanumeric, underscore or hyphen, 8–200 characters); accepted IDs
are recorded as one-way hashes, never copied into public responses.
Missing or malformed provider acknowledgements remain UNCERTAIN and
are never automatically resent. The OAuth token remains acquired
before the first at-most-once claim so a token failure cannot create
a permanently claimed but unsent notification.

New offline tests inject forged/corrupt receipts, malformed Gmail IDs,
older valid statuses and overlapping sends. The offline GitHub approval
workflow now explicitly runs the Gmail delivery tests alongside 69-file
and durable milestone tests.

SENT means Gmail API acceptance only, not recipient inbox delivery.
No live Gmail, OAuth, Drive, image or Cloudflare operations were made.

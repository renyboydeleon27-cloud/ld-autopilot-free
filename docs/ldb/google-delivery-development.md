# Google delivery adapters — development boundary

These internal server-side adapters are implemented and tested with fake HTTP and
transactional storage. They are not deployed, wired to the production runner, or
proof of a real Google upload/email. No credentials were supplied and no mail sent.

## Drive

Each logical asset has a persistent, pre-generated Google Drive file ID. Retries
use that ID, including after a crash or ambiguous POST response. Before and after
upload, GET verifies ID, folder, name, media type, application ownership marker,
byte count, MD5 and SHA256. A mismatch blocks completion. A changed payload cannot
reuse the existing reservation. At most three POST attempts are allowed, with
reconciliation before each. No rename, move, PATCH, delete or sharing operation
exists. Existing InShot media remains untouched. Native Google Docs conversion is
not supported; deliverables remain actual binary/text files.

Sources:
- https://developers.google.com/workspace/drive/api/guides/manage-uploads
- https://developers.google.com/workspace/drive/api/reference/rest/v3/files

## Gmail

Fixed sender renyboydeleon27@gmail.com and recipient dkael1250@gmail.com.
Milestones read a trusted durable job snapshot supplied by the internal caller,
not progress values received from the browser:

- 30: at least six saved scene images with content hashes.
- 50: at least twelve saved scene images with content hashes.
- 70: all seventeen images pass visual audit, plus seventeen image prompts,
  sixteen Flow prompts and sixteen narration scripts.
- 100: all expected deliverables also have matching verified Drive hashes.

These are stage milestones, not elapsed-time estimates. STOP or blocked jobs
cannot send new progress messages. The durable notification claim is written
before the Gmail POST. Successful sends become SENT. Timeout, uncertain response
or crash after claim requires reconciliation; there is no automatic resend.
This is at-most-once submission, not guaranteed exactly-once delivery. The narrow
`gmail.send` scope cannot inspect Sent mail to reconcile uncertainty. A stable
Message-ID is included for diagnosis but is not treated as a Gmail idempotency key.

Source: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send

## Validation and remaining work

Ten delivery tests pass: verified copies, timeout reconciliation, bounded retries,
changed-content rejection, corruption rejection, concurrent ID reservation,
folder metadata, milestone state, fixed recipients, durable send claims and no
network activity for unearned milestones. Combined local suite: 23 Python and
47 Node tests (70 total).

On this turn, Vercel environment metadata still contained only Cloudflare account
ID/token and the unused OpenAI key. Missing Google client credentials and vault
configuration prevent a live OAuth/delivery trial. No paid API fallback is used.

Next integration must supply a trusted immutable delivery plan and asset bytes,
implement folder hierarchy, run adapters within the credential vault boundary,
persist alarm-driven delivery checkpoints, and connect verified output records
to Gmail snapshots. Do not enable a generic endpoint that accepts a client-provided
percentage or quality-pass flag. Do not label the recovered review ZIP as visually
approved final production merely because structural file checks pass.

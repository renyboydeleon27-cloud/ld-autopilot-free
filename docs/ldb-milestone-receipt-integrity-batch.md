# Gmail milestone receipt and notification integrity — development batch

Runner-side durable notification records now require the exact `{status, attempts}` shape, known statuses and bounded integer attempts. Malformed or unknown receipts are preserved and block automatic sends instead of being overwritten. Only an explicit `RETRY_WAIT` with zero attempts may resume, because it represents a STOP canceled before the network call; legacy retry records with prior attempts become `UNCERTAIN`.

A notification response is finalized only against its exact current claim. If the claim vanished during the external request, the Runner writes an `UNCERTAIN` no-resend tombstone. Changed or corrupted receipts are not overwritten. Later milestones also stop if earlier milestone state is missing, malformed, claimed, or waiting for retry.

The 69-file 100% threshold, Vault-side Gmail eligibility/reconciliation and at-most-once behavior, STOP/Resume checks, and approved storyboard/source validation are unchanged.

## Validation

No test command was run in the GitHub-only environment. Existing PR #61 workflow was passing before this batch; this update requires CI on the branch.

No new image inference, real Gmail message, Google Drive upload, paid activation, credential access, or deployment was performed. Real Free-plan/quota verification, human review of all 17 images, 69 actual Drive receipts and inbox confirmation remain manual acceptance blockers.
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

## Folder name collision fix — November 9, 2026

Google Drive has multiple folder levels: the fixed `Living Disaster Book`
root, a user-approved episode folder, and fixed category folders. An episode
title can validly be `Storyboard`, `Narration`, `Thumbnail`, or even
`Living Disaster Book`. Previously, folder reservations were hashed from
job ID + name alone, so two distinct folders could accidentally share one
persisted file ID despite having different parents.

The delivery coordinator now scopes the **episode** reservation only when
the title equals the fixed root name, and scopes the **category** reservation
only when its name equals the episode title. No duplicate Drive reservation
key is ever assigned across these levels. All other folder keys preserve
the exact historical hash for restart/recovery compatibility. This avoids
changing previously reserved IDs in ordinary 69-file jobs.

Offline tests cover full 69-asset runs for multiple colliding episode names,
identity and parent checks, plus unchanged legacy keys during restart. This
does not perform a Google upload, migrate existing provider files, or
establish production readiness.

## Folder identity guard — November 9, 2026

The production delivery coordinator now checks each result from its root,
episode and category Drive folder operations before passing that folder ID
to another provider request. Empty, malformed, non-string, explicitly
unverified or repeated directory IDs are fatal. A directory may not reuse
an ID previously verified as an uploaded file in the same 69-asset job.

An invalid parent folder identity puts the delivery checkpoint into
`NEEDS_REVIEW` without starting the child asset upload or another automatic
retry. This protects the intended root → episode → category hierarchy;
it does not assert that any real Google Drive folder has been created.
New offline regression tests check missing IDs, malformed IDs, aliasing
between parent/child folders, and aliasing with already verified files.

## Final-attempt GET-only reconciliation — November 9, 2026

Previously, a coordinator checkpoint whose upload-attempt count reached
three entered `NEEDS_REVIEW` before its Google Drive adapter could inspect
a file successfully uploaded during the third attempt, but not durably
acknowledged. The Drive adapter's per-file reservation could recover it,
yet the outer coordinator refused any further inspection.

The coordinator now allows ONE final **read-only** recovery pass only if the
trusted Drive backend explicitly exposes `reconcile`. The method requires
the exact matching durable file reservation and checksum-bound asset,
refuses missing/corrupt reservations before OAuth, performs provider GETs
only, validates the existing file's identity, parent and content, and
persists a local `VERIFIED` checkpoint. It does not issue Google Drive
`generateIds`, POST, PATCH, or DELETE. Root, episode, category and asset
must all reconcile through already reserved IDs before the next asset
can be marked complete.

Recovery does NOT refresh the failed attempt budget. On any missing folder,
missing remote file, checksum mismatch, unsupported backend or ambiguous
recovery result, it stops with `NEEDS_REVIEW` and no automatic replay.
A successfully recovered asset advances its 69-file checkpoint once,
then normal delivery resumes on the next asset. The private
Runner→Vault RPC is still disabled without the production delivery gate.
Tests use only in-memory Google mocks; they do not establish live delivery
or Cloudflare production readiness.

## Durable one-shot recovery marker — November 9, 2026

A final read-only recovery pass now writes `RECONCILING` to the coordinator
checkpoint **before** its first provider GET. A subsequent alarm or Worker
restart that finds this incomplete marker enters `NEEDS_REVIEW` with the
static code `DRIVE_READONLY_RECOVERY_INTERRUPTED`, without retrying that
recovery automatically. This closes an unlimited-replay gap if a Worker
restarts during a GET or before the verified checkpoint is saved.

The marker is legal only with an exhausted three-attempt budget. STOP during
an active reconciliation remains a user pause: no additional folder/file
requests start after STOP, and an explicit owner Resume can restart a fresh
read-only check without writing a fourth upload. Normal success advances
the verified asset index and exits `RECONCILING`. The owner-only read-only
progress route treats this transient state as an active checkpoint, not as
proof of actual Google Drive delivery.

Offline tests exercise normal recovery, a persisted interrupted marker,
forged premature status, and STOP/Resume. No live Worker or Google call.

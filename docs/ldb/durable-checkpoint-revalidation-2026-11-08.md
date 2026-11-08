# Durable checkpoint revalidation — November 8, 2026

The production delivery coordinator formerly verified the 69-asset plan
at submission, but could continue to provider calls from altered saved
Durable Object state. Every alarm now recomputes the approved plan
fingerprint and validates verified receipt order, exact checksums,
unique remote IDs, legal progress and STOP state, and bounded retries,
inside a transaction BEFORE any Drive, capacity or asset-read call.

Corrupt state is quarantined as NEEDS_REVIEW with a static failure code,
STOP flag, and cleared alarm. Resume revalidates checkpoint integrity.
An in-flight upload revalidates the current checkpoint before advancing
the 69-file verified count. Correct STOP-during-upload behavior remains.
Offline regressions inject tampered assets, forged progress, duplicate
remote IDs, bad retry counts and modified paused jobs.

This does NOT make Google Drive uploads, send Gmail milestones, start
Cloudflare inference, or modify production Workers.

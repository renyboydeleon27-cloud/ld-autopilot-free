# Explicit incomplete-journal archive — Core 5 build 5.1.7

Phone evidence: P3 journal STARTED, legacy + IndexedDB, matching identity, no storage conflict, no recoverable result. Build 5.1.6 correctly blocks further spend but lacked a safe legacy-journal release path.

Adds an explicit confirmation button after free inspection, only for matching STARTED/UNCERTAIN records without conflicts. The coordinator rechecks the reviewed record under the stage Web Lock; busy, changed, conclusive and mismatched records are refused. Runtime protects approved panels and rechecks project/input identity.

The store atomically archives the original record (including raw legacy bytes and source) and removes its active IndexedDB copy. It verifies the archive before removing only the exact legacy active key. Failed archive transactions retain both originals; failed legacy removal leaves the legacy guard active. No site storage clearing. No narration, scene, approved panel or backup changes. A stale panel failure record is cleared only after successful archive, allowing the normal preflight/audit workflow again. The action itself sends zero API requests.

Every new audit attempt receives a unique attempt ID, so stale archive consent cannot match a later incomplete attempt. Duplicate simultaneous audits remain serialized and reuse a conclusive result. No automatic audit or retry is introduced. The next user-triggered Smart Continue can use credits; the previous uncertain attempt may already have cost credits.

Validation: 135 free unit/regression tests passed. Actual Chromium browser test passed: cancel preserves state, aborted archive transaction preserves originals, legacy-removal failure retains the blocker, successful archive preserves all stage fields, archive is retained, and simultaneous mock audits invoke the callback once. Real provider requests: zero. Physical Android confirmation remains after deployment. Existing PWA upgrade/offline tests run in CI before merge.

Restore baseline: b914df96d93687328dcfbcb806c543e05abd5caf; branch restore/pre-core5-journal-archive. Rollback: revert application changes on a branch, regenerate verified PWA shell, test and deploy. Never clear user storage. Existing archive entries must remain retained.

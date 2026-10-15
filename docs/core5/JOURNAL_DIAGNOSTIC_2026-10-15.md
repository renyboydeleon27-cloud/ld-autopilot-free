# Core 5 journal diagnostic and free recovery — October 15, 2026

Status: implemented and verified locally; not merged or deployed. Candidate build 5.1.6.
Branch: fix/core5-journal-diagnostic.
Baseline: 99f4c4e5f8ceb80e3205a2b9e0d205898d4568fa (PR #13).
Restore branch: restore/pre-core5-journal-diagnostic.

## Confirmed cause

The existing runtime diagnostic read only the card's core5Record. The audit coordinator independently reads a journal indexed by SHA-256(project scope + stage) through NERCore5JournalStore, including retained legacy localStorage data. Thus NOT_AUDITED / NONE in the card can coexist with a blocking journal. The old diagnostic did not inspect that source.

The user's device journal has NOT been read remotely. Its actual status, source, identity match and recoverability remain unknown until the updated FREE checker is used on that device. No audit, reset or project mutation has been performed on the user's device.

## Implementation

- Store.inspect reads legacy and IndexedDB records without migration, quota probes, writes, or deletion. Reports source conflicts. Does not create a missing database. Unsupported read-only database enumeration fails clearly rather than reporting no journal.
- Coordinator.inspect shares the exact slot/key function used by run/reset and a non-blocking Web Lock. Reports found/source/stage/status/identityMatch/recoverable/conflict/busy. A busy lock is unknown, never a false no-journal result.
- Coordinator.recover returns only matching, valid, conclusive DONE results under the same lock. Neither inspection nor recovery accepts an audit callback or changes the journal. NEEDS FIX can be recovered for review, never mistaken for approval.
- Runtime.journalDiagnostic merges panel/preflight evidence with the coordinator's actual journal inspection. Existing synchronous diagnostic remains backward compatible; the UI uses the new asynchronous diagnostic.
- Recover saved audit FREE explicitly restores a valid saved result and exact prompt into the unapproved current panel. Rejects changed projects, changed inputs and approved panels. Project-save failure is surfaced rather than claimed as durable success. Journal retained throughout.
- Incomplete, uncertain, mismatched, conflicting and invalid journals remain intact. No automatic retries or resets. Existing retry path additionally refuses legacy/conflicting/mismatched/DONE journals instead of falsely announcing that a no-op reset allowed a retry. A confirmed conflicting-journal reset flow is intentionally not added: inspect evidence first.
- Editor displays journal source, status, stage, match, recovery availability and no-request confirmation. Exposes a free recovery button only for recoverable results.

## Additional issue exposed by recovery regression

The dynamically loaded legacy anime-render-enforcement wrapper changed recovered unapproved Core 5 prompts on reload, adding legacy override text. It now skips canonical Core 5 panels and all protected panels. Its versioned script is explicitly included in HTML and the verified PWA shell; the legacy loader recognizes it. Rendering locks in the canonical compiler are unchanged.

## Files

Application: ner-core5-journal-store.js, ner-core-5-audit-coordinator.js, ner-core-5-runtime.js, ner-core-5-editor.js, anime-render-enforcement.js, new-project-fix.js, app-update.js, index.html, service-worker.js.
Tests: core5-journal-inspection.test.cjs, core5-journal-inspection-browser.cjs, core5-runtime.test.cjs, core5-pwa-release.test.cjs, core5-pwa-browser.cjs, core5-pwa-diagnostic-browser.cjs.
CI: .github/workflows/core5-pwa-release.yml includes the new real browser regression.

## Results

- Full free unit/regression suite: 133 passed, 0 failed.
- Actual Chromium IndexedDB and legacy diagnostics: passed. Verified no database creation/migration on inspection, payload mismatch, source conflict, matching DONE recovery, exact prompt bytes and ready state after reload. Zero API calls.
- Cached-worker upgrade + diagnostic + offline close/reopen: passed, P3 narration/scene and approved fields unchanged.
- Core4 interrupted-install recovery and completed upgrade: passed.
- Real Aberfan backup: 17 approved panels and original saved fields preserved through import/reload/export; zero API calls.
- Real Halabja backup: 17 approved panels and original saved fields preserved through import/reload/export; zero API calls.
- Shell generation check and git diff whitespace check: passed.
- All provider responses in unit tests are mocks. No paid AI/video calls. Browser runs used desktop Chromium, not physical Android.

Temporary logs: /tmp/journal-inspect-unit.log, /tmp/journal-inspect-browser.log, /tmp/journal-pwa.log, /tmp/journal-pwa-core4.log, /tmp/journal-aberfan.log, /tmp/journal-halabja.log.

## Next step and limits

After deployment approval and successful GitHub/production checks, update the installed app and press only P3 / Review Core 5 scene / Check audit status FREE. Send its output. Do not press Retry, Apply reviewed scene, or Smart Continue during diagnosis.

If the report offers Recover saved audit FREE, it reuses the matching validated result without an AI request. Otherwise inspect the blocker before deciding on any explicit reset. LocalStorage quota problems may still prevent saving a recovered panel; the journal stays available and no paid request is made. This patch does not claim that the user's P3 result is recoverable.

Rollback before deployment requires no live action. After deployment, revert application changes on a dedicated branch and regenerate the PWA shell with scripts/build-pwa-shell.cjs; test before release. Do not clear localStorage, IndexedDB, project data or approved panels. Journal schema is unchanged and no destructive migration is introduced.

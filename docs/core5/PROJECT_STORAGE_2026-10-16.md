# Core 5 project storage — candidate 5.1.8

## Root cause
The phone successfully archived the incomplete P3 journal, then failed `LDCore.saveCurrent()`. Audit journals had moved to IndexedDB, but the active production and multi-project library still used localStorage. A real Chromium test fills localStorage and reproduces this failure. The device's exact quota cannot be inspected remotely.

## Change
An explicit **Enable larger project storage · FREE** action copies managed `ld-`/`ner-` workspace keys to an IndexedDB snapshot, incorporates the current unsaved production, verifies the committed copy, and activates storage in place. Original native localStorage bytes are retained. Audit journal keys remain in their existing journal subsystem. No journal reset, automatic audit, scene/narration editing, or paid request is introduced.

A synchronous Storage-compatible facade retains existing module APIs while serializing durable snapshot writes. Bootstrap loads storage before application modules; legacy ready handlers are delivered after module loading. Startup hook ownership is initialized before decorators; the old survival decorator now refuses approved panels even before the owner module loads. This addresses an intermittent approved Aberfan HOOK mutation caught by the real-backup test.

Smart Continue checks and flushes project persistence before an audit; recovered/archived journal state is flushed before success. Successful audit results are saved before reporting readiness. Updates flush pending writes. One workspace Web Lock excludes concurrent new-version editors. A native legacy write from an old app version blocks saving/reopening rather than choosing one conflicting copy silently.

## Validation
- 136 unit/regression tests pass.
- Real Chromium full-localStorage failure and explicit migration pass: unsaved edits, all approved fields, other saved production, retained native bytes, untouched audit journal, reload, failed initial migration, cross-tab exclusion, failed disk commit blocking audit, and old-version conflict detection.
- Actual Great Smog backup: 3 approved panels preserved; import/save/reload/export and prompt bytes pass.
- Actual Aberfan and Halabja backups: all 17 approved panels preserved per production; import/save/reload/export, exact prompts, completed Smart Continue inert.
- Real cached-worker upgrade, failed partial install, free diagnostic, offline reopen (including migrated storage), journal recovery/archive tests pass.
- Zero provider/API requests; browser tests block paid endpoints. Physical Android validation is still required.

## Files
Storage and bootstrap: ner-project-storage.js, ner-app-bootstrap.js; index.html and separate studio entrypoints; ner-core-5-runtime.js; app-update.js; hook-survival-lock.js; generated service-worker.js. Browser/unit regressions and CI workflow accompany the changes.

## Risks and rollback
IndexedDB is still device storage, not a cloud backup or guarantee against OS/browser eviction. Disk exhaustion still stops saves and paid audit readiness. Closing immediately during a pending write can lose the latest uncommitted edit; the UI reports pending/failure and warns on supported unload paths. Older app versions must not write native storage after migration; such conflicts intentionally pause the workspace. Only one updated app tab may edit at a time.

Restore baseline: **6feba36d9031ad2caac74554e02a1d95433df805**, branch **restore/pre-core5-project-storage**. Before migration, a tested application revert can use that baseline. After migration, retain this storage adapter/bootstrap when rolling back other features; older builds cannot read newer IndexedDB edits. Export current projects before any full rollback and reconcile deliberately. Never clear site data or remove the database. Original legacy copies remain available but are not current after migration.

Recommendation: merge only after remote CI passes. Then verify production asset hashes and ask REN to enable larger storage once and confirm the saved status. Do not trigger a paid P3 audit as part of deployment verification.

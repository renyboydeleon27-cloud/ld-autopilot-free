# Core 5 PWA update repair — October 15, 2026

Status: verified locally; NOT merged, pushed, or deployed. Physical Android verification remains pending.

Branch: `fix/core5-pwa-update`
Baseline: `3903be8311981fd7b2d95dde60ac32d12a97479e` (PR #11).
Local restore branch: `restore/pre-core5-pwa-update-2026-10-15` at the baseline.
Candidate workflow build: **5.1.4**.

## Confirmed root cause

Live HTTP reads returned index.html referencing editor/runtime 5.1.3 and the diagnostic text in the editor. However service-worker.js remained byte-for-byte unchanged from the 5.1.1 release, with cache name ner-studio-pwa-5-1-1 and the old editor/runtime URLs. The coordinator cache entry was also stale (5.0.2 instead of 5.1.2), and the new compact shared-settings script was absent from the precache.

The worker serves cached index.html for navigation. With unchanged worker bytes, a browser update check does not install a new worker or refresh that cached document. Closing, reopening and reloading therefore cannot reliably repair this release mismatch.

A real local Chromium service-worker test reproduced the sequence: install commit 99e2602, switch the server to commit 3903be8, call registration.update(), reload. The diagnostic remained absent and the loaded script URL remained editor 5.1.1 despite its presence in the server's new source. This establishes a reproducible release defect, not direct inspection of REN's Android device.

The fresh editor attaches normally. Additional presentation defects addressed: escaped diagnostic newlines displayed literally; late-loaded editor scripts previously depended on a DOMContentLoaded event that might already have fired.

## Changes and behavior

- `scripts/build-pwa-shell.cjs`: derive all static dependencies from index.html. SHA-256 hashes of their bytes and worker implementation determine the cache revision. `--check` fails if the committed worker is stale.
- `service-worker.js`: generated current shell, including diagnostic/coordinator/compact-settings assets. Installation verifies every downloaded file's digest; mixed or interrupted releases fail installation and retain the working worker/cache. Activation claims clients without reloading the document. Retains the preceding shell; never unregisters workers or clears application storage. Answers read-only release queries.
- `app-update.js`: visible workflow build 5.1.4; explicit save-and-load action after controller replacement; no first-install reload loop. Checks for updates when the app becomes visible/online, throttled to once per minute. Registration errors can be retried. Reload is refused when saveCurrent returns false or throws.
- `index.html`: updater/editor asset references updated to 5.1.4.
- `ner-core-5-editor.js`: stable diagnostic selectors, actual newlines, attach immediately if DOMContentLoaded has already occurred. Diagnostic still calls only the existing read-only runtime function.
- `vercel.json`: HTML revalidation and no-store/no-cache headers for the worker.
- `.github/workflows/core5-pwa-release.yml`: release integrity and regression gate for PRs/main, plus local-server browser upgrade tests. Added but not run on GitHub yet.
- Tests: new release-integrity, update-controller and cached-diagnostic tests; existing Core4 upgrade expectations updated for content-derived cache identity. Existing refinement test selector narrowed to exclude the separate diagnostic status element.

No runtime compiler, narration, scene, approval or audit-coordinator logic was changed. No automatic audit or paid retry was added.

## Verification performed

| Check | Result |
|---|---|
| `node --test tests/*.test.cjs tests/*.test.mjs tests/*.test.js` | 118 passed, 0 failed |
| `node scripts/build-pwa-shell.cjs --check` | Passed |
| Changed application JS syntax and `git diff --check` | Passed |
| `tests/core5-pwa-diagnostic-browser.cjs` | Reproduced old defect; fixed upgrade passed |
| Mixed deployment with altered editor bytes | Rejected; previous cache retained |
| Existing PWA update via Check app update / Load available update | New editor and P3 button loaded |
| P3 diagnostic | Status, saved record, local blockers, no-request confirmation; no storage/panel writes |
| Offline close/reopen in same browser profile | Passed, diagnostic remained available |
| localStorage and IndexedDB sentinel preservation | Passed |
| Synthetic approved Great Smog panels including P1/P2 | Saved fields preserved across update |
| P3 narration, scene and Done flag | Unchanged |
| `tests/core5-pwa-browser.cjs` | Core4 -> failed install -> successful Core5 upgrade -> offline reload passed |
| `tests/core5-refine-browser.cjs` | Refinement/audit/approval persistence passed; 2 mocked audit calls |
| Actual Aberfan backup import/reload/export | 17 approved panels, every original saved field preserved |
| Actual Halabja backup import/reload/export | 17 approved panels, every original saved field preserved |
| Paid provider calls / video generation | Zero |

Browser tests used desktop Chromium with a 393x851 viewport; they are NOT physical Android tests. API endpoints were blocked or mocked. The diagnostic snapshots run atomically around its real DOM click handler so unrelated background session timestamps cannot contaminate the read-only assertion.

Backup SHA-256 values (original files unchanged):
- Aberfan: 1907ed15ca8759858e1ed369cbd9cee6384197320020c979fb48fe29c461dfa8
- Halabja: b51b40d3a4313ac8639d14a5f7228c3973c19a11123ff46b298ad6bac3bdf433

Local evidence logs: /tmp/core5-pwa-unit.log, /tmp/core5-pwa-diagnostic.log, /tmp/core5-pwa-core4.log, /tmp/core5-pwa-refine.log, /tmp/core5-pwa-aberfan.log, /tmp/core5-pwa-halabja.log. Logs are temporary; this report records the outcomes.

## Remaining risks and deployment recommendation

Ready for an explicitly approved deployment, followed by verification on REN's installed Android PWA. Not a claim that the phone is already fixed. No new deployment occurred in this task.

The earlier P3 audit-journal persistence error is separate: displaying the diagnostic enables investigation; this patch does not assert that the journal error is repaired. Do not automatically audit or retry P3.

Future releases must run `node scripts/build-pwa-shell.cjs` after changing HTML or shell assets and commit the generated worker. CI detects omissions. Digest validation deliberately refuses mixed deployments or middleware-altered file bytes; check production asset hashes after deployment. Separate browsers/WebViews have separate storage and worker contexts; do not clear data or move projects to diagnose this.

The old installed updater's save-failure behavior cannot be retroactively changed before its first successful update. REN already has a downloaded backup; keep it. The new updater refuses subsequent reloads when saving fails.

After explicit authorization: publish branch, run GitHub checks, merge only if clean, verify Vercel and live file bytes, then ask REN to Check app update -> Load available update -> confirm build 5.1.4 -> P3 / Review Core 5 scene / Check audit status FREE. Capture that output without running Smart Continue.

## Rollback

Before deployment, no live rollback is necessary. Keep the local restore branch and original backups.

If a deployed candidate must be rolled back, restore the baseline application files on a new rollback branch, retain the release-generation mechanism, regenerate a distinct worker/cache for that rollback, test, then deploy with approval. Simply restoring the unchanged 5.1.1 worker recreates the original stale-cache defect. A Vercel rollback alone also requires verifying installed-client activation. Never clear localStorage/IndexedDB, unregister workers blindly, or reset approved panels. Approved project data has no migration in this patch.

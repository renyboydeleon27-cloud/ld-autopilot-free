# NER Studio Core 5 — restart and review handoff

Current checkpoint summary: compiler 5.0.2 / PWA shell 5.0.5; semantic findings addressed; 98 local tests; full sixteen-panel mock workflow; real Aberfan and Halabja preservation tests. Controlled preview candidate only: physical Android check pending, no push/merge/deployment. Use the latest SEMANTICS cumulative patch or continuation ZIP. Older milestone sections below are historical.

Updated: 2026-10-13 (Asia/Riyadh). Repository: renyboydeleon27-cloud/ld-autopilot-free.
Branch: `dev/core5-architecture-2026-10-12` (local).
Restore branch: `restore/pre-core5-2026-10-12`.
Restore commit: `6d068d89c393490e75b5ab5a0d54250b9659308d`.
Earlier verified implementation continuation commit: `b49a803` (includes local scene review, restored video-modes tail, static ENDING, cross-panel preflight and tests).
Prior WIP commit: `db9f7e2`. **Do not use that commit alone:** its video-modes.js was truncated. The continuation restores the original tail and reapplies the Core 5 dispatch changes. Syntax and real-page tests now check the repaired file.

No push, main merge, deployment, paid AI request, or video generation has been performed. All browser/API tests use mocks. The user-supplied Halabja backup was read and imported only into an isolated local test browser; the original file was not modified or committed.

## Root-cause audit

The repository uses a static JavaScript application with many independently loaded enhancement scripts, browser localStorage project/approval persistence, and server API handlers. There was no package.json or AGENTS.md in the inspected checkout. The architectural review traced index loading, app hydration/collection, project identity, approval ledger, video modes, stage/family/event decorators, Smart Continue, AI audit, and service-worker caching, plus the existing tests.

1. **Many scene authorities.** Legacy stage defaults, family rules, historical context, event visual packs, camera/composition locks and event-specific patches can independently rewrite scene/prompt fields. Ordering and repeated enhancement change the eventual prompt. Numeric P12/P13/P14 defaults conflict with narration-specific inquiry, responsibility and remembrance roles.
2. **No immutable audit boundary.** Build/copy/approval paths could invoke wrappers again after audit. Smart Continue contained repair/retry paths and readiness signatures that did not define one complete immutable transaction. A literal escaped newline in a comment also swallowed the exactPrompt declaration.
3. **Event year doubles as scene year.** A shared year cannot express a flashback, subsequent inquiry or decades-later remembrance.
4. **Approval guards were inconsistent.** Several load-time image and scene decorators wrote approved fields. The actual-page regression checks preserved saved fields and drove ownership guards at those entrypoints.
5. **Runtime loading was ambiguous.** Core 4 modules mentioned in docs/precache were not all explicit index scripts. Precaching does not execute modules. Core 5 is explicitly loaded before app/video/Smart Continue.
6. **Stale delivery and test harnesses.** Script cache versions and service-worker shell did not match the changed entrypoints. Several baseline tests had outdated VM fixtures, cross-realm array assertions or incomplete prompt fragments treated as full prompts.

The restored baseline had 58 tests: 53 passing, 5 failing. During continuation, the truncated WIP introduced an additional syntax failure; this was repaired, not waived. The five baseline failures were corrected in test harnesses: missing app collaborators in VM fixtures, cross-realm arrays, asynchronous YouTube initialization/default client behavior, and a public-health fragment that correctly failed full motion validation. Production validators were not weakened to obtain green tests.

## Architecture and implementation

`ner-core-5.js` is a pure, shared browser/server module, compiler version 5.0.1:

- One typed StageSpec for each HOOK, P1–P14 and ENDING: source narration, sourced fact entries, semantic role, disaster family, event year, scene chronology, location, cast IDs, actor/action, camera, timing, visual/text locks and audio.
- Reusable family boundaries and representative role recipes. No new panel-specific override stack.
- Free structural/identity/chronology preflight; sequence checks for duplicate panels, mixed project identity and explicitly dated backward movement without a flashback.
- Deterministic single compiler. Video panels have one camera behavior and contiguous establish/action/hold timing totaling exactly ten seconds. ENDING stays an illustration with static composition and no video timing/audio requirement. Both preserve 2D historical anime, true grayscale, 9:16 and no generated text in this supported mode.
- Exact serialized payload equality and immutable PASS transactions. Matching full payloads, not short hashes, establish identity.

`ner-core-5-runtime.js` supplies project scope, approved-panel ownership, persistence, free preflight before audit, request deduplication and the authoritative video-mode dispatch boundary. Audited prompt bytes are reused for copy and approval. Source edits, scene edits, project switches, detached cards and prompt mutation invalidate or reject results. NEEDS FIX is saved and does not trigger an automatic fix/retry. An uncertain request failure is also retained; an explicit local retry control allows one new request on the next Smart Continue.

`ner-core-5-editor.js` adds a collapsed review form in existing cards. Legacy custom scenes are blocked locally until reviewed, and their previous text is retained in `core5LegacyScene`. Applying a scene synchronizes the visible scene and canonical spec; applying an identical scene does not discard a successful audit. The rest of the Smart Continue prepare/review/approve/advance workflow remains in place.

App persistence adds optional `core5Spec`, `core5Record`, and `core5LegacyScene` fields. Legacy approved prompts are preserved rather than migrated or re-audited. Guards bypass old writers for Core 5-owned or approved cards. Copy/package paths use the canonical role/prompt for Core 5 records. The audit endpoint rejects inconsistent payloads before provider access and disables the old incomplete-response retry for Core 5.

Index and service-worker assets are versioned together; offline fallback no longer ignores query versions, avoiding substitution of an old script for a different requested version.

**Scope:** Core 5 manages disaster Shorts in text-video, anime, grayscale mode. Fiction, longform, color and image-video workflows remain on their legacy paths. THUMBNAIL is outside the requested canonical sixteen stages. Existing approved panels remain on their saved bytes, including approved non-Core-5 formats.

## Verified behavior and reproducible tests

Run from the repository root:

```sh
node --test tests/*.test.cjs tests/*.test.mjs
```

Latest result: **92 tests, 92 pass, zero fail.** The Core 5 subset covers Aberfan P12/P13/P14, seven additional family classifications/policies, all sixteen stage definitions, camera/timing conflicts, chronology, source identity, prompt tampering, deduplication, approval persistence, legacy ownership, scene review, uncertain responses, server validation and no provider retry.

The actual index.html browser regression uses Playwright. Install test dependencies outside the repo if they are not available; no AI service is required:

```sh
npm install --prefix /tmp/ner-core5-test-deps playwright @sparticuz/chromium@153.0.0
NODE_PATH=/tmp/ner-core5-test-deps/node_modules CORE5_CHROMIUM_MODULE=/tmp/ner-core5-test-deps/node_modules/@sparticuz/chromium/build/index.js node tests/core5-browser.cjs
```

Alternatively use an existing Playwright Chromium installation and omit CORE5_CHROMIUM_MODULE. In this workspace Playwright came from CODEX_PRIMARY_RUNTIME_NODE_MODULES. Portable Chromium initially reported a /tmp/fonts ownership extraction error; the next launch used the extracted binary successfully.

Verified actual-page flows: legacy seed load; all saved narration/image/flow/text-video/scene fields preserved for approved HOOK/P1–P11; local form review; mocked audit; exact clipboard bytes; repeat prepare with no extra audit; reload; P12 approval → P13 preparation → P13 approval → P14 preparation → P14 approval → illustration ENDING preparation/approval. Separate project identities exercise fresh Wellington, Xylazine and Halabja HOOKs. Nine audit requests total, all intercepted mocks; external requests aborted. The additional scenarios verify simultaneous tabs reuse one result, a stale retry cannot erase a conclusive verdict, a closed tab leaves an uncertain request blocked, explicit retry works, and storage quota failure blocks before any provider request. Zero browser page errors.

All 102 root/API JavaScript files passed `node --check` after restoring the truncated file. Test output is retained in this directory.

## October 13 reliability milestone

- Added `ner-core-5-audit-coordinator.js`: Web Locks serialize same-origin requests; exact full payload comparisons establish reuse; a journal is persisted before any provider call. Interrupted requests require an explicit retry. A stale tab cannot clear a valid result already saved by another tab.
- Runtime now retains malformed PASS responses as review-required, rather than allowing repeated calls. Copying an approved Core 5 panel uses the frozen record even if a visible field was accidentally changed.
- Fixed two additional legacy writer paths found by the upgrade test: THUMBNAIL format/randomization and ENDING narration locking now respect approved/Core-5 ownership.
- PWA shell version 5.0.3 installs the complete asset set atomically; failed installation removes the partial cache and retains the working worker. Versioned assets are served from exact cached versions. The preceding app cache remains available to existing tabs; unrelated origin caches are not removed. The pure compiler remains 5.0.1 because prompt bytes/schema did not change in this milestone.
- Added `tests/core5-pwa-browser.cjs`. Run it with the same Playwright/Chromium environment as the main browser test. It first installs the actual Core 4 worker, moves to a neutral same-origin page to stop Core 4's timed writers, restores a known Core 4-format saved backup, simulates one failed asset download, retries a complete upgrade and reloads offline. This isolates migration behavior from mutations performed by the still-running old app. All approved fields are compared byte-for-byte. No provider requests occur.
- Test evidence: `unit-test-results.txt`, `browser-test-results.txt`, `pwa-test-results.txt`, `syntax-test-results.txt`.

## Before / after

| Concern | Before | Development branch |
|---|---|---|
| Scene authority | Multiple wrapper/panel overrides | One reviewed StageSpec and pure compiler for supported mode |
| Retrospective date | Shared event year | Separate scene relation, optional scene year and period |
| Camera/timing | Appended overlapping instructions | One typed camera and contiguous 10-second plan |
| Audit lifecycle | Rebuild/fix/retry can change prompt | Exact persisted transaction and request deduplication |
| Failed/incomplete audit | Potential repeat costs | Saved review state; no automatic paid retry |
| Custom scene | Free text mixed with generated overrides | Local review, preserved legacy draft, synchronized scene |
| Approved data | Inconsistent writer guards | Ownership guard and byte-preservation regression |
| ENDING | Illustration-only | Still illustration-only, now canonical |
| Legacy regression suite | Five baseline failures | Updated fixtures; full 92-test suite passes |

## Remaining risks and merge recommendation

**Recommendation: do not merge to production yet.** This is a tested development candidate, not proof that every acceptance criterion is satisfied for arbitrary existing production data.

- Local preflight proves typed structural invariants and selected textual contradictions. It cannot prove historical truth, identify every natural-language contradiction or ensure that generic representative staging is editorially appropriate. Role inference is heuristic; real narration/source fixtures need editorial review. No real historical research or paid reviewer was run in this implementation.
- Sequence checks operate on available canonical specs and explicit years. They do not model every recurring person, object, damage state, sublocation, weather transition or dated fact. Approved legacy panels remain opaque rather than rewritten.
- Custom legacy scenes require a deliberate review step. Their original text is saved, but arbitrary free-form prose is not automatically converted losslessly.
- Tests include synthetic projects/provider mocks and the user's actual fully approved Halabja export. All seventeen approved panels, approval memory, settings and API usage survived real UI import, save/reload and backup download. This completed project does not test unfinished real-project planning. The new service-worker browser test uses a mobile viewport and the actual old worker, an interrupted upgrade, a successful upgrade and offline reload. Exact approved fields, including ENDING and THUMBNAIL, survive loading a synthetic Core 4 saved backup. This is not a physical Android-device certification. Audit-journal quota failure and simultaneous-tab audit behavior are tested; full-library quota recovery and concurrent project edits remain unverified.
- Same-origin tabs now coordinate using Web Locks and a persistent audit journal. This is not server-wide idempotency: different devices/browser profiles do not share it. The journal retains the latest payload per project/stage, not an unlimited history of every edited version. Browser storage deletion loses that history. Browsers without Web Locks/secure crypto are blocked before spending audit credits.
- Rendered output was not generated or assessed. The compiler requests visual constraints; a downstream generator's compliance is not established by prompt tests.
- This change retains legacy paths outside the supported mode. It is not a complete elimination of legacy architecture across every studio/output format.

Next work: test an unfinished real Core 4 export without approving or spending credits; review disaster narration and scene fidelity; test on the actual installed Android app and real exported projects; decide whether broader modes and server-wide idempotency are release requirements. Use mocks/local validation first. Do not call paid AI/video APIs, push to a deployment-triggering remote, merge or deploy without explicit authorization.

## Rollback

Production was never changed; there is nothing to roll back remotely. For local comparison, create a separate worktree at the restore commit, preserving the development branch:

```sh
git worktree add ../ld-autopilot-core4-restore restore/pre-core5-2026-10-12
```

Do not reset or delete the development branch. Export any test/project browser data before switching app versions. Older code may drop optional Core 5 fields when resaving; retain the exported backup. If a later explicitly approved deployment is reverted, restore the old application bundle and its matching cache version together, and restore browser project data only from a reviewed backup. Never reopen approved panels as part of rollback.

## Continue in another ChatGPT session

Open this repository on `dev/core5-architecture-2026-10-12`, read this file and the latest git log, inspect git status, then rerun the local tests. Preserve all approved panels. No paid API calls/video generation and no merge/deploy are authorized. Do not rely on WIP db9f7e2 alone. The net `CORE5_REVIEW_2026-10-13_SEMANTICS.patch` delivered alongside this report includes the continuation fixes. On a clean checkout at the restore commit, create a new development branch, run `git apply --check /path/to/CORE5_REVIEW_2026-10-13_SEMANTICS.patch`, then `git apply /path/to/CORE5_REVIEW_2026-10-13_SEMANTICS.patch`. This patch does not require applying the defective WIP commit. The local branch and restore branch have not been pushed.

## Actual Halabja backup verification — October 13 checkpoint

The uploaded completed Halabja project exposed a real migration defect: the Core 4 family planner's `apply`/`writeScene` paths recognized only its runtime frozen snapshot, so imported approved P3–P14 scene descriptions could be rewritten. Both paths now respect the shared Core 5 ownership guard. A forced-planning regression covers persisted ownership even without a Core 4 snapshot. This is a shared planner fix, not a Halabja panel override.

The runtime preservation helper also handles approved THUMBNAIL image prompts consistently with ENDING. The modified planner, compatibility bootstrap, project-locks loader and runtime have new asset URLs. The atomic 5.0.3 PWA shell now explicitly includes the dynamic Core 4 bootstrap dependencies, preventing the obsolete planner from being selected by its old cache URL. The offline test requires those dynamic modules to load.

`tests/core5-production-backup.cjs` accepts `CORE5_BACKUP_PATH` and runs the actual import and Download backup UI in an isolated browser. Every original field of all 17 approved stages is compared, plus project settings, continuity, API usage and approval memory. It verifies exact preserved prompt bytes, save/reload, completed Smart Continue remaining inert and original file SHA-256. All API routes are blocked and counted. The raw backup is not included in git or the patch.

Run with the same Chromium environment as the other browser tests:

```sh
CORE5_BACKUP_PATH='/path/to/project-backup.json' node tests/core5-production-backup.cjs
```

Evidence: `halabja-backup-test-results.txt`. Original backup SHA-256: `b51b40d3a4313ac8639d14a5f7228c3973c19a11123ff46b298ad6bac3bdf433`.

This confirms preservation of this completed production, not historical correctness of newly planned scenes or physical-device readiness. No paid APIs, push, merge or deployment are authorized. Core 5 remains local to the development branch; the live website is not updated by this work. The latest checkpoint commit is discoverable with `git log -1` after applying/committing the supplied net patch.

## Actual Aberfan backup verification — subsequent October 13 checkpoint

The user's Aberfan export is also fully approved (17/17), including P12–P14; it is not an unfinished-project fixture. The import test exposed another shared lifecycle defect: saved approved panel modes are `image` while the global project lock says `text`. Legacy `setAllMode` changed those modes and temporarily revoked Done, allowing downstream scene/prompt writers to mutate protected data. Mode synchronization and ensureTextMode now preserve approved cards through the shared protection predicate, including the project-locks fallback. Approved saved mode takes precedence over automatic project-wide synchronization. No panels are reopened to make a test pass.

A separate Smart Continue session-reset path erased P5/P9's saved smartReadySignature. Its project-wide cleanup now skips approved cards. The PWA regression includes a synthetic approved mixed-mode P5 with a retained signature, compares every saved field, and verifies successful offline loading. Cache shell 5.0.4 and updated asset URLs carry these fixes.

`aberfan-backup-test-results.txt` records a successful real import/reload/Download backup round trip: all original approved fields, exact preserved prompts, approval memory, project settings and API usage unchanged; completed Smart Continue inert; zero API requests/page errors. Original SHA-256: `1907ed15ca8759858e1ed369cbd9cee6384197320020c979fb48fe29c461dfa8`. The uploaded source is unchanged and excluded from git.

Both actual exports supplied so far are complete. Unfinished workflow coverage remains the existing synthetic browser scenario with mocked audit responses. A real unfinished export and physical Android preview remain unverified; do not represent this checkpoint as production merge approval. No push, merge, deployment or paid API calls occurred.

## Full new-project lifecycle and preview preparation

Added `tests/core5-new-project-browser.cjs`: an isolated synthetic project with all 16 canonical panels initially unapproved, complete narration approved through its existing button handler, all local scene-review forms applied, then Smart Continue from HOOK through ENDING. It verifies one mocked audit per panel, reuse on repeated prepare, exact copied/audited/approved bytes, frozen earlier approvals and save/reload persistence. Result: PASS, 16 mock requests, zero paid requests/page errors. See `new-project-test-results.txt`, which also captures the reviewed StageSpecs. No uploaded production panel was reopened.

Content review did not fully pass. `SCENE_REVIEW.md` identifies role-priority gaps for support/displacement and generic aftermath, underspecified representative staging and ENDING's default date. These are explicit remaining merge blockers, not disproved by passing lifecycle tests. No new production fixes were made in this checkpoint.

Prepared `scripts/core5-preview.cjs`, a localhost-only mock server with a visible warning banner, mocked audit only and all other provider routes disabled. Its banner/mock/blocking routes passed a local smoke test. `ANDROID_PREVIEW.md` describes desktop and Android USB forwarding. No internet preview URL exists; no physical Android test, push, merge or deployment occurred. The original 92-test suite and prior backup/PWA tests passed at the preceding implementation checkpoint; this checkpoint adds a passing workflow browser test and preview tooling without changing production runtime files.

## Latest: semantic review fixes and final local verification

This section supersedes the open semantic findings from the preceding checkpoint. Compiler 5.0.2 adds reusable active-support role matching, a dedicated aftermath role, free rejection of unresolved hazard/context placeholders and an undated post-event ENDING default. The local scene editor refreshes old draft semantics for explicit review and avoids asynchronous toggle resets. Approved prior-version records retain frozen bytes; old approved canonical specs do not block later panels through cross-version validation. No approved panel is migrated or reopened.

Tests now include 98 passing local automated cases and the full sixteen-panel browser flow with asserted expected roles and concrete scene fields entered through the local form. Existing browser deduplication/Smart Continue tests, PWA upgrade tests and both supplied completed backup preservation tests are retained. See current result files. All provider responses are mocks or blocked; paid calls remain zero.

`SCENE_REVIEW.md` records the resolved findings and remaining semantic limits. The implementation is a candidate for controlled preview, not blanket proof of historical correctness or every acceptance criterion in every mode. Physical Android testing remains the outstanding manual release check. Existing Core 4 projects outside disaster Shorts/text-video/anime/B&W retain their legacy workflows. The primary live app and both original backups remain unchanged.

No merge or deployment has been authorized. Use the latest SEMANTICS patch only on the original restore baseline, not stacked with earlier cumulative patches. The accompanying continuation ZIP contains that patch, this handoff and the test/review documents so only one archive needs to be transferred to another chat.

# Core 5 workflow completion — 2026-10-14

## Checkpoint
Development branch: `fix/core5-workflow-completion`.
Base/restore commit: `b22f3047aaf2553ea66bc1f8c20041fb3114ec80`.
Restore branch (local and GitHub): `restore/pre-core5-workflow-completion`.
Workflow/PWA asset build: **5.1.0**. StageSpec/compiler contract remains **5.0.2**; existing approved records remain opaque and unchanged.
The prior release already corrected the paid audit policy to evaluate Core 5 semantics rather than demand legacy named prompt sections (PR #6).

## Root causes and before/after
| Before | Change |
| --- | --- |
| Shared metadata and runtime inferred titles differently; parenthesized London title lost the region | One shared metadata parser, explicit saved values first; existing dash-title behavior retained |
| New Core 5 panels acquired generic legacy scene-bank text | New Core 5 cards retain their actual saved scene instead of injecting a legacy fallback |
| Pollution used generic disaster staging requiring per-panel review | Reusable narration-motif recipes for atmospheric pollution: coal heating, emissions, trapped air, visibility, transport, indoor exposure, illness, loss, clearing, accountability and legacy |
| Later explicit year could be lost or confused with event year | Narrated 1956 becomes scene year while event year remains 1952; unspecified later periods remain unspecified; contradictory explicit year fails locally |
| Sixteen separate forms needed before Smart Continue | **Prepare episode scenes · FREE** validates the complete candidate sequence before applying missing/invalid scenes |
| Re-preparation risked unnecessary audit invalidation | Valid reviewed scenes, conclusive failed verdicts, audited prompts and approved panels are retained; unchanged payloads never automatically retried |
| Replacing an obsolete draft could lose comparison data | Persist original legacy comparison plus replacement history containing scene, StageSpec and audit record |
| Narration importer could stay inside hidden legacy section after opening/building a project | Remount existing narration controls into Stage 0 on production build; Stage 0 stays outside visual-panel persistence |
| Phone had no visible update check | Check app update / Load available update; save before user-triggered reload, no storage clearing; complete shell cached atomically |

## Behavior and limits
The preparation action makes no network requests. It preserves reviewed valid custom scenes and all approved panels. It only replaces missing/invalid unapproved staging, keeping history. It validates the candidate episode before any write. It does not auto-approve or auto-render. Smart Continue still performs the existing paid audit when the user chooses to proceed, and stores an immutable prompt for copy/approval.

This is deterministic representative staging, not unrestricted historical reasoning. Unrecognized motifs with placeholder actions still stop at free preflight for local review. A genuinely incorrect or unsupported scene must still be reviewed. Existing NEEDS FIX records for an unchanged valid scene remain cached; this release does not silently spend credits retrying them. The atmospheric-family change makes the user's old generic pollution spec invalid and gives it a concrete replacement on explicit preparation.

The existing project contract uses a static illustration for ENDING. HOOK and P1–P14 remain exactly ten seconds, one shot, grayscale 2D historical anime, 9:16, no generated text. No change to approved panels or image-mode projects.

## Verification
- Node regression suite: **108 passed, 0 failed**. Includes Aberfan P12/P13/P14, other disaster families, locks/timing/camera, chronology, payload integrity, audit reuse, reviewed/approved preservation and replacement history.
- New Great Smog browser regression: actual full-narration paste/import, one preparation button, no per-panel edits, 16 stages via Smart Continue, 16 mocked audits, repeated preparation/audit reuse, audited/copied/approved byte equality, reload persistence, zero page errors. Incomplete narration is blocked without partial StageSpecs.
- Existing full Aberfan browser workflow: all 16 stages, audit reuse and approved reload persistence pass.
- Actual service-worker regression: interrupted installation retains Core 4 cache; complete upgrade to current shell, visible update check, mobile-size offline reload and approved-field preservation pass.
- User-supplied Aberfan and Halabja backups: actual UI import/export/reload, **17 approved panels each**, all existing saved stage fields and project metadata unchanged; zero API requests. Preparation on these completed projects is inert. Original files unchanged.
- Development used **zero paid AI/video calls**. Browser audits were mocked; these tests do not guarantee every future live model verdict or video output.

Early browser harness runs exposed a genuine Stage 0 remount defect, which was fixed. Chromium initially needed a second launch after a temporary font-extraction error. These unsuccessful runs are not counted as passing tests.

## Files
- `ner-core-5.js`: shared metadata, pollution motifs, explicit scene chronology validation.
- `ner-core-5-runtime.js`: whole-episode planning/preparation, preservation/history.
- `ner-core-5-editor.js`: one-step free action and status.
- `video-modes.js`: shared metadata, no generic scene injection, Core 5 saved-scene status.
- `app.js`: backward-compatible persistence for optional scene replacement history.
- `narration-smart-continue.js`: Stage 0 remount.
- `app-update.js`, `index.html`, `service-worker.js`: user-controlled update UI and versioned complete shell.
- `tests/core5-episode.test.cjs`, `tests/fixtures/great-smog.json`, `tests/core5-episode-browser.cjs`: new regression coverage.
- `tests/core5-runtime.test.cjs`, `tests/core5-production-backup.cjs`, `tests/core5-pwa-browser.cjs`: preservation and upgrade coverage.

## User steps
Open the existing project after loading build 5.1.0. Under **HOOK → P14 shared setting**, tap **Prepare episode scenes · FREE** once. Review the generated scenes, then use Smart Continue normally. No new production is necessary. Never clear app data to update.

## Rollback
Preserve/export the current production backup first. Revert the release merge with `git revert -m 1 <workflow-merge-sha>` on a rollback branch and deploy that reviewed revert, or restore the deployment associated with base `b22f3047aaf2553ea66bc1f8c20041fb3114ec80`. Use a NEW service-worker cache/asset version for any rollback release so cached clients receive it. Do not reset main destructively or delete browser storage. Old code ignores the optional history field; retain the export if its history is needed after rollback.

## Merge recommendation
Safe for release based on the local regression and backup-preservation gates above, under the user's existing conditional merge/deploy authorization. Remaining verification: actual Android user session and live provider behavior. No claim that all possible narratives or generated video artifacts are automatically correct. Deployment SHA and live-byte verification are recorded separately after release.

# Core 5 action detail — workflow build 5.1.1

User request: improve prompt specificity inside NER Studio, rather than replacing an audited prompt manually in chat. A subjective 9–9.5 rating is a design target, not a measured guarantee of rendered output.

## Changes
- Optional structured choreography in StageSpec: starting state, prop, movement, completed state, representative room detail, continuity, visibility and synchronized sound.
- Domestic coal-heating narration motif provides one loaded shovel, fixed hand grip, single gravity-driven pour, empty-shovel end pose, contained fire, period-appropriate clothing and ordinary furnishings. The rule depends on narration/family, not P1 or London specifically.
- New scenes using this motif receive the detail automatically, with 0–2 establish, 2–7 action and 7–10 hold.
- Existing scenes and audited prompt bytes remain unchanged unless the user explicitly selects **Review Core 5 scene → Refine action details · FREE**.
- Refinement only applies to matching supported staging. Custom scene/action/cast combinations are retained instead of being silently overwritten. Unsupported motifs report no supported refinement.
- Old scene, StageSpec and audit record are archived in persisted history. Refined prompts lose old audit readiness and require a new audit on the next user-triggered Smart Continue. No automatic API requests.
- Repeated refinement is inert. Approved panels reject refinement. Optional choreography binds to the action/setting/cast; stale contracts fail local validation. Manual review edits to these fields explicitly remove incompatible choreography.
- Core 5 card status now refreshes after audit/spec changes and uses canonical readiness, resolving the misleading “needs building” message after a successful audit.

## Compatibility
Compiler contract stays 5.0.2. Old StageSpecs without the optional detail compile to exactly their previous bytes (checked against a saved baseline fixture). New fields are covered by full canonical payload equality and the existing audit API validator. Only changed payloads need new audits. ENDING remains a static illustration. Existing mono/anime/9:16/text locks and approved records remain protected.

## Validation
113 local tests pass, including old prompt byte equivalence, chronology/family regressions, complete choreography validation, old audit archive, one new audit after refinement, no duplicate audit, custom staging preservation and approved immutability.

Browser gates: explicit refinement of an already audited coal scene, full 16-stage Great Smog Smart Continue, manual scene review, actual service-worker upgrade/offline reload, and supplied production-backup preservation. Audit providers are mocked or blocked. Zero paid AI/video development calls. Live video appearance and real model verdicts cannot be guaranteed by these tests.

## Restore point
Base: 9cd7b8e877f935733dbc3f7f8abadaa1095d9da7.
Restore branch: restore/pre-core5-action-detail.
Development branch: fix/core5-action-detail.
Rollback: revert the release merge on a new branch and deploy with a fresh service-worker/asset version; preserve/export production state and never clear app data. Restore old drafts from saved replacement history if deliberately reverting a refined scene; do not reopen approved panels.

## User flow
Load workflow build 5.1.1. For the existing unapproved P1, open Review Core 5 scene, select Refine action details · FREE, review the displayed action details, then Smart Continue once for its new audit. Render the exact audited/copied prompt; approve after reviewing the rendered result. New supported scenes receive the detail during normal free episode preparation.

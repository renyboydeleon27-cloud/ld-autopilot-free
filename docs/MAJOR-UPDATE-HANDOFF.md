# NER Studio major update — continuation checkpoint

Owner: REN. Language: Tagalog. Repository: renyboydeleon27-cloud/ld-autopilot-free.
App: https://ld-autopilot-free.vercel.app/
Checkpoint release: v3.50.0, first batch of shared public-health policy fixes.
Find the commit that last changed this file; do not assume main still points to it.

## User goal
Stop repeated paid retries caused by contradictory templates. Fix shared generation rules across P1–P14, not one hardcoded panel at a time. Preserve existing approved work. REN may move from Work GPT to ordinary ChatGPT when usage runs out. Resume from repository files, not claims of hidden memory.

## Implemented in this checkpoint
- public-health-policy.js: shared public-health policy, narration-keyword scene grouping, known-conflict checks; no AI/network.
- video-modes.js: public-health-specific audio, intensity, camera, motion, weather, damage, cast, chapter context and continuity sections. No automatic natural-disaster impact timeline. Natural-disaster branch remains available.
- Scene suggestions for public-health projects now select a group from narration content instead of P number alone. This is a conservative keyword heuristic, not semantic fact verification.
- Smart Continue payload removes irrelevant generic progression, unsourced preceding scene and stale shared detail for public-health audits. Current scene and narration remain in payload.
- Local checks reject known contradictions before paid Smart Continue audit calls and when rebuilding prompts.
- Approved Xylazine P2 veterinary room (1000270314.mp4) remains in its dedicated branch.
- Existing approved cards are not automatically unchecked. Old unfinished prompt signatures will need a local rebuild.

## Validation
Run from repo root:
node --test tests/public-health-policy.test.cjs tests/xylazine-approved-p2.test.cjs
node --check video-modes.js
node --check smart-continue.js
Tests cover shared rules for P1–P14, natural-disaster fallback, scene grouping, conflict detection, zero audit calls on known conflict, and approved P2 scoping.
No paid live AI run or end-to-end phone/Flow test has been performed for this batch. Passing unit tests does not establish 10/10 visual quality.

## Remaining major-update work
1. Run full DOM/browser prompt-building regression with project fixtures for Xylazine P1–P14 and representative earthquake/tornado/avalanche projects, including selected Anime/Real Human and color modes. Current tests cover shared rule assembly, not all external decorators.
2. Inspect LDProductionDNA, LDStoryFormat and continuity decorators on the final exported prompt. If they reintroduce conflicts, correct their source; do not weaken the audit.
3. Check narration-to-scene synchronization for already saved KEEP CURRENT SCENE cards and visible scene-role headings. Do not silently overwrite deliberately edited/approved scenes. Keyword grouping only governs scene suggestions.
4. Verify the exact prompt audited is the prompt displayed/copied. Earlier screenshots had an audit describing packets/worker while copied prompt lacked them. Root cause not proven.
5. Audit manual AI Assist and server endpoints: current local paid-call guard covers Smart Continue audit, not every API route or all possible contradictions.
6. Fix misleading UI “Ready to mark done” while AI audit says NEEDS REVIEW. Keep completeness and approval status distinct.
7. One controlled P3 live test after local checks, then assess whether additional changes are warranted. Avoid repeated paid retries without diagnosing the failure.

## Locks and scope
- Final episode narration ALWAYS includes HOOK. Flow NO VO means no generated clip voice, not silence in final editing.
- Paste labeled HOOK + P1–P14, OK distributes and approves narration. ENDING is automatic:
  Please like, share, and subscribe for more Living Disaster stories.
- Preserve project T2V/I2V, Anime/Real Human, color/grayscale settings and approved HOOK concepts.
- Xylazine trial: Philadelphia, 2020; New LD Format — Trial v1. P2 visual 1000270314.mp4 approved. Audio was not independently verified here.
- Do not invent named medical encounters, diagnoses from appearance, drug transactions, clinical outcomes, or natural-disaster destruction for a public-health topic.
- User authorized GitHub updates/deployment. Fetch current main and read AGENTS.md if present before changes. Do not overwrite newer work.
- No subagents unless user explicitly requests them.

## If resumed in regular ChatGPT
If GitHub/code tools are available, inspect this repository and continue remaining work. If unavailable, ask REN for this handoff and the relevant source files, produce reviewable patches, and state that you cannot push/deploy. Never claim background execution or deployment without tool evidence.

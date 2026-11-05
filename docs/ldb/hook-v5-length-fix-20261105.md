# HOOK V5 prompt regression fix — 2026-11-05

Scope: isolated code-only patch based on PR #61 head `09ade8a23f4f3f752afb6a92cb7cc2522277d549`. The original uncommitted local batch was unavailable in the current working environment; this patch does **not** include or claim to replace that batch.

Root cause: the real-packager HOOK image prompt was 1,501 characters before prep and 2,243 after V5 prep, exceeding the Cloudflare 2,048-character bound by 195. It also contained contradictory generated notes: the older "lantern in front of torso, never beside" versus V5 "hanging beside thigh".

Fix: replace only the expected older generated PHYSICAL COMPOSITION note span with the V5 lock, preserving the approved storyboard bytes, original source job object, and all other 16 scenes. For malformed or duplicated note markers, fail closed. The true packager output is expected to be about 1,488 characters after V5. Synthetic test prompts without notes still receive an appended V5 lock.

Verification: run the existing real-packager HOOK V5 test; added assertions that redundant/contradictory notes are absent and source job remains immutable. Include the Worker offline compilation gate in the isolated pull request. No live Cloudflare inference, paid activation, production merge or actual Drive/Gmail delivery.

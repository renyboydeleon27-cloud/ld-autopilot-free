# Core 5 onset progression fix — 2026-10-17

Candidate workflow release: 5.1.9. Branch: fix/core5-onset-progression.

## Root cause
The atmospheric-pollution recipe matched `trapped` before the generic fog branch. The actual P4 narration contains `trapped pollution`, so it received the P3 rooftop recipe despite the correctly inferred onset role. Existing validation checked structure and chronology but did not reject this mismatch.

## Changes
- Prioritize fog onset staging by semantic role before background keywords. No hard-coded P4 or London special case.
- Use a street-level rear three-quarter composition, slowly worsening distant visibility, and one resident stopping beside a doorway. No time-lapse or instant smoke wall.
- Reject the exact known legacy rooftop/onset mismatch during local preflight, including when P3 is unavailable.
- Reject identical setting/action across a cause-context-to-onset sequence. Shared location alone is allowed.
- Validate unapproved scenes before returning cached prompt bytes from Copy/build.
- Existing explicit Prepare episode scenes action archives old draft/spec/audit record, replaces invalid unapproved scenes, and leaves approved scenes unchanged. No automatic migration or paid audit.
- Update release display and changed asset URLs; regenerate hashed PWA shell. Compiler schema/version remains unchanged to preserve valid existing prompts.

## Verification
- 139 automated tests pass, including exact P3/P4 reproduction, stage-number-independent planning, invalid P4 blocked without API calls, old draft archival, idempotence, and approved P3 preservation.
- Real Chromium whole-episode test: HOOK through ENDING, 16 mocked audits, exact audited/copied/approved bytes and reload persistence. Zero paid calls.
- Real Chromium exported backup tests: Great Smog, Aberfan, Halabja; approved fields and exact prompts preserved across import/save/reload; original backups unchanged; zero API requests and page errors.
- Real cached-worker upgrade/offline test passed; approved fields preserved and zero API calls.
- PWA shell integrity and git diff whitespace checks pass.

## Limits and rollout
No physical Android test performed for this candidate. This fixes the demonstrated selector collision and exact duplicate progression, not arbitrary semantic inconsistencies. Approved panels are not rewritten. After deployment, explicitly prepare/review the unapproved scene; scene edits invalidate its prior audit and may require a user-triggered new paid audit. Journal records and duplicate-spend protections remain intact.

Not merged or deployed. Explicit deployment approval remains required by the user's handoff.

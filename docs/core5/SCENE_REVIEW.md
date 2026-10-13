# Core 5 scene-content review — updated October 13

The specific findings from the previous checkpoint have been addressed with shared rules, free validation and regressions:

| Previous finding | Current behavior |
| --- | --- |
| Aid supported displaced families classified as displacement | Active aid/support verb patterns select response; flight without an active aid action still selects displacement |
| Community aftermath classified as cause-context | Dedicated aftermath role and settled, non-escalating representative staging |
| Placeholder hazard/context scenes passed validation | Free validator blocks unresolved placeholder setting/action before compilation or API payload creation; local review must provide concrete details |
| Undated ending reset to event year | Static ending defaults to unspecified post-event time, with no invented exact scene year |
| Opening the review form could reset typed fields | Form refresh occurs synchronously on opening, avoiding a delayed toggle reset |

Compiler version is 5.0.2; shell assets use 5.0.5. Previous approved records remain frozen and copy their original prompt bytes, even across compiler versions. Unapproved old specs require explicit local review; no automatic paid migration/re-audit occurs. Approved old specs are opaque for cross-version sequence checks.

The full synthetic browser test checks expected roles for all sixteen panels. P12 evidence, P13 accountability and P14 later remembrance remain distinct; P2 retains its explicit flashback. For unresolved scenes, the test supplies concrete representative setting/action through the review form. These are test staging choices, not researched claims about historical people.

Limits: role inference remains heuristic, not a complete language understanding system. The validator catches the known placeholder patterns and typed contradictions; it cannot prove every prose instruction or historical fact. User/editorial scene review remains required. The tests do not establish real generated-video quality or physical Android usability. No paid AI or generation was used.

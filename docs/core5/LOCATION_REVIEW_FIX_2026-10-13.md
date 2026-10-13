# Core 5 location review correction

Reported Android issue: Great Smog P1 was blocked locally by missing location, a false source identity mismatch, and a legacy scene requiring review. No paid calls occurred.

Root causes: runtime consumed raw optional continuity fields while planner normalized them; legacy title inference only understood dash-delimited titles; review UI exposed scene setting but not historical region/year.

Changes: normalize Core 5 metadata once; infer missing fields from explicit title structures (including disaster of/in location (year)); preserve explicit metadata; expose historical region/year; refresh stale review identity; validate before saving reviewed metadata. Custom legacy scenes still require explicit review. Approved cards remain immutable. No compiler or audited prompt changes. PWA cache version 5.0.6.

Rollback base: 595dea97f338245b9f7697b4561227296346a34a, remote branch restore/pre-core5-location-fix-2026-10-13. Revert this fix through a normal reviewed commit; do not clear localStorage.

Validation: 101 unit tests passed; Great Smog browser review/Smart Continue/reused audit/approved reload passed (one mocked audit); PWA failed-install/full-update/offline/approved preservation passed (zero API requests). Full HOOK–ENDING workflow passed on diagnostic rerun: 16 mocked audits, exact prompt equality, all approvals retained after reload. Initial run timed out on browser reload; no production change was made to conceal it.

Limitations: title inference supports explicit structures only; unknown locations still require user entry. The saved open-plaza scene is deliberately not silently discarded. User must review its replacement to match narration. Physical Android recheck is pending.

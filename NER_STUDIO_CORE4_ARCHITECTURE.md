# NER Studio Core 4 — Architecture Reset

Version: 4.0.0 foundation

Restore point before Core 4: `e879300bfbf5137279b4375621c05ad39255292d`

## Goal

Make normal Living Disaster Book production topic-agnostic and stop panel-by-panel JavaScript hotfixing. Approved narration/research is the factual boundary; the local engine plans structure, continuity, scene variety, prompt lifecycle and validation without inventing facts.

## Core pipeline

`Sources / Smart Narration -> Source-to-Story Map -> StageSpec -> Family/Event Scene Planner -> Prompt Compiler bridge -> Local Validator -> AI Audit -> Frozen Flow Prompt -> Approval -> Final Audit`

## Non-negotiable invariants

1. One structured StageSpec per P1-P14.
2. Event pack overrides family planning only when an event genuinely needs special chronology.
3. Scene variety compares structured fingerprints, not arbitrary words from negative prompt text.
4. A Flow-ready prompt is frozen; local rebuild calls return the same prompt until readiness is revoked.
5. Approved narration is the factual boundary. Missing facts are flagged, never invented.
6. Service worker performs cache/offline/update only. It must never inject or concatenate business-logic JavaScript.
7. Diagnostics and final local audit use zero API calls.
8. Approved panels are not silently rewritten.
9. Panel-specific hotfix files are compatibility shims, not the normal architecture.
10. Every major migration keeps an explicit restore commit.

## Modules

- `ner-core-4.js` — registry, StageSpec, semantic roles, structured fingerprints, handoff logic, prompt freeze, local validation.
- `ner-family-planner-v4.js` — universal family-aware scene planner for topics without dedicated event packs.
- `halabja-event-panel-engine.js` — first dedicated Core-4-style event pack, P1-P14.
- `ner-core-bridge.js` — one runtime bridge around Video Modes; applies family/event planning and Core 4 prompt contract.
- `ner-source-story-v4.js` — narration-to-story semantic map and chronology/repetition checks.
- `ner-project-store-v4.js` — atomic canonical Core 4 snapshot during migration from legacy localStorage layers.
- `ner-core-diagnostics.js` — self-diagnostics UI, local only.
- `ner-final-audit-v4.js` — deterministic final project integrity audit.
- `service-worker.js` — cache/offline/update only.

## Family coverage

Core 4 recognizes earthquake, tsunami, avalanche, landslide, cyclone, tornado, flood, volcano, wildfire, chemical/WMD, public-health, industrial/technological, biological/agricultural, plus a generic evidence-driven fallback.

## Event pack rule

Do not create `event-p6-hotfix.js`, `event-p7-hotfix.js`, etc. If an event needs special handling, create or update one event pack with structured P1-P14 specs. If multiple events share the need, fix the family planner/core instead.

## Release rule

Repo changes are not considered runtime-confirmed until a fresh PWA session shows the expected Core version and one real panel passes local preflight -> audit -> Flow-ready -> approval without prompt mutation.
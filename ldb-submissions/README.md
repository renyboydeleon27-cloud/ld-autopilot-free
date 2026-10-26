# LDB Auto Studio — free, manually approved prompt package inbox

IMPORTANT: The main NER STUDIO repository is PUBLIC. Files committed here can
be read by anyone. Do not put private or unpublished scripts, personal data,
API keys, or confidential storyboards into this folder. The one-file process
is only appropriate for episodes that you explicitly agree may be public.

## Mobile workflow (single file)

1. Open LDB Auto Studio, import a complete HOOK + P1–P14 + ENDING +
   THUMBNAIL storyboard JSON, and review all 17 scenes.
2. Tap Approve storyboard. The browser downloads approved_bundle.json with
   the exact JSON text and local SHA-256 approval. No per-panel approval.
3. If the episode is suitable for a PUBLIC repository, create one unique
   episode directory below ldb-submissions on the feature branch containing
   the worker, e.g. episode-2026-10-26. In the GitHub web UI:
   - Create ldb-submissions/episode-2026-10-26/README.md to create directory.
   - In that directory use Add file > Upload files, upload approved_bundle.json,
     and commit to the feature branch.
4. GitHub Actions runs LDB approved FREE prompt production automatically.
   Open the completed run to retrieve the artifact
   ldb-approved-prompt-packages (available for 30 days).

You can also send the approved_bundle.json in a ChatGPT conversation and
explicitly instruct ChatGPT to upload to the GitHub episode inbox using your
connected GitHub account. This action requires an active conversation and
does not make the app itself a background uploader.

## Legacy two-file path

Older approved storyboards may instead supply BOTH storyboard.json and
approval.json in the episode folder. Do NOT mix bundle and legacy files for
the same episode. The worker rejects ambiguous submissions.

## What the worker actually does

On the GitHub runner it verifies that the approved storyboard matches the
exact SHA-256 approved text, has 17 stages, and that adjacent panel visuals
are not identical. It exports:
- 17 image prompt text files (HOOK, P1–P14, ENDING and THUMBNAIL).
- 15 exact-ten-second Flow prompt files (HOOK, P1–P14).
- 16 narration text files (HOOK, P1–P14, ENDING).
- Honest audit/README showing that actual rendered images/videos = ZERO.

This is free PROMPT PACKAGING, not autonomous image/video production.
Nothing is uploaded to Google Drive, no Gmail is sent, and no paid API is used.
No Android, InShot, Flow, Story Book, or Video DNA files are changed.

The SHA-256 check is an accidental-change safeguard, NOT a tamper-proof
digital signature; a person with GitHub write access could spoof a bundle.
Before enabling real production, use a PRIVATE authentication/approval backend,
an actual authorized renderer, quota/cost gates, and destination permissions.

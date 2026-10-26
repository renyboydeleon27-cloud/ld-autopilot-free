# LDB Auto Studio — approved storyboard inbox (development)

The workflow in .github/workflows/ldb-free-production.yml can continue on
GitHub-hosted Actions after the browser/phone is closed, but ONLY after the
approved input files have been committed to a branch containing that workflow.

## Mobile upload / handoff

1. Open the LDB Auto Studio reviewer and import the 17-scene JSON.
2. Review all 17 scenes; select Approve storyboard to export approval.json.
3. Select Export original storyboard.json to save the exact bytes that were
   hashed when approval was issued. Do not edit, reformat, or resave it.
4. In a new episode subdirectory under ldb-submissions/ upload BOTH files:
   storyboard.json and approval.json. Example:
   ldb-submissions/episode-2026-10-26/.
   GitHub's web UI can create the directory through Add file > Create new
   file with ldb-submissions/episode-2026-10-26/README.md as a placeholder,
   then Add file > Upload files within that directory. Commit the two
   input files to the branch containing the workflow.
5. Open Actions > LDB approved FREE prompt production and inspect run logs.
   The ldb-approved-prompt-packages workflow artifact is available from a
   successful run. Uploaded artifacts are retained for 30 days.

Or upload both files in ChatGPT and explicitly ask to put them in the GitHub
inbox. A connector-mediated GitHub write can perform that upload in an active
chat, but ChatGPT does not retain a permanent GitHub write session without a
new user request.

## Absolute production boundary

- The approval means approve the reviewed storyboard as a whole.
  It does not entail per-panel approvals for prompt packaging.
- The workflow does NOT render images, create MP4 videos, open Google Flow,
  call paid APIs, upload to Drive, or send Gmail completion emails.
- Prompts include strict B/W historical anime for the 16 narrative stills.
  Thumbnail gets the explicitly permitted full-color override.
- HOOK and P1-P14 get fifteen continuous exactly-10-second Flow prompt drafts,
  but NO synthesized audio/video.
- Individual scene narration is copied if present; it is never fabricated.
- production_audit.json lists missing motion/narration and pending final
  production steps. Status remains PROMPTS_ONLY until real output is verified.
- The SHA-256 approval checksum prevents accidental editing after approval,
  but it is not a digital signature. Repository write-access controls protect
  the queue. A person with write access could fabricate both input files.
- No .env, API keys, secrets or recipient addresses belong in this repository.
- PR #53 remains draft until CI/review and a conscious merge decision.

## Sample expected structure

    ldb-submissions/
      README.md
      episode-2026-10-26/
        storyboard.json
        approval.json

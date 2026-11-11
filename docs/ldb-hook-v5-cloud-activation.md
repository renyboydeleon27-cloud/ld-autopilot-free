# HOOK V5 background execution — activation gate

**Status:** Development-only Draft PR #66. It does **not** authorize inference, Cloudflare billing, deployment to production, Google Drive delivery, Gmail, or merging into `main`.

## Available workflow modes

1. `preflight_only` (default) runs on `main` only, with no secret access, repository checkout, Cloudflare API, image generation, or project changes. Its sole purpose is to prove that a manual GitHub Actions job runs in the cloud and writes a step summary after the phone is closed.
2. `render_one_hook` can run only from `feature/ldb-image-acceptance`, only when explicitly selected by repository owner `renyboydeleon27-cloud`, only with explicit PUBLIC artifact consent, and only after GitHub Environment review. The one-shot gate validates the current UTC day, Free-plan attestation, job identity, and same-day prior-run inventory. The existing HOOK V5 script rechecks live Cloudflare usage, Worker state and quota before any Worker mutation or inference. One image is *not* visual approval.

## Safe first background test WITHOUT modifying main

A **separate**, already-registered workflow exists on the default branch: `LDB approved FREE prompt production` (`.github/workflows/ldb-free-production.yml`). The **development-branch revision** adds a special isolated dry-run job; ordinary packaging is skipped for that value. This is **not** a cloud inference test and does not prove the V5 render executor is operational.

1. Open https://github.com/renyboydeleon27-cloud/ld-autopilot-free/actions/workflows/ldb-free-production.yml while signed into the repository-owner GitHub account.
2. Select **Run workflow**. Choose **Branch: `feature/ldb-hook-v5-cloud-executor`** — not `main`.
3. Set the existing **episode_folder** input to the exact text `hook-v5-free-preflight`.
4. Confirm **Run workflow**. Only the preflight job should run; package generation should be skipped. The run summary will state NO-GO for HOOK V5 rendering.
5. A GitHub Actions job can continue independently of the phone/browser, subject to GitHub service limits. This is not a ChatGPT background task.

This path does not create, merge or push any file on `main`. If GitHub doesn't display the branch/run inputs or the run is blocked, **stop**; do not use the default branch with an altered value as a workaround. Current ChatGPT GitHub connector can inspect workflow results but cannot dispatch a fresh run directly.

## Next: verify the real HOOK V5 package without spending credits

Background-run #111 completed successfully on the registered workflow. To rehearse the **actual Lake Nyos approved package** in the same GitHub cloud environment, use the exact same registered workflow at https://github.com/renyboydeleon27-cloud/ld-autopilot-free/actions/workflows/ldb-free-production.yml.

Select branch `feature/ldb-hook-v5-cloud-executor` and set the existing `episode_folder` input to `hook-v5-offline-readiness`. This selects a separate, owner-only job added to that development branch. The normal prompt-packaging job is explicitly skipped for that sentinel, and the already-tested `hook-v5-free-preflight` input is unchanged.

The offline job checks the actual approved 17-scene Lake Nyos render package, its original storyboard SHA-256, the revised HOOK V5 prompt length/visual locks, and preservation of narration, Flow prompts and all other scenes. It only calls local Python and Node; it receives no Cloudflare/Google credentials, sends no provider requests, generates no image, and never asserts visual approval or 69-file delivery success.

Passing this job is **a necessary readiness check, not permission to run inference**. For live generation, the standalone protected workflow still requires reviewed branch registration, GitHub Environment safeguards, same-day Workers Free plan verification, and an owner-authorized one-image test.

## Separate, not-yet-registered V5 workflow

`.github/workflows/ldb-hook-v5-one-shot.yml` remains a **Draft** on the development branch. GitHub requires a new `workflow_dispatch` workflow file to exist on the default branch before it becomes independently selectable in Actions. We have **not** registered this standalone executor on `main`, because a push to `main` could also trigger a Vercel production build. The safe preflight above avoids that risk. No render execution or production release is authorized.

## Additional requirements BEFORE `render_one_hook` is enabled

- The reviewed executor implementation must also be present on the `feature/ldb-image-acceptance` branch. Do **not** assume that registering a workflow on default branch makes it available from the acceptance branch.
- Create a protected GitHub Environment named `ldb-hook-v5-free`; restrict permitted branches to the exact acceptance branch, require owner review (or a separate reviewer if available), and confirm the reviewer rules are satisfiable for the account.
- Store a least-privilege Cloudflare token as **Environment secret** `LDB_HOOK_V5_CLOUDFLARE_API_TOKEN` directly in GitHub UI. Do not paste the token into a chat or repository file. Environment variables are `LDB_HOOK_V5_CLOUDFLARE_ACCOUNT_ID`, `LDB_HOOK_V5_ENV_REVIEW_APPROVED`, `LDB_WORKERS_PLAN`, and `LDB_FREE_PLAN_VERIFIED_DATE`. The date is the **UTC** date of the actual dashboard verification and is not a permanent approval.
- Verify an eligible Workers Free plan again at execution, fresh neuron usage, current model authorization, and that the isolated V5 Worker is absent. The earlier screenshots are historical evidence, not a permanent billing authorization.
- Select `render_one_hook`, provide matching UTC date, opt in to the PUBLIC repo's one-day review artifact, and approve the protected environment only after reviewing the exact run and commit.
- If any gate is missing, **NO-GO**. Never add a paid-billing fallback, loosen target branch/owner checks, or reuse a failed run to attempt another image.

## What is *not* implemented

The NER AUTO STUDIO browser button is still **read-only Cloudflare telemetry**. It does not dispatch a GitHub workflow or perform AI inference. An authenticated app-side dispatch service is **not** connected; avoid placing personal access tokens in the browser. Real visual approval, 17-scene acceptance, and 69-file Google delivery remain separate later milestones.

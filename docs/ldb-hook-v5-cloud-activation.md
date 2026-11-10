# HOOK V5 background execution — activation gate

**Status:** Development-only Draft PR #66. It does **not** authorize inference, Cloudflare billing, deployment to production, Google Drive delivery, Gmail, or merging into `main`.

## Available workflow modes

1. `preflight_only` (default) runs on `main` only, with no secret access, repository checkout, Cloudflare API, image generation, or project changes. Its sole purpose is to prove that a manual GitHub Actions job runs in the cloud and writes a step summary after the phone is closed.
2. `render_one_hook` can run only from `feature/ldb-image-acceptance`, only when explicitly selected by repository owner `renyboydeleon27-cloud`, only with explicit PUBLIC artifact consent, and only after GitHub Environment review. The one-shot gate validates the current UTC day, Free-plan attestation, job identity, and same-day prior-run inventory. The existing HOOK V5 script rechecks live Cloudflare usage, Worker state and quota before any Worker mutation or inference. One image is *not* visual approval.

## Before an owner can test `preflight_only`

- This workflow file must exist on GitHub's default branch (`main`) for `workflow_dispatch` registration. GitHub's Actions tab will not show it as a runnable workflow while it exists only on a draft feature branch.
- Follow the repository review/release process before deciding to register it on `main`. The read-only mode makes no Cloudflare calls, but **a merge into `main` is still a code change**. Never merge PR #61/#65/#66 merely to force registration without review.
- After a reviewed registration, visit **Actions → LDB V5 one-HOOK owner-approved cloud executor → Run workflow**. Select `main` and leave `mode=preflight_only`. The date and public artifact consent are not needed. The Actions run summary, not a chat/browser tab, records the result.
- The manual background run continues in GitHub's infrastructure if the mobile app closes, subject to normal GitHub Actions limits.

## Additional requirements BEFORE `render_one_hook` is enabled

- The reviewed executor implementation must also be present on the `feature/ldb-image-acceptance` branch. Do **not** assume that registering a workflow on default branch makes it available from the acceptance branch.
- Create a protected GitHub Environment named `ldb-hook-v5-free`; restrict permitted branches to the exact acceptance branch, require owner review (or a separate reviewer if available), and confirm the reviewer rules are satisfiable for the account.
- Store a least-privilege Cloudflare token as **Environment secret** `LDB_HOOK_V5_CLOUDFLARE_API_TOKEN` directly in GitHub UI. Do not paste the token into a chat or repository file. Environment variables are `LDB_HOOK_V5_CLOUDFLARE_ACCOUNT_ID`, `LDB_HOOK_V5_ENV_REVIEW_APPROVED`, `LDB_WORKERS_PLAN`, and `LDB_FREE_PLAN_VERIFIED_DATE`. The date is the **UTC** date of the actual dashboard verification and is not a permanent approval.
- Verify an eligible Workers Free plan again at execution, fresh neuron usage, current model authorization, and that the isolated V5 Worker is absent. The earlier screenshots are historical evidence, not a permanent billing authorization.
- Select `render_one_hook`, provide matching UTC date, opt in to the PUBLIC repo's one-day review artifact, and approve the protected environment only after reviewing the exact run and commit.
- If any gate is missing, **NO-GO**. Never add a paid-billing fallback, loosen target branch/owner checks, or reuse a failed run to attempt another image.

## What is *not* implemented

The NER AUTO STUDIO browser button is still **read-only Cloudflare telemetry**. It does not dispatch a GitHub workflow or perform AI inference. An authenticated app-side dispatch service is **not** connected; avoid placing personal access tokens in the browser. Real visual approval, 17-scene acceptance, and 69-file Google delivery remain separate later milestones.

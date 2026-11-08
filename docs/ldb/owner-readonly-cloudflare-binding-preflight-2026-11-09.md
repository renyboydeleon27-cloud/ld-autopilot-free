# Owner-controlled isolated Runner → Vault preflight — November 9, 2026

A safe separate read-only CLI mode now verifies account ownership and
Worker metadata WITHOUT needing, loading or transmitting the Runner
owner secret. This separates the Cloudflare GET-only preflight from
the owner-authorized authenticated test.

Only in a trusted owner-controlled terminal, configure the existing
environment variables CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and
LDB_PROBE_URL. Keep all tokens in local environment / secret storage:
NEVER paste them into ChatGPT, code, GitHub commits, or browser query
parameters. For the first step, LDB_RUNNER_SECRET is NOT necessary.

Run:

`node scripts/ldb-live-binding-probe.mjs --owner-approved-readonly-preflight`

The CLI performs five fixed Cloudflare API GET requests: isolated Runner
and Vault settings, exact account Workers subdomain, Runner workers.dev
publishing flag, and Vault workers.dev/Preview URL publishing flags.
The Vault MUST have both enabled=false and previews_enabled=false.
It rejects unsafe delivery/AI flags and any hostname not owned by that account. It outputs
PASS/FAIL with a static reason only (no secrets, provider body or
raw bindings). No request to the isolated Runner Worker is made.

When the preflight passes, the separate existing opt-in command is:

`node scripts/ldb-live-binding-probe.mjs --owner-approved-readonly-probe`

For this second mode ONLY, LDB_RUNNER_SECRET is also required in the
trusted environment. It first REPEATS the five GET preflight checks,
and sends the owner Bearer secret to the exact verified isolated host
only after passing them. The CLI rejects missing/both mode flags.

Both modes also accept the optional flag `--safe-evidence-json` after the
explicit owner approval mode. On success, the CLI prints **only** an
allowlisted JSON report (mode, operator UTC time, host/settings checks,
authentication result, and explicit Google/production OFF values). It never
copies the Cloudflare token, Runner secret, probe nonce, provider response,
raw bindings or host URL. On failure it prints only a static reason code.

Example after reviewed isolated Workers are deployed and local variables
have been configured:

`node scripts/ldb-live-binding-probe.mjs --owner-approved-readonly-preflight --safe-evidence-json`

`node scripts/ldb-live-binding-probe.mjs --owner-approved-readonly-probe --safe-evidence-json`

The JSON is an **operator-observed report**, not a signed or independently
verified attestation. Its local timestamp does not establish deployment
identity or freshness of Cloudflare state beyond the actual successful probe.
Never share environment variables, terminal history or raw response logs.

Neither mode deploys Workers, enables production, consumes inference
quota, or calls Google Drive/Gmail. Read-only verification alone
DOES NOT establish billing quota, images, Gmail inbox receipt,
or end-to-end readiness.

This commit changes only the draft PR and offline tests. Real
operator preflight/authenticated probe has NOT been run.

# Trusted local authenticated probe - account ownership safety (Nov 8 2026)

A security gap existed in scripts/ldb-live-binding-probe.mjs:
the URL regex pinned the isolated Worker NAME but accepted that name
under any Cloudflare workers.dev account subdomain. A misconfigured
LDB_PROBE_URL could leak the owner Bearer credential to an attacker
running an identically named Worker under their own subdomain.

The new local-only, opt-in script performs these steps BEFORE sending
the Runner owner credential:
1. Enforce fixed Cloudflare account ID and require a read-only API token
   in the trusted local process environment;
2. GET two exact isolated Worker settings endpoints and require all
   production-inference/Google delivery gates to be safely disabled;
3. GET the fixed account's Workers subdomain, verify it matches the
   proposed HTTPS Runner host exactly, and confirm the exact Runner
   script has its workers.dev subdomain enabled, while the isolated Vault
   has both workers.dev and Preview URLs disabled;
4. Only then issue one owner-authenticated GET to the isolated
   /delivery-bridge-probe path, rejecting redirects, non-200 status,
   oversized or malformed response, and unexpected fields.

All five preflight requests are read-only; the final Runner GET merely
checks the isolated Worker-to-Worker probe. No Worker deployment,
Google OAuth, Drive, Gmail, image generation or production toggle occurs.

The CLI REQUIRES an explicit
  --owner-approved-readonly-probe
argument and already configured local environment variables:
CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, LDB_PROBE_URL,
LDB_RUNNER_SECRET. Do not put secrets into argv, committed files,
ChatGPT or the web preview. Only operators who control these secrets
may run it from a trusted terminal. Existing quality Vault is untouched.

This commit includes mocked offline tests but does NOT run the live
authenticated test: the necessary owner secret is not available here.
A successful live test proves only authenticated Worker binding, not
Google Drive/Gmail delivery or production readiness.

Cloudflare owner-subdomain GET reference:
https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/

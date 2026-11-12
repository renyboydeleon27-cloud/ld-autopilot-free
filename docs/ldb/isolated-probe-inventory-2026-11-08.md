# Read-only isolated binding probe inventory (Nov 8, 2026)

The existing Cloudflare read-only diagnostic already retrieves the
account's workers/scripts listing as part of the HOOK V5 preflight.
This batch reuses that same listing without an extra Cloudflare call
to report whether the TWO separate isolated Worker names are present:
ner-ldb-runner-binding-probe and ner-ldb-vault-binding-probe.

Responses contain only two sanitized booleans or null when the list
is unavailable. No Worker URLs, script source, secret values, OAuth
settings or unrelated Worker inventory is exposed. The mobile Studio
Cloudflare status panel shows PRESENT or NOT LISTED and explicitly
states that it is not a live authenticated binding test or permission
to deploy.

This does not activate Workers or Google OAuth. A missing isolated
Worker is not an authorization to create one, particularly while the
Cloudflare Workers Free plan is unverified and the original quality
Google Vault has VAULT_ENABLED=true. Manual owner verification
remains mandatory before any deployment or inference.

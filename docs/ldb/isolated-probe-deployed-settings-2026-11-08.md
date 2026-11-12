# Isolated Worker settings read-only verification — November 8, 2026

Both isolated binding-probe Worker names appeared in the Cloudflare script
inventory, but their actual deployed settings were not verified. This
patch performs two fixed GET /workers/scripts/{name}/settings requests
for the existing isolated Runner and Vault, without any Worker mutation.

The checker compares the deployed metadata with the reviewed probe
contract: Runner GOOGLE_VAULT service target must be the isolated
Vault, Durable Object binding classes must match, the Runner must have
RUNNER_ENABLED=false, FREE_PLAN_CONFIRMED=false,
DELIVERY_BRIDGE_ENABLED=false and BRIDGE_PROBE_ENABLED=true.
The Vault must have VAULT_ENABLED=false,
DELIVERY_BRIDGE_ENABLED=false and BRIDGE_PROBE_ENABLED=true.
Unexpected binding names, credentials, AI bindings, missing settings,
wrong-target services, and errors all prevent a green metadata result.

Response bodies are discarded. Only fixed safe status names and booleans
reach the browser. Metadata matches DO NOT prove service-to-service
authenticated transport: no owner bearer token or probe secret is read
or transmitted, and authenticationVerified is ALWAYS false.

This new check is attached to the existing manual, protected Vercel
development-only "Check delivery setup" button. It uses Cloudflare
read-only settings APIs, never Google OAuth, Drive, Gmail, paid inference,
production toggles, or a Worker PUT.

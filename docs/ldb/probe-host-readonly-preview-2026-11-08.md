# Isolated Worker workers.dev account ownership — preview preflight

November 8, 2026. This change adds a read-only preflight to the
existing manually triggered development-preview delivery diagnostics.

The fixed Cloudflare account GET /workers/subdomain and the fixed
isolated Runner GET /workers/scripts/ner-ldb-runner-binding-probe/subdomain
are queried with the existing server-side read-only API token.
The checker ensures that the account has a DNS-label-compatible subdomain
and the named isolated Worker is explicitly workers.dev enabled.

The browser receives only sanitized booleans, HTTP status codes and
NO hostnames, URLs, account subdomains, Cloudflare response bodies or tokens.
It does not invoke the Worker, send a Runner owner credential, contact
Google, mutate Cloudflare, generate images or authorize production.
It is only a metadata precondition for a separately controlled,
owner-approved authenticated health test from a trusted terminal.

If either GET is 403, inaccessible, oversized, malformed or reports
disabled, the preview fails closed and explicitly warns against sending
owner credentials. The existing owner-only local script still independently
rechecks account ownership and Worker metadata before sending its secret.
Neither script enables Google Drive/Gmail or confirms the Workers Free plan.

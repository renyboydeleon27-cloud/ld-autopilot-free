# Isolated Cloudflare owner probe: strict hostname and credential separation (Nov 9, 2026)

This is an offline-code safety update to the OWNER-OPT-IN diagnostic CLI.
Both metadata-only and authenticated modes now require the exact
workers.dev account label to match the preview inspector's strict
DNS-label constraints (1–63 characters, alphanumeric at both ends).
An invalid candidate hostname is rejected before any network call.
An invalid subdomain returned by Cloudflare metadata is rejected
before a Runner secret can be sent to the isolated Worker.

The authenticated mode now rejects accidental reuse of the Cloudflare
control-plane API token as the Runner Bearer secret BEFORE preflight or
network access. Supplying one token for both credentials risks sending
a Cloudflare API key to the workers.dev Worker host.

Regression tests inject token reuse, leading/trailing hyphen,
multi-label and oversized account subdomains, asserting no
secret-bearing call or success status is produced. The existing
four-GET read-only preflight and one owner-approved authenticated GET
remain the only permitted paths.

Nothing accesses Cloudflare live credentials in GitHub CI. The live
Runner → Vault authenticated health check has NOT been performed;
there has been no Worker deployment or production activation. Google,
Gmail, image inference, quota and actual Drive receipts remain unverified.

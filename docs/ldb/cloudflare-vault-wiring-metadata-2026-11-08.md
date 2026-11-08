# Cloudflare Google Vault wiring — read-only live metadata
November 8, 2026.

The Google Vault OAuth variables in Vercel are configured on a different
preview branch, feature/ldb-production-quality. This branch MUST NOT
duplicate or expose them. However, the Cloudflare Workers API allows a
safe, independently authenticated GET-only check of the actual deployed
quality Runner and Google Vault Worker settings.

New preview-only delivery readiness endpoint additionally queries the
FIXED names ner-ldb-runner-quality and ner-ldb-google-vault-quality:
GET /accounts/{id}/workers/scripts/{name}/settings. The exact account
and both Worker names are hard-coded. No browser-specified target is
accepted and the request bodies are size-limited.

Returned data includes only:
- whether both Worker metadata reads were permitted;
- whether Runner's GOOGLE_VAULT service binding points to the expected
  quality Vault Worker;
- whether both DELIVERY_BRIDGE_ENABLED flags and VAULT_ENABLED are false;
- minimal HTTP statuses and booleans.

Cloudflare settings responses can carry sensitive binding data, but the
server never logs, returns or persists the raw response; it discards all
unknown fields. The checker sends NO Worker modifications, OAuth requests,
Google Drive/Gmail API calls, AI inference, secret reads or emails.

Even a full metadata match is **NOT** proof that service binding actually
resolves or that Google OAuth works. The authenticated Cloudflare
service-binding health probe and actual Drive/Gmail receipt verification
must be performed separately, with deliberate access controls and
disabled production gates.

Cloudflare API endpoint:
https://developers.cloudflare.com/api/resources/workers/subresources/scripts/

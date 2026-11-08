# Cloudflare Vault wiring diagnostic: specific, sanitized reasons

The Cloudflare Workers script-and-version settings API documents
GET /accounts/{id}/workers/scripts/{name}/settings and its
"service" and "plain_text" binding shapes:
https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/script_and_version_settings/

The initial live metadata check returned HTTP 200 for the quality Runner
and quality Vault Workers, but an overall unverified status. We cannot
claim that the service binding is valid or that a Vault safety flag is
disabled based on those HTTP statuses alone.

This batch reports *only fixed literal reason codes* for:
- Runner-to-Vault service binding: TARGET_MATCH, MISSING, DUPLICATE,
  WRONG_TYPE, WRONG_TARGET, ENVIRONMENT_SCOPED, METADATA_UNAVAILABLE;
- Three relevant safety flags: EXPLICIT_FALSE, EXPLICIT_TRUE, MISSING,
  DUPLICATE, WRONG_TYPE, UNEXPECTED_VALUE, METADATA_UNAVAILABLE.

The old ambiguous flag behavior treated every non-"false" plain-text
value as an enabled flag; now only exactly "true" is EXPLICIT_TRUE,
and unexpected values remain unverified. Strings containing secrets,
unknown Worker names and raw config never appear in diagnostic output.
The UI is read-only and still NO-GO even on a metadata match.

This is a better diagnosis, NOT a deployed Worker fix. Neither Worker
script, service binding nor Google OAuth configuration was modified.
No Google Drive file, Gmail message, or AI generation was attempted.

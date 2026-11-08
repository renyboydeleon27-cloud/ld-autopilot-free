# Safe Cloudflare service-binding environment normalization

Cloudflare Workers settings represent service binding targets using a
service name and optional environment. The isolated binding-probe
metadata returned an environment-scoped service binding even though
the target Worker name, delivery gates and namespaces matched.

The checker now accepts ONLY the literal production environment for
the exact isolated target ner-ldb-vault-binding-probe, or an omitted
environment. It rejects other environments, wrong targets and nondefault
entrypoints. The existing quality Vault checker is not relaxed.
The sanitized response can say PRODUCTION or UNSPECIFIED, never reveal
untrusted provider values.

Cloudflare documents the optional service target environment in:
https://developers.cloudflare.com/api/typescript/resources/workers/subresources/scripts/subresources/script_and_version_settings/

The metadata check is not a live authenticated Worker-to-Worker probe.
No Runner secret, Vault secret, OAuth token, image inference or Google
API operation is used. The Workers have not been redeployed.

An unrelated Core 5 PWA workflow failed on a local project-storage
browser wait timeout on the preceding commit, while the five other
checks passed. This is reported rather than suppressed.

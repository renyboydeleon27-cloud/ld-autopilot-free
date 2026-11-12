# Strict isolated Cloudflare probe allowlist - Nov 8, 2026

The isolated Runner and Vault binding probe Wrangler configs now have a
fully reviewed allowlist, preventing arbitrary top-level settings, paid AI
bindings, KV/R2 bindings, routes, cron triggers, unknown plaintext variables
and credential copies. Compatibility date, required service identity,
Durable Object migration and fixed Cloudflare account are pinned.

The pre-existing gate only rejected some unsafe flags. The new gate
rejects any unexpected field or variable even when all known flags
remain set to safe values. Offline regression tests cover 17 additional
malicious/mistaken configuration changes.

No Worker deployments, Cloudflare credential changes, AI inference,
Google Drive uploads or Gmail sends were performed. Current live Vault
remains untouched, pending operator review and Free plan confirmation.

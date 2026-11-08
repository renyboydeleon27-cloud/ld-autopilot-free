# Cloudflare readiness semantic consistency gate — November 8, 2026

The preview-only JSON projector already strips raw bindings and secret-like
values. However, a future inspector implementation could accidentally claim
a metadata "safe" status with contradictory flags or missing evidence.
That could mislead an operator into thinking a Worker is configured safely.

This batch adds an independent consistency gate within the output sanitizer:
- quality Vault "MATCHES_OFF" requires HTTP 200 on both Workers, positive
  binding evidence, and the exact expected three OFF flags;
- isolated "MATCHES_SAFE" requires HTTP 200, the expected service target,
  correct Durable Object classes, safe Runner/Vault flag combinations,
  no unexpected bindings, and consistent secret-binding status;
- probe host "READY" requires both HTTP 200 metadata reads and confirmed
  Cloudflare account subdomain plus isolated Runner publishing.

Contradictions are rejected and return the existing static unavailable
fallback, preserving independent results from other checks. No provider
exception, token, URL or raw binding is passed back to mobile. Even a
fully consistent metadata snapshot does NOT authenticate transport,
confirm Workers Free billing, generate any images, upload 69 files, or
send four Gmail milestones.

New offline regression cases inject unsafe flags, wrong service targets,
missing namespaces, bad HTTP statuses and forged ready booleans. No
Cloudflare Worker or production setting has been changed.

# Isolated binding-probe authentication setup, metadata-only (Nov 8, 2026)

The two isolated Cloudflare Workers already exist and their deployed
service binding, Durable Object classes and production-off flags have been
verified using read-only /settings calls. Actual authentication needs:
- Runner's owner-only RUNNER_SECRET;
- Runner's GOOGLE_BRIDGE_PROBE_SECRET;
- Vault's GOOGLE_BRIDGE_PROBE_SECRET (same shared credential configured
  independently on both Workers).

These are required by the real bridge-probe Worker source. No authentication
GET was sent in this batch, and the Cloudflare account token on the current
Vercel branch is NOT a substitute for the Runner owner secret.

The read-only /settings metadata response is reused. The checker looks
ONLY for exact approved secret binding *names* and type secret_text.
It does not return or log the binding object, text, key or secret name.
The frontend receives only fixed status codes, not credentials. An
absent name in settings means NOT LISTED, not definite absence, because
some APIs may omit sensitive bindings. An invalid/duplicate type
prevents a safe-metadata status. A listed binding never proves that
the secret is valid, matching between Workers or that authenticated
service-to-service transport actually works.

Cloudflare also documents /secrets list, but its schema can include
secret text. To avoid processing such data, this batch intentionally
does not call that endpoint or any secret GET. It neither changes the
isolated Workers nor the active quality Vault.

NEXT: operator-controlled authenticated GET /delivery-bridge-probe from a
trusted environment using the existing Runner owner secret. Never paste
credentials in ChatGPT, GitHub, URLs or public previews. Leave image,
Google Drive and Gmail production OFF.

# NER AUTO STUDIO — Cloudflare status on mobile (preview only)

Development branch change, dated 2026-11-08. The existing, manually
callable SSO-protected Cloudflare diagnostic worked with production inference
disabled, but returned JSON unsuitable for the Android-first Studio UI.

A new visible "Check Cloudflare · READ ONLY" control appears in
ldb-auto-studio.html. It makes exactly ONE same-origin GET to the existing
preview-only /api/ldb-cloudflare-readiness function after the owner taps it.
It does NOT store secrets or include any external Cloudflare calls in
browser code. No calls happen on page load.

The panel shows daily reported neurons where available, explicitly
marks HTTP 403 Billing Read as plan UNVERIFIED, and points to the official
Cloudflare dashboard for owner confirmation. Even when telemetry reports
zero usage, the screen NEVER authorizes image generation or a production
release. A detected V5 Worker remains untouched. Outside the protected
preview, the diagnostic is unavailable and the UI stays NO-GO.

Regression tests verify no automatic requests, one GET-only request on
click, no inference routes, 403 guidance, invalid response rejection,
and private error redaction. Vercel preview deployment/CI are separate
from real Cloudflare HOOK V5 visual acceptance and Google/Gmail delivery.

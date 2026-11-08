# LDB delivery diagnostic partial-failure isolation — Nov 8, 2026

Previously, the preview-only delivery readiness handler ran three
Cloudflare metadata checks in a single try/catch. If any one inspector
rejected, the response could discard successful findings from the other
checks. That made a live integration blocker harder to identify.

The new collectLdbReadOnlyDeliverySnapshot executes three explicitly
registered inspectors independently using Promise.all and per-inspector
fail-closed handling. A failed or malformed inspector returns a static
blocked status WITHOUT provider exception text or credentials.

The response includes a sanitized coverage indicator:
ALL_RETURNED, PARTIAL, UNAVAILABLE or NOT_CONFIGURED; each fixed check
reports RETURNED / UNAVAILABLE / NOT_CONFIGURED. RETURNED means only
that the inspected metadata response was safe to report, not that
Google OAuth, authenticated Runner-to-Vault transport or production
delivery succeeded. No additional calls to Cloudflare, Google or any
AI endpoint are introduced. A missing account token skips them all.

The Studio's manual read-only button now shows independent check
coverage while keeping 0/69 Drive and 0/4 Gmail live receipts and
production NO-GO. No live Worker was modified.

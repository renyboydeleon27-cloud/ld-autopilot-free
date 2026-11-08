# One-time nonce verification for isolated Runner → Vault probe (Nov 9, 2026)

## Purpose
The previous operator probe used a fixed BRIDGE_AUTHENTICATED JSON reply.
A no-store response header alone cannot prove that the response came from
the *current* request rather than a replayed or synthetic acknowledgment.

## Implemented on draft PR #61
- The owner-only CLI generates a fresh 128-bit random hex nonce for each
  authenticated GET after the four Cloudflare ownership/settings preflight GETs.
- The CLI sends it in an X-LDB-Probe-Nonce request header (never URL/query).
- The isolated Runner checks the nonce and passes it over its fixed internal
  GOOGLE_VAULT service binding with a separate shared secret.
- The isolated Vault validates owner-independent service authentication, the
  exact GET path/method and the nonce before echoing the nonce in JSON.
- Both Runner and CLI verify an exact echoed nonce plus the expected shape.
  Missing, changed or extra fields fail closed.
- The operator-facing result deliberately omits the nonce and all secrets.
  Responses remain Cache-Control: no-store.
- All work remains authentication-only: no inference, Google OAuth, Gmail,
  Google Drive operations, production switch, or production Worker changes.

## Required real-world acceptance
This is a **source-code change**, not evidence of a live authenticated test.
Only the *isolated test Worker deployments*, under owner control, should be
updated to this matching version after read-only configuration review. Old
deployed probes will reject the new challenge contract until both sides
run the same code. Do not update or activate production/quality Workers.

The owner must run the separate metadata-only preflight in a trusted
credential environment first, then choose the authenticated probe. Tokens
must never be sent to ChatGPT, browser query strings, code or GitHub.
The real Runner → Vault exchange, 69 Drive assets, 4 Gmail milestones,
Free-plan quota and final release are **not verified by offline tests**.

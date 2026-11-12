# NER AUTO STUDIO — One-batch development checkpoint (2026-11-08)

Scope: PR #61 (feature/ldb-image-acceptance). This document is an
honest, read-only handoff; it does not authorize paid services.

## Safe code batch
- Cloudflare usage-report validator now requires a recent UTC timestamp,
  HTTP 200 for schema/usage, one selected account, a numeric neuron metric,
  a conservative remaining-quota buffer, and a verified isolated-worker list.
- V5 retry still requires preview branch, today's operator-confirmed Free
  plan, explicit one-HOOK flag, and verified disposable-Worker identity.
- GitHub Actions shows an explicit NO-GO boundary so a green CI badge is
  never mistaken for a finished 17-image episode.

## Single end-to-end acceptance gate
1. Dashboard operator confirms current Workers Free plan and UTC-day
   quota evidence. No inference if this information is missing or stale.
2. Isolated HOOK V5 must pass visual QA: truly extinguished lantern,
   moon outside frame, shoulder contacting post, period-accurate grayscale
   2D anime and identity fidelity. Preserve the existing rejected V5 evidence.
3. All 17 final images must be checksum-persisted and visual-review approved.
   Staging or raw generation alone is NOT approval.
4. Trusted server constructs exact 69-file plan (17 images + 52 text files);
   Google Drive confirms 69 unique IDs/checksums.
5. Gmail 30/50/70/100 milestones must be acknowledged and independently
   inbox-verified. A simulated SENT receipt is insufficient.
6. Owner checks STOP/resume, no duplicated image billing, integrity and
   final deploy readiness; only then consider production merge/release.

## Current claim boundary
PR remains development-only; no fresh HOOK V5 has been accepted. No
new image inference, verified full-episode Drive upload, live milestone
emails or production merge is claimed by this checkpoint. The final Google
Flow 10-second image-to-video renders still belong to the human operator.

## November 8 — Runner-side milestone single-flight fix
The runner previously read a milestone receipt, called Gmail, then wrote the
receipt. Two overlapping alarms could overwrite the confirmation in either
order. The runner now reserves an atomic durable CLAIMED checkpoint before
any notification, rechecks the trusted milestone inside the transaction and
again immediately before network I/O, and blocks later milestones while an
earlier send remains in flight. Only explicit retryable failures schedule a
retry; uncertain/claimed receipts never become invented SENT confirmations.
New concurrent-alarm, restart, STOP, error and ambiguous-transport tests were
added. Gmail Vault's independent at-most-once claim remains in force.

This is a development-only safety fix. No Gmail message was sent by these
tests; live 30/50/70/100 acceptance still requires actual receipts and inbox
verification. No provider inference, Google upload or production deployment.

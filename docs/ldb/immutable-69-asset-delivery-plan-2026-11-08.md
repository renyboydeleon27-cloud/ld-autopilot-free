# Trusted 69-file delivery plan immutability (Nov 8, 2026)

The approved production manifest previously froze the top-level object,
but not the assets array or the individual text-asset records. A queued
delivery could additionally receive a mutable caller plan that changed
while an asynchronous guard was verifying the current runner checkpoint.

This batch fixes both gaps:
- only approved asset fields are copied and frozen at source;
- the complete 69-asset array and top-level approved plan are frozen;
- ProductionDelivery.submit synchronously structured-clones and
  validates the whole plan before the first awaited transaction;
- the cloned records/array/plan are frozen before queueGuard executes;
- stored plan SHA-256 fingerprint now always corresponds to that
  isolated snapshot, even if the caller mutates its own plan.

New regression tests attempt to modify approved filenames, scene
metadata and checksums during a deliberately held queue transaction.
No Cloudflare inference, Worker modifications, Google Drive uploads,
Gmail notifications, or live production deployment are triggered.
All 69 real Drive receipts and four Gmail receipts remain unverified.

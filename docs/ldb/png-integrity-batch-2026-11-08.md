# One-batch PNG container integrity — 2026-11-08

Previously the candidate stage could save arbitrary text and label it
image/png if the uploaded SHA-256 matched the supplied hash. That meant the
read-only reviewer could receive a non-image pretending to be a valid PNG.

The new trusted backend verifies the 8-byte PNG signature, IHDR dimensions
(576x1024), valid 8-bit color mode, chunk boundaries and per-chunk CRC32,
nonempty IDAT, terminal IEND, and absence of trailing bytes. Check runs before
staging and when reading corrected candidates, batch review status and final
69-file queue. It does NOT fully decompress pixels or replace the independent
Pillow structural/grayscale audit or the human reviewer approval.

Offline tests use real CRC-valid portrait PNG fixtures instead of synthetic
text. They ensure corrupt or masquerading content cannot stage or queue.
No external generation, real Drive uploads, Gmail messages or live production
deployment were triggered.

Production remains NO_GO pending fresh Free-plan evidence, new HOOK V5 visual
acceptance, 17 genuinely reviewed images, 69 Drive receipts, and Gmail checks.

# LDB 17-scene private review package — 2026-11-08

## Purpose
The Runner already stores checksum-verified corrected candidates and exposes
private GET /internal/quality/status and GET /internal/quality/candidate/SCENE
endpoints. An independent reviewer still lacked a convenient way to compare
all 17 candidates in one place. This is a **read-only review interface**, not
an approval mechanism or a production deployment.

## Operator use after all 17 images are genuinely staged
Run locally (NOT as a Vercel build):
```bash
LDB_RUNNER_REVIEW_URL="https://ner-ldb-runner-quality.YOUR-SUBDOMAIN.workers.dev" \
LDB_QUALITY_REVIEW_SECRET="<set locally, never commit>" \
node scripts/ldb-review-package.mjs --read-only
```

The private tool requires a strict HTTPS Workers URL and the separate
reviewer credential from environment variables, sends 18 authenticated
GET-only requests, verifies the backend reports 17/17 staged with no
visual approval and no delivery, and checks every returned PNG against
the server's SHA-256 and PNG container structure.

Outputs in a new, non-overwriting local directory:
- `index.html` — mobile-responsive 17-image gallery
- 17 PNG files — original staged candidate bytes
- `manifest.json` — checksums and status
- `review-audit-draft.json` — explicit PENDING and reviewerVerified:false

The package does not contain an authentication token or issue a POST.
It cannot trigger AI inference, mark visual PASS, queue 69-file Drive
delivery, email milestones, or merge a production deployment. The
reviewer must inspect the actual content before any separate authorized
approval. The tools and test fixtures do not prove any real Lake Nyos
image exists yet; fresh Cloudflare Free-plan evidence is still required.

# LDB private review package atomicity and job-drift safety

Development-only batch, no AI usage or production activation.

### Incident prevented
The previous 17-image private review exporter created a visible directory
before completing all 17 downloads, and on an interrupted request it left
some private candidate PNGs on disk. It also never checked whether the
runner job changed during the download. A new job could make the exported
snapshot stale or inconsistent.

### Corrections
- Downloads to a unique, private hidden staging folder; only after **all**
  images and files are verified does an atomic rename publish the -ready-
  folder. Failure removes every incomplete candidate.
- Re-fetches the trusted reviewer status after 17 image reads (19 GETs
  total) and requires the same job digest and 17 scene SHA-256/byte
  records, with visualAudit still PENDING and delivery still OFF.
- Uses a bounded streaming reader; refuses any image response larger
  than the expected trusted byte count before buffering unbounded bytes.
- Adds .gitignore for the operator's default local gallery directory
  to avoid accidental public Git commits of unpublished artwork.
- Regression tests cover a successful 19-request package, interrupted
  image read cleanup, mid-download job swap, oversized image response,
  credential restrictions, and no POST/AI/Drive/Gmail effects.

### Remaining boundary
This is local review-package resilience, not proof of HOOK V5 image
quality or Google Drive email delivery. External Free-plan verification,
17 genuinely accepted images, 69 delivered files, and four real Gmail
milestones are still pending. Production remains NO_GO.

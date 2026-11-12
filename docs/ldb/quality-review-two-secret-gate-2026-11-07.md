# LDB image staging vs trusted visual approval — November 7, 2026

**Development-only fix on PR #61.** Staging corrected bytes and approving the 69-file Google Drive handoff previously shared the single \`QUALITY_IMPORT_SECRET\`. This allowed a staging client to submit a fabricated \`reviewerVerified:true\` audit with the same privilege. The source code treated the caller as a trusted backend, but the credential separation was missing.

Two independent, default-OFF privileges now apply:
- \`/internal/quality/image\` accepts only \`QUALITY_IMPORT_SECRET\` when \`RUNNER_ENABLED=true\` and \`QUALITY_IMPORT_ENABLED=true\`.
- \`/internal/quality/review\` accepts only the distinct \`QUALITY_REVIEW_SECRET\` when \`QUALITY_REVIEW_ENABLED=true\` **and** \`DELIVERY_BRIDGE_ENABLED=true\`; staging and review share no credential.
- Both secrets must be at least 32 characters and neither may equal \`RUNNER_SECRET\`; reviewer secret must also differ from importer secret. Both public Worker edge and Durable Object independently enforce the same checks.
- Only an authenticated trusted reviewer backend is allowed to submit \`approvedAudit\`; the app/browser must **never** receive the reviewer secret. Staging alone remains non-delivery-capable.
- The Wrangler production default includes \`QUALITY_REVIEW_ENABLED=false\`. All other production and billing safety flags stay OFF. No secrets are committed.

Added offline rejection and staging tests for credential confusion, missing secret, disabled flags, partial assets, and forged review. No new inference, real visual approval, Cloudflare deployment, Google uploads, Gmail sends, or production merge were performed. A trusted reviewer workflow still needs real visual validation and independent acceptance.

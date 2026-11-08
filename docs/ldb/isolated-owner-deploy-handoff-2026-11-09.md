# NER AUTO STUDIO — isolated Cloudflare owner deployment handoff (Nov 9, 2026)

## What this batch actually adds
`scripts/ldb-isolated-owner-handoff.mjs` is a strictly **offline-only**
review command for the two separately named Cloudflare binding-probe Workers.
It validates the exact static account/target/flag policy, checks the matching
one-time nonce contract in the owner CLI, Runner, Vault and Runner entrypoint,
then **prints** the owner sequence. It performs no deployment or network call.

From the reviewed repository checkout, run:

```bash
node scripts/ldb-isolated-owner-handoff.mjs --print-owner-steps
```

Any other command-line flag fails without using Cloudflare. GitHub CI now
validates the handoff and its tampered-target/nonce tests. No private variables
are read or echoed.

## Owner-controlled execution sequence
1. Review the two specific `wrangler.probe.jsonc` files and CURRENT deployed
   settings (including the current secret bindings) using Cloudflare's
   dashboard/read-only API access. Do not paste any credentials in ChatGPT,
   URLs, commits or workflow outputs.
2. From a trusted terminal, run the two local `wrangler@4 deploy --dry-run`
   commands printed by the script. Verify output targets and no paid bindings.
3. **Only after explicit owner approval**, update the two isolated Workers:
   Vault first, then Runner. These are real Cloudflare write operations;
   `--dry-run` alone does not update them. Do not substitute the
   `wrangler.jsonc` configs for the `wrangler.probe.jsonc` files.
   Review existing secret and Durable Object bindings carefully: deployment
   may change live configuration or require re-provisioning.
4. Confirm the isolated Runner's `workers.dev` hostname belongs to the fixed
   account. Use the separately opt-in metadata-only Cloudflare GET preflight.
5. Only if the metadata preflight passes, run the independently authenticated
   GET probe using the owner-managed Runner secret in the trusted terminal.
   The operator probe requires a fresh nonce round-trip between Runner and
   Vault. Successful evidence proves **only** this authentication path.

## Invariants and limits
The isolated probe configurations keep Runner, Free inference, Vault OAuth,
delivery and production off. The Vault must not be published on
`workers.dev` or exposed through Preview/Version URLs. The reviewed Vault
`wrangler.probe.jsonc` explicitly sets both `workers_dev: false` and
`preview_urls: false`; the live metadata preflight independently checks both. The static review rejects swaps with existing
`ner-ldb-runner-quality` and `ner-ldb-google-vault-quality`.

No owner test was performed in this batch, and neither Worker was deployed.
GitHub passing does **not** prove the Cloudflare authentication, 69 real
Google Drive files, 4 Gmail milestone receipts, or production readiness.

**Current release disposition: NO-GO.**

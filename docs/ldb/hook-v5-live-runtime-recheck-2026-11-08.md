# LDB HOOK V5 — live provider recheck at the execution boundary

## Why this fixes an actual risk
Previously, a HOOK V5 invocation could accept a syntactically valid
caller-provided JSON usage report (0 neurons, same-day timestamp) and
then proceed to the first Cloudflare Worker deployment without obtaining
live account data. A stale or forged JSON report was not a trustworthy
representation of usage at the time of deployment.

## New runtime check
After verifying the isolated preview branch, operator Free-plan
attestation, approved Lake Nyos HOOK prompt and saved usage report,
the V5 test function itself now runs Cloudflare's read-only provider
diagnostic with the server-side API token. It requires:

- Live account-scoped GraphQL usage telemetry, with conservative <=9000
  neuron bound and no decrease from the file's verified usage;
- No existing `ner-ldb-runner-quality-v5` Worker at the time of
  the check, even when the file said none;
- Same UTC-day query and a `READ_ONLY_TELEMETRY_CHECKED` status;
- No inference authorization granted by the diagnostic response;
- No positive evidence of a Workers Paid subscription.

All failures block **before any Cloudflare Worker PUT, POST /jobs,
render or cleanup DELETE**. These provider metadata requests are only
GET/GraphQL read queries. The cloud test itself is still explicitly
owner-gated and must not run without dashboard Free-plan confirmation.

## Limitations
This reduces the stale/synthetic-report gap but does not eliminate every
Cloudflare metering delay, token-administrator spoofing scenario, or
usage change after the check. A subscription API 403 is *not* proof of
Workers Free; user dashboard confirmation and explicit opt-in to one
isolated HOOK test remain required. No AI render or live delivery was
performed in this batch.

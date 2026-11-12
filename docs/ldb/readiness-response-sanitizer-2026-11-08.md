# Delivery diagnostics: explicit response projection (November 8 2026)

## Security boundary tightened
Previously the preview-only delivery readiness collector checked mandatory
safety flags but then forwarded the COMPLETE inspector result object into
the JSON response. If an inspector or provider SDK gained a new field,
a raw binding, unexpected note, or secret-like value could be forwarded
by accident even though the status and safety checks passed.

Every accepted Cloudflare result is now projected through
lib/ldb/readiness-response-sanitizer.mjs. Only explicitly enumerated
status values, finite HTTP codes, booleans and reviewed nested safe
enum fields are allowed. All raw provider objects, unknown bindings,
untrusted string values, unknown notes, and extra nested properties are
DISCARDED. No provider response is spread into the final snapshot.

The checker still reports independent quality Vault, isolated probe and
account-host results with partial-failure isolation, but NONE of the
outputs proves authenticated Worker transport, Google Drive or Gmail
delivery, AI usage permission or production readiness.

Regression tests inject fake secrets into nested bindings, notes,
unknown keys and status enums, and assert that response JSON never
contains those values. No Cloudflare worker, secret, OAuth token, Drive
file, Gmail message or production setting is modified.

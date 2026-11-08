# Google Vault update guard — deployed-state drift (Nov 8 2026)

## Confirmed read-only live finding
The existing quality Vault Worker has VAULT_ENABLED=true. Expected
GOOGLE_VAULT service-binding metadata and delivery gate flags are missing
from the quality Runner and Vault respectively. This is deployment drift
from the committed Wrangler configurations. It is NOT sufficient to
conclude whether Google OAuth is functioning or tokens are stored.

## Update script protection
Previously scripts/ldb-update-google-vault.mjs allowed an explicitly
flagged update against the existing quality Vault in any Vercel preview,
relying on keep_bindings to preserve secrets. That could overwrite an
OAuth-enabled Vault which may contain encrypted refresh credentials.
The real update script now requires the exact isolated development
branch and calls assertVaultUpdateSafety before any Worker PUT.

The immutable precheck verifies:
- exactly VAULT_ENABLED=false;
- exactly DELIVERY_BRIDGE_ENABLED=false, BRIDGE_PROBE_ENABLED=false,
  GMAIL_MILESTONES_ENABLED=false;
- an existing matching Durable Object with 32-character namespace ID;
- exactly one secret_text binding each for VAULT_KEY, VAULT_SECRET,
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.

ACTIVE VAULT or unverifiable flags always block. Post-update checks
ensure original namespace and safely disabled flags remain unchanged.
No operator override was added. Existing Vault credentials must not be
rotated or disabled merely to get these tests passing.

## Evidence and limitations
The preview delivery-readiness API exposes only a fixed safe status
code, never secret payloads, and mobile UI warns when a code update is
blocked for active Vault. Offline unit and source-order regression
tests verify the exact execution boundary. Nothing was deployed to
Cloudflare, no OAuth was used, no Google Drive files uploaded, no Gmail
messages sent, and no image inference called.

Next operator action: review active Vault separately, then use distinct
isolated Worker names/probes to validate wiring. Do NOT change the
current quality Vault until stored data and intended integrations
are understood and a controlled preservation plan exists.

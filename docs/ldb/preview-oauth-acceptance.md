# Preview OAuth and vault acceptance — 2026-10-30

Code commit: b0cfb1ccd4d75717858945d8490c6f56932026e3. Development branch only; production not merged or deployed.

- 51 Node and 23 Python tests passed (74 total).
- Vault provisioning deployment dpl_8UAFaVUha4VUrZDLT8Ff5QKJWUom READY.
- Sanitized live report: https://ld-autopilot-free-o0o0vlxiz-renyboydeleon-5731.vercel.app/report.json
- Dedicated SQLite Durable Object vault live. Unauthorized requests returned 401; replayed claim and invalid credential submission returned 409; token export route returned 404. Empty status confirmed no Google connection and deliveryReady=false.
- Preview application deployment dpl_D2p2nLjWMQbSgBQChfmGdVQpv8J6 READY: https://ld-autopilot-free-iik3z87dt-renyboydeleon-5731.vercel.app
- GET /api/ldb-google-start returned 302 to Google, with this deployment hostname in the callback. Callback without a session returned 400.
- Callback derives only from Vercel platform configuration in Preview, not request headers. Production callback remains fixed. No real authorization code exchange has occurred.
- Google client secret narrowed to feature/ldb-production-quality Preview. Independent vault encryption and service authentication secrets stored as sensitive variables; values never in source or reports. Cloudflare env scopes restored to production after provisioning deployment snapshot.

## User action required

Register this additional exact authorized redirect URI on LD AUTO WEB, preserving existing entries:

https://ld-autopilot-free-iik3z87dt-renyboydeleon-5731.vercel.app/api/ldb-google-callback

Then open this same Preview origin's /api/ldb-google-start in a signed-in browser and consent as the configured sender. This deployment-specific callback must be updated for any different preview hostname.

## Remaining limitations

Vault credential encryption is covered offline, but real saved refresh credentials and token refresh remain untested. No Google Drive file or Gmail message was created by this acceptance. Runner delivery integration, visual image acceptance, full episode STOP/resume and verified delivery remain incomplete. No paid plan or paid model API was enabled.

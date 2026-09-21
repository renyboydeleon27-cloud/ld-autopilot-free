# YouTube Sync — v3.21.1

Open `youtube-analytics.html` from the main LD AUTO page. This is an on-demand, browser-only integration using Google Identity Services. A Google OAuth Web client must be configured by the channel owner before real sync can work. No client secret, API key or backend is needed for the token flow used here.

## Owner setup

1. Create/select a Google Cloud project.
2. Enable YouTube Data API v3 and YouTube Analytics API.
3. Configure Google Auth Platform branding and external testing audience. Add the owner account to test users.
4. Configure `youtube.readonly` and `yt-analytics.readonly` scopes. Wider distribution may require Google's verification.
5. Create a Web application OAuth client. Authorized JavaScript origin: `https://renyboydeleon27-cloud.github.io` (no repository path). No redirect URI for this popup token flow.
6. The public Web OAuth Client ID is preconfigured in LD AUTO. Open YouTube Analytics, press Connect YouTube, choose the correct account/channel, then Sync Now. The Client ID field remains available for troubleshooting or replacement.

## Behavior and limits

- 7/28/90-day reports, ending yesterday in Pacific Time. YouTube can lag or omit unavailable dates; no synthetic zeros are added.
- Lifetime totals stay separate from period reports. Weekday summaries describe viewer activity, not optimal upload time.
- Title patterns use current titles and overlapping groups; they are descriptive, not causal scores. Recent uploads have shorter exposure.
- All available uploads are paginated (up to 10,000), video details batched in groups of 50, period video reports paginated by 200 rows.
- Only Client ID persists in localStorage. Access token and channel reports remain in tab memory. Disconnect clears reports and attempts Google revocation. Google account connections is the fallback for revoking expired grants.
- The service worker bypasses cross-origin requests, including authenticated Google APIs.
- No scheduled background sync, revenue reports, CSV import or exact first-24-hour snapshots in this version.

## Checks

Run `node tests/youtube-analytics.test.cjs` and `node tests/youtube-sync-flow.test.cjs`.
Tests cover date boundaries, pagination, missing metrics, safe title rendering, partial permission/report failures and token lifecycle using fixtures. Actual owner sign-in and API access must be checked after a valid OAuth Client ID is supplied; fixture tests do not establish a live channel connection.

# Core 5 Android preview — local test only

This is a local mock preview, not a deployed URL. Audit PASS responses are simulated; they do not establish historical accuracy or production approval. All other provider API routes are disabled. Use a dedicated test browser profile and imported copies. Do not import preview exports into your live production app.

On a computer with Node.js, from this repository's development branch:

```sh
node scripts/core5-preview.cjs
```

Desktop: open http://localhost:8765 in a fresh browser profile.

Android: connect your phone to that computer by USB, enable USB debugging, and use installed Android platform tools:

```sh
adb reverse tcp:8765 tcp:8765
```

Open http://localhost:8765 in Android Chrome. This address works on the phone only while USB forwarding and the computer's server are running. It is not an internet link. Use localhost rather than a plain HTTP LAN address, because Core 5 audit coordination requires a secure context/Web Locks. The preview does not install a service worker; offline-update behavior is separately covered by the automated PWA test.

Check the yellow MOCK banner first. Import a copy of the completed backup and confirm all Done marks remain after refresh. Create a separate test project, paste the complete narration, approve narration, lock text-video/anime/B&W, review the local Core 5 scene and use Smart Continue. Verify copy/paste, keyboard input, scrolling, approval persistence and progression to the next stage. Audit results here are mocks and no video is generated. Record any wrong panel, missing Done mark, lost text, unusable button or keyboard problem.

Stop the server with Ctrl+C. Remove USB forwarding with `adb reverse --remove tcp:8765`.

If only the phone is available, a separately hosted preview is needed; no preview deployment has been performed or approved. The live application remains unchanged.

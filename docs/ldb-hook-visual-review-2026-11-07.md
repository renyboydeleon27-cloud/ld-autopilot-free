# HOOK V5 visual review — November 7, 2026

The earlier isolated cloud run produced one HOOK image at 576x1024 and verified STOP before rendering, resume, and image checksum. This is not acceptance of an episode or delivery.

Raw SHA-256: 7b4a1e10483f6c8f1896c0b62636d4fb21db9a0150495effbdea4f3a43f021b6
Neutral grayscale candidate SHA-256: f7395e65373057b4a68f2f3c3c4ade1b816638a849a3fdcde08246cdb1d8199f

## Decision: rejected for production

The grayscale candidate visibly retains a bright lantern interior suggesting illumination, a visible moon disk, and a shoulder separated from the doorpost. Grayscale conversion fixes color only; it does not fix those composition errors. Do not approve or deliver this image.

## Prompt revision

Preserve the approved storyboard bytes and approval hash. Refine only the diagnostic HOOK still prompt: frame the doorway and hut without sky, describe charcoal-gray lantern glass with no white center, and specify shoulder contact with zero gap and weight resting against the post. Narration, Flow prompt, other scenes and production settings are unchanged.

Validation: 14 affected tests passed, including real-packager prompt length, approval preservation and isolated Worker cleanup. Prompt tests do not prove visual compliance.

## Live test prerequisites

The prior run predates cce9589's Worker deletion fix. Its isolated V5 Worker may still exist; the test deliberately refuses to overwrite it. Inspect current account state before rerunning, preserve evidence, and remove only a verified disposable V5 diagnostic when appropriate. Do not touch V4 or production Workers.

The user supplied Workers Free Active and 0/10k usage screenshots earlier on November 7. These are point-in-time evidence, not current usage telemetry. A fresh quota check remains required before another render. No new inference, delivery or email was performed by this prompt revision.

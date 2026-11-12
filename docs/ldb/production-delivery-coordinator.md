# Production delivery coordinator — 2026-10-31

Development commit 2e02575d0d4a9663264406d4b32ac261d370f392 adds a backend-only delivery coordinator. It requires a trusted audited plan, all 17 image scene identities, 17 image prompts, 16 Flow prompts, 16 narrations and supporting documents (69 assets). Assets are rehashed before upload. File IDs/checksums use the previously live-tested DriveDelivery adapter.

The coordinator persists STOP/resume, verified progress and a bounded three-attempt retry count per asset. A STOP during an in-flight upload preserves its result and prevents the next asset. Storage is checked before upload; insufficient space pauses delivery. Six new tests plus 38 Google tests passed (44 total). Coordinator execution was tested with mocks, not a live full episode.

Live Drive storage check returned HTTP 200 and remaining=15362845168 bytes (15.36 GB decimal) on the connected owner account. Report: https://ld-autopilot-free-nio1d09k8-renyboydeleon-5731.vercel.app/storage-check.json . Deployment dpl_6vf3upPuSgzwAW9AfBGzwHvycf16. Storage can change; every upload batch must recheck. No subscription/payment change was made.

Only authenticated capacity diagnostics are wired into the live vault. The production coordinator is NOT yet wired to the runner's Durable Object alarms or public app controls. Next work must create the trusted audited asset plan from actual 17-scene data, supply immutable bytes, then wire coordinator alarms and real milestones. Recovered reference mapping/visual QA is still pending. Do not represent the coordinator as a running background episode job.

No episode upload or new Gmail send occurred in this step. Stable preview alias restored to app deployment dpl_6G176AN2qaPbzNDajZqSrFPecJnc. Cloudflare credential scopes restored; vault namespace/bindings preserved. Production unchanged.

## Multi-episode delivery validation — November 3, 2026
The delivery-plan validator previously hardcoded `Lake Nyos 1986`, preventing any future episode from reaching Drive. It now accepts a strict, nonempty international title (up to 120 UTF-16 code units) from a trusted backend while rejecting traversal-like titles, slashes, control characters and surrounding whitespace. A trusted `episode` option is forwarded through `submitDurableApprovedDelivery` and `prepareApprovedProductionDelivery`; the legacy Lake Nyos default is retained for existing jobs. The validated title becomes the verified episode folder, and the complete 69-asset contract still applies unchanged. This change is development-only; no Cloudflare deployments, generated images, uploads, or emails are claimed.

## Automatic 52 text assets from approved source — November 3, 2026
When an authenticated job is submitted, the runner now persists a SHA-256-checked, chunked copy of its exact storyboard approval and render-scene expansion. The backend-only composer reconstructs exactly 52 text deliverables: original storyboard JSON, 17 image prompts, 16 Flow prompts, 16 narrations, trusted visual audit JSON and a deterministic production manifest. In combination with 17 image files, this forms the 69-asset package. The internal submitDurableApprovedDelivery() automatically derives these text assets if a legacy otherAssets array is not explicitly supplied. Missing/tampered originals block production. A separate reviewer-verified, all-17 checksum-matching visual PASS remains mandatory; the original storyboard approval does not satisfy it. This is development-only and no public visual-review endpoint or cloud deployment was added.


## STOP versus review handoff race guard — November 7, 2026

A review handoff could start 69-file preparation before the owner pressed STOP. Earlier code checked stop at request entry but did not re-read it atomically when creating the final delivery checkpoint. A handoff in progress could still create a queued delivery after STOP (the dispatch alarm still checked STOP, but the queue itself would be present).

The trusted submitDurableApprovedDelivery path now passes a fail-closed queueGuard into ProductionDelivery.submit. The guard runs INSIDE the delivery storage transaction before writing any queue checkpoint. It requires the immutable original 17 image identities and hashes, exact job ID, IMAGES_READY, index 17 and the current stop flag not true. On the actual LdbCoordinator, image and delivery records share the same Durable Object storage, providing a common transactional boundary. Synthetic tests with separate stores read the live source but are not claimed to offer cross-store atomicity.

Added race tests for STOP before queue, shared-store Durable Object STOP, and image metadata replacement. Every test must reject without creating a delivery checkpoint or uploading to Google. No inference, deployment, paid service, email or production-flag changes.


## Authenticated STOP and read-only monitoring while Free inference is disabled — November 7, 2026

The former Runner Worker gate required `FREE_PLAN_CONFIRMED=true` before **every** owner request, including `GET /status` and `POST /stop`. If an operator safely disabled AI generation, they could accidentally lose STOP/status access at the same time.

The new pure route helper `cloudflare/ldb-runner/owner-access.mjs` permits only **exact owner-authenticated** GET /status, /delivery-readiness, /delivery-next-action, /images/{valid-scene} and POST /stop when `RUNNER_ENABLED` and/or `FREE_PLAN_CONFIRMED` is OFF. The strong `RUNNER_SECRET` is still mandatory and verified at the Worker edge using timing-safe comparison. No credentials are exposed publicly. Starting a job, resuming inference, other HTTP methods/paths, and every other command remain blocked unless both feature flags are enabled; the independent binding probe keeps its previous opt-in flag. The actual Durable Object alarm remains disabled whenever Free confirmation is OFF.

This is a development-branch safety correction, **not** permission to bypass Free quota checks or connect a paid provider. New regression tests cover auth denial, strict method/path allowlist, legacy gate, secret misconfiguration and probe behavior. No Cloudflare call, Drive upload, Gmail send or production merge.


## Durable render watchdog to prevent lost cloud jobs — November 7, 2026

The existing scene runner persisted a `RENDERING` claim before calling the image provider but did not set a follow-up alarm. If the Worker execution disappeared mid-request, there was no explicit recovery trigger. The new `Checkpoints` claim transaction saves a conservative 180-second watchdog alarm **before** provider I/O (provider timeout is 90 seconds). An early/spurious alarm re-arms the same deadline and never issues another render. If the deadline arrives with an unresolved claim, the job becomes `NEEDS_REVIEW` / `AMBIGUOUS_INFERENCE`, rather than automatically spending another image request. A successful image advances the next scene alarm; STOP, one-HOOK pause, invalid output, and provider errors clear the pending watchdog. STOP during an active render continues to preserve a returned image while preventing the next scene. New offline tests cover all cases, including re-instantiation after interruption. No actual AI inference, cloud deployment, Google upload or paid activation occurs in this code change.


## Free inference gate independent from reviewed Drive delivery (November 7, 2026)

RUNNER_ENABLED remains the master background kill switch. FREE_PLAN_CONFIRMED now gates AI image generation but does not stall previously completed 17-image, approved, immutable 69-file Google delivery. The existing trusted delivery checks, explicitly enabled private bridge, Google storage preflight, STOP and review failure still block unsafe uploads. If the image batch is incomplete, imageEnabled=false never ticks the image model. This is a code-only change with offline regression tests; no Cloudflare inference, Drive upload, Gmail or production deployment was initiated. Actual live OAuth/delivery acceptance remains pending.

### Free-quota OFF still preserves an in-flight watchdog (November 7, 2026)

A Free quota flag change during an active RENDERING claim must not silence its durable watchdog. New Checkpoints.watchdogOnly() re-arms the existing claim deadline, or marks expired ambiguous inference as NEEDS_REVIEW, without calling the provider or Google APIs. dispatchCoordinatorAlarm invokes only that read/hold path while imageEnabled=false and a claim is in flight. STOP remains authoritative; an image returned during STOP is still preserved. Tests simulate a real asynchronous provider request, repeated alarm, quota toggle and timeout with only one provider invocation.


## 2026-11-07 — Authenticated delivery-only Resume with AI inference OFF

The previous Free-plan policy correctly blocked ordinary `POST /resume` because it may call `core.resume()` and start rendering again. But this also stranded a previously approved/stopped 69-file Google delivery after `FREE_PLAN_CONFIRMED` was set to false. New dedicated `POST /resume-delivery` is accepted only with the same strong owner `RUNNER_SECRET`, `RUNNER_ENABLED=true`, and an explicitly enabled `DELIVERY_BRIDGE_ENABLED=true`; this path is never a generic read-only or bypass route. Inside the Durable Object, `resumeApprovedDeliveryOnly` checks `IMAGES_READY`, 17 scenes, persisted trusted 69-asset approved plan, the stopped state, active private Google connector, and the immutable checkpoint; then the existing transactional `resumeProduction` rechecks those constraints before scheduling the next delivery alarm. It NEVER calls image `core.resume()` and cannot restart inference. Ordinary `/resume` stays blocked when Free quota is OFF. Offline tests cover legitimate stopped delivery, unauthorized access, method/path variants, master kill switch, unreviewed image batches, missing/forged checkpoints, in-flight delivery and completed jobs. No Cloudflare inference, Drive upload, Gmail message, or production merge was initiated.

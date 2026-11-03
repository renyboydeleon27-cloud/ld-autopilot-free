# LDB offline integration acceptance checklist

Development only. This checklist does not authorize deployment, live uploads, email, paid generation, or image approval.

## Trusted boundary
- [ ] Coordinator reads immutable approved plan and asset bytes from server-side durable storage, never browser-provided quality flags or progress percentages.
- [ ] Verify 17 image assets and all expected text assets, category, size and SHA256 before queueing; reject changed bytes and wrong job ID.
- [ ] Keep STOP, NEEDS_REVIEW, and resume transitions durable and safe after worker reconstruction.

## Drive adapter
- [ ] Use durable pre-generated file ID per logical asset and reconcile before retrying ambiguous POST.
- [ ] Check destination folder, name, media type, ownership marker, byte length, MD5 and SHA256.
- [ ] Bound POST attempts to three; never PATCH, rename, move, delete, share or touch existing InShot files.
- [ ] Verify all 69 expected delivery records and simulate restart at each checkpoint.

## Gmail adapter
- [ ] Compute milestones 30/50/70/100 only from trusted durable job state.
- [ ] Hold notification on STOP, NEEDS_REVIEW or unearned milestone.
- [ ] Persist send claim before network POST; ambiguous response must not automatically resend.
- [ ] Verify fixed sender/recipient and prevent browser-triggered arbitrary messages.

## Vault and production gate
- [ ] Run adapters inside authenticated vault boundary with synthetic credentials first.
- [ ] No browser exposure of access or refresh tokens; no credentials in Git or logs.
- [ ] Require separate controlled authorization for real Google consent, live Drive/Gmail testing and production deployment.
- [ ] Human visual approval of all 17 images is mandatory before final delivery.

## Evidence required
Record exact test command, commit SHA, CI run URL, failed/passed counts, and whether tests used mocks or live providers. Passing mocked tests is not proof of cloud delivery.

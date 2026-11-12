# 17-image to 69-file handoff: approved storyboard drift gate (Nov 9, 2026)

The durable delivery handoff already validated all 17 persisted image
bytes and a complete SHA-256 verified package before creating a
delivery checkpoint. The final queue transaction, however, compared
only image output hashes, job ID/status/index and STOP. It did not
recheck the job's approved storyboard source metadata or the persisted
render-scenes/prompt contract. A concurrent storyboard revision during
packaging could leave a queued plan bound to stale approval source.

Now the coordinator snapshots the persisted approvedSource and scenes
at preflight and verifies both AGAIN when the delivery queue
transaction is committed. Any change, addition or removal blocks the
entire queue with JOB_STOPPED_OR_CHANGED_BEFORE_DELIVERY_QUEUE.
The previously verified image-output and STOP guards remain.

Offline regression tests simulate a changed storyboard digest and
modified HOOK camera prompt exactly before queue creation, confirming
neither case creates a 69-file checkpoint or any Google upload. An
unchanged source and scenes snapshot still allows a safe queue.

This protects the trust boundary only. It does not perform human visual
approval, make 17 images, call Google APIs, send email or deploy Workers.
Production stays NO-GO.

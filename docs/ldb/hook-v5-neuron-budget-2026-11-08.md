# NER AUTO STUDIO — one-HOOK V5 estimated neuron budget

Date: November 8, 2026. Model price source:
https://developers.cloudflare.com/workers-ai/platform/pricing/
and model:
https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/

FLUX.2 Klein 4B output is listed at 26.05 neurons per 512x512
output tile. The 576x1024 single HOOK reference uses
ceil(576/512)*ceil(1024/512)=4 output tiles: **104.2 estimated neurons**.
This is a published-pricing estimate, NOT measured billing. Metering and
rounding are external, and future model prices may change.

## Internal test fence
The Free allocation documented by Cloudflare is 10,000 neurons/day, UTC.
Our conservative local threshold remains 9,000 neurons/day.
We now reserve **400 neurons for a single HOOK** (more than 3x the
estimated 104.2) before allowing the V5 test. It must see reported
usage **at or below 8,600 neurons** for both the saved, fresh report
and the live provider recheck. This is not a daily render quota
guarantee or distributed reservation across concurrent systems.

The Vercel preview's read-only Cloudflare response and Android Studio
display the estimated 104.2, the 400-neuron local reserve, and whether
that conservative budget fits. They still never issue a render request.
The actual cloud test also checks the budget at both execution gates.

## Not resolved
The existing Cloudflare token returns HTTP 403 for billing read. Zero
neurons usage does not independently prove Workers Free. The owner must
confirm Workers Free directly in the Cloudflare dashboard before any
explicit isolated HOOK V5 render. Human image acceptance, 17 images,
69 real Drive receipts and Gmail milestones remain pending.

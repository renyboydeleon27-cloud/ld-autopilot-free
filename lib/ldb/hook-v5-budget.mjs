// Conservative, nonauthorizing HOOK V5 model quota estimate.
// Source: https://developers.cloudflare.com/workers-ai/platform/pricing/
// Snapshot 2026-11-08: FLUX.2 Klein 4B output 26.05 neurons per 512x512 tile.
// Actual metering/rounding may differ; this is never billing evidence.
import {MODEL} from './cloudflare-image.mjs';
export const V5_WIDTH=576,V5_HEIGHT=1024,TILE_EDGE=512;
export const V5_ESTIMATED_NEURONS_PER_OUTPUT_TILE=26.05;
export const DAILY_FREE_ALLOCATION=10_000;
export const V5_LOCAL_USAGE_FENCE=9_000;
export const ONE_HOOK_RESERVED_NEURONS=400; // 3.8x the estimated output tiles.
export function assessOneHookBudget({
 used,model=MODEL,width=V5_WIDTH,height=V5_HEIGHT
}={}){
 if(model!=='@cf/black-forest-labs/flux-2-klein-4b'||
    width!==V5_WIDTH||height!==V5_HEIGHT)
  throw Error('V5_MODEL_PRICE_UNVERIFIED');
 if(typeof used!=='number'||!Number.isFinite(used)||used<0||
    used>DAILY_FREE_ALLOCATION)throw Error('V5_QUOTA_USAGE_UNVERIFIED');
 const outputTiles=Math.ceil(width/TILE_EDGE)*Math.ceil(height/TILE_EDGE);
 const estimatedNeurons=Math.round(outputTiles*V5_ESTIMATED_NEURONS_PER_OUTPUT_TILE*100)/100;
 if(ONE_HOOK_RESERVED_NEURONS<estimatedNeurons)throw Error('V5_BUDGET_CONFIGURATION_INVALID');
 const withinLocalFence=used+ONE_HOOK_RESERVED_NEURONS<=V5_LOCAL_USAGE_FENCE;
 return Object.freeze({
  model,outputWidth:width,outputHeight:height,outputTiles,estimatedNeurons,
  reservedNeurons:ONE_HOOK_RESERVED_NEURONS,
  internalUsageFence:V5_LOCAL_USAGE_FENCE,reportedUsed:used,
  withinLocalFence,
  status:withinLocalFence?'BUDGET_SPACE_ESTIMATED':'INSUFFICIENT_LOCAL_BUFFER',
  inferenceAuthorized:false,
  freePlanVerified:false,
  warning:'Estimate from published model tile pricing, not a billing guarantee. Free plan must be manually confirmed in Cloudflare.'
 });
}

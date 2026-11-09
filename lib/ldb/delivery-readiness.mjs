// Read-only operational gate. Never creates approvals, starts jobs or uploads.
// A production plan is not "approved" in the UI without a complete, consistent
// durable checkpoint. Browser-submitted flags cannot fill in missing records.
import {ALL_SCENES} from './verified-image-handoff.mjs';
import {assertDeliveryCheckpointIntegrity} from './production-delivery.mjs';

const validHash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
// Owner UI and trusted alarm routing must use the same fail-closed
// checkpoint rules as the delivery coordinator, including verified IDs,
// retry counters, STOP and interrupted read-only reconciliation. Never
// reinterpret a partial checkpoint as approval simply because it has 69 rows.
function trustedCheckpoint(job,delivery){
 if(!delivery||typeof delivery!=='object'||delivery.plan?.jobId!==job.id)
  return false;
 try{return assertDeliveryCheckpointIntegrity(delivery)===true;}
 catch{return false;}
}

export function deliveryReadiness({job,delivery}={}){
 const imagesReady=job?.status==='IMAGES_READY'&&validHash(job.id)&&job.index===17&&
   Array.isArray(job.outputs)&&job.outputs.length===17&&
   job.outputs.every((a,i)=>a?.scene===ALL_SCENES[i]&&validHash(a.sha256)&&
     ['image/png','image/jpeg'].includes(a.mimeType)&&Number.isSafeInteger(a.bytes)&&
     a.bytes>0&&a.bytes<=8000000&&Number.isSafeInteger(a.chunks)&&a.chunks>0&&a.chunks<=125);
 const trusted=imagesReady&&trustedCheckpoint(job,delivery);
 // These booleans represent verified stored state, never an upload permission.
 return Object.freeze({
  imagesReady,
  approvedDeliveryPlanPresent:trusted,
  deliveryCheckpointPresent:trusted,
  deliveryConnected:false,
  autoProductionReady:false,
  next:!imagesReady?'AWAIT_17_IMAGES':(!delivery?.plan||delivery.plan.visualAudit!=='PASS')?'AWAIT_TRUSTED_VISUAL_REVIEW':!trusted?'AWAIT_DURABLE_DELIVERY_INTEGRATION':'AWAIT_DELIVERY_CONNECTOR'
 });
}

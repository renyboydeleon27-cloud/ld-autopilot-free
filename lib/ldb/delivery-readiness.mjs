// Read-only operational gate. Never creates approvals, starts jobs or uploads.
// A production plan is not "approved" in the UI without a complete, consistent
// durable checkpoint. Browser-submitted flags cannot fill in missing records.
import {ALL_SCENES} from './verified-image-handoff.mjs';
import {validateDeliveryPlan} from './production-delivery.mjs';

const validHash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const CHECKPOINT_STATUSES=new Set(['QUEUED','UPLOADING','RETRY_WAIT','WAITING_STORAGE','STOPPED','NEEDS_REVIEW','COMPLETE']);

function trustedCheckpoint(job,delivery){
 if(!delivery||typeof delivery!=='object'||!delivery.plan||delivery.plan.jobId!==job.id)return false;
 let fingerprint;
 try {fingerprint=validateDeliveryPlan(delivery.plan);}
 catch {return false;}
 if(delivery.fingerprint!==fingerprint||typeof delivery.stopped!=='boolean'||!CHECKPOINT_STATUSES.has(delivery.status))return false;
 const assets=delivery.plan.assets;
 const index=delivery.index;
 if(!Number.isSafeInteger(index)||index<0||index>assets.length||
    !Array.isArray(delivery.verified)||delivery.verified.length!==index)return false;
 if((delivery.status==='COMPLETE')!==(index===assets.length))return false;
 if(delivery.status==='STOPPED'&&!delivery.stopped)return false;
 if(delivery.status==='QUEUED'&&delivery.stopped)return false;
 const ids=new Set();
 for(let i=0;i<index;i++){
  const record=delivery.verified[i],asset=assets[i];
  if(record?.key!==asset.key||record.sha256!==asset.sha256||
     record.status!=='VERIFIED'||typeof record.id!=='string'||!record.id.trim()||
     ids.has(record.id))return false;
  ids.add(record.id);
 }
 return true;
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

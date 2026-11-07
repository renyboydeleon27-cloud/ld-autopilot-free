// Owner-only read-only production progress. It never performs rendering,
// visual approval, credential access, Drive upload or Gmail sending.
// Treat generated images, trusted review, and actual verified delivery as
// three DISTINCT stages; no percentage is guessed from mocked counters.
import {ALL_SCENES} from './verified-image-handoff.mjs';
import {deliveryReadiness} from './delivery-readiness.mjs';

const hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const expected=ALL_SCENES.length;
const sceneMetaValid=(x,i)=>x?.scene===ALL_SCENES[i]&&hash(x.sha256)&&
 ['image/png','image/jpeg'].includes(x.mimeType)&&
 Number.isSafeInteger(x.bytes)&&x.bytes>0&&x.bytes<=8000000&&
 Number.isSafeInteger(x.chunks)&&x.chunks>0&&x.chunks<=125;
const terminalDelivery=new Set(['COMPLETE','NEEDS_REVIEW','STOPPED','WAITING_STORAGE']);

export function productionProgressSnapshot({job,delivery}={}){
 const validJob=!!job&&hash(job.id)&&Array.isArray(job.outputs)&&
   Number.isSafeInteger(job.index)&&job.index>=0&&job.index<=expected&&
   job.outputs.length===job.index&&job.outputs.every(sceneMetaValid);
 const safeJob=validJob?job:null;
 const readiness=deliveryReadiness({job:safeJob,delivery});
 const trusted=readiness.approvedDeliveryPlanPresent;
 const rendered=safeJob?.index??0;
 const stopped=safeJob?.stop===true||trusted&&delivery.stopped===true;
 const verified=trusted?delivery.index:0;
 const state=trusted?delivery.status:'NOT_APPROVED';
 let next='AWAIT_17_IMAGES';
 if(!safeJob)next='NO_VERIFIED_JOB';
 else if(stopped)next='STOPPED';
 else if(safeJob.status==='NEEDS_REVIEW')next='RENDER_NEEDS_REVIEW';
 else if(!readiness.imagesReady)next='AWAIT_17_IMAGES';
 else if(!trusted)next='AWAIT_VISUAL_APPROVAL_AND_69_FILE_PLAN';
 else if(state==='COMPLETE'&&verified===69)next='DELIVERY_VERIFIED';
 else if(state==='NEEDS_REVIEW')next='DELIVERY_NEEDS_REVIEW';
 else if(state==='WAITING_STORAGE')next='WAITING_DRIVE_STORAGE';
 else if(state==='STOPPED')next='STOPPED';
 else if(state==='UPLOADING'||state==='QUEUED'||state==='RETRY_WAIT')next='DELIVERY_CHECKPOINT_ACTIVE';
 else next='AWAIT_DELIVERY_CONNECTOR';
 return Object.freeze({
  job:safeJob?{
   id:safeJob.id,status:safeJob.status,completedScenes:rendered,totalScenes:17,
   outputs:safeJob.outputs.map(o=>({scene:o.scene,sha256:o.sha256,
    bytes:o.bytes,mimeType:o.mimeType,visualAudit:'PENDING'})),
   ...(safeJob.error?{error:safeJob.error}:{}),
   ...(safeJob.providerCode?{providerCode:safeJob.providerCode}:{})
  }:null,
  production:{
   stopped,renderedScenes:rendered,totalScenes:17,
   generatedImagesNotVisualApproval:true,
   approvedDeliveryPlanPresent:trusted,
   deliveryStatus:state,verifiedDriveFiles:verified,expectedDriveFiles:69,
   deliveryComplete:trusted&&state==='COMPLETE'&&verified===69,
   next,
   reviewRequired:!trusted,
   note:'Rendering and storage counts are not human visual approval or final episode delivery.'
  },
  // These deliberately remain false until a separate live connector and
  // end-to-end readiness verification are implemented.
  autoProductionReady:false,deliveryConnected:false
 });
}

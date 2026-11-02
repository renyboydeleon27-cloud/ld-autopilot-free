// Read-only operational gate. Never creates approvals, starts jobs or uploads.
import {ALL_SCENES} from './verified-image-handoff.mjs';
const validHash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export function deliveryReadiness({job,delivery}={}){
 const imagesReady=job?.status==='IMAGES_READY'&&validHash(job.id)&&job.index===17&&Array.isArray(job.outputs)&&job.outputs.length===17&&job.outputs.every((a,i)=>a?.scene===ALL_SCENES[i]&&validHash(a.sha256)&&['image/png','image/jpeg'].includes(a.mimeType)&&Number.isSafeInteger(a.bytes)&&a.bytes>0&&a.bytes<=8000000&&Number.isSafeInteger(a.chunks)&&a.chunks>0&&a.chunks<=125);
 const verified=imagesReady&&delivery?.plan?.jobId===job.id&&delivery?.plan?.approvalVerified===true&&delivery?.plan?.visualAudit==='PASS';
 const queued=verified&&['QUEUED','UPLOADING','RETRY_WAIT','WAITING_STORAGE','STOPPED','NEEDS_REVIEW','COMPLETE'].includes(delivery?.status);
 return Object.freeze({imagesReady,approvedDeliveryPlanPresent:verified,deliveryCheckpointPresent:queued,deliveryConnected:false,autoProductionReady:false,next:!imagesReady?'AWAIT_17_IMAGES':!verified?'AWAIT_TRUSTED_VISUAL_REVIEW':!queued?'AWAIT_DURABLE_DELIVERY_INTEGRATION':'AWAIT_DELIVERY_CONNECTOR'});
}

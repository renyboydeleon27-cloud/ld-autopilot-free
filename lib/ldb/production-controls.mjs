// Owner-only Durable Object controls. Never accept browser approval or upload metadata.
// In particular, STOP must also gate delivery after the image job is IMAGES_READY.
import {deliveryReadiness} from './delivery-readiness.mjs';
const fail=code=>{throw Error(code);};
const good=({core,storage})=>core&&typeof core.status==='function'&&
  typeof core.stop==='function'&&typeof core.resume==='function'&&
  storage&&typeof storage.get==='function'&&typeof storage.transaction==='function';

export async function stopProduction({core,storage}={}){
 if(!good({core,storage}))fail('TRUSTED_CONTROL_BACKEND_REQUIRED');
 const job=await core.status();
 if(!job)fail('NO_JOB');
 if(job.status!=='IMAGES_READY'){
  await core.stop();
  return Object.freeze({status:'IMAGE_STOP_REQUESTED'});
 }
 return storage.transaction(async tx=>{
  const current=await tx.get('job');
  if(!current||current.id!==job.id||current.status!=='IMAGES_READY')fail('JOB_CHANGED');
  const delivery=await tx.get('delivery');
  if(delivery?.status==='COMPLETE')return Object.freeze({status:'ALREADY_COMPLETE'});
  current.stop=true;
  await tx.put('job',current);
  if(delivery){
   delivery.stopped=true;
   // In-flight assets may finish; they must not start another asset.
   if(!['UPLOADING','NEEDS_REVIEW'].includes(delivery.status))delivery.status='STOPPED';
   await tx.put('delivery',delivery);
  }
  await tx.deleteAlarm();
  return Object.freeze({status:delivery?'DELIVERY_STOP_REQUESTED':'PRODUCTION_STOPPED'});
 });
}

export async function resumeProduction({core,storage,deliveryEnabled=false,now=Date.now}={}){
 if(!good({core,storage})||typeof now!=='function')fail('TRUSTED_CONTROL_BACKEND_REQUIRED');
 const job=await core.status();
 if(!job)fail('NO_JOB');
 if(job.status!=='IMAGES_READY'){
  await core.resume(); // Existing image-stage resume validation remains authoritative.
  return Object.freeze({status:'IMAGE_RESUMED'});
 }
 return storage.transaction(async tx=>{
  const current=await tx.get('job');
  if(!current||current.id!==job.id||current.status!=='IMAGES_READY')fail('JOB_CHANGED');
  if(current.stop!==true)fail('RESUME_NOT_SAFE');
  const delivery=await tx.get('delivery');
  if(delivery){
   if(deliveryEnabled!==true)fail('DELIVERY_CONNECTOR_DISABLED');
   // Refuse to requeue an unresolved in-flight claim or a failed visual audit.
   if(!delivery.stopped||!['STOPPED','WAITING_STORAGE','RETRY_WAIT'].includes(delivery.status))fail('RESUME_NOT_SAFE');
   if(!deliveryReadiness({job:current,delivery}).approvedDeliveryPlanPresent)fail('INVALID_DELIVERY_CHECKPOINT');
   delivery.stopped=false;
   delivery.status='QUEUED';
   await tx.put('delivery',delivery);
  }
  current.stop=false;
  await tx.put('job',current);
  if(delivery)await tx.setAlarm(now()+1000);
  return Object.freeze({status:delivery?'DELIVERY_RESUMED':'PRODUCTION_RESUMED'});
 });
}

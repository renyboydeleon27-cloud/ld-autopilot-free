// Development-only routing between image generation and durable delivery.
// The deployed worker does not supply a Google delivery backend. This must
// remain fail-closed until an internal trusted connector is provisioned.
import {deliveryReadiness} from '../../lib/ldb/delivery-readiness.mjs';

const IMAGE_TERMINAL=new Set(['IMAGES_READY','TEST_PAUSED','NEEDS_REVIEW','STOPPED']);
const DELIVERY_HOLD=new Set(['COMPLETE','NEEDS_REVIEW','WAITING_STORAGE','STOPPED']);

export async function dispatchCoordinatorAlarm({storage,imageCore,imageEnabled=true,deliveryEnabled=false,createDelivery}={}){
 if(!storage||typeof storage.get!=='function'||!imageCore||
    typeof imageCore.status!=='function'||typeof imageCore.tick!=='function')
  throw Error('TRUSTED_ALARM_BACKEND_REQUIRED');
 const job=await imageCore.status();
 // STOP must prevent Drive alarms even when all images are ready.
 if(job?.stop===true)return {status:'PRODUCTION_PAUSED'};
 if(job&&!IMAGE_TERMINAL.has(job.status)){
  // No new provider request while Free plan is unverified.
  if(imageEnabled!==true)return {status:'IMAGE_GENERATION_DISABLED'};
  await imageCore.tick();
  return {status:'IMAGE_TICK'};
 }
 if(job?.status!=='IMAGES_READY')return {status:'IMAGES_NOT_READY'};
 const delivery=await storage.get('delivery');
 if(!delivery)return {status:'DELIVERY_NOT_CONFIGURED'};
 const readiness=deliveryReadiness({job,delivery});
 if(!readiness.approvedDeliveryPlanPresent)return {status:'DELIVERY_BLOCKED'};
 if(delivery.stopped===true||DELIVERY_HOLD.has(delivery.status))return {status:'DELIVERY_PAUSED'};
 if(deliveryEnabled!==true||typeof createDelivery!=='function')return {status:'DELIVERY_CONNECTOR_DISABLED'};
 const coordinator=await createDelivery({jobId:job.id});
 if(!coordinator||typeof coordinator.tick!=='function')return {status:'DELIVERY_CONNECTOR_DISABLED'};
 await coordinator.tick();
 return {status:'DELIVERY_TICK'};
}

// Server-only bridge between approved assets and the persistent Drive coordinator.
// Caller must obtain job, bytes, and reviewer audit from trusted server storage.
// Never expose this function as a browser API or synthesize reviewer approval.
import {ProductionDelivery} from './production-delivery.mjs';
import {prepareApprovedProductionDelivery} from './approved-production-delivery.mjs';
export async function submitApprovedDelivery({storage,drive,capacity,job,images,approvedAudit,otherAssets,now}={}){
 if(!storage||typeof storage.transaction!=='function'||!drive||typeof drive.put!=='function'||typeof capacity!=='function')throw Error('TRUSTED_DELIVERY_BACKEND_REQUIRED');
 const prepared=prepareApprovedProductionDelivery({job,images,approvedAudit,otherAssets});
 const coordinator=new ProductionDelivery(storage,{drive,capacity,readAsset:prepared.readAsset,now});
 const checkpoint=await coordinator.submit(prepared.plan);
 return {coordinator,checkpoint,fingerprint:prepared.fingerprint};
}

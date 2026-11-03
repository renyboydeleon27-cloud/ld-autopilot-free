// Reconstruct a trusted coordinator on every Durable Object alarm.
// The approved plan must already be persisted by the trusted submission path.
import {ProductionDelivery} from './production-delivery.mjs';
import {durableDeliveryAssetReader} from './durable-delivery-asset-reader.mjs';
const fail=code=>{throw Error(code);};
export function resumeDurableApprovedDelivery({deliveryStorage,imageStorage,textStorage,drive,capacity,jobId,now}={}){
 if(!deliveryStorage||typeof deliveryStorage.transaction!=='function'||!drive||typeof drive.put!=='function'||typeof capacity!=='function')fail('TRUSTED_DELIVERY_BACKEND_REQUIRED');
 const readAsset=durableDeliveryAssetReader({imageStorage,textStorage,jobId});
 return new ProductionDelivery(deliveryStorage,{drive,capacity,readAsset,now});
}

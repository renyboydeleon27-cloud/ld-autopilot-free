// Trusted backend only. No browser-supplied approval or automatic uploads.
// Persist verified text before queueing; image bytes remain in runner storage.
// Safe to reconstruct the delivery coordinator after a Worker restart.
import {readPersistedRunnerImages} from './persisted-runner-images.mjs';
import {prepareApprovedProductionDelivery} from './approved-production-delivery.mjs';
import {durableTextAssetStore} from './durable-text-assets.mjs';
import {resumeDurableApprovedDelivery} from './resume-durable-approved-delivery.mjs';
import {durableDeliveryAssetReader} from './durable-delivery-asset-reader.mjs';
import {createHash} from 'node:crypto';
const fail=code=>{throw Error(code);};
export async function submitDurableApprovedDelivery({deliveryStorage,imageStorage,textStorage,drive,capacity,expectedJobId,approvedAudit,otherAssets,now}={}){
 if(!deliveryStorage||typeof deliveryStorage.transaction!=='function'||!imageStorage||typeof imageStorage.get!=='function'||!textStorage||typeof textStorage.transaction!=='function'||typeof textStorage.get!=='function'||!drive||typeof drive.put!=='function'||typeof capacity!=='function'||!/^[a-f0-9]{64}$/.test(expectedJobId||''))fail('TRUSTED_DELIVERY_BACKEND_REQUIRED');
 if(!approvedAudit||typeof approvedAudit!=='object')fail('TRUSTED_REVIEW_REQUIRED');
 const {job,assets:images}=await readPersistedRunnerImages(imageStorage,{expectedJobId});
 const prepared=prepareApprovedProductionDelivery({job,images,approvedAudit,otherAssets});
 if(prepared.plan.jobId!==expectedJobId)fail('DELIVERY_JOB_MISMATCH');
 const textStore=durableTextAssetStore(textStorage,{jobId:expectedJobId});
 // Persist every non-image asset before creating the delivery checkpoint.
 // Interrupted writes leave no queued delivery; retries remain idempotent.
 for(const asset of prepared.plan.assets){
  if(asset.category==='Approved reference images'||asset.category==='Thumbnail')continue;
  await textStore.put(asset,await prepared.readAsset(asset));
 }
 // Re-read every persisted byte before queueing. A failed or corrupted write
 // cannot create a delivery checkpoint, even if preparation succeeded.
 const readPersisted=durableDeliveryAssetReader({imageStorage,textStorage,jobId:expectedJobId});
 for(const asset of prepared.plan.assets){
  const bytes=await readPersisted(asset);
  if(bytes.length!==asset.bytes||createHash('sha256').update(bytes).digest('hex')!==asset.sha256)fail('ASSET_INTEGRITY_FAILED');
 }
 const coordinator=resumeDurableApprovedDelivery({deliveryStorage,imageStorage,textStorage,drive,capacity,jobId:expectedJobId,now});
 const checkpoint=await coordinator.submit(prepared.plan);
 return {checkpoint,fingerprint:prepared.fingerprint};
}

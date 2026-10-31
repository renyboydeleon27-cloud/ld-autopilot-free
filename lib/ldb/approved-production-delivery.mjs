// Server-only composition boundary. No upload begins until the complete,
// immutable production plan and actual image bytes have passed verification.
import {createHash} from 'node:crypto';
import {prepareVerifiedImageDelivery} from './verified-image-delivery.mjs';
import {validateDeliveryPlan} from './production-delivery.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=code=>{throw Error(code);};
export function prepareApprovedProductionDelivery({job,images,approvedAudit,otherAssets,episode='Lake Nyos 1986'}={}){
 const verified=prepareVerifiedImageDelivery({job,assets:images,approvedAudit});
 if(!Array.isArray(otherAssets))fail('OTHER_DELIVERABLES_REQUIRED');
 const imageEntries=verified.assets.map(a=>({...a}));
 const entries=[...imageEntries];
 const bytesByKey=new Map();
 for(let i=0;i<images.length;i++)bytesByKey.set(imageEntries[i].key,Buffer.from(images[i].bytes));
 for(const a of otherAssets){
  if(!a||!(a.bytes instanceof Uint8Array))fail('INVALID_ASSET_BYTES');
  const bytes=Buffer.from(a.bytes);
  if(!bytes.length||bytes.length>8000000||a.bytesLength!==bytes.length||sha(bytes)!==a.sha256)fail('ASSET_INTEGRITY_FAILED');
  if(bytesByKey.has(a.key))fail('DUPLICATE_DELIVERY_ASSET');
  const {bytes:ignored,bytesLength,...record}=a;
  entries.push({...record,bytes:bytes.length});
  bytesByKey.set(a.key,bytes);
 }
 const plan={jobId:verified.jobId,approvalVerified:true,visualAudit:'PASS',episode,assets:entries};
 const fingerprint=validateDeliveryPlan(plan);
 return Object.freeze({plan:Object.freeze(plan),fingerprint,readAsset:async a=>{
  const stored=bytesByKey.get(a.key);
  if(!stored||stored.length!==a.bytes||sha(stored)!==a.sha256)fail('ASSET_INTEGRITY_FAILED');
  return Buffer.from(stored);
 }});
}

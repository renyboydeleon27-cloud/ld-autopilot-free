// Server-side only: reject image-to-delivery handoffs until a trusted visual
// audit has accepted every scene. This module performs no network requests.
import {createHash} from 'node:crypto';
export const STORY_SCENES=Object.freeze(['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING']);
export const ALL_SCENES=Object.freeze([...STORY_SCENES,'THUMBNAIL']);
const sha=b=>createHash('sha256').update(b).digest('hex');
const validHash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const fail=code=>{throw Error(code);};
export function validateImageHandoff({job,assets,approvedAudit}={}){
 if(!job||!validHash(job.id)||!['IMAGES_READY','TEST_PAUSED'].includes(job.status))fail('IMAGES_NOT_READY');
 if(job.index!==17||!Array.isArray(job.outputs)||job.outputs.length!==17)fail('INCOMPLETE_IMAGES');
 if(!approvedAudit||approvedAudit.jobId!==job.id||approvedAudit.status!=='PASS'||approvedAudit.reviewerVerified!==true||!Array.isArray(approvedAudit.scenes)||approvedAudit.scenes.length!==17)fail('VISUAL_REVIEW_REQUIRED');
 if(!Array.isArray(assets)||assets.length!==17)fail('MISSING_IMAGE_BYTES');
 const accepted=new Map();
 for(const record of approvedAudit.scenes){
  if(!ALL_SCENES.includes(record?.scene)||record?.result!=='PASS'||!validHash(record.sha256)||accepted.has(record.scene))fail('INVALID_VISUAL_AUDIT');
  accepted.set(record.scene,record.sha256);
 }
 const verified=[];
 for(let i=0;i<17;i++){
  const scene=ALL_SCENES[i],meta=job.outputs[i],asset=assets[i];
  if(meta?.scene!==scene||asset?.scene!==scene||!validHash(meta.sha256)||meta.sha256!==accepted.get(scene))fail('IMAGE_AUDIT_MISMATCH');
  if(!(asset.bytes instanceof Uint8Array)||asset.bytes.length!==meta.bytes||sha(asset.bytes)!==meta.sha256)fail('IMAGE_INTEGRITY_FAILED');
  if(!['image/jpeg','image/png'].includes(meta.mimeType)||asset.mimeType!==meta.mimeType)fail('INVALID_IMAGE_TYPE');
  verified.push(Object.freeze({scene,sha256:meta.sha256,bytes:meta.bytes,mimeType:meta.mimeType}));
 }
 return Object.freeze({jobId:job.id,images:Object.freeze(verified)});
}

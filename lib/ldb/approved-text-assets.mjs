// Trusted backend only. Persist the exact owner-approved storyboard, then
// derive 52 text assets without external calls. This does NOT approve images.
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {validateRenderJob,SCENES} from './approved-render-job.mjs';
import {validateEpisodeName} from './production-delivery.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const fail=code=>{throw Error(code);};
const CHUNK=64000,MAX=100000;
function validated(bundle,job){
 const parsed=validateRenderJob(bundle);
 if(job?.id!==parsed.id||JSON.stringify(job.scenes)!==JSON.stringify(parsed.scenes))
  fail('APPROVED_SOURCE_MISMATCH');
 return {schema:bundle.schema,storyboard_utf8:bundle.storyboard_utf8,approval:bundle.approval,render_scenes:bundle.render_scenes};
}
export function approvedSourceChunks(bundle,job){
 const bytes=Buffer.from(JSON.stringify(validated(bundle,job)),'utf8');
 if(!bytes.length||bytes.length>MAX)fail('APPROVED_BUNDLE_TOO_LARGE');
 const chunks=[];
 for(let i=0;i<bytes.length;i+=CHUNK)chunks.push(new Uint8Array(bytes.subarray(i,i+CHUNK)));
 return {meta:{sha256:hash(bytes),bytes:bytes.length,chunks:chunks.length},chunks};
}
export async function readPersistedApprovedSource(storage,{expectedJobId}={}){
 if(!storage||typeof storage.get!=='function')fail('APPROVED_SOURCE_STORAGE_REQUIRED');
 const job=await storage.get('job'),meta=job?.approvedSource;
 if(job?.id!==expectedJobId||job?.status!=='IMAGES_READY'||
    !meta||!/^[a-f0-9]{64}$/.test(meta.sha256)||!Number.isSafeInteger(meta.bytes)||
    meta.bytes<1||meta.bytes>MAX||!Number.isInteger(meta.chunks)||
    meta.chunks<1||meta.chunks>2||Math.ceil(meta.bytes/CHUNK)!==meta.chunks)
  fail('APPROVED_SOURCE_UNAVAILABLE');
 const parts=[];
 for(let i=0;i<meta.chunks;i++){
  const b=await storage.get('approved-source:'+i);
  if(!(b instanceof Uint8Array)||!b.length||b.length>CHUNK)fail('APPROVED_SOURCE_INTEGRITY_FAILED');
  parts.push(Buffer.from(b));
 }
 const bytes=Buffer.concat(parts);
 if(bytes.length!==meta.bytes||hash(bytes)!==meta.sha256)fail('APPROVED_SOURCE_INTEGRITY_FAILED');
 let bundle;
 try{bundle=JSON.parse(bytes.toString('utf8'));validated(bundle,job);}
 catch{fail('APPROVED_SOURCE_INTEGRITY_FAILED');}
 return bundle;
}
export function buildApprovedTextAssets({job,bundle,approvedAudit,episode}={}){
 const source=validated(bundle,job);
 if(!approvedAudit||approvedAudit.jobId!==job.id||approvedAudit.status!=='PASS'||
    approvedAudit.reviewerVerified!==true||!Array.isArray(approvedAudit.scenes)||
    approvedAudit.scenes.length!==17)fail('TRUSTED_VISUAL_REVIEW_REQUIRED');
 const storyboard=JSON.parse(source.storyboard_utf8);
 const title=validateEpisodeName(episode??storyboard.title??storyboard.topic);
 const assets=[];
 function add(category,scene,name,content,mimeType='text/plain'){
  const bytes=Buffer.from(content,'utf8');
  if(!bytes.length||bytes.length>8000000)fail('INVALID_DERIVED_ASSET');
  assets.push({key:hash(['ldb-auto-text-v1',job.id,category,scene??'main'].join(':')),
   category,...(scene?{scene}:{}),name,mimeType,bytes,bytesLength:bytes.length,sha256:hash(bytes)});
 }
 add('Storyboard',null,'storyboard.json',source.storyboard_utf8,'application/json');
 for(const [i,scene] of SCENES.entries()){
  const record=source.render_scenes[i];
  add('Image prompts',scene,scene+'.txt',record.image_prompt);
  if(i<16){
   add('Flow video prompts',scene,scene+'.txt',record.flow_prompt);
   add('Narration',scene,scene+'.txt',record.narration);
  }
 }
 add('Quality audit',null,'visual-review.json',JSON.stringify(approvedAudit),'application/json');
 add('Production manifest',null,'production-manifest.json',JSON.stringify({
  schema:'ldb-production-manifest-v1',jobId:job.id,episode:title,
  storyboardSha256:hash(source.storyboard_utf8),visualAuditSha256:hash(JSON.stringify(approvedAudit)),
  requiredImages:17,requiredFlowPrompts:16,requiredNarrations:16,requiredDeliveryAssets:69
 }),'application/json');
 if(assets.length!==52)fail('INCOMPLETE_DERIVED_ASSETS');
 return {episode:title,assets};
}

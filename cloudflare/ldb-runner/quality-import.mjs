// Internal correction/review ingress. Separate secret and opt-in flag; never
// expose these credentials in the app. Staging cannot start delivery.
import {Buffer} from 'node:buffer';
import {createHash,timingSafeEqual} from 'node:crypto';
import {ALL_SCENES} from '../../lib/ldb/verified-image-handoff.mjs';
import {durablePreparedImages} from '../../lib/ldb/durable-prepared-images.mjs';
import {submitDurableApprovedDelivery} from '../../lib/ldb/submit-durable-approved-delivery.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export const isQualityImportPath=p=>p==='/internal/quality/image'||p==='/internal/quality/review'||p==='/internal/quality/status';
// Staging and visual approval are independent privileges. Merely possessing
// the image uploader's secret must NEVER authorize a 69-file Drive delivery.
// Re-check inside the Durable Object, not only at the public Worker edge.
export function qualityImportGate(req,env={}){
 const path=new URL(req.url).pathname;
 if(!isQualityImportPath(path))return json({status:'NOT_FOUND'},404);
 const reviewing=path==='/internal/quality/review';
 const inspecting=path==='/internal/quality/status';
 const stage=env.QUALITY_IMPORT_SECRET,review=env.QUALITY_REVIEW_SECRET;
 if(env.RUNNER_ENABLED!=='true'||env.QUALITY_IMPORT_ENABLED!=='true'||
    typeof stage!=='string'||stage.length<32||stage===env.RUNNER_SECRET)
  return json({status:'SETUP_REQUIRED'},503);
 // Read-only reviewer status is available with the Google delivery bridge
 // OFF. It does NOT approve images, enable Drive, or call AI.
 if((reviewing||inspecting)&&(env.QUALITY_REVIEW_ENABLED!=='true'||
    typeof review!=='string'||review.length<32||review===stage||review===env.RUNNER_SECRET))
  return json({status:'SETUP_REQUIRED'},503);
 if(reviewing&&env.DELIVERY_BRIDGE_ENABLED!=='true')return json({status:'SETUP_REQUIRED'},503);
 const expected='Bearer '+((reviewing||inspecting)?review:stage);
 const presented=req.headers.get('Authorization')||'';
 if(!timingSafeEqual(Buffer.from(sha(presented)),Buffer.from(sha(expected))))
  return json({status:'UNAUTHORIZED'},401);
 if(req.method!==(inspecting?'GET':'POST'))return json({status:'METHOD_NOT_ALLOWED'},405);
 return null;
}

async function read(req,max){
 const reader=req.body?.getReader();if(!reader)throw Error('BODY_REQUIRED');
 let size=0;const parts=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('BODY_TOO_LARGE');}parts.push(Buffer.from(value));}
 return Buffer.concat(parts);
}
function entry(jobId,audit){
 if(!audit||!ALL_SCENES.includes(audit.scene))throw Error('INVALID_SCENE');
 return {key:sha('ldb-delivery-image-v1:'+jobId+':'+audit.scene),scene:audit.scene,
 category:audit.scene==='THUMBNAIL'?'Thumbnail':'Approved reference images',
 mimeType:'image/png',name:audit.scene+'.png',bytes:audit.bytes,sha256:audit.sha256};
}
export async function handleQualityImport(req,{storage,env={},createBackend}={}){
 const denied=qualityImportGate(req,env);
 if(denied)return denied;
 const path=new URL(req.url).pathname;
 try{
  const job=await storage.get('job');
  if(path==='/internal/quality/status'){
   if(!job?.id||!/^[a-f0-9]{64}$/.test(job.id))return json({status:'NO_JOB',deliveryReady:false},404);
   if(job.status!=='IMAGES_READY'||job.index!==17||job.stop===true){
    return json({status:'IMAGES_NOT_READY',jobStatus:job.status,completedScenes:job.index,
     expectedScenes:17,stagedVerified:null,reviewReady:false,visualAudit:'PENDING',
     deliveryReady:false});
   }
   // Inspect all 17 persisted corrected candidates, one at a time.
   // These are checksum-verified STAGED bytes, NOT pixel/visual approval.
   const items=[],prepared=durablePreparedImages(storage,{jobId:job.id});
   for(const scene of ALL_SCENES){
    const audit=await storage.get('prepared-audit:'+job.id+':'+scene);
    if(!audit){items.push({scene,status:'MISSING'});continue;}
    const asset=entry(job.id,audit);
    if(audit.scene!==scene||audit.source_sha256!==job.outputs?.[ALL_SCENES.indexOf(scene)]?.sha256)
     throw Error('PREPARED_SOURCE_CHANGED');
    const bytes=await prepared.readIfPresent(asset);
    if(!bytes)throw Error('PREPARED_BYTES_MISSING');
    items.push({scene,status:'STAGED',sha256:asset.sha256,bytes:asset.bytes,
     sourceSha256:audit.source_sha256});
   }
   const complete=items.filter(x=>x.status==='STAGED').length;
   return json({status:complete===17?'REVIEW_CANDIDATES_READY':'REVIEW_CANDIDATES_PARTIAL',
    jobId:job.id,expectedScenes:17,stagedVerified:complete,missingScenes:17-complete,
    scenes:items,reviewReady:complete===17,visualAudit:'PENDING',
    deliveryReady:false,googleUploadsStarted:false});
  }
  if(job?.status!=='IMAGES_READY'||job.index!==17||job.stop===true)throw Error('IMAGES_NOT_READY');
  if(path==='/internal/quality/image'){
   if(req.headers.get('Content-Type')!=='application/octet-stream')return json({status:'INVALID_BODY'},415);
   const encoded=req.headers.get('X-LDB-Image-Audit')||'';
   if(!/^[A-Za-z0-9_-]{1,8192}$/.test(encoded))throw Error('INVALID_AUDIT');
   const {jobId,audit}=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));
   if(jobId!==job.id)throw Error('JOB_MISMATCH');
   const asset=entry(jobId,audit),bytes=await read(req,8000000);
   const auditKey='prepared-audit:'+jobId+':'+audit.scene;
   const existing=await storage.get(auditKey);
   if(existing&&JSON.stringify(existing)!==JSON.stringify(audit))throw Error('AUDIT_CHANGED');
   await durablePreparedImages(storage,{jobId}).put(asset,bytes,audit.source_sha256);
   await storage.transaction(async tx=>{
    const prior=await tx.get(auditKey);
    if(prior&&JSON.stringify(prior)!==JSON.stringify(audit))throw Error('AUDIT_CHANGED');
    if(!prior)await tx.put(auditKey,audit);
   });
   return json({status:'STAGED',scene:audit.scene,sha256:asset.sha256,deliveryReady:false});
  }
  const body=JSON.parse((await read(req,32000)).toString('utf8'));
  const audits=[],assets=[],store=durablePreparedImages(storage,{jobId:job.id});
  for(const scene of ALL_SCENES){
   const audit=await storage.get('prepared-audit:'+job.id+':'+scene);
   const asset=entry(job.id,audit),bytes=await store.readIfPresent(asset);
   if(!bytes)throw Error('PREPARED_IMAGE_MISSING');
   audits.push(audit);assets.push({scene,mimeType:'image/png',bytes});
  }
  const backend=createBackend();
  const result=await submitDurableApprovedDelivery({deliveryStorage:storage,imageStorage:storage,textStorage:storage,
   drive:backend.drive,capacity:backend.capacity,expectedJobId:job.id,
   approvedAudit:body.approvedAudit,episode:body.episode,normalized:{assets,audits}});
  return json({status:result.checkpoint.status,assets:result.checkpoint.plan.assets.length},202);
 }catch{return json({status:'QUALITY_HANDOFF_REJECTED'},409);}
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {submitDurableApprovedDelivery} from '../lib/ldb/submit-durable-approved-delivery.mjs';
const jobId='a'.repeat(64);
const map=new Map(),imageStorage={get:async k=>map.get(k)};
const textStorage={get:async()=>undefined,transaction:async fn=>fn({get:async()=>undefined,put:async()=>{}})};
const deliveryStorage={transaction:async()=>{throw Error('SHOULD_NOT_QUEUE')}};
const drive={put:async()=>{throw Error('SHOULD_NOT_UPLOAD')}};
const capacity=async()=>{throw Error('SHOULD_NOT_CHECK_CAPACITY')};
const base={deliveryStorage,imageStorage,textStorage,drive,capacity,expectedJobId:jobId};
test('rejects missing trusted backends before any side effects',async()=>{await assert.rejects(submitDurableApprovedDelivery({}),/TRUSTED_DELIVERY_BACKEND_REQUIRED/);});
test('requires reviewer audit before reading runner storage',async()=>{await assert.rejects(submitDurableApprovedDelivery(base),/TRUSTED_REVIEW_REQUIRED/);});
test('refuses incomplete runner images without queue or upload',async()=>{await assert.rejects(submitDurableApprovedDelivery({...base,approvedAudit:{}}),/RUNNER_IMAGES_NOT_READY/);});

test('refuses mismatched runner job before delivery queue',async()=>{
 map.set('job',{id:'b'.repeat(64),status:'IMAGES_READY',index:17,outputs:Array(17).fill({})});
 try{await assert.rejects(submitDurableApprovedDelivery({...base,approvedAudit:{}}),/RUNNER_IMAGES_NOT_READY/);}
 finally{map.delete('job');}
});

import {createHash} from 'node:crypto';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {resumeDurableApprovedDelivery} from '../lib/ldb/resume-durable-approved-delivery.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
function durableFixture(){
 const images=new Map(),texts=new Map(),deliveries=new Map(),uploads=new Map();
 const storage=m=>({get:async k=>m.get(k),put:async(k,v)=>m.set(k,structuredClone(v)),setAlarm:async()=>{},deleteAlarm:async()=>{},transaction:async fn=>fn({get:async k=>m.get(k),put:async(k,v)=>m.set(k,structuredClone(v)),setAlarm:async()=>{},deleteAlarm:async()=>{}})});
 const outputs=ALL_SCENES.map((scene,i)=>{const bytes=Buffer.from('image-'+scene);images.set('image:'+i+':0',new Uint8Array(bytes));return {scene,chunks:1,bytes:bytes.length,sha256:digest(bytes),mimeType:'image/png'};});
 images.set('job',{id:jobId,status:'IMAGES_READY',index:17,outputs});
 const approvedAudit={jobId,status:'PASS',reviewerVerified:true,scenes:outputs.map(o=>({scene:o.scene,result:'PASS',sha256:o.sha256}))};
 const categories=[['Storyboard',[null]],['Image prompts',ALL_SCENES],['Flow video prompts',ALL_SCENES.slice(0,16)],['Narration',ALL_SCENES.slice(0,16)],['Quality audit',[null]],['Production manifest',[null]]];
 const otherAssets=[];let n=0;
 for(const [category,scenes] of categories)for(const scene of scenes){const bytes=Buffer.from(category+':'+(scene||'main'));otherAssets.push({category,...(scene?{scene}:{}),key:digest('asset-'+n++),name:(scene||'main')+'.txt',mimeType:'text/plain',bytes,bytesLength:bytes.length,sha256:digest(bytes)});}
 const drive={put:async a=>{const key=a.key||digest('folder:'+a.name+':'+(a.parentId||''));if(uploads.has(key))return uploads.get(key);const v=a.bytes?{id:key,status:'VERIFIED',sha256:digest(a.bytes)}:{id:key};uploads.set(key,v);return v;}};
 return {images,texts,deliveries,uploads,imageStorage:storage(images),textStorage:storage(texts),deliveryStorage:storage(deliveries),drive,capacity:async()=>({unlimited:true}),approvedAudit,otherAssets,expectedJobId:jobId,now:()=>0};
}
test('full 69-asset durable submission survives reconstruction without real uploads',async()=>{
 const f=durableFixture();
 const {checkpoint}=await submitDurableApprovedDelivery(f);
 assert.equal(checkpoint.status,'QUEUED');assert.equal(checkpoint.plan.assets.length,69);
 assert.equal(f.uploads.size,0);
 for(let i=0;i<69;i++){
  const coordinator=resumeDurableApprovedDelivery({...f,jobId});
  await coordinator.tick();
  assert.equal(f.deliveries.get('delivery').index,i+1);
 }
 assert.equal(f.deliveries.get('delivery').status,'COMPLETE');
 assert.equal(f.deliveries.get('delivery').verified.length,69);
});
test('corrupted persisted image blocks queue creation',async()=>{
 const f=durableFixture();
 f.images.set('image:0:0',new Uint8Array(Buffer.from('tampered')));
 await assert.rejects(submitDurableApprovedDelivery(f),/RUNNER_IMAGE_CHECKSUM_MISMATCH/);
 assert.equal(f.deliveries.has('delivery'),false);assert.equal(f.uploads.size,0);
});

test('corrupted persisted text after queue cannot be uploaded',async()=>{
 const f=durableFixture();
 const {checkpoint}=await submitDurableApprovedDelivery(f);
 const first=checkpoint.plan.assets[17];
 assert.equal(first.category,'Storyboard');
 const chunkKey='text:'+jobId+':'+first.key+':0';
 assert.ok(f.texts.has(chunkKey));
 f.texts.set(chunkKey,new Uint8Array(Buffer.from('tampered')));
 const coordinator=resumeDurableApprovedDelivery({...f,jobId});
 for(let i=0;i<17;i++)await coordinator.tick();
 await coordinator.tick();
 assert.equal(f.deliveries.get('delivery').index,17);
 assert.equal(f.deliveries.get('delivery').status,'NEEDS_REVIEW');
 assert.equal([...f.uploads.values()].filter(x=>x.status==='VERIFIED').length,17);
});

test('trusted durable submission carries a distinct approved disaster title to the saved checkpoint',async()=>{
 const f=durableFixture();
 const {checkpoint}=await submitDurableApprovedDelivery({...f,episode:'Great Molasses Flood — Boston 1919'});
 assert.equal(checkpoint.plan.episode,'Great Molasses Flood — Boston 1919');
 assert.equal(checkpoint.plan.assets.length,69);
 assert.equal(f.uploads.size,0,'submission cannot contact Google Drive');
});

import {Checkpoints} from '../cloudflare/ldb-runner/checkpoints.mjs';
import {SCENES as APPROVED_SCENES} from '../lib/ldb/approved-render-job.mjs';
function bundledSource(){
 const storyboard_utf8=JSON.stringify({title:'1923 Great Kantō Earthquake',
  scenes:Object.fromEntries(APPROVED_SCENES.map(scene=>[scene,{visual:'Original approved '+scene}]))});
 return {schema:'ldb-approved-render-job-v1',storyboard_utf8,
  approval:{schema:'ldb-storyboard-approval-v1',source:'local-manual-approval',
   hash_algorithm:'sha256-utf8-original-json',requires_backend_verification:true,
   storyboard_id:digest(storyboard_utf8),approved_scene_count:17},
  render_scenes:APPROVED_SCENES.map(scene=>({id:scene,
   image_prompt:'Historic anime Original approved '+scene,
   narration:'Independent English narration '+scene,
   flow_prompt:'EXACTLY 10 SECONDS; 0–2s: Start; 2–6s: Move; 6–10s: Hold '+scene}))};
}
test('automatic 52 text assets use persisted storyboard and audited 17-image bytes through delivery',async()=>{
 const f=durableFixture(),oldJob=f.images.get('job'),bundle=bundledSource();
 const actualJobId=digest(bundle.storyboard_utf8);
 f.expectedJobId=actualJobId;
 f.approvedAudit={...f.approvedAudit,jobId:actualJobId};
 f.images.delete('job');
 await new Checkpoints(f.imageStorage).submit(actualJobId,bundle.render_scenes,{approvedBundle:bundle});
 const sourceJob=f.images.get('job');
 f.images.set('job',{...sourceJob,status:'IMAGES_READY',index:17,outputs:oldJob.outputs});
 const {checkpoint}=await submitDurableApprovedDelivery({...f,otherAssets:undefined,episode:undefined});
 assert.equal(checkpoint.plan.episode,'1923 Great Kantō Earthquake');
 assert.equal(checkpoint.plan.assets.length,69);
 assert.equal(checkpoint.plan.assets.filter(x=>x.category==='Narration').length,16);
 assert.equal(f.uploads.size,0,'queueing is not a Drive upload');
 for(let i=0;i<69;i++)await resumeDurableApprovedDelivery({...f,jobId:actualJobId}).tick();
 assert.equal(f.deliveries.get('delivery').status,'COMPLETE');
 assert.equal(f.deliveries.get('delivery').verified.length,69);
});
test('legacy job without original approval source refuses automatic packaging',async()=>{
 const f=durableFixture();
 await assert.rejects(submitDurableApprovedDelivery({...f,otherAssets:undefined}),
   /APPROVED_SOURCE_UNAVAILABLE/);
 assert.equal(f.deliveries.has('delivery'),false);
 assert.equal(f.uploads.size,0);
});

import {productionMilestoneState,notifyProductionMilestones} from '../lib/ldb/production-milestones.mjs';
import {eligibleMilestones} from '../lib/ldb/google-delivery.mjs';
import {createVaultLocalDriveBackend} from '../cloudflare/ldb-google-vault/delivery-backend.mjs';
import {handleVaultDeliveryBridge} from '../cloudflare/ldb-google-vault/delivery-bridge.mjs';
import {createGoogleDeliveryBridge} from '../cloudflare/ldb-runner/google-delivery-bridge.mjs';
function correctedFixture(){
 const f=durableFixture();
 const originals=f.images.get('job').outputs;
 const assets=ALL_SCENES.map(scene=>({scene,mimeType:'image/png',bytes:Buffer.from('corrected-'+scene)}));
 const audits=assets.map((a,i)=>({scene:a.scene,source_sha256:originals[i].sha256,sha256:digest(a.bytes),bytes:a.bytes.length,
 width:576,height:1024,structural_check:'PASS',neutral_grayscale:i<16,
 pixel_audit:{scene:a.scene,sha256:digest(a.bytes),bytes:a.bytes.length,width:576,height:1024,
 structural_check:'PASS',reasons:[],neutral_grayscale:i<16,max_channel_spread:i<16?0:30,non_neutral_pixels:i<16?0:100}}));
 f.normalized={assets,audits};
 f.approvedAudit.scenes=assets.map(a=>({scene:a.scene,result:'PASS',sha256:digest(a.bytes)}));
 return f;
}
test('corrected 69-file path survives each restart, STOP/resume and private Gmail milestone transport',async()=>{
 const f=correctedFixture(),original=structuredClone(f.images.get('job'));
 const all=new Map();
 // Single Durable Object storage holds job, corrected images, texts and delivery.
 for(const [k,v] of f.images)all.set(k,v);
 const storage={get:async k=>structuredClone(all.get(k)),put:async(k,v)=>all.set(k,structuredClone(v)),
 setAlarm:async()=>{},deleteAlarm:async()=>{},
 transaction:async fn=>fn({get:async k=>structuredClone(all.get(k)),put:async(k,v)=>all.set(k,structuredClone(v)),setAlarm:async()=>{},deleteAlarm:async()=>{}})};
 f.imageStorage=f.textStorage=f.deliveryStorage=storage;
 const mail=new Map(),sent=[];
 const ms={get:async k=>mail.get(k),put:async(k,v)=>mail.set(k,v),
 transaction:async fn=>fn({get:async k=>mail.get(k),put:async(k,v)=>mail.set(k,v)})};
 const secret='separate-test-service-secret-1234567890';
 const backend=createVaultLocalDriveBackend({enabled:true,storage:ms,vault:{accessToken:async()=>'TEST_ONLY'},
 fetcher:async(url,options)=>{assert.equal(url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');sent.push(options.body);return Response.json({id:'mail-'+sent.length});}});
 const bridge=createGoogleDeliveryBridge({DELIVERY_BRIDGE_ENABLED:'true',GOOGLE_DELIVERY_BRIDGE_SECRET:secret,
 GOOGLE_VAULT:{fetch:async(url,options)=>handleVaultDeliveryBridge(new Request(url,options),
 {enabled:true,notificationsEnabled:true,secret,createBackend:()=>backend})}});
 const notify=()=>notifyProductionMilestones({storage,notify:bridge.notifyMilestone});
 // Simulate real saved counts without granting any visual approval.
 await storage.put('job',{...original,status:'QUEUED',index:6,outputs:original.outputs.slice(0,6),approvedSource:{sha256:'b'.repeat(64)}});
 await notify();assert.equal(sent.length,1);
 await storage.put('job',{...original,status:'QUEUED',index:12,outputs:original.outputs.slice(0,12),approvedSource:{sha256:'b'.repeat(64)}});
 await notify();assert.equal(sent.length,2);
 await storage.put('job',original);
 const {checkpoint}=await submitDurableApprovedDelivery(f);
 assert.equal(checkpoint.plan.assets.length,69);
 assert.deepEqual(await storage.get('job'),original,'source runner checkpoint is immutable');
 await notify();assert.equal(sent.length,3,'70 follows trusted final-byte review and complete text plan');
 for(let i=0;i<20;i++)await resumeDurableApprovedDelivery({...f,jobId}).tick();
 await resumeDurableApprovedDelivery({...f,jobId}).stop();
 await resumeDurableApprovedDelivery({...f,jobId}).tick();
 assert.equal((await storage.get('delivery')).index,20);
 assert.deepEqual(eligibleMilestones(await productionMilestoneState(storage)),[]);
 await resumeDurableApprovedDelivery({...f,jobId}).resume();
 for(let i=20;i<69;i++){
  await resumeDurableApprovedDelivery({...f,jobId}).tick();
  if(i===67)assert.ok(!eligibleMilestones(await productionMilestoneState(storage)).includes(100));
 }
 await notify();await notify();
 const done=await storage.get('delivery');
 assert.equal(done.status,'COMPLETE');assert.equal(done.verified.length,69);
 assert.equal(sent.length,4,'one simulated email per milestone, no duplicates after restart');
 assert.equal(done.plan.assets[0].sha256,digest(f.normalized.assets[0].bytes));
 assert.notEqual(done.plan.assets[0].sha256,original.outputs[0].sha256);
});
test('persisted corrected-image tampering stops delivery without upload',async()=>{
 const f=correctedFixture(),{checkpoint}=await submitDurableApprovedDelivery(f);
 const first=checkpoint.plan.assets[0];
 f.images.set('prepared:'+jobId+':'+first.key+':0',new Uint8Array(Buffer.from('tampered')));
 await resumeDurableApprovedDelivery({...f,jobId}).tick();
 assert.equal(f.deliveries.get('delivery').status,'NEEDS_REVIEW');
 assert.equal(f.deliveries.get('delivery').index,0);
 assert.equal([...f.uploads.values()].filter(v=>v.status==='VERIFIED').length,0);
});
test('unreviewed corrected images never persist or queue',async()=>{
 const f=correctedFixture();f.approvedAudit.scenes[0].result='FAIL';
 await assert.rejects(submitDurableApprovedDelivery(f),/INVALID_VISUAL_AUDIT/);
 assert.equal(f.deliveries.has('delivery'),false);
 assert.equal([...f.images.keys()].some(k=>k.startsWith('prepared:')),false);
});


import {handleQualityImport} from '../cloudflare/ldb-runner/quality-import.mjs';
test('private image staging and trusted review queue all 69 assets without uploads',async()=>{
 const f=correctedFixture(),map=f.images;
 const storage=f.imageStorage;
 // Automatic text production requires the original persisted approval bundle.
 const old=map.get('job'),bundle=bundledSource(),id=digest(bundle.storyboard_utf8);
 map.delete('job');
 await new Checkpoints(storage).submit(id,bundle.render_scenes,{approvedBundle:bundle});
 map.set('job',{...map.get('job'),status:'IMAGES_READY',index:17,outputs:old.outputs});
 f.approvedAudit.jobId=id;
 const stageSecret='independent-image-staging-secret-123456789';
 const reviewSecret='independent-quality-review-secret-123456789';
 const env={RUNNER_ENABLED:'true',QUALITY_IMPORT_ENABLED:'true',QUALITY_REVIEW_ENABLED:'true',
  DELIVERY_BRIDGE_ENABLED:'true',QUALITY_IMPORT_SECRET:stageSecret,
  QUALITY_REVIEW_SECRET:reviewSecret,RUNNER_SECRET:'runner-separate-test-secret-long-enough-12345'};
 const options={storage,env,createBackend:()=>({drive:f.drive,capacity:f.capacity})};
 const request=(path,body,headers={},secret=stageSecret)=>new Request('https://runner'+path,{method:'POST',headers:{Authorization:'Bearer '+secret,...headers},body});
 const noauth=await handleQualityImport(new Request('https://runner/internal/quality/image',{method:'POST'}),options);
 assert.equal(noauth.status,401);
 const disabled=await handleQualityImport(request('/internal/quality/review','{}',{},reviewSecret),
  {...options,env:{...env,QUALITY_REVIEW_ENABLED:'false'}});
 assert.equal(disabled.status,503);
 for(let i=0;i<17;i++){
  const audit=f.normalized.audits[i];
  const req=request('/internal/quality/image',f.normalized.assets[i].bytes,{'Content-Type':'application/octet-stream',
   'X-LDB-Image-Audit':Buffer.from(JSON.stringify({jobId:id,audit})).toString('base64url')});
  const response=await handleQualityImport(req,options);
  assert.equal(response.status,200);
  assert.equal((await response.json()).deliveryReady,false);
 }
 assert.equal(map.has('delivery'),false,'staging alone does not approve delivery');
 assert.equal(f.uploads.size,0);
 const stageCannotApprove=await handleQualityImport(request('/internal/quality/review',JSON.stringify({approvedAudit:f.approvedAudit})),options);
 assert.equal(stageCannotApprove.status,401);
 const rejected=await handleQualityImport(request('/internal/quality/review',JSON.stringify({approvedAudit:{...f.approvedAudit,reviewerVerified:false}}),{},reviewSecret),options);
 assert.equal(rejected.status,409);assert.equal(map.has('delivery'),false);
 const response=await handleQualityImport(request('/internal/quality/review',JSON.stringify({approvedAudit:f.approvedAudit}),{},reviewSecret),options);
 assert.equal(response.status,202);
 assert.equal((await response.json()).assets,69);
 assert.equal(map.get('delivery').status,'QUEUED');
 assert.equal(f.uploads.size,0);
 assert.equal(map.get('job').outputs[0].sha256,old.outputs[0].sha256);
});
test('milestone transport is disabled independently of Drive delivery',async()=>{
 let called=false;
 const secret='independent-notification-service-secret-12345';
 const request=new Request('https://vault/internal/gmail/milestone',{method:'POST',headers:{Authorization:'Bearer '+secret},body:'{}'});
 const response=await handleVaultDeliveryBridge(request,{enabled:true,secret,createBackend:()=>{called=true;}});
 assert.equal(response.status,503);assert.equal(called,false);
});

test('STOP immediately before atomic 69-file queue blocks handoff and uploads',async()=>{
 const f=durableFixture(),transaction=f.deliveryStorage.transaction;
 f.deliveryStorage.transaction=async fn=>{
  f.images.set('job',{...f.images.get('job'),stop:true});
  return transaction(fn);
 };
 await assert.rejects(submitDurableApprovedDelivery(f),/JOB_STOPPED_OR_CHANGED_BEFORE_DELIVERY_QUEUE/);
 assert.equal(f.deliveries.has('delivery'),false);
 assert.equal(f.uploads.size,0);
 assert.equal(f.images.get('job').stop,true);
});
test('single-store Durable Object STOP is rejected within same queue transaction',async()=>{
 const f=durableFixture(),transaction=f.imageStorage.transaction;
 f.imageStorage.transaction=async fn=>{
  f.images.set('job',{...f.images.get('job'),stop:true});
  return transaction(fn);
 };
 f.deliveryStorage=f.imageStorage;
 await assert.rejects(submitDurableApprovedDelivery(f),/JOB_STOPPED_OR_CHANGED_BEFORE_DELIVERY_QUEUE/);
 assert.equal(f.images.has('delivery'),false);
 assert.equal(f.uploads.size,0);
});
test('image checkpoint changed after preflight cannot enter delivery queue',async()=>{
 const f=durableFixture(),transaction=f.deliveryStorage.transaction;
 f.deliveryStorage.transaction=async fn=>{
  const latest=f.images.get('job'),outputs=structuredClone(latest.outputs);
  outputs[0].sha256='f'.repeat(64);
  f.images.set('job',{...latest,outputs});
  return transaction(fn);
 };
 await assert.rejects(submitDurableApprovedDelivery(f),/JOB_STOPPED_OR_CHANGED_BEFORE_DELIVERY_QUEUE/);
 assert.equal(f.deliveries.has('delivery'),false);
 assert.equal(f.uploads.size,0);
});

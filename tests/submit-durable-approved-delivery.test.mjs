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
 const storage=m=>({get:async k=>m.get(k),transaction:async fn=>fn({get:async k=>m.get(k),put:async(k,v)=>m.set(k,structuredClone(v)),setAlarm:async()=>{},deleteAlarm:async()=>{}})});
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
 f.images.delete('job');
 await new Checkpoints(f.imageStorage).submit(jobId,bundle.render_scenes,{approvedBundle:bundle});
 const sourceJob=f.images.get('job');
 f.images.set('job',{...sourceJob,status:'IMAGES_READY',index:17,outputs:oldJob.outputs});
 const {checkpoint}=await submitDurableApprovedDelivery({...f,otherAssets:undefined,episode:undefined});
 assert.equal(checkpoint.plan.episode,'1923 Great Kantō Earthquake');
 assert.equal(checkpoint.plan.assets.length,69);
 assert.equal(checkpoint.plan.assets.filter(x=>x.category==='Narration').length,16);
 assert.equal(f.uploads.size,0,'queueing is not a Drive upload');
 for(let i=0;i<69;i++)await resumeDurableApprovedDelivery({...f,jobId}).tick();
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

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SCENES,validateRenderJob} from '../lib/ldb/approved-render-job.mjs';
import {readPersistedApprovedSource,buildApprovedTextAssets} from '../lib/ldb/approved-text-assets.mjs';
import {Checkpoints} from '../cloudflare/ldb-runner/checkpoints.mjs';
import {prepareApprovedProductionDelivery} from '../lib/ldb/approved-production-delivery.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
function fixture(){
 const storyboard_utf8=JSON.stringify({title:'2011 Tōhoku Earthquake and Tsunami',
  scenes:Object.fromEntries(SCENES.map(id=>[id,{visual:'Approved '+id}]))});
 const id=sha(storyboard_utf8);
 const bundle={schema:'ldb-approved-render-job-v1',storyboard_utf8,
  approval:{schema:'ldb-storyboard-approval-v1',source:'local-manual-approval',
   hash_algorithm:'sha256-utf8-original-json',requires_backend_verification:true,
   storyboard_id:id,approved_scene_count:17},
  render_scenes:SCENES.map(id=>({id,image_prompt:'Anime Approved '+id,
   narration:'Narration '+id,flow_prompt:'EXACTLY 10 SECONDS 0–2s: Begin 2–6s: Move 6–10s: Hold '+id}))};
 const images=SCENES.map((scene,i)=>({scene,mimeType:'image/png',bytes:Buffer.from('fake image '+i)}));
 const outputs=images.map(x=>({scene:x.scene,mimeType:x.mimeType,bytes:x.bytes.length,sha256:sha(x.bytes)}));
 const job={id,scenes:bundle.render_scenes,status:'IMAGES_READY',index:17,outputs};
 const approvedAudit={jobId:id,status:'PASS',reviewerVerified:true,
  scenes:outputs.map(x=>({scene:x.scene,result:'PASS',sha256:x.sha256}))};
 return {bundle,job,images,approvedAudit};
}
function storage(){const map=new Map(),tx={get:async k=>structuredClone(map.get(k)),
 put:async(k,v)=>map.set(k,structuredClone(v)),setAlarm:async()=>{},deleteAlarm:async()=>{}};
 return {map,s:{...tx,transaction:async fn=>fn(tx)}};}
test('approved source survives durable checkpoint and validates after restart',async()=>{
 const f=fixture(),db=storage(),c=new Checkpoints(db.s);
 await c.submit(f.job.id,f.bundle.render_scenes,{approvedBundle:f.bundle});
 const job=await c.status();assert.equal(job.approvedSource.sha256.length,64);
 db.map.set('job',{...job,status:'IMAGES_READY'});
 assert.deepEqual(await readPersistedApprovedSource(db.s,{expectedJobId:f.job.id}),f.bundle);
});
test('automatic builder generates exactly 52 text assets and validates full 69-deliverable plan',()=>{
 const f=fixture(),out=buildApprovedTextAssets(f);
 assert.equal(out.episode,'2011 Tōhoku Earthquake and Tsunami');
 assert.equal(out.assets.length,52);
 for(const [category,count] of [['Storyboard',1],['Image prompts',17],['Flow video prompts',16],['Narration',16],['Quality audit',1],['Production manifest',1]])
  assert.equal(out.assets.filter(a=>a.category===category).length,count);
 const plan=prepareApprovedProductionDelivery({...f,otherAssets:out.assets,episode:out.episode});
 assert.equal(plan.plan.assets.length,69);
 assert.deepEqual(out.assets.map(a=>a.sha256),buildApprovedTextAssets(f).assets.map(a=>a.sha256));
});
test('tampered source and foreign scene expansion never pass',async()=>{
 const f=fixture(),db=storage();await new Checkpoints(db.s).submit(f.job.id,f.bundle.render_scenes,{approvedBundle:f.bundle});
 db.map.set('job',{...(await db.s.get('job')),status:'IMAGES_READY'});
 db.map.set('approved-source:0',new Uint8Array(Buffer.from('corrupt')));
 await assert.rejects(readPersistedApprovedSource(db.s,{expectedJobId:f.job.id}),/APPROVED_SOURCE_INTEGRITY_FAILED/);
 const bad=structuredClone(f.bundle);bad.render_scenes[0].narration='changed';
 assert.throws(()=>buildApprovedTextAssets({...f,bundle:bad}),/APPROVED_SOURCE_MISMATCH/);
 assert.throws(()=>buildApprovedTextAssets({...f,approvedAudit:{...f.approvedAudit,reviewerVerified:false}}),/TRUSTED_VISUAL_REVIEW_REQUIRED/);
});
test('same storyboard ID cannot silently substitute another prompt expansion',async()=>{
 const f=fixture(),db=storage(),c=new Checkpoints(db.s);
 await c.submit(f.job.id,f.bundle.render_scenes,{approvedBundle:f.bundle});
 const forged=structuredClone(f.bundle);forged.render_scenes[0].narration='different';
 await assert.rejects(c.submit(f.job.id,forged.render_scenes,{approvedBundle:forged}),/JOB_INPUT_CHANGED/);
});

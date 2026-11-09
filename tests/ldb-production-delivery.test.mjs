import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {ProductionDelivery,validateDeliveryPlan,storageCapacity,assertDeliveryCheckpointIntegrity} from '../lib/ldb/production-delivery.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),bytes=Buffer.from('verified test bytes');
class Storage{data=new Map();queue=Promise.resolve();async get(k){return structuredClone(this.data.get(k));}async put(k,v){this.data.set(k,structuredClone(v));}async setAlarm(t){this.alarm=t;}async deleteAlarm(){this.alarm=null;}transaction(fn){const p=this.queue.then(()=>fn(this));this.queue=p.catch(()=>{});return p;}}
function plan(){const scenes=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];const assets=[];for(const [category,ids] of [['Storyboard',['story']],['Approved reference images',scenes],['Image prompts',[...scenes,'THUMBNAIL']],['Flow video prompts',scenes],['Narration',scenes],['Thumbnail',['THUMBNAIL']],['Quality audit',['audit']],['Production manifest',['manifest']]])for(const scene of ids)assets.push({key:hash(category+scene),category,scene,name:scene+'.txt',mimeType:['Approved reference images','Thumbnail'].includes(category)?'image/png':'text/plain',bytes:bytes.length,sha256:hash(bytes)});return {jobId:'a'.repeat(64),approvalVerified:true,visualAudit:'PASS',episode:'Lake Nyos 1986',assets};}
function fixture(options={}){const s=new Storage();let puts=0;const deps={drive:{put:async a=>{puts++;return {id:a.key||hash(a.name),status:'VERIFIED',sha256:a.sha256};}},capacity:async()=>({unlimited:false,remaining:'999999999'}),readAsset:async()=>bytes,...options};return {s,deps,get puts(){return puts;},core:new ProductionDelivery(s,deps)};}
test('incomplete or unaudited plans cannot schedule delivery',async()=>{const f=fixture();await assert.rejects(f.core.submit({...plan(),visualAudit:'PENDING'}));const p=plan();p.assets.pop();assert.throws(()=>validateDeliveryPlan(p));assert.equal(f.s.data.size,0);});
test('quota check blocks every upload and supports resume',async()=>{const f=fixture({capacity:async()=>({remaining:'0',unlimited:false})});await f.core.submit(plan());await f.core.tick();assert.equal(f.puts,0);assert.equal((await f.s.get('delivery')).status,'WAITING_STORAGE');await f.core.resume();});
test('STOP during upload preserves checkpoint and restart resumes',async()=>{const f=fixture();await f.core.submit(plan());f.deps.readAsset=async()=>{await f.core.stop();return bytes;};f.core.readAsset=f.deps.readAsset;await f.core.tick();const j=await f.s.get('delivery');assert.equal(j.status,'STOPPED');assert.equal(j.index,1);const restarted=new ProductionDelivery(f.s,{...f.deps,readAsset:async()=>bytes});await restarted.resume();await restarted.tick();assert.equal((await f.s.get('delivery')).index,2);});
test('changed bytes fail closed before file upload',async()=>{const f=fixture({readAsset:async()=>Buffer.from('wrong')});await f.core.submit(plan());await f.core.tick();assert.equal((await f.s.get('delivery')).status,'NEEDS_REVIEW');assert.equal((await f.s.get('delivery')).verified.length,0);});
test('concurrent ticks single-flight and all 69 assets must verify',async()=>{const f=fixture();await f.core.submit(plan());await Promise.all([f.core.tick(),f.core.tick()]);assert.equal((await f.s.get('delivery')).index,1);for(let i=1;i<69;i++)await f.core.tick();const j=await f.s.get('delivery');assert.equal(j.status,'COMPLETE');assert.equal(j.verified.length,69);});
test('storage quota parser handles over-quota and rejects unknown data',async()=>{assert.deepEqual(await storageCapacity(async()=>'token',async()=>({ok:true,json:async()=>({storageQuota:{limit:'100',usage:'101'}})})),{remaining:'0',unlimited:false});await assert.rejects(storageCapacity(async()=>'token',async()=>({ok:true,json:async()=>({})})));});

test('duplicate remote file ID blocks completion and preserves the last verified checkpoint',async()=>{
 const f=fixture({drive:{put:async a=>({id:'same-remote-id',status:'VERIFIED',sha256:a.sha256})}});
 await f.core.submit(plan());await f.core.tick();await f.core.tick();
 const j=await f.s.get('delivery');
 assert.equal(j.status,'NEEDS_REVIEW');assert.equal(j.index,1);assert.equal(j.verified.length,1);
});

test('queue snapshots approved assets synchronously before awaiting the durable guard',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve});
 const f=fixture({queueGuard:async()=>gate});
 const original=plan(),expected=structuredClone(original);
 const pending=f.core.submit(original);
 original.episode='Unapproved Episode';
 original.assets[0].name='tampered.jpg';
 original.assets[0].sha256='f'.repeat(64);
 original.assets.pop();
 release();
 await pending;
 const saved=await f.s.get('delivery');
 assert.equal(saved.plan.assets.length,69);
 assert.equal(saved.plan.episode,expected.episode);
 assert.equal(saved.plan.assets[0].name,expected.assets[0].name);
 assert.equal(saved.plan.assets[0].sha256,expected.assets[0].sha256);
 assert.equal(saved.fingerprint,validateDeliveryPlan(expected));
 assert.equal(saved.fingerprint,validateDeliveryPlan(saved.plan));
 assert.equal(saved.index,0);
 assert.equal(f.puts,0);
});
test('uncloneable plans fail closed before any checkpoint or upload',async()=>{
 const f=fixture(),p=plan();
 p.unreviewedFunction=()=>true;
 await assert.rejects(f.core.submit(p),/INVALID_DELIVERY_PLAN/);
 assert.equal(f.s.data.size,0);
 assert.equal(f.puts,0);
});

test('durable checkpoint must be revalidated BEFORE any Drive request on every alarm',async()=>{
 const tamper=[
  j=>{j.plan.assets[0].name='unapproved.txt';},
  j=>{j.plan.assets[0].sha256='0'.repeat(64);},
  j=>{j.fingerprint='0'.repeat(64);},
  j=>{j.index=1;},
  j=>{j.index=70;},
  j=>{j.status='COMPLETE';},
  j=>{j.attempts[0]=-1;},
  j=>{j.stopped='false';},
  j=>{j.status='STOPPED';}
 ];
 for(const change of tamper){
  const f=fixture();await f.core.submit(plan());
  change(f.s.data.get('delivery'));
  await f.core.tick();
  const j=await f.s.get('delivery');
  assert.equal(j.status,'NEEDS_REVIEW');
  assert.equal(j.stopped,true);
  assert.equal(j.error,'DELIVERY_CHECKPOINT_INTEGRITY_FAILED');
  assert.equal(f.puts,0,'no folder creation or Drive upload');
  assert.equal(j.verified.length,0);
  await assert.rejects(f.core.resume(),/RESUME_NOT_SAFE/);
 }
});
test('duplicated verified remote ID or mismatched hash blocks next upload',async()=>{
 for(const change of [
  j=>{j.verified[1].id=j.verified[0].id;},
  j=>{j.verified[1].sha256='a'.repeat(64);}
 ]){
  const f=fixture();await f.core.submit(plan());await f.core.tick();await f.core.tick();
  const before=f.puts,j=f.s.data.get('delivery');change(j);
  assert.throws(()=>assertDeliveryCheckpointIntegrity(j),/DELIVERY_CHECKPOINT_INTEGRITY_FAILED/);
  await f.core.tick();
  assert.equal((await f.s.get('delivery')).status,'NEEDS_REVIEW');
  assert.equal((await f.s.get('delivery')).index,2);
  assert.equal(f.puts,before,'no provider access after receipt tampering');
 }
});
test('STOPPED snapshot with changed episode cannot resume or request Drive',async()=>{
 const f=fixture();await f.core.submit(plan());await f.core.stop();
 f.s.data.get('delivery').plan.episode='Modified Episode';
 await assert.rejects(f.core.resume(),/DELIVERY_CHECKPOINT_INTEGRITY_FAILED/);
 assert.equal((await f.s.get('delivery')).status,'STOPPED');
 assert.equal(f.puts,0);
});
test('well-formed in-progress checkpoint still survives restart and STOP/Resume',async()=>{
 const f=fixture();await f.core.submit(plan());await f.core.tick();
 assert.equal(assertDeliveryCheckpointIntegrity(await f.s.get('delivery')),true);
 await f.core.stop();assert.equal(assertDeliveryCheckpointIntegrity(await f.s.get('delivery')),true);
 await f.core.resume();
 const second=new ProductionDelivery(f.s,f.deps);await second.tick();
 assert.equal((await f.s.get('delivery')).index,2);
});

test('corrupt Drive reservation and exhausted file attempts require immediate owner review',async()=>{
 for(const code of ['DRIVE_RESERVATION_INTEGRITY_FAILED','DRIVE_RETRY_LIMIT']){
  let calls=0;
  const f=fixture({drive:{put:async()=>{calls++;throw Error(code);}}});
  await f.core.submit(plan());
  await f.core.tick();
  const checkpoint=await f.s.get('delivery');
  assert.equal(checkpoint.status,'NEEDS_REVIEW',code);
  assert.equal(checkpoint.error,code);
  assert.equal(checkpoint.index,0);
  assert.equal(checkpoint.verified.length,0);
  assert.equal(checkpoint.attempts[0],1);
  assert.equal(calls,1);
  await f.core.tick();
  assert.equal(calls,1,'no repeated automatic provider request');
  await assert.rejects(f.core.resume(),/RESUME_NOT_SAFE/);
 }
});

test('transient Drive upload uncertainty still follows bounded automatic retry path',async()=>{
 let calls=0;
 const f=fixture({drive:{put:async()=>{
  calls++;
  throw Error('DRIVE_UPLOAD_UNCONFIRMED');
 }}});
 await f.core.submit(plan());
 await f.core.tick();
 const first=await f.s.get('delivery');
 assert.equal(first.status,'RETRY_WAIT');
 assert.equal(first.error,'DELIVERY_RETRY_REQUIRED');
 assert.equal(first.attempts[0],1);
 await f.core.tick();
 assert.equal(calls,2);
 assert.equal((await f.s.get('delivery')).status,'RETRY_WAIT');
});

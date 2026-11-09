import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {ProductionDelivery,validateDeliveryPlan,storageCapacity,assertDeliveryCheckpointIntegrity} from '../lib/ldb/production-delivery.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),bytes=Buffer.from('verified test bytes');
class Storage{data=new Map();queue=Promise.resolve();async get(k){return structuredClone(this.data.get(k));}async put(k,v){this.data.set(k,structuredClone(v));}async setAlarm(t){this.alarm=t;}async deleteAlarm(){this.alarm=null;}transaction(fn){const p=this.queue.then(()=>fn(this));this.queue=p.catch(()=>{});return p;}}
function plan(){const scenes=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];const assets=[];for(const [category,ids] of [['Storyboard',['story']],['Approved reference images',scenes],['Image prompts',[...scenes,'THUMBNAIL']],['Flow video prompts',scenes],['Narration',scenes],['Thumbnail',['THUMBNAIL']],['Quality audit',['audit']],['Production manifest',['manifest']]])for(const scene of ids)assets.push({key:hash(category+scene),category,scene,name:scene+'.txt',mimeType:['Approved reference images','Thumbnail'].includes(category)?'image/png':'text/plain',bytes:bytes.length,sha256:hash(bytes)});return {jobId:'a'.repeat(64),approvalVerified:true,visualAudit:'PASS',episode:'Lake Nyos 1986',assets};}
function fixture(options={}){const s=new Storage();let puts=0;const deps={drive:{put:async a=>{puts++;return {id:a.key||hash(a.name),status:'VERIFIED',sha256:a.sha256};}},capacity:async()=>({unlimited:false,remaining:'999999999'}),readAsset:async()=>bytes,...options};return {s,deps,get puts(){return puts;},core:new ProductionDelivery(s,deps)};}
test('incomplete or unaudited plans cannot schedule delivery',async()=>{const f=fixture();await assert.rejects(f.core.submit({...plan(),visualAudit:'PENDING'}));const p=plan();p.assets.pop();assert.throws(()=>validateDeliveryPlan(p));assert.equal(f.s.data.size,0);});
test('quota check blocks every upload and supports resume',async()=>{const f=fixture({capacity:async()=>({remaining:'0',unlimited:false})});await f.core.submit(plan());await f.core.tick();assert.equal(f.puts,0);assert.equal((await f.s.get('delivery')).status,'WAITING_STORAGE');await f.core.resume();});
test('STOP during asset read pauses before asset upload; restart resumes same checkpoint',async()=>{
 const f=fixture();
 await f.core.submit(plan());
 f.core.readAsset=async()=>{await f.core.stop();return bytes;};
 await f.core.tick();
 const checkpoint=await f.s.get('delivery');
 assert.equal(checkpoint.status,'STOPPED');
 assert.equal(checkpoint.stopped,true);
 assert.equal(checkpoint.index,0);
 assert.equal(checkpoint.verified.length,0);
 assert.equal(f.puts,3,'three idempotent folder operations, no asset upload');
 assert.equal(f.s.alarm,null);
 const restarted=new ProductionDelivery(f.s,{...f.deps,readAsset:async()=>bytes});
 await restarted.resume();
 await restarted.tick();
 assert.equal((await f.s.get('delivery')).index,1);
});
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

test('STOP during Drive quota query wins over insufficient-storage status and makes zero provider calls',async()=>{
 let f;
 f=fixture({capacity:async()=>{
  await f.core.stop();
  return {remaining:'0',unlimited:false};
 }});
 await f.core.submit(plan());
 await f.core.tick();
 const j=await f.s.get('delivery');
 assert.equal(j.status,'STOPPED');
 assert.equal(j.stopped,true);
 assert.equal(j.index,0);
 assert.equal(f.puts,0);
 assert.equal(f.s.alarm,null);
 await f.core.tick();
 assert.equal(f.puts,0);
});

test('STOP during a folder request prevents all subsequent folder and asset uploads',async()=>{
 for(const stopAfter of ['Living Disaster Book','Lake Nyos 1986','Storyboard']){
  let f,stoppedOnce=false;
  const calls=[];
  f=fixture({drive:{put:async asset=>{
   calls.push(asset.name);
   if(asset.name===stopAfter&&!stoppedOnce){
    stoppedOnce=true;
    await f.core.stop();
   }
   return {id:asset.key||hash(asset.name),status:'VERIFIED',sha256:asset.sha256};
  }}});
  await f.core.submit(plan());
  await f.core.tick();
  const j=await f.s.get('delivery');
  const expected=['Living Disaster Book','Lake Nyos 1986','Storyboard'];
  const last=expected.indexOf(stopAfter);
  assert.deepEqual(calls,expected.slice(0,last+1));
  assert.equal(j.status,'STOPPED');
  assert.equal(j.index,0);
  assert.equal(j.verified.length,0);
  assert.equal(f.s.alarm,null);
  await f.core.tick();
  assert.equal(calls.length,last+1,'STOPPED tick makes no new provider calls');
  await f.core.resume();
  await f.core.tick();
  assert.equal((await f.s.get('delivery')).index,1);
 }
});

test('STOP cannot undo the one asset upload already in flight; verified receipt checkpoints safely',async()=>{
 let f,assetCalls=0;
 f=fixture({drive:{put:async asset=>{
  if(asset.mimeType!=='application/vnd.google-apps.folder'){
   assetCalls++;
   await f.core.stop();
  }
  return {id:asset.key||hash(asset.name),status:'VERIFIED',sha256:asset.sha256};
 }}});
 await f.core.submit(plan());
 await f.core.tick();
 const j=await f.s.get('delivery');
 assert.equal(assetCalls,1);
 assert.equal(j.index,1,'acknowledged in-flight upload must be checkpointed');
 assert.equal(j.status,'STOPPED','no next-asset alarm');
 assert.equal(j.stopped,true);
 assert.equal(f.s.alarm,null);
 await f.core.tick();
 assert.equal(assetCalls,1);
 // A restarted coordinator may resume, but does not repeat already verified
 // asset 0; the next checkpoint begins at index 1.
 const restarted=new ProductionDelivery(f.s,{...f.deps});
 await restarted.resume();
 await restarted.tick();
 const next=await f.s.get('delivery');
 assert.equal(next.index,2);
 assert.equal(assetCalls,2);
 assert.equal(next.verified.length,2);
});

test('episode titles colliding with root or category folder names keep distinct Drive reservations',async()=>{
 for(const episode of ['Living Disaster Book','Storyboard','Narration',
  'Approved reference images','Thumbnail','Quality audit','Production manifest']){
  const p=plan();p.episode=episode;
  const storage=new Storage(),reservations=new Map();
  let duplicateAttempts=0;
  const deps={
   capacity:async()=>({unlimited:true}),
   readAsset:async()=>bytes,
   drive:{put:async asset=>{
    const signature={name:asset.name,parentId:asset.parentId??null,
     mimeType:asset.mimeType};
    const existing=reservations.get(asset.key);
    if(existing){
     if(JSON.stringify(existing.signature)!==JSON.stringify(signature)){
      duplicateAttempts++;
      throw Error('DELIVERY_ASSET_CHANGED');
     }
     return {id:asset.key,status:'VERIFIED',sha256:asset.sha256??null};
    }
    reservations.set(asset.key,{signature});
    return {id:asset.key,status:'VERIFIED',sha256:asset.sha256??null};
   }}
  };
  await new ProductionDelivery(storage,deps).submit(p);
  // Reconstruct on every tick as a Durable Object alarm would after restart.
  for(let i=0;i<69;i++)await new ProductionDelivery(storage,deps).tick();
  const done=await storage.get('delivery');
  assert.equal(done.status,'COMPLETE',episode);
  assert.equal(done.index,69,episode);
  assert.equal(done.verified.length,69,episode);
  assert.equal(duplicateAttempts,0,episode);
  const root=hash('folder:'+p.jobId+':Living Disaster Book');
  const episodeKey=hash('folder:'+p.jobId+':'+episode+
   (episode==='Living Disaster Book'?':episode':''));
  assert.notEqual(root,episodeKey,'root and episode require unique identities');
  assert.deepEqual(reservations.get(root)?.signature,{
   name:'Living Disaster Book',parentId:null,
   mimeType:'application/vnd.google-apps.folder'
  });
  assert.equal(reservations.get(episodeKey)?.signature.parentId,root);
  if(['Storyboard','Narration','Approved reference images','Thumbnail',
   'Quality audit','Production manifest'].includes(episode)){
   const categoryKey=hash('folder:'+p.jobId+':'+episode+':category');
   assert.notEqual(episodeKey,categoryKey);
   assert.equal(reservations.get(categoryKey)?.signature.parentId,episodeKey);
  }
 }
});

test('normal episode folder keys preserve legacy reservation identity after restart',async()=>{
 const p=plan(),folderCalls=[];
 const f=fixture({drive:{put:async asset=>{
  if(asset.mimeType==='application/vnd.google-apps.folder')
   folderCalls.push({name:asset.name,key:asset.key,parentId:asset.parentId??null});
  return {id:asset.key,status:'VERIFIED',sha256:asset.sha256??null};
 }}});
 await f.core.submit(p);
 await f.core.tick();
 const expected=['Living Disaster Book',p.episode,'Storyboard'];
 assert.deepEqual(folderCalls.map(x=>x.name),expected);
 assert.deepEqual(folderCalls.map(x=>x.key),
  expected.map(name=>hash('folder:'+p.jobId+':'+name)));
 const restarted=new ProductionDelivery(f.s,f.deps);
 await restarted.tick();
 const second=folderCalls.slice(3);
 assert.deepEqual(second.map(x=>x.key),
  ['Living Disaster Book',p.episode,'Approved reference images']
   .map(name=>hash('folder:'+p.jobId+':'+name)));
 assert.equal((await f.s.get('delivery')).index,2);
});

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
 const f=fixture({drive:{put:async a=>({
  // Distinct folders are valid; only the FILE identity is duplicated.
  id:a.mimeType==='application/vnd.google-apps.folder'?
   hash('folder-id:'+a.name):'same-remote-id',
  status:'VERIFIED',sha256:a.sha256
 })}});
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

test('bad folder identity must not authorize a child Drive operation or automatic retry',async()=>{
 const cases=[
  {label:'root id absent',onFolder:(name,id)=>name==='Living Disaster Book'?undefined:id},
  {label:'root id malformed',onFolder:(name,id)=>name==='Living Disaster Book'?'../bad':id},
  {label:'root id not a string',onFolder:(name,id)=>name==='Living Disaster Book'?42:id},
  {label:'episode reuses root id',onFolder:(name,id)=>name==='Lake Nyos 1986'?'root_folder':id},
  {label:'category reuses episode id',onFolder:(name,id)=>name==='Storyboard'?'episode_folder':id},
  {label:'folder status not verified',onFolder:(name,id)=>id,status:'PENDING'}
 ];
 for(const scenario of cases){
  const requests=[];let assetUploads=0;
  const f=fixture({drive:{put:async asset=>{
   requests.push(asset.name);
   const folder=asset.mimeType==='application/vnd.google-apps.folder';
   if(folder){
    const id=asset.name==='Living Disaster Book'?'root_folder':
     asset.name==='Lake Nyos 1986'?'episode_folder':'category_folder';
    return {id:scenario.onFolder(asset.name,id),
     status:scenario.status??'VERIFIED',sha256:null};
   }
   assetUploads++;
   return {id:asset.key,status:'VERIFIED',sha256:asset.sha256};
  }}});
  await f.core.submit(plan());
  await f.core.tick();
  const state=await f.s.get('delivery');
  assert.equal(state.status,'NEEDS_REVIEW',scenario.label);
  assert.equal(state.error,'DELIVERY_FOLDER_VERIFY_FAILED',scenario.label);
  assert.equal(state.index,0,scenario.label);
  assert.equal(state.verified.length,0,scenario.label);
  assert.equal(assetUploads,0,scenario.label);
  const before=requests.length;
  await f.core.tick();
  assert.equal(requests.length,before,'unsafe folder must not retry automatically');
  await assert.rejects(f.core.resume(),/RESUME_NOT_SAFE/);
 }
});

test('folder ID cannot alias an already verified file on restart',async()=>{
 let rootRequests=0,assetUploads=0;
 const f=fixture({drive:{put:async asset=>{
  const folder=asset.mimeType==='application/vnd.google-apps.folder';
  if(folder){
   if(asset.name==='Living Disaster Book'){
    rootRequests++;
    return {id:rootRequests===1?'root_folder':hash('Storyboardstory'),
     status:'VERIFIED',sha256:null};
   }
   return {id:asset.name==='Lake Nyos 1986'?'episode_folder':
    'category_folder',status:'VERIFIED',sha256:null};
  }
  assetUploads++;
  return {id:asset.key,status:'VERIFIED',sha256:asset.sha256};
 }}});
 await f.core.submit(plan());
 await f.core.tick();
 assert.equal((await f.s.get('delivery')).index,1);
 assert.equal(assetUploads,1);
 const restarted=new ProductionDelivery(f.s,f.deps);
 await restarted.tick();
 const state=await f.s.get('delivery');
 assert.equal(state.index,1);
 assert.equal(state.status,'NEEDS_REVIEW');
 assert.equal(state.error,'DELIVERY_FOLDER_VERIFY_FAILED');
 assert.equal(assetUploads,1,'no new asset uploaded under aliased folder');
});

test('coordinator third retry recovers a delivered asset read-only without any fourth write',async()=>{
 let uploads=0,reconciles=0,remoteSaved=false;
 const f=fixture({drive:{
  put:async asset=>{
   if(asset.mimeType==='application/vnd.google-apps.folder')
    return {id:asset.key,status:'VERIFIED',sha256:null};
   uploads++;
   if(uploads===3)remoteSaved=true;
   throw Error('DRIVE_UPLOAD_UNCONFIRMED');
  },
  reconcile:async asset=>{
   reconciles++;
   if(!remoteSaved)throw Error('DRIVE_RECOVERY_NOT_FOUND');
   return {id:asset.key,status:'VERIFIED',sha256:asset.sha256??null};
  }
 }});
 await f.core.submit(plan());
 for(let i=0;i<3;i++)await f.core.tick();
 const before=await f.s.get('delivery');
 assert.equal(before.status,'RETRY_WAIT');
 assert.equal(before.attempts[0],3);
 assert.equal(before.index,0);
 const restarted=new ProductionDelivery(f.s,f.deps);
 await restarted.tick();
 const after=await f.s.get('delivery');
 assert.equal(after.index,1);
 assert.equal(after.verified.length,1);
 assert.equal(after.status,'QUEUED');
 assert.equal(after.attempts[0],3,'read-only verification does not increment upload attempts');
 assert.equal(uploads,3,'no fourth file write');
 assert.equal(reconciles,4,'root, episode, category, file inspected via existing IDs');
 assert.equal(f.s.alarm!==null,true);
});

test('failed final read-only recovery blocks further attempts and requires owner review',async()=>{
 let uploads=0,reconciles=0;
 const f=fixture({drive:{
  put:async asset=>{
   if(asset.mimeType==='application/vnd.google-apps.folder')
    return {id:asset.key,status:'VERIFIED',sha256:null};
   uploads++;
   throw Error('DRIVE_UPLOAD_UNCONFIRMED');
  },
  reconcile:async()=>{
   reconciles++;
   throw Error('DRIVE_RECOVERY_NOT_FOUND');
  }
 }});
 await f.core.submit(plan());
 for(let i=0;i<3;i++)await f.core.tick();
 const recovery=new ProductionDelivery(f.s,f.deps);
 await recovery.tick();
 const checkpoint=await f.s.get('delivery');
 assert.equal(checkpoint.index,0);
 assert.equal(checkpoint.status,'NEEDS_REVIEW');
 assert.equal(checkpoint.error,'DRIVE_READONLY_RECOVERY_FAILED');
 assert.equal(checkpoint.attempts[0],3);
 assert.equal(uploads,3);
 assert.equal(reconciles,1,'fail closed on first missing reserved folder');
 assert.equal(f.s.alarm,null);
 await new ProductionDelivery(f.s,f.deps).tick();
 assert.equal(uploads,3);
 assert.equal(reconciles,1);
 await assert.rejects(recovery.resume(),/RESUME_NOT_SAFE/);
});

test('third coordinator attempt without an explicit read-only adapter still stops',async()=>{
 let uploads=0;
 const f=fixture({drive:{put:async asset=>{
  if(asset.mimeType==='application/vnd.google-apps.folder')
   return {id:asset.key,status:'VERIFIED',sha256:null};
  uploads++;throw Error('DRIVE_UPLOAD_UNCONFIRMED');
 }}});
 await f.core.submit(plan());
 for(let i=0;i<3;i++)await f.core.tick();
 await new ProductionDelivery(f.s,f.deps).tick();
 const j=await f.s.get('delivery');
 assert.equal(j.status,'NEEDS_REVIEW');
 assert.equal(j.error,'DELIVERY_RETRY_LIMIT');
 assert.equal(uploads,3);
 assert.equal(f.s.alarm,null);
});

test('final read-only recovery writes a durable RECONCILING marker before its first remote GET',async()=>{
 let release,seen;const gate=new Promise(resolve=>{release=resolve});
 const started=new Promise(resolve=>{seen=resolve});
 let assetWrites=0,reconcileCalls=0;
 const f=fixture({drive:{
  put:async asset=>{
   if(asset.mimeType==='application/vnd.google-apps.folder')
    return {id:asset.key,status:'VERIFIED',sha256:null};
   assetWrites++;throw Error('DRIVE_UPLOAD_UNCONFIRMED');
  },
  reconcile:async asset=>{
   reconcileCalls++;if(reconcileCalls===1){seen();await gate;}
   return {id:asset.key,status:'VERIFIED',sha256:asset.sha256??null};
  }
 }});
 await f.core.submit(plan());
 for(let i=0;i<3;i++)await f.core.tick();
 const running=new ProductionDelivery(f.s,f.deps).tick();
 await started;
 const checkpoint=await f.s.get('delivery');
 assert.equal(checkpoint.status,'RECONCILING');
 assert.equal(checkpoint.index,0);
 assert.equal(checkpoint.attempts[0],3);
 assert.equal(assertDeliveryCheckpointIntegrity(checkpoint),true);
 release();
 await running;
 const after=await f.s.get('delivery');
 assert.equal(after.index,1);
 assert.equal(after.status,'QUEUED');
 assert.equal(assetWrites,3);
 assert.equal(reconcileCalls,4);
});

test('a Worker restart with an interrupted recovery marker refuses replay or extra provider requests',async()=>{
 let calls=0;
 const f=fixture({drive:{
  put:async asset=>{
   calls++;
   if(asset.mimeType==='application/vnd.google-apps.folder')
    return {id:asset.key,status:'VERIFIED',sha256:null};
   throw Error('DRIVE_UPLOAD_UNCONFIRMED');
  },
  reconcile:async()=>{calls++;throw Error('REMOTE_RECOVERY_MUST_NOT_RUN');}
 }});
 await f.core.submit(plan());
 for(let i=0;i<3;i++)await f.core.tick();
 const checkpoint=f.s.data.get('delivery');
 checkpoint.status='RECONCILING'; // persist a simulated crash just after the claim
 assert.equal(assertDeliveryCheckpointIntegrity(checkpoint),true);
 const before=calls;
 await new ProductionDelivery(f.s,f.deps).tick();
 const after=await f.s.get('delivery');
 assert.equal(after.status,'NEEDS_REVIEW');
 assert.equal(after.error,'DRIVE_READONLY_RECOVERY_INTERRUPTED');
 assert.equal(after.index,0);
 assert.equal(after.attempts[0],3);
 assert.equal(calls,before,'no folder GET, file GET or new upload on restart');
 assert.equal(f.s.alarm,null);
 await new ProductionDelivery(f.s,f.deps).tick();
 assert.equal(calls,before,'future alarms remain inert');
 await assert.rejects(f.core.resume(),/RESUME_NOT_SAFE/);
});

test('a forged or premature RECONCILING status fails checkpoint integrity before Drive requests',async()=>{
 const f=fixture();
 await f.core.submit(plan());
 const checkpoint=f.s.data.get('delivery');
 checkpoint.status='RECONCILING';
 assert.throws(()=>assertDeliveryCheckpointIntegrity(checkpoint),
  /DELIVERY_CHECKPOINT_INTEGRITY_FAILED/);
 await f.core.tick();
 const after=await f.s.get('delivery');
 assert.equal(after.status,'NEEDS_REVIEW');
 assert.equal(after.error,'DELIVERY_CHECKPOINT_INTEGRITY_FAILED');
 assert.equal(f.puts,0);
});

test('STOP during final read-only recovery remains a pause, not a fatal claim mismatch',async()=>{
 let f,assetWrites=0,reconcileCalls=0,stoppedOnce=false;
 f=fixture({drive:{
  put:async asset=>{
   if(asset.mimeType==='application/vnd.google-apps.folder')
    return {id:asset.key,status:'VERIFIED',sha256:null};
   assetWrites++;throw Error('DRIVE_UPLOAD_UNCONFIRMED');
  },
  reconcile:async asset=>{
   reconcileCalls++;
   if(!stoppedOnce){stoppedOnce=true;await f.core.stop();}
   return {id:asset.key,status:'VERIFIED',sha256:asset.sha256??null};
  }
 }});
 await f.core.submit(plan());
 for(let i=0;i<3;i++)await f.core.tick();
 await f.core.tick();
 const paused=await f.s.get('delivery');
 assert.equal(paused.status,'STOPPED');
 assert.equal(paused.stopped,true);
 assert.equal(paused.index,0);
 assert.equal(assetWrites,3);
 assert.equal(reconcileCalls,1);
 assert.equal(f.s.alarm,null);
 await f.core.tick();
 assert.equal(reconcileCalls,1);
 // Explicit owner Resume allows another read-only check, not a fresh upload.
 await f.core.resume();
 await new ProductionDelivery(f.s,f.deps).tick();
 assert.equal((await f.s.get('delivery')).index,1);
 assert.equal(assetWrites,3);
 assert.equal(reconcileCalls,5);
});

test('late successful reconciliation cannot overturn a newer interrupted-recovery review',async()=>{
 let release,signal;
 const gate=new Promise(resolve=>{release=resolve});
 const reached=new Promise(resolve=>{signal=resolve});
 let writes=0,reconciles=0;
 const f=fixture({drive:{
  put:async asset=>{
   if(asset.mimeType==='application/vnd.google-apps.folder')
    return {id:asset.key,status:'VERIFIED',sha256:null};
   writes++;throw Error('DRIVE_UPLOAD_UNCONFIRMED');
  },
  reconcile:async asset=>{
   reconciles++;
   if(asset.mimeType!=='application/vnd.google-apps.folder'){
    signal();await gate;
   }
   return {id:asset.key,status:'VERIFIED',sha256:asset.sha256??null};
  }
 }});
 await f.core.submit(plan());
 for(let i=0;i<3;i++)await f.core.tick();
 const original=new ProductionDelivery(f.s,f.deps);
 const inflight=original.tick();
 await reached;
 assert.equal((await f.s.get('delivery')).status,'RECONCILING');
 // Simulate a new Worker alarm during the old Vault GET.
 await new ProductionDelivery(f.s,f.deps).tick();
 const review=await f.s.get('delivery');
 assert.equal(review.status,'NEEDS_REVIEW');
 assert.equal(review.error,'DRIVE_READONLY_RECOVERY_INTERRUPTED');
 assert.equal(review.index,0);
 release();
 await inflight;
 const after=await f.s.get('delivery');
 assert.deepEqual(after,review,
  'late success must not overwrite a committed review decision');
 assert.equal(writes,3,'no fourth Drive upload');
 assert.equal(reconciles,4,'in-flight requests already started, no new replay');
 assert.equal(f.s.alarm,null);
});

test('late reconciliation failure cannot erase owner STOP or restart review',async()=>{
 let release,signal;
 const gate=new Promise(resolve=>{release=resolve});
 const reached=new Promise(resolve=>{signal=resolve});
 let writes=0,reconciles=0;
 const f=fixture({drive:{
  put:async asset=>{
   if(asset.mimeType==='application/vnd.google-apps.folder')
    return {id:asset.key,status:'VERIFIED',sha256:null};
   writes++;throw Error('DRIVE_UPLOAD_UNCONFIRMED');
  },
  reconcile:async()=>{
   reconciles++;signal();await gate;
   throw Error('DRIVE_VERIFY_UNAVAILABLE');
  }
 }});
 await f.core.submit(plan());
 for(let i=0;i<3;i++)await f.core.tick();
 const inflight=new ProductionDelivery(f.s,f.deps).tick();
 await reached;
 await f.core.stop();
 const paused=await f.s.get('delivery');
 assert.equal(paused.status,'STOPPED');
 assert.equal(paused.stopped,true);
 release();
 await inflight;
 assert.deepEqual(await f.s.get('delivery'),paused,
  'late failed reconciliation must not overwrite STOP with NEEDS_REVIEW');
 assert.equal(reconciles,1);
 assert.equal(writes,3);
 assert.equal(f.s.alarm,null);
});

test('superseded upload attempt cannot write a file receipt for the same asset index',async()=>{
 let releaseFirst,startedFirst,releaseSecond,startedSecond;
 const firstGate=new Promise(resolve=>{releaseFirst=resolve});
 const firstReady=new Promise(resolve=>{startedFirst=resolve});
 const secondGate=new Promise(resolve=>{releaseSecond=resolve});
 const secondReady=new Promise(resolve=>{startedSecond=resolve});
 let capacityCalls=0,fileCalls=0;
 const f=fixture({
  capacity:async()=>{
   capacityCalls++;
   if(capacityCalls===1){startedFirst();await firstGate;}
   return {unlimited:true};
  },
  drive:{put:async asset=>{
   if(asset.mimeType==='application/vnd.google-apps.folder')
    return {id:asset.key,status:'VERIFIED',sha256:null};
   fileCalls++;
   if(fileCalls===1){startedSecond();await secondGate;}
   return {id:asset.key,status:'VERIFIED',sha256:asset.sha256};
  }}
 });
 await f.core.submit(plan());
 const old=new ProductionDelivery(f.s,f.deps);
 const oldTick=old.tick();await firstReady;
 const newer=new ProductionDelivery(f.s,f.deps);
 const newTick=newer.tick();await secondReady;
 const claimed=await f.s.get('delivery');
 assert.equal(claimed.status,'UPLOADING');
 assert.equal(claimed.index,0);
 assert.equal(claimed.attempts[0],2);
 releaseFirst();
 await oldTick;
 const waiting=await f.s.get('delivery');
 assert.equal(waiting.status,'UPLOADING',
  'stale first attempt must not turn newer active attempt into review');
 assert.equal(waiting.attempts[0],2);
 assert.equal(waiting.index,0);
 releaseSecond();
 await newTick;
 const after=await f.s.get('delivery');
 assert.equal(after.status,'QUEUED');
 assert.equal(after.index,1);
 assert.equal(after.attempts[0],2);
 assert.equal(after.verified.length,1);
 assert.equal(fileCalls,1,'old attempt never issued a second asset POST');
});

test('superseded upload failure cannot override the newer active attempt',async()=>{
 let releaseFirst,signalFirst,releaseSecond,signalSecond;
 const firstGate=new Promise(resolve=>{releaseFirst=resolve});
 const firstReady=new Promise(resolve=>{signalFirst=resolve});
 const secondGate=new Promise(resolve=>{releaseSecond=resolve});
 const secondReady=new Promise(resolve=>{signalSecond=resolve});
 let fileCalls=0;
 const f=fixture({drive:{put:async asset=>{
  if(asset.mimeType==='application/vnd.google-apps.folder')
   return {id:asset.key,status:'VERIFIED',sha256:null};
  fileCalls++;
  if(fileCalls===1){signalFirst();await firstGate;throw Error('DRIVE_CONTENT_MISMATCH');}
  signalSecond();await secondGate;
  return {id:asset.key,status:'VERIFIED',sha256:asset.sha256};
 }}});
 await f.core.submit(plan());
 const oldTick=new ProductionDelivery(f.s,f.deps).tick();
 await firstReady;
 const newerTick=new ProductionDelivery(f.s,f.deps).tick();
 await secondReady;
 releaseFirst();
 await oldTick;
 const midpoint=await f.s.get('delivery');
 assert.equal(midpoint.status,'UPLOADING');
 assert.equal(midpoint.attempts[0],2);
 assert.equal(midpoint.index,0);
 releaseSecond();
 await newerTick;
 const after=await f.s.get('delivery');
 assert.equal(after.index,1);
 assert.equal(after.status,'QUEUED');
 assert.equal(after.verified.length,1);
 assert.equal(fileCalls,2);
});

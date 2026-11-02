import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ProductionDelivery,validateDeliveryPlan} from '../lib/ldb/production-delivery.mjs';
import {DriveDelivery} from '../lib/ldb/google-delivery.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const scenes=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
function fixture(){
 const counts=[['Storyboard',[null]],['Approved reference images',scenes],['Image prompts',[...scenes,'THUMBNAIL']],['Flow video prompts',scenes],['Narration',scenes],['Thumbnail',['THUMBNAIL']],['Quality audit',[null]],['Production manifest',[null]]];
 const bytes=new Map(),assets=[];let i=0;
 for(const [category,items] of counts)for(const scene of items){
  const image=['Approved reference images','Thumbnail'].includes(category),body=Buffer.from((image?'fake-image-':'text-')+category+'-'+(scene||'main')),key=sha('key:'+i++);
  bytes.set(key,body);assets.push({key,category,...(scene?{scene}:{}),name:(scene||'main')+(image?'.jpg':'.txt'),mimeType:image?'image/jpeg':'text/plain',bytes:body.length,sha256:sha(body)});
 }
 const plan={jobId:'a'.repeat(64),approvalVerified:true,visualAudit:'PASS',episode:'Lake Nyos 1986',assets};
 validateDeliveryPlan(plan);
 // Emulate atomic Durable Object transactions: in-place mutations and failed
 // writes must not leak into persisted state before commit.
 const state=new Map();
 let transactionTail=Promise.resolve();
 const storage={transaction:fn=>{
  const attempt=transactionTail.then(async()=>{
   const changes=new Map();
   const tx={
    get:async key=>structuredClone(changes.has(key)?changes.get(key):state.get(key)),
    put:async(key,value)=>{changes.set(key,structuredClone(value));},
    setAlarm:async()=>{},
    deleteAlarm:async()=>{}
   };
   const result=await fn(tx);
   for(const [key,value] of changes)state.set(key,value);
   return result;
  });
  transactionTail=attempt.catch(()=>{});
  return attempt;
 }};
 const uploaded=new Map();const drive={put:async a=>{
  const key=a.key||sha('folder:'+a.name+':'+(a.parentId||''));if(uploaded.has(key))return uploaded.get(key);
  const value=a.bytes instanceof Uint8Array?{id:key,status:'VERIFIED',sha256:sha(a.bytes)}:{id:key};
  uploaded.set(key,value);return value;
 }};
 const opts={drive,capacity:async()=>({unlimited:true}),readAsset:async a=>Buffer.from(bytes.get(a.key)),now:()=>0};
 return {plan,storage,opts,state,uploaded,bytes};
}
test('69 assets resume across coordinator reconstruction with verified checksums',async()=>{
 const f=fixture();assert.equal(f.plan.assets.length,69);
 let coordinator=new ProductionDelivery(f.storage,f.opts);
 await coordinator.submit(f.plan);
 for(let i=0;i<69;i++){
  coordinator=new ProductionDelivery(f.storage,f.opts);
  await coordinator.tick();
  assert.equal(f.state.get('delivery').index,i+1);
 }
 const done=f.state.get('delivery');assert.equal(done.status,'COMPLETE');assert.equal(done.verified.length,69);assert.equal(new Set(done.verified.map(x=>x.key)).size,69);
});
test('corrupted asset blocks delivery without advancing index',async()=>{
 const f=fixture(),bad=f.plan.assets[0];f.opts.readAsset=async a=>a.key===bad.key?Buffer.from('corrupted'):Buffer.from(f.bytes.get(a.key));
 const coordinator=new ProductionDelivery(f.storage,f.opts);await coordinator.submit(f.plan);await coordinator.tick();
 assert.equal(f.state.get('delivery').status,'NEEDS_REVIEW');assert.equal(f.state.get('delivery').index,0);
});
test('unapproved plans cannot queue',async()=>{
 const f=fixture();await assert.rejects(new ProductionDelivery(f.storage,f.opts).submit({...f.plan,approvalVerified:false}),/DELIVERY_NOT_APPROVED/);
});

test('stop during corrupt upload preserves NEEDS_REVIEW and blocks resume',async()=>{
 const f=fixture();let coordinator;
 f.opts.readAsset=async()=>{await coordinator.stop();return Buffer.from('corrupted');};
 coordinator=new ProductionDelivery(f.storage,f.opts);
 await coordinator.submit(f.plan);await coordinator.tick();
 assert.equal(f.state.get('delivery').status,'NEEDS_REVIEW');
 assert.equal(f.state.get('delivery').index,0);
 await assert.rejects(coordinator.resume(),/RESUME_NOT_SAFE/);
});

test('stopping an already failed delivery preserves NEEDS_REVIEW',async()=>{
 const f=fixture(),coordinator=new ProductionDelivery(f.storage,{...f.opts,readAsset:async()=>Buffer.from('corrupted')});
 await coordinator.submit(f.plan);await coordinator.tick();await coordinator.stop();
 assert.equal(f.state.get('delivery').status,'NEEDS_REVIEW');
 await assert.rejects(coordinator.resume(),/RESUME_NOT_SAFE/);
});

test('Drive verification without a file ID cannot advance delivery',async()=>{
 const f=fixture();
 f.opts.drive={put:async a=>a.bytes?{status:'VERIFIED',sha256:sha(a.bytes)}:{id:'folder-id'}};
 const coordinator=new ProductionDelivery(f.storage,f.opts);
 await coordinator.submit(f.plan);await coordinator.tick();
 assert.equal(f.state.get('delivery').status,'NEEDS_REVIEW');
 assert.equal(f.state.get('delivery').index,0);
 assert.equal(f.state.get('delivery').verified.length,0);
});


test('checkpoint write failure after a confirmed upload is recovered without a duplicate asset',async()=>{
 const f=fixture(),first=f.plan.assets[0],originalTransaction=f.storage.transaction;
 let failOnce=true,assetCalls=0;
 const originalPut=f.opts.drive.put;
 f.opts.drive.put=async a=>{
  if(a.key===first.key && a.bytes instanceof Uint8Array)assetCalls++;
  return originalPut(a);
 };
 f.storage.transaction=fn=>originalTransaction(tx=>fn({
  ...tx,
  put:async(k,v)=>{
   if(failOnce&&k==='delivery'&&v?.index===1&&v?.verified?.length===1){
    failOnce=false;
    throw Error('SIMULATED_CHECKPOINT_WRITE_FAILURE');
   }
   return tx.put(k,v);
  }
 }));
 const original=new ProductionDelivery(f.storage,f.opts);
 await original.submit(f.plan);
 await original.tick();
 assert.equal(failOnce,false,'simulated checkpoint failure actually occurred');
 assert.equal(f.state.get('delivery').index,0,'uncommitted checkpoint cannot claim success');
 assert.equal(f.state.get('delivery').status,'RETRY_WAIT');
 const remote=f.uploaded.get(first.key);
 assert.equal(remote?.status,'VERIFIED','upload succeeded before checkpoint failure');
 let restarted=new ProductionDelivery(f.storage,f.opts);
 await restarted.tick();
 assert.equal(f.state.get('delivery').index,1);
 assert.equal(f.uploaded.get(first.key),remote,'same remote file is reconciled');
 assert.equal(assetCalls,2,'recovery re-inspects the same logical asset');
 for(let i=1;i<69;i++){
  restarted=new ProductionDelivery(f.storage,f.opts);
  await restarted.tick();
 }
 const done=f.state.get('delivery');
 assert.equal(done.status,'COMPLETE');
 assert.equal(done.verified.length,69);
 assert.equal(new Set(done.verified.map(x=>x.id)).size,69,'unique remote identities');
 const count=f.uploaded.size;
 await new ProductionDelivery(f.storage,f.opts).tick();
 assert.equal(f.uploaded.size,count,'replayed COMPLETE job makes no more files');
});

test('STOP during third asset preserves three verified files across a restart',async()=>{
 const f=fixture();
 const initial=new ProductionDelivery(f.storage,f.opts);
 await initial.submit(f.plan);
 await initial.tick();
 await initial.tick();
 assert.equal(f.state.get('delivery').index,2);
 let current;
 current=new ProductionDelivery(f.storage,{
  ...f.opts,
  readAsset:async asset=>{
   await current.stop();
   return Buffer.from(f.bytes.get(asset.key));
  }
 });
 await current.tick();
 assert.equal(f.state.get('delivery').status,'STOPPED');
 assert.equal(f.state.get('delivery').index,3);
 assert.equal(f.state.get('delivery').verified.length,3);
 const uploadCount=f.uploaded.size;
 const reconstructed=new ProductionDelivery(f.storage,f.opts);
 await reconstructed.tick();
 assert.equal(f.state.get('delivery').index,3,'STOP blocks replayed alarms');
 assert.equal(f.uploaded.size,uploadCount,'STOP creates no additional file');
 await reconstructed.resume();
 await reconstructed.tick();
 assert.equal(f.state.get('delivery').index,4);
 assert.equal(f.state.get('delivery').verified.length,4);
 assert.equal(new Set(f.state.get('delivery').verified.map(x=>x.key)).size,4);
});

test('actual DriveDelivery adapter recovers 69 files after ambiguous upload and lost checkpoint',async()=>{
 const f=fixture();
 const reservations=new Map();
 const driveStorage={
  get:async key=>structuredClone(reservations.get(key)),
  put:async(key,value)=>reservations.set(key,structuredClone(value)),
  transaction:async fn=>{
   const changes=new Map();
   const tx={
    get:async key=>structuredClone(changes.has(key)?changes.get(key):reservations.get(key)),
    put:async(key,value)=>changes.set(key,structuredClone(value))
   };
   const result=await fn(tx);
   for(const [key,value] of changes)reservations.set(key,value);
   return result;
  }
 };
 let nextId=0,created=0,ambiguousOnce=true;
 const remote=new Map();
 const fakeGoogle=async(url,options={})=>{
  if(url.includes('/generateIds?'))return {ok:true,json:async()=>({ids:['offlineFile'+(++nextId)]})};
  if(options.method==='POST'){
   const multipart=url.includes('uploadType=multipart'),body=options.body;
   const raw=multipart?Buffer.from(body):null;
   const metadata=multipart
    ?JSON.parse(raw.toString('utf8').match(/\r\n\r\n(\{[^\r\n]+\})\r\n--/)[1])
    :JSON.parse(body);
   let bytes=null;
   if(multipart){
    const marker=Buffer.from('Content-Type: '+metadata.mimeType+'\r\n\r\n');
    const begin=raw.indexOf(marker)+marker.length;
    const end=raw.lastIndexOf(Buffer.from('\r\n--'));
    assert.ok(begin>=marker.length&&end>begin,'valid mock multipart');
    bytes=raw.subarray(begin,end);
   }
   assert.ok(!remote.has(metadata.id),'server must not create a duplicate ID');
   remote.set(metadata.id,{
    ...metadata,trashed:false,
    ...(bytes?{
     size:String(bytes.length),
     md5Checksum:createHash('md5').update(bytes).digest('hex'),
     sha256Checksum:sha(bytes)
    }:{})
   });
   created++;
   if(bytes&&ambiguousOnce){ambiguousOnce=false;throw Error('simulated timeout after remote creation');}
   return {ok:true,status:200};
  }
  const item=remote.get(new URL(url).pathname.split('/').at(-1));
  return {ok:!!item,status:item?200:404,json:async()=>item};
 };
 f.opts.drive=new DriveDelivery(driveStorage,{tokenProvider:async()=>'offline-only-token',fetcher:fakeGoogle});
 const originalTransaction=f.storage.transaction;
 let loseCheckpoint=true;
 f.storage.transaction=fn=>originalTransaction(tx=>fn({
  ...tx,
  put:async(key,value)=>{
   if(loseCheckpoint&&key==='delivery'&&value?.index===1&&value?.verified?.length===1){
    loseCheckpoint=false;throw Error('SIMULATED_CHECKPOINT_FAILURE');
   }
   return tx.put(key,value);
  }
 }));
 await new ProductionDelivery(f.storage,f.opts).submit(f.plan);
 await new ProductionDelivery(f.storage,f.opts).tick();
 assert.equal(loseCheckpoint,false,'checkpoint failure was exercised');
 assert.equal(ambiguousOnce,false,'remote creation timeout was exercised');
 assert.equal(f.state.get('delivery').index,0,'lost checkpoint does not claim delivery');
 assert.equal(f.state.get('delivery').status,'RETRY_WAIT');
 const createdBeforeRestart=created;
 await new ProductionDelivery(f.storage,f.opts).tick();
 assert.equal(f.state.get('delivery').index,1);
 assert.equal(created,createdBeforeRestart,'restart does not recreate uploaded file or folders');
 for(let i=1;i<69;i++)await new ProductionDelivery(f.storage,f.opts).tick();
 const done=f.state.get('delivery');
 assert.equal(done.status,'COMPLETE');
 assert.equal(done.verified.length,69);
 assert.equal(new Set(done.verified.map(x=>x.id)).size,69);
 assert.equal([...remote.values()].filter(x=>x.mimeType!=='application/vnd.google-apps.folder').length,69);
 const filesBeforeReplay=remote.size;
 await new ProductionDelivery(f.storage,f.opts).tick();
 assert.equal(remote.size,filesBeforeReplay,'completed delivery cannot make more remote files');
});

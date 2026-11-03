// FULL OFFLINE CROSS-WORKER delivery test. No Google account, OAuth token,
// Cloudflare deployment, internet call, Gmail message or billable rendering.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ProductionDelivery,validateDeliveryPlan} from '../lib/ldb/production-delivery.mjs';
import {createGoogleDeliveryBridge} from '../cloudflare/ldb-runner/google-delivery-bridge.mjs';
import {handleVaultDeliveryBridge} from '../cloudflare/ldb-google-vault/delivery-bridge.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const SECRET='isolated-bridge-transport-secret-for-offline-test';
const SCENES=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
const CATEGORIES=[
 ['Storyboard',[null]],
 ['Approved reference images',SCENES],
 ['Image prompts',[...SCENES,'THUMBNAIL']],
 ['Flow video prompts',SCENES],
 ['Narration',SCENES],
 ['Thumbnail',['THUMBNAIL']],
 ['Quality audit',[null]],
 ['Production manifest',[null]]
];
function fixture({corrupt=false,onceUnavailable=false}={}){
 const payloads=new Map(),assets=[];
 let i=0;
 for(const [category,scenes] of CATEGORIES)for(const scene of scenes){
  const key=hash('asset-key:'+i++),image=category==='Approved reference images'||category==='Thumbnail';
  const bytes=Buffer.from((image?'SIMULATED_IMAGE_':'SIMULATED_TEXT_')+category+'_'+(scene||'MAIN'));
  payloads.set(key,bytes);
  assets.push({key,category,...(scene?{scene}:{}),
   name:(scene||'MAIN')+(image?'.jpg':'.txt'),
   mimeType:image?'image/jpeg':'text/plain',
   sha256:hash(bytes),bytes:bytes.length});
 }
 const plan={jobId:'b'.repeat(64),episode:'Lake Nyos 1986',
  approvalVerified:true,visualAudit:'PASS',assets};
 assert.equal(assets.length,69);
 validateDeliveryPlan(plan);

 // Simulate atomic Durable Object checkpoints (stored independently of vault).
 const saved=new Map();let queue=Promise.resolve(),alarms=0,deletedAlarms=0;
 const storage={get:async key=>structuredClone(saved.get(key)),
  transaction:fn=>{
   const pending=queue.then(async()=>{
    const changes=new Map();
    const tx={
     get:async key=>structuredClone(changes.has(key)?changes.get(key):saved.get(key)),
     put:async(key,value)=>{changes.set(key,structuredClone(value));},
     setAlarm:async()=>{alarms++;},
     deleteAlarm:async()=>{deletedAlarms++;}
    };
    const out=await fn(tx);
    for(const [key,value] of changes)saved.set(key,value);
    return out;
   });
   queue=pending.catch(()=>{});
   return pending;
  }};
 const uploaded=new Map();let driveCalls=0,transportCalls=0,failedOnce=false;
 const backend=()=>({
  capacity:async()=>({unlimited:true,remaining:null}),
  drive:{put:async asset=>{
   driveCalls++;
   const bytes=asset.bytes;
   const digest=bytes?hash(bytes):null;
   const previous=uploaded.get(asset.key);
   if(previous){
    assert.equal(previous.digest,digest,'idempotent retry must retain bytes');
    assert.equal(previous.parentId,asset.parentId,'idempotent retry must retain parent');
    return {status:'VERIFIED',id:previous.id,sha256:previous.digest};
   }
   if(asset.parentId!==null)assert.ok([...uploaded.values()].some(x=>x.id===asset.parentId),'parent must already exist');
   const value={id:'fake-drive-'+(uploaded.size+1),key:asset.key,parentId:asset.parentId,
    name:asset.name,mimeType:asset.mimeType,digest};
   uploaded.set(asset.key,value);
   return {status:'VERIFIED',id:value.id,sha256:value.digest};
  }}
 });
 const service={fetch:async(url,options)=>{
  transportCalls++;
  if(onceUnavailable&&!failedOnce&&new URL(url).pathname==='/internal/drive/put'){
   failedOnce=true;
   return Response.json({status:'SIMULATED_TRANSPORT_FAILURE'},{status:503});
  }
  return handleVaultDeliveryBridge(new Request(url,options),{
   enabled:true,secret:SECRET,createBackend:backend
  });
 }};
 const bridge=createGoogleDeliveryBridge({
  DELIVERY_BRIDGE_ENABLED:'true',GOOGLE_DELIVERY_BRIDGE_SECRET:SECRET,GOOGLE_VAULT:service
 });
 const options={drive:bridge.drive,capacity:bridge.capacity,
  readAsset:async asset=>{
   const bytes=Buffer.from(payloads.get(asset.key));
   if(corrupt&&asset.key===assets[0].key)bytes[0]^=1;
   return bytes;
  },now:()=>1000};
 const coordinator=()=>new ProductionDelivery(storage,options);
 return {plan,storage,coordinator,saved,uploaded,
  get calls(){return {driveCalls,transportCalls,alarms,deletedAlarms};}};
}

test('full 69-asset workflow crosses private worker bridge, restarts and never duplicates Drive files',async()=>{
 const f=fixture();
 await f.coordinator().submit(f.plan);
 for(let i=0;i<4;i++)await f.coordinator().tick();
 assert.equal(f.saved.get('delivery').index,4);
 assert.equal(f.saved.get('delivery').verified.length,4);
 await f.coordinator().stop();
 assert.equal(f.saved.get('delivery').status,'STOPPED');
 const before=f.uploaded.size;
 await f.coordinator().tick();
 assert.equal(f.uploaded.size,before,'STOP must prevent uploads');
 await f.coordinator().resume();
 for(let i=4;i<69;i++)await f.coordinator().tick();
 const done=f.saved.get('delivery');
 assert.equal(done.status,'COMPLETE');
 assert.equal(done.index,69);
 assert.equal(done.verified.length,69);
 assert.equal(new Set(done.verified.map(x=>x.id)).size,69);
 assert.equal(f.uploaded.size,79,'69 verified files and 10 category/root folders');
 assert.equal([...f.uploaded.values()].filter(x=>x.mimeType!=='application/vnd.google-apps.folder').length,69);
 const size=f.uploaded.size;
 await f.coordinator().tick();
 assert.equal(f.uploaded.size,size,'replayed completion must not upload again');
 assert.ok(f.calls.transportCalls>69,'all requests traversed service binding');
 assert.ok(!JSON.stringify([...f.saved]).includes(SECRET),'coordinator checkpoints contain no service secret');
});

test('wrong local checksum blocks the private bridge and prevents claiming a delivered file',async()=>{
 const f=fixture({corrupt:true});await f.coordinator().submit(f.plan);
 await f.coordinator().tick();
 const j=f.saved.get('delivery');
 assert.equal(j.status,'NEEDS_REVIEW');
 assert.equal(j.index,0);
 assert.equal(j.verified.length,0);
 assert.equal([...f.uploaded.values()].filter(x=>x.mimeType!=='application/vnd.google-apps.folder').length,0);
});

test('temporary bridge outage retries only the unverified asset and does not claim success early',async()=>{
 const f=fixture({onceUnavailable:true});
 await f.coordinator().submit(f.plan);
 await f.coordinator().tick();
 assert.equal(f.saved.get('delivery').status,'RETRY_WAIT');
 assert.equal(f.saved.get('delivery').index,0);
 await f.coordinator().tick();
 assert.equal(f.saved.get('delivery').index,1);
 for(let i=1;i<69;i++)await f.coordinator().tick();
 assert.equal(f.saved.get('delivery').status,'COMPLETE');
 assert.equal(f.uploaded.size,79);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ProductionDelivery,validateDeliveryPlan} from '../lib/ldb/production-delivery.mjs';
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
 const state=new Map(),storage={transaction:async fn=>fn({get:async k=>state.get(k),put:async(k,v)=>state.set(k,structuredClone(v)),setAlarm:async()=>{},deleteAlarm:async()=>{}})};
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

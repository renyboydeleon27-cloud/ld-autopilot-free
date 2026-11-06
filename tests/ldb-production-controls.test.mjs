import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stopProduction,resumeProduction} from '../lib/ldb/production-controls.mjs';
import {dispatchCoordinatorAlarm} from '../cloudflare/ldb-runner/delivery-alarm.mjs';
import {validateDeliveryPlan} from '../lib/ldb/production-delivery.mjs';
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const scenes=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
function plan(){
 const groups=[['Storyboard',[null]],['Approved reference images',scenes],['Image prompts',[...scenes,'THUMBNAIL']],['Flow video prompts',scenes],['Narration',scenes],['Thumbnail',['THUMBNAIL']],['Quality audit',[null]],['Production manifest',[null]]];
 let i=0;const assets=[];
 for(const [category,ids] of groups)for(const scene of ids){
  const image=['Approved reference images','Thumbnail'].includes(category);
  const key=hash('key:'+i++);
  assets.push({key,category,...(scene?{scene}:{}),name:key.slice(0,8)+(image?'.jpg':'.txt'),mimeType:image?'image/jpeg':'text/plain',bytes:50,sha256:hash(key)});
 }
 const p={jobId:'a'.repeat(64),approvalVerified:true,visualAudit:'PASS',episode:'Lake Nyos 1986',assets};validateDeliveryPlan(p);return p;
}
function setup({imageStatus='IMAGES_READY',deliveryStatus='QUEUED',withDelivery=true}={}){
 const p=plan(),job={id:p.jobId,status:imageStatus,index:17,stop:false,outputs:scenes.concat('THUMBNAIL').map(scene=>({scene,sha256:hash(scene),mimeType:'image/jpeg',bytes:50,chunks:1}))};
 const data=new Map([['job',job]]);
 if(withDelivery)data.set('delivery',{plan:p,fingerprint:validateDeliveryPlan(p),status:deliveryStatus,index:0,verified:[],stopped:false});
 let alarmCount=0,deleteCount=0,coreStop=0,coreResume=0;
 const clone=v=>v===undefined?undefined:structuredClone(v);
 const tx={get:async k=>clone(data.get(k)),put:async(k,v)=>data.set(k,clone(v)),deleteAlarm:async()=>{deleteCount++;},setAlarm:async()=>{alarmCount++;}};
 const storage={get:tx.get,transaction:async fn=>{
  const before=new Map([...data].map(([k,v])=>[k,clone(v)]));
  try{return await fn(tx);}catch(e){data.clear();for(const [k,v] of before)data.set(k,v);throw e;}
 }};
 const core={status:async()=>clone(data.get('job')),stop:async()=>{coreStop++;data.get('job').status='STOPPED';},resume:async()=>{coreResume++;data.get('job').status='QUEUED';},tick:async()=>{throw Error('IMAGE_SHOULD_NOT_TICK');}};
 return {p,storage,core,data,get metrics(){return {alarmCount,deleteCount,coreStop,coreResume}}};
}
test('STOP after 17 images cancels delivery alarm and blocks upload dispatch',async()=>{
 const f=setup();assert.equal((await stopProduction(f)).status,'DELIVERY_STOP_REQUESTED');
 assert.equal(f.data.get('job').stop,true);assert.equal(f.data.get('delivery').status,'STOPPED');
 assert.equal(f.data.get('delivery').stopped,true);assert.equal(f.metrics.deleteCount,1);
 let calls=0;const status=await dispatchCoordinatorAlarm({storage:f.storage,imageCore:f.core,deliveryEnabled:true,createDelivery:()=>{calls++;return {tick:async()=>{}};}});
 assert.equal(status.status,'PRODUCTION_PAUSED');assert.equal(calls,0);
});
test('RESUME requires verified 69-file plan, then reschedules one alarm',async()=>{
 const f=setup();await stopProduction(f);
 await assert.rejects(resumeProduction({...f,deliveryEnabled:false}),/DELIVERY_CONNECTOR_DISABLED/);
 assert.equal(f.data.get('job').stop,true);
 const resumed=await resumeProduction({...f,deliveryEnabled:true,now:()=>100});
 assert.equal(resumed.status,'DELIVERY_RESUMED');assert.equal(f.data.get('delivery').status,'QUEUED');
 assert.equal(f.data.get('delivery').stopped,false);assert.equal(f.data.get('job').stop,false);
 assert.equal(f.metrics.alarmCount,1);
});
test('cannot resume an unfinished or forged approved delivery checkpoint',async()=>{
 const f=setup();await stopProduction(f);
 f.data.get('delivery').fingerprint='b'.repeat(64);
 await assert.rejects(resumeProduction({...f,deliveryEnabled:true}),/INVALID_DELIVERY_CHECKPOINT/);
 assert.equal(f.data.get('job').stop,true);assert.equal(f.data.get('delivery').stopped,true);
});
test('STOP preserves in-flight asset but refuses premature RESUME',async()=>{
 const f=setup({deliveryStatus:'UPLOADING'});
 await stopProduction(f);assert.equal(f.data.get('delivery').status,'UPLOADING');
 await assert.rejects(resumeProduction({...f,deliveryEnabled:true}),/RESUME_NOT_SAFE/);
 assert.equal(f.data.get('delivery').stopped,true);
});
test('complete delivery is never restarted; no-delivery pause can be cleared',async()=>{
 const f=setup({deliveryStatus:'COMPLETE'});
 assert.equal((await stopProduction(f)).status,'ALREADY_COMPLETE');
 assert.equal(f.data.get('job').stop,false);
 const g=setup({withDelivery:false});assert.equal((await stopProduction(g)).status,'PRODUCTION_STOPPED');
 assert.equal((await resumeProduction(g)).status,'PRODUCTION_RESUMED');
 assert.equal(g.metrics.alarmCount,0);
});
test('during image generation STOP/RESUME uses existing Checkpoints logic',async()=>{
 const f=setup({imageStatus:'QUEUED'});
 assert.equal((await stopProduction(f)).status,'IMAGE_STOP_REQUESTED');assert.equal(f.metrics.coreStop,1);
 assert.equal((await resumeProduction(f)).status,'IMAGE_RESUMED');assert.equal(f.metrics.coreResume,1);
});

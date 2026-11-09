import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {deliveryReadiness} from '../lib/ldb/delivery-readiness.mjs';
import {validateDeliveryPlan} from '../lib/ldb/production-delivery.mjs';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';

const sha=s=>createHash('sha256').update(s).digest('hex');
const id='a'.repeat(64),hash='b'.repeat(64);
const scenes=ALL_SCENES.slice(0,16);
const job=()=>({id,status:'IMAGES_READY',index:17,outputs:ALL_SCENES.map(scene=>({scene,sha256:hash,mimeType:'image/png',bytes:100,chunks:1}))});

function plan(){
 const assets=[];
 for(const [category,names] of [
  ['Storyboard',['story']],['Approved reference images',scenes],
  ['Image prompts',ALL_SCENES],['Flow video prompts',scenes],
  ['Narration',scenes],['Thumbnail',['THUMBNAIL']],
  ['Quality audit',['audit']],['Production manifest',['manifest']]
 ]){
  for(const scene of names){
   const image=['Approved reference images','Thumbnail'].includes(category);
   assets.push({key:sha('key:'+category+scene),sha256:sha('bytes:'+category+scene),
    category,scene,name:scene+(image?'.png':'.txt'),mimeType:image?'image/png':'text/plain',bytes:100});
  }
 }
 return {jobId:id,approvalVerified:true,visualAudit:'PASS',episode:'Lake Nyos 1986',assets};
}
function delivery(p=plan()){
 return {plan:p,fingerprint:validateDeliveryPlan(p),index:0,verified:[],status:'QUEUED',stopped:false,attempts:{}};
}
function verified(p,i){return {key:p.assets[i].key,sha256:p.assets[i].sha256,id:'drive-id-'+i,status:'VERIFIED'};}
function assertNotApproved(d){
 const result=deliveryReadiness({job:job(),delivery:d});
 assert.equal(result.approvedDeliveryPlanPresent,false);
 assert.equal(result.deliveryCheckpointPresent,false);
 assert.equal(result.autoProductionReady,false);
 assert.equal(result.deliveryConnected,false);
}
test('unready runner remains fail-closed',()=>{
 const r=deliveryReadiness();assert.equal(r.next,'AWAIT_17_IMAGES');assert.equal(r.autoProductionReady,false);
});
test('all 17 valid image metadata entries alone do not approve delivery',()=>{
 const r=deliveryReadiness({job:job()});
 assert.equal(r.imagesReady,true);assert.equal(r.approvedDeliveryPlanPresent,false);
});
test('full 69-file verified checkpoint can be read but does not connect uploads',()=>{
 const p=plan(),d=delivery(p);assert.equal(p.assets.length,69);
 const r=deliveryReadiness({job:job(),delivery:d});
 assert.equal(r.approvedDeliveryPlanPresent,true);assert.equal(r.deliveryCheckpointPresent,true);
 assert.equal(r.autoProductionReady,false);assert.equal(r.deliveryConnected,false);
});
test('browser-style approval flags without fingerprint and records never display approved',()=>{
 assertNotApproved({status:'QUEUED',plan:{jobId:id,approvalVerified:true,visualAudit:'PASS'}});
 const p=plan();assertNotApproved({plan:p,status:'QUEUED',verified:[],index:0,stopped:false});
});
test('a foreign job or stale plan fingerprint fails closed',()=>{
 const p=plan();p.jobId='c'.repeat(64);
 assertNotApproved(delivery(p));
 const d=delivery();d.fingerprint='0'.repeat(64);
 assertNotApproved(d);
});
test('wrong scene identity or absent human audit fails closed',()=>{
 const p=plan();p.assets.find(a=>a.category==='Narration'&&a.scene==='P3').scene='P2';
 assertNotApproved({plan:p,fingerprint:'broken',index:0,verified:[],status:'QUEUED',stopped:false});
 const q=plan();q.visualAudit='PENDING';
 assertNotApproved({plan:q,fingerprint:'broken',index:0,verified:[],status:'QUEUED',stopped:false});
});
test('missing or duplicated verified records cannot claim checkpoint',()=>{
 const p=plan(),d=delivery(p);
 d.index=2;d.verified=[verified(p,0)];assertNotApproved(d);
 d.verified=[verified(p,0),verified(p,0)];assertNotApproved(d);
 d.verified=[verified(p,0),{...verified(p,1),id:''}];assertNotApproved(d);
 d.verified=[verified(p,0),{...verified(p,1),sha256:'0'.repeat(64)}];assertNotApproved(d);
 d.verified=[verified(p,0),{...verified(p,1),id:'drive-id-0'}];assertNotApproved(d);
});
test('completed checkpoint requires every one of 69 verified files',()=>{
 const p=plan(),d=delivery(p);d.status='COMPLETE';assertNotApproved(d);
 d.index=69;d.verified=p.assets.map((_,i)=>verified(p,i));
 const r=deliveryReadiness({job:job(),delivery:d});
 assert.equal(r.deliveryCheckpointPresent,true);
 assert.equal(r.deliveryConnected,false);
});
test('invalid STOP state and missing checkpoint index cannot look approved',()=>{
 const d=delivery();d.status='STOPPED';assertNotApproved(d);
 d.status='QUEUED';d.stopped=true;assertNotApproved(d);
 d.stopped=false;delete d.index;assertNotApproved(d);
});
test('wrong image hash and duplicate scene prevent approval even with correct delivery plan',()=>{
 const j=job(),d=delivery();
 j.outputs[16]={...j.outputs[15]};
 assert.equal(deliveryReadiness({job:j,delivery:d}).imagesReady,false);
 j.outputs[16]={...job().outputs[16],sha256:'bad'};
 assert.equal(deliveryReadiness({job:j,delivery:d}).approvedDeliveryPlanPresent,false);
});

test('readiness rejects invalid retry counters and forged recovery markers',()=>{
 const changes=[
  d=>{delete d.attempts;},
  d=>{d.attempts={0:-1};},
  d=>{d.attempts={0:4};},
  d=>{d.attempts={'01':1};},
  d=>{d.attempts={'69':1};},
  d=>{d.attempts={0:'3'};},
  d=>{d.status='RECONCILING';d.attempts={0:2};},
  d=>{d.status='RECONCILING';d.attempts={0:3};d.stopped=true;},
  d=>{d.status='RECONCILING';d.attempts={0:3};d.index=69;
   d.verified=d.plan.assets.map((_,i)=>verified(d.plan,i));}
 ];
 for(const change of changes){
  const d=delivery();change(d);
  assertNotApproved(d);
 }
 const d=delivery();d.attempts={0:3};d.status='RECONCILING';
 const safe=deliveryReadiness({job:job(),delivery:d});
 assert.equal(safe.deliveryCheckpointPresent,true,
  'real durable recovery checkpoint remains recognized');
 assert.equal(safe.autoProductionReady,false);
 assert.equal(safe.deliveryConnected,false);
});

test('readiness rejects fake verified Drive IDs and inconsistent stopped checkpoint',()=>{
 const p=plan(),d=delivery(p);
 d.index=2;d.verified=[verified(p,0),verified(p,1)];
 for(const bad of ['', 'not an id', '../escape','a'.repeat(201),42]){
  const snapshot=structuredClone(d);
  snapshot.verified[1].id=bad;
  assertNotApproved(snapshot);
 }
 for(const status of ['QUEUED','RETRY_WAIT','WAITING_STORAGE','RECONCILING']){
  const snapshot=delivery();
  snapshot.status=status;
  snapshot.stopped=true;
  if(status==='RECONCILING')snapshot.attempts={0:3};
  assertNotApproved(snapshot);
 }
});

test('readiness uses fail-closed integrity rules before alarm can create provider connector',async()=>{
 const {dispatchCoordinatorAlarm}=await import('../cloudflare/ldb-runner/delivery-alarm.mjs');
 const j=job(),checkpoint=delivery();
 checkpoint.attempts={0:-1};
 let creates=0;
 const result=await dispatchCoordinatorAlarm({
  storage:{get:async()=>checkpoint},
  imageCore:{status:async()=>j,tick:async()=>assert.fail('already ready')},
  deliveryEnabled:true,
  createDelivery:()=>{creates++;throw Error('CONNECTOR_MUST_NOT_BE_CREATED');}
 });
 assert.equal(result.status,'DELIVERY_BLOCKED');
 assert.equal(creates,0);
});

test('owner progress never claims 69 verified Drive files from a corrupt COMPLETE checkpoint',async()=>{
 const {productionProgressSnapshot}=await import('../lib/ldb/production-progress.mjs');
 const p=plan(),d=delivery(p);
 d.index=69;d.status='COMPLETE';d.verified=p.assets.map((_,i)=>verified(p,i));
 const valid=productionProgressSnapshot({job:job(),delivery:d});
 assert.equal(valid.production.verifiedDriveFiles,69);
 assert.equal(valid.production.deliveryComplete,true);
 const bad=structuredClone(d);
 bad.attempts={0:4};
 const unsafe=productionProgressSnapshot({job:job(),delivery:bad});
 assert.equal(unsafe.production.approvedDeliveryPlanPresent,false);
 assert.equal(unsafe.production.deliveryStatus,'NOT_APPROVED');
 assert.equal(unsafe.production.verifiedDriveFiles,0);
 assert.equal(unsafe.production.deliveryComplete,false);
 assert.equal(unsafe.production.reviewRequired,true);
 assert.equal(unsafe.deliveryConnected,false);
 assert.equal(unsafe.autoProductionReady,false);
});

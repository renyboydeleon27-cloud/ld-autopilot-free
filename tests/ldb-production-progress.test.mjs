import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {validateDeliveryPlan} from '../lib/ldb/production-delivery.mjs';
import {productionProgressSnapshot} from '../lib/ldb/production-progress.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const id='a'.repeat(64);
const hash='b'.repeat(64);
function image(scene){return {scene,sha256:hash,mimeType:'image/png',bytes:120,chunks:1};}
function job(count=0,status=count===17?'IMAGES_READY':'QUEUED'){
 return {id,status,index:count,stop:false,outputs:ALL_SCENES.slice(0,count).map(image)};
}
function plan(){
 const cats=[
  ['Storyboard',['story']],['Approved reference images',ALL_SCENES.slice(0,16)],
  ['Image prompts',ALL_SCENES],['Flow video prompts',ALL_SCENES.slice(0,16)],
  ['Narration',ALL_SCENES.slice(0,16)],['Thumbnail',['THUMBNAIL']],
  ['Quality audit',['audit']],['Production manifest',['manifest']]
 ];
 const assets=[];
 for(const [category,scenes] of cats)for(const scene of scenes){
  const isImage=['Thumbnail','Approved reference images'].includes(category);
  assets.push({category,scene,key:sha(category+'-'+scene),sha256:sha('bytes-'+category+'-'+scene),
   name:scene+(isImage?'.png':'.txt'),mimeType:isImage?'image/png':'text/plain',bytes:120});
 }
 return {jobId:id,approvalVerified:true,visualAudit:'PASS',episode:'Lake Nyos 1986',assets};
}
function checkpoint(){const p=plan();return {plan:p,fingerprint:validateDeliveryPlan(p),
 index:0,status:'QUEUED',stopped:false,verified:[],attempts:{}};}
function withRecords(d,n){
 d.index=n;d.verified=d.plan.assets.slice(0,n).map((a,i)=>({
  key:a.key,sha256:a.sha256,id:'drive-file-'+i,status:'VERIFIED'
 }));d.status=n===69?'COMPLETE':'QUEUED';return d;
}
test('empty or invalid job never invents render or delivery progress',()=>{
 for(const j of [null,{},job(0),{...job(6),outputs:[image('P3'),...job(6).outputs.slice(1)]}]){
  const r=productionProgressSnapshot({job:j});
  assert.equal(r.production.verifiedDriveFiles,0);
  assert.equal(r.production.approvedDeliveryPlanPresent,false);
  assert.equal(r.production.deliveryComplete,false);
  assert.equal(r.autoProductionReady,false);
  assert.equal(r.deliveryConnected,false);
 }
 assert.equal(productionProgressSnapshot({job:{}}).production.next,'NO_VERIFIED_JOB');
});
test('6 and 12 generated scenes do not masquerade as accepted or delivered',()=>{
 for(const count of [6,12,17]){
  const r=productionProgressSnapshot({job:job(count)});
  assert.equal(r.production.renderedScenes,count);
  assert.equal(r.production.verifiedDriveFiles,0);
  assert.equal(r.production.reviewRequired,true);
  assert.equal(r.production.deliveryComplete,false);
  assert.equal(r.production.approvedDeliveryPlanPresent,false);
  assert.equal(r.production.next,count===17?'AWAIT_VISUAL_APPROVAL_AND_69_FILE_PLAN':'AWAIT_17_IMAGES');
  assert.equal(r.job.outputs.length,count);
  assert.ok(r.job.outputs.every(x=>x.visualAudit==='PENDING'));
 }
});
test('trusted 69-asset plan reports actual verified Drive count, not generated images',()=>{
 const d=withRecords(checkpoint(),20);
 const r=productionProgressSnapshot({job:job(17),delivery:d});
 assert.equal(r.production.renderedScenes,17);
 assert.equal(r.production.verifiedDriveFiles,20);
 assert.equal(r.production.expectedDriveFiles,69);
 assert.equal(r.production.approvedDeliveryPlanPresent,true);
 assert.equal(r.production.deliveryComplete,false);
 assert.equal(r.production.next,'DELIVERY_CHECKPOINT_ACTIVE');
});
test('only all 69 unique integrity-bound Drive records may show delivery complete',()=>{
 const completed=withRecords(checkpoint(),69);
 const ok=productionProgressSnapshot({job:job(17),delivery:completed});
 assert.equal(ok.production.deliveryComplete,true);
 assert.equal(ok.production.verifiedDriveFiles,69);
 assert.equal(ok.production.next,'DELIVERY_VERIFIED');
 for(const mutate of [
  d=>{d.verified[68].id=d.verified[0].id},
  d=>{d.verified[68].sha256='0'.repeat(64)},
  d=>{d.fingerprint='0'.repeat(64)},
  d=>{d.index=68}
 ]){
  const x=structuredClone(completed);mutate(x);
  const r=productionProgressSnapshot({job:job(17),delivery:x});
  assert.equal(r.production.verifiedDriveFiles,0);
  assert.equal(r.production.deliveryComplete,false);
  assert.equal(r.production.reviewRequired,true);
 }
});
test('STOP and review failure are reflected without mutating storage or uploading',()=>{
 const j=job(17),d=withRecords(checkpoint(),11);
 j.stop=true;
 const r=productionProgressSnapshot({job:j,delivery:d});
 assert.equal(r.production.next,'STOPPED');
 assert.equal(r.production.verifiedDriveFiles,11);
 assert.equal(r.production.deliveryComplete,false);
 const failed=productionProgressSnapshot({job:{...j,stop:false,status:'NEEDS_REVIEW'},delivery:d});
 assert.equal(failed.production.next,'RENDER_NEEDS_REVIEW');
});
test('all snapshots omit credentials, Drive IDs and arbitrary text from durable records',()=>{
 const d=withRecords(checkpoint(),3);
 d.secret='must-not-leak';
 d.verified[0].token='must-not-leak';
 const j=job(17);j.secret='must-not-leak';j.approvedSource={storyboard_utf8:'private'};
 const r=JSON.stringify(productionProgressSnapshot({job:j,delivery:d}));
 assert.equal(r.includes('must-not-leak'),false);
 assert.equal(r.includes('drive-file-'),false);
 assert.equal(r.includes('private'),false);
});

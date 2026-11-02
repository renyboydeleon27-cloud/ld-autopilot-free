import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateDeliverySnapshot,deliveryNextAction} from '../lib/ldb/delivery-coordinator-gate.mjs';
import {validateDeliveryPlan} from '../lib/ldb/production-delivery.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const scenes=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
function plan(){
 const assets=[];
 for(const [category,ids] of [['Storyboard',['story']],['Approved reference images',scenes],['Image prompts',[...scenes,'THUMBNAIL']],['Flow video prompts',scenes],['Narration',scenes],['Thumbnail',['THUMBNAIL']],['Quality audit',['audit']],['Production manifest',['manifest']]]){
  for(const scene of ids){
   const image=['Approved reference images','Thumbnail'].includes(category);
   assets.push({key:sha('key:'+category+scene),sha256:sha('bytes:'+category+scene),bytes:100,category,scene,name:scene+'.'+(image?'png':'txt'),mimeType:image?'image/png':'text/plain'});
  }
 }
 return {jobId:'a'.repeat(64),approvalVerified:true,visualAudit:'PASS',episode:'Lake Nyos 1986',assets};
}
function state(p=plan()){
 return {plan:structuredClone(p),fingerprint:validateDeliveryPlan(p),status:'QUEUED',stopped:false,index:0,verified:[]};
}
function verified(p,i){return {key:p.assets[i].key,sha256:p.assets[i].sha256,id:'drive-file-'+i,status:'VERIFIED'};}
test('selects first unverified asset using a complete 17-scene production plan',()=>{
 const p=plan(),s=state(p);
 assert.equal(p.assets.length,69);
 assert.equal(deliveryNextAction(p,s).assetKey,p.assets[0].key);
});
test('completed 69-file checkpoint requires final verification',()=>{
 const p=plan(),s=state(p);s.index=69;s.status='COMPLETE';s.verified=p.assets.map((_,i)=>verified(p,i));
 assert.equal(deliveryNextAction(p,s).type,'READY_FOR_FINAL_VERIFICATION');
});
test('STOP, NEEDS_REVIEW and in-flight uploads prevent a new delivery action',()=>{
 const p=plan();
 for(const status of ['STOPPED','NEEDS_REVIEW','UPLOADING','RETRY_WAIT']){
  const s=state(p);s.status=status;assert.throws(()=>deliveryNextAction(p,s),/JOB_BLOCKED/);
 }
 const s=state(p);s.stopped=true;assert.throws(()=>deliveryNextAction(p,s),/JOB_BLOCKED/);
});
test('missing visual approval prevents delivery',()=>{
 const p=plan();p.visualAudit='PENDING';assert.throws(()=>deliveryNextAction(p,{...state(),plan:p}),/DELIVERY_NOT_APPROVED/);
});
test('foreign job or altered plan fingerprint is rejected',()=>{
 const p=plan(),s=state(p);s.plan.jobId='b'.repeat(64);
 assert.throws(()=>deliveryNextAction(p,s),/JOB_MISMATCH/);
 s.plan=structuredClone(p);s.fingerprint='b'.repeat(64);assert.throws(()=>deliveryNextAction(p,s),/JOB_MISMATCH/);
});
test('duplicate, out of order or unverified checkpoints are rejected',()=>{
 const p=plan(),s=state(p);s.index=2;s.verified=[verified(p,0),verified(p,0)];
 assert.throws(()=>validateDeliverySnapshot(p,s),/INVALID_CHECKPOINT/);
 s.verified=[verified(p,1),verified(p,0)];assert.throws(()=>validateDeliverySnapshot(p,s),/INVALID_CHECKPOINT/);
 s.verified=[verified(p,0),{...verified(p,1),id:''}];assert.throws(()=>validateDeliverySnapshot(p,s),/INVALID_CHECKPOINT/);
});
test('checkpoint count and completion status must match',()=>{
 const p=plan(),s=state(p);s.index=1;
 assert.throws(()=>deliveryNextAction(p,s),/INVALID_CHECKPOINT/);
 s.index=0;s.status='COMPLETE';assert.throws(()=>deliveryNextAction(p,s),/INVALID_CHECKPOINT/);
});
test('missing or duplicated scene identity is hard blocked even with 69 assets',()=>{
 const p=plan(),i=p.assets.findIndex(a=>a.category==='Approved reference images'&&a.scene==='P3');
 p.assets[i].scene='P2';
 assert.equal(p.assets.length,69);
 assert.throws(()=>deliveryNextAction(p,state()),/INCOMPLETE_SCENE_DELIVERY/);
});
test('missing thumbnail, narration or image prompt scene is hard blocked',()=>{
 for(const category of ['Thumbnail','Narration','Image prompts']){
  const p=plan(),a=p.assets.find(a=>a.category===category);a.scene='FOREIGN';
  assert.throws(()=>deliveryNextAction(p,state()),/INCOMPLETE_SCENE_DELIVERY/);
 }
});
test('invalid checksum and invalid asset type fail closed',()=>{
 const p=plan();p.assets[0].sha256='bad';assert.throws(()=>deliveryNextAction(p,state()),/INVALID_DELIVERY_PLAN/);
 const q=plan();q.assets[0].mimeType='image/png';assert.throws(()=>deliveryNextAction(q,state()),/INVALID_DELIVERY_TYPE/);
});

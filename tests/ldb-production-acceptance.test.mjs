import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {validateDeliveryPlan} from '../lib/ldb/production-delivery.mjs';
import {productionAcceptanceSnapshot,readMilestoneReceipts} from '../lib/ldb/production-acceptance.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex'),id='a'.repeat(64);
const job=(count=0)=>({
 id,stop:false,status:count===17?'IMAGES_READY':'QUEUED',index:count,
 approvedSource:{sha256:sha('approved source')},
 outputs:ALL_SCENES.slice(0,count).map(scene=>({
  scene,sha256:sha('image:'+scene),bytes:120,chunks:1,mimeType:'image/png'
 }))
});
function plan(){
 const categories=[['Storyboard',['story']],
  ['Approved reference images',ALL_SCENES.slice(0,16)],
  ['Image prompts',ALL_SCENES],
  ['Flow video prompts',ALL_SCENES.slice(0,16)],
  ['Narration',ALL_SCENES.slice(0,16)],
  ['Thumbnail',['THUMBNAIL']],['Quality audit',['audit']],
  ['Production manifest',['manifest']]];
 const assets=[];
 for(const [category,scenes] of categories)for(const scene of scenes){
  const image=['Approved reference images','Thumbnail'].includes(category);
  assets.push({category,scene,key:sha('key:'+category+':'+scene),sha256:sha('bytes:'+category+':'+scene),
   name:scene+(image?'.png':'.txt'),mimeType:image?'image/png':'text/plain',bytes:120});
 }
 return {jobId:id,approvalVerified:true,visualAudit:'PASS',episode:'Lake Nyos 1986',assets};
}
function delivery(n){
 const p=plan();return {plan:p,fingerprint:validateDeliveryPlan(p),
  index:n,status:n===69?'COMPLETE':'QUEUED',stopped:false,
  verified:p.assets.slice(0,n).map((a,i)=>({key:a.key,sha256:a.sha256,id:'drive-'+i,status:'VERIFIED'}))};
}
test('one report remains NO_GO with zero renders and no real approvals',()=>{
 const a=productionAcceptanceSnapshot();
 assert.equal(a.status,'NO_GO');
 assert.equal(a.renderedScenes,0);
 assert.equal(a.verifiedDriveFiles,0);
 assert.equal(a.gmailVaultAcknowledged,0);
 assert.ok(a.blockers.includes('APPROVED_STORYBOARD_SOURCE_NOT_VERIFIED'));
 assert.ok(a.blockers.includes('RENDER_17_SCENES_NOT_COMPLETE'));
 assert.equal(a.productionDeployedAndAccepted,false);
});
test('all 17 generated without trusted review never masquerade as production complete',()=>{
 const a=productionAcceptanceSnapshot({job:job(17)});
 assert.equal(a.originalStoryboardDigestRecorded,true);
 assert.equal(a.renderedScenes,17);
 assert.equal(a.acceptedImageDeliveryPlan,false);
 assert.equal(a.verifiedDriveFiles,0);
 assert.equal(a.status,'NO_GO');
 assert.ok(a.blockers.includes('TRUSTED_17_IMAGE_VISUAL_REVIEW_AND_PLAN_MISSING'));
});
test('69 verified delivery records do not prove Gmail inbox or production readiness',()=>{
 const a=productionAcceptanceSnapshot({job:job(17),delivery:delivery(69),
  receipts:{30:'SENT',50:'SENT',70:'SENT',100:'SENT'}});
 assert.equal(a.acceptedImageDeliveryPlan,true);
 assert.equal(a.verifiedDriveFiles,69);
 assert.equal(a.driveCheckpointComplete,true);
 assert.equal(a.gmailVaultAcknowledged,4);
 assert.equal(a.gmailInboxVerified,false);
 assert.equal(a.productionDeployedAndAccepted,false);
 assert.equal(a.freeQuotaVerifiedToday,false);
 assert.equal(a.status,'NO_GO');
 assert.ok(!a.blockers.includes('DRIVE_69_FILES_NOT_VERIFIED'));
});
test('tampered delivery IDs fail closed, stale receipt data cannot create success',()=>{
 const d=delivery(69);
 d.verified[68].id=d.verified[0].id;
 const a=productionAcceptanceSnapshot({job:job(17),delivery:d,
  receipts:{30:'SENT',50:'SENT',70:'SENT',100:'SENT',secrets:'private'}});
 assert.equal(a.verifiedDriveFiles,0);
 assert.equal(a.acceptedImageDeliveryPlan,false);
 assert.ok(a.blockers.includes('DRIVE_69_FILES_NOT_VERIFIED'));
 assert.ok(!JSON.stringify(a).includes('private'));
});
test('STOP and uncertain milestone are explicit and never counted as confirmed',()=>{
 const j=job(12);j.stop=true;
 const a=productionAcceptanceSnapshot({job:j,receipts:{30:'SENT',50:'UNCERTAIN',70:'CLAIMED',100:'RETRY_WAIT'}});
 assert.equal(a.stopped,true);
 assert.equal(a.gmailVaultAcknowledged,1);
 assert.equal(a.gmailReceiptStatuses[50],'UNCERTAIN');
 assert.equal(a.status,'NO_GO');
});
test('receipt reader only queries fixed milestone keys for a valid job ID',async()=>{
 const requested=[];
 const storage={get:async key=>{requested.push(key);return key.endsWith(':30')?{status:'SENT'}:{status:'UNCERTAIN'};}};
 assert.deepEqual(await readMilestoneReceipts(storage,'not-a-job'),{});
 const r=await readMilestoneReceipts(storage,id);
 assert.deepEqual(requested,[30,50,70,100].map(p=>'milestone-result:'+id+':'+p));
 assert.equal(r[30],'SENT');
 assert.equal(r[100],'UNCERTAIN');
 assert.equal(productionAcceptanceSnapshot({job:job(6),receipts:r}).gmailVaultAcknowledged,1);
});

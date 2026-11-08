import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {prepareApprovedProductionDelivery} from '../lib/ldb/approved-production-delivery.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const id='c'.repeat(64);
 const images=ALL_SCENES.map((scene,i)=>({scene,mimeType:'image/jpeg',bytes:Buffer.from('image-'+i)}));
 const outputs=images.map(a=>({scene:a.scene,mimeType:a.mimeType,bytes:a.bytes.length,sha256:sha(a.bytes)}));
 const job={id,index:17,status:'IMAGES_READY',outputs};
 const approvedAudit={jobId:id,status:'PASS',reviewerVerified:true,scenes:outputs.map(x=>({scene:x.scene,result:'PASS',sha256:x.sha256}))};
 const otherAssets=[];let n=0;
 const add=(category,scene,name,mimeType='text/plain')=>{
  const bytes=Buffer.from('content-'+n);
  otherAssets.push({key:sha('other-'+n++),category,scene,name,mimeType,bytes,bytesLength:bytes.length,sha256:sha(bytes)});
 };
 add('Storyboard',undefined,'storyboard.json','application/json');
 for(const scene of ALL_SCENES)add('Image prompts',scene,scene+'.txt');
 for(const scene of ALL_SCENES.slice(0,16)){add('Flow video prompts',scene,scene+'.txt');add('Narration',scene,scene+'.txt');}
 add('Quality audit',undefined,'audit.json','application/json');
 add('Production manifest',undefined,'manifest.json','application/json');
 return {job,images,approvedAudit,otherAssets};
}
test('complete reviewed package creates a valid 69-asset delivery plan',async()=>{
 const f=fixture();const result=prepareApprovedProductionDelivery(f);
 assert.equal(result.plan.assets.length,69);
 assert.equal(result.plan.assets.filter(a=>a.category==='Thumbnail').length,1);
 const first=result.plan.assets[0];assert.equal(sha(await result.readAsset(first)),first.sha256);
});
test('missing narration blocks delivery',()=>{
 const f=fixture();f.otherAssets=f.otherAssets.filter(x=>!(x.category==='Narration'&&x.scene==='P1'));
 assert.throws(()=>prepareApprovedProductionDelivery(f),/INCOMPLETE_DELIVERY_PLAN/);
});
test('tampered text bytes block delivery',()=>{
 const f=fixture();f.otherAssets[0].bytes=Buffer.from('tampered');
 assert.throws(()=>prepareApprovedProductionDelivery(f),/ASSET_INTEGRITY_FAILED/);
});
test('rejected image blocks delivery',()=>{
 const f=fixture();f.approvedAudit.scenes[0].result='FAIL';
 assert.throws(()=>prepareApprovedProductionDelivery(f),/INVALID_VISUAL_AUDIT/);
});

test('another approved disaster episode gets its own correctly named delivery folder',()=>{
 const f=fixture();
 const result=prepareApprovedProductionDelivery({...f,episode:'2011 Tōhoku Earthquake and Tsunami'});
 assert.equal(result.plan.episode,'2011 Tōhoku Earthquake and Tsunami');
 assert.equal(result.plan.assets.length,69);
 assert.equal(result.fingerprint.length,64);
 assert.notEqual(result.fingerprint,prepareApprovedProductionDelivery(f).fingerprint);
});
test('unsafe episode title cannot create a Google Drive delivery plan',()=>{
 for(const episode of ['',' ','../escape','Lake/Nyos','Lake\\\\Nyos',' Lake Nyos','Lake Nyos ','A..B','A\\nB','A'.repeat(121)]){
  const f=fixture();
  assert.throws(()=>prepareApprovedProductionDelivery({...f,episode}),/INVALID_EPISODE_NAME/,episode);
 }
});

test('reviewed 69-file manifest resists post-audit edits and drops private extras',async()=>{
 const f=fixture(),privateData='DO_NOT_ECHO_SOURCE_PRIVATE_METADATA';
 f.otherAssets[0].debugCredentials=privateData;
 const prepared=prepareApprovedProductionDelivery(f);
 const asset=prepared.plan.assets[0],digest=prepared.fingerprint;
 assert.ok(Object.isFrozen(prepared.plan));
 assert.ok(Object.isFrozen(prepared.plan.assets));
 assert.ok(prepared.plan.assets.every(Object.isFrozen));
 assert.throws(()=>{prepared.plan.assets[0].name='unapproved.jpg'},TypeError);
 assert.throws(()=>prepared.plan.assets.push(asset),TypeError);
 assert.throws(()=>{prepared.plan.episode='Other Episode'},TypeError);
 f.otherAssets[0].name='unreviewed.json';
 f.otherAssets[0].sha256='0'.repeat(64);
 assert.equal(prepared.plan.assets.find(x=>x.category==='Storyboard').name,'storyboard.json');
 assert.equal(prepared.plan.assets.length,69);
 assert.equal(prepared.fingerprint,digest);
 assert.equal(prepared.fingerprint,validateDeliveryPlan(prepared.plan));
 assert.ok(!JSON.stringify(prepared.plan).includes(privateData));
 assert.equal(sha(await prepared.readAsset(asset)),asset.sha256);
});

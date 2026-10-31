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

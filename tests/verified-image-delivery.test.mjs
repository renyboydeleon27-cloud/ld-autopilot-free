import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {prepareVerifiedImageDelivery} from '../lib/ldb/verified-image-delivery.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const id='b'.repeat(64);
 const assets=ALL_SCENES.map((scene,i)=>({scene,mimeType:'image/jpeg',bytes:Buffer.from('verified-image-'+i)}));
 const outputs=assets.map(a=>({scene:a.scene,mimeType:a.mimeType,bytes:a.bytes.length,sha256:sha(a.bytes)}));
 return {job:{id,index:17,status:'IMAGES_READY',outputs},assets,approvedAudit:{jobId:id,status:'PASS',reviewerVerified:true,scenes:outputs.map(x=>({scene:x.scene,result:'PASS',sha256:x.sha256}))}};
}
test('handoff builds 16 story images and one thumbnail record',()=>{
 const p=prepareVerifiedImageDelivery(fixture());
 assert.equal(p.assets.length,17);
 assert.equal(p.assets.filter(x=>x.category==='Approved reference images').length,16);
 assert.equal(p.assets.filter(x=>x.category==='Thumbnail').length,1);
 assert.equal(new Set(p.assets.map(x=>x.key)).size,17);
});
test('tampered bytes prevent any delivery plan',()=>{
 const f=fixture();f.assets[2].bytes=Buffer.from('tampered');
 assert.throws(()=>prepareVerifiedImageDelivery(f),/IMAGE_INTEGRITY_FAILED/);
});
test('unreviewed thumbnail blocks the entire handoff',()=>{
 const f=fixture();f.approvedAudit.scenes[16].result='FAIL';
 assert.throws(()=>prepareVerifiedImageDelivery(f),/INVALID_VISUAL_AUDIT/);
});

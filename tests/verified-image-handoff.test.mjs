import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ALL_SCENES,validateImageHandoff} from '../lib/ldb/verified-image-handoff.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const id='a'.repeat(64);
 const assets=ALL_SCENES.map((scene,i)=>({scene,mimeType:'image/jpeg',bytes:Buffer.from('image-'+i)}));
 const outputs=assets.map(a=>({scene:a.scene,mimeType:a.mimeType,bytes:a.bytes.length,sha256:hash(a.bytes)}));
 const job={id,status:'IMAGES_READY',index:17,outputs};
 const approvedAudit={jobId:id,status:'PASS',reviewerVerified:true,scenes:outputs.map(x=>({scene:x.scene,result:'PASS',sha256:x.sha256}))};
 return {job,assets,approvedAudit};
}
test('verified complete handoff succeeds',()=>{const f=fixture();const result=validateImageHandoff(f);assert.equal(result.images.length,17);assert.equal(result.jobId,f.job.id);});
test('unreviewed or rejected art is blocked',()=>{const f=fixture();f.approvedAudit.scenes[0].result='FAIL';assert.throws(()=>validateImageHandoff(f),/INVALID_VISUAL_AUDIT/);});
test('missing trusted reviewer is blocked',()=>{const f=fixture();f.approvedAudit.reviewerVerified=false;assert.throws(()=>validateImageHandoff(f),/VISUAL_REVIEW_REQUIRED/);});
test('modified image bytes are blocked',()=>{const f=fixture();f.assets[0].bytes=Buffer.from('modified');assert.throws(()=>validateImageHandoff(f),/IMAGE_INTEGRITY_FAILED/);});
test('incomplete runner job is blocked',()=>{const f=fixture();f.job.index=1;assert.throws(()=>validateImageHandoff(f),/INCOMPLETE_IMAGES/);});
test('duplicate audit scene is blocked',()=>{const f=fixture();f.approvedAudit.scenes[1]=f.approvedAudit.scenes[0];assert.throws(()=>validateImageHandoff(f),/INVALID_VISUAL_AUDIT/);});

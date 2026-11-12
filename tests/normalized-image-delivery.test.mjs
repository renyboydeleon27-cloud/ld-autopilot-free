import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {prepareNormalizedImageDelivery} from '../lib/ldb/normalized-image-delivery.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
// Byte fixtures exercise provenance, not the independent Pillow decoder.
function fixture(){
 const sourceAssets=ALL_SCENES.map(scene=>({scene,mimeType:'image/jpeg',bytes:Buffer.from('source-'+scene)}));
 const assets=ALL_SCENES.map(scene=>({scene,mimeType:'image/png',bytes:Buffer.from('normalized-'+scene)}));
 const job={id:'a'.repeat(64),index:17,status:'IMAGES_READY',outputs:sourceAssets.map(a=>({scene:a.scene,mimeType:a.mimeType,bytes:a.bytes.length,sha256:hash(a.bytes)}))};
 const normalizationAudit=assets.map((a,i)=>{
  const gray=a.scene!=='THUMBNAIL';
  return {scene:a.scene,source_sha256:job.outputs[i].sha256,sha256:hash(a.bytes),bytes:a.bytes.length,width:576,height:1024,structural_check:'PASS',neutral_grayscale:gray,
   pixel_audit:{scene:a.scene,sha256:hash(a.bytes),bytes:a.bytes.length,width:576,height:1024,structural_check:'PASS',reasons:[],neutral_grayscale:gray,max_channel_spread:gray?0:80,non_neutral_pixels:gray?0:100}};
 });
 const approvedAudit={jobId:job.id,status:'PASS',reviewerVerified:true,scenes:assets.map(a=>({scene:a.scene,result:'PASS',sha256:hash(a.bytes)}))};
 return {job,sourceAssets,assets,normalizationAudit,approvedAudit};
}
test('17 normalized images retain source checkpoint and use reviewed PNG hashes',()=>{
 const f=fixture(),before=JSON.stringify(f.job),out=prepareNormalizedImageDelivery(f);
 assert.equal(out.assets.length,17);assert.equal(out.assets[0].name,'HOOK.png');
 assert.equal(out.assets[0].sha256,hash(f.assets[0].bytes));assert.equal(JSON.stringify(f.job),before);
});
test('original-image review cannot approve changed PNGs',()=>{
 const f=fixture();f.approvedAudit.scenes[0].sha256=f.job.outputs[0].sha256;
 assert.throws(()=>prepareNormalizedImageDelivery(f),/IMAGE_AUDIT_MISMATCH/);
});
test('pixel success alone cannot authorize delivery',()=>{
 const f=fixture();delete f.approvedAudit;
 assert.throws(()=>prepareNormalizedImageDelivery(f),/VISUAL_REVIEW_REQUIRED/);
});
for(const [name,change] of [
 ['changed source',f=>{f.sourceAssets[0].bytes=Buffer.from('wrong');}],
 ['changed normalized bytes',f=>{f.assets[0].bytes=Buffer.from('wrong');}],
 ['wrong source hash',f=>{f.normalizationAudit[0].source_sha256='b'.repeat(64);}],
 ['pixel audit hash mismatch',f=>{f.normalizationAudit[0].pixel_audit.sha256='b'.repeat(64);}],
 ['tint',f=>{f.normalizationAudit[0].pixel_audit.max_channel_spread=1;}],
 ['monochrome thumbnail',f=>{f.normalizationAudit[16].neutral_grayscale=true;}],
 ['missing image',f=>{f.assets.pop();}],
 ['scene swap',f=>{[f.assets[0],f.assets[1]]=[f.assets[1],f.assets[0]];}],
 ['missing pixel audit',f=>{delete f.normalizationAudit[0].pixel_audit;}],
])test(name+' is blocked',()=>{const f=fixture();change(f);assert.throws(()=>prepareNormalizedImageDelivery(f),/NORMALIZED_IMAGE_PROVENANCE_FAILED/);});

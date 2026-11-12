// Trusted server adapter. Audit records must be loaded by the backend, never
// accepted as browser assertions. Pixel checks do not grant visual approval.
import {createHash} from 'node:crypto';
import {ALL_SCENES} from './verified-image-handoff.mjs';
import {prepareVerifiedImageDelivery} from './verified-image-delivery.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const fail=()=>{throw Error('NORMALIZED_IMAGE_PROVENANCE_FAILED');};

export function prepareNormalizedImageDelivery({job,sourceAssets,assets,normalizationAudit,approvedAudit}={}){
 if(!job||job.index!==17||!['IMAGES_READY','TEST_PAUSED'].includes(job.status)||
    ![job.outputs,sourceAssets,assets,normalizationAudit].every(x=>Array.isArray(x)&&x.length===17))fail();
 const outputs=ALL_SCENES.map((scene,i)=>{
  const source=sourceAssets[i],meta=job.outputs[i],asset=assets[i],audit=normalizationAudit[i];
  if(source?.scene!==scene||meta?.scene!==scene||asset?.scene!==scene||audit?.scene!==scene)fail();
  if(!(source.bytes instanceof Uint8Array)||source.bytes.length!==meta.bytes||
     source.mimeType!==meta.mimeType||hash(source.bytes)!==meta.sha256||audit.source_sha256!==meta.sha256)fail();
  if(!(asset.bytes instanceof Uint8Array)||asset.mimeType!=='image/png'||
     asset.bytes.length!==audit.bytes||hash(asset.bytes)!==audit.sha256)fail();
  const pixel=audit.pixel_audit;
  if(audit.structural_check!=='PASS'||audit.width!==576||audit.height!==1024||
     !pixel||pixel.scene!==scene||pixel.sha256!==audit.sha256||pixel.bytes!==audit.bytes||
     pixel.structural_check!=='PASS'||pixel.width!==576||pixel.height!==1024||
     !Array.isArray(pixel.reasons)||pixel.reasons.length!==0)fail();
  if(scene!=='THUMBNAIL'){
   if(audit.neutral_grayscale!==true||pixel.neutral_grayscale!==true||pixel.max_channel_spread!==0||pixel.non_neutral_pixels!==0)fail();
  }else if(audit.neutral_grayscale!==false||pixel.neutral_grayscale!==false||!(pixel.max_channel_spread>0)||!(pixel.non_neutral_pixels>0))fail();
  return {scene,bytes:asset.bytes.length,sha256:audit.sha256,mimeType:asset.mimeType};
 });
 // Review must name the final PNG hashes, not the original provider hashes.
 // Keep the original runner checkpoint unchanged for recovery and traceability.
 return prepareVerifiedImageDelivery({job:{...job,outputs},assets,approvedAudit});
}

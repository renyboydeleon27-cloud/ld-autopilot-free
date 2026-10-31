// Trusted backend adapter: construct Drive-delivery image records only from
// checked runner bytes and a server-loaded, reviewer-authenticated audit.
// No browser-facing endpoint or automatic visual approval is provided here.
import {createHash} from 'node:crypto';
import {validateImageHandoff,ALL_SCENES} from './verified-image-handoff.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const key=(jobId,scene)=>sha('ldb-delivery-image-v1:'+jobId+':'+scene);
export function prepareVerifiedImageDelivery({job,assets,approvedAudit}={}){
 const checked=validateImageHandoff({job,assets,approvedAudit});
 const entries=checked.images.map((meta,i)=>{
  const scene=ALL_SCENES[i],thumbnail=scene==='THUMBNAIL';
  return Object.freeze({
   key:key(checked.jobId,scene),
   scene,
   category:thumbnail?'Thumbnail':'Approved reference images',
   name:scene+(meta.mimeType==='image/png'?'.png':'.jpg'),
   mimeType:meta.mimeType,
   bytes:meta.bytes,
   sha256:meta.sha256
  });
 });
 return Object.freeze({jobId:checked.jobId,assets:Object.freeze(entries)});
}

// Rehydrate image bytes on each delivery alarm instead of keeping them in Worker memory.
// This resolver is read-only; it requires trusted storage and an already-validated plan.
import {createHash} from 'node:crypto';
import {ALL_SCENES} from './verified-image-handoff.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=code=>{throw Error(code);};
export function durableImageAssetReader(storage,{expectedJobId}={}){
 if(!storage||typeof storage.get!=='function'||!/^[a-f0-9]{64}$/.test(expectedJobId||''))fail('TRUSTED_IMAGE_STORAGE_REQUIRED');
 return async asset=>{
  if(!asset||!['Approved reference images','Thumbnail'].includes(asset.category))fail('NOT_RUNNER_IMAGE');
  const scene=asset.scene,index=ALL_SCENES.indexOf(scene);
  if(index<0)fail('INVALID_SCENE');
  if((scene==='THUMBNAIL')!==(asset.category==='Thumbnail'))fail('RUNNER_IMAGE_CATEGORY_MISMATCH');
  if(!['image/png','image/jpeg'].includes(asset.mimeType)||!Number.isSafeInteger(asset.bytes)||asset.bytes<1||asset.bytes>8000000||!/^[a-f0-9]{64}$/.test(asset.sha256||''))fail('INVALID_RUNNER_IMAGE_ASSET');
  const job=await storage.get('job');
  if(job?.id!==expectedJobId||job.status!=='IMAGES_READY'||job.index!==17||job.outputs?.length!==17)fail('RUNNER_IMAGES_NOT_READY');
  const meta=job.outputs[index];
  if(meta?.scene!==scene||meta.sha256!==asset.sha256||meta.bytes!==asset.bytes||meta.mimeType!==asset.mimeType||!Number.isSafeInteger(meta.chunks)||meta.chunks<1||meta.chunks>125)fail('RUNNER_IMAGE_METADATA_CHANGED');
  const chunks=[];let total=0;
  for(let n=0;n<meta.chunks;n++){
   const part=await storage.get('image:'+index+':'+n);
   if(!(part instanceof Uint8Array)||part.length<1||part.length>64000)fail('RUNNER_IMAGE_CHUNK_MISSING');
   total+=part.length;if(total>asset.bytes)fail('RUNNER_IMAGE_LENGTH_MISMATCH');
   chunks.push(Buffer.from(part));
  }
  const bytes=Buffer.concat(chunks);
  if(bytes.length!==asset.bytes||sha(bytes)!==asset.sha256)fail('ASSET_INTEGRITY_FAILED');
  return bytes;
 };
}

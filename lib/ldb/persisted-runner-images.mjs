// Trusted Cloudflare Durable Object storage adapter for existing runner image chunks.
// Read-only: never modifies, moves, deletes or approves images.
import {createHash} from 'node:crypto';
import {ALL_SCENES} from './verified-image-handoff.mjs';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=code=>{throw Error(code);};
export async function readPersistedRunnerImages(storage,{expectedJobId}={}){
 if(!storage||typeof storage.get!=='function')fail('RUNNER_STORAGE_REQUIRED');
 const job=await storage.get('job');
 if(!job||job.id!==expectedJobId||!Array.isArray(job.outputs)||job.outputs.length!==17||job.index!==17||job.status!=='IMAGES_READY')fail('RUNNER_IMAGES_NOT_READY');
 const assets=[];
 for(let i=0;i<ALL_SCENES.length;i++){
  const meta=job.outputs[i],scene=ALL_SCENES[i];
  if(meta?.scene!==scene||!Number.isSafeInteger(meta.chunks)||meta.chunks<1||meta.chunks>125||!Number.isSafeInteger(meta.bytes)||meta.bytes<1||meta.bytes>8000000||!/^[a-f0-9]{64}$/.test(meta.sha256||''))fail('INVALID_RUNNER_IMAGE_METADATA');
  const parts=[];let total=0;
  for(let j=0;j<meta.chunks;j++){
   const chunk=await storage.get('image:'+i+':'+j);
   if(!(chunk instanceof Uint8Array)||chunk.length<1||chunk.length>64000)fail('RUNNER_IMAGE_CHUNK_MISSING');
   total+=chunk.length;if(total>meta.bytes)fail('RUNNER_IMAGE_LENGTH_MISMATCH');
   parts.push(Buffer.from(chunk));
  }
  const bytes=Buffer.concat(parts);
  if(bytes.length!==meta.bytes||digest(bytes)!==meta.sha256)fail('RUNNER_IMAGE_CHECKSUM_MISMATCH');
  assets.push({scene,mimeType:meta.mimeType,bytes});
 }
 return {job,assets};
}

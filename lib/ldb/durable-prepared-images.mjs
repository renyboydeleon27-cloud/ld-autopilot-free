// Trusted backend only. Immutable corrected bytes, bound to the original
// runner output. This store does not grant pixel or visual approval.
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {ALL_SCENES} from './verified-image-handoff.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const valid=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const fail=()=>{throw Error('PREPARED_IMAGE_INTEGRITY_FAILED');};
const CHUNK=64000,MAX=8000000;
export function durablePreparedImages(storage,{jobId}={}){
 if(!storage||typeof storage.get!=='function'||!valid(jobId))fail();
 function validate(a){
  if(!a||!valid(a.key)||!valid(a.sha256)||!ALL_SCENES.includes(a.scene)||
     a.mimeType!=='image/png'||!Number.isSafeInteger(a.bytes)||a.bytes<1||a.bytes>MAX||
     a.category!==(a.scene==='THUMBNAIL'?'Thumbnail':'Approved reference images'))fail();
 }
 const base=a=>'prepared:'+jobId+':'+a.key;
 async function source(get,a,sourceSha){
  const job=await get('job'),index=ALL_SCENES.indexOf(a.scene);
  if(job?.id!==jobId||job.status!=='IMAGES_READY'||job.index!==17||
     job.outputs?.length!==17||job.outputs[index]?.scene!==a.scene||
     !valid(sourceSha)||job.outputs[index].sha256!==sourceSha)fail();
 }
 return {
  async put(a,bytes,sourceSha){
   validate(a);
   if(typeof storage.transaction!=='function'||!(bytes instanceof Uint8Array)||
      bytes.length!==a.bytes||sha(bytes)!==a.sha256)fail();
   const prefix=base(a),chunks=Math.ceil(bytes.length/CHUNK);
   return storage.transaction(async tx=>{
    await source(k=>tx.get(k),a,sourceSha);
    const expected={scene:a.scene,sha256:a.sha256,bytes:a.bytes,sourceSha,chunks};
    const old=await tx.get(prefix+':meta');
    if(old&&JSON.stringify(old)!==JSON.stringify(expected))fail();
    for(let i=0;i<chunks;i++){
     const part=bytes.slice(i*CHUNK,(i+1)*CHUNK);
     if(old){const saved=await tx.get(prefix+':'+i);if(!(saved instanceof Uint8Array)||sha(saved)!==sha(part))fail();}
     else await tx.put(prefix+':'+i,part);
    }
    if(!old)await tx.put(prefix+':meta',expected);
    return expected;
   });
  },
  async readIfPresent(a){
   const prefix=base(a),meta=await storage.get(prefix+':meta');
   if(!meta)return null;
   validate(a);await source(k=>storage.get(k),a,meta.sourceSha);
   if(meta.scene!==a.scene||meta.sha256!==a.sha256||meta.bytes!==a.bytes||
      meta.chunks!==Math.ceil(a.bytes/CHUNK))fail();
   const parts=[];
   for(let i=0;i<meta.chunks;i++){
    const part=await storage.get(prefix+':'+i);
    if(!(part instanceof Uint8Array)||part.length!==Math.min(CHUNK,a.bytes-i*CHUNK))fail();
    parts.push(Buffer.from(part));
   }
   const bytes=Buffer.concat(parts);
   if(bytes.length!==a.bytes||sha(bytes)!==a.sha256)fail();
   return bytes;
  }
 };
}

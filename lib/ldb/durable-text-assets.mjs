// Trusted backend only. Persist non-image deliverables with a transaction and
// verify every chunk on read. No external API calls or production uploads.
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=s=>{throw Error(s);};
const LIMIT=8000000,CHUNK=64000;
export function durableTextAssetStore(storage,{jobId}={}){
 if(!storage||typeof storage.transaction!=='function'||typeof storage.get!=='function'||!/^[a-f0-9]{64}$/.test(jobId||''))fail('TRUSTED_TEXT_STORAGE_REQUIRED');
 const key=a=>'text:'+jobId+':'+a.key;
 function validate(a,bytes){
  if(!a||!/^[a-f0-9]{64}$/.test(a.key||'')||!/^[a-f0-9]{64}$/.test(a.sha256||'')||!['text/plain','application/json'].includes(a.mimeType)||!Number.isSafeInteger(a.bytes)||a.bytes<1||a.bytes>LIMIT||['Approved reference images','Thumbnail'].includes(a.category))fail('INVALID_TEXT_ASSET');
  if(bytes&&(!(bytes instanceof Uint8Array)||bytes.length!==a.bytes||sha(bytes)!==a.sha256))fail('ASSET_INTEGRITY_FAILED');
 }
 return {
  async put(a,bytes){
   validate(a,bytes);
   const base=key(a),chunks=Math.ceil(bytes.length/CHUNK);
   return storage.transaction(async tx=>{
    const old=await tx.get(base+':meta');
    if(old){if(old.sha256!==a.sha256||old.bytes!==a.bytes||old.mimeType!==a.mimeType)fail('DELIVERY_ASSET_CHANGED');return old;}
    for(let i=0;i<chunks;i++)await tx.put(base+':'+i,bytes.slice(i*CHUNK,(i+1)*CHUNK));
    const meta={sha256:a.sha256,bytes:a.bytes,mimeType:a.mimeType,chunks};
    await tx.put(base+':meta',meta);return meta;
   });
  },
  async read(a){
   validate(a);const base=key(a),meta=await storage.get(base+':meta');
   if(!meta||meta.sha256!==a.sha256||meta.bytes!==a.bytes||meta.mimeType!==a.mimeType||!Number.isSafeInteger(meta.chunks)||meta.chunks<1||meta.chunks>125||meta.chunks!==Math.ceil(a.bytes/CHUNK))fail('DELIVERY_ASSET_CHANGED');
   const parts=[];let total=0;
   for(let i=0;i<meta.chunks;i++){
    const b=await storage.get(base+':'+i);
    if(!(b instanceof Uint8Array)||!b.length||b.length>CHUNK)fail('TEXT_ASSET_CHUNK_MISSING');
    total+=b.length;if(total>a.bytes)fail('ASSET_INTEGRITY_FAILED');parts.push(Buffer.from(b));
   }
   const bytes=Buffer.concat(parts);
   if(bytes.length!==a.bytes||sha(bytes)!==a.sha256)fail('ASSET_INTEGRITY_FAILED');
   return bytes;
  }
 };
}

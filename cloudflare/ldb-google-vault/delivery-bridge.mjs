// Narrow, authenticated transport for the trusted Durable Object runner.
// No OAuth tokens, Gmail actions, arbitrary endpoints, or browser quality flags.
import {Buffer} from 'node:buffer';
import {createHash,timingSafeEqual} from 'node:crypto';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const hash=b=>createHash('sha256').update(b).digest();
const sha=b=>createHash('sha256').update(b).digest('hex');
const FOLDER='application/vnd.google-apps.folder';
const ALLOWED=new Set([FOLDER,'image/png','image/jpeg','text/plain','application/json']);
const isHash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const isId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(x);
export const isDeliveryBridgePath=path=>path==='/internal/drive/capacity'||path==='/internal/drive/put';

async function readBounded(req,max){
 const reader=req.body?.getReader();if(!reader)return Buffer.alloc(0);
 const parts=[];let length=0;
 for(;;){const item=await reader.read();if(item.done)break;
  if(!(item.value instanceof Uint8Array))throw Error('INVALID_BODY');
  length+=item.value.byteLength;
  if(length>max){await reader.cancel();throw Error('TOO_LARGE');}
  parts.push(Buffer.from(item.value));
 }
 return Buffer.concat(parts,length);
}
function assetMetadata(req){
 const encoded=req.headers.get('X-LDB-Asset-Info')||'';
 if(!/^[a-zA-Z0-9_-]{1,1200}$/.test(encoded))throw Error('INVALID_METADATA');
 let meta;
 try{meta=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));}catch{throw Error('INVALID_METADATA');}
 if(!meta||typeof meta!=='object'||Array.isArray(meta)||
    Object.keys(meta).sort().join(',')!=='bytes,key,mimeType,name,parentId,sha256'||
    !isHash(meta.key)||!ALLOWED.has(meta.mimeType)||typeof meta.name!=='string'||!meta.name.trim()||
    meta.name.length>180||/[\x00-\x1f/\\]/.test(meta.name)||
    (meta.parentId!==null&&!isId(meta.parentId))||
    !Number.isSafeInteger(meta.bytes)||meta.bytes<0||meta.bytes>8_000_000)throw Error('INVALID_METADATA');
 if(meta.mimeType===FOLDER?(meta.bytes!==0||meta.sha256!==null):
    (meta.bytes<1||!isHash(meta.sha256)))throw Error('INVALID_METADATA');
 return meta;
}
export async function handleVaultDeliveryBridge(req,{enabled=false,secret,createBackend}={}){
 const path=new URL(req.url).pathname;
 if(!isDeliveryBridgePath(path))return json({status:'NOT_FOUND'},404);
 if(!enabled||typeof secret!=='string'||secret.length<32||typeof createBackend!=='function')return json({status:'SETUP_REQUIRED'},503);
 const auth=req.headers.get('Authorization')||'';
 if(!timingSafeEqual(hash(auth),hash('Bearer '+secret)))return json({status:'UNAUTHORIZED'},401);
 if(path==='/internal/drive/capacity'&&req.method!=='GET'||path==='/internal/drive/put'&&req.method!=='POST')return json({status:'METHOD_NOT_ALLOWED'},405);
 try{
  const backend=createBackend();
  if(path==='/internal/drive/capacity'){
   const cap=await backend.capacity();
   if(typeof cap.unlimited!=='boolean'||(!cap.unlimited&&!/^[0-9]+$/.test(cap.remaining||'')))throw Error('BAD_CAPACITY');
   return json({unlimited:cap.unlimited,remaining:cap.unlimited?null:cap.remaining});
  }
  const meta=assetMetadata(req);
  if(meta.mimeType!==FOLDER&&req.headers.get('Content-Type')!=='application/octet-stream')return json({status:'INVALID_BODY'},415);
  const body=await readBounded(req,8_000_000);
  if(body.length!==meta.bytes||(meta.mimeType!==FOLDER&&sha(body)!==meta.sha256))return json({status:'ASSET_INTEGRITY_FAILED'},422);
  const result=await backend.drive.put({key:meta.key,name:meta.name,parentId:meta.parentId,mimeType:meta.mimeType,bytes:meta.mimeType===FOLDER?null:body});
  if(result?.status!=='VERIFIED'||!isId(result.id)||result.sha256!==meta.sha256)throw Error('BAD_VERIFICATION');
  return json({status:'VERIFIED',id:result.id,sha256:meta.sha256});
 }catch{return json({status:'DELIVERY_OPERATION_FAILED'},502);}
}
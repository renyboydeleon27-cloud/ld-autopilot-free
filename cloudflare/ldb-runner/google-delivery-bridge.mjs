// Private Cloudflare service-binding client. It never requests OAuth tokens.
// This bridge is inert unless explicitly enabled and provisioned with a distinct
// service secret. Only the trusted backend coordinator may call this module.
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
const sha256=b=>createHash('sha256').update(b).digest('hex');
const fail=()=>{throw Error('DELIVERY_BRIDGE_UNAVAILABLE');};
const isId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(x);
const isHash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const FOLDER='application/vnd.google-apps.folder';
const ALLOWED=new Set([FOLDER,'image/png','image/jpeg','text/plain','application/json']);

export function createGoogleDeliveryBridge(env){
 if(env?.DELIVERY_BRIDGE_ENABLED!=='true'||!env.GOOGLE_VAULT||typeof env.GOOGLE_VAULT.fetch!=='function'||
    typeof env.GOOGLE_DELIVERY_BRIDGE_SECRET!=='string'||env.GOOGLE_DELIVERY_BRIDGE_SECRET.length<32)fail();
 const call=async(path,options={})=>{
  let response;
  try{response=await env.GOOGLE_VAULT.fetch('https://ldb-vault.internal'+path,{
   ...options,headers:{Authorization:'Bearer '+env.GOOGLE_DELIVERY_BRIDGE_SECRET,...options.headers}
  });}catch{fail();}
  if(!response?.ok)fail();
  let data;try{data=await response.json();}catch{fail();}
  if(!data||typeof data!=='object'||Array.isArray(data))fail();
  return data;
 };
 const sendAsset=async(mode,asset)=>{
  if(mode!=='put'&&mode!=='reconcile')fail();
  const {key,name,parentId=null,mimeType,bytes=null}=asset||{};
  const folder=mimeType===FOLDER;
  if(!isHash(key)||typeof name!=='string'||!name.trim()||name.length>180||/[\x00-\x1f/\\]/.test(name)||
    !ALLOWED.has(mimeType)||(parentId!==null&&!isId(parentId))||
    (folder&&bytes!==null)||(!folder&&(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>8_000_000)))fail();
  const length=folder?0:bytes.byteLength;
  const digest=folder?null:sha256(bytes);
  const metadata={key,name,parentId,mimeType,bytes:length,sha256:digest};
  const encoded=Buffer.from(JSON.stringify(metadata)).toString('base64url');
  if(encoded.length>1200)fail();
  const data=await call('/internal/drive/'+mode,{method:'POST',headers:{'X-LDB-Asset-Info':encoded,
    ...(!folder?{'Content-Type':'application/octet-stream'}:{})},...(!folder?{body:bytes}:{})});
  if(data.status!=='VERIFIED'||!isId(data.id)||data.sha256!==digest)fail();
  return {status:'VERIFIED',id:data.id,sha256:digest,bytes:length};
 };
 const drive=Object.freeze({
  put:asset=>sendAsset('put',asset),
  reconcile:asset=>sendAsset('reconcile',asset)
 });
 return Object.freeze({drive,notifyMilestone:async(state,percent)=>{
  if(!isHash(state?.jobId)||![30,50,70,100].includes(percent))fail();
  const body=JSON.stringify({state,percent});
  if(Buffer.byteLength(body)>64000)fail();
  const result=await call('/internal/gmail/milestone',{method:'POST',headers:{'Content-Type':'application/json'},body});
  if(!['SENT','UNCERTAIN','CLAIMED'].includes(result.status))fail();
  return result;
 },capacity:async()=>{
  const cap=await call('/internal/drive/capacity');
  if(typeof cap.unlimited!=='boolean'||(cap.unlimited!==true&&(!/^[0-9]+$/.test(cap.remaining||''))))fail();
  return {unlimited:cap.unlimited,remaining:cap.unlimited?null:cap.remaining};
 }});
}

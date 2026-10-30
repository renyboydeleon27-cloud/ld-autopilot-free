// Internal server-side adapters. Never expose credentials or these methods to browsers.
import {createHash,randomBytes} from 'node:crypto';
const DRIVE='https://www.googleapis.com/drive/v3/files';
const FOLDER='application/vnd.google-apps.folder';
const fields='id,name,mimeType,parents,trashed,size,md5Checksum,sha256Checksum,appProperties';
const digest=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
const fail=code=>{throw Error(code);};
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(id);
const jsonHeaders=token=>({Authorization:`Bearer ${token}`,'Content-Type':'application/json'});
export class DriveDelivery {
 constructor(storage,{tokenProvider,fetcher=fetch}){this.s=storage;this.tokenProvider=tokenProvider;this.fetcher=fetcher;}
 async request(url,options={}){
  try{return await this.fetcher(url,{...options,redirect:'error',signal:AbortSignal.timeout(20000)});}catch{fail('DRIVE_REQUEST_UNCERTAIN');}
 }
 async inspect(id,token){
  const response=await this.request(`${DRIVE}/${encodeURIComponent(id)}?fields=${fields}`,{headers:{Authorization:`Bearer ${token}`}});
  if(response.status===404)return null;
  if(!response.ok)fail('DRIVE_VERIFY_UNAVAILABLE');
  try{return await response.json();}catch{fail('DRIVE_VERIFY_UNAVAILABLE');}
 }
 matches(remote,plan){
  return remote?.id===plan.id&&remote.trashed===false&&remote.name===plan.name&&remote.mimeType===plan.mimeType&&
   (!plan.parentId||remote.parents?.length===1&&remote.parents[0]===plan.parentId)&&
   remote.appProperties?.ldbKey===plan.key&&
   (plan.mimeType===FOLDER||String(remote.size)===String(plan.bytes)&&remote.md5Checksum===plan.md5&&remote.sha256Checksum===plan.sha256);
 }
 async put({key,name,parentId=null,mimeType,bytes=null}){
  if(!/^[a-f0-9]{64}$/.test(key||'')||typeof name!=='string'||!name.trim()||name.length>180||/[\x00-\x1f/\\]/.test(name)||parentId!==null&&!validId(parentId))fail('INVALID_DELIVERY_ASSET');
  const folder=mimeType===FOLDER;
  if(!folder&&!['image/png','image/jpeg','text/plain','application/json'].includes(mimeType))fail('UNSUPPORTED_DELIVERY_TYPE');
  if(folder&&bytes!==null||!folder&&(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>8_000_000))fail('INVALID_DELIVERY_BYTES');
  const base={key,name,parentId,mimeType,bytes:bytes?.length||0,sha256:bytes?digest(bytes):null,md5:bytes?digest(bytes,'md5'):null};
  const fingerprint=digest(JSON.stringify(base)),storageKey='drive:'+key;
  const token=await this.tokenProvider();
  let record=await this.s.get(storageKey);
  if(!record){
   const response=await this.request(DRIVE+'/generateIds?count=1&space=drive&type=files',{headers:{Authorization:`Bearer ${token}`}});
   if(!response.ok)fail('DRIVE_ID_UNAVAILABLE');
   let ids;try{ids=(await response.json()).ids;}catch{fail('DRIVE_ID_UNAVAILABLE');}
   if(!Array.isArray(ids)||ids.length!==1||!validId(ids[0]))fail('DRIVE_ID_UNAVAILABLE');
   // Concurrent callers may allocate unused IDs, but only the persisted ID is used.
   record=await this.s.transaction(async tx=>{const old=await tx.get(storageKey);if(old)return old;const value={...base,id:ids[0],fingerprint,attempts:0,status:'RESERVED'};await tx.put(storageKey,value);return value;});
  }
  if(record.fingerprint!==fingerprint)fail('DELIVERY_ASSET_CHANGED');
  let remote=await this.inspect(record.id,token);
  if(remote&&!this.matches(remote,record))fail('DRIVE_CONTENT_MISMATCH');
  if(!remote){
   record=await this.s.transaction(async tx=>{const old=await tx.get(storageKey);if(old.attempts>=3)fail('DRIVE_RETRY_LIMIT');const value={...old,attempts:old.attempts+1,status:'UPLOADING'};await tx.put(storageKey,value);return value;});
   const metadata={id:record.id,name,mimeType,appProperties:{ldbKey:key},...(parentId?{parents:[parentId]}:{})};
   let url=DRIVE,body=JSON.stringify(metadata),headers=jsonHeaders(token);
   if(!folder){
    const boundary='ldb_'+randomBytes(18).toString('hex');
    body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),bytes,Buffer.from(`\r\n--${boundary}--\r\n`)]);
    headers={'Authorization':`Bearer ${token}`,'Content-Type':`multipart/related; boundary=${boundary}`};
    url='https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
   }
   // Pre-generated IDs make an ambiguous POST safe to reconcile/retry. Never PATCH/delete.
   try{const response=await this.request(url,{method:'POST',headers,body});if(!response.ok&&response.status!==409)fail('DRIVE_CREATE_UNCONFIRMED');}catch{/* Verify the persisted ID before deciding whether another attempt is needed. */}
   remote=await this.inspect(record.id,token);
   if(!remote)fail('DRIVE_UPLOAD_UNCONFIRMED');
   if(!this.matches(remote,record))fail('DRIVE_CONTENT_MISMATCH');
  }
  const verified={...record,status:'VERIFIED'};await this.s.put(storageKey,verified);
  return {id:record.id,status:'VERIFIED',sha256:record.sha256,bytes:record.bytes};
 }
}
export const SENDER='renyboydeleon27@gmail.com';
export const RECIPIENT='dkael1250@gmail.com';
const SCENES=['HOOK',...Array.from({length:14},(_,i)=>`P${i+1}`),'ENDING','THUMBNAIL'];
export function eligibleMilestones(state){
 if(!state||!/^[a-f0-9]{64}$/.test(state.jobId||'')||state.approvalVerified!==true||state.stopped||state.blocked)return [];
 const outputs=state.images||[];
 const ids=new Set(outputs.filter(x=>SCENES.includes(x.scene)&&/^[a-f0-9]{64}$/.test(x.sha256||'')&&Number.isSafeInteger(x.bytes)&&x.bytes>0).map(x=>x.scene));
 const result=[];
 if(ids.size>=6)result.push(30);
 if(ids.size>=12)result.push(50);
 const quality=ids.size===17&&outputs.length===17&&outputs.every(x=>x.visualAudit==='PASS')&&state.flowCount===16&&state.narrationCount===16&&state.imagePromptCount===17;
 if(quality)result.push(70);
 const expected=state.expectedDeliverables;
 const verified=new Map((state.driveVerified||[]).filter(x=>x.status==='VERIFIED').map(x=>[x.key,x.sha256]));
 if(quality&&Array.isArray(expected)&&expected.length>=68&&new Set(expected.map(x=>x.key)).size===expected.length&&expected.every(x=>/^[a-f0-9]{64}$/.test(x.sha256||'')&&verified.get(x.key)===x.sha256))result.push(100);
 return result;
}
export class GmailMilestones {
 constructor(storage,{tokenProvider,loadState,fetcher=fetch}){this.s=storage;this.tokenProvider=tokenProvider;this.loadState=loadState;this.fetcher=fetcher;}
 async send(percent){
  if(![30,50,70,100].includes(percent))fail('INVALID_MILESTONE');
  // loadState must be a trusted durable production snapshot, never HTTP input.
  const state=await this.loadState();
  if(!eligibleMilestones(state).includes(percent))fail('MILESTONE_NOT_REACHED');
  const key=`gmail:${state.jobId}:${percent}`;
  const prior=await this.s.get(key);if(prior)return {status:prior.status};
  const token=await this.tokenProvider();
  const claimed=await this.s.transaction(async tx=>{const old=await tx.get(key);if(old)return false;await tx.put(key,{status:'CLAIMED',percent});return true;});
  if(!claimed)return {status:(await this.s.get(key)).status};
  const explanation={30:'At least 6 actual scene images are saved.',50:'At least 12 actual scene images are saved.',70:'All 17 images passed quality review; prompts and narration are complete.',100:'All expected deliverables passed Google Drive checksum verification.'}[percent];
  const mime=[`From: ${SENDER}`,`To: ${RECIPIENT}`,`Subject: NER STUDIO production milestone ${percent}%`,`Message-ID: <ldb-${state.jobId}-${percent}@ld-autopilot-free.vercel.app>`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',Buffer.from(`NER STUDIO\nJob: ${state.jobId}\n${explanation}\nThis is a completed production stage, not a time estimate.\n`).toString('base64')].join('\r\n');
  let status='UNCERTAIN';
  try{
   const response=await this.fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',redirect:'error',headers:jsonHeaders(token),body:JSON.stringify({raw:Buffer.from(mime).toString('base64url')}),signal:AbortSignal.timeout(20000)});
   if(response.ok){const data=await response.json();if(typeof data.id==='string'&&data.id)status='SENT';}
  }catch{/* At-most-once submission: an ambiguous response must never auto-resend. */}
  await this.s.put(key,{status,percent});return {status};
 }
}

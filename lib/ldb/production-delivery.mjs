// Trusted backend only. Never accept a delivery plan directly from a browser.
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const validHash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export const CATEGORIES=['Storyboard','Approved reference images','Image prompts','Flow video prompts','Narration','Thumbnail','Quality audit','Production manifest'];
// A distinct, trusted episode title is the actual Google Drive folder name.
// Support international historical-event titles, but forbid path separators,
// controls and traversal-like names. No folder is ever created from invalid input.
export function validateEpisodeName(name){
 if(typeof name!=='string'||name.length<1||name.length>120||
    name.trim()!==name||name.includes('..')||
    !/^[\p{L}\p{N}][\p{L}\p{N} .,'’()–—:-]*$/u.test(name))
  throw Error('INVALID_EPISODE_NAME');
 return name;
}
export async function storageCapacity(tokenProvider,fetcher=(...a)=>globalThis.fetch(...a)){
 const token=await tokenProvider();let r,d;
 try{r=await fetcher('https://www.googleapis.com/drive/v3/about?fields=storageQuota',{headers:{Authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();d=(await r.json()).storageQuota;}catch{throw Error('STORAGE_CHECK_UNAVAILABLE');}
 if(!d||!/^\d+$/.test(d.usage||''))throw Error('STORAGE_CHECK_INVALID');
 if(d.limit===undefined)return {remaining:null,unlimited:true};
 if(!/^\d+$/.test(d.limit))throw Error('STORAGE_CHECK_INVALID');
 const free=BigInt(d.limit)-BigInt(d.usage);return {remaining:(free>0n?free:0n).toString(),unlimited:false};
}
export function validateDeliveryPlan(p){
 if(!p||!validHash(p.jobId)||p.approvalVerified!==true||p.visualAudit!=='PASS'||!Array.isArray(p.assets))throw Error('DELIVERY_NOT_APPROVED');
 validateEpisodeName(p.episode);
 const counts={};const names=new Set(),keys=new Set();
 for(const a of p.assets){
  if(!CATEGORIES.includes(a.category)||!validHash(a.key)||!validHash(a.sha256)||!Number.isSafeInteger(a.bytes)||a.bytes<1||a.bytes>8000000||typeof a.name!=='string'||!a.name.trim()||a.name.length>180||/[\x00-\x1f/\\]/.test(a.name)||!['image/png','image/jpeg','text/plain','application/json'].includes(a.mimeType))throw Error('INVALID_DELIVERY_PLAN');
  const image=['Approved reference images','Thumbnail'].includes(a.category);if(image!==a.mimeType.startsWith('image/'))throw Error('INVALID_DELIVERY_TYPE');
  const path=a.category+'/'+a.name;if(names.has(path)||keys.has(a.key))throw Error('DUPLICATE_DELIVERY_ASSET');names.add(path);keys.add(a.key);counts[a.category]=(counts[a.category]||0)+1;
 }
 for(const [c,n] of Object.entries({'Storyboard':1,'Approved reference images':16,'Image prompts':17,'Flow video prompts':16,'Narration':16,'Thumbnail':1,'Quality audit':1,'Production manifest':1}))if(counts[c]!==n)throw Error('INCOMPLETE_DELIVERY_PLAN');
 const scenes=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
 for(const [category,expected] of [['Approved reference images',scenes],['Image prompts',[...scenes,'THUMBNAIL']],['Flow video prompts',scenes],['Narration',scenes],['Thumbnail',['THUMBNAIL']]]){
  const found=p.assets.filter(a=>a.category===category).map(a=>a.scene);
  if(new Set(found).size!==expected.length||expected.some(x=>!found.includes(x)))throw Error('INCOMPLETE_SCENE_DELIVERY');
 }
 return hash(JSON.stringify(p));
}
// Recheck durable state before EVERY provider call, not only at submit.
const CHECKPOINT_STATES=new Set(['QUEUED','UPLOADING','RETRY_WAIT',
 'WAITING_STORAGE','STOPPED','NEEDS_REVIEW','COMPLETE']);
const REMOTE_ID=/^[A-Za-z0-9_-]{1,200}$/;
export function assertDeliveryCheckpointIntegrity(j){
 const fail=()=>{throw Error('DELIVERY_CHECKPOINT_INTEGRITY_FAILED')};
 if(!j||typeof j!=='object'||Array.isArray(j))fail();
 let fingerprint;try{fingerprint=validateDeliveryPlan(j.plan)}catch{fail()}
 const assets=j.plan.assets;
 if(j.fingerprint!==fingerprint||!CHECKPOINT_STATES.has(j.status)||
    typeof j.stopped!=='boolean'||!Number.isSafeInteger(j.index)||
    j.index<0||j.index>assets.length||!Array.isArray(j.verified)||
    j.verified.length!==j.index)fail();
 if((j.status==='COMPLETE')!==(j.index===assets.length))fail();
 if(j.status==='STOPPED'&&!j.stopped)fail();
 if(j.stopped&&!['UPLOADING','STOPPED','COMPLETE','NEEDS_REVIEW'].includes(j.status))fail();
 if(!j.attempts||typeof j.attempts!=='object'||Array.isArray(j.attempts))fail();
 for(const [key,count] of Object.entries(j.attempts)){
  if(!/^(0|[1-9][0-9]*)$/.test(key)||
     !Number.isSafeInteger(Number(key))||Number(key)>=assets.length||
     !Number.isSafeInteger(count)||count<0||count>3)fail();
 }
 const ids=new Set();
 for(let i=0;i<j.index;i++){
  const record=j.verified[i],asset=assets[i];
  if(!record||record.status!=='VERIFIED'||record.key!==asset.key||
     record.sha256!==asset.sha256||typeof record.id!=='string'||
     !REMOTE_ID.test(record.id)||ids.has(record.id))fail();
  ids.add(record.id);
 }
 return true;
}

export class ProductionDelivery{
 constructor(storage,{drive,capacity,readAsset,now=Date.now,queueGuard}={}){this.s=storage;this.drive=drive;this.capacity=capacity;this.readAsset=readAsset;this.now=now;if(queueGuard!==undefined&&typeof queueGuard!=='function')throw Error('INVALID_DELIVERY_QUEUE_GUARD');this.queueGuard=queueGuard;}
 async submit(plan){
  // Take a private immutable snapshot BEFORE the first async boundary.
  // Caller mutations during an awaited queue guard must never change the
  // validated asset names, checksums, scene list or stored fingerprint.
  let snapshot;
  try{snapshot=structuredClone(plan);}catch{throw Error('INVALID_DELIVERY_PLAN');}
  const fingerprint=validateDeliveryPlan(snapshot);
  for(const asset of snapshot.assets)Object.freeze(asset);
  Object.freeze(snapshot.assets);Object.freeze(snapshot);
  return this.s.transaction(async tx=>{
   if(this.queueGuard)await this.queueGuard(tx,snapshot);
   const old=await tx.get('delivery');
   if(old){if(old.fingerprint!==fingerprint)throw Error('DELIVERY_PLAN_CHANGED');return old;}
   const j={plan:snapshot,fingerprint,index:0,status:'QUEUED',stopped:false,
    verified:[],folders:{},attempts:{}};
   await tx.put('delivery',j);await tx.setAlarm(this.now()+1000);
   return j;
  });
 }
 async stop(){await this.s.transaction(async tx=>{const j=await tx.get('delivery');if(!j)throw Error('NO_DELIVERY');j.stopped=true;if(!['UPLOADING','COMPLETE','NEEDS_REVIEW'].includes(j.status))j.status='STOPPED';await tx.put('delivery',j);await tx.deleteAlarm();});}
 async resume(){await this.s.transaction(async tx=>{const j=await tx.get('delivery');if(!j||!['STOPPED','WAITING_STORAGE','RETRY_WAIT'].includes(j.status))throw Error('RESUME_NOT_SAFE');assertDeliveryCheckpointIntegrity(j);j.stopped=false;j.status='QUEUED';await tx.put('delivery',j);await tx.setAlarm(this.now()+1000);});}
 async tick(){if(this.running)return this.running;this.running=this.runTick();try{return await this.running;}finally{this.running=null;}}
 async runTick(){
 const j=await this.s.transaction(async tx=>{
  const j=await tx.get('delivery');if(!j)return null;
  try{assertDeliveryCheckpointIntegrity(j)}catch{
   j.status='NEEDS_REVIEW';j.stopped=true;
   j.error='DELIVERY_CHECKPOINT_INTEGRITY_FAILED';
   await tx.put('delivery',j);await tx.deleteAlarm();return null;
  }
  if(j.stopped||['COMPLETE','NEEDS_REVIEW','WAITING_STORAGE'].includes(j.status))return null;
 // A crash is reconciled by DriveDelivery's persisted file ID. Only one tick per object.
 if((j.attempts[j.index]||0)>=3){j.status='NEEDS_REVIEW';await tx.put('delivery',j);return null;}j.attempts[j.index]=(j.attempts[j.index]||0)+1;j.status='UPLOADING';await tx.put('delivery',j);return structuredClone(j);});if(!j)return;
 try{
 const cap=await this.capacity(),remaining=j.plan.assets.slice(j.index).reduce((n,a)=>n+BigInt(a.bytes),0n);
 if(!cap.unlimited&&(cap.remaining===null||BigInt(cap.remaining)<remaining+1048576n)){await this.finish(j,{status:'WAITING_STORAGE',error:'INSUFFICIENT_DRIVE_STORAGE'});return;}
 const folder=async(name,parentId=null)=>this.drive.put({key:hash('folder:'+j.plan.jobId+':'+name),name,parentId,mimeType:'application/vnd.google-apps.folder'});
 const root=await folder('Living Disaster Book'),episode=await folder(j.plan.episode,root.id),asset=j.plan.assets[j.index],category=await folder(asset.category,episode.id);
 const bytes=await this.readAsset(asset);
 if(!Buffer.isBuffer(bytes)||bytes.length!==asset.bytes||hash(bytes)!==asset.sha256)throw Error('ASSET_INTEGRITY_FAILED');
 const result=await this.drive.put({...asset,bytes,parentId:category.id});
 if(result?.status!=='VERIFIED'||result.sha256!==asset.sha256||typeof result.id!=='string'||!/^[A-Za-z0-9_-]{1,200}$/.test(result.id)||j.verified.some(v=>v.id===result.id))throw Error('DELIVERY_VERIFY_FAILED');
 await this.s.transaction(async tx=>{const current=await tx.get('delivery');assertDeliveryCheckpointIntegrity(current);if(current.fingerprint!==j.fingerprint||current.index!==j.index)throw Error('DELIVERY_CLAIM_CHANGED');current.verified.push({key:asset.key,sha256:result.sha256,id:result.id,status:'VERIFIED'});current.index++;current.folderId=episode.id;current.status=current.index===current.plan.assets.length?'COMPLETE':current.stopped?'STOPPED':'QUEUED';delete current.error;await tx.put('delivery',current);if(current.status==='QUEUED')await tx.setAlarm(this.now()+1000);});
 }catch(e){const fatal=['ASSET_INTEGRITY_FAILED','PREPARED_IMAGE_INTEGRITY_FAILED','DELIVERY_VERIFY_FAILED','DELIVERY_ASSET_CHANGED','DRIVE_CONTENT_MISMATCH','DELIVERY_CHECKPOINT_INTEGRITY_FAILED'].includes(e.message);await this.finish(j,{status:fatal?'NEEDS_REVIEW':'RETRY_WAIT',error:fatal?e.message:'DELIVERY_RETRY_REQUIRED'});}
 }
 async finish(j,patch){await this.s.transaction(async tx=>{const c=await tx.get('delivery');if(c.fingerprint!==j.fingerprint||c.index!==j.index)return;Object.assign(c,patch);if(c.stopped&&c.status==='RETRY_WAIT')c.status='STOPPED';await tx.put('delivery',c);if(c.status==='RETRY_WAIT')await tx.setAlarm(this.now()+30000);});}
}

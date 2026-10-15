/* Same-origin audit coordination. Full payload comparison remains authoritative. */
(function(){'use strict';
const C=window.NERCore5,PREFIX='ner-core5-audit-v1:';
async function slot(project,payload){
 if(!navigator.locks?.request||!crypto.subtle)throw Error('This browser cannot safely coordinate audit requests across tabs. Use a browser with Web Locks support. No audit was sent.');
 const bytes=new TextEncoder().encode(project+'|'+payload.stage);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return PREFIX+Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
function read(key){const raw=localStorage.getItem(key);if(!raw)return null;try{const record=JSON.parse(raw);if(record.schema!==1)throw Error('version');return record;}catch{throw Error('Audit journal needs review before another request.');}}
function storageReason(error){
 const quota=error?.name==='QuotaExceededError'||error?.code===22||error?.code===1014;
 return quota?'Browser storage is full or its quota was reached. Export a project backup; do not clear site data.':'Browser storage is unavailable or blocked. Check browser storage permissions; do not clear site data.';
}
function storagePreflight(key){
 // Probe a separate temporary key. Never overwrite, delete, or reset an existing audit journal.
 const probe=key+':storage-probe';
 try{
  localStorage.setItem(probe,'ok');
  if(localStorage.getItem(probe)!=='ok')throw Error('Storage verification failed');
 }catch(error){throw Error('Audit not started — '+storageReason(error)+' No audit credits used by this attempt.');}
 finally{try{localStorage.removeItem(probe);}catch{}}
}
function save(key,record){try{localStorage.setItem(key,JSON.stringify(record));}catch(error){throw Error('Could not persist the audit journal. '+storageReason(error)+' No automatic retry is allowed.');}}
async function run(project,payload,audit){
 const check=C.validatePayload(payload);if(!check.ok)throw Error(check.issues.join(' '));
 const key=await slot(project,payload),identity=C.stable(payload);
 return navigator.locks.request(key,async()=>{
  const old=await window.NERCore5JournalStore.read(key);
  if(old?.identity===identity){
   if(old.status==='DONE')return old.result;
   throw Error('An earlier audit is incomplete or uncertain. Review it and explicitly allow a retry before spending more credits.');
  }
  await window.NERCore5JournalStore.preflight();
  await window.NERCore5JournalStore.save(key,{schema:1,identity,status:'STARTED'});
  let result;
  try{result=await audit(payload);}catch(error){await window.NERCore5JournalStore.save(key,{schema:1,identity,status:'UNCERTAIN'});throw error;}
  await window.NERCore5JournalStore.save(key,{schema:1,identity,status:'DONE',result});
  return result;
 });
}
async function reset(project,payload){
 const key=await slot(project,payload),identity=C.stable(payload);
 await navigator.locks.request(key,async()=>{const old=read(key);if(old?.identity!==identity)return;
  // A stale tab must not erase a conclusive verdict another tab already saved.
  if(old.status==='DONE'&&old.result?.ok===true){
   if(old.result.result==='NEEDS FIX'&&Array.isArray(old.result.issues))return;
   try{C.transaction(payload,old.result);return;}catch{}
  }
  await window.NERCore5JournalStore.remove(key);});
}
window.NERCore5AuditCoordinator=Object.freeze({run,reset});
})();

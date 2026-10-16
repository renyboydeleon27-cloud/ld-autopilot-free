/* Same-origin audit coordination. Full payload comparison remains authoritative. */
(function(){'use strict';
const C=window.NERCore5,PREFIX='ner-core5-audit-v1:';
async function slot(project,payload){
 if(!navigator.locks?.request||!crypto.subtle)throw Error('This browser cannot safely coordinate audit requests across tabs. Use a browser with Web Locks support. No audit was sent.');
 const bytes=new TextEncoder().encode(project+'|'+payload.stage);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return PREFIX+Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
function describe(payload,entry,key){
 const record=entry.record,match=!!record&&record.identity===C.stable(payload);
 let recoverable=false;
 if(record?.status==='DONE'&&match&&!entry.conflict){
  try{if(record.result?.ok===true&&record.result.result==='NEEDS FIX'&&Array.isArray(record.result.issues))recoverable=true;else{C.transaction(payload,record.result);recoverable=true;}}catch{}
 }
 return {key,stage:payload.stage,found:!!record,source:entry.source,status:record?.status||'NONE',identityMatch:match,recoverable,conflict:entry.conflict,busy:false};
}
async function inspect(project,payload){
 const key=await slot(project,payload);
 return navigator.locks.request(key,{ifAvailable:true},async lock=>{
  if(!lock)return {key,stage:payload.stage,found:null,source:'UNKNOWN',status:'BUSY',identityMatch:null,recoverable:false,conflict:false,busy:true};
  return describe(payload,await window.NERCore5JournalStore.inspect(key),key);
 });
}
async function recover(project,payload){
 const check=C.validatePayload(payload);if(!check.ok)throw Error(check.issues.join(' '));
 const key=await slot(project,payload);
 return navigator.locks.request(key,{ifAvailable:true},async lock=>{
  if(!lock)throw Error('Audit journal is busy in another tab. No request was sent.');
  const entry=await window.NERCore5JournalStore.inspect(key),d=describe(payload,entry,key);
  if(!d.recoverable)throw Error('No matching conclusive audit result can be recovered. Journal retained; no request was sent.');
  return entry.record.result;
 });
}
async function run(project,payload,audit){
 const check=C.validatePayload(payload);if(!check.ok)throw Error(check.issues.join(' '));
 const key=await slot(project,payload),identity=C.stable(payload);
 return navigator.locks.request(key,async()=>{
  const old=await window.NERCore5JournalStore.read(key);
  if(old){
   if(old.identity===identity && old.status==='DONE')return old.result;
   // A changed scene must not silently overwrite a previous paid or uncertain audit.
   // Keep the existing journal for explicit review, regardless of payload identity.
   throw Error('An earlier audit journal exists for this stage. Review or explicitly reset it before another paid request. No audit was sent.');
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
 await navigator.locks.request(key,async()=>{const old=await window.NERCore5JournalStore.read(key);if(old?.identity!==identity)return;
  // A stale tab must not erase a conclusive verdict another tab already saved.
  if(old.status==='DONE'&&old.result?.ok===true){
   if(old.result.result==='NEEDS FIX'&&Array.isArray(old.result.issues))return;
   try{C.transaction(payload,old.result);return;}catch{}
  }
  await window.NERCore5JournalStore.remove(key);});
}
window.NERCore5AuditCoordinator=Object.freeze({run,reset,inspect,recover});
})();

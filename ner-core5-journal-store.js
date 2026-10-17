/* Core 5 durable audit journal store. Legacy localStorage is read-only during migration. */
(function(){'use strict';
const DB='ner-core5-audit-journals',STORE='journals',PREFIX='ner-core5-audit-v1:';
let opening;
function database(){
 if(!('indexedDB' in window))return Promise.reject(Error('IndexedDB unavailable; audit blocked before API request.'));
 if(!opening)opening=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('IndexedDB open failed'));
  request.onblocked=()=>reject(Error('IndexedDB upgrade blocked by another tab'));
 }).catch(e=>{opening=null;throw e;});
 return opening;
}
async function operation(mode,action){
 const db=await database();
 return new Promise((resolve,reject)=>{
  let tx;try{tx=db.transaction(STORE,mode);}catch(e){reject(e);return;}
  let result=null,request;
  try{request=action(tx.objectStore(STORE));}catch(e){try{tx.abort();}catch{}reject(e);return;}
  request.onsuccess=()=>{result=request.result??null;};
  request.onerror=()=>reject(request.error||Error('IndexedDB request failed'));
  tx.oncomplete=()=>resolve(result);
  tx.onabort=()=>reject(tx.error||Error('IndexedDB transaction aborted'));
  tx.onerror=()=>reject(tx.error||Error('IndexedDB transaction failed'));
 });
}
function legacy(key){
 const raw=localStorage.getItem(key);
 if(raw===null)return null;
 try{const record=JSON.parse(raw);if(record.schema!==1)throw Error('Invalid schema');return record;}
 catch{throw Error('Legacy audit journal requires review; no request sent.');}
}
// Inspect both sources without migration, writes, deletion, or quota probes.
async function inspect(key){
 const old=legacy(key);
 let existing=null;
 // Avoid creating an empty database just to inspect it where enumeration is available.
 if(!indexedDB.databases)throw Error('Read-only journal enumeration is unavailable in this browser. No request was sent.');
 const databases=await indexedDB.databases();
 if(databases.some(db=>db.name===DB))existing=await operation('readonly',store=>store.get(key));
 const conflict=old!==null&&existing!==null&&JSON.stringify(old)!==JSON.stringify(existing);
 return {source:old?(existing?'legacy + IndexedDB':'legacy'):(existing?'IndexedDB':'NONE'),record:old||existing,conflict};
}
async function read(key){
 const old=legacy(key);
 if(old){
  // Copy first, verify durable commit, and retain the original for rollback.
  const existing=await operation('readonly',store=>store.get(key));
  if(existing!==null && JSON.stringify(existing)!==JSON.stringify(old))
   throw Error('Legacy and IndexedDB audit journals conflict; manual review required. No audit sent.');
  if(existing===null){
   await operation('readwrite',store=>store.put(old,key));
   const verified=await operation('readonly',store=>store.get(key));
   if(JSON.stringify(verified)!==JSON.stringify(old))
    throw Error('Legacy audit journal migration verification failed. No audit sent.');
  }
  return old;
 }
 return operation('readonly',store=>store.get(key));
}
async function save(key,record){
 // Legacy journal remains authoritative until separately reviewed.
 if(legacy(key))throw Error('Legacy audit journal exists; manual review required.');
 await operation('readwrite',store=>store.put(record,key));
 const confirmed=await operation('readonly',store=>store.get(key));
 if(JSON.stringify(confirmed)!==JSON.stringify(record))throw Error('Audit journal verification failed');
}
async function remove(key){
 if(legacy(key))throw Error('Legacy audit journal must be reviewed before reset.');
 await operation('readwrite',store=>store.delete(key));
}
// Called only under the coordinator's exclusive stage lock after explicit consent.
// Archive and removal of the active IndexedDB copy commit atomically. If legacy
// removal fails, its original remains authoritative and the next audit stays blocked.
async function archiveExact(key,expected,allowedStatuses,kind,errorMessage){
 const entry=await inspect(key),record=entry.record;
 if(entry.conflict||!record||JSON.stringify(record)!==JSON.stringify(expected)||!allowedStatuses.includes(record.status))throw Error(errorMessage);
 const oldRaw=localStorage.getItem(key),archiveKey=key+':archive:'+crypto.randomUUID();
 const archive={schema:1,kind,originalKey:key,archivedAt:new Date().toISOString(),record,legacyRaw:oldRaw,source:entry.source};
 const db=await database();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),get=store.get(key);
  get.onsuccess=()=>{
   if(get.result!=null&&JSON.stringify(get.result)!==JSON.stringify(expected)){tx.abort();return;}
   try{store.add(archive,archiveKey);store.delete(key);}catch{try{tx.abort();}catch{}}
  };
  tx.oncomplete=resolve;tx.onabort=()=>reject(Error('Archive transaction aborted; original journal retained.'));tx.onerror=()=>reject(tx.error||Error('Archive failed; no retry allowed.'));
 });
 const saved=await operation('readonly',store=>store.get(archiveKey));
 if(JSON.stringify(saved)!==JSON.stringify(archive))throw Error('Archive verification failed. No retry allowed.');
 if(localStorage.getItem(key)!==oldRaw)throw Error('Legacy journal changed during archiving. No retry allowed.');
 if(oldRaw!==null)localStorage.removeItem(key);
 if((await inspect(key)).record)throw Error('Active journal remains. No retry allowed.');
 return archiveKey;
}
async function archiveIncomplete(key,expected){
 return archiveExact(key,expected,['STARTED','UNCERTAIN'],'explicit-incomplete-archive','Journal changed or is not incomplete. Nothing was reset.');
}
async function archiveMismatchedDone(key,expected){
 return archiveExact(key,expected,['DONE'],'explicit-mismatched-done-archive','Journal changed or is not a conclusive stale result. Nothing was reset.');
}
async function preflight(){
 const key=PREFIX+'preflight-'+crypto.randomUUID();
 await operation('readwrite',store=>store.put({probe:true},key));
 await operation('readwrite',store=>store.delete(key));
}
window.NERCore5JournalStore=Object.freeze({read,inspect,save,remove,preflight,legacy,archiveIncomplete,archiveMismatchedDone});
})();
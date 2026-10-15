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
async function read(key){
 const old=legacy(key);
 if(old)return old;
 return operation('readonly',store=>store.get(key));
}
async function save(key,record){
 // Never overwrite an existing legacy record.
 if(legacy(key))throw Error('Legacy audit journal exists; manual review required.');
 await operation('readwrite',store=>store.put(record,key));
 const confirmed=await operation('readonly',store=>store.get(key));
 if(JSON.stringify(confirmed)!==JSON.stringify(record))throw Error('Audit journal verification failed');
}
async function remove(key){
 if(legacy(key))throw Error('Legacy audit journal must be reviewed before reset.');
 await operation('readwrite',store=>store.delete(key));
}
async function preflight(){
 const key=PREFIX+'preflight-'+crypto.randomUUID();
 await operation('readwrite',store=>store.put({probe:true},key));
 await operation('readwrite',store=>store.delete(key));
}
window.NERCore5JournalStore=Object.freeze({read,save,remove,preflight,legacy});
})();
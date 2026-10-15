/* Core5 audit journal migration regression tests; no provider calls. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','ner-core5-journal-store.js'),'utf8');
function harness({legacyRecord,existingRecord,failPut=false}={}){
 const key='ner-core5-audit-v1:sample', records=new Map();
 if(existingRecord)records.set(key,existingRecord);
 const local=new Map(legacyRecord?[ [key,JSON.stringify(legacyRecord)] ]:[]);
 const localStorage={getItem:k=>local.get(k)??null};
 const indexedDB={open:()=>{const request={};queueMicrotask(()=>{const db={
  objectStoreNames:{contains:()=>true},
  transaction:(_store,mode)=>{const tx={error:null,objectStore:()=>({
   get:k=>makeRequest(()=>records.get(k)??null),
   put:(value,k)=>makeRequest(()=>{if(failPut)throw Error('QuotaExceededError');records.set(k,value);return k;}),
   delete:k=>makeRequest(()=>{records.delete(k);return undefined;})
  })};function makeRequest(fn){const r={};queueMicrotask(()=>{try{r.result=fn();r.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.());}catch(e){r.error=e;r.onerror?.();tx.error=e;queueMicrotask(()=>tx.onabort?.());}});return r;}return tx;}
 };request.result=db;request.onsuccess?.();});return request;}};
 const window={indexedDB,NERCore5JournalStore:null},ctx={window,indexedDB,localStorage,crypto:{randomUUID:()=> 'test'},console};
 vm.runInNewContext(source,ctx);
 return {store:window.NERCore5JournalStore,records,local,key};
}
test('legacy STARTED journal is copied and original retained',async()=>{
 const old={schema:1,identity:'abc',status:'STARTED'},h=harness({legacyRecord:old});
 assert.equal((await h.store.read(h.key)).status,'STARTED');
 assert.equal(h.records.get(h.key).status,'STARTED');
 assert.equal(JSON.parse(h.local.get(h.key)).status,'STARTED');
 await assert.rejects(h.store.save(h.key,{...old,status:'DONE'}),/Legacy audit journal/);
});
test('matching migrated journal remains stable',async()=>{
 const old={schema:1,identity:'abc',status:'UNCERTAIN'},h=harness({legacyRecord:old,existingRecord:old});
 assert.equal((await h.store.read(h.key)).status,'UNCERTAIN');
});
test('conflicting legacy and IndexedDB records block migration',async()=>{
 const old={schema:1,identity:'abc',status:'STARTED'},newer={...old,status:'DONE'},h=harness({legacyRecord:old,existingRecord:newer});
 await assert.rejects(h.store.read(h.key),/conflict/);
 assert.equal(h.records.get(h.key).status,'DONE');
});
test('failed migration retains original record',async()=>{
 const old={schema:1,identity:'abc',status:'STARTED'},h=harness({legacyRecord:old,failPut:true});
 await assert.rejects(h.store.read(h.key));
 assert.equal(JSON.parse(h.local.get(h.key)).status,'STARTED');
});

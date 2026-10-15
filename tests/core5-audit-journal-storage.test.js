/* Offline browser audit-journal regression: no paid API calls, no project mutations. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../ner-core-5-audit-coordinator.js'),'utf8');
const payload={stage:'P3'};
const identity=JSON.stringify(payload);
const entries=new Map();
let audits=0,failPreflight=false;
const store={
 async read(key){return entries.get(key)??null;},
 async preflight(){
  if(failPreflight)throw Error('Audit not started. Browser storage is full. No audit credits used.');
 },
 async save(key,record){entries.set(key,record);},
 async remove(key){entries.delete(key);}
};
const crypto=require('node:crypto').webcrypto;
const context={
 window:{NERCore5:{validatePayload:()=>({ok:true}),stable:()=>identity},NERCore5JournalStore:store},
 navigator:{locks:{request:async(_key,fn)=>fn()}},
 crypto,TextEncoder,Uint8Array,Array,Error
};
vm.runInNewContext(source,context);
const coordinator=context.window.NERCore5AuditCoordinator;
(async()=>{
 failPreflight=true;
 await assert.rejects(coordinator.run('project',payload,async()=>{audits++;return {ok:true};}),/Audit not started.*Browser storage is full.*No audit credits used/);
 assert.equal(audits,0,'never invoke paid audit when journal preflight fails');
 assert.equal(entries.size,0,'no journal or project mutation when preflight fails');
 failPreflight=false;
 const result=await coordinator.run('project',payload,async()=>{audits++;return {ok:true};});
 assert.equal(result.ok,true);
 assert.equal(audits,1);
 assert.equal(entries.size,1,'one durable journal entry is retained');
 const cached=await coordinator.run('project',payload,async()=>{audits++;throw Error('duplicate paid call');});
 assert.equal(cached.ok,true);
 assert.equal(audits,1,'completed journal prevents duplicate paid calls');
 console.log('Core 5 journal preflight and deduplication passed (offline, no API credits).');
})().catch(e=>{console.error(e);process.exitCode=1;});

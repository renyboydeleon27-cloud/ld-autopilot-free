/* Paid audit duplicate protection tests; mock-only, zero provider calls. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'..','ner-core-5-audit-coordinator.js'),'utf8');
function harness(initial=null){
 const entries=new Map(),pending=new Map();let calls=0;
 const locks={request:async(key,fn)=>{
  const previous=pending.get(key)||Promise.resolve();
  let release;const next=new Promise(resolve=>release=resolve);
  pending.set(key,previous.then(()=>next));await previous;
  try{return await fn();}finally{release();}
 }};
 const journal={
  read:async k=>entries.get(k)||null,
  preflight:async()=>{},
  save:async(k,v)=>{entries.set(k,structuredClone(v));},
  remove:async k=>{entries.delete(k);}
 };
 const C={validatePayload:()=>({ok:true}),stable:p=>JSON.stringify(p),transaction:()=>{}};
 const window={NERCore5:C,NERCore5JournalStore:journal};
 const ctx={window,navigator:{locks},crypto:{subtle:crypto.webcrypto.subtle},TextEncoder,Uint8Array};
 vm.runInNewContext(source,ctx);
 const project='Great Smog',payload={stage:'P3',scene:'one'};
 const audit=async()=>{calls++;await new Promise(r=>setTimeout(r,10));return {ok:true,result:'PASS'};};
 return {api:window.NERCore5AuditCoordinator,entries,payload,project,audit,getCalls:()=>calls,initial};
}
test('simultaneous identical audits call paid provider once',async()=>{
 const h=harness();
 const [a,b]=await Promise.all([h.api.run(h.project,h.payload,h.audit),h.api.run(h.project,h.payload,h.audit)]);
 assert.equal(h.getCalls(),1);assert.equal(a.result,'PASS');assert.equal(b.result,'PASS');
});
test('changed payload cannot replace existing DONE journal without review',async()=>{
 const h=harness();await h.api.run(h.project,h.payload,h.audit);
 await assert.rejects(h.api.run(h.project,{stage:'P3',scene:'two'},h.audit),/journal exists/);
 assert.equal(h.getCalls(),1);
});
test('uncertain audit prevents changed-payload paid retry',async()=>{
 const h=harness();
 await assert.rejects(h.api.run(h.project,h.payload,async()=>{throw Error('network timeout')}),/network timeout/);
 await assert.rejects(h.api.run(h.project,{stage:'P3',scene:'two'},h.audit),/journal exists/);
 assert.equal(h.getCalls(),0);
});

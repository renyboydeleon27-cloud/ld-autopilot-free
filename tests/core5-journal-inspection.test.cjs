const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto').webcrypto;
const C=require('../ner-core-5');
const payload=C.payload(C.plan({scope:'project',topic:'Great Smog — London — 1952',stage:'P3',narration:'Above the rooftops, warmer air trapped colder air below. With little wind, the smoke could no longer disperse into the sky.',eventYear:1952,location:'London, England'}));
function boot(record,{source='IndexedDB',conflict=false,busy=false}={}){
 let calls=0,reads=[];
 const archive=(k,expected)=>{assert.deepEqual(record,expected);record=null;return k+':archive:test';};
 const store={archiveIncomplete:async(k,expected)=>archive(k,expected),archiveMismatchedDone:async(k,expected)=>archive(k,expected),inspect:async k=>{reads.push(k);return {record,source:record?source:'NONE',conflict};},read:async k=>{reads.push(k);return record;},save:async()=>{throw Error('unexpected write');},preflight:async()=>{throw Error('unexpected probe');}};
 const window={NERCore5:C,NERCore5JournalStore:store};
 const navigator={locks:{request:async(k,options,fn)=>(fn||options)(busy?null:{name:k})}};
 vm.runInNewContext(fs.readFileSync('ner-core-5-audit-coordinator.js','utf8'),{window,navigator,crypto,TextEncoder});
 return {a:window.NERCore5AuditCoordinator,reads,audit:()=>{calls++;},calls:()=>calls};
}
for(const status of ['STARTED','UNCERTAIN','DONE'])test('inspection reports '+status+' and same stage key as paid guard',async()=>{
 const record={schema:1,identity:C.stable(payload),status,result:{ok:true,result:'PASS',issues:[]}},b=boot(record),d=await b.a.inspect('project',payload);
 assert.equal(d.found,true);assert.equal(d.status,status);assert.equal(d.identityMatch,true);assert.equal(d.recoverable,status==='DONE');
 if(status==='DONE'){assert.deepEqual(await b.a.recover('project',payload),record.result);await b.a.run('project',payload,b.audit);}else {await assert.rejects(b.a.recover('project',payload));await assert.rejects(b.a.run('project',payload,b.audit));}
 assert(b.reads.every(k=>k===d.key));assert.equal(b.calls(),0);
});
test('different payload, legacy conflicts, invalid results and busy locks cannot recover',async()=>{
 for(const [record,options] of [[{schema:1,identity:'other',status:'DONE',result:{ok:true,result:'PASS',issues:[]}},{ }],[{schema:1,identity:C.stable(payload),status:'DONE',result:{ok:true,result:'PASS',issues:[]}},{source:'legacy + IndexedDB',conflict:true}],[{schema:1,identity:C.stable(payload),status:'DONE',result:{}},{}],[null,{busy:true}]]){
 const b=boot(record,options);assert.equal((await b.a.inspect('project',payload)).recoverable,false);await assert.rejects(b.a.recover('project',payload));assert.equal(b.calls(),0);
 }
});
test('matching legacy DONE NEEDS FIX is recoverable for review, not approval',async()=>{
 const record={schema:1,identity:C.stable(payload),status:'DONE',result:{ok:true,result:'NEEDS FIX',issues:['Review camera']}},b=boot(record,{source:'legacy'});
 assert.equal((await b.a.inspect('project',payload)).source,'legacy');assert.deepEqual(await b.a.recover('project',payload),record.result);
});
test('archive rejects changed identity, conclusive records, conflicts, stale consent and active locks',async()=>{
 for(const [record,options,token,current] of [
  [{schema:1,identity:'other',status:'STARTED'},{},null,true],
  [{schema:1,identity:C.stable(payload),status:'DONE'},{},null,true],
  [{schema:1,identity:C.stable(payload),status:'STARTED'},{conflict:true},null,true],
  [{schema:1,identity:C.stable(payload),status:'STARTED'},{},'stale',true],
  [{schema:1,identity:C.stable(payload),status:'STARTED'},{},null,false],
  [null,{busy:true},null,true]
 ]){const b=boot(record,options);await assert.rejects(b.a.archiveIncomplete('project',payload,token||C.stable(record),()=>current));assert.equal(b.calls(),0);}
});

test('explicit matching STARTED and UNCERTAIN archives permit no repeated stale reset',async()=>{
 for(const status of ['STARTED','UNCERTAIN']){const b=boot({schema:1,identity:C.stable(payload),status},{source:'legacy + IndexedDB'}),d=await b.a.inspect('project',payload);assert.match(await b.a.archiveIncomplete('project',payload,d.reviewToken,()=>true),/:archive:/);assert.equal((await b.a.inspect('project',payload)).found,false);await assert.rejects(b.a.archiveIncomplete('project',payload,d.reviewToken,()=>true));assert.equal(b.calls(),0);}
});

test('explicit mismatched DONE archive is stage-locked, free, and cannot be repeated',async()=>{
 const old={schema:1,identity:'old-payload-identity',attemptId:'old-attempt',status:'DONE',result:{ok:true,result:'PASS',issues:[]}},b=boot(old),d=await b.a.inspect('project',payload);
 assert.equal(d.status,'DONE');assert.equal(d.identityMatch,false);assert.equal(d.recoverable,false);
 assert.match(await b.a.archiveMismatchedDone('project',payload,d.reviewToken,()=>true),/:archive:/);
 assert.equal((await b.a.inspect('project',payload)).found,false);
 await assert.rejects(b.a.archiveMismatchedDone('project',payload,d.reviewToken,()=>true));
 assert.equal(b.calls(),0);
});

test('mismatched DONE archive refuses matching results, conflicts, non-DONE state, stale consent and active locks',async()=>{
 for(const [record,options,current] of [
  [{schema:1,identity:C.stable(payload),status:'DONE',result:{ok:true,result:'PASS',issues:[]}},{},true],
  [{schema:1,identity:'old',status:'DONE',result:{ok:true,result:'PASS',issues:[]}},{conflict:true},true],
  [{schema:1,identity:'old',status:'UNCERTAIN'},{},true],
  [{schema:1,identity:'old',status:'DONE',result:{ok:true,result:'PASS',issues:[]}},{},false],
  [{schema:1,identity:'old',status:'DONE',result:{ok:true,result:'PASS',issues:[]}},{busy:true},true]
 ]){
  const b=boot(record,options),d=await b.a.inspect('project',payload);
  await assert.rejects(b.a.archiveMismatchedDone('project',payload,d.reviewToken||C.stable(record),()=>current));
  assert.equal(b.calls(),0);
 }
});

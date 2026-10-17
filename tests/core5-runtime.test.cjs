const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../ner-core-5');
function boot(saved){
 let project='A',calls=0;
 const nodes={topic:{value:'Aberfan Disaster — Wales — 1966'},format:{value:'shorts'}};
 const window={NERCore5:C,ldVideoContinuity:{year:'1966',location:'Aberfan, Wales'},ldProjectLocks:{videoMode:'text',visualStyle:'anime'},LDCore:{saveCurrent(){},isApprovalCommitted(){return false;}}};
 const localStorage={getItem:()=>project};const document={getElementById:id=>nodes[id],querySelectorAll:()=>[]};
 vm.runInNewContext(fs.readFileSync('ner-core-5-runtime.js','utf8'),{window,document,localStorage,console});
 function card(stage='P12'){
 const fields={'.narration':{value:'A public tribunal investigated water beneath the coal tip.'},'.text-video-prompt':{value:''},'.video-scene':{value:''},'.done-toggle':{checked:false}};
 return {fields,dataset:{stage,videoMode:'text',...(saved||{})},isConnected:true,querySelector:q=>fields[q]};
 }
 return {r:window.NERCore5Runtime,nodes,window,document,card,setProject:v=>project=v,audit:async()=>{calls++;return {ok:true,result:'PASS',issues:[]};},calls:()=>calls};
}
test('runtime audits once, persists exact bytes, reloads, copies, approves without rebuilding',async()=>{
 const b=boot(),c=b.card(),p=await b.r.prepare(c,b.audit);assert.equal(b.calls(),1);assert(b.r.ready(c));assert.equal(b.r.build(c),p);
 assert.equal(await b.r.prepare(c,b.audit),p);assert.equal(b.calls(),1);
 const next=boot({...c.dataset}),d=next.card();d.fields['.text-video-prompt'].value=p;assert(next.r.ready(d));assert.equal(next.r.approve(d),p);d.fields['.done-toggle'].checked=true;
 const before=JSON.stringify(d);assert.equal(next.r.build(d),p);assert.equal(JSON.stringify(d),before);
});
test('invalid chronology is blocked before any mocked API call',async()=>{
 const b=boot(),c=b.card();const s=C.clone(b.r.spec(c));s.chronology.relation='before';s.chronology.sceneYear=1970;c.dataset.core5Spec=JSON.stringify(s);
 await assert.rejects(b.r.prepare(c,b.audit),/preflight/);assert.equal(b.calls(),0);
});
test('simultaneous audits share one in-flight request',async()=>{
 const b=boot(),c=b.card();const values=await Promise.all([b.r.prepare(c,b.audit),b.r.prepare(c,b.audit)]);assert.equal(b.calls(),1);assert.equal(values[0],values[1]);
});
test('project switch, narration edit, detached card and prompt mutation discard pending results',async()=>{
 for(const mutate of [(b,c)=>b.setProject('B'),(b,c)=>c.fields['.narration'].value+=' Changed.',(b,c)=>c.isConnected=false,(b,c)=>c.fields['.text-video-prompt'].value+=' altered']){
 const b=boot(),c=b.card();let finish;const promise=b.r.prepare(c,()=>new Promise(r=>finish=r));await Promise.resolve();mutate(b,c);finish({ok:true,result:'PASS',issues:[]});await assert.rejects(promise,/changed|discarded/);assert(!c.dataset.core5Record);
 }
});
test('changed source invalidates readiness; copied bytes cannot silently change',async()=>{
 const b=boot(),c=b.card();const p=await b.r.prepare(c,b.audit);c.fields['.text-video-prompt'].value=p+' changed';assert(!b.r.ready(c));assert.throws(()=>b.r.approve(c));assert.equal(b.r.build(c),p);
 c.fields['.narration'].value+=' New evidence.';assert(!b.r.ready(c));assert.throws(()=>b.r.approve(c));
});
test('legacy approved panels are returned untouched without preflight or API call',async()=>{
 const b=boot(),c=b.card();c.fields['.done-toggle'].checked=true;c.fields['.text-video-prompt'].value='  exact legacy bytes\n';c.dataset.textVideoPrompt='  exact legacy bytes\n';const before=JSON.stringify(c);
 assert.equal(await b.r.prepare(c,b.audit),'  exact legacy bytes\n');assert.equal(b.r.build(c),'  exact legacy bytes\n');assert.equal(JSON.stringify(c),before);assert.equal(b.calls(),0);
});
test('KEEP CURRENT SCENE fails closed rather than losing a custom scene',async()=>{
 const b=boot(),c=b.card();c.dataset.sceneChoice='keep';c.fields['.video-scene'].value='A custom scene to preserve.';
 await assert.rejects(b.r.prepare(c,b.audit),/KEEP CURRENT SCENE/);assert.equal(b.calls(),0);assert.equal(c.fields['.video-scene'].value,'A custom scene to preserve.');
});
test('same narration in another project cannot inherit audit approval',async()=>{const b=boot(),c=b.card();await b.r.prepare(c,b.audit);b.setProject('B');assert(!b.r.ready(c));});
test('legacy prompt extension chain cannot rewrite a Core 5 or approved prompt',async()=>{
 const b=boot(),c=b.card();const api={prompt:()=> 'legacy',build:()=> 'legacy build'};b.r.attachVideoModes(api);
 for(let i=0;i<3;i++){const previous=api.prompt;api.prompt=x=>previous(x)+' OVERRIDE';}
 const p=await b.r.prepare(c,b.audit);assert.equal(api.prompt(c),p);assert.equal(api.build(c),p);
 c.fields['.done-toggle'].checked=true;assert.equal(api.prompt(c),p);
 const legacy=b.card('OTHER');assert.equal(api.prompt(legacy),'legacy OVERRIDE OVERRIDE OVERRIDE');
});
test('failed audit is retained; identical retries and reloads spend no further calls',async()=>{
 const b=boot(),c=b.card();let count=0;const fail=async()=>{count++;return {ok:true,result:'NEEDS FIX',issues:['Review physical staging']};};
 await assert.rejects(b.r.prepare(c,fail),/No automatic paid fix/);await assert.rejects(b.r.prepare(c,fail),/Edit the StageSpec/);assert.equal(count,1);assert(!b.r.ready(c));
 const next=boot(c.dataset),d=next.card();await assert.rejects(next.r.prepare(d,fail),/Edit the StageSpec/);assert.equal(count,1);
});
test('a valid spec for another panel is rejected locally',async()=>{const b=boot(),c=b.card();const s=C.clone(b.r.spec(c));s.stage='P13';c.dataset.core5Spec=JSON.stringify(s);await assert.rejects(b.r.prepare(c,b.audit),/source identity/);assert.equal(b.calls(),0);});
test('review preserves the legacy scene and synchronizes the visible scene; identical apply reuses audit',async()=>{
 const b=boot(),c=b.card();c.fields['.video-scene'].value='KEEP CURRENT SCENE — user draft';const s=b.r.spec(c);b.r.setSpec(c,s);
 assert.equal(c.dataset.core5LegacyScene,'KEEP CURRENT SCENE — user draft');assert.equal(c.fields['.video-scene'].value,b.r.sceneText(s));
 await b.r.prepare(c,b.audit);b.r.setSpec(c,s);assert(b.r.ready(c));await b.r.prepare(c,b.audit);assert.equal(b.calls(),1);
 c.fields['.video-scene'].value+=' conflicting edit';await assert.rejects(b.r.prepare(c,b.audit),/Scene editor differs/);assert.equal(b.calls(),1);
});
test('an uncertain provider failure is retained so automatic repeated prepare spends no more credits',async()=>{
 const b=boot(),c=b.card();let calls=0;const audit=async()=>{calls++;throw Error('response incomplete');};
 await assert.rejects(b.r.prepare(c,audit),/incomplete/);await assert.rejects(b.r.prepare(c,audit),/needs review/);assert.equal(calls,1);assert(!b.r.ready(c));
});

test('copy of an approved Core 5 panel returns frozen audit bytes even if a field is changed',async()=>{
 const b=boot(),c=b.card(),prompt=await b.r.prepare(c,b.audit);b.r.approve(c);c.fields['.done-toggle'].checked=true;
 c.fields['.text-video-prompt'].value='accidental field mutation';const before=JSON.stringify(c);
 assert.equal(b.r.build(c),prompt);assert.equal(JSON.stringify(c),before);assert.equal(b.calls(),1);
});

test('malformed audit success cannot trigger repeated paid requests and requires explicit retry',async()=>{
 const b=boot(),c=b.card();let calls=0;const bad=async()=>{calls++;return {ok:true,result:'PASS'};};
 await assert.rejects(b.r.prepare(c,bad),/did not pass/);await assert.rejects(b.r.prepare(c,bad),/needs review/);assert.equal(calls,1);
 await b.r.allowRetry(c);const prompt=await b.r.prepare(c,b.audit);assert(b.r.ready(c));assert.equal(prompt,c.dataset.textVideoPrompt);assert.equal(b.calls(),1);
});

test('approved prior compiler record keeps frozen bytes after compiler upgrade',async()=>{
 const b=boot(),c=b.card();const p=await b.r.prepare(c,b.audit);b.r.approve(c);const saved=JSON.parse(c.dataset.core5Record);saved.version='5.0.1';saved.payload.core5Version='5.0.1';saved.payload.stageSpec.compilerVersion='5.0.1';
 const next=boot({...c.dataset,core5Record:JSON.stringify(saved)}),d=next.card();d.fields['.done-toggle'].checked=true;d.fields['.text-video-prompt'].value='accidentally changed visible text';assert.equal(next.r.preserve(d),p);assert.equal(await next.r.prepare(d,next.audit),p);assert.equal(next.calls(),0);
});

test('ambiguous placeholder scene stops before any provider call',async()=>{
 const b=boot(),c=b.card('HOOK');c.fields['.narration'].value='A warning interrupted the morning.';
 await assert.rejects(b.r.prepare(c,b.audit),/concrete setting and action/);assert.equal(b.calls(),0);
});


test('parenthesized event title resolves missing location without false identity mismatch',async()=>{
 const b=boot(),c=b.card('P1');b.nodes.topic.value='The Great Smog of London (1952): how deadly air pollution engulfed London and led to the Clean Air Act of 1956.';
 b.window.ldVideoContinuity={year:'1952'};c.fields['.narration'].value='London, December 1952. Families fed their coal fires.';
 const s=b.r.spec(c);assert.equal(s.eventYear,1952);assert.equal(s.location.region,'London');assert(b.r.preflight(c).ok);
 c.fields['.video-scene'].value='SCENE BANK — open plaza';assert(!b.r.preflight(c).ok);
 const reviewed=C.clone(s);delete reviewed.choreography;reviewed.location.setting='Interior of a modest London home with a coal fireplace';reviewed.action.description='adult-1 adds one shovelful of coal to the fireplace';
 b.r.applyReview(c,reviewed);assert(b.r.preflight(c).ok);await b.r.prepare(c,b.audit);await b.r.prepare(c,b.audit);assert.equal(b.calls(),1);
});
test('missing metadata is editable locally; invalid or approved reviews do not change project data',()=>{
 const b=boot(),c=b.card();b.nodes.topic.value='Unspecified disaster';b.window.ldVideoContinuity={};
 const s=C.clone(b.r.reviewSpec(c));assert(!b.r.preflight(c).ok);assert(!b.r.preflight(c).issues.some(x=>x.includes('source identity')));
 s.eventYear=1966;s.location.region='Aberfan, Wales';s.chronology={relation:'after',sceneYear:null,period:'post-event inquiry',basis:s.narration};
 const invalid=C.clone(s);invalid.location.setting='';assert.throws(()=>b.r.applyReview(c,invalid));assert.deepEqual(b.window.ldVideoContinuity,{});
 b.r.applyReview(c,s);assert(b.r.preflight(c).ok);const before=JSON.stringify(b.window.ldVideoContinuity);c.fields['.done-toggle'].checked=true;assert.throws(()=>b.r.applyReview(c,s));assert.equal(JSON.stringify(b.window.ldVideoContinuity),before);
});
test('explicit metadata wins over inferred title and dash titles remain compatible',()=>{
 const b=boot(),c=b.card();b.nodes.topic.value='The Great Smog of London (1952)';
 assert.equal(b.r.spec(c).location.region,'Aberfan, Wales');assert.equal(b.r.spec(c).eventYear,1966);
 b.nodes.topic.value='Aberfan Disaster — Wales — 1966';b.window.ldVideoContinuity={};assert.equal(b.r.spec(c).location.region,'Wales');assert.equal(b.r.spec(c).eventYear,1966);
});

test('episode preparation preserves reviewed PASS, NEEDS FIX and approved panels',async()=>{
 for(const verdict of ['PASS','NEEDS FIX']){
  const b=boot(),c=b.card();b.document.querySelectorAll=()=>[c];
  try{await b.r.prepare(c,async()=>({ok:true,result:verdict,issues:verdict==='PASS'?[]:['Review staging']}));}catch{}
  const before=JSON.stringify(c);assert.equal(b.r.prepareEpisode(),0);assert.equal(JSON.stringify(c),before);
  c.fields['.done-toggle'].checked=true;const approved=JSON.stringify(c);assert.equal(b.r.prepareEpisode(),0);assert.equal(JSON.stringify(c),approved);
 }
});
test('episode replacement backs up old scene/spec/record and is idempotent',()=>{
 const b=boot(),c=b.card();b.document.querySelectorAll=()=>[c];c.fields['.video-scene'].value='Saved custom legacy draft';c.dataset.core5Spec=JSON.stringify({...C.clone(b.r.reviewSpec(c)),topic:'Old project title'});c.dataset.core5Record='old saved record';
 const oldSpec=c.dataset.core5Spec;assert.equal(b.r.prepareEpisode(),1);
 const history=JSON.parse(c.dataset.core5SceneHistory);assert.deepEqual(history,[{scene:'Saved custom legacy draft',spec:oldSpec,record:'old saved record'}]);
 const before=JSON.stringify(c);assert.equal(b.r.prepareEpisode(),0);assert.equal(JSON.stringify(c),before);assert.equal(b.calls(),0);
});

test('explicit refinement archives old audited bytes and requires only one new audit',async()=>{
 const b=boot(),c=b.card('P1');b.nodes.topic.value='The Great Smog of London — 1952';b.window.ldVideoContinuity={year:'1952',location:'London, England'};c.fields['.narration'].value='Families fed their coal fires.';
 const s=C.clone(b.r.reviewSpec(c));delete s.choreography;s.timing=[{start:0,end:2,phase:'establish'},{start:2,end:6,phase:'action'},{start:6,end:10,phase:'hold'}];b.r.setSpec(c,s);
 const old=await b.r.prepare(c,b.audit),record=c.dataset.core5Record;assert(b.r.ready(c));
 assert(b.r.refineScene(c));assert.equal(b.calls(),1);assert(!b.r.ready(c));assert.equal(JSON.parse(c.dataset.core5SceneHistory).at(-1).record,record);assert.equal(JSON.parse(JSON.parse(c.dataset.core5SceneHistory).at(-1).record).prompt,old);
 const next=await b.r.prepare(c,b.audit);assert.notEqual(next,old);assert.match(next,/Starting state:/);assert.equal(b.calls(),2);
 assert.equal(b.r.refineScene(c),false);await b.r.prepare(c,b.audit);assert.equal(b.calls(),2);
 c.fields['.done-toggle'].checked=true;const before=JSON.stringify(c);assert.throws(()=>b.r.refineScene(c),/immutable/);assert.equal(JSON.stringify(c),before);
});
test('free journal diagnostic and recovery use current canonical payload without audit',async()=>{
 const b=boot(),c=b.card();let recoveredPayload;
 b.window.NERCore5AuditCoordinator={inspect:async(project,p)=>({found:true,identityMatch:true,recoverable:true,status:'DONE',source:'IndexedDB'}),recover:async(project,p)=>{recoveredPayload=p;return {ok:true,result:'PASS',issues:[]};}};
 const before=JSON.stringify(c.dataset);assert.equal((await b.r.journalDiagnostic(c)).status,'SAVED_RESULT_RECOVERABLE');assert.equal(JSON.stringify(c.dataset),before);
 await b.r.recoverJournal(c);assert(b.r.ready(c));assert.equal(b.r.build(c),recoveredPayload.currentPrompt);assert.equal(b.calls(),0);
 c.fields['.done-toggle'].checked=true;await assert.rejects(b.r.recoverJournal(c),/immutable/);
});
test('journal recovery rejects a changed project and preserves a recovered NEEDS FIX verdict',async()=>{
 const b=boot(),c=b.card();b.window.NERCore5AuditCoordinator={recover:async()=>{b.setProject('other');return {ok:true,result:'PASS',issues:[]};}};
 await assert.rejects(b.r.recoverJournal(c),/changed/);assert(!c.dataset.core5Record);
 b.window.NERCore5AuditCoordinator.recover=async()=>({ok:true,result:'NEEDS FIX',issues:['Review camera']});await b.r.recoverJournal(c);assert(!b.r.ready(c));assert.equal(JSON.parse(c.dataset.core5Record).result.result,'NEEDS FIX');assert.equal(b.calls(),0);
});
test('free recovery reports project save failure instead of claiming durable success',async()=>{
 const b=boot(),c=b.card();b.window.LDCore.saveCurrent=()=>false;b.window.NERCore5AuditCoordinator={recover:async()=>({ok:true,result:'PASS',issues:[]})};
 await assert.rejects(b.r.recoverJournal(c),/project storage could not save/);assert.equal(b.calls(),0);
});

test('old P4 is blocked before audit and explicit free preparation preserves approved P3 and draft history',async()=>{
 const b=boot(),p3=b.card('P3'),p4=b.card('P4'),f=require('./fixtures/great-smog.json');
 b.nodes.topic.value='The Great Smog of London — 1952';b.window.ldVideoContinuity={year:'1952',location:'London, England'};
 p3.fields['.narration'].value=f.narrations[3];p4.fields['.narration'].value=f.narrations[4];b.document.querySelectorAll=()=>[p3,p4];
 b.r.setSpec(p3,b.r.reviewSpec(p3));p3.fields['.done-toggle'].checked=true;p3.fields['.text-video-prompt'].value='EXACT APPROVED P3';
 const old=C.clone(b.r.reviewSpec(p4)),prior=JSON.parse(p3.dataset.core5Spec);old.location.setting=prior.location.setting;old.action=prior.action;
 p4.dataset.core5Spec=JSON.stringify(old);p4.fields['.video-scene'].value=b.r.sceneText(old);p4.dataset.core5Record='old audited record';
 const before=JSON.stringify(p3),oldSpec=p4.dataset.core5Spec;
 assert.throws(()=>b.r.build(p4),/Onset scene repeats/);await assert.rejects(b.r.prepare(p4,b.audit),/Onset scene repeats/);assert.equal(b.calls(),0);assert.equal(p4.dataset.core5Spec,oldSpec);
 assert.equal(b.r.prepareEpisode(),1);assert.equal(JSON.stringify(p3),before);assert.equal(b.calls(),0);
 assert.equal(JSON.parse(p4.dataset.core5SceneHistory)[0].spec,oldSpec);assert.equal(JSON.parse(p4.dataset.core5SceneHistory)[0].record,'old audited record');
 assert(!p4.dataset.core5Record);assert(b.r.preflight(p4).ok);assert.match(p4.fields['.text-video-prompt'].value,/street-level/);
 assert.equal(b.r.prepareEpisode(),0);assert.equal(JSON.stringify(p3),before);
});

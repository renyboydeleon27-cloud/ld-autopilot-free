const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../ner-core-5');
function boot(saved){
 let project='A',calls=0;
 const nodes={topic:{value:'Aberfan Disaster — Wales — 1966'},format:{value:'shorts'}};
 const window={NERCore5:C,ldVideoContinuity:{year:'1966',location:'Aberfan, Wales'},ldProjectLocks:{videoMode:'text',visualStyle:'anime'},LDCore:{saveCurrent(){},isApprovalCommitted(){return false;}}};
 const localStorage={getItem:()=>project};
 vm.runInNewContext(fs.readFileSync('ner-core-5-runtime.js','utf8'),{window,document:{getElementById:id=>nodes[id]},localStorage,console});
 function card(stage='P12'){
 const fields={'.narration':{value:'A public tribunal investigated water beneath the coal tip.'},'.text-video-prompt':{value:''},'.video-scene':{value:''},'.done-toggle':{checked:false}};
 return {fields,dataset:{stage,videoMode:'text',...(saved||{})},isConnected:true,querySelector:q=>fields[q]};
 }
 return {r:window.NERCore5Runtime,nodes,window,card,setProject:v=>project=v,audit:async()=>{calls++;return {ok:true,result:'PASS',issues:[]};},calls:()=>calls};
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
 const reviewed=C.clone(s);reviewed.location.setting='Interior of a modest London home with a coal fireplace';reviewed.action.description='adult-1 adds one shovelful of coal to the fireplace';
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

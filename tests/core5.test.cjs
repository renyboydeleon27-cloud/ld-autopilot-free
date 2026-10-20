const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../ner-core-5.js');
const make=(stage,narration,topic='Aberfan Disaster — Wales — 1966',eventYear=1966)=>{const s=C.clone(C.plan({stage,narration,topic,eventYear,location:'Wales'}));if(/supported (warning|hazard|contextual feature)|narrated (cause|onset|warning|non-graphic impact)/i.test(s.location.setting+' '+s.action.description)){s.location.setting='representative outdoor viewing area';s.action.description='adult-1 slowly turns their head to the left';}return C.deepFreeze(s);};
const edit=(s,fn)=>{s=C.clone(s);fn(s);return s;};
for(const [stage,nar,role,relation] of [
 ['P12','A public tribunal investigated water beneath the coal tip.','evidence','after'],
 ['P13','The tribunal placed responsibility on the National Coal Board; the disaster was preventable.','accountability','after'],
 ['P14','Decades later, coal-tip safety and remembrance remain its legacy.','legacy','later']
])test('Aberfan '+stage+' canonical role, chronology, action and camera',()=>{
 const s=make(stage,nar),p=C.compile(s);assert.equal(s.role,role);assert.equal(s.chronology.relation,relation);assert.equal(s.chronology.sceneYear,null);assert.equal(C.validate(s).ok,true);
 assert.equal((p.match(/STAGE ROLE:/g)||[]).length,1);assert.equal((p.match(/\n\nCAMERA:/g)||[]).length,1);assert.equal((p.match(/\n\nTIMING:/g)||[]).length,1);
 assert.doesNotMatch(p,/OVERRIDE|CORE 4|wider.consequence|2\.0–7\.0/);assert.equal(C.compile(s),p);assert(Object.isFrozen(s.camera));
 if(stage==='P12')assert.match(s.action.description,/finger/);if(stage==='P13'){assert.match(s.action.description,/folder/);assert.equal(s.cast.length,3);}if(stage==='P14')assert.match(s.action.description,/lowers their head/);
});
for(const [topic,f] of [['Wellington Avalanche 1910','avalanche'],['Halabja Chemical Attack 1988','chemical-wmd'],['Xylazine Crisis 2020','public-health'],['Bangladesh Tornado 1989','tornado'],['Tambora Eruption 1815','volcano'],['Chernobyl Reactor 1986','industrial-technological'],['Locust Plague 1874','biological-agricultural']])test('family policy '+f,()=>{
 const s=make('P14','The legacy remains remembered.',topic,Number(topic.match(/\d{4}/)[0]));assert.equal(s.family,f);assert(C.validate(s).ok);assert.match(C.compile(s),/FAMILY BOUNDARY:/);
 if(f==='public-health'){assert.match(s.action.description,/raises their head/);assert.doesNotMatch(s.action.description,/folder|debris/);}
});
test('all 16 stages have one valid canonical definition',()=>{for(const st of C.STAGES)assert(C.validate(make(st,'A documented local moment.')).ok);});
test('explicit flashback and later year supported; inconsistent chronology rejected',()=>{
 const s=make('P2','Years earlier, the conditions were different.');assert.equal(s.chronology.relation,'before');
 assert(C.validate(edit(s,x=>{x.chronology.sceneYear=1960;})).ok);
 assert(!C.validate(edit(s,x=>{x.chronology.sceneYear=1970;})).ok);
 assert(!C.validate(edit(make('P14','Decades later, remembrance continued.'),x=>{x.chronology.relation='event';x.chronology.sceneYear=1966;})).ok);
});
test('reject camera, duration, cast, source and embedded prompt contradictions before compile',()=>{
 const s=make('P12','The tribunal reviewed evidence.');
 for(const fn of [x=>x.camera.movement='push-in and pull-back',x=>x.timing[1].start=1,x=>x.timing[2].end=11,x=>x.cast.push(x.cast[0]),x=>x.narration='changed',x=>x.locks.text='labels',x=>x.action.description+=' CAMERA: orbit',x=>x.facts=[{claim:'unsupported'}]])assert.throws(()=>C.compile(edit(s,fn)),/preflight/);
});
test('full audit payload and prompt bytes, not short hash, define transaction',()=>{
 const p=C.payload(make('P13','The tribunal assigned responsibility.')),pass={ok:true,result:'PASS',issues:[]};
 const tx=C.transaction(p,pass);assert.equal(tx.prompt,p.currentPrompt);assert(Object.isFrozen(tx));
 for(const fn of [x=>x.currentPrompt+=' ',x=>x.narration+=' changed',x=>x.sceneYear=1966,x=>x.progressionRole='recovery'])assert.throws(()=>C.transaction(edit(p,fn),pass));
 assert.throws(()=>C.transaction(p,{ok:true,result:'NEEDS FIX',issues:['camera']}));
});
test('ENDING remains a static illustration; video panels alone require ten seconds',()=>{
 const s=make('ENDING','');assert(C.validate(s).ok);assert.equal(s.locks.duration,null);assert.equal(s.timing.length,0);const p=C.compile(s);assert.match(p,/ILLUSTRATION PROMPT/);assert.doesNotMatch(p,/TIMING:|AUDIO:|10 SECONDS/);
 assert.equal(make('HOOK','A warning appeared.').locks.duration,10);
});
test('an inquiry after the event may occur within the same calendar year',()=>{
 const s=edit(make('P12','An inquiry reviewed evidence.'),s=>{s.chronology.sceneYear=1966;});assert(C.validate(s).ok);
});

test('project preflight detects duplicate definitions, mixed events and unmarked backward scene years',()=>{
 const a=edit(make('P12','An inquiry reviewed evidence.'),s=>{s.chronology.sceneYear=1968;});
 const b=make('P13','Local conditions continued.');assert(!C.validateSequence([a,b]).ok);
 const flashback=make('P13','Years earlier, local conditions differed.');assert(C.validateSequence([a,flashback]).ok);
 assert(!C.validateSequence([a,a]).ok);assert(!C.validateSequence([a,make('P14','Years later, remembrance continued.','Other event 1900',1900)]).ok);
});

test('active aid/support is response while flight remains displacement across families',()=>{
 for(const topic of ['Aberfan landslide','Xylazine crisis','Halabja chemical attack','Wellington avalanche']){
  assert.equal(C.plan({stage:'P10',topic,narration:'Local aid supported displaced families.',eventYear:1966,location:'Test'}).role,'response');
  assert.equal(C.role('Families fled toward shelter while waiting for aid.','P8'),'displacement');
 }
});
test('community aftermath has its own role and no renewed hazard action',()=>{
 const s=make('P11','The community faced the aftermath.');assert.equal(s.role,'aftermath');assert.equal(s.chronology.relation,'after');assert.match(s.location.setting,/settled/);assert.doesNotMatch(s.action.description,/hazard|cause|collapse/);
});
test('unresolved scene placeholders block compilation and paid payload creation',()=>{
 const s=C.plan({stage:'HOOK',topic:'Earthquake 1900',narration:'A warning appeared.',eventYear:1900,location:'Test'});
 assert.throws(()=>C.payload(s),/concrete setting and action/);
});
test('undated ending does not silently return to the historical event year',()=>{
 const s=make('ENDING','Thank you for watching.');assert.equal(s.chronology.sceneYear,null);assert.equal(s.chronology.relation,'after');
});


test('2011 Tōhoku P5 warning leads to urgent physical uphill evacuation, never generic shelter walking',()=>{
 const topic='2011 Tōhoku Earthquake and Tsunami — Japan';
 const narration='Authorities issued tsunami warnings. Along the coastline, people fled toward higher ground as dangerous waves approached.';
 const spec=C.plan({topic,stage:'P5',narration,eventYear:2011,location:'Tōhoku, Japan',facts:[]});
 assert.equal(spec.family,'tsunami');assert.equal(spec.role,'displacement');
 assert.equal(spec.cast.length,1);assert.equal(spec.chronology.sceneYear,2011);
 assert.match(spec.location.setting,/dry, clearly uphill coastal evacuation lane/i);
 assert.match(spec.location.setting,/higher paved bend/);
 assert.match(spec.action.description,/hurries forward up/);
 assert.match(spec.action.description,/seventh second/);
 assert.equal(spec.camera.movement,'slow-push-in');
 assert.equal(spec.choreography.prop,'one continuous paved uphill evacuation lane and fixed roadside retaining wall');
 assert.match(spec.choreography.motion,/from seconds 2–7/);
 assert.match(spec.choreography.end,/by second seven/);
 assert.match(spec.choreography.sound,/no human voice|never produce a human voice/i);
 assert.equal(spec.timing[1].end,7);assert.equal(spec.timing[2].end,10);
 assert.equal(spec.locks.duration,10);assert.equal(spec.locks.shots,1);assert.equal(spec.locks.color,'bw');
 assert.equal(C.validate(spec).ok,true);
 const compiled=C.compile(spec);
 assert.match(compiled,/P5|displacement/);
 assert.match(compiled,/uphill/);
 assert.match(compiled,/ACTION DETAIL CONTRACT/);
 assert.match(compiled,/7–10s:/);
 assert.doesNotMatch(compiled,/walks steadily to a visible sheltered threshold/);
 assert.doesNotMatch(spec.location.setting,/tsunami|inundation/i,'no misleading active-inundation boundary during warning-only phase');
 assert.match(compiled,/FAMILY BOUNDARY: Water obeys gravity/);
});
test('Tōhoku P5 recipe stays specific: other topics and saved custom P5 scenes remain unchanged',()=>{
 const narration='Authorities issued tsunami warnings. Along the coastline, people fled toward higher ground as dangerous waves approached.';
 const topic='2011 Tōhoku Earthquake and Tsunami — Japan';
 const input={topic,stage:'P5',narration,eventYear:2011,location:'Tōhoku, Japan'};
 const newSpec=C.plan(input);
 const oldSpec=C.clone(newSpec);
 oldSpec.location.setting='a real user-customized inclined seawall refuge trail';
 oldSpec.action.description='adult-1 jogs toward the safe hillside route';
 delete oldSpec.choreography;
 oldSpec.timing=[{start:0,end:2,phase:'establish'},{start:2,end:6,phase:'action'},{start:6,end:10,phase:'hold'}];
 assert.equal(C.plan({...input,spec:oldSpec}).location.setting,oldSpec.location.setting);
 assert.equal(C.plan({...input,spec:oldSpec}).action.description,oldSpec.action.description);
 const other=C.plan({topic:'2011 Banda Aceh Tsunami — Indonesia',stage:'P5',narration,eventYear:2011,location:'Banda Aceh'});
 assert.equal(other.location.setting,'visible local route toward shelter');
 assert.equal(other.action.description,'adult-1 walks steadily to a visible sheltered threshold');
 const p4=C.plan({topic,stage:'P4',narration:'The ground shook for minutes. Buildings swayed, roads cracked, and terrified residents struggled to remain standing.',eventYear:2011,location:'Tōhoku, Japan'});
 assert.match(p4.location.setting,/roadside fence post/);
 assert.doesNotMatch(p4.location.setting,/uphill coastal evacuation lane/);
});

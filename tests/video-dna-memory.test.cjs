const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../ner-video-dna.js');
function mem(){const db=new Map();globalThis.localStorage={getItem:k=>db.get(k)||null,setItem(k,v){db.set(k,String(v));},removeItem(k){db.delete(k);}};return db;}
const good={topic:'2011 Tōhoku Earthquake and Tsunami',stage:'P3',family:'tsunami',prompt:'Earthquake. The ground shakes. An adult struggles to balance while the railing vibrates, the utility poles sway and wires oscillate. Dust emerges only after falling roof tiles, rising and then dissipating.',grade:9.2};
test('MASTER and FAILURE record exact reviewed prompts, never overwrite saved stage',()=>{
 mem();
 const a=D.save({...good,kind:'master'});assert.equal(a.existing,false);
 assert.equal(D.list().length,1);assert.equal(D.save({...good,kind:'master'}).existing,true);
 assert.equal(D.list()[0].grade,9.2);assert.equal(D.check(good).status,'pass');
 assert.throws(()=>D.save({...good,kind:'master',grade:8.9}),/Invalid DNA/);
 const bad={...good,prompt:'Earthquake with weak movement, mostly wind and leaves. A person stands still.'};
 assert.throws(()=>D.save({...bad,grade:9.2,kind:'failure',reason:'quake-not-visible'}),/Invalid DNA/);
 D.save({...bad,grade:8.2,kind:'failure',reason:'quake-not-visible'});
 assert.equal(D.check(bad).status,'block');
 assert.throws(()=>D.assertReady(bad),/FREE VIDEO DNA BLOCK/);
 assert.equal(D.check(good).status,'pass');
});
test('stage-appropriate warnings do not block unrelated calm and later recovery scenes',()=>{
 mem();
 const weak={topic:good.topic,stage:'P3',family:'tsunami',prompt:'Earthquake begins in town while the horizon is calm and people look outside.'};
 const w=D.check(weak);assert.equal(w.status,'warning');
 const later=D.check({...weak,stage:'P14'});assert.equal(later.status,'pass');
 const calm=D.check({...weak,topic:'Peaceful ordinary coastal village',stage:'P1',prompt:'Children play safely beside the harbor.'});assert.equal(calm.status,'pass');
});
test('dense starting dust triggers a FREE block; negative constraints do not',()=>{
 mem();
 const bad={...good,prompt:'STARTING FRAME: Dense smoke covers the coast from second zero. Earthquake strikes.'};
 assert.equal(D.check(bad).status,'block');
 const goodNeg={...good,prompt:'STARTING FRAME: no thick smoke at the start. Ground shakes and railing vibrates. Dust appears later after a wall fragment crumbles and gradually dissipates.'};
 assert.equal(D.check(goodNeg).status,'pass');
 const goodNeg2={...good,prompt:'0–2s: thick dust is absent at the start. Railing vibrates. 2–6s: Dust rises after masonry falls.'};
 assert.equal(D.check(goodNeg2).status,'pass');
});
test('library export/import is additive and invalid imports preserve existing records',()=>{
 const db=mem(),g=D.save({...good,kind:'master'}),backup=D.exportText();
 db.delete(D.KEY);
 assert.equal(D.importRecords(backup),1);
 assert.equal(D.importRecords(backup),0);
 const before=db.get(D.KEY);
 assert.throws(()=>D.importRecords('{"version":"9","records":[]}'),/Unrecognized/);
 assert.equal(db.get(D.KEY),before);
 assert.equal(D.list()[0].hash,g.record.hash);
});
test('invalid stored payload fails closed without clearing memory',()=>{
 const db=mem();db.set(D.KEY,'{BROKEN');
 assert.throws(()=>D.save({...good,kind:'master'}),/JSON/);
 assert.equal(db.get(D.KEY),'{BROKEN');
 assert.equal(D.check(good).status,'warning');
});
test('no external network or AI dependency; pure preflight does not mutate input',()=>{
 mem();
 const q={...good},before=JSON.stringify(q);
 D.assertReady(q);
 assert.equal(JSON.stringify(q),before);
 assert(D.LESSONS.length>=6);
});

test('P1 V1 reviewed failure is added once without inventing its missing rejected prompt',()=>{
 const db=mem();
 const approved=D.save({...good,kind:'master'}).record;
 const seeded=D.seedHistoricalP1('2011 Tōhoku Earthquake and Tsunami');
 assert.equal(seeded.status,'saved');
 assert.equal(seeded.record.origin,'observed-render');
 assert.equal(seeded.record.grade,8.5);
 assert.equal(seeded.record.reason,'camera-reset');
 assert.equal(seeded.record.prompt,'');
 assert.match(seeded.record.notes,/Kids|children|coastline/i);
 assert.equal(D.seedHistoricalP1('2011 Tōhoku Earthquake and Tsunami').status,'existing');
 assert.equal(D.list().length,2);
 assert.equal(D.list().find(r=>r.kind==='master').hash,approved.hash);
 assert.equal(D.seedHistoricalP1('The Great Smog of London — 1952').status,'not-applicable');
 assert.equal(db.size,1,'no project or audit records were mutated');
});
test('historical P1 failure is a lesson, never an exact-prompt blocker for approved P1 V2',()=>{
 mem();D.seedHistoricalP1('2011 Tōhoku Earthquake and Tsunami');
 const p1={topic:'2011 Tōhoku Earthquake and Tsunami',stage:'P1',family:'earthquake',
 prompt:'VIDEO PROMPT: Calm Japanese coast first. The camera tracks from the coastline into a peaceful town and ends with two schoolchildren at play, one continuous cinematic shot, no cuts or resets.'};
 const result=D.assertReady(p1);
 assert.equal(result.status,'pass');
 assert.equal(result.historical.length,1);
 assert.equal(result.historical[0].grade,8.5);
 assert.equal(D.assertReady({...p1,topic:'Manikganj Tornado — Bangladesh — 1989'}).historical.length,0);
});
test('historical failure survives JSON backup and reimport without replacing existing masters',()=>{
 const db=mem(); D.save({...good,kind:'master'}); D.seedHistoricalP1('2011 Tōhoku Earthquake and Tsunami');
 const backup=D.exportText(); db.delete(D.KEY);
 assert.equal(D.importRecords(backup),2);
 assert.equal(D.list().length,2);
 assert.equal(D.importRecords(backup),0);
 assert.equal(D.check({topic:'2011 Tōhoku Earthquake and Tsunami',stage:'P1',prompt:good.prompt}).historical.length,1);
});

test('P2 historical failure is saved once with unknown grade and no fabricated prompt',()=>{
 const db=mem();
 D.seedHistoricalP1('2011 Tōhoku Earthquake and Tsunami');
 const p2=D.seedHistoricalP2('2011 Tōhoku Earthquake and Tsunami');
 assert.equal(p2.status,'saved');
 assert.equal(p2.record.stage,'P2');
 assert.equal(p2.record.grade,null);
 assert.equal(p2.record.origin,'historical-review');
 assert.equal(p2.record.reason,'quake-not-visible');
 assert.equal(p2.record.prompt,'');
 assert.match(p2.record.notes,/approved P2 V2 \(9\.2\/10\)/);
 assert.equal(D.seedHistoricalP2('2011 Tōhoku Earthquake and Tsunami').status,'existing');
 assert.equal(D.seedHistoricalP2('Mount Tambora 1815').status,'not-applicable');
 assert.equal(D.list().length,2);
 assert.equal(db.size,1,'stage state and journals never touched');
});
test('P2 approved motion remains allowed; historical observation never hard-blocks it',()=>{
 mem();D.seedHistoricalP2('2011 Tōhoku Earthquake and Tsunami');
 const approved={
  topic:'2011 Tōhoku Earthquake and Tsunami',stage:'P2',family:'earthquake',
  prompt:'The ground vibrates subtly in a 2011 coastal street. Two children playing stop, crouch and brace. Hanging objects rattle as the quake begins. No cuts.'
 };
 const check=D.assertReady(approved);
 assert.equal(check.status,'pass');
 assert.equal(check.historical.length,1);
 assert.equal(check.historical[0].grade,null);
 const differentTopic=D.check({...approved,topic:'Great Smog of London 1952'});
 assert.equal(differentTopic.historical.length,0);
 const otherStage=D.check({...approved,stage:'P3'});
 assert.equal(otherStage.historical.length,0);
});
test('P2 historical memory round-trips with P1, existing Master DNA and JSON import',()=>{
 const db=mem();
 D.seedHistoricalP1('2011 Tōhoku Earthquake and Tsunami');
 D.seedHistoricalP2('2011 Tōhoku Earthquake and Tsunami');
 const master={topic:'2011 Tōhoku Earthquake and Tsunami',stage:'P2',family:'earthquake',prompt:'Children play outside. At first trembling, a hanging sign shakes and children crouch while the ground visibly vibrates.',grade:9.2};
 D.save({...master,kind:'master'});
 const backup=D.exportText(),count=D.list().length;
 assert.equal(count,3);
 db.delete(D.KEY);
 assert.equal(D.importRecords(backup),count);
 assert.equal(D.importRecords(backup),0);
 assert.equal(D.list().find(r=>r.stage==='P2'&&r.origin==='historical-review').grade,null);
 assert.equal(D.list().find(r=>r.stage==='P2'&&r.kind==='master').grade,9.2);
});
test('malformed ungraded regular failures are still rejected by storage validation',()=>{
 const db=mem();
 const r={...D.HISTORICAL_P2,origin:undefined,hash:'123456',id:'fake'};
 db.set(D.KEY,JSON.stringify({version:D.VERSION,records:[r]}));
 assert.throws(()=>D.list(),/Unrecognized/);
});


test('P4 V1 observed failures are recorded once, without inventing rejected prompt bytes',()=>{
 const db=mem();
 const master={...good,stage:'P4',grade:9.0,prompt:'A Japanese resident grips a railing. The ground shakes the neighborhood. Roof fragments fall and stay on the road; wires oscillate.'};
 const approved=D.save({...master,kind:'master'}).record;
 const saved=D.seedHistoricalP4('2011 Tōhoku Earthquake and Tsunami — Japan');
 assert.equal(saved.status,'saved');
 assert.equal(saved.record.origin,'observed-render');
 assert.equal(saved.record.stage,'P4');
 assert.equal(saved.record.grade,7.8);
 assert.equal(saved.record.prompt,'');
 assert.equal(saved.record.reason,'other');
 assert.match(saved.record.notes,/1000273717\.mp4/);
 assert.match(saved.record.notes,/disappear|dissolv/i);
 assert.match(saved.record.notes,/utility pole|background/i);
 assert.equal(D.seedHistoricalP4('2011 Tōhoku Earthquake and Tsunami').status,'existing');
 assert.equal(D.seedHistoricalP4('Aberfan disaster — Wales — 1966').status,'not-applicable');
 assert.equal(D.list().length,2);
 assert.equal(D.list().find(r=>r.kind==='master').hash,approved.hash);
 assert.equal(db.size,1,'project and audit storage must remain unchanged');
});
test('P4 V1 historical observation never blocks approved P4 V2 exact prompt',()=>{
 mem();
 D.seedHistoricalP4('2011 Tōhoku Earthquake and Tsunami');
 const approved={...good,stage:'P4',grade:9.0,prompt:'An adult braces at a residential fence as the ground shakes and buildings rattle. Wires sway as tiles fall naturally and persist on the road.'};
 const result=D.assertReady(approved);
 assert.equal(result.status,'pass');
 assert.equal(result.historical.length,1);
 assert.equal(result.historical[0].grade,7.8);
 assert.equal(result.historical[0].reason,'other');
 assert.equal(D.check({...approved,stage:'P3'}).historical.length,0);
 assert.equal(D.check({...approved,topic:'Great Smog of London 1952'}).historical.length,0);
});
test('P4 observed failure survives export/import alongside all approved Master DNA',()=>{
 const db=mem();
 const masters=['P1','P2','P3','P4'].map((stage,i)=>D.save({...good,stage,kind:'master',grade:[9.5,9.2,9.2,9.0][i],prompt:good.prompt+' '+stage}).record);
 D.seedHistoricalP4('2011 Tōhoku Earthquake and Tsunami');
 const exported=D.exportText();
 db.delete(D.KEY);
 assert.equal(D.importRecords(exported),5);
 assert.equal(D.importRecords(exported),0);
 assert.equal(D.list().filter(r=>r.kind==='master').length,4);
 for(const entry of masters)assert(D.list().some(r=>r.kind==='master'&&r.hash===entry.hash));
 assert.equal(D.list().find(r=>r.id===D.HISTORICAL_P4.id).prompt,'');
 assert.equal(D.check({...good,stage:'P4'}).historical.length,1);
});

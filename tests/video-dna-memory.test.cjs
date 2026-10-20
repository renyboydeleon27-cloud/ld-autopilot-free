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

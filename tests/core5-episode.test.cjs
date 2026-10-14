const test=require('node:test'),assert=require('node:assert/strict'),C=require('../ner-core-5.js'),fixture=require('./fixtures/great-smog.json');
const specs=fixture.narrations.map((narration,i)=>C.plan({topic:fixture.topic,stage:C.STAGES[i],narration,eventYear:1952,location:'London'}));
test('whole pollution episode plans locally without manual per-panel patches',()=>{
 assert.deepEqual(C.metadata(fixture.topic),{year:'1952',location:'London'});
 assert(C.validateSequence(specs).ok,JSON.stringify(C.validateSequence(specs)));
 for(const s of specs){assert(C.validatePayload(C.payload(s)).ok);assert.equal(s.family,'atmospheric-pollution');}
 assert.match(specs[1].action.description,/coal/);assert.notEqual(specs[2].location.setting,specs[3].location.setting);
 assert.equal(specs[13].role,'accountability');assert.equal(specs[13].chronology.sceneYear,1956);
 assert.equal(specs[14].chronology.relation,'later');assert.equal(specs[14].chronology.sceneYear,null);
});
test('explicit later scene year mismatch fails locally',()=>{
 const s=C.clone(specs[13]);s.chronology.sceneYear=1960;s.chronology.period='1960';assert(!C.validate(s).ok);
});
test('pollution motifs reusable across stage numbers and event names',()=>{
 for(const stage of ['P3','P8','P12']){const s=C.plan({topic:'Historic coal smoke episode',stage,narration:fixture.narrations[1],eventYear:1900,location:'Explicit test city'});assert.match(s.action.description,/coal/);assert(C.validate(s).ok);}
});
test('shared metadata respects explicit settings and refuses invented places',()=>{
 assert.deepEqual(C.metadata('Aberfan Disaster — Wales — 1966'),{year:'1966',location:'Wales'});
 assert.deepEqual(C.metadata(fixture.topic,{year:'1952',location:'London, England'}),{year:'1952',location:'London, England'});
 assert.equal(C.metadata('Unspecified event 1900').location,'');
 assert.equal(C.metadata('San Francisco Earthquake — California, USA — 1906').location,'San Francisco, California, USA');
 assert.equal(C.metadata('Event — Region — 1900: context').location,'Region');
});

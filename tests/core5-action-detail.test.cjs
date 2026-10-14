const test=require('node:test'),assert=require('node:assert/strict'),C=require('../ner-core-5'),old=require('./fixtures/core5-old-coal-audit.json');
test('saved old prompt bytes remain identical until explicit refinement',()=>{
 assert.equal(C.compile(old.spec),old.prompt);
 assert.equal(C.compile(C.plan({topic:old.spec.topic,stage:old.spec.stage,narration:old.spec.narration,eventYear:1952,location:'London, England',spec:old.spec})),old.prompt);
});
test('refinement supplies concrete states, one prop, sound and contiguous ten seconds',()=>{
 const s=C.refine(old.spec);assert(C.validate(s).ok);assert.match(s.choreography.start,/already-loaded/);assert.match(s.choreography.end,/empty shovel/);assert.equal(s.timing[1].end,7);assert.equal(s.timing[2].start,7);assert.equal(s.timing[2].end,10);assert(C.validatePayload(C.payload(s)).ok);
 assert.equal((C.compile(s).match(/\n\nCAMERA:/g)||[]).length,1);assert.equal(C.stable(C.refine(s)),C.stable(s));
});
test('action detail contract rejects mismatched actors, changed action and embedded overrides',()=>{
 for(const change of [s=>s.choreography.actor='adult-2',s=>s.action.description='adult-1 walks away',s=>s.choreography.motion+=' CAMERA: orbit',s=>delete s.choreography.end,s=>s.cast[0].description='different resident']){
  const s=C.clone(C.refine(old.spec));change(s);assert(!C.validate(s).ok);
 }
});
test('custom staging remains unchanged by refinement; recipes do not depend on panel number',()=>{
 const custom=C.clone(old.spec);custom.location.setting='Custom saved home';assert.equal(C.refine(custom),custom);
 for(const stage of ['P2','P8','P12']){const s=C.plan({topic:'Coal smoke episode',stage,narration:'Families fed their coal fires.',eventYear:1900,location:'Test region'});assert(s.choreography);assert(C.validate(s).ok);}
});

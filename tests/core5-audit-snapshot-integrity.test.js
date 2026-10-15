/* Verify canonical audit identity and immutable scene snapshots without provider calls. */
'use strict';
const assert=require('node:assert/strict');
const core=require('../ner-core-5.js');
const base={topic:'The Great Smog of London — 1952',eventYear:1952,location:'London, England',facts:[]};
const narrations=[
 ['P1','London, December 1952. Winter tightened its grip, and families fed their coal fires, trying to keep the bitter cold outside.'],
 ['P2','Across the city, household chimneys, factories, and power stations poured smoke into the air. Heating London came with a dangerous cost.']
];
for(const [stage,narration] of narrations){
 const spec=core.plan({...base,stage,narration});
 const original=core.stable(spec),prompt=core.compile(spec),p=core.payload(spec);
 assert.equal(core.validatePayload(p).ok,true,stage+' canonical payload');
 const audited=core.transaction(p,{result:'PASS',ok:true,issues:[]});
 assert.equal(audited.status,'AUDITED');
 assert.equal(audited.prompt,prompt);
 assert.equal(core.stable(spec),original,stage+' spec unchanged after audit');
 assert.equal(core.refine(spec),spec,stage+' existing scene not auto-refined');
 assert.equal(Object.isFrozen(audited),true,stage+' audit snapshot frozen');
 assert.equal(Object.isFrozen(audited.payload),true,stage+' payload frozen');
 const tampered=core.clone(p);tampered.currentPrompt+=' CHANGED';
 assert.equal(core.validatePayload(tampered).ok,false,stage+' modified prompt rejected');
 assert.throws(()=>core.transaction(tampered,{result:'PASS',ok:true,issues:[]}),stage+' tampered audit rejected');
 assert.throws(()=>core.transaction(p,{result:'FAIL',ok:false,issues:['unsafe']}),stage+' failed audit rejected');
}
console.log('Core 5 audit snapshot integrity passed (synthetic offline scenes, not real user backups)');

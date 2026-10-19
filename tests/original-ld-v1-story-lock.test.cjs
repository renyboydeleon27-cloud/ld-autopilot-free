const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const guard=require('../narration-import.js').storyLock;
const base=Object.fromEntries(guard.STAGES.map(x=>[x,'Narrated and historically grounded event detail follows.']));
base.HOOK='What if you were trapped while the ceiling collapsed above your head?';
base.P1='In May 1960, families lived peacefully in southern Chile, working and following daily routines.';
base.P2='On May 21, the first powerful earthquakes struck near Concepción, damaging communities.';
base.P3='On May 22, a magnitude 9.5 earthquake struck southern Chile and unleashed devastating shaking.';
base.P14='Years afterward, the disaster reshaped scientific understanding of earthquakes and preparedness.';
base.ENDING=require('../narration-import.js').ENDING;

test('Original LD V1 accepts calm -> disturbance -> onset and all sixteen stages',()=>{
 const r=guard.review(base);assert.equal(r.ok,true,r.issues.join(' | '));
 assert.equal(guard.STAGES.length,16);
 assert.equal(r.beats.P1,'Peaceful life before disaster');
});
test('P1 Valdivia premature disaster aftermath is blocked locally',()=>{
 const p={...base,P1:'A day earlier, powerful earthquakes had struck near Concepción, damaging communities. But the worst shock was still to come.'};
 const r=guard.review(p);assert.equal(r.ok,false);assert(r.issues.some(x=>x.startsWith('P1:')),r.issues.join(' | '));
});
test('a foreshadowed disaster is not falsely treated as P1 actual collapse',()=>{
 const p={...base,P1:'Ordinary families worked each morning, unaware of the coming disaster before the earthquake struck.'};
 assert.equal(guard.review(p).ok,true,guard.review(p).issues.join(' | '));
});
test('HOOK cannot revert to unaddressed generic narration',()=>{
 const p={...base,HOOK:'In southern Chile an earthquake happened.'};
 assert(guard.review(p).issues.some(x=>x.startsWith('HOOK:')));
});
test('P2/P3 roles cannot be shuffled',()=>{
 assert(guard.review({...base,P2:'Ordinary families enjoyed a sunny morning.'}).issues.some(x=>x.startsWith('P2:')));
 assert(guard.review({...base,P3:'Stress continued building beneath the earth.'}).issues.some(x=>x.startsWith('P3:')));
});
test('mismatched P1 scene is rejected while intact calm street passes',()=>{
 assert(guard.sceneIssues('P1',base.P1,'1960 street with already-damaged building fronts and settled debris').length);
 assert.equal(guard.sceneIssues('P1',base.P1,'intact residential street with one resident taking a calm walk').length,0);
 assert.equal(guard.sceneIssues('P2',base.P2,'settled debris from previous shocks').length,0);
});
test('new lock requires explicit per-project activation; existing projects are not opted-in',()=>{
 const previous=globalThis.localStorage;
 const items=new Map([['ld-autopilot-free-active-project','brand-new-v1']]);
 globalThis.localStorage={getItem:k=>items.has(k)?items.get(k):null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)};
 try{
  assert.equal(guard.active('Valdivia Earthquake','shorts'),false);
  guard.activate('Valdivia Earthquake','shorts');
  assert.equal(guard.active('Valdivia Earthquake','shorts'),true);
  assert.equal(guard.active('Different production','shorts'),false);
  items.set('ld-autopilot-free-active-project','approved-legacy');
  assert.equal(guard.active('Valdivia Earthquake','shorts'),false);
  items.set('ld-autopilot-free-active-project','brand-new-v1');
  guard.clear('Valdivia Earthquake','shorts');
  assert.equal(guard.active('Valdivia Earthquake','shorts'),false);
 }finally{
  if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;
 }
});
test('paid audit pathways include a local story gate before provider calls',()=>{
 const smart=fs.readFileSync('smart-continue.js','utf8');
 const runtime=fs.readFileSync('ner-core-5-runtime.js','utf8');
 assert(smart.includes('assertOriginalV1StoryLock(card,true);'));
 assert(smart.indexOf('assertOriginalV1StoryLock(card,true);',smart.indexOf('async function prepareTextToVideo(card)'))<smart.indexOf('await ensureNarration(card);',smart.indexOf('async function prepareTextToVideo(card)')));
 assert(runtime.includes('v.issues.push(...originalV1Issues(c,s));'));
});
test('approved legacy panels still short circuit before any new story checks',()=>{
 const runtime=fs.readFileSync('ner-core-5-runtime.js','utf8');
 assert.match(runtime,/function preflight\(c\)\{if\(protectedPanel\(c\)\)return \{ok:true,issues:\[\],preserved:true\}/);
});

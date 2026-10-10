const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','ner-family-planner-v4.js'),'utf8');

function boot({topic='Aberfan Disaster — Wales — 1966',role='normal-world',family='generic-evidence',frozen=false}={}){
  const listeners={};
  const window={
    NERCore4:{
      topic:()=>topic,
      family:()=>family,
      spec:()=>({family,role}),
      frozen:()=>frozen
    },
    ldVideoContinuity:{year:'1966',location:'Aberfan, Wales'},
    LDCore:{saveCurrent:()=>true},
    addEventListener:(name,fn)=>{(listeners[name]||(listeners[name]=[])).push(fn);},
    dispatchEvent:()=>{}
  };
  const document={querySelectorAll:()=>[]};
  class CustomEvent{constructor(type,init){this.type=type;this.detail=init?.detail;}}
  vm.runInNewContext(source,{window,document,CustomEvent,setTimeout:()=>0,console});
  return window;
}

function card(narration,scene=''){
  const fields={
    '.narration':{value:narration},
    '.video-scene':{value:scene}
  };
  return {
    dataset:{stage:'P1',videoScene:scene},
    querySelector(selector){return fields[selector]||null;},
    fields
  };
}

{
  const window=boot();
  const old='KEEP CURRENT SCENE — CORE 4 FAMILY-PLANNED SCENE — P1 · generic-evidence · normal-world. LOCATION: an ordinary historically plausible local setting before visible disaster effects. PRIMARY ACTION: one adult performs one ordinary era-appropriate activity. TIMING: 0.0–2.0s establish the distinct setting and begin one purposeful action within the first half-second; 2.0–7.0s continue the same action with coherent cause/effect; 7.0–10.0s settle and hold.';
  const c=card('Aberfan was a Welsh mining village beneath huge coal-waste tips. High above the homes and school stood Tip Number Seven.',old);
  const plan=window.NERFamilyPlanner4.plan(c);
  assert.equal(plan.family,'landslide');
  assert.match(plan.location,/mining-village street/i);
  assert.match(plan.location,/coal-waste tip/i);
  assert.match(plan.action,/adult local worker walks steadily/i);
  assert.doesNotMatch(plan.action,/ordinary era-appropriate activity/i);
  assert.match(plan.timing,/0\.0–2\.0s:/);
  assert.match(plan.timing,/2\.0–7\.0s:/);
  assert.match(plan.timing,/7\.0–10\.0s:/);
  assert.equal(window.NERFamilyPlanner4.genericPlaceholder(old),true);
  assert.equal(window.NERFamilyPlanner4.apply(c),true,'stale generated KEEP CURRENT SCENE must be repaired');
  assert.match(c.dataset.videoScene,/LOCATION:/);
  assert.match(c.dataset.videoScene,/PRIMARY ACTION:/);
  assert.match(c.dataset.videoScene,/stable coal-waste tip/i);
  assert.doesNotMatch(c.dataset.videoScene,/one adult performs one ordinary era-appropriate activity/i);
  assert.deepEqual(window.NERFamilyPlanner4.audit(c),[]);
}

{
  const window=boot({topic:'Untitled Earthquake — Test — 1900'});
  const c=card('An earthquake struck the settlement after an ordinary morning.');
  assert.equal(window.NERFamilyPlanner4.plan(c).family,'earthquake','narration can recover a family when the topic classifier is generic');
  assert.doesNotMatch(window.NERFamilyPlanner4.plan(c).action,/ordinary era-appropriate activity/i);
}

{
  const window=boot({frozen:true});
  const c=card('Aberfan was a Welsh mining village beneath huge coal-waste tips.','');
  assert.equal(window.NERFamilyPlanner4.apply(c),false,'approved/frozen panels must never be rewritten');
}

console.log('Core 4 family planner concreteness tests passed');

const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),base=require('../ner-core-5.js');

(async()=>{
 const listeners=new Map();
 function eventTarget(){return {addEventListener(type,fn){const a=listeners.get(type)||[];a.push(fn);listeners.set(type,a);},removeEventListener(){}};}
 const windowObj=Object.assign(eventTarget(),{
  NERProjectStorage:{initialize:async()=>{},mount(){}},
  LDCore:{saveCurrent(){return true;}}
 });
 const original={
  src:'ner-core-5.js?v=5.1.9',attributes:[{name:'src',value:'ner-core-5.js?v=5.1.9'}],
  getAttribute(name){return name==='src'?'ner-core-5.js?v=5.1.9':null;},
  replaceWith(script){windowObj.NERCore5=base;queueMicrotask(()=>script.onload?.());}
 };
 const documentObj=Object.assign(eventTarget(),{
  querySelector(sel){if(sel==='main')return null;return null;},
  querySelectorAll(sel){return sel==='script[type="application/x-ner-module"]'?[original]:[];},
  createElement(){return {attributes:[],setAttribute(name,value){this[name]=value;}};},
  getElementById(){return null;},body:{prepend(){}}
 });
 const context={window:windowObj,document:documentObj,console,queueMicrotask,setTimeout,clearTimeout,Event:class{constructor(type){this.type=type;}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'ner-app-bootstrap.js'),'utf8'),context,{filename:'ner-app-bootstrap.js'});
 await new Promise(r=>setTimeout(r,10));
 const C=windowObj.NERCore5;assert.equal(C.crossTopicGuardVersion,'1.0.6');

 const topic='VALDIVIA EARTHQUAKE — SOUTHERN CHILE — 1960';
 const eventYear=1960,location='Southern Chile';
 const narrations={
  P1:'A day earlier, powerful earthquakes had struck near Concepción, damaging communities. But the worst shock was still to come.',
  P2:'At three-eleven in the afternoon, a magnitude nine-point-five earthquake ruptured southern Chile, shaking a vast stretch of the country.',
  P3:'Beneath the coast, the Nazca Plate was sliding under South America. A massive fault suddenly released enormous accumulated pressure.',
  P4:'Violent shaking toppled buildings and split roads. Across Valdivia and nearby towns, homes collapsed as residents scrambled for safety.',
  P5:'Electricity and communications were disrupted. Damaged roads and shattered neighborhoods left survivors struggling to reach one another.',
  P6:'The earthquake even changed the coastline. Some land rose while other areas sank, leaving communities exposed to new flooding.',
  P7:'Then, along parts of the coast, the sea pulled away. Its sudden retreat warned of another disaster approaching.',
  P8:'Tsunami waves rushed into coastal villages, including Queule. Houses were swept away as residents fled toward higher ground.',
  P9:'The tsunami crossed the Pacific. About fifteen hours later, destructive waves struck Hawaii, killing sixty-one people in Hilo.',
  P10:'The waves kept traveling. Japan was struck nearly a day after the earthquake, and coastal communities suffered deadly destruction.',
  P11:'Meanwhile, landslides blocked Lake Riñihue’s outlet in Chile. Water rose behind the debris, threatening another devastating flood.',
  P12:'Engineers, workers, and volunteers fought to open drainage channels. Their efforts helped limit the danger of a sudden flood.',
  P13:'Thousands of homes were destroyed. Chile estimated two million people were left homeless, while reported death tolls varied widely.',
  P14:'The disaster changed tsunami preparedness across the Pacific. In nineteen sixty-five, nations established a coordinated warning system.'
 };
 const expected={
  P1:['onset',/1960 street near Concepción/],
  P2:['onset',/1960 Southern Chile street at the mainshock onset/],
  P3:['cause-context',/coastal viewpoint above exposed natural rock strata/],
  P4:['human-impact',/Valdivia residential street during strong shaking/],
  P5:['human-impact',/visibly damaged overhead utility line/],
  P6:['human-impact',/former street edge/],
  P7:['cause-context',/newly exposed wet seabed/],
  P8:['displacement',/coastal village hillside above Queule/],
  P9:['human-toll',/1960 Hilo waterfront/],
  P10:['human-impact',/1960 Japanese coastal village/],
  P11:['human-impact',/1960 Lake Riñihue outlet/],
  P12:['response',/drainage trench through settled debris/],
  P13:['human-toll',/simple temporary shelter/],
  P14:['legacy',/representative 1965 Pacific tsunami preparedness office/]
 };
 const specs=[],predictedStages=Object.keys(narrations);
 for(const stage of predictedStages){
  const input={topic,stage,narration:narrations[stage],eventYear,location,facts:[],spec:null};
  const s=C.plan(input),[role,setting]=expected[stage];
  assert.equal(s.role,role,stage+' semantic role');
  assert.equal(s.family,'earthquake');
  assert.match(s.location.setting,setting,stage+' correct concrete scene');
  assert.equal(s.location.region,location,stage+' project location identity');
  assert.equal(s.cast.length,1);
  assert.equal(s.camera.framing,'eye-level medium-wide');
  assert.equal(s.chronology.sceneYear,stage==='P14'?1965:1960,stage+' scene year');
  assert.equal(base.validate(s).ok,true,stage+' strict free preflight: '+base.validate(s).issues.join('; '));
  const prompt=C.compile(s);
  assert.match(prompt,/VIDEO PROMPT — EXACTLY 10 SECONDS/);
  assert.match(prompt,/Strict true black-and-white grayscale, portrait 9:16/);
  assert.doesNotMatch(prompt,/supported (?:warning|hazard|contextual feature)|narrated (?:cause|onset|warning|non-graphic impact)/i);
  assert.doesNotMatch(prompt,/1923 urban interior|representative 1923 urban street/i);
  assert.match(prompt,/FAMILY BOUNDARY: /);
  specs.push(s);
 }
 const sequence=C.validateSequence(specs);
 assert.equal(sequence.ok,true,'full Valdivia P1–P14 stays chronological: '+sequence.issues.join('; '));
 assert.match(C.compile(specs.at(-1)),/Scene period: 1965; relation: later; scene year 1965/);
 assert.match(C.compile(specs[10]),/Lake Riñihue outlet is already blocked/);
 assert.match(C.compile(specs[6]),/before incoming tsunami waves/);
 assert.match(C.compile(specs[8]),/The trans-Pacific tsunami reaches Hilo/);
 assert.match(C.compile(specs[12]),/homelessness and uncertain death totals remain narration context/i);
 // Saved unapproved generic P2 placeholder is regenerated without paid audit.
 const p2Input={topic,stage:'P2',narration:narrations.P2,eventYear,location,facts:[]};
 const oldP2=base.clone(base.plan(p2Input));
 assert.equal(C.staleValdiviaGenerated(oldP2,p2Input),true,'exact old P2 placeholder detected');
 const healedP2=C.plan({...p2Input,spec:oldP2});
 assert.deepEqual(base.clone(healedP2),base.clone(specs[1]),'saved P2 generic placeholder upgraded to concrete one-action scene');
 // An untouched old tsunami template for P9 becomes Hilo, NOT generic Southern Chile.
 const p9Input={topic,stage:'P9',narration:narrations.P9,eventYear,location,facts:[]};
 const oldP9=base.clone(specs[8]);
 oldP9.cast[0].description='unnamed adult resident in clothing appropriate to the scene period';
 oldP9.location.setting='coastal road above the shoreline with abnormal tsunami inundation moving inland below, only at the level stated by the narration';
 delete oldP9.location.sceneRegion;
 oldP9.action.description='adult-1 takes one controlled step away from the waterfront edge';
 oldP9.camera.movement='slow-pull-back';
 oldP9.audio='water movement and restrained coastal ambience';
 assert.equal(C.staleValdiviaGenerated(oldP9,p9Input),true,'old generic tsunami P9 detected');
 const healedP9=C.plan({...p9Input,spec:oldP9});
 assert.equal(healedP9.location.sceneRegion,'Hilo, Hawaii, USA');
 assert.equal(healedP9.location.region,location);
 assert.equal(base.validate(healedP9).ok,true);
 // Customized location, action or camera must remain untouched and cannot be silently auto-migrated.
 const edited=base.clone(oldP9);
 edited.action.description='adult-1 scans the sheltered Hilo road from a stable balcony';
 assert.equal(C.staleValdiviaGenerated(edited,p9Input),false,'edited scene not a recognized automatic template');
 assert.equal(C.plan({...p9Input,spec:edited}).action.description,edited.action.description);
 const editedCamera=base.clone(oldP9);
 editedCamera.camera.movement='locked';
 assert.equal(C.staleValdiviaGenerated(editedCamera,p9Input),false);
 assert.equal(C.plan({...p9Input,spec:editedCamera}).camera.movement,'locked');
 // A real reviewed P1 remains byte-for-byte untouched; never regenerate approved stage.
 const p1=specs[0],savedP1=C.plan({topic,stage:'P1',narration:narrations.P1,eventYear,location,facts:[],spec:p1});
 assert.equal(C.staleValdiviaGenerated(p1,{topic,stage:'P1',narration:narrations.P1,eventYear}),false);
 assert.deepEqual(base.clone(savedP1),base.clone(p1),'P1 StageSpec retained');
 // Do not let Valdivia-specialized staging leak into another historical event.
 const kanto=C.plan({topic:'Great Kantō Earthquake — Tokyo and Yokohama, Japan — 1923',stage:'P1',
   narration:'On September 1, 1923, a magnitude 7.9 earthquake struck southern Kantō, violently shaking Japan’s capital and the nearby port city of Yokohama.',
   eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[]});
 assert.match(kanto.location.setting,/representative 1923 urban interior/);
 assert(!kanto.location.setting.includes('Valdivia'));
 assert.equal(base.validate(kanto).ok,true);
 console.log('PASS: full Valdivia P1–P14 semantic/scene/chronology preflight, 1965 legacy and local Hawaii/Japan/Queule/Lake geography.');
 console.log('PASS: saved default staging repairs, custom scenes persist, approved P1 and Great Kantō preserved; no external or paid API calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});

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
 const C=windowObj.NERCore5;assert.equal(C.crossTopicGuardVersion,'1.0.3');
 const topic='Great Kantō Earthquake — Tokyo and Yokohama, Japan — 1923';
 const narration='On September 1, 1923, a magnitude 7.9 earthquake struck southern Kantō, violently shaking Japan’s capital and the nearby port city of Yokohama.';
 const stale=base.plan({topic:'Xylazine Crisis — Philadelphia — 2020',stage:'P1',narration:'An outbreak changed daily life.',eventYear:2020,location:'Philadelphia, USA',facts:[]});
 const spec=C.plan({topic,stage:'P1',narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:stale});
 assert.equal(spec.topic,topic);assert.equal(spec.family,'earthquake');assert.equal(spec.eventYear,1923);assert.equal(spec.location.region,'Tokyo and Yokohama, Japan');
 assert.match(spec.location.setting,/1923 urban interior/i);assert.match(spec.action.description,/braces one hand against the low table/i);
 assert(!/supported (?:warning|hazard|contextual feature)|narrated (?:cause|onset|warning|non-graphic impact)/i.test(spec.location.setting+' '+spec.action.description));
 assert.deepEqual(base.validate(spec),{ok:true,issues:[]});
 const meta=C.metadata(topic,{year:'1952',location:'London, England'});assert.equal(meta.year,'1923');assert.equal(meta.location,'Tokyo and Yokohama, Japan');
 const p7=C.plan({topic,stage:'P7',narration:'The disaster reached beyond the burning cities. Tsunami waves struck parts of the Sagami Bay coast, adding destruction along the shoreline.',eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null});
 assert.equal(p7.family,'earthquake');assert.match(p7.location.setting,/coastal road/i);assert.equal(base.validate(p7).ok,true);
 // Great Kanto panel classification regression: common background nouns such as
 // bridges and parks must NOT override the actual action and disaster phase.
 const narrativeBeats=[
  ['P2','Buildings collapsed across Tokyo and Yokohama. Wooden homes, brick structures, roads, and bridges failed as powerful shaking tore through the cities.',/urban street during strong shaking/i,/falling masonry/i],
  ['P5','As flames advanced, residents fled with whatever they could carry. Huge numbers crowded into parks, open grounds, and other temporary refuges.',/visible route from a damaged neighborhood/i,/quick restrained footsteps/i],
  ['P9','Water, electricity, railways, roads, bridges, and communications were badly disrupted. Survivors struggled inside a region whose basic systems had suddenly failed.',/damaged local street beside a blocked period transport route/i,/quiet damaged-street/i],
  ['P13','Reconstruction reshaped Tokyo and Yokohama. New roads, bridges, parks, schools, and other infrastructure became part of a vast effort to rebuild safer cities.',/representative reconstruction work area/i,/restrained work-site/i]
 ];
 for(const [stage,narration,setting,audio] of narrativeBeats){
  const scene=C.plan({topic,stage,narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null});
  assert.match(scene.location.setting,setting,stage+' expected setting');
  assert.match(scene.audio,audio,stage+' expected audio');
  assert.equal(base.validate(scene).ok,true,stage+' validates');
 }
 // A saved P5 draft from the previous matcher can be internally valid yet
 // depict reconstruction. Repair only the exact generated legacy staging.
 const p5Narration='As flames advanced, residents fled with whatever they could carry. Huge numbers crowded into parks, open grounds, and other temporary refuges.';
 const p5Input={topic,stage:'P5',narration:p5Narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[]};
 const oldP5=base.clone(C.plan({...p5Input,spec:null}));
 oldP5.location.setting='representative reconstruction work area with one partly rebuilt street edge and period-appropriate materials';
 oldP5.action.description='adult-1 places one small paving stone into an unfinished street edge';
 oldP5.audio='restrained work-site ambience';
 assert.equal(base.validate(oldP5).ok,true,'stale scene is syntactically valid');
 assert.equal(C.misroutedEvacuation(oldP5),true);
 const repairedP5=C.plan({...p5Input,spec:oldP5});
 assert.match(repairedP5.location.setting,/route from a damaged neighborhood toward an open refuge ground/i);
 assert.match(repairedP5.action.description,/carrying one small plain bundle/i);
 assert.match(repairedP5.audio,/footsteps and distant fire/i);
 assert.match(C.compile(repairedP5),/FAMILY BOUNDARY: Earthquake damage and local fire spread/i);
 assert.equal(base.validate(repairedP5).ok,true);
 // A genuinely personalized P5 scene and the true P13 reconstruction remain
 // unchanged rather than being rewritten by the migration heuristic.
 const customized=base.clone(oldP5);
 customized.location.setting='period-appropriate evacuation route toward a visible open refuge ground';
 customized.action.description='adult-1 walks steadily toward the open refuge with a small satchel';
 customized.audio='soft footsteps and distant street ambience';
 assert.equal(C.misroutedEvacuation(customized),false);
 const retained=C.plan({...p5Input,spec:customized});
 assert.equal(retained.location.setting,customized.location.setting);
 assert.equal(retained.action.description,customized.action.description);
 assert.equal(retained.audio,customized.audio);
 console.log('PASS: stale valid-looking P5 paving-stone scene becomes evacuation; custom P5 remains unchanged.');
 // Regression: P3 explicitly depicts a narrated fire, so the FAMILY BOUNDARY
 // must support local fuel-driven fire spread instead of ambiguously banning fire.
 const p3=C.plan({topic,stage:'P3',narration:'The earthquake struck near lunchtime, when many cooking fires were burning. Flames erupted across damaged neighborhoods and spread rapidly in strong winds.',eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null});
 const p3Prompt=C.compile(p3);
 assert.match(p3.location.setting,/small fire has begun spreading/i);
 assert.match(p3Prompt,/FAMILY BOUNDARY: Earthquake damage and local fire spread follow the narrated phase/);
 assert.doesNotMatch(p3Prompt,/no unrelated tsunami or fire/i);
 assert.match(p3Prompt,/No unrelated tsunami, unsupported explosion, or instant citywide inferno/i);
 assert.match(C.compile(spec),/FAMILY BOUNDARY: Supported shaking precedes structural failure; no unrelated tsunami or fire/);
 assert(C.compile(p7).includes('in Tokyo and Yokohama, Japan.'));
 const p8=C.plan({topic,stage:'P8',narration:'The shaking also triggered landslides and debris flows. At Nebukawa, near present-day Odawara, a massive collapse buried homes and killed hundreds.',eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null});
 assert.match(C.compile(p8),/FAMILY BOUNDARY: Earthquake-triggered landslide damage/);
 // Nebukawa is a panel-local narrated place, not the project identity.
 assert.equal(p8.location.region,'Tokyo and Yokohama, Japan');
 assert.equal(p8.location.sceneRegion,'Nebukawa, near Odawara, Kanagawa Prefecture, Japan');
 const p8Prompt=C.compile(p8);
 assert(p8Prompt.includes('in Nebukawa, near Odawara, Kanagawa Prefecture, Japan.'),'P8 prompt uses narrated site');
 assert(!p8Prompt.includes('in Tokyo and Yokohama, Japan.'),'P8 prompt must not append project-wide city to local site');
 assert.equal(C.payload(p8).location,'Tokyo and Yokohama, Japan');
 // Old same-project P8 template is corrected only when it is exact-generated.
 const oldP8=base.clone(p8);delete oldP8.location.sceneRegion;
 assert.equal(C.missingP8Site(oldP8),true);
 const fixedP8=C.plan({topic,stage:'P8',narration:p8.narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:oldP8});
 assert.equal(fixedP8.location.sceneRegion,p8.location.sceneRegion);
 const personalizedP8=base.clone(oldP8);
 personalizedP8.location.setting='safe footpath overlooking the Nebukawa hillside with settled damaged homes';
 assert.equal(C.missingP8Site(personalizedP8),false);
 const keptP8=C.plan({topic,stage:'P8',narration:p8.narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:personalizedP8});
 assert.equal(keptP8.location.setting,personalizedP8.location.setting);
 assert.equal(keptP8.location.sceneRegion,undefined);
 // Non-P8 coastal panels retain their old project-wide presentation.
 assert.equal(p7.location.sceneRegion,undefined);
 assert.match(C.compile(p7),/in Tokyo and Yokohama, Japan\\./);
 const wrongPlace=base.clone(p8);wrongPlace.location.sceneRegion='';
 assert.equal(base.validate(wrongPlace).ok,false);
 console.log('PASS: P8 local Nebukawa geography is independent of Tokyo–Yokohama project identity and saved custom scenes.');
 const smog=base.clone(base.plan({topic:'The Great Smog of London — 1952',stage:'P3',narration:'Smoke hung over London streets.',eventYear:1952,location:'London, England',facts:[]}));
 // The pure planner leaves unreviewed pollution scenes as placeholders;
 // construct a valid reviewed fixture before compiling its family guard.
 smog.location.setting='London residential pavement beside visible railings in a dense pollution haze';
 smog.action.description='adult-1 takes one cautious step beside the visible railing';
 assert.equal(base.validate(smog).ok,true);
 assert.match(base.compile(smog),/FAMILY BOUNDARY: Pollution and visibility follow the narrated phase/);
 console.log('PASS: P3 fire, P7 tsunami, P8 landslide are allowed only in their narrated phase; P1 shaking and Great Smog boundaries remain unchanged.');
 console.log('PASS: P2 collapse, P5 evacuation, P9 infrastructure, P13 reconstruction stay distinct without false keyword matches.');
 console.log('PASS: stale public-health StageSpec cannot override current earthquake identity; Great Kanto scenes are concrete and local-only; zero network/API calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
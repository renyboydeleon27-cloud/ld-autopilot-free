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
 const topic='Great Kantō Earthquake — Tokyo and Yokohama, Japan — 1923';
 const narration='On September 1, 1923, a magnitude 7.9 earthquake struck southern Kantō, violently shaking Japan’s capital and the nearby port city of Yokohama.';
 const stale=base.plan({topic:'Xylazine Crisis — Philadelphia — 2020',stage:'P1',narration:'An outbreak changed daily life.',eventYear:2020,location:'Philadelphia, USA',facts:[]});
 const spec=C.plan({topic,stage:'P1',narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:stale});
 assert.equal(spec.topic,topic);assert.equal(spec.family,'earthquake');assert.equal(spec.eventYear,1923);assert.equal(spec.location.region,'Tokyo and Yokohama, Japan');
 assert.match(spec.location.setting,/1923 urban interior/i);assert.match(spec.action.description,/braces one hand against the low table/i);
 assert(!/supported (?:warning|hazard|contextual feature)|narrated (?:cause|onset|warning|non-graphic impact)/i.test(spec.location.setting+' '+spec.action.description));
 assert.deepEqual(base.validate(spec),{ok:true,issues:[]});
 const meta=C.metadata(topic,{year:'1952',location:'London, England'});assert.equal(meta.year,'1923');assert.equal(meta.location,'Tokyo and Yokohama, Japan');
 // Another earthquake project MUST NOT inherit 1923 Great Kanto room/streets.
 // P1 recounts previous-day shocks near Concepción, not May 22 mainshock.
 const chileTopic='1960 Valdivia Earthquake — Southern Chile — 1960';
 const chileP1Narration='A day earlier, powerful earthquakes had struck near Concepción, damaging communities. But the worst shock was still to come.';
 const chileInput={topic:chileTopic,stage:'P1',narration:chileP1Narration,eventYear:1960,location:'Southern Chile',facts:[],spec:null};
 const chile=C.plan(chileInput);
 assert.equal(chile.role,'onset');
 assert.equal(chile.chronology.sceneYear,1960);
 assert.match(chile.location.setting,/representative 1960 street near Concepción/i);
 assert.match(chile.location.setting,/already-damaged building fronts and settled debris from the previous day/i);
 assert.doesNotMatch(chile.location.setting,/\b1923\b/);
 assert.match(chile.action.description,/comes to a cautious stop at the safe edge/i);
 assert.equal(base.validate(chile).ok,true,'Valdivia P1 new scene validates');
 const chilePrompt=C.compile(chile);
 assert.match(chilePrompt,/CHRONOLOGY: Historical event year 1960. Scene period: 1960/);
 assert.match(chilePrompt,/FAMILY BOUNDARY: The narrated earlier-earthquake aftermath precedes the mainshock/);
 assert.doesNotMatch(chilePrompt,/Supported shaking precedes structural failure/);
 assert.doesNotMatch(chilePrompt,/\b1923\b/);
 // Simulate already-reviewed Valdivia P1 saved with the old exact auto 1923 room.
 const oldChile=base.clone(chile);
 oldChile.location.setting='representative 1923 urban interior with a low table and period-appropriate household objects visibly shaking while the main structure remains intact';
 oldChile.action.description='adult-1 braces one hand against the low table as the room shakes';
 oldChile.camera.movement='slow-push-in';
 oldChile.audio='rattling household objects and low structural creaking';
 assert.equal(C.misdatedEarthquakeTemplate(oldChile,chileInput),true,'exact auto-generated old template recognized');
 assert.equal(base.validate(oldChile).ok,false,'free preflight catches stale historical year');
 const repairedChile=C.plan({...chileInput,spec:oldChile});
 assert.equal(base.validate(repairedChile).ok,true);
 assert.deepEqual(base.clone(repairedChile),base.clone(chile),'saved unapproved scene repairs only outdated generated template');
 assert.equal(C.payload(repairedChile).location,'Southern Chile');
 const customChile=base.clone(oldChile);
 customChile.action.description='adult-1 inspects a cracked wooden frame from stable ground';
 assert.equal(C.misdatedEarthquakeTemplate(customChile,chileInput),false,'do not silently reset human-edited 1923 scene');
 const retainedCustom=C.plan({...chileInput,spec:customChile});
 assert.equal(retainedCustom.action.description,customChile.action.description);
 assert.equal(base.validate(retainedCustom).ok,false,'user-edited wrong-year scene still stops before paid audit');
 // Also fix the 1923 normal-world template without rewriting true 1923 output.
 const mexico='2017 Puebla Earthquake — Mexico — 2017';
 const newer=C.plan({topic:mexico,stage:'P1',narration:'A calm morning preceded the disaster.',eventYear:2017,location:'Puebla, Mexico',facts:[],spec:null});
 assert.match(newer.location.setting,/intact representative 2017 urban street/);
 assert.doesNotMatch(newer.location.setting,/\b1923\b/);
 assert.match(spec.location.setting,/representative 1923 urban interior/i);
 assert.equal(base.validate(spec).ok,true,'Great Kantō 1923 original P1 preserved');
 assert.equal(C.misdatedEarthquakeTemplate(spec,{topic,stage:'P1',eventYear:1923}),false,'never migrate correct 1923 project');
 console.log('PASS: Valdivia 1960 P1 earlier shocks are year-correct; saved generated 1923 leakage repairs safely, edited/approved prompts preserved.');
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
 // Reproduce a same-project saved P9 with valid-but-wrong reconstruction
 // staging, not just the correctly generated fresh P9 already tested above.
 const p9Narration='Water, electricity, railways, roads, bridges, and communications were badly disrupted. Survivors struggled inside a region whose basic systems had suddenly failed.';
 const p9Input={topic,stage:'P9',narration:p9Narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[]};
 const oldP9=base.clone(C.plan({...p9Input,spec:null}));
 oldP9.location.setting='representative reconstruction work area with one partly rebuilt street edge and period-appropriate materials';
 oldP9.action.description='adult-1 places one small paving stone into an unfinished street edge';
 oldP9.audio='restrained work-site ambience';
 oldP9.camera.movement='lateral-track'; // actual legacy P9 uses reconstruction camera, not current slow-push-in
 assert.equal(base.validate(oldP9).ok,true,'stale P9 StageSpec is structurally valid');
 assert.equal(C.misroutedInfrastructure(oldP9),true,'recognizes only the wrong autogenerated template');
 const correctedP9=C.plan({...p9Input,spec:oldP9});
 assert.match(correctedP9.location.setting,/damaged local street beside a blocked period transport route/i);
 assert.match(correctedP9.action.description,/stops at the blocked route and looks across/i);
 assert.match(correctedP9.audio,/quiet damaged-street ambience/i);
 assert.match(C.compile(correctedP9),/FAMILY BOUNDARY: Earthquake-damaged infrastructure and blocked transport/i);
 assert.equal(C.payload(correctedP9).location,p9Input.location);
 assert.equal(base.validate(correctedP9).ok,true);
 const customP9=base.clone(oldP9);
 customP9.action.description='adult-1 inspects a broken water conduit from a safe street edge';
 assert.equal(C.misroutedInfrastructure(customP9),false);
 const preservedP9=C.plan({...p9Input,spec:customP9});
 assert.equal(preservedP9.action.description,customP9.action.description);
 const cameraCustomized=base.clone(oldP9);
 cameraCustomized.camera.movement='locked';
 assert.equal(C.misroutedInfrastructure(cameraCustomized),false,'edited camera is not an autogenerated legacy P9');
 const placeCustomized=base.clone(oldP9);
 placeCustomized.location.sceneRegion='A specified damaged street in Japan';
 assert.equal(C.misroutedInfrastructure(placeCustomized),false,'edited scene place is preserved');
 const p13Rebuild=C.plan({topic,stage:'P13',narration:'Reconstruction reshaped Tokyo and Yokohama. New roads, bridges, parks, schools, and other infrastructure became part of a vast effort to rebuild safer cities.',eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null});
 assert.match(p13Rebuild.action.description,/places one small paving stone/i);
 assert.equal(C.misroutedInfrastructure(p13Rebuild),false);
 console.log('PASS: saved P9 reconstruction staging repaired to systems failure; customized P9, P13 reconstruction preserved.');
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
 // P10 describes the *settled burned aftermath* of fire deaths, not an
 // unrelated fire or an active spreading blaze. Fresh and reviewed scenes
 // must compile the same phase-specific human-toll family boundary.
 const p10Narration='Around 105,000 people were killed or left missing. Fire caused most of the deaths, turning the earthquake into one of Japan’s deadliest disasters.';
 const p10Input={topic,stage:'P10',narration:p10Narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null};
 const p10=C.plan(p10Input);
 assert.equal(p10.role,'human-toll');
 assert.match(p10.location.setting,/settled burned urban aftermath/i);
 assert.match(p10.action.description,/slowly lowers their head/i);
 assert.equal(base.validate(p10).ok,true);
 const p10Prompt=C.compile(p10);
 const p10Boundary='FAMILY BOUNDARY: Earthquake and fire aftermath follow the narrated human-toll phase. Show only settled burn damage and supported structural loss; no visible bodies, unrelated tsunami, renewed collapse, or active citywide fire surge.';
 assert(p10Prompt.includes(p10Boundary),'P10 must permit narrated settled fire aftermath');
 assert(!p10Prompt.includes('FAMILY BOUNDARY: Supported shaking precedes structural failure'),'P10 cannot fall back to the unrelated generic earthquake guard');
 const p10Reviewed=C.plan({...p10Input,spec:base.clone(p10)});
 assert(C.compile(p10Reviewed).includes(p10Boundary),'saved matching reviewed P10 also compiles the corrected guard');
 const noFireToll=C.plan({...p10Input,narration:'Around 105,000 people were killed or left missing, making this one of Japan’s deadliest disasters.'});
 assert(!C.compile(noFireToll).includes(p10Boundary),'do not invent a fire-related toll where narration does not mention fire');
 assert.match(C.compile(noFireToll),/FAMILY BOUNDARY: Supported shaking precedes structural failure/);
 assert(!C.compile(p7).includes(p10Boundary),'coastal tsunami must keep its own boundary');
 assert(!C.compile(p3).includes(p10Boundary),'active fire spread must keep its own boundary');
 console.log('PASS: P10 death-toll burned aftermath receives a settled-fire boundary; P1, P3, P7, P9 retain phase-specific guards.');
 // P11 is a narrated rumor-driven killing aftermath, not active shaking.
 // Both a fresh scene and the saved/reviewed StageSpec must use the restrained
 // non-graphic social-violence rule, leaving earthquake physics elsewhere.
 const p11Narration='In the chaos, false rumors fueled killings of Koreans, Chinese, and even some Japanese—another tragedy driven by fear, discrimination, and misinformation.';
 const p11Input={topic,stage:'P11',narration:p11Narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null};
 const p11=C.plan(p11Input);
 assert.equal(p11.role,'cause-context','P11 carries narrated social context');
 assert.match(p11.location.setting,/quiet non-graphic street aftermath representing fear and social violence/i);
 assert.match(p11.action.description,/comes to a stop beside a closed doorway and lowers their gaze/i);
 assert.equal(base.validate(p11).ok,true);
 const p11Boundary='FAMILY BOUNDARY: Fear-driven social violence aftermath follows the narrated phase. Keep the scene non-graphic and representative only; no visible attack, no bodies, no ethnic caricature, no mob action, and no invented ceremony. No unrelated tsunami, fire surge, or renewed structural collapse.';
 const p11Prompt=C.compile(p11);
 assert(p11Prompt.includes(p11Boundary),'P11 must have non-graphic social violence phase guard');
 assert(!p11Prompt.includes('FAMILY BOUNDARY: Supported shaking precedes structural failure'),'P11 must not fall through to shaking physics');
 assert(C.compile(C.plan({...p11Input,spec:base.clone(p11)})).includes(p11Boundary),'matching saved/reviewed P11 compiles the corrected guard');
 assert.equal(C.payload(p11).location,'Tokyo and Yokohama, Japan','historical project identity stays unchanged');
 const customSocialScene=base.clone(p11);
 customSocialScene.location.setting='quiet street scene near a closed wooden doorway without depicted violence';
 assert.equal(base.validate(customSocialScene).ok,true);
 assert(!C.compile(customSocialScene).includes(p11Boundary),'do not force social-violence scene guard onto customized unrelated staging');
 assert(!C.compile(p10).includes(p11Boundary),'P10 burned deaths must retain its own guard');
 assert(!C.compile(p3).includes(p11Boundary),'P3 active fire must retain its own guard');
 assert(!C.compile(p7).includes(p11Boundary),'P7 tsunami must retain its own guard');
 console.log('PASS: P11 rumor killings use non-graphic social-violence aftermath; custom scenes and other earthquake stages retain their own family boundaries.');
 // P12 is organized relief after shaking, not renewed structural failure.
 // Fresh and saved/reviewed P12 must compile an action-limited humanitarian
 // response boundary without changing the narration or saved StageSpec.
 const p12Narration='Relief slowly became organized. Rail links and electricity began returning, while volunteers, officials, and outside aid supported survivors across the devastated region.';
 const p12Input={topic,stage:'P12',narration:p12Narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null};
 const p12=C.plan(p12Input);
 assert.equal(p12.role,'response','P12 is relief response');
 assert.match(p12.location.setting,/organized non-graphic relief area among settled earthquake damage/i);
 assert.match(p12.action.description,/carries one closed plain supply box to a nearby stable table/i);
 assert.equal(base.validate(p12).ok,true,'P12 validates');
 const p12Boundary='FAMILY BOUNDARY: Organized relief follows the narrated post-earthquake response phase. Show only the stated primary relief action among settled damage; rail and electricity restoration remain narration context, not extra scene actions. No renewed shaking, fresh collapse, unrelated fire surge or tsunami, invented crowd action, or instant infrastructure repair.';
 const p12Prompt=C.compile(p12);
 assert(p12Prompt.includes(p12Boundary),'P12 must compile an organized relief boundary');
 assert(!p12Prompt.includes('FAMILY BOUNDARY: Supported shaking precedes structural failure'),'P12 must not imply renewed shaking');
 const savedP12=C.plan({...p12Input,spec:base.clone(p12)});
 assert(C.compile(savedP12).includes(p12Boundary),'matching reviewed P12 gets the corrected boundary without StageSpec reset');
 assert.deepEqual(base.clone(savedP12),base.clone(p12),'approved scene remains identical');
 assert.equal(C.payload(savedP12).location,'Tokyo and Yokohama, Japan','project geographic identity remains unchanged');
 const customP12=base.clone(p12);
 customP12.location.setting='quiet street beside a modest residential shelter after the earthquake';
 assert.equal(base.validate(customP12).ok,true,'custom P12 scene stays valid');
 assert(!C.compile(customP12).includes(p12Boundary),'do not force relief guard onto a custom unrelated staging');
 assert(!C.compile(spec).includes(p12Boundary),'P1 shaking keeps its own guard');
 assert(!C.compile(p3).includes(p12Boundary),'P3 active fire keeps its own guard');
 assert(!C.compile(p7).includes(p12Boundary),'P7 coastal inundation keeps its own guard');
 assert(!C.compile(p10).includes(p12Boundary),'P10 burned loss keeps its own guard');
 assert(!C.compile(p11).includes(p12Boundary),'P11 social violence keeps its own guard');
 assert(!C.compile(p13Rebuild).includes(p12Boundary),'P13 reconstruction keeps its own guard');
 console.log('PASS: P12 organized relief replaces shaking boundary for fresh/reviewed P12; custom and approved other phases remain unchanged.');
 // P13 describes active reconstruction work in the recovery phase, NOT
 // renewed earthquake shaking. Keep representative staging and project identity.
 const p13Narration='Reconstruction reshaped Tokyo and Yokohama. New roads, bridges, parks, schools, and other infrastructure became part of a vast effort to rebuild safer cities.';
 const p13Input={topic,stage:'P13',narration:p13Narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null};
 const p13=C.plan(p13Input);
 assert.equal(p13.role,'recovery','P13 is recovery, not onset');
 assert.match(p13.location.setting,/reconstruction work area with one partly rebuilt street edge/i);
 assert.match(p13.action.description,/places one small paving stone into an unfinished street edge/i);
 assert.equal(p13.camera.movement,'lateral-track','keep P13 camera movement');
 assert.equal(base.validate(p13).ok,true,'P13 StageSpec validates');
 const p13Boundary='FAMILY BOUNDARY: Earthquake reconstruction follows the narrated recovery phase. Show only the stated bounded rebuilding action with period-appropriate materials; the partly rebuilt street remains unfinished. No renewed shaking, fresh structural collapse, unrelated tsunami or fire surge, instant fully rebuilt city, invented crowd action, or ceremony.';
 assert(C.compile(p13).includes(p13Boundary),'P13 fresh reconstruction compiles recovery-specific boundary');
 assert(!C.compile(p13).includes('FAMILY BOUNDARY: Supported shaking precedes structural failure'),'P13 does not inherit active shaking');
 const p13Saved=C.plan({...p13Input,spec:base.clone(p13)});
 assert(C.compile(p13Saved).includes(p13Boundary),'P13 saved/reviewed scene retains new family boundary');
 assert.deepEqual(base.clone(p13Saved),base.clone(p13),'no StageSpec changes for saved P13');
 assert.equal(C.payload(p13Saved).location,'Tokyo and Yokohama, Japan','do not change geography');
 const customP13=base.clone(p13);
 customP13.location.setting='one settled earthquake-damaged street awaiting rebuilding';
 assert.equal(base.validate(customP13).ok,true,'custom P13 is valid');
 assert(!C.compile(customP13).includes(p13Boundary),'do not override customized reconstruction staging');
 const noRebuildNarration=base.clone(p13);
 noRebuildNarration.narration='Some people walked through damaged streets seeking shelter.';
 noRebuildNarration.source.narration=noRebuildNarration.narration;
 noRebuildNarration.role='cause-context';
 assert.equal(base.validate(noRebuildNarration).ok,true);
 assert(!C.compile(noRebuildNarration).includes(p13Boundary),'recovery guard needs role and narrative together');
 for(const [id,s] of [['P1',spec],['P3',p3],['P7',p7],['P8',p8],['P9',correctedP9],['P10',p10],['P11',p11],['P12',p12]]){
   assert(!C.compile(s).includes(p13Boundary),id+' retains its existing phase guard');
 }
 console.log('PASS: P13 reconstruction gets recovery-specific boundary for fresh and saved scenes; prior panels, custom scenes and other families remain unchanged.');
 // P14: the 1960 Disaster Prevention Day designation is long-term legacy.
 // Saved P14 generated under the former cause-context role must retain scene
 // fields while the compiler derives the corrected legacy role and boundary.
 const p14Narration='In 1960, Japan designated September first as Disaster Prevention Day, preserving the earthquake’s lessons for generations facing disasters still to come.';
 const p14Input={topic,stage:'P14',narration:p14Narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null};
 const p14=C.plan(p14Input);
 assert.equal(p14.role,'legacy','1960 Disaster Prevention Day must be classified as legacy');
 assert.equal(p14.chronology.relation,'later');
 assert.equal(p14.chronology.sceneYear,1960,'1960 period is preserved');
 assert.match(p14.location.setting,/later-period community preparedness setting/i);
 assert.match(p14.action.description,/pauses beside a plain emergency-supply cabinet and looks toward it/i);
 assert.equal(p14.camera.movement,'locked');
 assert.equal(p14.audio,'quiet indoor ambience');
 assert.equal(base.validate(p14).ok,true,'new P14 legacy scene validates');
 const p14Boundary='FAMILY BOUNDARY: Disaster-prevention legacy follows the narrated later-period preparedness phase. Show only the stated restrained primary action at a representative community preparedness setting; the official designation is narration context, not a visible ceremony. No renewed shaking, structural collapse, fire surge, tsunami, readable signage, invented officials, or crowd action.';
 const p14Prompt=C.compile(p14);
 assert(p14Prompt.includes('STAGE ROLE: legacy; family: earthquake.'),'P14 new role compiled');
 assert(p14Prompt.includes('Scene period: 1960; relation: later; scene year 1960.'),'P14 scene year unmodified');
 assert(p14Prompt.includes(p14Boundary),'P14 gets the later preparedness boundary');
 assert(!p14Prompt.includes('FAMILY BOUNDARY: Supported shaking precedes structural failure'),'P14 has no active shaking guard');
 const oldP14=base.clone(p14);
 oldP14.role='cause-context'; // Exact legacy role problem in build 5.1.20
 const p14Updated=C.plan({...p14Input,spec:oldP14});
 assert.equal(p14Updated.role,'legacy','re-derive role from narration while retaining saved scene');
 for(const field of ['location','action','cast','camera','audio','narration','chronology','timing','facts'])
   assert.deepEqual(base.clone(p14Updated[field]),base.clone(p14[field]),field+' preserved');
 assert.equal(base.validate(p14Updated).ok,true,'old reviewed scene revalidated as legacy');
 assert(C.compile(p14Updated).includes(p14Boundary),'old reviewed P14 gets phase-specific boundary');
 assert.equal(C.payload(p14Updated).location,p14Input.location,'keep parent project identity');
 const customP14=base.clone(p14);
 customP14.location.setting='quiet unmarked outdoor place during a later community remembrance';
 assert.equal(base.validate(customP14).ok,true,'custom later legacy staging is valid');
 assert(!C.compile(customP14).includes(p14Boundary),'do not force preparedness guard onto changed setting');
 const wrongPeriodP14=base.clone(p14);
 wrongPeriodP14.chronology.relation='event';
 wrongPeriodP14.chronology.sceneYear=1923;
 wrongPeriodP14.chronology.period='1923';
 assert(!C.compile(p13).includes(p14Boundary),'P13 reconstruction is not P14 legacy');
 assert(!C.compile(p12).includes(p14Boundary),'P12 response is not P14 legacy');
 assert(!C.compile(p11).includes(p14Boundary),'P11 human tragedy is not P14 legacy');
 assert(!C.compile(p10).includes(p14Boundary),'P10 toll is not P14 legacy');
 assert(!C.compile(p7).includes(p14Boundary),'P7 tsunami is not P14 legacy');
 assert(!C.compile(p3).includes(p14Boundary),'P3 fire is not P14 legacy');
 assert(!C.compile(spec).includes(p14Boundary),'P1 shaking is not P14 legacy');
 const otherLegacy=base.clone(p14);
 otherLegacy.narration='Decades later the community remembered the earthquake with quiet reflection.';
 otherLegacy.source.narration=otherLegacy.narration;
 otherLegacy.role='legacy';
 otherLegacy.chronology={relation:'later',sceneYear:null,period:'unspecified later period',basis:otherLegacy.narration};
 assert.equal(base.validate(otherLegacy).ok,true,'unrelated legacy scene stays valid');
 assert(!C.compile(otherLegacy).includes(p14Boundary),'non-Disaster Prevention Day legacy does not acquire P14 guard');
 console.log('PASS: P14 later-period legacy role and guard; old saved P14 restored without scene rewrite; other approved phases unchanged.');
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
 assert(C.compile(p7).includes('in Tokyo and Yokohama, Japan.'));
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
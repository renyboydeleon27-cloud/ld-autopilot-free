/* LD AUTO v3.40.4 — title-driven shared setting + cinematic consistency + controlled character diversity / anti-clone system. */
(function(){'use strict';
const T2V_POLICY_VERSION='3.40.12-panel-scene-identity-v1';
function supports(card){if(window.ldStoryEpisode)return /^P[1-9]\d*$/.test(card.dataset.stage);return /^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage);}
function current(){return document.getElementById('projectTitle').textContent;}
function style(){var locked=window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle;if(locked==='real'||locked==='anime')return locked;var selected=document.getElementById('visualMode')?.value;if(selected==='real'||selected==='anime')return selected;return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?'real':'anime';}
function colorMode(){var locked=window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode;if(locked==='bw'||locked==='color')return locked;return style()==='real'?'bw':'color';}
function format(){return document.getElementById('format').value;}
function state(card){return {mode:card.dataset.videoMode||'image',text:card.dataset.textVideoPrompt||'',scene:card.dataset.videoScene||'',signature:card.dataset.textVideoSignature||''};}
function titleDefaults(topic){
 var raw=String(topic||'').trim();
 var year=(raw.match(/\b(?:1\d{3}|20\d{2}|2100)\b/)||[])[0]||'';
 var parts=raw.split(/\s+(?:—|–|-)\s+/).map(function(x){return String(x||'').trim();}).filter(Boolean);
 var location='';
 if(parts.length>=3){
   var last=parts[parts.length-1];
   if(/^\d{4}$/.test(last)){
     year=year||last;
     location=parts[parts.length-2];
   }else{
     location=parts[1]||'';
   }
 }
 location=String(location||'').replace(/\b(?:1\d{3}|20\d{2}|2100)\b/g,'').replace(/^[\s,;:\-]+|[\s,;:\-]+$/g,'').trim();
 if(/\bSan Francisco Earthquake\b/i.test(raw)&&/^California,\s*USA$/i.test(location))location='San Francisco, California, USA';
 return {year:year,location:location,details:''};
}
function defaults(topic){return titleDefaults(topic);}
function hydrateContinuityFromTitle(){
 var inferred=titleDefaults(current());
 var existing=window.ldVideoContinuity&&typeof window.ldVideoContinuity==='object'&&!Array.isArray(window.ldVideoContinuity)?window.ldVideoContinuity:{};
 var next={...existing};
 if(!String(next.year||'').trim()&&inferred.year)next.year=inferred.year;
 if(!String(next.location||'').trim()&&inferred.location)next.location=inferred.location;
 if(next.details==null)next.details='';
 window.ldVideoContinuity=next;
 return next;
}
function continuity(){var c=Object.assign(defaults(current()),window.ldVideoContinuity||{});if(/\bSan Francisco Earthquake\b/i.test(current())&&/^California,\s*USA$/i.test(String(c.location||'').trim()))c.location='San Francisco, California, USA';return c;}
function ready(){if(window.LDStoryModes?.enabled())return true;var c=continuity();return /^\d{4}$/.test(c.year)&&!!c.location.trim();}
function monochromeRequired(){return colorMode()==='bw';}
function generatedVisualDna(){
 var c=continuity();
 var year=/^\d{4}$/.test(String(c.year||''))?String(c.year):'historical era';
 var location=cleanLocation(c.location)||'the confirmed event location';
 var setting=location+', '+year;
 if(style()==='anime'){
   if(colorMode()==='bw'){
     return 'AUTO VISUAL DNA — MONOCHROME HISTORICAL ANIME: Serious 2D historical anime / graphic-novel visual world for '+setting+' in STRICT true black-and-white grayscale only. ZERO color, ZERO selective color, ZERO sepia, ZERO tint, ZERO muted color accents. Detailed hand-drawn linework, grayscale tonal rendering and ink-like shading. Grounded adult human proportions. Historically accurate clothing, architecture, tools, transport, terrain, vegetation, crops when relevant, utilities and technology. Cinematic historical-documentary composition, natural depth and physically believable disaster motion. Preserve one consistent monochrome anime visual world from HOOK through P14 while allowing each panel its own historically correct sublocation, camera view and action. No live action, no photorealism, no glossy 3D CGI, no chibi, no modern objects outside the era and no embedded text.';
   }
   return 'AUTO VISUAL DNA — HISTORICAL ANIME: Serious 2D historical anime / graphic-novel visual world for '+setting+'. Detailed hand-drawn linework and painted 2D backgrounds, grounded adult human proportions, historically accurate clothing, architecture, tools, transport, terrain, vegetation, crops when relevant, utilities and technology. Cinematic documentary composition, natural depth and physically believable disaster motion. Keep one consistent character-design language, rendering style and chapter visual world from HOOK through P14 while allowing each panel to use its own historically correct sublocation, camera view and action. No live action, no photorealism, no 3D CGI, no glossy render, no chibi, no modern objects outside the era, no embedded text.';
 }
 if(colorMode()==='bw'){
   return 'AUTO VISUAL DNA — REAL HUMAN MONOCHROME: Photorealistic historical live-action documentary world for '+setting+'. STRICT true black-and-white grayscale only. No color, sepia, tint or selective color. Real adult humans with natural anatomy, skin, hair and fabric; historically accurate clothing, architecture, tools, transport, terrain, vegetation, utilities and technology. Cinematic documentary composition, practical lighting, natural depth and physically believable disaster motion. Preserve one consistent monochrome visual world from HOOK through P14 while allowing each panel its own historically correct sublocation, camera view and action. No anime, no illustration, no 3D CGI, no glossy artificial render, no modern objects outside the era, no embedded text.';
 }
 return 'AUTO VISUAL DNA — REAL HUMAN: Photorealistic historical live-action documentary world for '+setting+'. Real adult humans with natural anatomy, skin, hair and fabric; historically accurate clothing, architecture, tools, transport, terrain, vegetation, utilities and technology. Cinematic documentary composition, practical lighting, natural depth and physically believable disaster motion. Keep one consistent chapter visual world from HOOK through P14 while allowing each panel to use its own historically correct sublocation, camera view and action. No anime, no illustration, no 3D CGI, no glossy artificial render, no modern objects outside the era, no embedded text.';
}
function effectiveVisualDna(){
 var c=continuity();
 var base=generatedVisualDna();
 var extra=String(c.details||'').trim();
 return base+(extra?'\nADVANCED VISUAL OVERRIDE: '+extra:'');
}
function refreshAutoDnaUi(root){
 root=root||document.getElementById('chapterVideoContext');
 if(!root)return;
 var field=root.querySelector('.video-auto-dna');
 if(field)field.value=generatedVisualDna();
}
function universalHookDna(){
 if(colorMode()!=='bw')return '';
 if(style()==='anime'){
   return 'UNIVERSAL MONOCHROME ANIME VISUAL DNA — HOOK + P1–P14:\nSTRICT true black-and-white grayscale from frame 1 through frame 10.\nNo color.\nNo sepia.\nNo tint.\nNo selective color.\nSerious 2D historical anime / graphic-novel rendering.\nDetailed hand-drawn linework.\nGrayscale tonal shading and restrained ink-like contrast.\nGrounded realistic adult anatomy.\nHistorically accurate environment and period objects.\nDocumentary-style cinematic staging.\nNo live action.\nNo photorealism.\nNo glossy 3D CGI.\nNo chibi.\nBLACK-AND-WHITE PRIORITY: every visible element must remain true grayscale for the entire shot. If an inherited instruction conflicts with this rule, the monochrome rule wins.';
 }
 return 'UNIVERSAL MONOCHROME REAL-HUMAN VISUAL DNA — HOOK + P1–P14:\nSTRICT true black-and-white grayscale.\nNo color.\nNo sepia.\nNo tint.\nNo selective color.\nPhotorealistic historical live-action.\nArchival documentary / newsreel capture.\nSoft optical detail.\nOrganic film grain.\nSlight gate weave.\nRestrained exposure flicker.\nSame visual world as the approved HOOK for the current episode.\nBLACK-AND-WHITE PRIORITY: The entire 10-second shot must remain true grayscale from start to finish. No colorization or color returning in skin, clothing, sky, water, vegetation, fire, lightning, debris or any other visible element. If any inherited instruction conflicts with this monochrome rule, ignore that conflicting color instruction.';
}
function cleanLocation(value){
 var s=String(value||'').trim();
 s=s.replace(/\bYEAR\s*:\s*\d{4}\b/gi,'').replace(/\bLOCATION\s*:\s*/gi,'').replace(/^[\s,;:\-]+|[\s,;:\-]+$/g,'').replace(/\s{2,}/g,' ');
 return s;
}
function textOnlyAccuracyLock(){
 var mode=window.LDProjectLocks?.videoMode?.()||window.ldProjectLocks?.videoMode||'';
 if(mode!=='text')return '';
 return 'TEXT-ONLY ACCURACY LOCK:\nThis production does not rely on an image or photo reference. Visual accuracy must come from the locked event year, location, approved narration facts, disaster-family progression, event-specific panel locks and the current panel role.\nClothing, architecture, streets, homes, tools, transport, crops, terrain, vegetation, utilities, signs, infrastructure and technology must remain historically appropriate to the event year and location.\nNever invent a specific historical fact merely to make the scene more dramatic. Never introduce a later disaster stage early. Do not copy visual geography, people or event-specific facts from another production.';
}
function lock(){
 if(window.LDStoryModes?.enabled())return window.LDStoryModes.identity();
 var c=continuity();
 var location=cleanLocation(c.location)||'UNCONFIRMED — specify the chapter location';
 return 'CHAPTER CONTINUITY LOCK:\nEvent: '+current()+'.\nEvent year: '+(c.year||'UNCONFIRMED')+'.\nMain location: '+location+'.\n'+effectiveVisualDna()+'\nThe auto visual DNA controls the shared chapter rendering language and is generated from Visual Style + Color Treatment + event year + main location. Clothing, architecture, crops, terrain, transport, utilities, tools and technology must match this event and location. Use the same chapter visual world from HOOK through P14, with distinct sublocations and camera views. P1 returns to normal life before the event; later panels follow their own historical time and narrative beat. Recovery or wider-impact panels may change date or location only when explicitly established by that panel. Never carry peak destruction into a pre-disaster scene. Keep recurring adult appearance and wardrobe consistent when adults are present. No invented historical facts.'+(textOnlyAccuracyLock()?'\n'+textOnlyAccuracyLock():'')+'\nEND CHAPTER CONTINUITY LOCK.';
}
function stripLock(s){return String(s||'').replace(/\s*CHAPTER CONTINUITY LOCK:[\s\S]*?END CHAPTER CONTINUITY LOCK\./g,'').trim();}
function stripColorConflicts(prompt){
 var s=String(prompt||'');
 if(monochromeRequired()){
   s=s.replace(/Natural color and believable lighting\.?/gi,'STRICT BLACK-AND-WHITE grayscale only.')
      .replace(/\bnatural color\b/gi,'black-and-white grayscale')
      .replace(/\bfull color\b/gi,'black-and-white grayscale')
      .replace(/\bcolored\b/gi,'monochrome')
      .replace(/\bcolorized\b/gi,'monochrome')
      .replace(/(?<!no )\bsepia\b/gi,'black-and-white grayscale')
      .replace(/\btinted\b/gi,'black-and-white grayscale')
      .replace(/(?<!no )\bselective color\b/gi,'black-and-white grayscale');
 }
 return s;
}
function absoluteStyleLock(){
 if(style()==='anime'){
   return colorMode()==='bw'
     ? 'ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: 2D HISTORICAL ANIME ONLY. Render every frame as hand-drawn 2D historical anime / graphic-novel animation in strict true black-and-white grayscale. NEVER render live-action footage, photorealistic people, photographic skin, camera-captured humans, 3D CGI humans, or a documentary/newsreel photographic look. Documentary language elsewhere refers only to composition and historical seriousness, NOT to live-action rendering. If any other wording conflicts, THIS 2D ANIME LOCK WINS.'
     : 'ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: 2D HISTORICAL ANIME ONLY. Render every frame as hand-drawn 2D historical anime / graphic-novel animation. NEVER render live-action footage, photorealistic people, photographic skin, camera-captured humans, or 3D CGI humans. Documentary language elsewhere refers only to composition and historical seriousness, NOT to live-action rendering. If any other wording conflicts, THIS 2D ANIME LOCK WINS.';
 }
 return colorMode()==='bw'
   ? 'ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: PHOTOREALISTIC REAL HUMAN LIVE ACTION ONLY in strict true black-and-white grayscale. No anime, no illustration, no graphic-novel rendering, no 3D CGI people. If any other wording conflicts, THIS REAL-HUMAN LOCK WINS.'
   : 'ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: PHOTOREALISTIC REAL HUMAN LIVE ACTION ONLY. No anime, no illustration, no graphic-novel rendering, no 3D CGI people. If any other wording conflicts, THIS REAL-HUMAN LOCK WINS.';
}
function sanitizeSceneForStyle(value){
 var s=String(value||'').trim();
 if(style()==='anime'){
   s=s.replace(/\bphotorealistic\s+(?:real\s+human\s+)?(?:historical\s+)?live[- ]action\b/gi,'2D historical anime')
      .replace(/\bphotorealistic\s+real\s+human\b/gi,'2D historical anime')
      .replace(/\breal[- ]human\s+live[- ]action\b/gi,'2D historical anime');
 }else{
   s=s.replace(/\bserious\s+2D\s+historical\s+(?:graphic[- ]novel\/)?anime(?:\s+animation)?\b/gi,'photorealistic historical live action')
      .replace(/\b2D\s+historical\s+anime(?:\s*\/\s*graphic[- ]novel)?\b/gi,'photorealistic historical live action');
 }
 return cleanSceneText(s);
}
function promptStyleCompatible(text){
 if(window.LDStoryModes?.enabled())return !/\bCHAPTER CONTINUITY LOCK:\s*Event:/i.test(String(text||''));
 var s=String(text||'');
 if(style()==='anime'){
   var affirmative=/ABSOLUTE RENDERING MODE[^\n]*2D HISTORICAL ANIME ONLY/i.test(s)
     && /(?:2D historical anime|graphic[- ]novel\/anime animation|hand-drawn 2D historical anime)/i.test(s);
   var opposite=/(?:^|\n)\s*(?:PHOTOREALISTIC\s+REAL\s+HUMAN|PHOTOREALISTIC\s+LIVE[- ]ACTION|Photorealistic historical live[- ]action)/im.test(s);
   return affirmative&&!opposite;
 }
 var affirmativeReal=/ABSOLUTE RENDERING MODE[^\n]*PHOTOREALISTIC REAL HUMAN LIVE ACTION ONLY/i.test(s)
   && /Photorealistic REAL HUMAN historical documentary recreation|PHOTOREALISTIC REAL HUMAN LIVE ACTION ONLY/i.test(s);
 var oppositeAnime=/(?:^|\n)\s*(?:Serious 2D historical graphic[- ]novel\/anime animation|AUTO VISUAL DNA — MONOCHROME HISTORICAL ANIME)/im.test(s);
 return affirmativeReal&&!oppositeAnime;
}
function childHookException(prompt){
 var s=String(prompt||'');
 if(!/THIS HOOK REQUIRES ONE CHILD CHARACTER|FINAL PRIORITY REMINDER:[\s\S]*child/i.test(s))return '';
 return [
  'TOPIC-SPECIFIC CHILD HOOK EXCEPTION — FINAL PRIORITY:',
  'For this HOOK only, every inherited adult-only or adult-anatomy instruction is overridden.',
  'The required subject is ONE clearly young child approximately 7–9 years old with child body proportions, youthful face and period-appropriate child winter clothing.',
  'Do not age-up, mature, replace or transform the child into a teenager or adult.',
  'This exception applies only to the HOOK and does not change the adult-character rule for P1–P14 unless another panel explicitly says otherwise.'
 ].join('\\n');
}
function withLock(prompt){
 if(window.LDStoryModes?.enabled())return String(prompt||'');
 var base=stripColorConflicts(stripLock(prompt));
 if(!ready())return base;
 var childException=childHookException(base);
 return absoluteStyleLock()+'\n\n'+base+'\n\n'+(universalHookDna()?universalHookDna()+'\n\n':'')+lock()+(childException?'\n\n'+childException:'');
}
const SCENE_BANK_50=[
 ['inside a modest family kitchen','interior'],['inside a small dining room','interior'],['inside a private bedroom','interior'],['inside a washroom','interior'],['inside a sitting room','interior'],
 ['inside a home hallway','interior'],['inside a stair landing','interior'],['inside a boarding house room','interior'],['inside a neighborhood shop','interior'],['inside a period market stall','interior'],
 ['inside a tailor workshop','interior'],['inside a carpenter workshop','interior'],['inside a bakery workroom','interior'],['inside a school room','interior'],['inside a small hotel lobby','interior'],
 ['inside a railway waiting room','interior'],['inside a station office','interior'],['inside a warehouse','interior'],['inside a factory workroom','interior'],['inside a horse-drawn carriage','vehicle'],
 ['inside a period tram carriage','vehicle'],['inside a passenger rail carriage','vehicle'],['inside a period motor vehicle if documented for the year and place','vehicle'],['inside a home entryway','interior'],['inside a public building corridor','interior'],
 ['at a residential street corner','exterior'],['at a market street','exterior'],['at a town square','exterior'],['at a rail crossing','exterior'],['beside a station platform','exterior'],
 ['at a waterfront landing if present locally','exterior'],['along a period bridge approach if present locally','exterior'],['outside a modest house','exterior'],['in a shared courtyard','exterior'],['in a small garden','exterior'],
 ['at a workshop yard','exterior'],['beside a warehouse loading area','exterior'],['on a neighborhood sidewalk','exterior'],['at an alley opening','exterior'],['outside a public building','exterior'],
 ['at a carriage stop','exterior'],['beside a street market','exterior'],['on an open work yard','exterior'],['at a farmyard if relevant locally','exterior'],['along an appropriate local footpath','exterior'],
 ['at a neighborhood intersection','exterior'],['at an open plaza if present locally','exterior'],['beside a period transport stop','exterior'],['along a residential lane','exterior'],['outside a station entrance if present locally','exterior']
];
const SCENE_BANK_LATE=[
 {stage:10,place:'at a damaged residential street where adults search for survivors',tag:'rescue'},
 {stage:10,place:'outside a damaged home during a careful search',tag:'rescue'},
 {stage:10,place:'at an accessible rescue staging point beside the damage',tag:'rescue'},
 {stage:10,place:'beside a blocked route as responders clear a safe passage',tag:'rescue'},
 {stage:10,place:'at a temporary first-aid area if treatment is narrated',tag:'medical'},
 {stage:10,place:'inside a period-appropriate treatment room if medical care is narrated',tag:'medical'},
 {stage:11,place:'at a temporary shelter for displaced residents',tag:'shelter'},
 {stage:11,place:'inside a simple communal shelter if documented',tag:'shelter'},
 {stage:11,place:'at a modest local relief distribution point',tag:'relief'},
 {stage:11,place:'outside a damaged home as residents retrieve essentials',tag:'relief'},
 {stage:11,place:'at a period-appropriate medical aid point if treatment is narrated',tag:'medical'},
 {stage:12,place:'along a damaged neighborhood street showing wider consequences',tag:'general'},
 {stage:12,place:'at a damaged transport route when the narration names transport',tag:'transport'},
 {stage:12,place:'beside damaged public utilities when the narration names utilities',tag:'utilities'},
 {stage:12,place:'at affected shops and workplaces when the narration names livelihoods',tag:'economy'},
 {stage:12,place:'at affected farmland when the narration names crops or agriculture',tag:'agriculture'},
 {stage:13,place:'at a cleared section of a still-damaged street',tag:'recovery'},
 {stage:13,place:'outside a damaged home during cautious cleanup',tag:'recovery'},
 {stage:13,place:'at a repairable public building during gradual cleanup',tag:'recovery'},
 {stage:13,place:'at a damaged worksite during period-appropriate repairs',tag:'recovery'},
 {stage:13,place:'at a recovering field when the narration names farming',tag:'agriculture'},
 {stage:14,place:'on a quiet overlook of the affected community',tag:'legacy'},
 {stage:14,place:'beside a surviving street facing the lasting damage',tag:'legacy'},
 {stage:14,place:'at a community gathering place reflecting on the aftermath',tag:'legacy'},
 {stage:14,place:'beside a slowly recovering landscape',tag:'legacy'}
];
function lateSceneFits(item,card){
 var narration=String(card.querySelector('.narration')?.value||'').toLowerCase();
 if(item.tag==='medical')return /injur|medical|treat|patient|hospital|clinic|care|wound/.test(narration);
 if(item.tag==='transport')return /road|rail|bridge|transport|route|traffic/.test(narration);
 if(item.tag==='utilities')return /power|electric|water supply|utility|utilities|pipeline/.test(narration);
 if(item.tag==='economy')return /factor|business|shop|workplace|econom|livelihood|market/.test(narration);
 if(item.tag==='agriculture')return /crop|farm|field|seed|plant|agricultur/.test(narration);
 return true;
}
function sceneBankHash(value){var h=2166136261;for(var i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return h>>>0;}
function availableScenes(card){
 var n=stageNumber(card.dataset.stage),fam=familyKey();
 if(n>=10){return SCENE_BANK_LATE.map(function(row,i){return {place:row.place,kind:'late',index:SCENE_BANK_50.length+i,stage:row.stage,tag:row.tag};}).filter(function(row){return row.stage===n&&lateSceneFits(row,card);});}
 return SCENE_BANK_50.map(function(row,index){return {place:row[0],kind:row[1],index:index};}).filter(function(row){
  if(row.kind==='vehicle'&&(!/^19\d\d$|^20\d\d$/.test(String(continuity().year||''))||n>=6))return false;
  if((fam==='tsunami'||fam==='cyclone'||fam==='flood'||fam==='volcano'||fam==='wildfire')&&n>=4&&n<=8&&row.kind!=='exterior')return false;
  if(fam==='insect'&&/tram|rail|waterfront|bridge|station|motor vehicle/.test(row.place))return false;
  return true;
 });
}
function smartSceneItem(card){
 var pool=availableScenes(card);
 if(!pool.length)return null;
 var key=[current(),continuity().year,continuity().location,card.dataset.stage].join('|');
 var start=sceneBankHash(key)%pool.length;
 var n=stageNumber(card.dataset.stage);
 var previous=document.querySelector('.stage-card[data-stage="P'+(n-1)+'"]');
 var previousPlace=String(previous?.dataset.videoScene||'');
 for(var i=0;i<pool.length;i++){
  var candidate=pool[(start+i)%pool.length];
  if(!previousPlace.includes(candidate.place))return candidate;
 }
 return pool[start];
}
function activateSmartDefault(){
 panelCards().forEach(function(card){
  if(!sceneChoiceAllowed(card)||!ready())return;
  var item=smartSceneItem(card);if(!item)return;
  card.dataset.sceneChoice=String(item.index);
  card.dataset.videoScene='SMART RANDOM CHOICE — '+selectedScene(card,item.index);
  var scene=card.querySelector('.video-scene');if(scene)scene.value=card.dataset.videoScene;
  var picker=card.querySelector('.scene-choice');if(picker)picker.value='smart';
  card.dataset.textVideoPrompt='';card.dataset.textVideoSignature='';
  var text=card.querySelector('.text-video-prompt');if(text)text.value='';
  if(card.dataset.videoMode==='text'){try{rebuildTextPrompt(card);}catch(e){update(card);}}
 });
 saveCurrent();
}
function selectedScene(card,index){
 var item=availableScenes(card).find(function(row){return row.index===index;});
 if(!item)return '';
 var n=stageNumber(card.dataset.stage),beat=String(card.querySelector('.narration')?.value||'').trim();
 var phase=n<=2?'intact ordinary life before the disaster':n<=6?'the current panel’s established disaster stage':n<=8?'wider damage or a documented secondary hazard':n===9?'the immediate aftermath':n===10?'rescue or emergency response supported by the narration':n===11?'relief, displacement or short-term human needs':n===12?'wider documented consequences':n===13?'gradual cleanup or recovery':'the event’s reflective closing beat';
 return 'PRIMARY LOCATION: '+item.place+', in '+cleanLocation(continuity().location)+', '+continuity().year+'. Depict '+phase+' with one readable action immediately. '+(beat?'PANEL NARRATIVE CONTEXT (never spoken): '+beat+' ':'')+'Use historically appropriate occupants, clothing, construction and objects for this exact place. Preserve the earthquake/disaster progression and previously established conditions. Do not invent unverified weather, dust, wind, transport or damage. One coherent camera move; distinct angle and cast from the previous panel. No speech, music, embedded text or modern objects.';
}
function sceneChoiceIndex(card){
 var saved=String(card.dataset.sceneChoice||'');
 if(saved!=='')return saved;
 var scene=String(card.dataset.videoScene||card.querySelector('.video-scene')?.value||'').replace(/^SMART RANDOM CHOICE — /,'');
 var found=SCENE_BANK_50.findIndex(function(row){return scene.startsWith('PRIMARY LOCATION: '+row[0]+',');});
 if(found>=0)return String(found);
 var later=SCENE_BANK_LATE.findIndex(function(row){return scene.startsWith('PRIMARY LOCATION: '+row.place+',');});
 return later<0?'':String(SCENE_BANK_50.length+later);
}
function sceneChoiceAllowed(card){
 if(window.LDStoryModes?.enabled())return false;
 var special=eventPanel(card.dataset.stage);
 return !card.querySelector('.done-toggle')?.checked&&(!special||!special.approved)&&card.dataset.stage!=='P2';
}
function choiceSpecial(card,special){
 if(!special||sceneChoiceIndex(card)===''||special.approved)return special;
 return {...special,scene:selectedScene(card,Number(sceneChoiceIndex(card))),
  narrative:'Follow only this panel’s approved narration and story stage visually; no spoken narration or invented historical claims.',
  timing:card.dataset.stage==='P3'&&/San Francisco Earthquake/i.test(current())?'0.0–1.0s: Visible first quake tremor begins within 0.5 seconds in the selected place; adults notice moving fixtures.\\n1.0–7.0s: Sustained shaking rattles loose objects and adults brace naturally without peak collapse.\\n7.0–10.0s: Continue clear early shaking and stop before later-stage structural failure.':'0.0–2.0s: Establish the selected place, cast and panel action immediately.\n2.0–7.0s: Follow the same event stage with physically coherent motion and no new unverified event fact.\n7.0–10.0s: Reveal one clear consequence appropriate to this panel, without replaying the preceding panel.',
  camera:'One continuous grounded camera move suited to the selected location, distinct from the previous panel.',
  physics:'Use only the supported panel disaster beat, with plausible object motion, stable identities and no invented large-scale failure.',
  audio:'Only quiet audible effects from visible objects and movement at this location. No voices, music, unsupported wind, rumble or impact.',
  extraNegative:'No duplicated cast, unverified weather, dust or invented historical facts.'};
}
function rotatingScene(card){
 if(window.LDStoryModes?.enabled())return '';
 if(!supports(card)||state(card).scene||state(card).text||eventPanel(card.dataset.stage))return '';
 var n=stageNumber(card.dataset.stage),fam=familyKey();
 if(n===2)return ''; // Keep verified source/mechanism scenes anchored.
 var candidates=availableScenes(card);
 if(!candidates.length)return '';
 var key=current()+'|'+continuity().year+'|'+continuity().location;
 var offset=sceneBankHash(key)%candidates.length;
 var index=(offset+(n-1)*17)%candidates.length;
 var choice=candidates[index].place;
 var beat=String(card.querySelector('.narration')?.value||'').trim();
 var role=n<=2?'ordinary life before the disaster':n<=8?'the current panel’s disaster beat':n===9?'the immediate aftermath':n===10?'rescue and emergency response':n===11?'relief and short-term needs':n===12?'wider consequences':n===13?'gradual cleanup or recovery':'a reflective legacy beat';
 return 'SCENE BANK — unique panel setting: '+choice+', within '+cleanLocation(continuity().location)+', '+continuity().year+'. Stage only '+role+'. '+(beat?'Narrative context (never spoken in the generated video): '+beat+' ':'')+'Show the event-specific action only when physically plausible at this place and this point in the sequence. Keep historically valid architecture, transport, clothing and cast. If this venue does not exist at the documented event location or conflicts with the panel facts, use the nearest verified local equivalent. Do not add an unrelated disaster, unsupported specific damage or modern objects. Use a camera angle and foreground action distinct from adjacent panels.';
}
function sceneFrom(card){var existing=state(card).scene;if(existing)return existing;
var variant=rotatingScene(card);if(variant)return variant;
var image=card.querySelector('.image-prompt').value||'';
image=image.replace(/ERA-AWARE CAPTURE LOCK:[\s\S]*?END ERA LOCK\.?/gi,'');
// The opening scene description precedes the renderer/style locks in existing packs.
image=image.split(/Serious colored|Cinematic historical live-action realism|COMPOSITION LOCK:|SCENE VARIETY LOCK:/i)[0];
image=image.replace(/^Create\s+(?:the Living Disaster Book\s+)?(?:P\d+)\s+(?:illustration|live-action historical frame)\s+for\s+[^.]*\./i,'').replace(/\b(?:portrait 9:16|landscape 16:9)\.?/gi,'').trim();
return cleanSceneText(image||card.querySelector('.narration').value.trim());}
function cleanSceneText(value){
 var s=String(value||'').trim();
 s=s.replace(/\.\s*\.+/g,'.').replace(/\s{2,}/g,' ');
 var m=s.match(/^Scene role:\s*[^.]+\.\s*Visual beat:\s*([\s\S]+)$/i);
 if(m)s=m[1].trim();
 return s.replace(/\.\s*\.$/,'.').trim();
}
function scientificScene(card,scene){
 var source=(String(scene||'')+' '+String(card.querySelector('.narration')?.value||'')).toLowerCase();
 return /scientific cutaway|documentary cutaway|geological|tectonic stress|beneath the seafloor|below the seafloor|deep beneath|plate boundary|fault beneath|underground cross-section|magma chamber|subsurface/.test(source);
}
function isLituya1958(){
 var t=String(current()||'').toLowerCase();
 return t.includes('lituya bay')&&t.includes('1958');
}
function lituyaCause(stage){
 if(!isLituya1958())return null;
 var map={
  P1:{
   approved:true,
   approvedLabel:'FINAL APPROVED — LITUYA P1',
   scientific:false,
   scene:'Calm normal life at remote Lituya Bay, Alaska, in 1958 before any visible sign of disaster. Show the back or three-quarter back of one elderly adult man outside a modest period-appropriate wooden cabin near the bay, quietly tending or standing beside neatly arranged clay flower pots. The bay and steep mountains sit peacefully in the background. Everything is stable and ordinary: no earthquake shaking, no falling objects, no rockslide, no unusual water motion, no tsunami, no panic, and no destruction. Preserve the same elderly man, cabin, flower-pot language, remote shoreline world, and strict black-and-white archival DNA established by the approved HOOK, but return the story to calm pre-disaster life.',
   narrative:'Life at remote Lituya Bay appears calm and ordinary before the earthquake begins.',
   timing:'0.0–2.0s: Establish the quiet 1958 cabin-side setting, elderly man, flower pots, calm bay, and mountains. Nothing dangerous happens.\n2.0–7.0s: Sustain natural ordinary-life motion only: restrained body movement, faint clothing movement, gentle environmental motion, and calm water.\n7.0–10.0s: Hold the peaceful pre-disaster composition and end with no warning event yet, preserving a clear contrast with the coming earthquake.',
   camera:'One restrained historical documentary shot with a very subtle slow push or stable observational framing. Keep the elderly man, cabin-side flower pots, bay, and mountains readable together. No cuts, no transitions, no orbit, no time-lapse, and no disaster-camera behavior.',
   physics:'This is the normal-world panel. All objects remain stable and gravity behaves normally. No tremor, no falling flower pot, no cracks, no slope movement, no sudden water rise, and no invented precursor. Preserve plausible 1958 objects, clothing, terrain, and natural motion.',
   audio:'Quiet natural bay ambience, light wind, faint water, subtle cabin-side environmental sounds only. No earthquake rumble, no voiceover, and no music.',
   extraNegative:'No earthquake yet. No shaking. No falling flower pot. No rockslide. No tsunami. No abnormal water. No destruction. No panic. No modern objects. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark, or any on-screen text.'
  },
  P2:{
   approved:true,
   approvedLabel:'FINAL APPROVED — LITUYA P2',
   scientific:true,
   scene:'A restrained scientific documentary cutaway of the Fairweather Fault zone beneath the region near Lituya Bay. Show tectonic stress building along the fault just before and at the beginning of rupture. Massive rock layers are under extreme pressure. The strata strain, subtly deform, and begin to shift mainly in a horizontal shearing motion. The geological force must feel powerful but controlled and believable. The rock layers remain largely intact. This panel explains the hidden earthquake source only. Do not create a giant open chasm, collapsing trench, cave-in, large rock blocks falling into a void, seabed collapse, underwater landslide, mountain rockslide, or tsunami.',
   narrative:'Tectonic stress along the Fairweather Fault reaches a critical point, and the earthquake rupture begins beneath the region near Lituya Bay.',
   timing:'0.0–2.0s: Establish the geological setting clearly. Show layered rock under pressure in a serious documentary cutaway style. Subtle motion begins within the first half-second.\n2.0–7.0s: Show restrained fault strain and the beginning of rupture through realistic horizontal shearing, tension, and slight structural offset. Keep the motion grounded and believable.\n7.0–10.0s: Sustain the unstable buildup and finish on a clear image of mounting tectonic force and active rupture, without jumping ahead to the mountainside rockslide or tsunami.',
   camera:'A slow lateral track revealing the geological scene depth. Fixed focal length, natural depth and occlusion. Never pass through solid objects unnaturally. No cuts, no transitions, no orbit, no time-lapse. Keep the shot serious, readable, and documentary-like.',
   physics:'This panel is an explanatory scientific visualization. Do not depict invisible subsurface processes as ordinary eyewitness footage. Keep the mechanism restrained, physically plausible, and geologically grounded. Show primarily horizontal fault displacement. No fantasy energy, no glowing cracks, no sci-fi light effects, no exaggerated destruction, and no impossible motion.',
   audio:'Low deep-earth rumble, restrained rock strain, subtle subsurface vibration, and natural documentary ambience only. No voiceover. No music.',
   extraNegative:'No human figures. No seabed cave-in. No underwater landslide. No giant underground collapse. No giant open trench. No dramatic vertical pit opening. No falling rock blocks into a void. No mountain collapse yet. No visible tsunami yet. No fantasy glowing cracks. No sci-fi visuals. ABSOLUTE NO-TEXT: no labels, geological names, year, captions, titles, typography, logos, watermark, or any on-screen text.'
  },
  P3:{
   approved:true,
   approvedLabel:'FINAL APPROVED — LITUYA P3',
   scientific:false,
   scene:'The earthquake reaches the Lituya Bay region. Show a remote shoreline area near the bay with steep mountain walls in the background, dense forest, rough natural terrain, and a few period-appropriate details such as a small wooden structure, dock elements, moored boat, or simple outdoor equipment. Strong seismic shaking is already underway. Trees shudder, loose rock shifts, the ground trembles, and the environment reacts violently but realistically. If adult people are present, keep them few in number and show them reacting naturally to the shaking. This panel must clearly communicate that the earthquake is striking the region, but the catastrophic mountainside rockslide has not happened yet and the tsunami is not visible yet.',
   narrative:'Strong earthquake shaking strikes the Lituya Bay region and destabilizes the steep terrain around the head of the bay.',
   timing:'0.0–2.0s: Establish the shoreline or bay-side setting clearly. The earthquake shaking is already active within the first half-second.\n2.0–7.0s: Sustain strong realistic seismic motion across the environment. Trees, loose rock, small structures, shoreline details, and any visible boats or equipment react naturally to the shaking.\n7.0–10.0s: Maintain the dangerous shaking and end on a clear sense that the landscape is being destabilized, without jumping ahead to the full mountainside rockslide or tsunami.',
   camera:'A restrained handheld-feeling documentary shot or a grounded lateral/forward observational move is allowed, but keep it readable and realistic. Fixed focal behavior, natural depth and occlusion. Never pass through solid objects. No cuts, no transitions, no orbit, no time-lapse. The camera may react subtly to the shaking, but do not make it chaotic or unreadable.',
   physics:'This panel shows the real earthquake impact on the visible environment. Keep all motion physically plausible and historically grounded. Structures, trees, rocks, shoreline, and water must respond with believable seismic behavior. Do not exaggerate into fantasy destruction. Do not show the major mountainside collapse yet. Do not show the tsunami yet.',
   audio:'Earthquake rumble, wood creaking, rock shifting, tree movement, light shoreline water disturbance, and natural environment SFX only. No voiceover. No music.',
   extraNegative:'No duplicated people. No distorted anatomy. No morphing. No unrelated disaster. No modern objects. No modern vehicles. No fantasy destruction. No mountain rockslide yet. No massive slope collapse yet. No visible tsunami yet. No seabed collapse as wave source. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark, or any on-screen text.'
  },
  P4:{
   approved:true,
   approvedLabel:'FINAL APPROVED — LITUYA P4',
   scientific:false,
   scene:'At the head of Lituya Bay, the steep mountainside is beginning to fail under violent earthquake shaking. Show rugged near-vertical terrain with exposed rock, broken slope surfaces, scattered vegetation, and trees clinging to the slope. Cracks widen through rock and surface material. Loose boulders, smaller rocks, soil, and trees begin shifting downslope. Parts of the slope buckle and break free, but the main catastrophic rockslide has not yet fully plunged into the water. This is the final unstable moment before the giant mountainside collapse.',
   narrative:'The earthquake destabilizes the steep mountainside at the head of Lituya Bay, pushing the slope toward catastrophic collapse.',
   timing:'0.0–2.0s: Establish the steep mountainside clearly. Instability is visible within the first half-second through shaking rock, widening cracks, and shifting surface material.\n2.0–7.0s: Sustain the slope-failure buildup. More fractures open, loose material slides, trees lean or break free, and the mountainside grows visibly more unstable.\n7.0–10.0s: Intensify the imminent-collapse feeling and end with the slope about to give way completely, without yet showing the full rockslide plunging into the water.',
   camera:'A grounded observational documentary shot with a restrained lateral track or restrained push-in. Keep the mountainside readable and imposing. Fixed focal behavior, natural depth and occlusion. Never pass through solid objects. No cuts, no transitions, no orbit, no time-lapse. Subtle earthquake camera reaction is allowed, but the frame must remain readable.',
   physics:'This panel shows real slope destabilization caused by earthquake shaking. Rocks, trees, soil, and debris must move with believable gravity and seismic cause-and-effect. Do not exaggerate into fantasy destruction. Do not show the full rockslide entering the water yet. Do not show the tsunami yet.',
   audio:'Earthquake rumble, cracking rock, falling stones, shifting debris, snapping roots or trees under strain, dust movement, and natural mountain ambience only. No voiceover. No music.',
   extraNegative:'No seabed collapse. No underwater landslide. No full rockslide impact into the bay yet. No visible tsunami yet. No wave generation yet. No fantasy destruction. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark, or any on-screen text.'
  },
  P5:{
   scientific:false,
   scene:'A massive rockslide breaks loose from the steep mountainside at the head of Lituya Bay and plunges downslope into Gilbert Inlet. Show an enormous mass of rock and debris accelerating under gravity and entering the water with violent impact. The source of the coming megatsunami must clearly be the mountain rockslide entering the bay.',
   narrative:'A massive earthquake-triggered rockslide plunges from the mountainside into the water at the head of Lituya Bay.',
   extraNegative:'Do not imply that a seabed collapse or underwater landslide is the primary wave source. No fantasy wave behavior.'
  },
  P6:{
   scientific:false,
   scene:'Immediately after the mountain rockslide slams into Gilbert Inlet, the displaced water erupts outward with tremendous force. Show the bay water being driven upward and across the inlet by the rockslide impact, beginning the megatsunami surge. Keep the rockslide-water impact relationship visually unmistakable.',
   narrative:'The rockslide impact violently displaces the water, generating the megatsunami.',
   extraNegative:'Do not show an unrelated offshore tsunami source. No seabed cave-in as the cause. Keep the wave generation tied directly to the rockslide impact.'
  }
 };
 return map[stage]||null;
}
function isRockyMountainLocust1874(){
 var t=String(current()||'').toLowerCase();
 return t.includes('rocky mountain locust')&&t.includes('1874');
}
function rockyMountainLocustPanel(stage){
 if(!isRockyMountainLocust1874()||!/^P[1-9]$/.test(stage))return null;
 var map={
  P1:{
   approved:false,
   scientific:false,
   scene:'A calm ordinary farming day across the Great Plains, USA, in 1874, before the Rocky Mountain locust outbreak becomes visibly threatening. Adult frontier farmers work healthy crop fields using period-accurate hand tools while a horse-drawn wagon, simple wooden farmhouse, barn, fences and broad prairie farmland establish the historical setting. Crops are still healthy and intact. The farmers behave normally and show no panic. There must be ZERO visible locusts or other visible swarming insects anywhere in the frame at any time. No insects in the air, on crops, on soil, near the camera, or in the distance. No visible swarm, no crop destruction and no unusual darkening of the sky. Establish a completely calm pre-disaster world before the locust plague becomes visible at all.',
   narrative:'Adult frontier farmers work healthy Great Plains fields during an ordinary day in 1874, before the locust swarm becomes visibly threatening.',
   timing:'0.0–2.0s: Establish a peaceful 1874 Great Plains farm with healthy crops, adult farmers, period hand tools, and a horse-drawn wagon or nearby wooden farm structures. No disaster is visible.\\n2.0–7.0s: Continue normal farm work with restrained natural movement in clothing, crops, horses and prairie vegetation. Keep the fields healthy and the atmosphere calm.\\n7.0–10.0s: Hold the peaceful pre-disaster world with ZERO visible locusts or swarming insects. Keep the sky clear, crops healthy, and the farm completely normal through the final frame.',
   camera:'One restrained cinematic documentary shot with a gentle forward track or slow lateral drift. Keep foreground crops, working adults and the wider prairie farm readable together. Let the active Visual Mode control whether the rendering is Historical Anime or Real Human. No cuts, transitions, orbit, time-lapse or disaster-camera behavior.',
   physics:'This is the calm-before-disaster panel. Crops remain healthy, farm objects remain stable, adults continue ordinary work, and horses and vegetation move naturally. ZERO visible locusts or swarming insects are allowed in this panel. No insect buildup, no sudden swarm formation, no instant crop loss, no impossible insect growth, no panic and no destruction.',
   audio:'Quiet prairie ambience, light wind through crops, subtle farm-tool sounds, distant horse or wagon movement and natural rural environment SFX only. No voiceover, no dialogue and no music.',
   extraNegative:'No visible locusts at any time. No insects in the air, on crops, on soil, near the camera, or in the distance. No swarm. No distant insect cloud. No dense insects. No sky darkening. No crop destruction. No stripped vegetation. No panic. No giant insects. No modern machinery. No children. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark or any on-screen text.'
  },
  P2:{
   approved:false,
   scientific:false,
   scene:'Across the Great Plains, USA, in 1874, favorable seasonal conditions have produced an unusually dense early buildup of Rocky Mountain locusts in open prairie breeding ground near farmland. Keep the visual emphasis low to the ground: normal-sized locusts crawl and hop across bare soil, prairie grass and low plants in clearly abnormal numbers, with only a few lifting into short flights. Nearby crop fields remain mostly intact, the sky stays broad and largely clear, and no adults are yet stopping to react. This panel is the biological buildup before P3 human realization and before any sky-filling swarm.',
   narrative:'Favorable seasonal conditions allow Rocky Mountain locust populations to build rapidly across the Great Plains before the full plague forms.',
   timing:'0.0–2.0s: Establish open 1874 prairie breeding ground near farmland, with healthy vegetation and a visibly unusual number of locusts already present on soil and low plants.\\n2.0–7.0s: Show the early buildup continuing as more small locusts crawl, hop and lift briefly into loose clusters across the ground and vegetation. Keep nearby crops mostly intact and the sky largely clear.\\n7.0–10.0s: End on a clearly abnormal but still early-stage concentration of locusts, creating ominous escalation without becoming a full sky-darkening swarm.',
   camera:'A low restrained lateral track across foreground soil and prairie vegetation, close enough to read many separate locusts while keeping intact farmland visible in the background. Keep the horizon and sky open so the panel cannot be mistaken for the later airborne swarm. No cuts, transitions, orbit or time-lapse.',
   physics:'This is an early population-buildup panel, not an instant plague. Locusts remain normal-sized and move through plausible crawling, hopping and short flight. Do not depict magical reproduction, instant multiplication, sudden crop death or impossible insect density. Crops remain mostly intact.',
   audio:'Prairie wind, dry grass movement, subtle natural insect activity and distant farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No full locust cloud. No blackened sky. No total crop destruction. No stripped fields. No panic crowd. No giant insects. No impossible instant multiplication. No modern machinery. No children. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark or any on-screen text.'
  },
  P3:{
   approved:false,
   scientific:false,
   scene:'Across the Great Plains, USA, in 1874, adult farmers or frontier scouts clearly notice a rapidly growing concentration of Rocky Mountain locusts gathering across prairie vegetation, fence lines and open ground near farmland. Show large numbers of locusts clinging to grasses, low plants and patches of soil while more insects rise in loose moving clusters above the land. The buildup should now feel serious and alarming, with adults stopping their work to look across the fields and open prairie in concern. However, this is still not yet the full sky-darkening plague. Most crops remain standing, and the swarm is gathering visibly rather than completely overwhelming the landscape. The scene should communicate a clear early realization that a major locust disaster is approaching.',
   narrative:'Farmers and scouts begin to realize that rapidly growing Rocky Mountain locust gatherings are forming across the Great Plains and may become a major disaster.',
   timing:'0.0–2.0s: Begin with adult farmers or frontier scouts already noticing dense locust concentrations on nearby grasses, fence lines and open ground. Their attention shifts toward the growing insect activity.\\n2.0–7.0s: More locusts rise into loose moving clusters above the prairie while adults stop work and watch with visible concern. Keep most crops standing and avoid full landscape overwhelm.\\n7.0–10.0s: Build a strong sense of approaching danger as the gathering becomes larger and more organized, but stop before the sky is darkened or the fields are completely invaded.',
   camera:'A restrained push-in toward the concerned adults and the visibly gathering locust concentrations, preserving readable foreground vegetation, midground people and open prairie depth. No cuts, transitions, orbit or time-lapse.',
   physics:'Locust density is clearly higher than P2, but movement remains physically plausible and insects remain normal-sized. The gathering forms through many individual insects crawling, hopping and taking short flight; do not show instant materialization or impossible multiplication. Most crops remain standing and largely intact.',
   audio:'Growing natural insect wing and movement sounds mixed with prairie wind, light farm ambience and subtle human movement only. No voiceover, dialogue or music.',
   extraNegative:'No full sky-darkening plague yet. No complete crop stripping. No total field destruction. No giant insects. No magical insect appearance. No panic stampede. No modern objects. No children. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark or any on-screen text.'
  },
  P4:{
   approved:false,
   scientific:false,
   scene:'Across intact 1874 Great Plains farmland, an airborne front of Rocky Mountain locusts is now visibly advancing from the open prairie toward productive crop fields. Adult farmers stand near a fence line or field edge and look toward the incoming movement while thousands of separate normal-sized insects cross the air at layered depths. The main story beat is movement toward the crops, not feeding yet: foreground plants remain standing and largely undamaged. The swarm can occupy a large part of the sky, but individual insects must remain readable and the mass must never resemble smoke, fog, dust or a solid black cloud.',
   narrative:'Dense airborne swarms begin moving toward productive farmland across the Great Plains.',
   timing:'0.0–2.0s: Establish intact crops and adults at the field edge as the incoming swarm becomes clearly visible over the prairie.\n2.0–7.0s: The airborne front moves steadily closer in layered depth while adults watch and react with concern; crops remain mostly untouched.\n7.0–10.0s: End with the swarm reaching the immediate edge of the farmland, stopping before widespread feeding damage begins.',
   camera:'A restrained forward track from the field edge toward the approaching airborne swarm, keeping intact crops in the foreground and the moving insect front readable in depth. No cuts, orbit, time-lapse or sudden disaster zoom.',
   physics:'The swarm advances through the sustained flight of many separate normal-sized locusts. No instant appearance, teleporting, impossible density jump or smoke-like merging. Wind and crop movement remain natural and feeding damage has not yet become the focal action.',
   audio:'Growing natural wing activity, prairie wind, crop movement and restrained farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No major feeding damage yet. No stripped field. No total crop loss. No smoke-like swarm. No fog, ash, dust cloud or solid black mass. No giant insects. No modern objects. No children.'
  },
  P5:{
   approved:false,
   scientific:false,
   scene:'The Rocky Mountain locust swarm reaches productive Great Plains crops in 1874 and the first unmistakable feeding damage becomes visible. Normal-sized locusts land on corn, grain or other field plants, cling to leaves and stalks, and actively chew vegetation while adult farmers remain nearby watching the attack unfold. Keep most plants still standing so this reads as first crop contact rather than the later peak devastation. The action must be clearly different from P4: the swarm is no longer only approaching; insects are now physically on the crops and eating them.',
   narrative:'The swarm reaches crops and feeding damage becomes visible across fields.',
   timing:'0.0–2.0s: Begin with locusts already landing on standing crop plants while adults notice the first visible feeding damage.\n2.0–7.0s: Show separate insects clinging, crawling and feeding on leaves and stalks as localized damage increases naturally.\n7.0–10.0s: End with clearly damaged but still standing crops, setting up the much denser peak infestation of P6.',
   camera:'A restrained side track through standing crop rows that keeps feeding insects in the foreground and adult farmers readable in the midground. No cuts, orbit or time-lapse.',
   physics:'Locusts remain normal-sized and physically separate. Leaves and plant edges show progressive local feeding damage rather than instant disappearance. No magical multiplication or immediate total field stripping.',
   audio:'Natural insect wing and feeding movement, rustling crops, prairie wind and subdued farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No completely bare field yet. No smoke-like swarm. No giant insects. No instant crop disappearance. No modern machinery. No children.'
  },
  P6:{
   approved:false,
   scientific:false,
   scene:'At peak infestation across an 1874 Great Plains field, enormous numbers of Rocky Mountain locusts fill the air and cover standing vegetation while active feeding strips leaves from crops. Parts of the sky may look darker because of the sheer number of separate insects, but the swarm must remain visibly composed of individual locusts at multiple depths and never resemble smoke, storm cloud, fog, soot or ash. Adult farmers may appear small within the scene to communicate scale, but the visual emphasis is the overwhelming density and active crop attack.',
   narrative:'At peak infestation, huge numbers of insects cover plants and darken parts of the sky.',
   timing:'0.0–2.0s: Open inside a visibly dense but still physically readable swarm over standing crops.\n2.0–7.0s: Sustain intense flight and feeding as insects cover vegetation and leaves are progressively stripped.\n7.0–10.0s: Hold the overwhelming peak density and severe crop attack without jumping ahead to the post-swarm aftermath.',
   camera:'A wide restrained push through the crop rows with strong depth layers: insects near camera, damaged vegetation midground and adults or farm structures small in the distance. No cuts, orbit or time-lapse.',
   physics:'The density comes from many separate normal-sized insects. Crop loss progresses through feeding; plants do not vanish instantly. No solid swarm mass, giant insects, magical multiplication or impossible scale.',
   audio:'Dense natural wing activity, crop rustle, prairie wind and restrained environmental movement only. No voiceover, dialogue or music.',
   extraNegative:'No black smoke effect. No dust-cloud swarm. No fog-like insects. No giant locusts. No instant total crop disappearance. No modern objects. No children.'
  },
  P7:{
   approved:false,
   scientific:false,
   scene:'Across several neighboring Great Plains farm plots in 1874, crop losses are now visibly widespread. Show damaged rows, partly stripped plants and adults moving through the affected farmland while a reduced but still active number of locusts remains in the air and on vegetation. The visual emphasis is no longer the spectacle of the densest swarm; it is the spread of agricultural damage across more than one field or farm area. Keep some standing vegetation so P9 can later show the much barer post-swarm result.',
   narrative:'Crop losses spread as multiple farms and communities face the same outbreak.',
   timing:'0.0–2.0s: Establish more than one damaged field or farm area in the same wider landscape.\n2.0–7.0s: Adults move through damaged rows while remaining locust activity continues at a lower visual priority than the crop loss.\n7.0–10.0s: End on a wider view that makes the spread of agricultural damage unmistakable.',
   camera:'A measured lateral documentary move that reveals one damaged field, then a neighboring affected plot or farm structure in the same continuous shot. No cuts, orbit or time-lapse.',
   physics:'Damage is cumulative and already present across multiple fields. Remaining insects move naturally. Do not restore crops, instantly destroy new fields, or make the swarm denser than the P6 peak.',
   audio:'Prairie wind, dry crop movement, lighter insect activity, footsteps and restrained farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No return to peak P6 swarm density. No pristine undamaged landscape dominating the frame. No smoke-like swarm. No giant insects. No modern machinery. No children.'
  },
  P8:{
   approved:false,
   scientific:false,
   scene:'The 1874 locust crisis now reads at a broader regional scale: from an elevated but still period-plausible ground viewpoint, show a wide Great Plains landscape containing several separated farmsteads, field sections, fences or wagon routes while the moving swarm continues beyond the first farms toward more distant agricultural land. Keep foreground adults small and secondary if present. The focal idea is geographic spread and continued migration, clearly different from P7 field-level crop damage and P9 aftermath. Do not use a modern aerial-drone perspective.',
   narrative:'The crisis expands across the Great Plains as swarms continue migrating beyond the first affected farms.',
   timing:'0.0–2.0s: Establish a broad prairie farming landscape with multiple separated farm areas visible in depth.\n2.0–7.0s: Show the swarm continuing across the landscape toward more distant fields, with individual insects still readable near and mid distance.\n7.0–10.0s: Finish on the wider geographic scale of the moving outbreak rather than on one damaged crop row.',
   camera:'A slow elevated ground-level pan or lateral drift from one farm area toward more distant fields and the continuing swarm path. No modern aerial-drone movement, cuts, orbit or time-lapse.',
   physics:'The swarm migrates continuously across real terrain. Relative scale and depth remain stable. No teleporting swarm, impossible horizon-sized solid mass or instant landscape destruction.',
   audio:'Broad prairie wind, layered insect wing activity, distant farm ambience and natural environmental movement only. No voiceover, dialogue or music.',
   extraNegative:'No drone shot. No aircraft. No modern roads. No smoke-like swarm. No giant insects. No instant regional destruction. No children.'
  },
  P9:{
   approved:false,
   scientific:false,
   scene:'After the main swarm has moved on from an 1874 Great Plains farm, reveal the stark agricultural aftermath: broad rows of denuded or heavily stripped vegetation, exposed soil and damaged stalks dominate the frame. One or two adult farmers inspect the barren field at close or mid distance, touching a stripped stalk or kneeling beside the damaged ground. Only a few isolated locusts may remain; there must be no dense active swarm. The visual beat is loss after passage, not ongoing attack.',
   narrative:'Damaged fields reveal the scale of lost food and income after the swarms pass.',
   timing:'0.0–2.0s: Establish a visibly denuded field after the main swarm has moved away.\n2.0–7.0s: An adult farmer examines stripped stalks or exposed soil while the camera reveals the scale of the loss.\n7.0–10.0s: End on the quiet contrast between the barren rows and the farmer, with only minimal residual insect activity.',
   camera:'A restrained downward-to-forward move beginning on stripped plants or soil and settling on the adult farmer inspecting the damage. No cuts, orbit or time-lapse.',
   physics:'The damage is already complete when the panel begins. No crops disappear during the shot and no new dense swarm forms. Human movement remains slow and grounded.',
   audio:'Dry wind, footsteps, brittle plant movement and sparse residual insect sounds only. No voiceover, dialogue or music.',
   extraNegative:'No dense swarm. No sky-darkening insects. No lush healthy crop field dominating the frame. No giant insects. No modern machinery. No children.'
  }
 };
 return map[stage]||null;
}
function rockyMountainLocustLatePanel(stage){
 if(!isRockyMountainLocust1874()||!/^P1[0-4]$/.test(stage))return null;
 var base={approved:false,scientific:false};
 var map={
  P10:{
   scene:'In an 1874 Great Plains farming community after the worst locust feeding has passed, adult farmers and local civic officials inspect stripped fields, damaged crop rows, nearly empty storage areas and surviving farm equipment. Two or three adults compare the damage directly in the field while one records losses in a small period notebook or ledger. Keep the emphasis on visible agricultural loss and sober assessment, not modern emergency-management staging. No aircraft, motor vehicles, radios, plastic equipment or modern uniforms.',
   narrative:'Farmers and local officials assess the scale of crop losses and the growing threat to food and household survival.',
   timing:'0.0–2.0s: Establish stripped fields, damaged crops and a small group of adults inspecting the loss.\n2.0–7.0s: One farmer lifts damaged stalks while another adult checks nearby storage or records losses in a period notebook.\n7.0–10.0s: Hold on the contrast between devastated farmland and the adults quietly assessing what remains.',
   camera:'A restrained lateral documentary track across damaged rows toward the adults assessing the field. No cuts, orbit, time-lapse or modern disaster-news behavior.',
   physics:'Damage is already present. Nothing repairs or collapses instantly. Adults handle real crop remnants and period objects naturally. Preserve plausible 1874 farm scale and materials.',
   audio:'Dry prairie wind, footsteps through damaged vegetation, light handling of stalks and paper, distant farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No aircraft. No motor vehicles. No radio equipment. No modern emergency uniforms. No plastic containers. No modern clipboards. No intact lush field dominating the scene. No giant insects.'
  },
  P11:{
   scene:'In an 1874 Great Plains town or rural relief point after the locust disaster, adult volunteers, farmers and local relief organizers sort period-appropriate aid for affected families. Show sacks of grain or flour, folded clothing, seed bags, wooden crates and simple supplies arranged beside a storehouse, rail-side freight area or public building, then loaded by hand onto one horse-drawn wagon. Keep the composition centered on organized supply handling and outbound delivery so P11 reads clearly as the relief-response panel. Keep every object believable for 1874. Absolutely no aircraft, motor trucks, tractors, radios, plastic packaging, modern disaster-response gear or twentieth-century relief equipment.',
   narrative:'Communities organize food, clothing, seed and other practical relief for families hit by the 1874 locust disaster.',
   timing:'0.0–2.0s: Establish the period relief point with adult volunteers, stacked sacks, wooden crates and a horse-drawn wagon.\n2.0–7.0s: Adults sort and lift supplies by hand, passing sacks or seed bags toward the wagon in one continuous practical workflow.\n7.0–10.0s: End with the wagon partly loaded and the relief effort visibly organized for delivery to affected farms.',
   camera:'One continuous restrained forward-and-side documentary move that keeps the supply stacks, adult workers and horse-drawn wagon readable together. No cuts, orbit or time-lapse.',
   physics:'Supplies have realistic weight. Adults lift, pass and load one item at a time with believable body mechanics. The horse and wagon remain stable. No instant loading, teleporting objects or duplicated people.',
   audio:'Wooden crate movement, cloth sacks shifting, wagon creaks, horse movement, footsteps and quiet outdoor town ambience only. No voiceover, dialogue or music.',
   extraNegative:'No aircraft. No helicopters. No airplanes. No motor trucks. No tractors. No radios. No plastic bags. No modern pallets. No fluorescent vests. No modern aid logos. No twentieth-century relief equipment. No giant insects.'
  },
  P12:{
   scene:'During the difficult aftermath of the 1874 locust disaster, shift away from P11 supply loading and focus on the households living through the shortage. In a modest Great Plains street, farmyard or public distribution area, adult residents receive only a small amount of food, seed, clothing or other basic relief while damaged farmland or depleted farm storage remains visible in context. Keep the available supplies visibly limited and the mood tired and practical. This panel should communicate continuing household and community hardship, not another warehouse-loading scene and not a modern refugee camp.',
   narrative:'The crop disaster creates wider hardship as affected households depend on limited food, seed and material assistance.',
   timing:'0.0–2.0s: Establish a modest 1870s community relief scene with damaged farmland visible in context.\n2.0–7.0s: Adults receive, carry or organize limited supplies with restrained, tired movement.\n7.0–10.0s: Hold on the small scale of available aid against the wider agricultural damage.',
   camera:'A slow observational push toward one or two adult recipients carrying limited supplies, with the damaged agricultural setting held clearly in the background. Avoid repeating P11’s wagon-loading composition. No cuts, orbit or time-lapse.',
   physics:'Objects remain scarce, physical and period-correct. Adults carry realistic loads. No instant crowd growth, magical supply appearance or modern logistics.',
   audio:'Wind, footsteps, cloth and crate handling, wagon creaks and subdued outdoor ambience only. No voiceover, dialogue or music.',
   extraNegative:'No modern refugee camp. No aircraft. No motor vehicles. No plastic packaging. No modern tents. No loudspeakers. No modern uniforms. No aid-brand logos.'
  },
  P13:{
   scene:'As the immediate crisis begins to ease, adult Great Plains farmers begin the first practical steps of recovery using period-appropriate 1870s methods. Show a visibly damaged field where one adult clears dead stalks while another opens or measures seed from a cloth sack and a horse-drawn implement waits nearby for the next step. Keep the ground scarred and the field mostly unrecovered. The focal action is preparation to replant, clearly different from P12 relief distribution and from P14’s broader reflective recovery view.',
   narrative:'Recovery begins slowly as affected farmers clear damaged ground, secure seed and prepare to plant again.',
   timing:'0.0–2.0s: Establish damaged but quiet farmland with adults preparing seed and period tools.\n2.0–7.0s: Farmers clear rows, handle seed sacks and ready horse-drawn equipment in a deliberate recovery workflow.\n7.0–10.0s: End on the first visible steps toward replanting while much of the landscape remains damaged.',
   camera:'A restrained lateral move along damaged rows toward the recovery work. No cuts, time-lapse, orbit or instant seasonal transformation.',
   physics:'Recovery is gradual. Fields do not become green instantly. Tools, horses, seed and soil behave naturally and remain period-accurate.',
   audio:'Light wind, soil and tool sounds, sack movement, horse tack and restrained farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No instant green recovery. No modern tractors. No aircraft. No powered machinery outside the era. No plastic seed bags. No modern irrigation. No giant insects.'
  },
  P14:{
   scene:'A reflective closing view of the Great Plains after the 1874 Rocky Mountain locust disaster: one adult farmer works a horse-drawn plow or cultivator across a broad field where new cultivation appears beside clearly visible scarred or sparsely recovered patches. Keep the composition wide and quiet so the final image feels like gradual return to farming rather than instant restoration. Preserve the late nineteenth-century world and let the contrast between surviving damage and renewed cultivation carry the final lesson visually. No written lesson, title card, modern technology or invented monument is shown.',
   narrative:'The 1874 locust disaster remains a stark historical example of how quickly an environmental crisis could devastate farming communities across the Great Plains.',
   timing:'0.0–2.0s: Establish a broad recovered-but-still-scarred prairie farming landscape.\n2.0–7.0s: Show adult farmers continuing steady period-appropriate work among visible reminders of past crop damage.\n7.0–10.0s: Finish on a wide, quiet historical composition that feels reflective rather than triumphant.',
   camera:'A slow restrained pullback or lateral drift revealing the wider prairie and recovering farms. No cuts, orbit, time-lapse or modern aerial-drone look.',
   physics:'The landscape shows gradual recovery, not instant transformation. Human and animal movement remains natural and period-correct.',
   audio:'Prairie wind, distant horse and farm-tool sounds, light vegetation movement only. No voiceover, dialogue or music.',
   extraNegative:'No modern machinery. No aircraft. No drone view. No modern roads. No text, captions, memorial plaque or title card. No giant insects.'
  }
 };
 return map[stage]||null;
}
function isNargis2008(){
 var t=String(current()||'').toLowerCase();
 return t.includes('cyclone nargis')&&t.includes('2008');
}
function nargisPanel(stage){
 if(!isNargis2008()||!/^P(?:[1-9]|1[0-4])$/.test(stage))return null;
 var base={approved:true,approvedLabel:'FINAL APPROVED — NARGIS '+stage,scientific:false};
 if(stage==='P7'){
   base.scene='During the height of Cyclone Nargis in a low-lying Ayeyarwady Delta community, wider destruction and infrastructure failure are already underway. Roofs fail, trees bend or fall, simple power systems collapse, and floodwater spreads through the community. CRITICAL RAIN VISIBILITY LOCK: heavy wind-driven rain must be strongly visible from the first second to the last second. Show dense slanting rain streaks and sheets crossing foreground and background, rain splashing off roofs, walls, debris and floodwater, and spray mixing with rainfall. The viewer must clearly see heavy rain lashing through the shot, not just strong wind.';
   base.narrative='Roofs fail, trees fall, power systems collapse, and floodwater spreads through communities as Cyclone Nargis lashes the delta with violent wind and heavy visible rain.';
   base.timing='0.0–2.0s: Begin immediately with heavy rain already clearly visible and violent storm conditions active. The viewer must instantly see rain lashing through the scene and one focal failure such as roofing damage, a falling tree, or floodwater movement.\n2.0–7.0s: Maintain dense visible rain throughout while roofs fail further, trees break or collapse, debris moves with the wind, and floodwater spreads.\n7.0–10.0s: Sustain full storm intensity. Keep rain strongly visible, wind violent, and flooding/destruction active until the final frame.';
   base.camera='A restrained forward tracking move with clear parallax or grounded observational drift. Keep foreground, midground and background readable and keep rainfall visible in the frame at all times. Fixed focal length, natural depth and occlusion. No cuts, transitions, orbit or time-lapse.';
   base.physics='Keep all motion physically plausible and cyclone-specific. Show believable interaction between wind, heavy visible rain, floodwater, debris, trees and damaged structures. Rain must remain continuous and visually obvious; do not reduce the scene to wind-only motion.';
   base.audio='Loud wind-driven rain, roof impacts, rattling and breaking structures, tree cracking, floodwater movement, debris strikes and natural storm ambience only. ABSOLUTE NO VOICEOVER. No narration. No spoken dialogue. No music.';
   base.extraNegative='No weak invisible rain. No light drizzle. No mostly dry scene. No wind-only storm look. Rain must remain visible from first frame to last frame.';
 }
 if(stage==='P11'){
   base.scene='Post-disaster displacement in the Ayeyarwady Delta after Cyclone Nargis. Adult displaced residents gather around temporary emergency shelters made from simple tarpaulins, bamboo, salvaged wood and improvised covering. Relief distribution is taking place but supplies are visibly limited. Show adults waiting, sitting, carrying containers, receiving basic aid, or standing near sparse relief materials. Muddy ground and storm-damaged surroundings remain visible. Shelter conditions look temporary, strained and inadequate. No children.';
   base.narrative='Temporary shelters and limited relief distribution support displaced residents after Cyclone Nargis.';
   base.timing='0.0–2.0s: Begin immediately with the displacement and relief setting clearly readable, with one adult already receiving aid, carrying a container, or waiting beside an improvised shelter.\n2.0–7.0s: Continue the same grounded action. Adults shift position, receive or carry limited supplies, and move naturally through the shelter area while scarcity remains visible.\n7.0–10.0s: Sustain the humanitarian-crisis atmosphere and end with temporary shelters, limited aid and displaced adults clearly visible.';
   base.camera='A slow lateral track or grounded observational drift revealing scene depth. Keep foreground, midground and background readable. Fixed focal length, natural depth and occlusion. No cuts, transitions, orbit or time-lapse.';
   base.physics='This is a post-disaster displacement panel. Keep motion calm, tired and grounded. Shelter fabric and improvised materials may shift gently. Preserve object count, human identity and plausible scale.';
   base.audio='Natural environment and object SFX only: light wind, shelter fabric flapping, mud or water footsteps, container handling and subdued aftermath ambience. ABSOLUTE NO-VOICEOVER / NO-SPEECH LOCK: no voiceover, no narration, no spoken dialogue, no interview audio, no public announcement, no radio voice, no off-screen talking, no foreground human speech, no chanting, no prayer audio, no reporter audio, no explanatory voice of any kind, and no music. The entire clip must remain nonverbal except for natural environment and object sounds.';
   base.extraNegative='No overcrowded polished refugee-camp look. No abundant aid stockpile. No comfortable camp atmosphere. No voiceover. No narration. No dialogue. No reporter. No radio speech. No public announcement. No human speech of any kind.';
 }
 return base;
}
function triStateTornadoPanel(stage){
 var t=String(current()||'').toLowerCase();
 if(!(t.includes('tri-state tornado')&&t.includes('1925'))||stage!=='P14')return null;
 return {
   approved:false,
   scientific:false,
   scene:'Final reflective aftermath along the Tri-State Tornado track in a historically appropriate 1925 Midwestern town setting. The violent tornado is gone. Show a quiet damaged street edge or neighborhood with surviving period homes, broken trees, cleared debris, salvaged lumber, and a small number of adult residents calmly looking across the storm-scarred community as recovery continues. Keep clothing, buildings, roads, utility details, tools, and any vehicles appropriate to 1925 Missouri, Illinois, or Indiana. The frame should communicate lasting community memory and the need for future preparedness through grounded aftermath details only, without inventing a specific warning system, agency, memorial, policy, technology, or statistic. No active funnel, no new destruction, no modern sirens, no modern emergency vehicles, no modern signage, and no on-screen text.',
   narrative:'Close on the lasting historical legacy of the Tri-State Tornado without introducing a new disaster beat or unsupported modern preparedness system.',
   timing:'0.0–2.0s: Establish the quiet post-disaster 1925 Midwestern setting with storm damage still readable and no active tornado.\n2.0–7.0s: Slowly reveal adults, surviving structures, cleared debris, and restrained recovery activity that communicates the event’s lasting community impact.\n7.0–10.0s: End on a reflective wide composition of the storm-scarred town and ongoing recovery, with no new hazard or dramatic escalation.',
   camera:'One restrained slow push or lateral documentary-style move rendered strictly in the locked 2D historical-anime style. Keep the final image reflective rather than action-heavy. No cuts, no transition, no orbit, no time-lapse.',
   physics:'The tornado has already passed. Debris remains where plausible; recovery activity is slow and human-scale. No sudden rebuilding, no new structural collapse, no active vortex, no impossible wind, and no invented modern preparedness equipment.',
   audio:'Quiet post-storm ambience, light wind, distant wood and cleanup sounds, restrained adult movement. No tornado roar, no voiceover, no music.',
   extraNegative:'No live action. No photorealistic people. No photographic skin. No 3D CGI humans. No active tornado. No new destruction. No modern sirens, emergency vehicles, radar screens, electronic warning devices, captions, titles, logos, or watermark.'
 };
}
function isSanFrancisco1906P2(stage){return stage==='P2'&&/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current());}
function sanFrancisco1906P2(stage){
 if(stage!=='P2'||!/\bSan Francisco Earthquake\b/i.test(current())||!/\b1906\b/.test(current()))return null;
 return {
   approved:false,
   scientific:false,
   scene:'A calm, historically appropriate San Francisco street in 1906 before the first perceptible shaking. Show intact facades, period street details and a few distinct adult residents in ordinary movement. The camera observes the everyday city from a different angle and sublocation than P1. The fault stress is explained only by the narration; it is invisible in this surface-level scene. No underground cutaway, visible fault line, shaking, window rattling, falling objects, cracks, smoke, fire or destruction yet.',
   narrative:'The earthquake source remains unseen. Show ordinary pre-event life only.',
   timing:'0.0–2.0s: Establish the intact 1906 San Francisco street at human height with one clear foreground scale reference and ordinary adult movement.\n2.0–7.0s: Continue a restrained lateral camera move through the same street, showing normal period architecture and distinct adults without an earthquake cue.\n7.0–10.0s: Hold the intact pre-event setting and end before P3 begins perceptible shaking.',
   camera:'One coherent surface-level lateral move in a historically appropriate street, visually distinct from P1. No scientific cutaway or unsupported subsurface view.',
   physics:'Fault stress is described in the narration and remains invisible. Preserve stable buildings and objects. No premonitory shaking, rattling, structural damage or fire in P2.',
   audio:'SOUND EFFECTS ONLY: quiet ordinary 1906 street ambience synchronized with visible activity. ABSOLUTE SILENCE FROM HUMAN VOICES: no narrator, dialogue, spoken words, whispers, singing, vocal reactions, lip-sync or speech synthesis. Do not read the panel narration aloud. No underground rumble, rock strain, deep-earth vibration or music.',
   extraNegative:'No underground or subsurface visualization; no diagram, fault cross-section, cracks, tremor, dramatic rumble, fire, collapse or premature disaster imagery.'
 };
}
function sanFrancisco1906P3(stage){
 if(stage!=='P3'||!/\bSan Francisco Earthquake\b/i.test(current())||!/\b1906\b/.test(current()))return null;
 return {
   approved:false,
   scientific:false,
   scene:'First clearly perceptible earthquake shaking on a historically appropriate San Francisco street in 1906. Begin with a visible tremor within the first half-second: a hanging sign sways, windowpanes visibly rattle and dust shakes from an intact facade. A few distinct adults stop, lose balance slightly and brace against stable surfaces. The camera remains at human height and follows their immediate reaction. The street and buildings stay standing; this is the first danger beat, not the major collapse.',
   narrative:'The first shaking reaches the city. This context is for visual direction only and is never spoken in the generated video.',
   timing:'0.0–1.0s: One clear tremor begins immediately. The sign swings, windows visibly rattle and adults notice the movement.\n1.0–4.0s: Shaking intensifies enough for adults to brace and for loose lightweight objects to slide or fall naturally. Keep facades standing.\n4.0–8.0s: The same sustained shaking continues visibly through the street, sign, windows, ground-level objects and human balance. The camera moves purposefully at human height.\n8.0–10.0s: End on a strong, readable early-earthquake jolt without a major structural failure; P4 and later panels carry stronger destruction.',
   camera:'A human-height three-quarter street view with one controlled forward or lateral move. Show adults and multiple physical earthquake cues together. No static stillness, random cuts or extreme camera shake.',
   physics:'One sustained developing earthquake begins visibly within 0.5 seconds. Objects rattle, sway or fall only from the shaking; adults react with believable balance. No giant chasm, building collapse, fire, citywide devastation or peak-disaster imagery yet.',
   audio:'Sound effects only: visible window rattles, moving fixtures, loose objects and short nonverbal reactions synchronized with the shaking. No narration, dialogue, spoken words, music or invented deep-earth sound.',
   extraNegative:'No voiceover, spoken narration, lip-sync, major collapse, flames, instant citywide ruin or invisible earthquake.'
 };
}
function sanFrancisco1906P7(stage){
 if(stage!=='P7'||!/\bSan Francisco Earthquake\b/i.test(current())||!/\b1906\b/.test(current()))return null;
 return {
  approved:false,scientific:false,
  scene:'Wider earthquake damage at a distinct 1906 San Francisco rail-side street crossing, seen from an elevated oblique position rather than the P6 intersection. A damaged rail line and broken street paving are visible from the first frame, with intact portions of period buildings farther away. EXACTLY THREE adults: one rail worker checks the damaged track, one adult resident moves carefully across the crossing, and one second resident steadies that resident by the arm. These are three separate people with distinct faces and period clothing. Keep the scene focused on wider infrastructure damage; do not replay P6 peak building collapse. Use only weather, visibility, wind and dust conditions actually established in P6; leave unestablished atmospheric details unspecified.',
  narrative:'The damage spreads to transport routes and neighborhoods. Narration is added separately in editing and must not be spoken.',
  timing:'0.0–2.0s: Reveal the damaged crossing and all three adults in one readable composition.\n2.0–7.0s: Track laterally as the rail worker checks the track and the two residents move together past cracked paving; existing damage remains stable.\n7.0–10.0s: Reveal the damaged route continuing toward distant buildings and hold on the wider impact without a new peak collapse.',
  camera:'One continuous elevated oblique lateral track across the crossing, different from the forward street-level P6 view. Keep exactly three adults and the damaged rail route readable.',
  physics:'Damaged paving and rail remain damaged. People step carefully around obstacles with grounded motion. No new large collapse, explosive track movement or invented secondary hazard.',
  audio:'Only scene-grounded footsteps, clothing movement and light movement of loose material when visible. No voices, narrator, dialogue, music, wind or dust sounds unless established and visibly caused.',
  extraNegative:'No fourth adult, duplicate worker, duplicate resident, dusty air, drifting dust, invented wind direction, new building collapse, or repeated P6 intersection composition.'
 };
}
function sanFrancisco1906P14(stage){
 if(stage!=='P14'||!/\bSan Francisco Earthquake\b/i.test(current())||!/\b1906\b/.test(current())||style()!=='anime'||colorMode()!=='bw')return null;
 return {
  approved:true,approvedLabel:'APPROVED P14 MAP PROMPT',scientific:false,
  scene:'P14 APPROVED SINGLE-MAP CONTINUITY LOCK: In a later-recovery 1906 San Francisco street, exactly THREE distinct adults stand around one sturdy wooden table. ONE paper map lies COMPLETELY OPEN AND FLAT on the table in the FIRST FRAME, with all four corners and the entire sheet visible. Its outer shape, folds, stable simple grayscale markings and position never change. There are no readable labels, invented routes, dates, other maps or loose papers. One foreground adult slowly places ONE finger on a fixed area and traces a short path over the SAME unmoving markings. The other two adults lean slightly closer and follow the gesture with their eyes. End on the same group, same map, same background and camera position. Period buildings remain steady. No map unfolding, flipping, redrawing, pop-in, instant repairs or scene change.',
  narrative:'The later recovery and work ahead are suggested by restrained discussion over the existing map. The supplied panel narration belongs in editing, never as spoken audio in the clip.',
  timing:'0.0–2.0s: Three distinct adults, full table and the already fully open, flat SINGLE map are present and visible together from the first frame. No unrolling.\n2.0–7.0s: One adult slowly points at a fixed area and traces one short path over the unchanged markings. Two adults only lean and follow with their eyes.\n7.0–10.0s: The pointing finger stops. Hold the same three adults and unchanged full map in a readable composition. No new shot or location.',
  camera:'Nearly fixed medium-wide three-quarter view, high enough to see the entire map and all three adults. At most a slight gradual push forward; no pan away, wipe, dissolve, jump, new angle, montage or exterior reveal.',
  physics:'ONE complete flat map persists from frame 1 through frame 10, with stable four corners, outer boundary, fold lines, markings, scale and position. Exactly three adults maintain the same identities and hand counts. One pointing gesture only. No map folding, unrolling, stretching, morphing, replacement, duplicate finger, shifting table or instant repairs.',
  audio:'Only restrained ambient period street sounds when visually supported, plus subtle clothing and hand movement. No spoken voices, narration, music, cinematic boom or unsupported sound.',
  extraNegative:'No second map, added paper, map transformation, new markings, readable labels, text, duplicate people, extra hands, camera cut, wipe, sudden street reveal, live action, photographic skin or 3D CGI.'
 };
}
function sanFrancisco1906P13(stage){
 if(stage!=='P13'||!/\bSan Francisco Earthquake\b/i.test(current())||!/\b1906\b/.test(current()))return null;
 return {
  approved:false,scientific:false,
  scene:'P13 SINGLE-ACTION ANTI-MORPH LOCK: 1906 San Francisco early cleanup in a modest residential courtyard, visually distinct from P12 commercial streets. ONE adult worker, ONE fully assembled small period handcart and ONE loose brick as the focal movable object. All three are visible together in frame 1. Both cart wheels, axle, box and handles are already present and remain unchanged for all 10 seconds. The same brick rests on the ground beside the same cart from the first frame; the worker bends, grips that brick, lifts it, moves it into the cart and releases it once. After release, the brick stays inside the cart. One stable damaged masonry wall stays in the background; no new breakage. No other workers, moving boards, extra carts, rebuilding, scene change, transition, sudden arrivals, or replacement objects. The quiet action shows that gradual cleanup has begun, without implying instant reconstruction.',
  narrative:'Early cleanup begins slowly after the earthquake. Narration is added in editing; no spoken voice in this clip.',
  timing:'0.0–2.0s: One worker, intact complete cart and one brick are already visible together. The worker bends toward the brick.\n2.0–6.0s: The same hands pick up the same single brick and place it in the cart in one unbroken motion.\n6.0–10.0s: The worker releases the brick; it stays in the cart. Hold the same composition and let the effort settle. No second task or new person.',
  camera:'Nearly locked medium-wide 2D anime shot from one fixed position. If needed, a minimal push of less than one step; no lateral reveal, pan, crane, cuts, dissolves, wipes, framing reset or new background areas.',
  physics:'The worker has exactly two hands and holds only one brick. One visible lift and one release. The cart, both wheels, handles and background masonry exist fully formed in frame 1 and keep their shape, position and count. No morph, growing wheels, changing shovel/cart, board multiplication, teleportation, suddenly filled cart or person appearing from the edge.',
  audio:'Only a single audible brick contact with the cart, fabric movement and quiet footsteps caused by visible movement. No speech, narration, music, extra construction sounds, or unsupported impacts.',
  extraNegative:'No transformation, hidden cut, montage, time-lapse, emerging cart, assembling wheel, new cast member, disappearing worker, moving debris pile, multiple brick transfers, camera pan, or instant rebuilding.'
 };
}
function sanFrancisco1906P5(stage){
 if(stage!=='P5'||!/\bSan Francisco Earthquake\b/i.test(current())||!/\b1906\b/.test(current()))return null;
 return {
   approved:false,
   scientific:false,
   scene:'ABSOLUTE NEW LOCATION: an OPEN WATERFRONT CARGO PIER in 1906 San Francisco, with open water occupying much of the background. This P5 is NOT a street, alley, storefront, doorway or building-corner scene. Begin with a wide unobstructed view across wooden pier boards, stacked crates, mooring lines and a moored period boat. A distinct adult woman dock worker and an older adult worker are in the open center of the pier, far from any wall. Strong earthquake shaking visibly jolts the pier, shifts a few crates and pulls mooring lines taut; the two workers crouch or move toward clear open space. One small stack of cargo topples naturally. Keep distant shore buildings secondary, with no foreground facade. Do not show a man hugging, gripping or leaning against a wall, post, doorway or building edge.',
   narrative:'The shaking intensifies and causes localized damage at the waterfront. Narration is added later in editing; no spoken words in this video.',
   timing:'0.0–1.0s: Show the open pier and water immediately. A visible jolt shakes the pier boards, cargo and mooring lines; both workers react.\n1.0–4.0s: Sustained earthquake motion slides several crates and sways the moored boat slightly against its lines. Camera tracks sideways across the open pier, keeping water clearly visible.\n4.0–7.0s: One cargo stack loses balance and falls onto the pier with believable weight while the two workers move away into clear space.\n7.0–10.0s: Continue shaking and show the localized pier damage from a wider angle. End before the peak citywide destruction of P6.',
   camera:'Wide diagonal view across an OPEN pier, at least half the composition showing open sky and water. One controlled lateral tracking move parallel to the waterfront. Keep people in open space, without foreground walls, columns, doorframes, building corners or a close-up man bracing on masonry.',
   physics:'Earthquake shaking causes pier boards, cargo and moored boat to respond coherently. Cargo falls under gravity; the boat remains moored. No tsunami, sudden water surge, ship sinking, large pier collapse, citywide collapse or fire.',
   audio:'Sound effects only: pier timber creak, shifting cargo, mooring ropes and one synchronized crate impact. No spoken words, narrator, dialogue, music or deep-earth sound.',
   extraNegative:'NO street, NO alley, NO storefront, NO doorway, NO building-corner foreground, NO man touching or hugging a wall, NO repeated P4 camera axis or cast, NO tsunami, NO voiceover, NO text.'
 };
}
function eventPanel(stage){
 return sanFrancisco1906P2(stage)||sanFrancisco1906P3(stage)||sanFrancisco1906P5(stage)||sanFrancisco1906P7(stage)||sanFrancisco1906P13(stage)||sanFrancisco1906P14(stage)||triStateTornadoPanel(stage)||rockyMountainLocustPanel(stage)||rockyMountainLocustLatePanel(stage)||nargisPanel(stage)||lituyaCause(stage);
}
function progression(stage,special){
 if(special)return null;
 return window.LDDisasterProgression?.stage?.(current(),stage)||null;
}
function progressionLock(stage,special){
 var p=progression(stage,special);
 if(!p)return special
   ? 'EVENT-SPECIFIC PROGRESSION OVERRIDE: This panel uses a dedicated event-specific scene and timing lock. The generic disaster-family stage is intentionally superseded.'
   : '';
 return 'DISASTER-FAMILY PROGRESSION LOCK:\nFamily: '+p.familyLabel+'.\nStage: '+stage+'.\nStory role: '+p.role+'.\nStage guard: '+p.rule+'\nEvidence guard: '+p.evidenceRule+'\nDo not jump ahead to a later panel, repeat the previous panel as the same shot, or pull recovery/aftermath imagery into an earlier stage.';
}
function stageNumber(stage){var n=parseInt(String(stage||'').replace(/\D/g,''),10);return Number.isFinite(n)?n:0;}
function familyKey(){return window.LDDisasterProgression?.family?.(current())||'generic';}
function previousStageName(stage){var n=stageNumber(stage);return n>1?'P'+(n-1):'';}
function previousApprovedContinuity(stage){
 var prev=previousStageName(stage);if(!prev)return '';
 var snap=window.ldApprovedMemory?.stages?.[prev]?.latest;
 var card=document.querySelector('.stage-card[data-stage="'+prev+'"]');
 var scene=clean(snap?.videoScene||card?.querySelector('.video-scene')?.value||card?.dataset?.videoScene||'');
 var narration=clean(snap?.narration||card?.querySelector('.narration')?.value||'');
 var summary=[scene,narration].filter(Boolean).join(' ');
 if(!summary)return '';
 if(summary.length<=620)return summary;
  var head=summary.slice(0,620);
  var boundary=Math.max(head.lastIndexOf('. '),head.lastIndexOf('! '),head.lastIndexOf('? '));
  if(boundary>=220)return head.slice(0,boundary+1).trim();
  var space=head.lastIndexOf(' ');
  return head.slice(0,space>220?space:620).trim()+'…';
}
function intensityDirector(stage){
 if(isSanFrancisco1906P2(stage))return 'INTENSITY: normal life only. Fault stress is invisible and explained by narration; show no warning sign, concern, shaking, ominous change, fire, damage or buildup before P3.';
 var n=stageNumber(stage),fam=familyKey();
 if(n===1)return 'INTENSITY: restrained normal-world tension. The scene must feel alive and cinematic, but do not foreshadow with impossible destruction.';
 if(n===2)return 'INTENSITY: subtle unease and controlled buildup. Increase atmosphere and anticipation without stealing the next panel’s hazard reveal.';
 if(n===3)return 'INTENSITY: first unmistakable danger. Make the developing hazard readable immediately, but preserve room for later escalation.';
 if(n===4||n===5)return 'INTENSITY: strong escalation with clear physical cause-and-effect. Use human/environment scale and mounting force rather than random chaos.';
 if(n===6)return 'INTENSITY: PEAK PRIMARY IMPACT. This is the strongest primary-disaster beat when consistent with the '+fam+' progression. Maximize scale, danger, depth and emotional pressure while keeping physics coherent and the image readable.';
 if(n===7||n===8)return 'INTENSITY: sustained major danger / wider impact. Keep the scene powerful but distinct from P6; broaden consequences rather than replaying the same composition.';
 if(n===9)return 'INTENSITY: immediate aftermath. Let visual shock come from scale of damage, silence, atmosphere and human reaction rather than new destruction.';
 if(n>=10&&n<=12)return 'INTENSITY: human consequence and wider impact. Favor emotionally grounded, purposeful action and strong environmental storytelling over spectacle.';
 if(n===13)return 'INTENSITY: restrained recovery. Use deliberate human-scale motion, visible damage continuity and cautious forward movement.';
 return 'INTENSITY: reflective cinematic closure. End with visual weight, historical memory and a composed final image; do not introduce a new disaster beat.';
}
function cameraDirector(stage,scientific){
 if(stage==='P14'&&sanFrancisco1906P14(stage))return 'CINEMATIC CAMERA DIRECTOR: nearly fixed medium-wide three-quarter view of all three adults and entire existing flat map; at most a minimal continuous push. No cuts, pan, jump, wipe, background reveal or viewpoint reset.';
 if(stage==='P13'&&/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current()))return 'CINEMATIC CAMERA DIRECTOR: hold one stable fixed 2D anime composition on the worker, the fully assembled cart and the single brick. No pan, orbit, crane, viewpoint reset, transition or new characters.';
 if(isSanFrancisco1906P2(stage))return 'CINEMATIC CAMERA DIRECTOR: one smooth lateral surface-level move through an intact 1906 San Francisco street, visually distinct from P1. Reveal ordinary life and period setting only. Do not expose warning signs, a fault, hidden mechanisms, shaking or environmental changes.';
 var n=stageNumber(stage);
 if(scientific)return 'CINEMATIC CAMERA DIRECTOR: one precise explanatory camera move only — restrained lateral reveal or slow push that clarifies mechanism and scale. Stable horizon, coherent lens, no dramatic handheld behavior, no orbit, no hidden cut.';
 var map={
  1:'CINEMATIC CAMERA DIRECTOR: composed wide-to-medium observational framing with subtle parallax or a very slow motivated dolly. Let normal life and spatial geography read clearly.',
  2:'CINEMATIC CAMERA DIRECTOR: slow lateral reveal or controlled creeping push that exposes developing environmental warning signs without showing the next major hazard beat.',
  3:'CINEMATIC CAMERA DIRECTOR: measured push toward the first unmistakable hazard cue. Keep foreground scale references and background threat in the same coherent visual axis.',
  4:'CINEMATIC CAMERA DIRECTOR: low-to-human-height tracking or restrained reveal that makes first contact / onset physically legible. Camera movement follows the action rather than circling it.',
  5:'CINEMATIC CAMERA DIRECTOR: street-level or human-scale medium-wide tracking with strong foreground–midground–background depth. Keep the main hazard readable while localized damage develops.',
  6:'CINEMATIC CAMERA DIRECTOR: professional peak-impact composition. Use a strong wide or medium-wide perspective with one foreground scale reference and the main hazard dominating depth. Controlled operator movement only; no frantic random shake.',
  7:'CINEMATIC CAMERA DIRECTOR: broaden the geography with an elevated, lateral or deep-perspective move. Show wider consequences without copying P6’s camera path.',
  8:'CINEMATIC CAMERA DIRECTOR: controlled trailing, receding or side-on composition that shows the hazard moving on / widening impact. Avoid another head-on peak shot.',
  9:'CINEMATIC CAMERA DIRECTOR: slow observational reveal of aftermath. Allow damage layers and human scale to enter naturally; avoid action-movie movement.',
 10:'CINEMATIC CAMERA DIRECTOR: human-height purposeful tracking following rescue, assessment or response. Keep faces and hands stable; camera does not outrun the subjects.',
 11:'CINEMATIC CAMERA DIRECTOR: intimate medium shot or gentle lateral move centered on lived consequence / relief. Prioritize human readability over spectacle.',
 12:'CINEMATIC CAMERA DIRECTOR: wider environmental composition with controlled movement that connects infrastructure, landscape and human consequence in one readable geography.',
 13:'CINEMATIC CAMERA DIRECTOR: calm purposeful tracking or restrained crane-like reveal showing cleanup / recovery at believable pace.',
 14:'CINEMATIC CAMERA DIRECTOR: slow, restrained final composition — gentle push, lateral reveal or nearly locked-off frame. Finish on a deliberate movie-ending image.'
 };
 return (map[n]||map[6])+' Maintain one lens family and coherent perspective for the whole 10 seconds. No zoom pumping, fisheye, random orbit, camera teleportation, viewpoint reset, wall pass-through or unmotivated shake.';
}
function weatherContinuityLock(stage){
 if(stage==='P2'&&/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current()))return 'WEATHER + ATMOSPHERE CONTINUITY LOCK: Keep the same visible light, weather and ground condition as P1 when established. If P1 does not establish a detail, leave it unspecified; do not invent wind, rain or an ominous atmospheric change. The 1906 street is intact and quiet before perceptible shaking in P3.';
 var prev=previousApprovedContinuity(stage);
 var bridge=prev?'\nPREVIOUS APPROVED PANEL CONTINUITY REFERENCE: '+prev:'';
 return 'WEATHER + ATMOSPHERE CONTINUITY LOCK:\nWeather is story continuity, not decoration. Preserve only weather and atmosphere details visibly established by the preceding approved panel; if cloud direction, wind, light direction, visibility, precipitation, ground wetness or dust are not established, leave them unspecified and do not invent them. Any established change must evolve progressively on-screen, never reset abruptly. Storm buildup must darken / thicken / intensify progressively; aftermath may ease only when the story position supports it. Keep foreground, midground and background readable; add atmospheric layers only when visibly established or caused within this panel.'+bridge;
}
function transitionMorphLock(stage){
 if(stage==='P14'&&sanFrancisco1906P14(stage))return 'MICRO-TRANSITION + MORPH CONTROL: one flat open map with stable four corners, markings and folds remains visible from the first through final frame. Exactly three people stay present. One short finger trace has continuous hand contact; no map redraw, unrolling, cut, new person or scenery change.';
 if(stage==='P13'&&/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current()))return 'MICRO-TRANSITION + MORPH CONTROL: keep the P13 worker, one brick and fully assembled cart persistent. Show hand contact before the brick lifts, continuous lift, single release, then stillness. No morphing, pop-in, cut, new person, extra tool, sudden cart or wheel formation.';
 return 'MICRO-TRANSITION + MORPH CONTROL:\nAll state changes need visible physical intermediates. Wind builds before objects accelerate. People brace, turn, stumble or react before changing position. Structures flex / strain / detach before failure. Debris begins moving before reaching speed. Damage never reverses. No morph dissolve, hidden cut, snap transformation, pop-in, pop-out, teleportation, duplicate person, replacement face, changing clothing, changing body proportions, geometry melt, respawn, spontaneous repair or unexplained object multiplication. Large objects keep identity, scale and orientation until a visible force changes them.';
}
function subjectObjectLock(){
 return 'SUBJECT + OBJECT PERSISTENCE LOCK:\nWithin this shot, each adult keeps the same face, age, hair, clothing, body proportions and accessories from first frame to last. Buildings, windows, roofs, poles, trees, fences, vehicles and large debris preserve geometry and identity unless visibly altered by a physical event. Across panels, reuse a recurring adult only when continuity context establishes that it is the same person; otherwise do not invent false character continuity.';
}
function audioDirector(stage){
  if(eventPanel(stage)?.audio)return 'PROFESSIONAL CINEMATIC AUDIO MIX: Follow the event-specific AUDIO section exactly. Use only the listed sounds when their cause is visible. Do not add generic hazard ambience, wind, rumble, voices, music or extra impacts. Keep natural timing and dynamic range for those permitted sounds.';
 if(isSanFrancisco1906P2(stage))return 'PROFESSIONAL CINEMATIC AUDIO MIX: sound effects only, quiet ordinary street ambience from visible activity. No human voices of any kind, narrator, speech, dialogue, singing, whispering or lip-sync. Maintain a stable soundscape. No tension rise, peak, rumble, rock strain, dramatic impact, alarm or music.';
 var n=stageNumber(stage);
 var phase=n<=2?'quiet tension with restrained ambience':n<=5?'rising environmental pressure with selective impacts':n<=8?'powerful hazard sound with controlled dynamic peaks':n===9?'post-impact atmosphere with space, distant detail and natural decay':n<=12?'human-scale ambience with restrained work / movement sounds':'quiet recovery / reflective ambience';
 return 'PROFESSIONAL CINEMATIC AUDIO MIX:\nAudio phase: '+phase+'. Use natural, scene-specific sound only unless music or dialogue is explicitly requested. Hierarchy: primary environmental hazard/ambience first, secondary environment second, occasional physically motivated impacts third, subtle human movement/reaction last. No repetitive identical impact loop, constant metallic clanging, random cinematic boom, camera whoosh, high-pitched continuous screech, artificial bass hit, unsupported explosion, or modern siren/alarm. Keep dynamic range: quieter tension → rising pressure → peak → natural decay when appropriate. Every major audible event must have a visible cause and occur in sync with the image.';
}
function debrisPhysicsLock(){
 return 'DEBRIS + DAMAGE PHYSICS LOCK:\nDebris obeys mass, gravity, wind direction and momentum. Light debris may rise higher; shingles and small boards may travel farther; heavy timber, furniture and structural fragments stay lower and move with believable inertia. No hovering heavy objects, reverse-direction debris without cause, giant foreground debris that blocks the main hazard, or sudden scale changes. Damage accumulates irreversibly: broken remains broken; detached remains detached; collapsed elements do not rebuild.';
}
function stageCastProfile(stage){
 if(isSanFrancisco1906P2(stage))return 'ordinary pre-disaster adults with neutral expressions, unaware of the coming earthquake';
 var n=stageNumber(stage);
 if(n===1)return 'normal life / pre-disaster adults';
 if(n===2)return 'pre-impact adults with subtle concern';
 if(n===3)return 'small number of adults recognizing danger';
 if(n===4||n===5)return 'exposed adults near first impact';
 if(n===6||n===7)return 'high-intensity survival adults and scattered bystanders';
 if(n===8||n===9)return 'aftermath survivors / affected adults';
 if(n>=10&&n<=12)return 'response, relief, affected families, workers or townspeople';
 if(n===13)return 'recovery adults / cleanup adults';
 return 'reflective survivors / community adults';
}
function stageCrowdLevel(stage){
 var n=stageNumber(stage);
 if(n<=2)return 'very small cast only';
 if(n===3||n===4)return 'small cast';
 if(n===5||n===6)return 'small-to-medium cast only when the location logically supports it';
 if(n===7||n===8)return 'medium cast if needed';
 if(n>=9&&n<=12)return 'small-to-medium cast with varied support/background adults';
 return 'small cast with selective background adults';
}
function roleWardrobePool(stage){
 var fam=familyKey(),n=stageNumber(stage);
 if(fam==='tornado'){
   if(n<=4)return 'historically appropriate everyday Midwestern adult clothing for the event year: varied hats, coats, dresses, work shirts, suspenders, aprons, boots, trousers, skirts and outerwear depending on class, weather and role';
   if(n<=8)return 'storm-exposed clothing with natural disorder: coats flapping, dust, loosened hats, wet or dirt-marked garments, but still historically appropriate and varied';
   return 'post-disaster / recovery clothing with historically appropriate adult workwear, aprons, coats, boots, hats, shawls, rolled sleeves and simple town/rural garments appropriate to the year and place';
 }
 if(fam==='insect')return 'historically appropriate rural/farming wardrobe variety: hats, bonnets, work shirts, aprons, dresses, suspenders, boots, coats and local workwear appropriate to the year and region';
 if(fam==='tsunami'||fam==='cyclone'||fam==='flood')return 'historically appropriate regional adult clothing varied by role, class and weather exposure, with practical differences across survivors, workers and townspeople';
 return 'historically appropriate adult wardrobe variety by role, class, weather and local setting';
}
function recurringCharacterPolicy(stage){
 var n=stageNumber(stage);
 if(n<=2)return 'If one principal adult is featured, preserve that person’s exact identity consistently across the whole shot.';
 if(n<=6)return 'If a principal adult or small group is central, preserve their exact identity consistently across the whole shot and keep them visually distinct from supporting adults.';
 if(n<=10)return 'Preserve any central survivor / responder identity when clearly foregrounded, but allow varied supporting adults around them.';
 return 'Use continuity only where narratively useful. Do not force every panel to reuse the same person, but if a recurring foreground adult appears, keep identity stable inside the shot.';
}
function characterDiversityLock(stage){
 if(stage==='P14'&&sanFrancisco1906P14(stage))return 'CHARACTER DIVERSITY + ANTI-CLONE LOCK: exactly THREE visibly distinct adults, each already present in the first frame. Preserve each face, hairstyle, clothing, body and two hands through the final frame. No new arrivals, cloned people, duplicate limbs or extra cast.';
 if(stage==='P13'&&/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current()))return 'CHARACTER DIVERSITY + ANTI-CLONE LOCK: exactly ONE adult worker in this shot, with a stable face, hat, clothing, body and two hands from first to last frame. No background people, no new arrivals, duplicates, silhouettes or partial human figures.';
 return 'CHARACTER DIVERSITY + ANTI-CLONE LOCK:\n'
  +'Cast profile: '+stageCastProfile(stage)+'.\n'
  +'Crowd level: '+stageCrowdLevel(stage)+'.\n'
  +'Wardrobe pool: '+roleWardrobePool(stage)+'.\n'
  +recurringCharacterPolicy(stage)+'\n'
  +'For supporting adults and background adults, introduce natural visual variation appropriate to the event year, location and social setting.\n'
  +'Vary face shape, age appearance, height, body build, hairstyle, headwear, outerwear, workwear, layering and clothing combinations.\n'
  +'Do not duplicate the same face, hairstyle, hat, coat, dress, apron, body proportions or clothing pattern across multiple adults unless a historically correct uniform or shared role specifically requires it.\n'
  +'Crowds must feel naturally varied and human, not cloned. Avoid background extras that look like copies of the foreground subject.\n'
  +'No mirrored crowd members. No repeated identical silhouettes lined up unnaturally. No accidental twin copies created by the generator.\n'
  +'If a family or repeated small group appears, keep each member recognizably consistent while preserving clear visual differences between individuals.\n'
  +'Controlled variation only: never randomize away established identity, era, ethnicity, local dress norms, role, weather exposure or continuity.';
}
function antiClonePromptCompatible(text){
 var s=String(text||'');
 return s.includes('CHARACTER DIVERSITY + ANTI-CLONE LOCK:');
}
function cinematicMasterLock(stage,scientific){
 return 'MASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY:\n'
  +intensityDirector(stage)+'\n'
  +transitionMorphLock(stage)+'\n'
  +subjectObjectLock()+'\n'
  +characterDiversityLock(stage)+'\n'
  +weatherContinuityLock(stage)+'\n'
  +debrisPhysicsLock()+'\n'
  +cameraDirector(stage,scientific)+'\n'
  +audioDirector(stage)+'\n'
  +'ERA + ACCURACY: every visible and audible element must fit the locked year, location and verified event context. Never add modern vehicles, electronics, warning systems, emergency gear, architecture, tools, signage or sound cues unless supported. Historical accuracy outranks drama.\n'
  +'FRAME QUALITY TEST: first, middle and final frames must preserve style, recurring-subject identity, supporting-cast diversity, environment geometry, weather logic, lens perspective and story-stage boundaries. Intensity comes from scale, staging, timing, depth and believable reaction — never random chaos.';
}
function qualityPromptCompatible(text){
 var s=String(text||'');
 return s.includes('MASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY:')
   &&s.includes('MICRO-TRANSITION + MORPH CONTROL:')
   &&s.includes('CHARACTER DIVERSITY + ANTI-CLONE LOCK:')
   &&s.includes('WEATHER + ATMOSPHERE CONTINUITY LOCK:')
   &&s.includes('CINEMATIC CAMERA DIRECTOR:')
   &&s.includes('PROFESSIONAL CINEMATIC AUDIO MIX:')
   &&s.includes('DEBRIS + DAMAGE PHYSICS LOCK:');
}
function clean(value){return window.ldCleanNarrationInstructions?window.ldCleanNarrationInstructions(value):String(value||'').trim();}
function normalizedSignature(value){try{var parts=JSON.parse(value);if(window.LDStoryModes?.enabled())return parts[0]==='fiction-v1'?JSON.stringify(parts):'';if(parts[0]!==T2V_POLICY_VERSION)return '';parts[6]=clean(parts[6]);parts[7]=clean(parts[7]);return JSON.stringify(parts);}catch(e){return '';}}
function pinScene(card){
 if(String(card.dataset.videoScene||'').startsWith('SMART RANDOM CHOICE — ')){
  var item=smartSceneItem(card);
  if(item){card.dataset.sceneChoice=String(item.index);card.dataset.videoScene='SMART RANDOM CHOICE — '+selectedScene(card,item.index);var field=card.querySelector('.video-scene');if(field)field.value=card.dataset.videoScene;}
 }
 var special=eventPanel(card.dataset.stage);
 if(special&&special.scene&&sceneChoiceIndex(card)===''){
   card.dataset.videoScene=clean(special.scene);
   var field=card.querySelector('.video-scene');
   if(field)field.value=card.dataset.videoScene;
   return;
 }
 if(!state(card).scene)card.dataset.videoScene=clean(sceneFrom(card));
}
function sceneLocationKey(scene){
 // Pick the earliest positive place named in the opening scene setup, not a later "avoid the waterfront" negative.
 var s=String(scene||'').toLowerCase().slice(0,520);
 var patterns=[
  ['waterfront',/waterfront|cargo pier|wharf|dockside|harbor quay/g],
  ['courtyard',/courtyard|residential yard|home yard|backyard/g],
  ['residential interior',/(?:inside|interior).{0,45}(?:residence|home|bedroom|kitchen|dining room|apartment)/g],
  ['workplace interior',/(?:inside|interior).{0,45}(?:shop|market|workshop|factory)/g],
  ['street',/street|road|sidewalk|alley|building.corner|storefront|intersection/g],
  ['relief interior',/shelter|hospital|clinic|relief center/g],
  ['field',/field|farm|crop/g],
  ['shore',/shore|coast|beach|seawall/g]
 ];
 var found=patterns.map(function(row){var m=row[1].exec(s);return m?{key:row[0],at:m.index}:null;}).filter(Boolean).sort(function(a,b){return a.at-b.at;});
 return found[0]?.key||'';
}
function sceneActionKey(scene){
 var s=String(scene||'').toLowerCase();
 if(/(?:man|adult|person).{0,90}(?:hug|grip|brace|lean|hold).{0,45}(?:wall|doorway|building|post)/.test(s))return 'wall brace';
 if(/cargo|crate|mooring/.test(s))return 'cargo motion';
 if(/ceiling|plaster|tableware/.test(s))return 'interior damage';
 if(/rescue|search|aid|shelter/.test(s))return 'response';
 if(/collapse|facade|masonry|roof/.test(s))return 'structural damage';
 return '';
}
function sceneVarietyIssue(card){
 if(window.LDStoryModes?.enabled())return '';
 var stage=card?.dataset?.stage||'',n=stageNumber(stage);
 if(n<2)return '';
 var previous=document.querySelector('.stage-card[data-stage="P'+(n-1)+'"]');
 if(!previous)return '';
 var now=sceneChoiceIndex(card)!==''?String(card.dataset.videoScene||card.querySelector('.video-scene')?.value||'').trim():(eventPanel(stage)?.scene||String(card.querySelector('.video-scene')?.value||card.dataset.videoScene||'').trim());
 var before=sceneChoiceIndex(previous)!==''?String(previous.dataset.videoScene||previous.querySelector('.video-scene')?.value||'').trim():(eventPanel('P'+(n-1))?.scene||String(previous.querySelector('.video-scene')?.value||previous.dataset.videoScene||'').trim());
 if(!now||!before)return '';
 var a=sceneLocationKey(now),b=sceneLocationKey(before),actionA=sceneActionKey(now),actionB=sceneActionKey(before);
 var sanFrancisco=/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current());
 if(a&&a===b&&sanFrancisco&&n>=3&&n<=6)return 'LOCAL SCENE VARIETY CHECK: '+stage+' repeats the '+b+' setup from P'+(n-1)+'. Choose a different primary place and camera position before AI Audit. This check uses no API credits.';
 if(a&&a===b&&actionA&&actionA===actionB)return 'LOCAL SCENE VARIETY CHECK: '+stage+' repeats the '+b+' location and '+actionA+' action from P'+(n-1)+'. Change both before AI Audit. This check uses no API credits.';
 return '';
}
function adjacentSceneLock(stage){
 var n=stageNumber(stage);if(n<2)return '';
 var previous=document.querySelector('.stage-card[data-stage="P'+(n-1)+'"]');
 var prior=previous&&(sceneChoiceIndex(previous)!==''?(previous.dataset.videoScene||previous.querySelector('.video-scene')?.value||''):(eventPanel('P'+(n-1))?.scene||previous.querySelector('.video-scene')?.value||previous.dataset.videoScene||''));
 return 'PANEL SCENE IDENTITY LOCK: Give '+stage+' its own primary place, camera angle, foreground action and cast. The prior panel P'+(n-1)+' used '+(sceneLocationKey(prior)||'its established setting')+' and '+(sceneActionKey(prior)||'its established action')+'. Keep historical continuity while changing the visual setup where the narrative permits. Never repeat a wall-bracing foreground adult, identical street corner, camera axis or background layout with only different faces. The current PANEL SCENE and event-specific timing have priority over this variety rule.';
}
function signature(card){if(window.LDStoryModes?.enabled())return JSON.stringify(['fiction-v1',window.LDStoryModes.category(),current(),format(),style(),colorMode(),clean(sceneFrom(card)),clean(card.querySelector('.narration').value),String(document.getElementById('storyPremise')?.value||''),String(document.getElementById('storyBible')?.value||''),window.ldStoryEpisode||null,card.dataset.storyVoice||'none',card.dataset.storyFocus||'auto']);var dna=window.LDProductionDNA?.signature?.()||'';var progressionVersion=(window.LDDisasterProgression?.version||'')+(window.ldNarrativeFormat==='causal-v1'?':causal-v1':'');return JSON.stringify([T2V_POLICY_VERSION,current(),format(),style(),colorMode(),continuity(),clean(sceneFrom(card)),clean(card.querySelector('.narration').value),dna,progressionVersion]);}
function sanFranciscoP11AnimePrompt(card){
 var narration=clean(card.querySelector('.narration')?.value)||'Temporary camps and emergency aid appear as people face displacement.';
 var custom=String(card.dataset.videoScene||'');
 var scene=/^SMART RANDOM CHOICE — PRIMARY LOCATION:|^PRIMARY LOCATION:/.test(custom)
  ? 'Use the selected P11 relief location: '+custom.replace(/^SMART RANDOM CHOICE — /,'')+' Keep the aid handoff and human displacement as the only focal action.'
  : 'At a temporary 1906 San Francisco relief camp, two distinct adults complete one visible handoff of a small bundle of provisions beside period canvas shelters and a rough wooden table. One other adult waits with an empty container. Damaged city buildings remain far in the background. Exactly three foreground adults, each with a different face, hair and historically plausible clothing.';
 var result='VIDEO PROMPT — EXACTLY 10 SECONDS\n'+current()+' · P11\n\n'
  +absoluteStyleLock()+'\n\n'
  +'P11 2D ANIME FRAME LOCK: Every frame MUST look like a drawn and animated black-and-white historical anime panel: visible ink contours around faces, hands, fabric and buildings; deliberately drawn anime facial features; clean grayscale cel shading and hand-painted 2D background planes. This applies to the first, middle and final frames, including every background person. Black-and-white film grain is subtle texture ON TOP OF THE DRAWING; never simulate photographic footage, camera-captured faces or natural photographic skin.\n\n'
  +'TEXT-TO-VIDEO. Portrait 9:16. One uninterrupted 10-second shot in San Francisco, California, USA, 1906. No image reference.\n\n'
  +'CHAPTER CONTINUITY LOCK: Same true black-and-white 2D anime world as the approved HOOK and P1–P10. 1906 clothing, simple relief supplies and period canvas shelter construction. Do not introduce modern agencies, vehicles or technology.\n'
  +'DISASTER-FAMILY PROGRESSION LOCK: P11 shows displacement and limited immediate aid after the quake. P10 street rescue has ended; P12 wider infrastructure consequences have not begun.\n\n'
  +'PANEL SCENE:\n'+scene+'\n\n'
  +'NARRATIVE CONTEXT — not spoken, not on screen: '+narration+'\n\n'
  +'TIMING: 0.0–2.0s: Show the 2D-drawn relief scene immediately with the bundle and hands visible. 2.0–7.0s: One careful handoff as the camera tracks sideways. 7.0–10.0s: The recipient steps aside; the third adult waits. No collapse or dramatic new disaster beat.\n\n'
  +'MASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY: Keep the three faces, clothes, hands, bundle and shelter geometry consistent from first to last frame.\n'
  +'MICRO-TRANSITION + MORPH CONTROL: The bundle stays in one pair of hands until it visibly transfers to the other; no object multiplication or face changes.\n'
  +'CHARACTER DIVERSITY + ANTI-CLONE LOCK: Three distinct drawn adult faces and period outfits; no duplicate extras or photographic people.\n'
  +'WEATHER + ATMOSPHERE CONTINUITY LOCK: Keep only light, visibility, ground and weather conditions established in P10; do not invent new atmospheric cues.\n'
  +'DEBRIS + DAMAGE PHYSICS LOCK: Existing background damage remains stable. No new collapse, hovering objects or changing geometry.\n'
  +'CINEMATIC CAMERA DIRECTOR: One gentle lateral track at human height. Retain inked linework and flat grayscale shading during movement.\n'
  +'PROFESSIONAL CINEMATIC AUDIO MIX: Soft footsteps, cloth and the visible bundle/table contact only. No voice, dialogue, narration or music.\n\n'
  +'CAMERA: One continuous lateral 2D animated camera move; no photographic lens artifacts or viewpoint cuts.\n'
  +'PHYSICS AND TIME: A single believable handoff. Every person and object remains stable across all 10 seconds.\n'
  +'AUDIO: Small visible object and movement SFX only; no voices or music.\n'
  +'NEGATIVE: No live action, photorealistic people, photographic skin, 3D CGI humans, grayscale film footage, newsreel capture, modern objects, captions, logos, or color.\n'
  +'STATUS: FOR TESTING — review the rendered animation before approval.';
 result=window.LDStoryFormat?.decorate(result,stage,format())||result;
 return window.LDProductionDNA?.polishPrompt?window.LDProductionDNA.polishPrompt(card,result):result;
}
function build(card){
 if(window.LDStoryModes?.enabled())return window.LDStoryModes.video(card,current(),format(),style(),colorMode());
 var scene=cleanSceneText(sceneFrom(card));
 if(!scene)throw Error('Add the panel scene description first.');
 if(!ready())throw Error('Set the shared year and location before creating Text-to-Video prompts.');
 var stage=card.dataset.stage;
 if(stage==='P11'&&/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current())&&style()==='anime'&&colorMode()==='bw')return window.LDStoryFormat?.decorate(sanFranciscoP11AnimePrompt(card),stage,format())||sanFranciscoP11AnimePrompt(card);
 var special=choiceSpecial(card,eventPanel(stage));
 if(special&&special.scene)scene=special.scene;
 scene=sanitizeSceneForStyle(scene);
 var familyProgression=progression(stage,special);
 var scientific=special?!!special.scientific:scientificScene(card,scene);
 var camera=cameraDirector(stage,scientific);
 var modeLine=style()==='real'
   ? (scientific?'Photorealistic historical documentary explanatory visualization. This is a scientific cutaway, not an eyewitness human-camera scene. No anime or illustration.':'Photorealistic REAL HUMAN historical documentary recreation. No anime or illustration.')
   : (colorMode()==='bw'?'Serious 2D historical graphic-novel/anime animation in STRICT true black-and-white grayscale only. No live action, no photorealism, no color, no sepia, no tint, no selective color.':'Serious 2D historical graphic-novel/anime animation. No live action.');
 var timing=special&&special.timing?special.timing:(scientific
   ? '0.0–2.0s: Establish the geological or scientific setting and the focal mechanism clearly; readable natural motion begins within the first half-second.\n2.0–7.0s: Continue the same mechanism with restrained, coherent cause-and-effect motion at plausible scale.\n7.0–10.0s: Sustain the buildup or explanatory beat and end on a clear readable composition without jumping to the next story stage.'
   : '0.0–2.0s: Establish the described setting, visible adult positions when adults are present, and one clear focal action; readable natural motion begins within the first half-second.\n2.0–7.0s: Continue that same action with coherent cause and effect, natural momentum and local environmental response.\n7.0–10.0s: Sustain the panel’s intended beat and finish on a readable composition; do not jump to the next story stage.');
 var physics=special&&special.physics?special.physics:(scientific
   ? 'This panel is an explanatory scientific visualization. Do not depict invisible subsurface processes as ordinary eyewitness footage. Keep the mechanism grounded, restrained and physically plausible. No fantasy energy, glowing magic cracks or exaggerated sci-fi effects. Preserve plausible geological scale and cause-and-effect.'
   : 'Only the selected disaster mechanism belongs here. Calm scenes stay calm. Slow-onset effects are already present; no instant infection, starvation, crop death or insect reproduction. Preserve object count, human identity when people are present, and plausible scale throughout the clip.');
 var audio=special&&special.audio?special.audio:(scientific
   ? 'Restrained natural documentary ambience appropriate to the mechanism, such as low underwater rumble, rock strain or deep-earth vibration when supported by the scene. No voiceover or music.'
   : 'Natural scene-specific ambience and SFX only. No voiceover or music.');
 var negative=scientific
   ? 'No children, gore, human figures unless the panel specifically requires them, fantasy energy, glowing sci-fi fault lines, unsupported destruction, unrelated disaster, modern objects outside the era, text, captions, logos or watermark.'
   : 'No children, gore, duplicated people, distorted anatomy, morphing, giant insects, unsupported destruction, unrelated disaster, modern objects outside the era, text, captions, logos or watermark.';
 if(style()==='anime')negative+=' ABSOLUTE STYLE NEGATIVE: no live action, no photorealistic humans, no photographic skin, no newsreel-looking real people, no 3D CGI people.';
 else negative+=' ABSOLUTE STYLE NEGATIVE: no anime, no illustration, no graphic-novel people, no 3D CGI people.';
 if(special&&special.extraNegative)negative+=' '+special.extraNegative;
 var result='VIDEO PROMPT — EXACTLY 10 SECONDS\n'+current()+' · '+stage+'\n\n'
   +absoluteStyleLock()+'\n\n'
   +(universalHookDna()?universalHookDna()+'\n\n':'')
   +'TEXT-TO-VIDEO. Create the entire scene from this description. No reference image is required. '+(format()==='shorts'?'Portrait 9:16.':'Landscape 16:9.')+' One continuous shot. '+modeLine
   +'\n\n'+lock()
   +'\n\n'+progressionLock(stage,special)
   +'\n\nPANEL SCENE:\n'+scene+'\n\n'+adjacentSceneLock(stage)
   +'\n\nNARRATIVE CONTEXT — not spoken, not on screen:\n'+(isSanFrancisco1906P2(stage)?'Do not include any narration text or spoken explanation in this video. Fault stress is invisible and will be narrated separately during editing.':(special&&special.narrative?special.narrative:(card.querySelector('.narration').value.trim()||'Follow this panel scene only; do not invent narration or statistics.')))
   +'\n\nTIMING:\n'+timing
   +'\n\n'+cinematicMasterLock(stage,scientific)
   +'\n\nCAMERA:\n'+(special&&special.camera?(special.camera+' '+camera):camera)
   +'\n\nPHYSICS AND TIME:\n'+physics+' '+debrisPhysicsLock()
   +'\n\nAUDIO:\n'+audio+'\n'+audioDirector(stage)
   +'\n\nNEGATIVE:\n'+negative
   +'\n\nSTATUS: '+(special&&special.approved?(special.approvedLabel+' — locked final prompt.'):'FOR TESTING — review historical details and rendered continuity before approval.');
 result=window.LDStoryFormat?.decorate(result,stage,format())||result;
 return window.LDProductionDNA?.polishPrompt?window.LDProductionDNA.polishPrompt(card,result):result;
}
function generate(card){try{rebuildTextPrompt(card);}catch(e){showToast(e.message);}}
function completeTextPrompt(text){
 var s=String(text||'');
 return s.includes('VIDEO PROMPT — EXACTLY 10 SECONDS')&&s.includes('PANEL SCENE:')&&s.includes('TIMING:')&&s.includes('CAMERA:')&&s.includes('PHYSICS AND TIME:')&&s.includes('AUDIO:')&&s.includes('NEGATIVE:');
}
function rebuildTextPrompt(card){
 if(window.LDStoryModes?.enabled()){
  var text=build(card);card.dataset.textVideoPrompt=text;card.dataset.textVideoSignature=signature(card);
  var field=card.querySelector('.text-video-prompt');if(field)field.value=text;
  saveCurrent();update(card);syncGlobalControl();return text;
 }
 pinScene(card);
 var text=build(card);
 if(!promptStyleCompatible(text))throw Error('Visual-style lock mismatch. Rebuild the panel prompt before approval.');
 if(!qualityPromptCompatible(text))throw Error('Cinematic consistency lock is incomplete. Rebuild the panel prompt before approval.');
 if(!antiClonePromptCompatible(text))throw Error('Character diversity / anti-clone lock is incomplete. Rebuild the panel prompt before approval.');
 card.dataset.textVideoPrompt=text;
 card.dataset.textVideoSignature=signature(card);
 var ta=card.querySelector('.text-video-prompt');
 if(ta)ta.value=text;
 saveCurrent();
 update(card);
 syncGlobalControl();
 return text;
}
function valid(card){if(window.LDStoryModes?.enabled())return completeTextPrompt(state(card).text)&&state(card).text.includes('CHARACTER + WORLD BIBLE:')&&normalizedSignature(state(card).signature)===signature(card);if(card.dataset.stage==='P14'&&sanFrancisco1906P14('P14')&&!state(card).text.includes('P14 APPROVED SINGLE-MAP CONTINUITY LOCK:'))return false;if(card.dataset.stage==='P13'&&/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current())&&!card.querySelector('.done-toggle')?.checked&&!state(card).text.includes('P13 SINGLE-ACTION ANTI-MORPH LOCK:'))return false;if(card.dataset.stage==='P11'&&/\bSan Francisco Earthquake\b/i.test(current())&&/\b1906\b/.test(current())&&style()==='anime'&&colorMode()==='bw'&&!card.querySelector('.done-toggle')?.checked&&!state(card).text.includes('P11 2D ANIME FRAME LOCK:'))return false;return completeTextPrompt(state(card).text)&&promptStyleCompatible(state(card).text)&&qualityPromptCompatible(state(card).text)&&antiClonePromptCompatible(state(card).text)&&normalizedSignature(state(card).signature)===signature(card)&&ready();}
function legacyCompletionReady(card){
 if(!supports(card)||state(card).mode!=='text')return false;
 if(!card.querySelector('.narration')?.value.trim())return false;
 return completeTextPrompt(state(card).text);
}
function completionReady(card){
 if(!supports(card))return false;
 if(state(card).mode!=='text')return true;
 if(!ready())return false;
 if(!card.querySelector('.narration')?.value.trim())return false;
 if(valid(card))return true;
 try{return completeTextPrompt(rebuildTextPrompt(card));}catch(e){return false;}
}
function completionIssue(card){
 if(!ready())return 'Set the shared event year and main location first.';
 if(!card.querySelector('.narration')?.value.trim())return 'Add the panel narration first.';
 if(!completeTextPrompt(state(card).text))return 'Build the FULL Text-to-Video prompt first.';
 return 'Refresh the Text-to-Video prompt, then mark Done.';
}
function prompt(card){
 if(supports(card)&&state(card).mode==='text'){
   if(!valid(card))return rebuildTextPrompt(card);
   return state(card).text;
 }
 var base=card.querySelector('.flow-prompt').value;
 if(!base.trim())throw Error('This panel has no Image-to-Video prompt yet.');
 var out=withLock(base);
 result=window.LDStoryFormat?.decorate(result,stage,format())||result;
 return window.LDProductionDNA?.polishPrompt?window.LDProductionDNA.polishPrompt(card,out):out;
}
function update(card){if(!supports(card))return;var mode=state(card).mode;
card.querySelector('.flow-wrap').hidden=mode==='text';
var panel=card.querySelector('.text-video-fields');if(panel)panel.hidden=mode!=='text';var picker=card.querySelector('.scene-choice');if(picker)picker.disabled=!sceneChoiceAllowed(card);
var image=card.querySelector('.image-prompt').closest('.field-block');if(image)image.hidden=mode==='text';
var workspace=card.querySelector('.image-workspace');if(workspace)workspace.hidden=mode==='text';
var status=card.querySelector('.video-mode-status');var statusText=mode==='image'?'Use a starting image with the Image-to-Video prompt.':valid(card)?'Text-to-Video ready for testing · no starting image needed.':'Text-to-Video needs building or refresh. Copy FULL Video Prompt will rebuild it automatically.';if(status&&status.textContent!==statusText)status.textContent=statusText;
var fullBtn=card.querySelector('.copy-active-video');if(fullBtn)fullBtn.textContent=mode==='text'?'Copy FULL Text-to-Video Prompt':'Copy FULL Image-to-Video Prompt';
var label=card.querySelector('.flow-wrap label');if(label&&label.textContent!=='Image-to-Video prompt')label.textContent='Image-to-Video prompt';}
function decorate(card){if(!supports(card)||card.querySelector('.video-mode-controls'))return;
// Restore the exact scene used by older saved text prompts before image helpers run.
if(state(card).text&&!state(card).scene){try{var saved=JSON.parse(state(card).signature);if(Array.isArray(saved)&&typeof saved[4]==='string')card.dataset.videoScene=clean(saved[4]);}catch(e){}}

var box=document.createElement('div');box.className='video-mode-controls';box.innerHTML='<p class="video-mode-status"></p><button type="button" class="ghost copy-active-video">Copy FULL Video Prompt</button><div class="text-video-fields"><label>Choose scene location before Smart Continue<select class="scene-choice"><option value="">Keep current scene</option><option value="smart">✨ SMART RANDOM CHOICE</option></select></label><label>Panel scene description<textarea class="video-scene" rows="4"></textarea></label><button type="button" class="ghost build-text-video">Build / refresh Text-to-Video prompt</button><details class="text-prompt-details"><summary>View Full Prompt</summary><label>Full Text-to-Video prompt<textarea class="text-video-prompt" rows="20"></textarea></label></details><button type="button" class="ghost copy-text-video">Copy FULL Text-to-Video Prompt</button></div>';
card.querySelector('.flow-wrap').before(box);
var promptDetails=box.querySelector('.text-prompt-details');promptDetails.addEventListener('toggle',function(){promptDetails.querySelector('summary').textContent=promptDetails.open?'Hide Full Prompt':'View Full Prompt';});
var picker=box.querySelector('.scene-choice');
availableScenes(card).forEach(function(item){var option=document.createElement('option');option.value=String(item.index);option.textContent=item.place;picker.appendChild(option);});
picker.value=String(card.dataset.videoScene||'').startsWith('SMART RANDOM CHOICE — ')?'smart':sceneChoiceIndex(card);
picker.disabled=!sceneChoiceAllowed(card);
picker.onchange=function(){
 if(!sceneChoiceAllowed(card)){picker.value=card.dataset.sceneChoice||'';return showToast('This panel is approved or has a dedicated locked scene.');}
 var chosen=picker.value;
 if(!chosen)return;
 var selected=chosen==='smart'?smartSceneItem(card):availableScenes(card).find(function(item){return item.index===Number(chosen);});
 if(!selected)return showToast('No historically suitable setting is available for this panel.');
 var description=(chosen==='smart'?'SMART RANDOM CHOICE — ':'')+selectedScene(card,selected.index);if(!description)return;
 card.dataset.sceneChoice=String(selected.index);
 card.dataset.videoScene=description;
 scene.value=description;
 card.dataset.textVideoPrompt='';card.dataset.textVideoSignature='';
 var field=box.querySelector('.text-video-prompt');if(field)field.value='';
 card.querySelector('.done-toggle').checked=false;
 try{rebuildTextPrompt(card);showToast('Scene selected and prompt refreshed locally · no API call. Review before Smart Continue.');}
 catch(e){showToast(e.message);update(card);saveCurrent();}
};
var scene=box.querySelector('.video-scene');scene.value=sceneFrom(card);if(!state(card).scene&&!state(card).text&&scene.value){card.dataset.videoScene=scene.value;}var text=box.querySelector('.text-video-prompt');text.value=state(card).text;

scene.oninput=function(){card.dataset.sceneChoice='';picker.value='';card.dataset.videoScene=scene.value;card.querySelector('.done-toggle').checked=false;update(card);saveCurrent();};
text.oninput=function(){card.dataset.textVideoPrompt=text.value;card.querySelector('.done-toggle').checked=false;saveCurrent();};
box.querySelector('.build-text-video').onclick=function(){generate(card);};
box.querySelector('.copy-text-video').onclick=function(){try{copyText(prompt(card));}catch(e){showToast(e.message);}};
box.querySelector('.copy-active-video').onclick=function(){try{copyText(prompt(card));}catch(e){showToast(e.message);}};
update(card);}
function panelCards(){return Array.from(document.querySelectorAll('.stage-card')).filter(supports);}
function selectedMode(){var cards=panelCards();if(!cards.length)return '';var mode=state(cards[0]).mode;return cards.every(function(c){return state(c).mode===mode;})?mode:'mixed';}
function syncGlobalControl(){var root=document.getElementById('productionVideoMethod');if(!root)return;var cards=panelCards(),mode=selectedMode();root.querySelectorAll('[data-method]').forEach(function(button){button.disabled=!cards.length;button.setAttribute('aria-pressed',String(button.dataset.method===mode));});var pending=cards.filter(function(c){return state(c).mode==='text'&&!valid(c);}).length;
var message=!cards.length?'Create or open a Shorts production to choose the video method.':mode==='mixed'?'This saved production has mixed methods. Choose one button to apply it to every panel.':(mode==='text'?'Text-to-Video':'Image-to-Video')+' is active for all '+cards.length+' panels.';
if(pending)message+=' '+pending+' text prompts need building or refresh; check the shared setting below.';
var status=root.querySelector('.production-video-status');if(status.textContent!==message)status.textContent=message;}
function setAllMode(mode){
 var locked=window.LDProjectLocks?.videoMode?.()||window.ldProjectLocks?.videoMode;
 if(window.ldProjectLocks?.locked&&locked&&mode!==locked){showToast('Video Mode is locked for this project.');return;}
 if(mode!=='image'&&mode!=='text')return;var cards=panelCards();if(!cards.length)return;
var built=0;cards.forEach(function(card){if(state(card).mode!==mode)card.querySelector('.done-toggle').checked=false;card.dataset.videoMode=mode;
// Build only missing text versions. Switching never replaces an edited prompt.
if(mode==='text'&&!valid(card)&&ready()){try{pinScene(card);card.dataset.textVideoPrompt=build(card);card.dataset.textVideoSignature=signature(card);var text=card.querySelector('.text-video-prompt');if(text)text.value=state(card).text;built++;}catch(e){/* Keep the panel's missing-prompt status visible. */}}
});all();saveCurrent();window.dispatchEvent(new Event('ld:video-mode-changed'));showToast((mode==='text'?'Text-to-Video':'Image-to-Video')+' applied to all '+cards.length+' panels'+(built?' · '+built+' prompts built':''));}
function rebuildAll(force){
 if(!ready())return 0;
 var count=0;
 panelCards().forEach(function(card){
   if(state(card).mode==='text'&&(force||!valid(card))){
     rebuildTextPrompt(card);
     count++;
   }
 });
 return count;
}
function resignAll(){
 var count=0;
 panelCards().forEach(function(card){
   if(state(card).mode==='text'&&completeTextPrompt(state(card).text)){
     card.dataset.textVideoSignature=signature(card);
     count++;
   }
 });
 // Signature refresh is metadata-only: prompts, narration, scenes and DONE checks stay untouched.
 saveCurrent();
 return count;
}
function sanitizeSceneForMode(value){
 var s=String(value||'').trim();
 if(style()==='real'){
   s=s.replace(/serious 2D historical graphic-novel\/anime animation/gi,'photorealistic historical documentary recreation')
      .replace(/serious 2D historical anime \/ graphic-novel visual world/gi,'photorealistic historical live-action documentary world')
      .replace(/historical-anime documentary shot/gi,'historical documentary shot')
      .replace(/historical anime documentary-style/gi,'historical documentary')
      .replace(/historical anime scene/gi,'historical live-action scene')
      .replace(/\b2D historical anime\b/gi,'photorealistic historical live-action')
      .replace(/\banime adult characters\b/gi,'real adult humans');
 }else{
   s=s.replace(/photorealistic REAL HUMAN historical documentary recreation/gi,'serious 2D historical graphic-novel/anime animation')
      .replace(/photorealistic historical live-action documentary world/gi,'serious 2D historical anime / graphic-novel visual world')
      .replace(/historical live-action documentary shot/gi,'historical anime documentary-style shot')
      .replace(/historical live-action scene/gi,'historical anime scene')
      .replace(/\bphotorealistic historical live-action\b/gi,'2D historical anime')
      .replace(/\breal adult humans\b/gi,'grounded adult characters');
 }
 return s.replace(/\s{2,}/g,' ').trim();
}
function hardResetVisualMode(){
 var cards=panelCards();
 var rebuilt=0;
 refreshAutoDnaUi();
 cards.forEach(function(card){
   var special=eventPanel(card.dataset.stage);
   var scene=special&&special.scene?special.scene:sanitizeSceneForMode(state(card).scene||sceneFrom(card));
   card.dataset.videoScene=clean(scene);
   var sceneField=card.querySelector('.video-scene');
   if(sceneField)sceneField.value=card.dataset.videoScene;
   card.dataset.textVideoPrompt='';
   card.dataset.textVideoSignature='';
   var textField=card.querySelector('.text-video-prompt');
   if(textField)textField.value='';
   var done=card.querySelector('.done-toggle');
   if(done)done.checked=false;
   if(ready()){
     try{
       card.dataset.textVideoPrompt=build(card);
       card.dataset.textVideoSignature=signature(card);
       if(textField)textField.value=card.dataset.textVideoPrompt;
       rebuilt++;
     }catch(e){}
   }
 });
 all();
 saveCurrent();
 window.dispatchEvent(new CustomEvent('ld:visual-mode-hard-reset',{detail:{mode:style(),rebuilt:rebuilt}}));
 return rebuilt;
}
function globalControl(){var root=document.getElementById('productionVideoMethod');if(!root){root=document.createElement('section');root.id='productionVideoMethod';root.className='video-mode-controls';root.innerHTML='<h3>Video method · P1–P14</h3><div class="production-video-buttons" role="group" aria-label="Video method for all panels"><button type="button" class="ghost" data-method="image" aria-pressed="false">Image-to-Video</button><button type="button" class="ghost" data-method="text" aria-pressed="false">Text-to-Video</button></div><p class="production-video-status" role="status"></p><p>One choice applies to every panel. Both prompt versions stay saved.</p>';var setup=document.getElementById('buildBtn').closest('section');setup.after(root);root.querySelectorAll('[data-method]').forEach(function(button){button.onclick=function(){setAllMode(button.dataset.method);};});}syncGlobalControl();}
function panel(){globalControl();var old=document.getElementById('chapterVideoContext');if(old)old.remove();if(!document.querySelector('.stage-card'))return;if(window.LDStoryModes?.enabled()){all();return;}
hydrateContinuityFromTitle();
var box=document.createElement('section');box.id='chapterVideoContext';box.className='video-mode-controls';box.innerHTML='<h3>HOOK → P14 shared setting</h3><p>Event year and Main location are auto-filled from a project title written as <strong>Event — Location — Year</strong>. Shared Visual DNA then applies automatically from HOOK through P14. You can still edit the fields manually, and saved/manual values are never overwritten.</p><label>Event year<input class="video-year" inputmode="numeric" maxlength="4"></label><label>Main location<input class="video-location" placeholder="e.g. San Francisco, California, USA"></label><label>Auto visual DNA<textarea class="video-auto-dna" rows="6" readonly aria-readonly="true"></textarea></label><details class="video-advanced"><summary>Advanced override (optional)</summary><label>Custom continuity details<textarea class="video-details" rows="3" placeholder="Only add special recurring character, wardrobe, building, terrain or palette details when needed."></textarea></label></details><button type="button" class="ghost build-missing-video">Build / refresh Text-to-Video prompts (P1–P14)</button><p>New prompts are for testing. Review the scene details; prompts cannot guarantee identical faces across separate generated clips.</p>';
var c=continuity();['year','location','details'].forEach(function(k){var field=box.querySelector('.video-'+k);field.value=c[k]||'';field.oninput=function(){window.ldVideoContinuity=continuity();window.ldVideoContinuity[k]=field.value;refreshAutoDnaUi(box);all();saveCurrent();if(window.LDHookChoiceSystem)window.LDHookChoiceSystem.render();};});refreshAutoDnaUi(box);
box.querySelector('.build-missing-video').onclick=function(){if(!ready())return showToast('Fill in the shared year and location first.');var refreshed=0;document.querySelectorAll('.stage-card').forEach(function(card){if(supports(card)&&!valid(card)){generate(card);refreshed++;}});syncGlobalControl();showToast(refreshed?refreshed+' Text-to-Video prompts built/refreshed.':'All Text-to-Video prompts are already current.');};
document.getElementById('stages').before(box);}
function all(){document.querySelectorAll('.stage-card').forEach(function(card){decorate(card);update(card);});syncGlobalControl();}
window.LDVideoModes={version:'3.46.1',sceneVarietyIssue:sceneVarietyIssue,supports:supports,state:state,defaults:defaults,titleDefaults:titleDefaults,hydrateContinuityFromTitle:hydrateContinuityFromTitle,lock:lock,generatedVisualDna:generatedVisualDna,effectiveVisualDna:effectiveVisualDna,absoluteStyleLock:absoluteStyleLock,sanitizeSceneForStyle:sanitizeSceneForStyle,promptStyleCompatible:promptStyleCompatible,qualityPromptCompatible:qualityPromptCompatible,antiClonePromptCompatible:antiClonePromptCompatible,cinematicMasterLock:cinematicMasterLock,characterDiversityLock:characterDiversityLock,cameraDirector:cameraDirector,weatherContinuityLock:weatherContinuityLock,audioDirector:audioDirector,withLock:withLock,build:build,signature:signature,valid:valid,legacyCompletionReady:legacyCompletionReady,completionReady:completionReady,completionIssue:completionIssue,prompt:prompt,all:all,setAllMode:setAllMode,selectedMode:selectedMode,rebuildAll:rebuildAll,hardResetVisualMode:hardResetVisualMode,colorMode:colorMode,monochromeRequired:monochromeRequired,textOnlyAccuracyLock:textOnlyAccuracyLock,rockyMountainLocustPanel:rockyMountainLocustPanel,lituyaCause:lituyaCause,nargisPanel:nargisPanel,triStateTornadoPanel:triStateTornadoPanel,eventPanel:eventPanel,progression:progression,progressionLock:progressionLock,resignAll:resignAll};
var css=document.createElement('style');css.textContent='.video-mode-controls{padding:14px;margin:14px 0;border:1px solid #455365;border-radius:12px}#chapterVideoContext{border:3px solid #ff3b30!important;box-shadow:0 0 0 2px rgba(255,59,48,.18)!important}.video-mode-controls label{display:block;margin:10px 0}.video-mode-controls input,.video-mode-controls textarea,.video-mode-controls select{display:block;width:100%;box-sizing:border-box}.video-mode-controls p{font-size:.85rem;opacity:.8}.production-video-buttons{display:flex;gap:10px;flex-wrap:wrap}.production-video-buttons button{flex:1;min-width:140px}.production-video-buttons [aria-pressed=true]{background:#244837;border-color:#65c28d;color:#fff}.stage-card[data-video-mode="text"] .copy-active-video,.stage-card[data-video-mode="text"] .copy-text-video{background:#249746!important;border:1px solid #54cb6c!important;color:#fff!important;font-weight:700;box-shadow:0 2px 8px rgba(22,143,61,.22)}.stage-card[data-video-mode="text"] .copy-active-video:hover,.stage-card[data-video-mode="text"] .copy-text-video:hover{background:#1c7d39!important}.stage-card[data-video-mode="text"] .copy-active-video:focus-visible,.stage-card[data-video-mode="text"] .copy-text-video:focus-visible{outline:3px solid #b6efc0;outline-offset:2px}.text-prompt-details{margin:10px 0 4px;border:0;padding:0}.text-prompt-details summary{display:inline-flex;align-items:center;justify-content:center;width:auto;box-sizing:border-box;min-height:38px;padding:7px 13px;border:1px solid #4c8cd0;border-radius:8px;background:#174d87;color:#fff;cursor:pointer;font-size:.86rem;font-weight:600;text-align:center;list-style:none}.text-prompt-details summary::marker{content:none}.text-prompt-details summary::-webkit-details-marker{display:none}.text-prompt-details summary:hover{background:#1d609f}.text-prompt-details summary:focus-visible{outline:3px solid #a9d5ff;outline-offset:2px}.text-prompt-details[open] label{margin-top:14px}.text-prompt-details[open] .text-video-prompt{height:72vh;min-height:380px;resize:vertical}.text-prompt-details:not([open]) .text-video-prompt{display:none}.stage-card [hidden]{display:none!important}';document.head.appendChild(css);
window.addEventListener('ld:production-built',function(event){panel();all();if(event.detail?.fresh)activateSmartDefault();});document.addEventListener('change',function(e){if(e.target.matches('#visualMode,#format')){refreshAutoDnaUi();all();saveCurrent();if(window.LDHookChoiceSystem)window.LDHookChoiceSystem.render();}});document.addEventListener('input',function(e){if(e.target.matches('.image-prompt,.narration')){var card=e.target.closest('.stage-card');if(card&&supports(card)){var field=card.querySelector('.video-scene');if(field&&!state(card).scene)field.value=sceneFrom(card);update(card);}}});
new MutationObserver(function(){globalControl();all();}).observe(document.getElementById('stages'),{childList:true});panel();all();setTimeout(all,700);
})();


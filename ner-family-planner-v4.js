/* NER Studio Core 4 Family Planner v4.0.2
   Global narration-aware local scene planner. Builds concrete, filmable P1-P14
   scene descriptions before paid AI audit. No historical facts are invented:
   narration/source facts define the beat; representative adult/object staging is
   explicitly visual staging only.
   v4.0.2 adds narration-led school/building structural-impact planning and removes
   repeated startup planAll timer fan-out for better mobile performance. */
(function(){'use strict';
if(window.NERFamilyPlanner4)return;
const core=window.NERCore4;if(!core)return;
const VERSION='4.0.2';
const PANEL_RE=/^P(?:[1-9]|1[0-4])$/;

const FAMILY_HAZARD={
 earthquake:'Ground shaking is the only primary hazard mechanism unless narration explicitly establishes a secondary hazard.',
 tsunami:'Water follows terrain as a broad gravity-driven surge; never a curling surf wave or unsupported vertical wall.',
 cyclone:'Wind, rain and any supported surge follow coherent direction and weather physics; no tornado unless narration establishes one.',
 tornado:'The vortex and debris circulation remain spatially coherent; damage follows the path rather than appearing everywhere at once.',
 flood:'Water follows low ground and obstacles with one coherent current direction and plausible depth.',
 volcano:'Use only the volcanic mechanism supported by narration; do not combine lava, ash, bombs, pyroclastic flow and lahar by default.',
 avalanche:'Snow moves downslope under gravity and terrain control; no smoke-like avalanche behavior.',
 landslide:'Slope material moves downslope under gravity. Use the actual material named by narration when available; do not substitute generic rock, soil or mud.',
 wildfire:'Fire follows available fuel and wind; smoke and embers move consistently and objects do not ignite spontaneously.',
 'biological-agricultural':'Use the actual biological/agricultural mechanism supported by narration; no instant crop disappearance or smoke-like insect mass.',
 'public-health':'Human health effects remain non-graphic and time-plausible; no instant symptoms, visible pathogens or invented procedures.',
 'industrial-technological':'Use only the supported technological/industrial mechanism; invisible radiation or toxic agents remain invisible unless a visible carrier is established.',
 'chemical-wmd':'Chemical agent effects stay historically grounded and non-graphic; do not invent colored gas, visible radiation or unsupported weapon-delivery detail.',
 'generic-evidence':'Use only the mechanism and visible facts established by narration/source context; do not invent a secondary disaster.'
};

const LOCATION_HINT={
 'normal-world':'an intact, ordinary local street, path, workplace edge or public setting within the confirmed event location',
 'cause-context':'a safe contextual viewpoint where one visible condition tied to the narration can be read clearly',
 onset:'a readable human-height viewpoint with the first supported hazard change visible in depth',
 'human-impact':'a human-centered foreground with the supported hazard or damage readable behind or beside the adults',
 'human-toll':'a respectful settled aftermath viewpoint with no graphic victims',
 displacement:'a clear route from the affected area toward a safer or refuge setting',
 response:'a focused response area with only period-appropriate tools and actions supported by the beat',
 evidence:'a quiet review table or evidence room using non-readable documents, photographs, maps or sealed objects only as supported',
 recovery:'a stable recovery/cleanup area where deliberate adult work visibly changes one object at a time',
 legacy:'a calm reflective public or landscape viewpoint consistent with the narration and chronology'
};

const CAMERA_HINT={
 'normal-world':'one restrained human-height side-track or forward reveal that preserves foreground, midground and background geography',
 'cause-context':'one restrained observational move that begins on the concrete contextual detail and opens to the wider setting',
 onset:'one motivated human-height track or push that keeps the first hazard change and the adult reaction in the same geography',
 'human-impact':'one restrained human-height track that prioritizes the adult action and preserves hazard depth',
 'human-toll':'one slow observational move with settled geometry and no sensational orbit',
 displacement:'one restrained follow or lateral track along the visible route to safety',
 response:'one restrained observational move centered on the aid/assessment action',
 evidence:'one nearly locked or very slow push over the review action; no dramatic orbit',
 recovery:'one restrained lateral or forward move following the deliberate work action',
 legacy:'one slow reflective push, pull-back or nearly locked hold'
};

function panel(card){return !!card&&PANEL_RE.test(String(card.dataset.stage||''));}
function narration(card){return String(card?.querySelector?.('.narration')?.value||'').replace(/\s+/g,' ').trim();}
function rawScene(card){return String(card?.querySelector?.('.video-scene')?.value||card?.dataset?.videoScene||'').trim();}
function sceneBody(raw){return String(raw||'').replace(/^(?:KEEP CURRENT SCENE|SMART RANDOM CHOICE)\s*—\s*/i,'').trim();}
function genericPlaceholder(text){
 const s=sceneBody(text);
 return /one adult performs one ordinary era-appropriate activity/i.test(s)||
   /an ordinary historically plausible local setting before visible disaster effects/i.test(s)||
   /begin one purposeful action within the first half-second;\s*2\.0[–-]7\.0s continue the same action/i.test(s)||
   (/CORE 4 FAMILY-PLANNED SCENE/i.test(s)&&/Primary action:\s*one adult (?:performs|observes or interacts|reacts|experiences|moves|performs one focused|reviews|performs one deliberate|performs one restrained)/i.test(s));
}
function keep(card){
 const raw=rawScene(card);
 return /^KEEP CURRENT SCENE\s*—/i.test(raw)&&!genericPlaceholder(raw);
}
function setting(){
 const c=window.ldVideoContinuity||{};
 const y=String(c.year||'').trim(),l=String(c.location||'').trim();
 return [l,y].filter(Boolean).join(', ')||'the confirmed event setting';
}
function inferFamilyFromText(value){
 const s=String(value||'').toLowerCase();
 if(/chemical attack|chemical weapon|nerve agent|mustard gas|sarin/.test(s))return 'chemical-wmd';
 if(/xylazine|opioid|fentanyl|overdose|epidemic|pandemic|outbreak|disease/.test(s))return 'public-health';
 if(/industrial|factory|reactor|refinery|oil spill|toxic leak/.test(s))return 'industrial-technological';
 if(/locust|grasshopper|crop failure|famine|pest/.test(s))return 'biological-agricultural';
 if(/earthquake|quake|seismic/.test(s))return 'earthquake';
 if(/tsunami|megatsunami/.test(s))return 'tsunami';
 if(/avalanche|snowslide/.test(s))return 'avalanche';
 if(/aberfan|coal[- ]?waste|coal[- ]?tip|spoil tip|tip number seven|tip no\.?\s*7|landslide|mudslide|rockslide|debris flow|slope failure/.test(s))return 'landslide';
 if(/cyclone|hurricane|typhoon/.test(s))return 'cyclone';
 if(/tornado|twister/.test(s))return 'tornado';
 if(/flood|dam failure|levee breach/.test(s))return 'flood';
 if(/volcan|eruption|lahar/.test(s))return 'volcano';
 if(/wildfire|forest fire|firestorm/.test(s))return 'wildfire';
 return '';
}
function effectiveFamily(card,sp){
 const base=String(sp?.family||core.family?.(core.topic?.())||'generic-evidence');
 if(base&&base!=='generic'&&base!=='generic-evidence')return base;
 return inferFamilyFromText([core.topic?.()||'',narration(card)].join(' '))||'generic-evidence';
}
function role(card){return String(core.spec(card)?.role||'cause-context');}
function familyGuard(fam,nar){
 const n=String(nar||'').toLowerCase();
 if(fam==='landslide'&&/coal[- ]?waste|coal[- ]?tip|spoil tip|tip number seven|tip no\.?\s*7/.test(n)){
   return 'Coal-waste material is the event-specific slope material. Before onset it remains stable; once narration establishes collapse/slide, it moves downslope under gravity as dense wet spoil/slurry and debris, never as water-only flooding, smoke, lava or an ordinary natural mountain rockfall.';
 }
 return FAMILY_HAZARD[fam]||FAMILY_HAZARD['generic-evidence'];
}
function anchor(nar){
 const s=String(nar||'').toLowerCase();
 if(/coal[- ]?waste|coal[- ]?tip|spoil tip|tip number seven|tip no\.?\s*7/.test(s))return 'coal-tip';
 if(/school|classroom/.test(s))return 'school';
 if(/heavy rain|rainfall|runoff|water beneath|saturated|soaked/.test(s))return 'rain-slope';
 if(/rescu|digging|trapped|wreckage|ruins/.test(s))return 'rescue';
 if(/tribunal|investigat|report|responsibility|concluded/.test(s))return 'evidence';
 if(/died|deaths|fatal|killed|toll/.test(s))return 'toll';
 if(/remember|legacy|safety|decades later/.test(s))return 'legacy';
 if(/village|homes|town|community/.test(s))return 'community';
 return '';
}
function specificRecipe(card,fam,rl,nar){
 const a=anchor(nar),place=setting();
 if(rl==='normal-world'&&(a==='coal-tip'||/mining village/i.test(nar))){
   return {
    location:'an intact mining-village street in '+place+', with period-appropriate terraced homes defining the foreground and midground; when the narration mentions the school, keep only its exterior readable in the midground with no minors visible; a stable coal-waste tip occupies the hillside background above the settlement',
    action:'one representative adult local worker walks steadily along the village street carrying one plain period-appropriate work bag. This adult is visual staging only, not a claim about a named historical person',
    timing:'0.0–2.0s: The adult begins walking past the intact homes within the first half-second; the work bag moves naturally with the stride and there is no danger reaction. 2.0–7.0s: Continue the same walk while one restrained human-height track reveals more of the village depth; if supported by narration, the school exterior becomes readable in the midground while the stable coal-waste hillside remains farther back. 7.0–10.0s: The camera eases into a wider layered composition that clearly places the stable coal-waste tip above the homes/school while the adult continues the same unhurried walk. No collapse, slurry movement, panic or damage yet.'
   };
 }
 if(rl==='cause-context'&&(a==='coal-tip'||a==='rain-slope')){
   return {
    location:'a safe village-edge lane in '+place+' with the coal-waste tip/slope visible in the background and rain-soaked ground/runoff readable only because the narration establishes wet conditions',
    action:'one adult resident pauses beside the lane and looks from visible surface runoff toward the stable coal-waste slope; the adult makes one small grounded pointing or shielding gesture only, with no panic',
    timing:'0.0–2.0s: Establish the wet lane, one adult and visible runoff; the adult slows and looks down at the water within the first half-second. 2.0–7.0s: The same adult lifts the gaze toward the coal-waste slope as the camera makes one restrained observational reveal linking foreground runoff to the background tip. 7.0–10.0s: Hold the readable runoff-to-slope geography. The tip remains physically stable unless this panel narration explicitly says movement has begun; no collapse or later impact is introduced.'
   };
 }
 if(rl==='onset'&&a==='coal-tip'){
   return {
    location:'a stable human-height village viewpoint in '+place+' with the coal-waste tip and its downslope route readable in depth',
    action:'one adult in the safe foreground stops mid-step and turns toward the first visible movement of the coal-waste mass while beginning to move away from the downslope route',
    timing:'0.0–2.0s: Establish the adult and stable village geography; the first small supported movement appears on the coal-waste slope. 2.0–7.0s: Continue one coherent adult retreat/reaction while the same coal-waste movement grows only to the level stated by narration and follows the slope under gravity. 7.0–10.0s: Hold the adult clear of the moving route as the shot resolves the direction of travel and affected geography; do not jump ahead to a later impact not stated by this panel.'
   };
 }
 if(fam==='landslide'&&rl==='human-impact'&&a==='school'&&/(?:struck|hit|smashed|crush|bury|buried|impact)/i.test(nar)){
   return {
    location:'a period-appropriate school exterior in '+place+' with one clearly readable school wall/frontage and the already-moving downslope hazard entering from the established approach side; no visible minors are required and no invented readable school sign appears',
    action:'the already-moving slope material physically reaches the school structure, makes direct contact, progressively forces a limited wall/window/doorway section to fail, and carries or piles the same material into and against the lower school frontage; the structural contact is primary and any adult scale reference is optional and secondary',
    camera:'one stable human-height three-quarter exterior side-depth view that keeps the impact point, school geometry and moving hazard direction readable in one continuous axis; no orbit, no zoom pumping, no cut and no sensational victim close-up',
    timing:'0.0–2.0s: Continue the established moving mass into direct contact with the school edge; contact begins before any school failure. 2.0–7.0s: Show one continuous contact-to-failure chain as the wall/frontage visibly strains, a limited section gives way, and dense material with existing debris pushes into/against the structure. 7.0–10.0s: Let the same mass accumulate around and partially bury the affected school frontage/classroom zone while remaining physically coherent. Stop before rescue, aftermath or casualty imagery; no visible children, bodies or gore.'
   };
 }
 if((rl==='response'||a==='rescue')&&/rescu|digging|trapped|wreckage|ruins/i.test(nar)){
   return {
    location:'a non-graphic rescue edge in '+place+' with settled rubble/coal waste and one clear safe working zone',
    action:'two visually distinct adult responders work on one specific loose debris section: the foreground adult lifts and passes one manageable piece while the second adult receives or clears it; no victim is graphically shown',
    timing:'0.0–2.0s: Establish the two adults, one specific debris piece and the safe working edge; the foreground responder grips the piece immediately. 2.0–7.0s: Complete the single lift-and-pass/clear action with believable weight while the second adult supports the same task. 7.0–10.0s: The piece reaches its cleared position and both adults briefly reassess the same opening; no new collapse, miracle rescue or unrelated action is added.'
   };
 }
 if((rl==='evidence'||a==='evidence')){
   return {
    location:'a quiet period-appropriate review table/room in '+place+' with non-readable documents, a simple map/diagram only if supported, and stable furniture',
    action:'one adult reviewer places one non-readable document beside a second document and points once to a relevant area while another adult observer follows the gesture; no readable verdict text is generated',
    timing:'0.0–2.0s: Establish the table, two distinct adults and the two documents; the reviewer begins placing the first document. 2.0–7.0s: Complete the placement and one pointing gesture while the camera makes a very slow push that keeps hands, documents and faces spatially stable. 7.0–10.0s: Both adults hold on the compared evidence with only restrained breathing/eye movement; no active disaster imagery or invented readable wording appears.'
   };
 }
 return null;
}
function genericRecipe(rl,fam,nar){
 const place=setting(),hazard=familyGuard(fam,nar);
 const common={
  'normal-world':{
   location:'an intact ordinary local street or path in '+place+' with a clear foreground route, period-appropriate buildings/terrain in the midground and stable regional geography in the background',
   action:'one representative adult resident walks steadily along the visible route carrying one plain period-appropriate small work bag or parcel; this is visual staging, not a named historical individual',
   timing:'0.0–2.0s: The adult starts walking within the first half-second and passes one fixed foreground reference such as a doorway, fence or wall edge. 2.0–7.0s: Continue the same walk while one restrained track reveals the intact midground and background geography. 7.0–10.0s: Ease into the wider setting while preserving the same adult, object and route; no hazard, panic or damage appears before narration supports it.'
  },
  'cause-context':{
   location:'a safe contextual viewpoint in '+place+' with one concrete foreground surface/object and the wider event setting visible behind it',
   action:'one adult observer bends or pauses to inspect the single visible contextual detail, then raises the gaze toward the wider setting; no second task is introduced',
   timing:'0.0–2.0s: Establish the adult and one concrete contextual detail; inspection begins immediately. 2.0–7.0s: Complete the inspection and one gaze shift toward the wider setting while the camera links foreground detail to background context. 7.0–10.0s: Hold that cause/context relationship without introducing a later hazard stage.'
  },
  onset:{
   location:'a human-height viewpoint in '+place+' with the adult in a stable foreground and the first supported hazard change visible along a clear depth axis',
   action:'one adult stops mid-step, turns once toward the first supported hazard change, and begins one coherent retreat toward the visible safe side of the frame',
   timing:'0.0–2.0s: Establish the adult and first small hazard change; the turn begins immediately. 2.0–7.0s: Continue the same retreat/reaction as the hazard develops only to this panel’s narrated level. 7.0–10.0s: Resolve the geography between adult, safe route and hazard; do not jump to a later impact.'
  },
  'human-impact':{
   location:'a human-centered foreground in '+place+' with supported damage/hazard readable in the midground and a clear stable route or support point',
   action:'one adult steadies or guides a second distinct adult through one supported movement toward safer footing; both remain non-graphic and identity-stable',
   timing:'0.0–2.0s: Establish both adults and the support point; the assisting grip/movement begins immediately. 2.0–7.0s: Continue the same supported movement with believable weight and footing while the hazard remains at the narrated level. 7.0–10.0s: Complete the move to the stable point and hold the resulting positions; no new casualty or unrelated action appears.'
  },
  'human-toll':{
   location:'a respectful settled aftermath viewpoint in '+place+' with non-graphic damage and clear foreground-midground-background separation',
   action:'one adult survivor/observer walks slowly to one stable edge or debris boundary and stops, looking across the settled aftermath; no body interaction or graphic victim detail',
   timing:'0.0–2.0s: The adult begins the short walk beside the settled damage. 2.0–7.0s: Continue to the stable edge as the camera reveals the aftermath scale without renewed impact. 7.0–10.0s: The adult stops and holds the reflective look; only settled environmental motion remains.'
  },
  displacement:{
   location:'a visible route away from the affected area in '+place+' toward a safer/refuge side of frame',
   action:'two distinct adults walk steadily along the same route carrying one small period-appropriate bundle between or beside them; no running loop or teleportation',
   timing:'0.0–2.0s: Both adults begin moving along the visible route immediately. 2.0–7.0s: Continue the same evacuation walk past one fixed landmark while maintaining spacing and object count. 7.0–10.0s: Reach the safer side/threshold and slow naturally; do not add a new hazard beat.'
  },
  response:{
   location:'a focused response zone in '+place+' with one clear work surface/area and only period-appropriate objects supported by the scene',
   action:'one adult responder performs one visible assessment/support action on the same location/object while a second distinct adult assists with one restrained supporting gesture',
   timing:'0.0–2.0s: Establish the responder, helper and single response focus; the assessment/support action starts immediately. 2.0–7.0s: Continue that same action to a readable completion with physically motivated object contact only. 7.0–10.0s: Both adults hold/reassess the same focus; no unsupported procedure, alarm or new disaster impact is added.'
  },
  evidence:{
   location:'a quiet period-appropriate evidence/review table in '+place+' with two non-readable documents or photographs and stable furniture',
   action:'one adult reviewer places one document beside another and points once while a second distinct adult observes; no readable text is generated',
   timing:'0.0–2.0s: Establish the two adults and documents; placement begins immediately. 2.0–7.0s: Complete the placement and one pointing gesture during a very slow push. 7.0–10.0s: Hold on the compared evidence with restrained human micro-motion only.'
  },
  recovery:{
   location:'a stable recovery/cleanup edge in '+place+' with one specific loose object/debris piece and one clear destination pile or repair point',
   action:'one adult worker lifts one manageable loose piece and carries it to the visible destination while a second adult remains secondary',
   timing:'0.0–2.0s: The worker grips and begins lifting the single piece. 2.0–7.0s: Carry the same piece along the short clear route with believable weight. 7.0–10.0s: Place it at the destination and settle; no spontaneous repair or second task begins.'
  },
  legacy:{
   location:'a calm reflective viewpoint in '+place+' consistent with the narration’s chronology and without forced disaster remnants',
   action:'one adult observer walks two or three slow steps to a stable overlook or public edge and stops, looking across the setting; no ceremonial action is invented',
   timing:'0.0–2.0s: The adult begins the short reflective walk. 2.0–7.0s: Continue to the stable viewpoint during one slow camera move that opens the setting. 7.0–10.0s: The adult stops and holds the view with only natural breathing and ambient motion.'
  }
 };
 return common[rl]||common['cause-context'];
}
function cameraFor(rl){return CAMERA_HINT[rl]||CAMERA_HINT['cause-context'];}
function plan(card){
 if(!panel(card))return null;
 const sp=core.spec(card)||{},rl=String(sp.role||'cause-context'),nar=narration(card),fam=effectiveFamily(card,sp);
 const recipe=specificRecipe(card,fam,rl,nar)||genericRecipe(rl,fam,nar);
 return {
  version:VERSION,stage:card.dataset.stage,family:fam,role:rl,
  location:recipe.location,
  action:recipe.action,
  camera:recipe.camera||cameraFor(rl),
  timing:recipe.timing,
  guard:familyGuard(fam,nar),
  narration:nar
 };
}
function sceneText(p){
 return 'CORE 4 FAMILY-PLANNED SCENE — '+p.stage+' · '+p.family+' · '+p.role+'. '+
  'LOCATION: '+p.location+'. PRIMARY ACTION: '+p.action+'. CAMERA: '+p.camera+'. '+
  'TIMING: '+p.timing+' FAMILY PHYSICS: '+p.guard+' '+
  'FACTUAL BOUNDARY: Treat approved narration/research as the factual source. Representative unnamed adult/object staging exists only to make the shot filmable and must remain period-plausible; do not invent named people, readable records, exact measurements, warnings, agencies, mechanisms or consequences not established by the narration/context.';
}
function writeScene(card,text){
 const field=card.querySelector('.video-scene');
 card.dataset.videoScene=text;
 card.dataset.nerCoreSceneOwned='1';
 card.dataset.nerCoreFamilyPlannerVersion=VERSION;
 if(field&&field.value!==text)field.value=text;
 try{window.LDCore?.saveCurrent?.();}catch{}
 return text;
}
function apply(card,options={}){
 if(!panel(card)||core.frozen(card))return false;
 const raw=rawScene(card),stale=genericPlaceholder(raw);
 if(keep(card)&&!stale)return false;
 const plannerOwned=card.dataset.nerCoreSceneOwned==='1'||/^CORE 4 FAMILY-PLANNED SCENE\s*—/i.test(sceneBody(raw))||stale;
 if(!plannerOwned&&raw&&!/^SMART RANDOM CHOICE\s*—/i.test(raw)&&options.force!==true)return false;
 const p=plan(card);if(!p)return false;
 const next=sceneText(p);
 if(sceneBody(raw)===next&&card.dataset.nerCoreFamilyPlannerVersion===VERSION)return false;
 writeScene(card,next);
 return true;
}
function audit(card){
 if(!panel(card))return [];
 const s=rawScene(card),body=sceneBody(s),issues=[];
 if(!body)issues.push('Core 4 scene description is empty.');
 if(genericPlaceholder(body))issues.push('Core 4 scene is still a generic placeholder instead of a concrete filmable action.');
 if(!/LOCATION:/i.test(body)||!/PRIMARY ACTION:/i.test(body)||!/TIMING:/i.test(body))issues.push('Core 4 scene is missing concrete location/action/timing sections.');
 if(!/0\.0[–-]2\.0s:/i.test(body)||!/2\.0[–-]7\.0s:/i.test(body)||!/7\.0[–-]10\.0s:/i.test(body))issues.push('Core 4 scene does not contain three distinct 10-second visual developments.');
 return issues;
}
function planAll(){
 document.querySelectorAll('.stage-card').forEach(card=>{
  if(panel(card)&&!core.frozen(card))apply(card);
 });
}
window.addEventListener('ld:production-built',()=>queueMicrotask(planAll));
window.addEventListener('ld:narration-approval-changed',()=>queueMicrotask(planAll));
window.NERFamilyPlanner4=Object.freeze({version:VERSION,plan,apply,planAll,audit,genericPlaceholder,effectiveFamily});
window.dispatchEvent(new CustomEvent('ner:family-planner-ready',{detail:{version:VERSION}}));
})();
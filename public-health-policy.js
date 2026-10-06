/* Shared local policy. No network calls. */
(function(root){
 'use strict';
 const version='1.3.8';
 const NO_TEXT_LOCK='ABSOLUTE NO-TEXT ENVIRONMENT LOCK — HIGHEST PRIORITY: No readable words, letters, numbers, labels, posters, wall signs, clinic names, room names, notices, charts, logos, badges, packaging text, folder text, tray labels, screen text, paperwork text, or typography anywhere in the frame from frame 1 through frame 10. Replace every sign, poster, chart, notice, label, package face, folder face, badge, wall board and printed surface with blank or abstract non-readable shapes. If an object would normally contain text, render that surface blank. Do not create pseudo-text, gibberish lettering, partial words, stylized letters, symbols that resemble writing, or readable environmental signage. This lock overrides environmental-detail, realism, clinic-setting, signage, prop-detail, and production-DNA instructions that might otherwise introduce visible writing.';
 const P14_CLOSE_LOCK='REFLECTIVE P14 HUMAN-CENTERED CLOSE — HIGH PRIORITY: When P14 narration humanizes people behind a stigmatizing label, do NOT repeat a folder-to-tray, document-transfer, naloxone-preparation, wound-care, or other administrative/clinical action from the preceding panel. Use one restrained person-centered state change instead: a fully clothed seated adult visitor slowly raises the head and eye-line toward a nearby outreach worker while remaining physically separate; the worker stays anchored and does not touch the visitor. After the gaze is established, hold the quiet human connection with breathing only. No diagnosis, treatment, recovery outcome, collapse, dramatized intoxication, or second purposeful action. This exception overrides generic object-transfer preferences for that reflective P14 beat.';
 function matches(topic){return /xylazine|zombie drug|tranq|opioid|fentanyl|drug crisis|overdose crisis/i.test(topic||'');}
 function beat(text){
  const s=String(text||'');
  if(/veterinary|sedate animals/i.test(s))return 2;
  if(/thousand.*train|training|received training/i.test(s))return 12;
  if(/distributed|distribution/i.test(s)&&/naloxone/i.test(s))return 12;
  if(/naloxone|rescuers|emergency services/i.test(s))return 10;
  if(/only the beginning|access to treatment|support(?:\s+that)?\s+continues|support[^\n.]{0,80}\bafterward\b|ongoing support|continued support/i.test(s))return 14;
  if(/wound\s+care/i.test(s)&&/treatment|support/i.test(s))return 14;
  if(/wound|infected|skin/i.test(s))return 7;
  if(/deaths|died|quarter|mortality/i.test(s))return 9;
  if(/slow.*heart|blood pressure|breathing|unresponsive|unconscious/i.test(s))return 6;
  if(/might not know|expected to use|supply|present|contain/i.test(s))return 3;
  if(/treatment|support|people behind|life can/i.test(s))return 14;
  return 1;
 }
 const rules={
  intensity:'INTENSITY: Follow the specific narration and visible human action. Public-health context has no automatic impact, destruction or recovery sequence based on panel number.',
  camera:'CINEMATIC CAMERA DIRECTOR: One restrained human-height lateral move or gentle push serving the selected scene. Stable horizon and coherent perspective; no hazard reveal or forced urgency.',
  audio:'PROFESSIONAL CINEMATIC AUDIO MIX: Quiet scene-specific ambience only. Audible movements must have visible causes. Stable sound level; no dramatic buildup, impact sounds, sirens, alarms, voice-over, dialogue or music.',
  weather:'WEATHER + ATMOSPHERE CONTINUITY LOCK: Preserve established local light and atmosphere only. No weather escalation, smoke or dust added for drama.',
  motion:'MICRO-TRANSITION + MORPH CONTROL: Use EXACTLY ONE primary purposeful micro-action that creates one clear completed state change. Keep the main adult anchored in place unless the approved narration truly requires relocation. Prefer one purposeful nearby hand/object action within reach, such as moving one stable folder, bundle, tray item or other simple object from one stable location to another. Meaningful document/folder handling counts when the same object visibly moves from one stable location to another; tiny paper fidgeting does not. REFLECTIVE P14 EXCEPTION: for a human-centered closing narration about the person behind a stigmatizing label, the one primary state change may instead be a seated visitor slowly raising the head and eye-line toward a nearby worker; do not repeat the prior panel’s folder/tray transfer. Supporting or background adults may only show subtle gaze, breathing or posture settling; they must NOT touch, turn, adjust, carry, open, close or otherwise manipulate a second object such as a monitor, paper stack, tray, folder, door or tool. Never add a second purposeful task merely to create motion. The primary action may finish naturally before the final seconds; after completion, allow only calm residual movement such as breathing, gaze or a small hand settle. Identity stability outranks amount of motion. Preserve identity, anatomy, clothing, object count and geometry. No teleportation, duplication, morphing, object respawn or sudden object changes.',
  damage:'DEBRIS + DAMAGE PHYSICS LOCK: Keep structures intact unless the current approved scene explicitly establishes otherwise. Ordinary objects obey gravity and contact. No generic disaster debris or destruction sequence.',
  cast:'adults appropriate to the current narration and illustrative setting, without invented diagnoses or exaggerated behavior. For event years 2000 or later, year-appropriate means contemporary to that locked year: modern everyday/work/clinic clothing and hairstyles are expected, while antique, Victorian, Edwardian, early-1900s, retro nurse-dress, long-apron, bonnet, vintage-uniform or historical-classroom styling is forbidden unless the narration explicitly documents such a reenactment.',
  noText:NO_TEXT_LOCK,
  progression:'PUBLIC-HEALTH STORY RULE: The current approved narration determines the beat. Do not impose a natural-disaster timeline. Illustrative context is not evidence of a specific historical incident, investigation, treatment encounter or chemical identification. GENERAL-GUIDANCE LOCK: a narration instruction such as give naloxone or call emergency services is public guidance, not proof of a specific documented treatment encounter. Unless the narration explicitly identifies a specific documented administration event, visualize preparedness or readiness only—such as moving one naloxone device from an already-open kit to a nearby tray—without showing injection, nasal administration, dosing, route of administration, recovery, or treatment outcome. CONTINUING-CARE LOCK: when narration generally says people need wound care, access to treatment, or ongoing support, that is not proof of a specific examination or procedure. Visualize access to care/support without patient contact: use a calm clinic or support setting and one closed unmarked resource folder or similarly neutral support object moved from one stable surface to a nearby tray. Keep the visitor fully clothed with hands and forearms still. Do not expose a wound, roll or raise a sleeve for assessment, examine or touch the patient, or show bandage, gauze, dressing, wound treatment, medication, injection, dosing, procedure, recovery, or treatment outcome unless the narration explicitly documents that specific event. '+P14_CLOSE_LOCK+' MODERN-EVENT ERA OVERRIDE — HIGHEST PRIORITY FOR 2000+ EVENTS: “historical anime” describes only the serious hand-drawn documentary/graphic-novel rendering style; it does NOT mean antique, Victorian, Edwardian, early-1900s, wartime, retro, vintage or pre-digital wardrobe, interiors, furniture, hairstyles, props or technology. For any locked event year from 2000 onward, every visible person, room and object must read as contemporary to that exact year and location. Use year-appropriate modern casual/work/clinic clothing, contemporary furniture and fixtures, and ordinary technology that existed in the locked year. Any generic phrase such as “historically appropriate wardrobe” means year-appropriate contemporary clothing for the locked year. Any generic “no modern objects outside the era” wording means no objects newer than the locked year; it does NOT ban ordinary technology contemporary to that year. No vintage nurse dress, long apron, bonnet, antique clinic uniform, historical classroom styling or old-period interior unless the narration explicitly requires it. '+NO_TEXT_LOCK,
  canon:'EPISODE CANON — CONTINUITY ENGINE: Preserve project location, year and selected visual style. Different illustrative settings may use different adults. Do not invent prior-panel damage, clinical outcomes, identities or action. Reuse specific continuity only when explicitly supplied and relevant.'
 };
 function secondaryObjectActionIssue(prompt){
  const p=String(prompt||'');
  const re=/\b(?:colleague|second adult|supporting adult|midground adult|background adult)\b[\s\S]{0,220}\b(?:turns?|turning|adjusts?|adjusting|moves?|moving|lifts?|lifting|places?|placing|carries?|carrying|opens?|opening|closes?|closing|handles?|handling|slides?|sliding|passes?|passing)\b[\s\S]{0,120}\b(?:monitor|screen|paper|papers|tray|folder|bundle|door|tool|object|container)\b/gi;
  let match;
  while((match=re.exec(p))){
   const span=match[0];
   if(!/\b(?:does not|do not|must not|never|without)\b/i.test(span))return 'A supporting adult is performing a second purposeful object action. Keep exactly one main action; supporting adults may only breathe, shift gaze, or settle posture without manipulating another object.';
  }
  return '';
 }
 function panelScene(prompt){
  const p=String(prompt||'');
  const m=p.match(/PANEL SCENE:\s*([\s\S]*?)(?:\n\s*PANEL SCENE IDENTITY LOCK:|\n\s*NARRATIVE CONTEXT|\n\s*TIMING:)/i);
  return m?m[1]:'';
 }
 function sentences(text){return String(text||'').split(/\n+|(?<=[.!?])\s+/).map(function(s){return s.trim();}).filter(Boolean);}
 function negativeSafetySentence(text){
  const s=String(text||'');
  return /^(?:no\b|never\b|without\b|avoid\b|do not\b|don't\b|must not\b)/i.test(s)||/\b(?:do not|does not|must not|never|without|forbid(?:den)?|avoid)\b/i.test(s);
 }
 function positiveCue(text,re){return sentences(text).some(function(s){return re.test(s)&&!negativeSafetySentence(s);});}
 function humanizingP14(prompt){
  const p=String(prompt||'');
  return /\bP14\b/i.test(p)&&/zombie drug[^\n.]{0,120}hides|people behind(?: the)? crisis|life can still be saved|person struggling to stay conscious|people struggling to stay conscious/i.test(p);
 }
 function reflectiveP14SafeScene(scene){
  const s=String(scene||'');
  const people=/\b(?:adult visitor|seated adult|fully clothed adult visitor)\b/i.test(s)&&/\b(?:outreach worker|support worker|worker)\b/i.test(s);
  const humanAction=/\b(?:raises?|raising|lifts?|lifting)\s+(?:their\s+|the\s+)?(?:head|gaze|eye-line|eyes)|\bmeets?\s+(?:the\s+)?(?:worker'?s\s+)?gaze|\bestablish(?:es|ing)?\s+(?:a\s+)?(?:shared\s+)?eye-line/i.test(s);
  const noContact=/\b(?:no patient contact|no physical contact|does not touch the visitor|never touches the visitor|worker stays physically separate|remain(?:s)? physically separate)\b/i.test(s);
  const modern=/\b(?:contemporary\s+2020|2020\s+(?:casual|work|clinic|community health|outreach))\b/i.test(s);
  const repeatedFolder=positiveCue(s,/\b(?:moves?|moving|transfers?|transferring|places?|placing|lifts?|lifting)\b[^.\n]{0,100}\bfolder\b[^.\n]{0,100}\btray\b|\bfolder\b[^.\n]{0,100}\b(?:moves?|moving|transfers?|transferring|places?|placing)\b[^.\n]{0,100}\btray\b/i);
  return people&&humanAction&&noContact&&modern&&!repeatedFolder;
 }
 function canonicalReflectiveP14Scene(){
  return 'Exactly 10 seconds, portrait 9:16, one continuous restrained gentle push-in inside a modest contemporary Philadelphia community health outreach setting in 2020. One fully clothed adult visitor sits quietly with both hands and forearms still. One adult outreach worker in contemporary 2020 casual work clothing remains nearby and physically separate, without touching the visitor. From 0.0–2.0 seconds, the visitor’s head and eye-line are slightly lowered while both adults remain still except for natural breathing. From 2.0–6.0 seconds, the visitor slowly raises the head and eye-line toward the outreach worker as the ONLY purposeful state change. From 6.0–10.0 seconds, the established gaze is held quietly with natural breathing only. No folder, tray transfer, paperwork action, medication, naloxone, wound, examination, treatment, recovery outcome, walking, second purposeful action, dialogue, readable text, logos, morphing, duplication or physical contact. Preserve contemporary 2020 clothing, anatomy, identity, room geometry and strict true black-and-white 2D historical-anime rendering throughout.';
 }
 function applyReflectiveP14BrowserRepair(prompt){
  if(typeof document==='undefined'||!humanizingP14(prompt))return false;
  const card=document.querySelector('.stage-card[data-stage="P14"]');
  if(!card)return false;
  const field=card.querySelector('.video-scene');
  if(!field)return false;
  const current=String(field.value||card.dataset.videoScene||'').trim();
  if(reflectiveP14SafeScene(current)&&!/\b(?:period-appropriate|historically appropriate)\b/i.test(current))return false;
  const scene=canonicalReflectiveP14Scene();
  field.value=scene;
  try{field.dispatchEvent(new Event('input',{bubbles:true}));}catch{}
  card.dataset.videoScene=scene;
  card.dataset.sceneChoice='KEEP CURRENT SCENE';
  card.dataset.textVideoPrompt='';
  card.dataset.textVideoSignature='';
  delete card.dataset.smartReady;
  delete card.dataset.smartReadySignature;
  const promptField=card.querySelector('.text-video-prompt');
  if(promptField)promptField.value='';
  try{window.dispatchEvent(new CustomEvent('ld:p14-auto-repaired',{detail:{stage:'P14'}}));}catch{}
  return true;
 }
 function continuingCareSafeScene(scene){
  const s=String(scene||'');
  const safeCore=/\bclosed\s*,?\s*unmarked\s+resource\s+folder\b/i.test(s)&&/\b(?:counter|stable surface)\b/i.test(s)&&/\btray\b/i.test(s)&&/\bfully clothed adult visitor\b/i.test(s)&&/\b(?:no physical contact(?: with the visitor)?|never touches? the visitor|does not touch the visitor|must not touch the visitor)\b/i.test(s)&&/\bcontemporary\s+20\d{2}\b/i.test(s);
  if(!safeCore)return false;
  const positiveProcedure=positiveCue(s,/\b(?:wound-care clinic treating a patient|community health clinic during non-graphic wound assessment|sleeve\s+(?:rolled|raised)|rolled\s+(?:up\s+)?sleeve|raised\s+sleeve|exposed\s+wound|visible\s+wound|wound\s+(?:assessment|examination|exam)|non-graphic\s+wound\s+assessment|examines?\s+(?:the\s+)?(?:patient|visitor|wound|forearm|arm)|treats?\s+(?:the\s+)?wound|bandages?\s+(?:the\s+)?(?:wound|arm|forearm)|wraps?\s+(?:the\s+)?(?:arm|forearm|wound)|appl(?:y|ies|ying)\s+(?:a\s+)?(?:bandage|gauze|dressing)|places?\s+(?:a\s+)?(?:bandage|gauze|dressing)\s+(?:on|onto|over)|clinician[^.]{0,100}\b(?:touches?|examines?|treats?|bandages?|wraps?)\s+(?:the\s+)?(?:patient|visitor))\b/i);
  return !positiveProcedure;
 }
 function modernEventEraIssue(prompt){
  const p=String(prompt||'');
  const years=(p.match(/\b20\d{2}\b/g)||[]).map(Number);
  const year=years.find(function(y){return y>=2000;});
  if(!year)return '';
  if(!/MODERN-EVENT ERA OVERRIDE/i.test(p))return 'Modern public-health event needs the MODERN-EVENT ERA OVERRIDE. For a '+year+' scene, historical anime is only the drawing style; people, clothing, furnishings and technology must read as contemporary to '+year+', not antique or early-1900s.';
  const scene=panelScene(p);
  if(!scene)return '';
  if(/\b(?:period-appropriate|historically appropriate)\b[^.\n]{0,100}\b(?:clothing|wardrobe|attire|uniform|dress)\b/i.test(scene))return 'Modern-era wardrobe wording is still ambiguous. In the PANEL SCENE, replace period/historically-appropriate clothing language with explicit contemporary '+year+' clothing and hairstyles. Historical anime is the art style only; no vintage nurse dress, long apron, bonnet, antique clinic uniform or early-1900s styling.';
  if(positiveCue(scene,/\b(?:Victorian|Edwardian|early[- ]1900s|vintage nurse|long apron|bonnet|antique clinic|historical classroom|retro uniform)\b/i))return 'PANEL SCENE contains old-period styling for a '+year+' event. Use contemporary '+year+' wardrobe, clinic/support furnishings, hairstyles and technology only.';
  return '';
 }
 function generalGuidanceTreatmentIssue(prompt){
  const p=String(prompt||'');
  if(!/\b(?:give|use|administer)\s+naloxone\b|\bcall\s+emergency\s+services\b/i.test(p))return '';
  const scene=panelScene(p);
  if(!scene)return '';
  const actualAdministration=/\b(?:administers?|administering|injects?|injecting|sprays?|spraying|delivers?|delivering|doses?|dosing)\b[\s\S]{0,90}\bnaloxone\b|\bnaloxone\b[\s\S]{0,90}\b(?:administered|injected|sprayed|delivered|dosed)\b|\b(?:inserts?|inserting|places?|placing)\b[\s\S]{0,90}\b(?:naloxone|nasal spray)\b[\s\S]{0,90}\b(?:nostril|nose)\b/i;
  if(positiveCue(scene,actualAdministration))return 'General naloxone guidance was staged as a specific administration encounter. Show preparedness only: one naloxone device may move from an already-open kit to a nearby tray, then settle. Do not show injection, nasal administration, dosing, route, recovery, or treatment outcome unless the narration explicitly identifies a specific documented administration event.';
  return '';
 }
 function generalContinuingCareProcedureIssue(prompt){
  const p=String(prompt||'');
  if(!/\bwound care\b|\baccess to treatment\b|\bsupport(?:\s+that)?\s+continues\b|\bsupport[^\n.]{0,80}\bafterward\b|\bongoing support\b|\bcontinued support\b/i.test(p))return '';
  const scene=panelScene(p);
  if(!scene)return '';
  if(continuingCareSafeScene(scene))return '';
  const procedureCue=/\b(?:wound-care clinic treating a patient|wound-care clinic providing ongoing[^.\n]{0,50}treatment|community health clinic during non-graphic wound assessment|sleeve\s+(?:rolled|raised)|rolled\s+(?:up\s+)?sleeve|raised\s+sleeve|exposed\s+wound|visible\s+wound|wound\s+(?:assessment|examination|exam)|non-graphic\s+wound\s+assessment|examines?\s+(?:the\s+)?(?:patient|visitor|wound|forearm|arm)|treats?\s+(?:the\s+)?wound|bandages?\s+(?:the\s+)?(?:wound|arm|forearm)|wraps?\s+(?:the\s+)?(?:arm|forearm|wound)|appl(?:y|ies|ying)\s+(?:a\s+)?(?:bandage|gauze|dressing)|places?\s+(?:a\s+)?(?:bandage|gauze|dressing)\s+(?:on|onto|over)|clinician[^.]{0,100}\b(?:touches?|examines?|treats?|bandages?|wraps?)\s+(?:the\s+)?(?:patient|visitor))\b/i;
  if(positiveCue(scene,procedureCue))return 'General continuing-care narration was staged too literally as a wound examination or treatment procedure. Keep the clinic visitor fully clothed with both hands/forearms still and no exposed wound or rolled sleeve. The clinician must not touch the visitor. Use exactly one neutral support action instead, preferably moving one closed unmarked resource folder from a stable counter to a nearby tray, then settle. No bandage, gauze, dressing, wound assessment, medication, injection, procedure, recovery, or treatment outcome.';
  return '';
 }
 function p14ClosingIssue(prompt){
  const p=String(prompt||'');
  if(!humanizingP14(p))return '';
  const scene=panelScene(p);
  if(!scene)return '';
  if(reflectiveP14SafeScene(scene))return '';
  const repeatedFolder=positiveCue(scene,/\b(?:moves?|moving|transfers?|transferring|places?|placing|lifts?|lifting)\b[^.\n]{0,100}\bfolder\b[^.\n]{0,100}\btray\b|\bfolder\b[^.\n]{0,100}\b(?:moves?|moving|transfers?|transferring|places?|placing)\b[^.\n]{0,100}\btray\b/i);
  if(repeatedFolder)return 'P14 repeats P13’s folder-to-tray action. For this human-centered closing narration, remove the folder transfer entirely. Use one distinct reflective action: the fully clothed seated visitor slowly raises the head and eye-line toward the nearby outreach worker; the worker stays anchored and physically separate. After the gaze is established, hold with breathing only. No treatment, contact, recovery outcome, or second purposeful action.';
  return 'P14 human-centered closing beat is not yet visually distinct enough. Use one restrained person-centered state change: the fully clothed seated visitor slowly raises the head and eye-line toward the nearby outreach worker, then both hold the quiet connection with breathing only. No object transfer, no patient contact, no treatment, and no second purposeful action.';
 }
 function motionProgressionIssue(prompt){
  const p=String(prompt||'');
  if(humanizingP14(p)&&reflectiveP14SafeScene(panelScene(p)))return '';
  const legacyMotion=/one unmistakable foreground action|Continue and visibly complete the physical action through most of this beat|paper handling, or a held pose alone do NOT count|Do not hold a static pose for the full final three seconds/i;
  if(legacyMotion.test(p))return 'Legacy public-health motion wording is still present. Rebuild with one purposeful nearby hand/object action, allow the action to finish naturally, and let only subtle residual movement remain afterward.';
  const secondaryIssue=secondaryObjectActionIssue(p);
  if(secondaryIssue)return secondaryIssue;
  const timed=(p.match(/\b(?:0(?:\.0)?|2(?:\.0)?|7(?:\.0)?)[–-](?:2(?:\.0)?|7(?:\.0)?|10(?:\.0)?)\s*(?:s|seconds?)\b/gi)||[]).length;
  const actions=(p.match(/\b(?:reach|reaches|reaching|move|moves|moving|turn|turns|turning|check|checks|checking|place|places|placing|hand|hands|handing|slide|slides|sliding|open|opens|opening|lift|lifts|lifting|withdraw|withdraws|withdrawing|gesture|gestures|gesturing|exchange|exchanges|exchanging|finish|finishes|finishing|release|releases|releasing|settle|settles|settling|raise|raises|raising|gaze|eye-line)\b/gi)||[]).length;
  const progression=/\b(?:then|next|after|by the end|finally|finishes?|completes?|responds? by|follow(?:s|ed|ing)? with)\b/i.test(p);
  const stateChange=/\b(?:clearly different position|different position|changes? position|moves? from .* to|transfers? .* from .* to|places? .* (?:onto|into|beside|on)|stands? up|sits? down|steps? (?:aside|forward|back)|crosses? .*|opens? .* (?:fully|wide)|closes? .*|lifts? .* (?:off|from)|sets? .* down|hands? .* to|passes? .* to|reaches? .* then|completed state|visibly different|foreground subject .* different|object .* different|raises? .* (?:head|gaze|eye-line)|lifts? .* (?:head|gaze|eye-line)|meets? .* gaze|establish(?:es|ing)? .* eye-line)\b/i.test(p);
  const excessiveBodyTravel=/\b(?:walks?|walking|crosses?|crossing|steps?)\b[\s\S]{0,220}\b(?:walks? back|walking back|returns? to|crosses? back|turns? back)\b/i.test(p);
  if(excessiveBodyTravel)return 'Unnecessary back-and-forth body travel increases morph risk. Keep the main adult anchored and use one nearby purposeful hand/object action unless narration requires relocation.';
  return (timed>=3&&actions>=1&&progression&&stateChange)?'':'Visible state change is too weak: use one purposeful nearby action that ends in a clearly different completed object/hand state. For a human-centered P14 close, a clearly visible head/eye-line raise may serve as the single completed state change. Camera motion, breathing, tiny fidgeting, or a held pose alone do not.';
 }
 function issues(topic,prompt){
  if(!matches(topic))return [];
  if(applyReflectiveP14BrowserRepair(prompt))throw new Error('P14 scene auto-repaired locally to the human-centered closing beat. No API credits were used. Tap P14 RETRY once more to rebuild and audit the corrected prompt.');
  const errors=[];
  for(const [re,message] of [
   [/rising environmental pressure|quieter tension\s*→\s*rising pressure|powerful hazard sound/i,'Generic hazard audio conflicts with public-health context.'],
   [/PEAK PRIMARY IMPACT|P1 returns to normal life before the event|pre-impact \/ intact baseline/i,'Generic disaster timeline remains in this public-health prompt.'],
   [/Wind builds before objects accelerate|shingles and small boards may travel farther/i,'Natural-disaster motion rules remain in this public-health prompt.']
  ])if(re.test(prompt||''))errors.push(message);
  if(!/ABSOLUTE NO-TEXT ENVIRONMENT LOCK — HIGHEST PRIORITY/i.test(prompt||''))errors.push('Public-health prompt is missing the absolute no-text environment lock. Rebuild before Flow so signs, posters, labels, logos and pseudo-text are explicitly forbidden.');
  const eraIssue=modernEventEraIssue(prompt); if(eraIssue)errors.push(eraIssue);
  const treatmentIssue=generalGuidanceTreatmentIssue(prompt); if(treatmentIssue)errors.push(treatmentIssue);
  const careIssue=generalContinuingCareProcedureIssue(prompt); if(careIssue)errors.push(careIssue);
  const p14Issue=p14ClosingIssue(prompt); if(p14Issue)errors.push(p14Issue);
  const motionIssue=motionProgressionIssue(prompt); if(motionIssue)errors.push(motionIssue);
  return errors;
 }
 const api={version,matches,beat,rules,issues,continuingCareSafeScene,reflectiveP14SafeScene,canonicalReflectiveP14Scene};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LDPublicHealthPolicy=api;
})(typeof window!=='undefined'?window:globalThis);
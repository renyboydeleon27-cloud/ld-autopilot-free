/* Shared local policy. No network calls. */
(function(root){
 'use strict';
 const version='1.3.7';
 const NO_TEXT_LOCK='ABSOLUTE NO-TEXT ENVIRONMENT LOCK — HIGHEST PRIORITY: No readable words, letters, numbers, labels, posters, wall signs, clinic names, room names, notices, charts, logos, badges, packaging text, folder text, tray labels, screen text, paperwork text, or typography anywhere in the frame from frame 1 through frame 10. Replace every sign, poster, chart, notice, label, package face, folder face, badge, wall board and printed surface with blank or abstract non-readable shapes. If an object would normally contain text, render that surface blank. Do not create pseudo-text, gibberish lettering, partial words, stylized letters, symbols that resemble writing, or readable environmental signage. This lock overrides environmental-detail, realism, clinic-setting, signage, prop-detail, and production-DNA instructions that might otherwise introduce visible writing.';
 function matches(topic){return /xylazine|zombie drug|tranq|opioid|fentanyl|drug crisis|overdose crisis/i.test(topic||'');}
 function beat(text){
  const s=String(text||'');
  if(/veterinary|sedate animals/i.test(s))return 2;
  if(/thousand.*train|training|received training/i.test(s))return 12;
  if(/distributed|distribution/i.test(s)&&/naloxone/i.test(s))return 12;
  if(/naloxone|rescuers|emergency services/i.test(s))return 10;
  // Continuing-care narration must route to neutral support/outreach scenes BEFORE
  // the generic wound keyword can route it into wound-treatment scene choices.
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
  motion:'MICRO-TRANSITION + MORPH CONTROL: Use EXACTLY ONE primary purposeful micro-action that creates one clear completed state change. Keep the main adult anchored in place unless the approved narration truly requires relocation. Prefer one purposeful nearby hand/object action within reach, such as moving one stable folder, bundle, tray item or other simple object from one stable location to another. Meaningful document/folder handling counts when the same object visibly moves from one stable location to another; tiny paper fidgeting does not. Supporting or background adults may only show subtle gaze, breathing or posture settling; they must NOT touch, turn, adjust, carry, open, close or otherwise manipulate a second object such as a monitor, paper stack, tray, folder, door or tool. Never add a second purposeful task merely to create motion. The primary action may finish naturally before the final seconds; after completion, allow only calm residual movement such as breathing, gaze or a small hand settle. Identity stability outranks amount of motion. Preserve identity, anatomy, clothing, object count and geometry. No teleportation, duplication, morphing, object respawn or sudden object changes.',
  damage:'DEBRIS + DAMAGE PHYSICS LOCK: Keep structures intact unless the current approved scene explicitly establishes otherwise. Ordinary objects obey gravity and contact. No generic disaster debris or destruction sequence.',
  cast:'adults appropriate to the current narration and illustrative setting, without invented diagnoses or exaggerated behavior. For event years 2000 or later, year-appropriate means contemporary to that locked year: modern everyday/work/clinic clothing and hairstyles are expected, while antique, Victorian, Edwardian, early-1900s, retro nurse-dress, long-apron, bonnet, vintage-uniform or historical-classroom styling is forbidden unless the narration explicitly documents such a reenactment.',
  noText:NO_TEXT_LOCK,
  progression:'PUBLIC-HEALTH STORY RULE: The current approved narration determines the beat. Do not impose a natural-disaster timeline. Illustrative context is not evidence of a specific historical incident, investigation, treatment encounter or chemical identification. GENERAL-GUIDANCE LOCK: a narration instruction such as give naloxone or call emergency services is public guidance, not proof of a specific documented treatment encounter. Unless the narration explicitly identifies a specific documented administration event, visualize preparedness or readiness only—such as moving one naloxone device from an already-open kit to a nearby tray—without showing injection, nasal administration, dosing, route of administration, recovery, or treatment outcome. CONTINUING-CARE LOCK: when narration generally says people need wound care, access to treatment, or ongoing support, that is not proof of a specific examination or procedure. Visualize access to care/support without patient contact: use a calm clinic or support setting and one closed unmarked resource folder or similarly neutral support object moved from one stable surface to a nearby tray. Keep the visitor fully clothed with hands and forearms still. Do not expose a wound, roll or raise a sleeve for assessment, examine or touch the patient, or show bandage, gauze, dressing, wound treatment, medication, injection, dosing, procedure, recovery, or treatment outcome unless the narration explicitly documents that specific event. MODERN-EVENT ERA OVERRIDE — HIGHEST PRIORITY FOR 2000+ EVENTS: “historical anime” describes only the serious hand-drawn documentary/graphic-novel rendering style; it does NOT mean antique, Victorian, Edwardian, early-1900s, wartime, retro, vintage or pre-digital wardrobe, interiors, furniture, hairstyles, props or technology. For any locked event year from 2000 onward, every visible person, room and object must read as contemporary to that exact year and location. Use year-appropriate modern casual/work/clinic clothing, contemporary furniture and fixtures, and ordinary technology that existed in the locked year. Any generic phrase such as “historically appropriate wardrobe” means year-appropriate contemporary clothing for the locked year. Any generic “no modern objects outside the era” wording means no objects newer than the locked year; it does NOT ban ordinary technology contemporary to that year. No vintage nurse dress, long apron, bonnet, antique clinic uniform, historical classroom styling or old-period interior unless the narration explicitly requires it. '+NO_TEXT_LOCK,
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
 function sentences(text){
  return String(text||'').split(/\n+|(?<=[.!?])\s+/).map(function(s){return s.trim();}).filter(Boolean);
 }
 function negativeSafetySentence(text){
  const s=String(text||'');
  return /^(?:no\b|never\b|without\b|avoid\b|do not\b|don't\b|must not\b)/i.test(s)
    || /\b(?:do not|does not|must not|never|without|forbid(?:den)?|avoid)\b/i.test(s);
 }
 function positiveCue(text,re){
  return sentences(text).some(function(s){return re.test(s)&&!negativeSafetySentence(s);});
 }
 function continuingCareSafeScene(scene){
  const s=String(scene||'');
  const safeCore=/\bclosed\s*,?\s*unmarked\s+resource\s+folder\b/i.test(s)
    && /\b(?:counter|stable surface)\b/i.test(s)
    && /\btray\b/i.test(s)
    && /\bfully clothed adult visitor\b/i.test(s)
    && /\b(?:no physical contact(?: with the visitor)?|never touches? the visitor|does not touch the visitor|must not touch the visitor)\b/i.test(s)
    && /\bcontemporary\s+20\d{2}\b/i.test(s);
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
  const ambiguousWardrobe=/\b(?:period-appropriate|historically appropriate)\b[^.\n]{0,100}\b(?:clothing|wardrobe|attire|uniform|dress)\b/i.test(scene);
  if(ambiguousWardrobe)return 'Modern-era wardrobe wording is still ambiguous. In the PANEL SCENE, replace period/historically-appropriate clothing language with explicit contemporary '+year+' clothing and hairstyles. Historical anime is the art style only; no vintage nurse dress, long apron, bonnet, antique clinic uniform or early-1900s styling.';
  if(positiveCue(scene,/\b(?:Victorian|Edwardian|early[- ]1900s|vintage nurse|long apron|bonnet|antique clinic|historical classroom|retro uniform)\b/i))return 'PANEL SCENE contains old-period styling for a '+year+' event. Use contemporary '+year+' wardrobe, clinic/support furnishings, hairstyles and technology only.';
  return '';
 }
 function generalGuidanceTreatmentIssue(prompt){
  const p=String(prompt||'');
  const guidance=/\b(?:give|use|administer)\s+naloxone\b|\bcall\s+emergency\s+services\b/i.test(p);
  if(!guidance)return '';
  const scene=panelScene(p);
  if(!scene)return '';
  const actualAdministration=/\b(?:administers?|administering|injects?|injecting|sprays?|spraying|delivers?|delivering|doses?|dosing)\b[\s\S]{0,90}\bnaloxone\b|\bnaloxone\b[\s\S]{0,90}\b(?:administered|injected|sprayed|delivered|dosed)\b|\b(?:inserts?|inserting|places?|placing)\b[\s\S]{0,90}\b(?:naloxone|nasal spray)\b[\s\S]{0,90}\b(?:nostril|nose)\b/i;
  if(positiveCue(scene,actualAdministration))return 'General naloxone guidance was staged as a specific administration encounter. Show preparedness only: one naloxone device may move from an already-open kit to a nearby tray, then settle. Do not show injection, nasal administration, dosing, route, recovery, or treatment outcome unless the narration explicitly identifies a specific documented administration event.';
  return '';
 }
 function generalContinuingCareProcedureIssue(prompt){
  const p=String(prompt||'');
  const guidance=/\bwound care\b|\baccess to treatment\b|\bsupport(?:\s+that)?\s+continues\b|\bsupport[^\n.]{0,80}\bafterward\b|\bongoing support\b|\bcontinued support\b/i.test(p);
  if(!guidance)return '';
  const scene=panelScene(p);
  if(!scene)return '';
  if(continuingCareSafeScene(scene))return '';
  const procedureCue=/\b(?:wound-care clinic treating a patient|wound-care clinic providing ongoing[^.\n]{0,50}treatment|community health clinic during non-graphic wound assessment|sleeve\s+(?:rolled|raised)|rolled\s+(?:up\s+)?sleeve|raised\s+sleeve|exposed\s+wound|visible\s+wound|wound\s+(?:assessment|examination|exam)|non-graphic\s+wound\s+assessment|examines?\s+(?:the\s+)?(?:patient|visitor|wound|forearm|arm)|treats?\s+(?:the\s+)?wound|bandages?\s+(?:the\s+)?(?:wound|arm|forearm)|wraps?\s+(?:the\s+)?(?:arm|forearm|wound)|appl(?:y|ies|ying)\s+(?:a\s+)?(?:bandage|gauze|dressing)|places?\s+(?:a\s+)?(?:bandage|gauze|dressing)\s+(?:on|onto|over)|clinician[^.]{0,100}\b(?:touches?|examines?|treats?|bandages?|wraps?)\s+(?:the\s+)?(?:patient|visitor))\b/i;
  if(positiveCue(scene,procedureCue))return 'General continuing-care narration was staged too literally as a wound examination or treatment procedure. Keep the clinic visitor fully clothed with both hands/forearms still and no exposed wound or rolled sleeve. The clinician must not touch the visitor. Use exactly one neutral support action instead, preferably moving one closed unmarked resource folder from a stable counter to a nearby tray, then settle. No bandage, gauze, dressing, wound assessment, medication, injection, procedure, recovery, or treatment outcome.';
  return '';
 }
 function motionProgressionIssue(prompt){
  const p=String(prompt||'');
  const legacyMotion=/one unmistakable foreground action|Continue and visibly complete the physical action through most of this beat|paper handling, or a held pose alone do NOT count|Do not hold a static pose for the full final three seconds/i;
  if(legacyMotion.test(p))return 'Legacy public-health motion wording is still present. Rebuild with one purposeful nearby hand/object action, allow the action to finish naturally, and let only subtle residual movement remain afterward.';
  const secondaryIssue=secondaryObjectActionIssue(p);
  if(secondaryIssue)return secondaryIssue;
  const timed=(p.match(/\b(?:0(?:\.0)?|2(?:\.0)?|7(?:\.0)?)[–-](?:2(?:\.0)?|7(?:\.0)?|10(?:\.0)?)\s*(?:s|seconds?)\b/gi)||[]).length;
  const actions=(p.match(/\b(?:reach|reaches|reaching|move|moves|moving|turn|turns|turning|check|checks|checking|place|places|placing|hand|hands|handing|slide|slides|sliding|open|opens|opening|lift|lifts|lifting|withdraw|withdraws|withdrawing|gesture|gestures|gesturing|exchange|exchanges|exchanging|finish|finishes|finishing|release|releases|releasing|settle|settles|settling)\b/gi)||[]).length;
  const progression=/\b(?:then|next|after|by the end|finally|finishes?|completes?|responds? by|follow(?:s|ed|ing)? with)\b/i.test(p);
  const stateChange=/\b(?:clearly different position|different position|changes? position|moves? from .* to|transfers? .* from .* to|places? .* (?:onto|into|beside|on)|stands? up|sits? down|steps? (?:aside|forward|back)|crosses? .*|opens? .* (?:fully|wide)|closes? .*|lifts? .* (?:off|from)|sets? .* down|hands? .* to|passes? .* to|reaches? .* then|completed state|visibly different|foreground subject .* different|object .* different)\b/i.test(p);
  const excessiveBodyTravel=/\b(?:walks?|walking|crosses?|crossing|steps?)\b[\s\S]{0,220}\b(?:walks? back|walking back|returns? to|crosses? back|turns? back)\b/i.test(p);
  if(excessiveBodyTravel)return 'Unnecessary back-and-forth body travel increases morph risk. Keep the main adult anchored and use one nearby purposeful hand/object action unless narration requires relocation.';
  return (timed>=3&&actions>=1&&progression&&stateChange)?'':'Visible state change is too weak: use one purposeful nearby action that ends in a clearly different completed object/hand state. Meaningful folder or object transfer counts; camera motion, breathing, tiny fidgeting, or a held pose alone do not.';
 }
 function issues(topic,prompt){
  if(!matches(topic))return [];
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
  const motionIssue=motionProgressionIssue(prompt); if(motionIssue)errors.push(motionIssue);
  return errors;
 }
 const api={version,matches,beat,rules,issues,continuingCareSafeScene};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LDPublicHealthPolicy=api;
})(typeof window!=='undefined'?window:globalThis);
/* Shared local policy. No network calls. */
(function(root){
 'use strict';
 const version='1.3.2';
 function matches(topic){return /xylazine|zombie drug|tranq|opioid|fentanyl|drug crisis|overdose crisis/i.test(topic||'');}
 function beat(text){
  const s=String(text||'');
  if(/veterinary|sedate animals/i.test(s))return 2;
  if(/thousand.*train|training|received training/i.test(s))return 12;
  if(/distributed|distribution/i.test(s)&&/naloxone/i.test(s))return 12;
  if(/naloxone|rescuers|emergency services/i.test(s))return 10;
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
  cast:'adults appropriate to the current narration and illustrative setting, without invented diagnoses or exaggerated behavior',
  progression:'PUBLIC-HEALTH STORY RULE: The current approved narration determines the beat. Do not impose a natural-disaster timeline. Illustrative context is not evidence of a specific historical incident, investigation, treatment encounter or chemical identification. GENERAL-GUIDANCE LOCK: a narration instruction such as give naloxone or call emergency services is public guidance, not proof of a specific documented treatment encounter. Unless the narration explicitly identifies a specific documented administration event, visualize preparedness or readiness only—such as moving one naloxone device from an already-open kit to a nearby tray—without showing injection, nasal administration, dosing, route of administration, recovery, or treatment outcome.',
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
 function generalGuidanceTreatmentIssue(prompt){
  const p=String(prompt||'');
  const guidance=/\b(?:give|use|administer)\s+naloxone\b|\bcall\s+emergency\s+services\b/i.test(p);
  if(!guidance)return '';
  const scene=panelScene(p);
  if(!scene)return '';
  const actualAdministration=/\b(?:administers?|administering|injects?|injecting|sprays?|spraying|delivers?|delivering|doses?|dosing)\b[\s\S]{0,90}\bnaloxone\b|\bnaloxone\b[\s\S]{0,90}\b(?:administered|injected|sprayed|delivered|dosed)\b|\b(?:inserts?|inserting|places?|placing)\b[\s\S]{0,90}\b(?:naloxone|nasal spray)\b[\s\S]{0,90}\b(?:nostril|nose)\b/i;
  if(actualAdministration.test(scene))return 'General naloxone guidance was staged as a specific administration encounter. Show preparedness only: one naloxone device may move from an already-open kit to a nearby tray, then settle. Do not show injection, nasal administration, dosing, route, recovery, or treatment outcome unless the narration explicitly identifies a specific documented administration event.';
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
   [/Wind builds before objects accelerate|shingles and small boards may travel farther/i,'Natural-disaster motion rules remain in the public-health prompt.']
  ])if(re.test(prompt||''))errors.push(message);
  const treatmentIssue=generalGuidanceTreatmentIssue(prompt);
  if(treatmentIssue)errors.push(treatmentIssue);
  const motionIssue=motionProgressionIssue(prompt);
  if(motionIssue)errors.push(motionIssue);
  return errors;
 }
 const api={version,matches,beat,rules,issues};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LDPublicHealthPolicy=api;
})(typeof window!=='undefined'?window:globalThis);

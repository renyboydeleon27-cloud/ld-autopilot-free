/* Shared local policy. No network calls. */
(function(root){
 'use strict';
 const version='1.2.0';
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
 motion:'MICRO-TRANSITION + MORPH CONTROL: One simple visible action with continuous movement and physical contact. The action must create an unmistakable visible state change: by the middle frame, a foreground subject or handled object must occupy a clearly different position or configuration than at the start; by the final frame, that action must reach a visibly different completed state. Camera motion, blinking, breathing, tiny hand movement, paper handling, or a held pose alone do NOT count as progression. Preserve identities and geometry. No teleportation, duplication or sudden object changes. Identity continuity does not freeze a moving person in position.',
 damage:'DEBRIS + DAMAGE PHYSICS LOCK: Keep structures intact unless the current approved scene explicitly establishes otherwise. Ordinary objects obey gravity and contact. No generic disaster debris or destruction sequence.',
 cast:'adults appropriate to the current narration and illustrative setting, without invented diagnoses or exaggerated behavior',
 progression:'PUBLIC-HEALTH STORY RULE: The current approved narration determines the beat. Do not impose a natural-disaster timeline. Illustrative context is not evidence of a specific historical incident, investigation, treatment encounter or chemical identification.',
 canon:'EPISODE CANON — CONTINUITY ENGINE: Preserve project location, year and selected visual style. Different illustrative settings may use different adults. Do not invent prior-panel damage, clinical outcomes, identities or action. Reuse specific continuity only when explicitly supplied and relevant.'
 };
 function motionProgressionIssue(prompt){
  const p=String(prompt||'');
  const timed=(p.match(/\b(?:0(?:\.0)?|2(?:\.0)?|7(?:\.0)?)[–-](?:2(?:\.0)?|7(?:\.0)?|10(?:\.0)?)\s*(?:s|seconds?)\b/gi)||[]).length;
  const actions=(p.match(/\b(?:reach|reaches|reaching|move|moves|moving|walk|walks|walking|turn|turns|turning|check|checks|checking|place|places|placing|apply|applies|applying|wrap|wraps|wrapping|hand|hands|handing|slide|slides|sliding|open|opens|opening|lift|lifts|lifting|withdraw|withdraws|withdrawing|step|steps|stepping|gesture|gestures|gesturing|assist|assists|assisting|respond|responds|responding|exchange|exchanges|exchanging|prepare|prepares|preparing|finish|finishes|finishing)\b/gi)||[]).length;
  const progression=/\b(?:then|next|after|by the end|finally|finishes?|completes?|responds? by|follow(?:s|ed|ing)? with)\b/i.test(p);
  const stateChange=/\b(?:clearly different position|different position|changes? position|moves? from .* to|transfers? .* from .* to|places? .* (?:onto|into|beside|on)|stands? up|sits? down|steps? (?:aside|forward|back)|crosses? .*|opens? .* (?:fully|wide)|closes? .*|lifts? .* (?:off|from)|sets? .* down|hands? .* to|passes? .* to|reaches? .* then|completed state|visibly different|foreground subject .* different|object .* different)\b/i.test(p);
  const weakOnly=/\b(?:camera (?:moves?|tracks?|pushes?|settles?)|gentle push|lateral camera|blink(?:s|ing)?|breath(?:es|ing)?|tiny hand|paper handling|holds? (?:the )?(?:same )?pose)\b/i.test(p);
  return (timed>=3&&actions>=2&&progression&&stateChange&&!weakOnly)?'':'Visible state change is too weak: require a foreground subject or handled object to occupy a clearly different position/configuration at the middle and a visibly completed different state by the final frame. Camera motion, blinking, breathing, tiny hand/paper movement, or a held pose alone do not count.';
 }
 function issues(topic,prompt){
  if(!matches(topic))return [];
  const errors=[];
  for(const [re,message] of [
   [/rising environmental pressure|quieter tension\s*→\s*rising pressure|powerful hazard sound/i,'Generic hazard audio conflicts with public-health context.'],
   [/PEAK PRIMARY IMPACT|P1 returns to normal life before the event|pre-impact \/ intact baseline/i,'Generic disaster timeline remains in this public-health prompt.'],
   [/Wind builds before objects accelerate|shingles and small boards may travel farther/i,'Natural-disaster motion rules remain in the public-health prompt.']
  ])if(re.test(prompt||''))errors.push(message);
  const motionIssue=motionProgressionIssue(prompt);
  if(motionIssue)errors.push(motionIssue);
  return errors;
 }
 const api={version,matches,beat,rules,issues};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LDPublicHealthPolicy=api;
})(typeof window!=='undefined'?window:globalThis);

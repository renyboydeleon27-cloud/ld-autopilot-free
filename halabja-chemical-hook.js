/* LD AUTO — Halabja Chemical Attack 1988 topic pack v1.2: recommended HOOK + P1 + progression fix */
(function(){
'use strict';

var TOPIC='Halabja Chemical Attack — Iraq — 1988';
var VERSION='1.2';

function isHalabjaTopic(value){
  return /^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i.test(String(value||'').trim());
}

function prompt(){
return `VIDEO PROMPT — EXACTLY 10 SECONDS

TOPIC: Halabja Chemical Attack — Iraq — 1988
HOOK: Witness Before the Graves

ABSOLUTE RENDERING MODE — HIGHEST PRIORITY:
2D HISTORICAL ANIME ONLY. Render every frame as serious hand-drawn 2D historical anime / graphic-novel animation in strict true black-and-white grayscale. NEVER render live-action footage, photorealistic humans, camera-captured people, 3D CGI humans, glossy render, or chibi. If any wording conflicts, this 2D historical anime lock wins.

UNIVERSAL MONOCHROME LOCK:
STRICT true black-and-white grayscale from frame 1 through frame 10.
No color.
No sepia.
No tint.
No selective color.
Serious historical tone.
Detailed hand-drawn linework.
Grayscale tonal shading.
Grounded adult anatomy.
No embedded text.
No watermark.

FORMAT:
Portrait 9:16.
Exactly 10 seconds.
Text-to-video only.
One continuous shot.
No cuts.
No montage.
No voice-over.
No spoken dialogue.
No on-screen text.
No subtitles.

HOOK GOAL:
Create a haunting, respectful historical opening for the Halabja Chemical Attack. Show one elderly Kurdish male survivor or witness standing in the foreground in a dark, solemn aftermath setting. At the beginning, the graveyard must NOT be clearly visible. The emotional focus is entirely on the old man’s face and expression. Only after the eyeball transition should the burial ground be revealed, with crows suddenly flying upward from the graves.

HISTORICAL / TRUTH LOCK:
Location: Halabja, Iraq.
Year: 1988.
Show a historically believable elderly Kurdish civilian man wearing modest late-1980s regional clothing.
The final revealed burial ground must feel grounded and realistic, with many fresh graves or burial mounds and a mourning atmosphere.
No exposed bodies.
No gore.
No graphic detail.
Adult subject only.

CAMERA / COMPOSITION:
The old man stands in the foreground, center or slightly off-center.
The camera begins focused tightly on him from the front.
The background is dark, subdued, and indistinct at first, so the graveyard is not yet readable.
The camera slowly pushes closer and closer toward his face.
The emotional priority is grief, numbness, trauma, and silence.

TIMING:
0.0–2.5s — ELDERLY WITNESS
Establish one elderly man standing silently in the foreground. The background is dark and blurred or subdued, with only vague aftermath atmosphere. Do NOT clearly reveal the graveyard yet.

2.5–5.5s — SLOW PUSH-IN
Slow cinematic push-in toward the old man’s face. He remains almost motionless except for minimal natural breathing and a subtle grief-stricken expression. Keep the background unreadable and heavy.

5.5–7.0s — EYE PUSH-IN
The camera pushes very close to one eye. The eye fills most of the frame. His expression remains restrained and emotionally heavy.

7.0–10.0s — EYEBALL TRANSITION + GRAVEYARD REVEAL
Move directly through the eye into a dark, haunting wide reveal of a burial ground with many fresh graves or burial mounds. As the graveyard is revealed, several crows suddenly burst upward and fly into the sky, rising from the burial ground. Their movement must feel sharp, eerie, and dramatic, while the graves remain solemn and non-graphic.

VISUAL ATMOSPHERE:
Dark and heavy.
Quiet aftermath.
Mourning mood.
Solemn stillness at first.
The final reveal becomes more ominous through the sudden flight of crows.
No fire.
No explosions.
No battle spectacle.
The horror comes from grief, silence, memory, and the revealed scale of loss.

MOTION RULES:
One continuous forward-moving camera shot.
Very restrained character motion only.
The strongest motion comes at the final reveal when the crows rise suddenly upward from the graveyard.
Subtle wind or faint atmospheric movement may appear.
Do not turn this into an action scene.

NEGATIVE LOCK:
No graveyard clearly visible before the eyeball transition.
No exposed bodies.
No gore.
No mutilation.
No graphic wounds.
No children in foreground.
No fantasy creatures.
No smiling faces.
No heroic pose.
No modern objects that do not belong.
No fire.
No explosions.
No text.
No subtitles.
No logos.
No watermark.

ENDING IMAGE:
End on the revealed graveyard with crows flying upward into the dark sky, creating a devastating and unforgettable final image just before the shot cuts.

CORE VISUAL FLOW:
ELDERLY WITNESS IN DARK INDISTINCT SETTING
→ SLOW CAMERA PUSH-IN
→ EXTREME CLOSE-UP OF ONE EYE
→ CAMERA ENTERS THE EYE
→ GRAVEYARD REVEALED ONLY AFTER TRANSITION
→ CROWS SUDDENLY FLY UPWARD
→ DARK WIDE FINAL IMAGE

STATUS: RECOMMENDED HOOK NO. 1 — HALABJA CHEMICAL ATTACK — IRAQ — 1988.`;
}

var P1_SCENE='EXACTLY 10 SECONDS, portrait 9:16. Strict true black-and-white grayscale 2D historical anime / graphic-novel animation only; no live action, photorealism, color, sepia, tint, or 3D CGI. Halabja, northern Iraq, 1988, before the chemical attack. Show an intact modest Kurdish residential-market street with period-appropriate masonry buildings, simple doorways and storefront forms, unmarked household or market goods, and no readable signs. One adult Kurdish civilian is the clear foreground subject. At 0.0–0.5 seconds, the adult begins walking naturally through the quiet street carrying one ordinary period-appropriate market or household item. From 0.5–6.5 seconds, continue the same steady walking action while the camera makes a restrained lateral observational move, gradually revealing more of the intact neighborhood and ordinary civilian life. From 6.5–10.0 seconds, the adult slows near the edge of the frame while the camera holds the calm street depth and surrounding buildings. The visual purpose is to establish Halabja as a lived-in Kurdish civilian city before the attack. No chemical cloud, gas, smoke, haze, military action, aircraft, bombing, panic, casualties, graveyard, destruction, warning signs or invented dramatic foreshadowing. Preserve the same adult identity, clothing, anatomy, carried object, building geometry and street layout throughout the shot. Calm normal-world intensity only.';

var CHEMICAL_STAGES={
  P1:{role:'Halabja civilian life · intact city before the attack',rule:'Establish Halabja as a lived-in Kurdish civilian city before visible attack effects. No bombing, gas, panic, casualties, military spectacle or destruction.'},
  P2:{role:'War context · forces move around the Halabja area',rule:'Show only evidence-supported wartime context. Do not invent tactical plans, weapon handling, targeting procedures or unsupported combat details.'},
  P3:{role:'Conventional bombardment · attack begins',rule:'Show the documented conventional bombardment stage without jumping ahead to chemical exposure. Keep destruction limited to what this beat establishes.'},
  P4:{role:'Chemical attack begins · civilians exposed with little warning',rule:'Represent the onset of chemical attack without operational weapon instructions. Toxic agents may be invisible; do not invent colored gas, glowing contamination or fantasy effects.'},
  P5:{role:'Chemical-agent evidence · mustard gas and sarin context',rule:'Treat agent identification as historical context, not a weapon demonstration. Do not visualize formulas, mixing, delivery mechanics or procedural details.'},
  P6:{role:'Human medical effects · acute exposure crisis',rule:'Show non-graphic human distress consistent with the narration. No gore, sensationalized suffering or unsupported symptoms.'},
  P7:{role:'Human toll · scale of civilian loss',rule:'Communicate scale respectfully and non-graphically. Avoid exposed bodies, gore or exploitative close-ups.'},
  P8:{role:'Survivors · injuries and continuing consequences',rule:'Show surviving civilians and ongoing harm without inventing diagnoses, procedures or instant recovery.'},
  P9:{role:'Escape and evacuation · civilians seek safety',rule:'Show people leaving affected areas or being moved toward help when supported. Do not repeat the peak attack as another identical scene.'},
  P10:{role:'Medical and humanitarian response',rule:'Show restrained period-appropriate care or transport only when supported. Do not invent modern equipment, agencies or specific treatment procedures.'},
  P11:{role:'Eyewitness and photographic evidence reaches the outside world',rule:'Represent documentation and outside awareness without readable fabricated records, staged propaganda imagery or invented named individuals.'},
  P12:{role:'Investigation and documentary evidence',rule:'Show the existence of later investigation or records in a restrained way. Do not fabricate readable documents, confessions, exact archive layouts or courtroom events.'},
  P13:{role:'Historical significance · chemical weapons used against civilians',rule:'Reflect on Halabja’s documented historical significance without introducing a new attack beat or repeating graphic victim imagery.'},
  P14:{role:'Legacy · survivors, memory and chemical-weapons prohibition',rule:'Close on memory, survivors and documented legacy. Keep the final beat human-centered and reflective; do not introduce new suffering or unsupported political claims.'}
};

function installProgressionOverride(){
  var base=window.LDDisasterProgression;
  if(!base||base.__halabjaChemicalV12)return false;
  var evidence='This is a story-position lock, not a fact source. Halabja-specific research, approved narration and dedicated event panels control factual details. Do not invent tactical chemical-weapon procedures, unverified symptoms, named individuals, readable documents or unsupported military actions.';
  function chemicalStage(topic,stageName){
    if(!isHalabjaTopic(topic))return null;
    var s=String(stageName||'').toUpperCase(),item=CHEMICAL_STAGES[s];
    if(!item)return null;
    return {version:'halabja-chemical-progression-v1.2',family:'chemical',familyLabel:'Chemical Attack / Chemical Weapons',stage:s,role:item.role,rule:item.rule,evidenceRule:evidence};
  }
  function family(topic){return isHalabjaTopic(topic)?'chemical':base.family(topic);}
  function stage(topic,stageName){return chemicalStage(topic,stageName)||base.stage(topic,stageName);}
  function role(topic,stageName){var x=stage(topic,stageName);return x?.role||'';}
  function rule(topic,stageName){var x=stage(topic,stageName);return x?.rule||'';}
  function all(topic){
    if(!isHalabjaTopic(topic))return base.all(topic);
    var out={};for(var i=1;i<=14;i++){var s='P'+i;out[s]=stage(topic,s);}return out;
  }
  function summary(topic){
    if(!isHalabjaTopic(topic))return base.summary(topic);
    return {version:'halabja-chemical-progression-v1.2',family:'chemical',familyLabel:'Chemical Attack / Chemical Weapons',stages:all(topic)};
  }
  window.LDDisasterProgression=Object.freeze({version:'halabja-chemical-progression-v1.2',family:family,stage:stage,role:role,rule:rule,all:all,summary:summary,__halabjaChemicalV12:true});
  return true;
}

function installChoiceOverride(){
  var lib=window.LDHookFamilyLibrary;
  if(!lib||typeof lib.choices!=='function'||lib.__halabjaRecommendedHookV11)return false;
  var baseChoices=lib.choices;
  lib.choices=function(ctx){
    var list=baseChoices(ctx);
    var c=ctx||{};
    var eligible=isHalabjaTopic(c.topic)
      && c.format!=='longform'
      && c.mode==='anime'
      && c.colorMode==='bw'
      && (!c.family||c.family==='industrial');
    if(!eligible||!Array.isArray(list)||!list.length)return list;
    var first=Object.assign({},list[0]);
    first.rec=true;
    first.status='RECOMMENDED';
    first.title='Witness Before the Graves';
    first.concept='Elderly Kurdish witness in a dark indistinct foreground → slow push into one eye → eyeball transition → graveyard reveal → crows burst upward.';
    first.why='Topic-specific Halabja hook: the graveyard stays hidden until the eye transition, then the burial-ground reveal and rising crows deliver a respectful, non-graphic historical aftermath image.';
    first.prompt=prompt();
    first.source='Topic-specific';
    list=list.slice();
    list[0]=first;
    return list;
  };
  lib.__halabjaRecommendedHookV11=true;
  try{
    var key='ld-auto-active-hook-v1';
    var active=JSON.parse(localStorage.getItem(key)||'null');
    if(active&&isHalabjaTopic(active.topic)){
      active.policyVersion='halabja-recommended-v1-refresh';
      localStorage.setItem(key,JSON.stringify(active));
    }
  }catch(e){}
  return true;
}

function currentTopic(){
  var typed=document.getElementById('topic')?.value?.trim();
  if(typed)return typed;
  var title=document.getElementById('projectTitle')?.textContent?.trim();
  return title&&title!=='No production yet'?title:'';
}

function applyP1Fix(){
  if(!isHalabjaTopic(currentTopic()))return false;
  installProgressionOverride();
  installChoiceOverride();

  var existing=window.ldVideoContinuity&&typeof window.ldVideoContinuity==='object'&&!Array.isArray(window.ldVideoContinuity)?window.ldVideoContinuity:{};
  var location=String(existing.location||'').trim();
  if(!location||/^iraq$/i.test(location)){
    window.ldVideoContinuity=Object.assign({},existing,{year:String(existing.year||'1988')||'1988',location:'Halabja, northern Iraq'});
    var locationField=document.querySelector('#chapterVideoContext .video-location');
    if(locationField)locationField.value='Halabja, northern Iraq';
    var yearField=document.querySelector('#chapterVideoContext .video-year');
    if(yearField&&!yearField.value)yearField.value='1988';
  }

  var card=document.querySelector('.stage-card[data-stage="P1"]');
  if(!card)return false;
  var done=card.querySelector('.done-toggle');
  if(done?.checked)return false;

  var sceneField=card.querySelector('.video-scene');
  var currentScene=String(sceneField?.value||card.dataset.videoScene||'');
  var needsScene=!currentScene||/warehouse|wooden crate|burlap sack|low pallet|SMART RANDOM CHOICE|KEEP CURRENT SCENE/i.test(currentScene)||card.dataset.halabjaP1Lock!=='1';
  if(needsScene){
    card.dataset.sceneChoice='';
    card.dataset.videoScene=P1_SCENE;
    card.dataset.halabjaP1Lock='1';
    if(sceneField)sceneField.value=P1_SCENE;
    card.dataset.textVideoPrompt='';
    card.dataset.textVideoSignature='';
    delete card.dataset.smartReady;
    delete card.dataset.smartReadySignature;
    var promptField=card.querySelector('.text-video-prompt');
    if(promptField)promptField.value='';
    if(sceneField){
      sceneField.dispatchEvent(new Event('input',{bubbles:true}));
      sceneField.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
  try{window.LDVideoModes?.all?.();}catch(e){}
  return true;
}

window.LDHalabjaChemicalHook={
  version:VERSION,
  topic:TOPIC,
  status:'RECOMMENDED',
  recommended:true,
  number:1,
  title:'Witness Before the Graves',
  prompt:prompt,
  p1Scene:P1_SCENE,
  chemicalStages:CHEMICAL_STAGES,
  installChoiceOverride:installChoiceOverride,
  installProgressionOverride:installProgressionOverride,
  applyP1Fix:applyP1Fix
};

installProgressionOverride();
installChoiceOverride();
window.addEventListener('ld:production-built',function(){[0,250,700].forEach(function(ms){setTimeout(applyP1Fix,ms);});});
window.addEventListener('load',function(){[0,300,900,1600].forEach(function(ms){setTimeout(applyP1Fix,ms);});});
if(document.readyState!=='loading')setTimeout(applyP1Fix,900);
})();

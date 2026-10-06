/* LD AUTO — Halabja Chemical Attack 1988 topic pack v1.4: recommended HOOK + chemical progression + P1/P2 self-heal */
(function(){
'use strict';

var TOPIC='Halabja Chemical Attack — Iraq — 1988';
var VERSION='1.4';

function isHalabjaTopic(value){
  return /^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i.test(String(value||'').trim());
}
function currentTopic(){
  var typed=document.getElementById('topic')?.value?.trim();
  if(typed)return typed;
  var title=document.getElementById('projectTitle')?.textContent?.trim();
  return title&&title!=='No production yet'?title:'';
}

function prompt(){
return `VIDEO PROMPT — EXACTLY 10 SECONDS

TOPIC: Halabja Chemical Attack — Iraq — 1988
HOOK: Witness Before the Graves

ABSOLUTE RENDERING MODE — HIGHEST PRIORITY:
2D HISTORICAL ANIME ONLY. Render every frame as serious hand-drawn 2D historical anime / graphic-novel animation in strict true black-and-white grayscale. NEVER render live-action footage, photorealistic humans, camera-captured people, 3D CGI humans, glossy render, or chibi. If any wording conflicts, this 2D historical anime lock wins.

UNIVERSAL MONOCHROME LOCK:
STRICT true black-and-white grayscale from frame 1 through frame 10.
No color. No sepia. No tint. No selective color.
Serious historical tone. Detailed hand-drawn linework. Grayscale tonal shading. Grounded adult anatomy.
No embedded text. No watermark.

FORMAT:
Portrait 9:16. Exactly 10 seconds. Text-to-video only. One continuous shot. No cuts. No montage. No voice-over. No spoken dialogue. No on-screen text. No subtitles.

HOOK GOAL:
Create a haunting, respectful historical opening for the Halabja Chemical Attack. Show one elderly Kurdish male survivor or witness standing in the foreground in a dark, solemn aftermath setting. At the beginning, the graveyard must NOT be clearly visible. The emotional focus is entirely on the old man’s face and expression. Only after the eyeball transition should the burial ground be revealed, with crows suddenly flying upward from the graves.

HISTORICAL / TRUTH LOCK:
Location: Halabja, Iraq. Year: 1988. Show a historically believable elderly Kurdish civilian man wearing modest late-1980s regional clothing. The final revealed burial ground must feel grounded and realistic, with many fresh graves or burial mounds and a mourning atmosphere. No exposed bodies. No gore. No graphic detail. Adult subject only.

CAMERA / COMPOSITION:
The old man stands in the foreground, center or slightly off-center. The camera begins focused tightly on him from the front. The background is dark, subdued, and indistinct at first, so the graveyard is not yet readable. The camera slowly pushes closer and closer toward his face. The emotional priority is grief, numbness, trauma, and silence.

TIMING:
0.0–2.5s — ELDERLY WITNESS: Establish one elderly man standing silently in the foreground. The background is dark and blurred or subdued, with only vague aftermath atmosphere. Do NOT clearly reveal the graveyard yet.
2.5–5.5s — SLOW PUSH-IN: Slow cinematic push-in toward the old man’s face. He remains almost motionless except for minimal natural breathing and a subtle grief-stricken expression. Keep the background unreadable and heavy.
5.5–7.0s — EYE PUSH-IN: The camera pushes very close to one eye. The eye fills most of the frame. His expression remains restrained and emotionally heavy.
7.0–10.0s — EYEBALL TRANSITION + GRAVEYARD REVEAL: Move directly through the eye into a dark, haunting wide reveal of a burial ground with many fresh graves or burial mounds. As the graveyard is revealed, several crows suddenly burst upward and fly into the sky, rising from the burial ground. Their movement must feel sharp, eerie, and dramatic, while the graves remain solemn and non-graphic.

VISUAL ATMOSPHERE:
Dark and heavy. Quiet aftermath. Mourning mood. Solemn stillness at first. The final reveal becomes more ominous through the sudden flight of crows. No fire. No explosions. No battle spectacle. The horror comes from grief, silence, memory, and the revealed scale of loss.

MOTION RULES:
One continuous forward-moving camera shot. Very restrained character motion only. The strongest motion comes at the final reveal when the crows rise suddenly upward from the graveyard. Subtle wind or faint atmospheric movement may appear. Do not turn this into an action scene.

NEGATIVE LOCK:
No graveyard clearly visible before the eyeball transition. No exposed bodies. No gore. No mutilation. No graphic wounds. No children in foreground. No fantasy creatures. No smiling faces. No heroic pose. No modern objects that do not belong. No fire. No explosions. No text. No subtitles. No logos. No watermark.

ENDING IMAGE:
End on the revealed graveyard with crows flying upward into the dark sky, creating a devastating and unforgettable final image just before the shot cuts.

CORE VISUAL FLOW:
ELDERLY WITNESS IN DARK INDISTINCT SETTING → SLOW CAMERA PUSH-IN → EXTREME CLOSE-UP OF ONE EYE → CAMERA ENTERS THE EYE → GRAVEYARD REVEALED ONLY AFTER TRANSITION → CROWS SUDDENLY FLY UPWARD → DARK WIDE FINAL IMAGE

STATUS: RECOMMENDED HOOK NO. 1 — HALABJA CHEMICAL ATTACK — IRAQ — 1988.`;
}

var P1_SCENE='EXACTLY 10 SECONDS, portrait 9:16. Strict true black-and-white grayscale 2D historical anime / graphic-novel animation only; no live action, photorealism, color, sepia, tint, or 3D CGI. Halabja, northern Iraq, 1988, before the chemical attack. Show an intact modest Kurdish residential-market street with period-appropriate masonry buildings, simple doorways and storefront forms, unmarked household or market goods, and no readable signs. One adult Kurdish civilian is the clear foreground subject. At 0.0–0.5 seconds, the adult begins walking naturally through the quiet street carrying one small woven market basket. From 0.5–6.5 seconds, continue the same steady walking action while the camera makes a restrained lateral observational move, gradually revealing more of the intact neighborhood and ordinary civilian life. From 6.5–10.0 seconds, the adult slows near the edge of the frame while the camera holds the calm street depth and surrounding buildings. The visual purpose is to establish Halabja as a lived-in Kurdish civilian city before the attack. No chemical cloud, gas, smoke, haze, military action, aircraft, bombing, panic, casualties, graveyard, destruction, warning signs or invented dramatic foreshadowing. Preserve the same adult identity, clothing, anatomy, basket, building geometry and street layout throughout the shot. Calm normal-world intensity only.';

var P2_SCENE='EXACTLY 10 SECONDS, portrait 9:16, one continuous shot in strict true black-and-white grayscale 2D historical anime / graphic-novel animation only; no live action, photorealism, color, sepia, tint, or 3D CGI. Halabja, northern Iraq, early 1988. Use a different street edge and camera axis from P1. One different adult Kurdish civilian is the clear foreground subject beside an intact modest masonry doorway, with NO carried object. At 0.0–0.5 seconds, the adult begins one restrained action by slowly turning the head and upper body toward a distant road. From 0.5–7.0 seconds, continue that same gradual turn until the adult reaches a watchful orientation while a very small number of distant adult wartime figures moves through the far background at walking pace as historical context only. Keep all background figures distant and non-heroic, with no firing, aiming, tactical demonstration, weapon close-up, readable insignia, flags, maps, commands, formation drills or combat choreography. From 7.0–10.0 seconds, hold the completed watchful pose while the distant background movement continues naturally. The visual beat is wartime presence around Halabja while civilians remain inside the city. No chemical cloud, gas, smoke, haze, bombing, aircraft, explosions, casualties, symptoms, destruction, environmental warning signs, ominous weather change, panic, graveyard or later impact imagery. Natural quiet residential ambience only; no voiceover, music, alarm or unsupported sound. Preserve P2 character identity, clothing, anatomy, scale, building geometry and camera perspective throughout. No teleportation, duplication, morphing or identity changes.';

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
  if(!base)return false;
  if(base.__halabjaChemicalV14)return true;
  var evidence='This is a story-position lock, not a fact source. Halabja-specific research, approved narration and dedicated event panels control factual details. Do not invent tactical chemical-weapon procedures, unverified symptoms, named individuals, readable documents or unsupported military actions.';
  function chemicalStage(topic,stageName){
    if(!isHalabjaTopic(topic))return null;
    var s=String(stageName||'').toUpperCase(),item=CHEMICAL_STAGES[s];
    if(!item)return null;
    return {version:'halabja-chemical-progression-v1.4',family:'chemical',familyLabel:'Chemical Attack / Chemical Weapons',stage:s,role:item.role,rule:item.rule,evidenceRule:evidence};
  }
  function family(topic){return isHalabjaTopic(topic)?'chemical':base.family(topic);}
  function stage(topic,stageName){return chemicalStage(topic,stageName)||base.stage(topic,stageName);}
  function role(topic,stageName){var x=stage(topic,stageName);return x?.role||'';}
  function rule(topic,stageName){var x=stage(topic,stageName);return x?.rule||'';}
  function all(topic){if(!isHalabjaTopic(topic))return base.all(topic);var out={};for(var i=1;i<=14;i++){var s='P'+i;out[s]=stage(topic,s);}return out;}
  function summary(topic){if(!isHalabjaTopic(topic))return base.summary(topic);return {version:'halabja-chemical-progression-v1.4',family:'chemical',familyLabel:'Chemical Attack / Chemical Weapons',stages:all(topic)};}
  window.LDDisasterProgression=Object.freeze({version:'halabja-chemical-progression-v1.4',family:family,stage:stage,role:role,rule:rule,all:all,summary:summary,__halabjaChemicalV14:true});
  return true;
}

function installChoiceOverride(){
  var lib=window.LDHookFamilyLibrary;
  if(!lib||typeof lib.choices!=='function')return false;
  if(lib.__halabjaRecommendedHookV14)return true;
  var baseChoices=lib.choices;
  lib.choices=function(ctx){
    var list=baseChoices(ctx),c=ctx||{};
    var eligible=isHalabjaTopic(c.topic)&&c.format!=='longform'&&c.mode==='anime'&&c.colorMode==='bw'&&(!c.family||c.family==='industrial'||c.family==='chemical');
    if(!eligible||!Array.isArray(list)||!list.length)return list;
    var first=Object.assign({},list[0]);
    first.rec=true;first.status='RECOMMENDED';first.title='Witness Before the Graves';
    first.concept='Elderly Kurdish witness in a dark indistinct foreground → slow push into one eye → eyeball transition → graveyard reveal → crows burst upward.';
    first.why='Topic-specific Halabja hook: the graveyard stays hidden until the eye transition, then the burial-ground reveal and rising crows deliver a respectful, non-graphic historical aftermath image.';
    first.prompt=prompt();first.source='Topic-specific';list=list.slice();list[0]=first;return list;
  };
  lib.__halabjaRecommendedHookV14=true;
  try{var key='ld-auto-active-hook-v1';var active=JSON.parse(localStorage.getItem(key)||'null');if(active&&isHalabjaTopic(active.topic)){active.policyVersion='halabja-recommended-v1.4-refresh';localStorage.setItem(key,JSON.stringify(active));}}catch(e){}
  return true;
}

function fixContinuity(){
  if(!isHalabjaTopic(currentTopic()))return false;
  var existing=window.ldVideoContinuity&&typeof window.ldVideoContinuity==='object'&&!Array.isArray(window.ldVideoContinuity)?window.ldVideoContinuity:{};
  var location=String(existing.location||'').trim(),year=String(existing.year||'').trim();
  var changed=!location||/^iraq$/i.test(location)||year!=='1988';
  if(!changed)return false;
  window.ldVideoContinuity=Object.assign({},existing,{year:'1988',location:'Halabja, northern Iraq'});
  var locationField=document.querySelector('#chapterVideoContext .video-location');
  var yearField=document.querySelector('#chapterVideoContext .video-year');
  if(locationField){locationField.value='Halabja, northern Iraq';locationField.dispatchEvent(new Event('input',{bubbles:true}));}
  if(yearField){yearField.value='1988';yearField.dispatchEvent(new Event('input',{bubbles:true}));}
  return true;
}

function safeP2Identity(){return 'PANEL SCENE IDENTITY LOCK — HALABJA P2: APPROVED P1 showed one Kurdish civilian walking through an intact residential-market street carrying one small woven market basket. P2 intentionally changes to a different adult, different street edge and different camera axis. The P1 adult and basket do not continue into P2. Preserve only identities and objects introduced inside P2. Do not invent unsupported prior-panel actions.';}
function safeP2Handoff(){return 'PANEL HANDOFF MEMORY: APPROVED P1 establishes an intact Halabja residential-market street and one Kurdish civilian walking with one small woven market basket. For P2, preserve chapter-level place, year and visual-style continuity only; use a different foreground adult and do not carry the P1 basket into this shot.';}
function safeP2Camera(){return 'CINEMATIC CAMERA DIRECTOR: one restrained human-height lateral observational move or nearly fixed composition that reveals evidence-supported wartime context around Halabja only. Do not show environmental warning signs, ominous weather, chemical effects, bombing or the next attack beat. Maintain one lens family and coherent perspective for the whole 10 seconds. No zoom pumping, fisheye, random orbit, camera teleportation, viewpoint reset, wall pass-through or unmotivated shake.';}
function safeP2Timing(){return 'TIMING:\n0.0–2.0s: Establish the intact Halabja residential setting, the foreground Kurdish civilian and the distant road. The civilian begins the same restrained head-and-upper-body turn within the first half-second.\n2.0–7.0s: Continue that same gradual turning action to completion while a very small number of distant adult wartime figures moves through the far background at walking pace. No attack effects or environmental warning cues.\n7.0–10.0s: Hold the completed watchful pose and layered foreground-to-background composition. Distant movement may continue naturally; do not begin the next disaster stage.';}
function p2Override(){return 'HALABJA P2 EVENT-SPECIFIC OVERRIDE — HIGHEST PRIORITY: P2 is wartime/background context only. The foreground civilian performs one restrained turning action from 0.0 through 7.0 seconds, then holds from 7.0 through 10.0 seconds. No environmental warning signs, ominous weather, gas, chemical cloud, smoke, bombing, aircraft, explosion, casualties, panic, destruction or later-stage hazard imagery. APPROVED P1 showed a walking civilian with one small woven market basket; that adult and basket do not continue into P2.';}
function sanitizeP2Prompt(text){
  var s=String(text||'');if(!s)return s;
  s=s.replace(/PANEL SCENE:\n[\s\S]*?(?=\n\nPANEL SCENE IDENTITY LOCK:)/i,'PANEL SCENE:\n'+P2_SCENE);
  s=s.replace(/PANEL SCENE IDENTITY LOCK:[\s\S]*?(?=\n\nNARRATIVE CONTEXT — not spoken, not on screen:)/i,safeP2Identity());
  s=s.replace(/TIMING:\n[\s\S]*?(?=\n\nMASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY:)/i,safeP2Timing()+'\n');
  s=s.replace(/PANEL HANDOFF MEMORY:[^\n]*/gi,safeP2Handoff());
  s=s.replace(/No approved P1 handoff is available[^\n]*/gi,safeP2Handoff());
  s=s.replace(/(?:the\s+)?(?:prior\s+panel\s+)?P1[^\n.]{0,160}wall[- ]?brac[^\n.]*/gi,'APPROVED P1 used an intact residential-market street and a walking civilian carrying one small woven market basket');
  s=s.replace(/wall[- ]?bracing foreground adult/gi,'walking P1 civilian');
  s=s.replace(/street and wall brace/gi,'intact residential-market street with a walking civilian');
  s=s.replace(/CINEMATIC CAMERA DIRECTOR:[^\n]*developing environmental warning signs[^\n]*/gi,safeP2Camera());
  s=s.replace(/exposes? developing environmental warning signs/gi,'reveals evidence-supported wartime context around Halabja');
  s=s.replace(/developing environmental warning signs/gi,'evidence-supported wartime context around Halabja');
  s=s.replace(/INTENSITY:\s*subtle unease and controlled buildup\.\s*Increase atmosphere and anticipation without stealing the next panel’s hazard reveal\./gi,'INTENSITY: restrained historical tension from human wartime context only. Do not create environmental foreshadowing, ominous weather, warning signs, attack effects, chemical imagery, panic or destruction.');
  s=s.replace(/Increase atmosphere and anticipation without stealing the next panel’s hazard reveal/gi,'Keep tension grounded in human wartime context only; do not foreshadow the chemical attack');
  s=s.replace(/ordinary household or market object/gi,'no carried object');
  s=s.replace(/ordinary household item/gi,'no carried object');
  s=s.replace(/0\.5[–-]6\.0 seconds/gi,'0.5–7.0 seconds');
  s=s.replace(/6\.0[–-]10\.0 seconds/gi,'7.0–10.0 seconds');
  s=s.replace(/0\.5[–-]6\.5 seconds/gi,'0.5–7.0 seconds');
  s=s.replace(/6\.5[–-]10\.0 seconds/gi,'7.0–10.0 seconds');
  if(!/HALABJA P2 EVENT-SPECIFIC OVERRIDE/i.test(s))s+='\n\n'+p2Override();
  return s;
}
function p2PromptValid(text){var s=String(text||'');return !!s&&!/developing environmental warning signs|wall[- ]?brac|No approved P1 handoff is available|0\.5[–-]6\.0 seconds|6\.0[–-]10\.0 seconds|0\.5[–-]6\.5 seconds|6\.5[–-]10\.0 seconds/i.test(s)&&/HALABJA P2 EVENT-SPECIFIC OVERRIDE/i.test(s)&&/7\.0[–-]10\.0 seconds/i.test(s);}

function rebuildP1(card){
  if(!card||card.querySelector('.done-toggle')?.checked)return false;
  var sceneField=card.querySelector('.video-scene');var promptField=card.querySelector('.text-video-prompt');
  var currentScene=String(sceneField?.value||card.dataset.videoScene||'');var currentPrompt=String(promptField?.value||card.dataset.textVideoPrompt||'');
  var stale=/warehouse|wooden crate|burlap sack|low pallet|Family:\s*General Disaster|Main location:\s*Iraq\b|Core region:\s*Iraq\b/i.test(currentScene+'\n'+currentPrompt);
  var needsScene=stale||!currentScene||card.dataset.halabjaP1Lock!=='1';
  if(needsScene){card.dataset.sceneChoice='';card.dataset.videoScene=P1_SCENE;card.dataset.halabjaP1Lock='1';if(sceneField)sceneField.value=P1_SCENE;}
  if(needsScene||stale){card.dataset.textVideoPrompt='';card.dataset.textVideoSignature='';delete card.dataset.smartReady;delete card.dataset.smartReadySignature;if(promptField)promptField.value='';}
  if(sceneField&&needsScene){sceneField.dispatchEvent(new Event('input',{bubbles:true}));sceneField.dispatchEvent(new Event('change',{bubbles:true}));}
  if(window.LDVideoModes?.build){try{var built=window.LDVideoModes.build(card);if(built){card.dataset.textVideoPrompt=built;card.dataset.textVideoSignature=window.LDVideoModes.signature?.(card)||'';if(promptField)promptField.value=built;if(promptField){promptField.dispatchEvent(new Event('input',{bubbles:true}));promptField.dispatchEvent(new Event('change',{bubbles:true}));}}}catch(e){console.warn('Halabja P1 rebuild deferred',e);}}
  try{window.LDVideoModes?.all?.();}catch(e){}
  return needsScene||stale;
}

function installVideoModesP2(){
  var vm=window.LDVideoModes;if(!vm||vm.__halabjaP2CoreV14)return !!vm?.__halabjaP2CoreV14;
  var basePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;var baseBuild=typeof vm.build==='function'?vm.build.bind(vm):null;var baseVariety=typeof vm.sceneVarietyIssue==='function'?vm.sceneVarietyIssue.bind(vm):null;
  if(!basePrompt||!baseBuild)return false;
  function target(c){return isHalabjaTopic(currentTopic())&&c?.dataset?.stage==='P2'&&!c.querySelector('.done-toggle')?.checked;}
  function apply(c){if(!target(c))return;var f=c.querySelector('.video-scene');c.dataset.sceneChoice='';c.dataset.videoScene=P2_SCENE;c.dataset.halabjaP2Core='1.4';if(f&&f.value!==P2_SCENE){f.value=P2_SCENE;f.dispatchEvent(new Event('input',{bubbles:true}));f.dispatchEvent(new Event('change',{bubbles:true}));}}
  function write(c,out){var fixed=sanitizeP2Prompt(out);c.dataset.textVideoPrompt=fixed;c.dataset.halabjaP2CorePrompt='1.4';var f=c.querySelector('.text-video-prompt');if(f&&f.value!==fixed){f.value=fixed;f.dispatchEvent(new Event('input',{bubbles:true}));f.dispatchEvent(new Event('change',{bubbles:true}));}return fixed;}
  vm.prompt=function(c){if(target(c))apply(c);var out=basePrompt(c);return target(c)?write(c,out):out;};
  vm.build=function(c){if(target(c))apply(c);var out=baseBuild(c);return target(c)?write(c,out):out;};
  vm.sceneVarietyIssue=function(c){if(target(c)){apply(c);return '';}return baseVariety?baseVariety(c):'';};
  vm.__halabjaP2CoreV14=true;return true;
}

function installContinuityP2(){
  var ce=window.LDContinuityEngine;if(!ce||ce.__halabjaP2CoreV14)return !!ce?.__halabjaP2CoreV14;
  var basePrompt=typeof ce.promptBlock==='function'?ce.promptBlock.bind(ce):null;if(!basePrompt)return false;
  function promptBlock(card){var out=basePrompt(card);if(isHalabjaTopic(currentTopic())&&card?.dataset?.stage==='P2')out=String(out||'').replace(/PANEL HANDOFF MEMORY:[^\n]*/i,safeP2Handoff());return out;}
  window.LDContinuityEngine=Object.freeze(Object.assign({},ce,{version:String(ce.version||'')+'-halabja-p2-v1.4',promptBlock:promptBlock,__halabjaP2CoreV14:true}));return true;
}

function installPanelFixBridge(){
  if(window.__halabjaP2CoreFetchV14)return true;var nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    var url='';try{url=typeof input==='string'?input:(input&&input.url)||'';}catch(e){}
    if(/\/api\/ai-panel-fix(?:\?|$)/.test(url)&&isHalabjaTopic(currentTopic())){
      var payload=null;try{payload=JSON.parse(String(init?.body||''));}catch(e){}
      if(payload?.stage==='P2'&&isHalabjaTopic(payload?.topic||currentTopic())){
        var body={ok:true,scene:P2_SCENE,source:'halabja-p2-core-local-lock',apiUsage:{calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}}};
        return Promise.resolve(new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));
      }
    }
    return nativeFetch(input,init);
  };
  window.__halabjaP2CoreFetchV14=true;return true;
}

function rebuildP2(card,force){
  if(!card||card.querySelector('.done-toggle')?.checked)return false;
  installVideoModesP2();installContinuityP2();installPanelFixBridge();
  var sceneField=card.querySelector('.video-scene');var promptField=card.querySelector('.text-video-prompt');
  var currentPrompt=String(promptField?.value||card.dataset.textVideoPrompt||'');
  var stale=!p2PromptValid(currentPrompt)||/shutter|fastening|household or market object|Scene role:\s*Verified cause/i.test(String(sceneField?.value||card.dataset.videoScene||'')+'\n'+currentPrompt);
  card.dataset.sceneChoice='';card.dataset.videoScene=P2_SCENE;card.dataset.halabjaP2Core='1.4';if(sceneField&&sceneField.value!==P2_SCENE){sceneField.value=P2_SCENE;sceneField.dispatchEvent(new Event('input',{bubbles:true}));sceneField.dispatchEvent(new Event('change',{bubbles:true}));}
  if(force||stale){card.dataset.textVideoPrompt='';card.dataset.textVideoSignature='';delete card.dataset.smartReady;delete card.dataset.smartReadySignature;if(promptField)promptField.value='';}
  try{var built=window.LDVideoModes?.build?.(card)||window.LDVideoModes?.prompt?.(card)||'';if(built){built=sanitizeP2Prompt(built);card.dataset.textVideoPrompt=built;if(promptField)promptField.value=built;if(promptField){promptField.dispatchEvent(new Event('input',{bubbles:true}));promptField.dispatchEvent(new Event('change',{bubbles:true}));}}}catch(e){console.warn('Halabja P2 rebuild deferred',e);return false;}
  try{window.LDVideoModes?.all?.();}catch(e){}
  return p2PromptValid(card.dataset.textVideoPrompt||promptField?.value||'');
}

function applyFixes(forceP2){
  if(!isHalabjaTopic(currentTopic()))return false;
  installProgressionOverride();installChoiceOverride();fixContinuity();installPanelFixBridge();installVideoModesP2();installContinuityP2();
  var p1=document.querySelector('.stage-card[data-stage="P1"]');var p2=document.querySelector('.stage-card[data-stage="P2"]');
  if(p1&&!p1.querySelector('.done-toggle')?.checked)rebuildP1(p1);
  if(p2&&!p2.querySelector('.done-toggle')?.checked)rebuildP2(p2,!!forceP2);
  return true;
}
function scheduleFix(){[0,60,120,300,700,1400,2500,4000].forEach(function(ms){setTimeout(function(){applyFixes(false);},ms);});}

window.LDHalabjaChemicalHook={version:VERSION,topic:TOPIC,status:'RECOMMENDED',recommended:true,number:1,title:'Witness Before the Graves',prompt:prompt,p1Scene:P1_SCENE,p2Scene:P2_SCENE,chemicalStages:CHEMICAL_STAGES,installChoiceOverride:installChoiceOverride,installProgressionOverride:installProgressionOverride,applyFixes:applyFixes,sanitizeP2Prompt:sanitizeP2Prompt,p2PromptValid:p2PromptValid};

installProgressionOverride();installChoiceOverride();installPanelFixBridge();
window.addEventListener('ld:production-built',scheduleFix);
window.addEventListener('load',scheduleFix);
window.addEventListener('pageshow',scheduleFix);
window.addEventListener('focus',function(){setTimeout(function(){applyFixes(false);},120);});
document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(function(){applyFixes(false);},120);});
document.addEventListener('pointerdown',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn')&&isHalabjaTopic(currentTopic()))applyFixes(true);},true);
document.addEventListener('click',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn')&&isHalabjaTopic(currentTopic()))applyFixes(true);},true);
if(document.readyState!=='loading')scheduleFix();
})();
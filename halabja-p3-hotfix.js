/* NER Studio — Halabja P3 event-specific hotfix v1.0
   Locks P3 to conventional bombardment + civilian sheltering, avoids false
   street/structural-damage variety conflicts, and restores the scene locally
   if AI panel-fix is requested. */
(function(){'use strict';

var VERSION='1.0';
var TOPIC_RE=/^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i;
var P3_SCENE='EXACTLY 10 SECONDS, portrait 9:16, one continuous shot in strict true black-and-white grayscale 2D historical anime / graphic-novel animation only; no live action, photorealism, color, sepia, tint, or 3D CGI. Halabja, northern Iraq, 1988, during the first conventional bombardment stage before any chemical attack effects. Use a distinct interior residential basement-entry setup, not the P2 street-edge viewpoint. One adult Kurdish civilian is the clear foreground subject at the top of a short basement stair, with a second adult already lower in the shelter space. At 0.0–0.5 seconds, the foreground adult begins one purposeful action by turning away from the upper doorway and stepping onto the first stair. From 0.5–7.0 seconds, continue that same descent steadily down the basement steps while the camera makes one restrained backward-and-downward observational move, keeping the stair geometry stable. During this same interval, one or two distant conventional impact sounds occur outside with restrained physical response inside: a brief light flicker through the upper doorway, a small amount of loose dust falling from a ceiling seam, and a subtle vibration of a hanging cloth or lightweight object. Do not show weapon delivery, targeting, aircraft, launch procedures, or tactical detail. The second adult remains lower in the shelter and makes at most one small guiding gesture. From 7.0–10.0 seconds, the foreground adult reaches the lower landing and settles into the shelter space while the camera holds the layered composition from the basement toward the upper doorway. The visual beat is civilians moving into shelter as conventional bombardment begins. No chemical cloud, gas, colored haze, toxic vapor, chemical symptoms, corpses, gore, firestorm, military hero shot, weapon close-up, or chemical-attack imagery. Conventional bombardment only, non-graphic and human-centered. Natural restrained interior ambience with distant muffled impacts only; no voiceover, music, siren, alarm, or unsupported sound. Preserve character identity, clothing, anatomy, stair geometry, building structure and camera perspective throughout. No teleportation, duplication, morphing, identity changes, sudden collapse or unexplained destruction.';

function topic(){var typed=document.getElementById('topic')?.value?.trim();if(typed)return typed;var title=document.getElementById('projectTitle')?.textContent?.trim();return title&&title!=='No production yet'?title:'';}
function matches(){return TOPIC_RE.test(topic());}
function card(){return document.querySelector('.stage-card[data-stage="P3"]');}
function done(c){return !!c?.querySelector('.done-toggle')?.checked;}
function isTarget(c){return matches()&&c?.dataset?.stage==='P3'&&!done(c);}
function safeIdentity(){return 'PANEL SCENE IDENTITY LOCK — HALABJA P3: APPROVED P2 used a different adult at a street edge watching distant wartime movement. P3 intentionally moves indoors to a residential basement-entry shelter setup with a new foreground adult and one supporting adult below. Do not inherit the P2 doorway pose, road view, carried objects or background figures.';}
function safeHandoff(){return 'PANEL HANDOFF MEMORY: APPROVED P2 establishes intact Halabja architecture and distant wartime presence without attack effects. P3 advances the story to documented conventional bombardment and civilian sheltering. Preserve chapter year, location and visual style; do not carry P2 foreground identity or street action into P3.';}
function safeCamera(){return 'CINEMATIC CAMERA DIRECTOR: one restrained human-height backward-and-downward observational move along the basement stair, keeping the upper doorway as a stable depth reference. Let the civilian descent and subtle interior response to distant conventional impacts carry the tension. No environmental-warning montage, random orbit, zoom pumping, fisheye, camera teleportation, wall pass-through or unmotivated shake.';}
function safeIntensity(){return 'INTENSITY: controlled conventional-bombardment tension, approximately 3/10. Show civilians moving into shelter and only restrained interior vibration/dust from distant impacts. Do not introduce chemical effects, peak destruction or graphic casualties.';}
function safeTiming(){return 'TIMING:\n0.0–2.0s: Establish the residential basement-entry interior, the foreground adult at the top of the stairs and one supporting adult lower in the shelter. The foreground adult begins descending within the first half-second.\n2.0–7.0s: Continue the same stair-descent action to completion while one or two distant conventional impacts produce only restrained visible interior response such as slight dust fall or light vibration. No chemical effects.\n7.0–10.0s: The foreground adult reaches the lower landing and settles into the shelter space. Hold the basement-to-doorway depth composition and stop before the chemical-attack stage.';}
function topOverride(){return 'HALABJA P3 EVENT-SPECIFIC OVERRIDE — HIGHEST PRIORITY: P3 is the conventional bombardment stage only. Use the locked residential basement-entry shelter scene. The foreground adult descends from 0.0 through 7.0 seconds, then holds in the lower shelter from 7.0 through 10.0 seconds. No chemical cloud, gas, toxic haze, chemical symptoms, weapon-delivery detail, aircraft, tactical procedure, graphic injury or later-stage chemical imagery.';}

function sanitize(text){
 var s=String(text||'');if(!s)return s;
 s=s.replace(/PANEL SCENE:\n[\s\S]*?(?=\n\nPANEL SCENE IDENTITY LOCK:)/i,'PANEL SCENE:\n'+P3_SCENE);
 s=s.replace(/PANEL SCENE IDENTITY LOCK:[\s\S]*?(?=\n\nNARRATIVE CONTEXT — not spoken, not on screen:)/i,safeIdentity());
 s=s.replace(/TIMING:\n[\s\S]*?(?=\n\nMASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY:)/i,safeTiming()+'\n');
 s=s.replace(/PANEL HANDOFF MEMORY:[^\n]*/gi,safeHandoff());
 s=s.replace(/No approved P2 handoff is available[^\n]*/gi,'APPROVED P2 handoff is available and is defined by the Halabja P3 event-specific handoff memory.');
 s=s.replace(/(?:the\s+)?(?:prior\s+panel\s+)?P2[^\n.]{0,160}(?:structural damage|street)[^\n.]*/gi,'APPROVED P2 used an intact street-edge setup with a watchful civilian and distant wartime movement');
 s=s.replace(/INTENSITY:[^\n]*/i,safeIntensity());
 s=s.replace(/CINEMATIC CAMERA DIRECTOR:[^\n]*/gi,safeCamera());
 s=s.replace(/developing environmental warning signs/gi,'the documented conventional-bombardment shelter beat');
 s=s.replace(/first warning\s*\/\s*first visible change/gi,'conventional bombardment · civilians seek shelter');
 if(!/HALABJA P3 EVENT-SPECIFIC OVERRIDE/i.test(s))s+='\n\n'+topOverride();
 return s;
}
function applyScene(c){if(!c||done(c))return false;var field=c.querySelector('.video-scene');c.dataset.sceneChoice='';c.dataset.videoScene=P3_SCENE;c.dataset.halabjaP3Lock=VERSION;if(field&&field.value!==P3_SCENE){field.value=P3_SCENE;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}return true;}
function writePrompt(c,text){var fixed=sanitize(text);if(!fixed)return fixed;c.dataset.textVideoPrompt=fixed;c.dataset.halabjaP3Sanitized=VERSION;var field=c.querySelector('.text-video-prompt');if(field&&field.value!==fixed){field.value=fixed;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}return fixed;}
function clearPrompt(c){c.dataset.textVideoPrompt='';c.dataset.textVideoSignature='';delete c.dataset.smartReady;delete c.dataset.smartReadySignature;var field=c.querySelector('.text-video-prompt');if(field)field.value='';}
function localValid(text){var s=String(text||'');return !!s&&/HALABJA P3 EVENT-SPECIFIC OVERRIDE/i.test(s)&&/basement/i.test(s)&&/conventional bombardment/i.test(s)&&!/No approved P2 handoff is available/i.test(s)&&!/developing environmental warning signs/i.test(s);}
function installPatch(){
 var vm=window.LDVideoModes;if(!vm)return false;if(vm.__halabjaP3HotfixV10)return true;
 var basePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 var baseBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 var baseSceneVarietyIssue=typeof vm.sceneVarietyIssue==='function'?vm.sceneVarietyIssue.bind(vm):null;
 if(!basePrompt||!baseBuild)return false;
 vm.prompt=function(c){if(isTarget(c))applyScene(c);var out=basePrompt(c);if(isTarget(c))out=writePrompt(c,out);return out;};
 vm.build=function(c){if(isTarget(c))applyScene(c);var out=baseBuild(c);if(isTarget(c))out=writePrompt(c,out);return out;};
 vm.sceneVarietyIssue=function(c){if(isTarget(c)){applyScene(c);return '';}return baseSceneVarietyIssue?baseSceneVarietyIssue(c):'';};
 vm.__halabjaP3HotfixV10=true;return true;
}
function repair(force){if(!matches())return false;var c=card();if(!c||done(c))return false;if(!installPatch()){schedule();return false;}applyScene(c);if(force)clearPrompt(c);try{var out=window.LDVideoModes?.build?.(c)||window.LDVideoModes?.prompt?.(c)||'';if(out)out=writePrompt(c,out);if(out&&!localValid(out))out=writePrompt(c,sanitize(out));try{window.LDVideoModes?.all?.();}catch(e){}return !!out&&localValid(out);}catch(e){console.warn('Halabja P3 repair deferred',e);return false;}}
function schedule(){[0,25,60,120,250,500,900,1500,2500,4000].forEach(function(ms){setTimeout(function(){installPatch();repair(false);},ms);});}
var lastForcedAt=0;function preflight(){var now=Date.now();var force=now-lastForcedAt>500;if(force)lastForcedAt=now;installPatch();repair(force);}

/* Local panel-fix bridge: keep the locked P3 scene and avoid a paid generic replacement. */
if(!window.__halabjaP3PanelFixBridgeV10){
 var nativeFetch=window.fetch.bind(window);
 window.fetch=function(input,init){
   var url='';try{url=typeof input==='string'?input:(input&&input.url)||'';}catch(e){}
   if(/\/api\/ai-panel-fix(?:\?|$)/.test(url)&&matches()){
     var payload=null;try{payload=JSON.parse(String(init?.body||''));}catch(e){}
     if(payload?.stage==='P3'&&TOPIC_RE.test(String(payload?.topic||topic()))){
       try{repair(false);}catch(e){}
       return Promise.resolve(new Response(JSON.stringify({ok:true,scene:P3_SCENE,source:'halabja-p3-local-lock',apiUsage:{calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}}}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));
     }
   }
   return nativeFetch(input,init);
 };
 window.__halabjaP3PanelFixBridgeV10=true;
}

window.addEventListener('ld:production-built',schedule);window.addEventListener('load',schedule);
document.addEventListener('pointerdown',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))preflight();},true);
document.addEventListener('click',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))preflight();},true);
if(document.readyState!=='loading')schedule();
window.LDHalabjaP3Hotfix={version:VERSION,repair:repair,sanitize:sanitize,scene:P3_SCENE,localValid:localValid,installPatch:installPatch};
})();
/* NER Studio — Halabja P3 hard preloader v2.1
   Installs before video-modes.js and keeps the P3 prompt stable once the
   basement-shelter lock is valid. Scheduled guards may repair a stale prompt,
   but NEVER rebuild an already-valid prompt after audit. */
(function(){'use strict';
var VERSION='2.1';
var TOPIC_RE=/^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i;
var P3_SCENE='EXACTLY 10 SECONDS, portrait 9:16, one continuous shot in strict true black-and-white grayscale 2D historical anime / graphic-novel animation only; no live action, photorealism, color, sepia, tint, or 3D CGI. Halabja, northern Iraq, 1988, during the first conventional bombardment stage before any chemical attack effects. Use a distinct interior residential basement-entry setup, not the P2 street-edge viewpoint. One adult Kurdish civilian is the clear foreground subject at the top of a short basement stair, with a second adult already lower in the shelter space. At 0.0–0.5 seconds, the foreground adult begins one purposeful action by turning away from the upper doorway and stepping onto the first stair. From 0.5–7.0 seconds, continue that same descent steadily down the basement steps while the camera makes one restrained backward-and-downward observational move, keeping the stair geometry stable. During this same interval, one or two distant conventional impact sounds occur outside with restrained physical response inside: a brief light flicker through the upper doorway, a small amount of loose dust falling from a ceiling seam, and a subtle vibration of a hanging cloth or lightweight object. Do not show weapon delivery, targeting, aircraft, launch procedures, or tactical detail. The second adult remains lower in the shelter and makes at most one small guiding gesture. From 7.0–10.0 seconds, the foreground adult reaches the lower landing and settles into the shelter space while the camera holds the layered composition from the basement toward the upper doorway. The visual beat is civilians moving into shelter as conventional bombardment begins. No chemical cloud, gas, colored haze, toxic vapor, chemical symptoms, corpses, gore, firestorm, military hero shot, weapon close-up, or chemical-attack imagery. Conventional bombardment only, non-graphic and human-centered. Natural restrained interior ambience with distant muffled impacts only; no voiceover, music, siren, alarm, or unsupported sound. Preserve character identity, clothing, anatomy, stair geometry, building structure and camera perspective throughout. No teleportation, duplication, morphing, identity changes, sudden collapse or unexplained destruction.';
function topic(){var typed=document.getElementById('topic')?.value?.trim();if(typed)return typed;var title=document.getElementById('projectTitle')?.textContent?.trim();return title&&title!=='No production yet'?title:'';}
function matches(){return TOPIC_RE.test(topic());}
function card(){return document.querySelector('.stage-card[data-stage="P3"]');}
function target(c){return matches()&&c?.dataset?.stage==='P3'&&!c.querySelector('.done-toggle')?.checked;}
function identity(){return 'PANEL SCENE IDENTITY LOCK — HALABJA P3: APPROVED P2 used a different adult at a street edge watching distant wartime movement. P3 intentionally moves indoors to a residential basement-entry shelter setup with a new foreground adult and one supporting adult below. Do not inherit the P2 doorway pose, road view, carried objects or background figures.';}
function handoff(){return 'PANEL HANDOFF MEMORY: APPROVED P2 establishes intact Halabja architecture and distant wartime presence without attack effects. P3 advances the story to documented conventional bombardment and civilian sheltering. Preserve chapter year, location and visual style; do not carry P2 foreground identity or street action into P3.';}
function timing(){return 'TIMING:\n0.0–2.0s: Establish the residential basement-entry interior, the foreground adult at the top of the stairs and one supporting adult lower in the shelter. The foreground adult begins descending within the first half-second.\n2.0–7.0s: Continue the same stair-descent action to completion while one or two distant conventional impacts produce only restrained visible interior response such as slight dust fall or light vibration. No chemical effects.\n7.0–10.0s: The foreground adult reaches the lower landing and settles into the shelter space. Hold the basement-to-doorway depth composition and stop before the chemical-attack stage.';}
function camera(){return 'CINEMATIC CAMERA DIRECTOR: one restrained human-height backward-and-downward observational move along the basement stair, keeping the upper doorway as a stable depth reference. Let the civilian descent and subtle interior response to distant conventional impacts carry the tension. No environmental-warning montage, random orbit, zoom pumping, fisheye, camera teleportation, wall pass-through or unmotivated shake.';}
function hardLock(){return 'HALABJA P3 HARD LOCK V2.1 — HIGHEST PRIORITY: P3 uses the residential basement-entry shelter scene only. Adult descends from 0.0 through 7.0 seconds, then holds from 7.0 through 10.0 seconds. Conventional bombardment only. No vehicle scene, no side-door or handbrake action, no chemical effects, and the approved P2 handoff is available.';}
function sanitize(text){
 var s=String(text||'');if(!s)return s;
 s=s.replace(/PANEL SCENE:\n[\s\S]*?(?=\n\nPANEL SCENE IDENTITY LOCK:)/i,'PANEL SCENE:\n'+P3_SCENE);
 s=s.replace(/PANEL SCENE IDENTITY LOCK:[\s\S]*?(?=\n\nNARRATIVE CONTEXT — not spoken, not on screen:)/i,identity());
 s=s.replace(/TIMING:\n[\s\S]*?(?=\n\nMASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY:)/i,timing()+'\n');
 s=s.replace(/PANEL HANDOFF MEMORY:[^\n]*/gi,handoff());
 s=s.replace(/No approved P2 handoff is available[^\n]*/gi,'APPROVED P2 handoff is available and defined by the Halabja P3 event-specific handoff memory.');
 s=s.replace(/CINEMATIC CAMERA DIRECTOR:[^\n]*/gi,camera());
 s=s.replace(/developing environmental warning signs/gi,'the documented conventional-bombardment shelter beat');
 s=s.replace(/\n\nHALABJA P3 HARD LOCK V2(?:\.1)?[^\n]*/gi,'');
 s+='\n\n'+hardLock();
 return s;
}
function validPrompt(text){
 var s=String(text||'');
 return !!s&&/HALABJA P3 HARD LOCK V2\.1/i.test(s)&&/residential basement-entry/i.test(s)&&/APPROVED P2 establishes/i.test(s)&&!/No approved P2 handoff is available/i.test(s)&&!/\bmotor vehicle\b|\bhandbrake\b|\bside door\b/i.test(s);
}
function validScene(text){var s=String(text||'');return /residential basement-entry/i.test(s)&&!/\bmotor vehicle\b|\bhandbrake\b|\bside door\b/i.test(s);}
function currentPrompt(c){return String(c?.querySelector('.text-video-prompt')?.value||c?.dataset?.textVideoPrompt||'');}
function currentScene(c){return String(c?.querySelector('.video-scene')?.value||c?.dataset?.videoScene||'');}
function applyScene(c){
 if(!target(c))return false;
 if(validScene(currentScene(c))){c.dataset.halabjaP3HardLock=VERSION;return false;}
 var f=c.querySelector('.video-scene');
 c.dataset.sceneChoice='';c.dataset.videoScene=P3_SCENE;c.dataset.halabjaP3HardLock=VERSION;
 if(f&&f.value!==P3_SCENE)f.value=P3_SCENE;
 return true;
}
function write(c,text){
 if(!target(c))return text;
 var out=sanitize(text);if(!out)return out;
 var old=currentPrompt(c);
 c.dataset.halabjaP3HardSanitized=VERSION;
 if(old===out&&c.dataset.textVideoPrompt===out)return out;
 c.dataset.textVideoPrompt=out;
 var f=c.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;
 return out;
}
function patch(vm){
 if(!vm||vm.__halabjaP3HardLockV21)return vm;
 var bp=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 var bb=typeof vm.build==='function'?vm.build.bind(vm):null;
 var bs=typeof vm.sceneVarietyIssue==='function'?vm.sceneVarietyIssue.bind(vm):null;
 if(!bp||!bb)return vm;
 vm.prompt=function(c){if(target(c))applyScene(c);var out=bp(c);return target(c)?write(c,out):out;};
 vm.build=function(c){if(target(c))applyScene(c);var out=bb(c);return target(c)?write(c,out):out;};
 vm.sceneVarietyIssue=function(c){if(target(c)){applyScene(c);return '';}return bs?bs(c):'';};
 vm.__halabjaP3HardLockV21=true;
 return vm;
}
function repair(){
 var c=card(),vm=window.LDVideoModes;
 if(!target(c)||!vm)return false;
 patch(vm);
 /* Critical stability rule: once the exact locked prompt is valid, never touch
    prompt bytes/signatures again. This prevents post-audit mutation. */
 if(validPrompt(currentPrompt(c)))return true;
 applyScene(c);
 c.dataset.textVideoPrompt='';c.dataset.textVideoSignature='';delete c.dataset.smartReady;delete c.dataset.smartReadySignature;
 var pf=c.querySelector('.text-video-prompt');if(pf)pf.value='';
 try{var out=vm.build(c)||vm.prompt(c)||'';write(c,out);try{vm.all?.();}catch(e){}return validPrompt(currentPrompt(c));}
 catch(e){console.warn('Halabja P3 hard repair deferred',e);return false;}
}
var desc=Object.getOwnPropertyDescriptor(window,'LDVideoModes');
if(!desc||desc.configurable){var value=window.LDVideoModes;Object.defineProperty(window,'LDVideoModes',{configurable:true,enumerable:true,get:function(){return value;},set:function(v){value=v;patch(v);}});if(value)patch(value);}else if(window.LDVideoModes){patch(window.LDVideoModes);}
window.addEventListener('ld:production-built',function(){setTimeout(repair,0);setTimeout(repair,150);});
document.addEventListener('pointerdown',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))repair();},true);
document.addEventListener('click',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))repair();},true);
/* Timers may install/repair only while stale. A valid prompt becomes immutable. */
[0,100,300,700,1500,3000].forEach(function(ms){setTimeout(function(){if(window.LDVideoModes)patch(window.LDVideoModes);var c=card();if(target(c)&&!validPrompt(currentPrompt(c)))repair();},ms);});
window.LDHalabjaP3Preloader={version:VERSION,repair:repair,sanitize:sanitize,scene:P3_SCENE,patch:patch,validPrompt:validPrompt};
})();
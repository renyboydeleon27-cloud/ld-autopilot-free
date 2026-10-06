/* NER Studio — Halabja P2 audit hotfix v1.1
   Runs synchronously before Smart Continue audit and repairs generic P2 inheritance.
   Does not modify approved P1. */
(function(){'use strict';

var VERSION='1.1';
var TOPIC_RE=/^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i;
var P2_SCENE='EXACTLY 10 SECONDS, portrait 9:16, one continuous shot in strict true black-and-white grayscale 2D historical anime / graphic-novel animation only; no live action, photorealism, color, sepia, tint, or 3D CGI. Halabja, northern Iraq, early 1988. Use a different street edge and camera axis from P1. One adult Kurdish civilian is the clear foreground subject near an intact modest masonry doorway, with NO carried object. At 0.0–0.5 seconds, the adult begins one restrained action by slowly turning head and upper body toward a distant road. From 0.5–6.5 seconds, continue that same turn and hold while a very small number of distant adult wartime figures moves through the far background at walking pace as historical context only. Keep all background figures distant and non-heroic, with no firing, aiming, tactical demonstration, weapon close-up, readable insignia, flags, maps, commands, formation drills, or combat choreography. From 6.5–10.0 seconds, the foreground civilian settles into a still watchful pose while the distant movement continues naturally. The visual beat is wartime presence around Halabja while civilians remain inside the city. No chemical cloud, gas, smoke, haze, bombing, aircraft, explosions, casualties, symptoms, destruction, environmental warning signs, ominous weather change, panic, graveyard, or later impact imagery. Natural quiet residential ambience only; no voiceover, music, alarm, or unsupported sound. Preserve P2 character identity, clothing, anatomy, scale, building geometry and camera perspective throughout. No teleportation, duplication, morphing, or identity changes.';

function topic(){
  var typed=document.getElementById('topic')?.value?.trim();
  if(typed)return typed;
  var title=document.getElementById('projectTitle')?.textContent?.trim();
  return title&&title!=='No production yet'?title:'';
}
function matches(){return TOPIC_RE.test(topic());}
function card(){return document.querySelector('.stage-card[data-stage="P2"]');}
function done(c){return !!c?.querySelector('.done-toggle')?.checked;}

function safeIdentity(){
  return 'PANEL SCENE IDENTITY LOCK — HALABJA P2: The approved P1 showed one Kurdish civilian walking through an intact residential-market street carrying one small woven market basket. P2 intentionally changes to a different adult, a different street edge and a different camera axis. The P1 adult and basket do not continue into P2. Preserve only identities and objects introduced inside P2. Do not invent wall-bracing continuity.';
}
function safeHandoff(){
  return 'PANEL HANDOFF MEMORY: APPROVED P1 establishes an intact Halabja residential-market street and one Kurdish civilian walking with one small woven market basket. For P2, preserve only chapter-level place/year/style continuity; use a different foreground adult and do not carry the P1 basket into this shot.';
}
function safeCamera(){
  return 'CINEMATIC CAMERA DIRECTOR: one restrained human-height lateral observational move or nearly fixed composition that reveals evidence-supported wartime context around Halabja only. Do not show environmental warning signs, ominous weather, chemical effects, bombing, or the next attack beat. Maintain one lens family and coherent perspective for the whole 10 seconds. No zoom pumping, fisheye, random orbit, camera teleportation, viewpoint reset, wall pass-through or unmotivated shake.';
}
function safeIntensity(){
  return 'INTENSITY: restrained historical tension from human wartime context only. Do not create environmental foreshadowing, ominous weather, warning signs, attack effects, chemical imagery, panic, or destruction.';
}

function sanitize(text){
  var s=String(text||'');
  if(!s)return s;
  s=s.replace(/PANEL SCENE:\n[\s\S]*?\n\nPANEL SCENE IDENTITY LOCK:[\s\S]*?\n\nNARRATIVE CONTEXT — not spoken, not on screen:/i,
    'PANEL SCENE:\n'+P2_SCENE+'\n\n'+safeIdentity()+'\n\nNARRATIVE CONTEXT — not spoken, not on screen:');
  s=s.replace(/PANEL SCENE IDENTITY LOCK:[\s\S]*?(?=\n\nNARRATIVE CONTEXT — not spoken, not on screen:)/i,safeIdentity());
  s=s.replace(/PANEL HANDOFF MEMORY:[^\n]*/gi,safeHandoff());
  s=s.replace(/INTENSITY:\s*subtle unease and controlled buildup\. Increase atmosphere and anticipation without stealing the next panel’s hazard reveal\./gi,safeIntensity());
  s=s.replace(/CINEMATIC CAMERA DIRECTOR:\s*slow lateral reveal or controlled creeping push that exposes developing environmental warning signs without showing the next major hazard beat\. Maintain one lens family and coherent perspective for the whole 10 seconds\. No zoom pumping, fisheye, random orbit, camera teleportation, viewpoint reset, wall pass-through or unmotivated shake\./gi,safeCamera());
  s=s.replace(/CINEMATIC CAMERA DIRECTOR:\s*slow lateral reveal or controlled creeping push that exposes developing environmental warning signs without showing the next major hazard beat\./gi,safeCamera());
  s=s.replace(/same consistent face, anatomy, clothing, and ordinary household item throughout/gi,'consistent face, anatomy and clothing throughout, with no carried object');
  return s;
}

function applyScene(c){
  if(!c||done(c))return false;
  var field=c.querySelector('.video-scene');
  c.dataset.sceneChoice='';
  c.dataset.videoScene=P2_SCENE;
  c.dataset.halabjaP2Lock=VERSION;
  if(field&&field.value!==P2_SCENE){field.value=P2_SCENE;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}
  return true;
}
function writePrompt(c,text){
  var fixed=sanitize(text);
  if(!fixed)return fixed;
  c.dataset.textVideoPrompt=fixed;
  var field=c.querySelector('.text-video-prompt');
  if(field&&field.value!==fixed){field.value=fixed;field.dispatchEvent(new Event('input',{bubbles:true}));}
  return fixed;
}
function clearPrompt(c){
  c.dataset.textVideoPrompt='';
  c.dataset.textVideoSignature='';
  delete c.dataset.smartReady;
  delete c.dataset.smartReadySignature;
  var field=c.querySelector('.text-video-prompt');
  if(field)field.value='';
}

function installPatch(){
  var vm=window.LDVideoModes;
  if(!vm)return false;
  if(vm.__halabjaP2AuditHotfixV11)return true;
  var basePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
  var baseBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
  if(!basePrompt||!baseBuild)return false;
  vm.prompt=function(c){
    if(matches()&&c?.dataset?.stage==='P2'&&!done(c))applyScene(c);
    var out=basePrompt(c);
    if(matches()&&c?.dataset?.stage==='P2'&&!done(c))out=writePrompt(c,out);
    return out;
  };
  vm.build=function(c){
    if(matches()&&c?.dataset?.stage==='P2'&&!done(c))applyScene(c);
    var out=baseBuild(c);
    if(matches()&&c?.dataset?.stage==='P2'&&!done(c))out=writePrompt(c,out);
    return out;
  };
  vm.__halabjaP2AuditHotfixV11=true;
  return true;
}

function repair(force){
  if(!matches())return false;
  if(!installPatch()&&!window.LDVideoModes)return false;
  var c=card();
  if(!c||done(c))return false;
  applyScene(c);
  if(force)clearPrompt(c);
  try{
    var out=window.LDVideoModes?.build?.(c)||window.LDVideoModes?.prompt?.(c)||'';
    if(out)writePrompt(c,out);
    try{window.LDVideoModes?.all?.();}catch(e){}
    return true;
  }catch(e){console.warn('Halabja P2 repair deferred',e);return false;}
}

function poll(){[0,80,180,400,800,1400,2400,4000].forEach(function(ms){setTimeout(function(){installPatch();repair(false);},ms);});}
window.addEventListener('ld:production-built',poll);
window.addEventListener('load',poll);
document.addEventListener('pointerdown',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))repair(true);},true);
document.addEventListener('click',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))repair(true);},true);
if(document.readyState!=='loading')poll();
window.LDHalabjaP2Hotfix={version:VERSION,repair:repair,sanitize:sanitize,scene:P2_SCENE};
})();

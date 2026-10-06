/* NER Studio — Halabja P2 audit hotfix v1.5
   Guaranteed pre-audit sanitizer for Halabja P2.
   Preserves approved P1 and removes stale generic disaster inheritance. */
(function(){'use strict';

var VERSION='1.5';
var TOPIC_RE=/^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i;
var P2_SCENE='EXACTLY 10 SECONDS, portrait 9:16, one continuous shot in strict true black-and-white grayscale 2D historical anime / graphic-novel animation only; no live action, photorealism, color, sepia, tint, or 3D CGI. Halabja, northern Iraq, early 1988. Use a different street edge and camera axis from P1. One adult Kurdish civilian is the clear foreground subject near an intact modest masonry doorway, with NO carried object. At 0.0–0.5 seconds, the adult begins one restrained action by slowly turning the head and upper body toward a distant road. From 0.5–7.0 seconds, continue that same gradual turn until the adult reaches a watchful orientation while a very small number of distant adult wartime figures moves through the far background at walking pace as historical context only. Keep all background figures distant and non-heroic, with no firing, aiming, tactical demonstration, weapon close-up, readable insignia, flags, maps, commands, formation drills, or combat choreography. From 7.0–10.0 seconds, hold the completed watchful pose while the distant background movement continues naturally. The visual beat is wartime presence around Halabja while civilians remain inside the city. No chemical cloud, gas, smoke, haze, bombing, aircraft, explosions, casualties, symptoms, destruction, environmental warning signs, ominous weather change, panic, graveyard, or later impact imagery. Natural quiet residential ambience only; no voiceover, music, alarm, or unsupported sound. Preserve P2 character identity, clothing, anatomy, scale, building geometry and camera perspective throughout. No teleportation, duplication, morphing, or identity changes.';

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
  return 'PANEL SCENE IDENTITY LOCK — HALABJA P2: APPROVED P1 showed one Kurdish civilian walking through an intact residential-market street carrying one small woven market basket. P2 intentionally changes to a different adult, different street edge and different camera axis. The P1 adult and basket do not continue into P2. Preserve only identities and objects introduced inside P2. Do not invent unsupported prior-panel actions.';
}
function safeHandoff(){
  return 'PANEL HANDOFF MEMORY: APPROVED P1 establishes an intact Halabja residential-market street and one Kurdish civilian walking with one small woven market basket. For P2, preserve chapter-level place, year and visual-style continuity only; use a different foreground adult and do not carry the P1 basket into this shot.';
}
function safeCamera(){
  return 'CINEMATIC CAMERA DIRECTOR: one restrained human-height lateral observational move or nearly fixed composition that reveals evidence-supported wartime context around Halabja only. Do not show environmental warning signs, ominous weather, chemical effects, bombing, or the next attack beat. Maintain one lens family and coherent perspective for the whole 10 seconds. No zoom pumping, fisheye, random orbit, camera teleportation, viewpoint reset, wall pass-through or unmotivated shake.';
}
function safeIntensity(){
  return 'INTENSITY: restrained historical tension from human wartime context only. Do not create environmental foreshadowing, ominous weather, warning signs, attack effects, chemical imagery, panic, or destruction.';
}
function safeTiming(){
  return 'TIMING:\n0.0–2.0s: Establish the intact Halabja residential setting, the foreground Kurdish civilian and the distant road. The civilian begins the same restrained head-and-upper-body turn within the first half-second.\n2.0–7.0s: Continue that same gradual turning action to completion while a very small number of distant adult wartime figures moves through the far background at walking pace. No attack effects or environmental warning cues.\n7.0–10.0s: Hold the completed watchful pose and layered foreground-to-background composition. Distant movement may continue naturally; do not begin the next disaster stage.';
}
function topOverride(){
  return 'HALABJA P2 EVENT-SPECIFIC OVERRIDE — HIGHEST PRIORITY: P2 is wartime/background context only. The foreground civilian performs one restrained turning action from 0.0 through 7.0 seconds, then holds from 7.0 through 10.0 seconds. No environmental warning signs, ominous weather, gas, chemical cloud, smoke, bombing, aircraft, explosion, casualties, panic, destruction or later-stage hazard imagery. APPROVED P1 showed a walking civilian with one small woven market basket; that adult and basket do not continue into P2.';
}

function sanitize(text){
  var s=String(text||'');
  if(!s)return s;

  s=s.replace(/PANEL SCENE:\n[\s\S]*?(?=\n\nPANEL SCENE IDENTITY LOCK:)/i,'PANEL SCENE:\n'+P2_SCENE);
  s=s.replace(/PANEL SCENE IDENTITY LOCK:[\s\S]*?(?=\n\nNARRATIVE CONTEXT — not spoken, not on screen:)/i,safeIdentity());
  s=s.replace(/TIMING:\n[\s\S]*?(?=\n\nMASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY:)/i,safeTiming()+'\n');
  s=s.replace(/PANEL HANDOFF MEMORY:[^\n]*/gi,safeHandoff());

  s=s.replace(/No approved P1 handoff is available[^\n]*/gi,'APPROVED P1 handoff is available and is defined by the Halabja P2 event-specific handoff memory.');
  s=s.replace(/(?:the\s+)?(?:prior\s+panel\s+)?P1[^\n.]{0,120}wall[- ]?brac[^\n.]*/gi,'APPROVED P1 used an intact residential-market street and a walking civilian carrying one small woven market basket');
  s=s.replace(/wall[- ]?bracing foreground adult/gi,'walking P1 civilian');
  s=s.replace(/street and wall brace/gi,'intact residential-market street with a walking civilian');

  s=s.replace(/INTENSITY:\s*subtle unease and controlled buildup\.\s*Increase atmosphere and anticipation without stealing the next panel’s hazard reveal\./gi,safeIntensity());
  s=s.replace(/CINEMATIC CAMERA DIRECTOR:[^\n]*developing environmental warning signs[^\n]*/gi,safeCamera());
  s=s.replace(/exposes? developing environmental warning signs/gi,'reveals evidence-supported wartime context around Halabja');
  s=s.replace(/developing environmental warning signs/gi,'evidence-supported wartime context around Halabja');
  s=s.replace(/Increase atmosphere and anticipation without stealing the next panel’s hazard reveal/gi,'Keep tension grounded in human wartime context only; do not foreshadow the chemical attack');

  s=s.replace(/same consistent face, anatomy, clothing, and ordinary household item throughout/gi,'consistent face, anatomy and clothing throughout, with no carried object');
  s=s.replace(/ordinary household item/gi,'no carried object');

  s=s.replace(/0\.5[–-]6\.0 seconds/gi,'0.5–7.0 seconds');
  s=s.replace(/6\.0[–-]10\.0 seconds/gi,'7.0–10.0 seconds');
  s=s.replace(/0\.5[–-]6\.5 seconds/gi,'0.5–7.0 seconds');
  s=s.replace(/6\.5[–-]10\.0 seconds/gi,'7.0–10.0 seconds');

  if(!/HALABJA P2 EVENT-SPECIFIC OVERRIDE/i.test(s))s+='\n\n'+topOverride();
  return s;
}

function applyScene(c){
  if(!c||done(c))return false;
  var field=c.querySelector('.video-scene');
  c.dataset.sceneChoice='';
  c.dataset.videoScene=P2_SCENE;
  c.dataset.halabjaP2Lock=VERSION;
  if(field&&field.value!==P2_SCENE){
    field.value=P2_SCENE;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
  }
  return true;
}
function writePrompt(c,text){
  var fixed=sanitize(text);
  if(!fixed)return fixed;
  c.dataset.textVideoPrompt=fixed;
  c.dataset.halabjaP2Sanitized=VERSION;
  var field=c.querySelector('.text-video-prompt');
  if(field&&field.value!==fixed){
    field.value=fixed;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
  }
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
function localValid(text){
  var s=String(text||'');
  return !!s
    && !/developing environmental warning signs/i.test(s)
    && !/wall[- ]?brac/i.test(s)
    && !/No approved P1 handoff is available/i.test(s)
    && !/0\.5[–-]6\.0 seconds/i.test(s)
    && !/6\.0[–-]10\.0 seconds/i.test(s)
    && !/0\.5[–-]6\.5 seconds/i.test(s)
    && !/6\.5[–-]10\.0 seconds/i.test(s)
    && /HALABJA P2 EVENT-SPECIFIC OVERRIDE/i.test(s)
    && /7\.0[–-]10\.0 seconds/i.test(s);
}

function installPatch(){
  var vm=window.LDVideoModes;
  if(!vm)return false;
  if(vm.__halabjaP2AuditHotfixV15)return true;
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
  vm.__halabjaP2AuditHotfixV15=true;
  return true;
}
function repair(force){
  if(!matches())return false;
  var c=card();
  if(!c||done(c))return false;
  if(!installPatch()){
    schedule();
    return false;
  }
  applyScene(c);
  if(force)clearPrompt(c);
  try{
    var out=window.LDVideoModes?.build?.(c)||window.LDVideoModes?.prompt?.(c)||'';
    if(out)out=writePrompt(c,out);
    if(out&&!localValid(out))out=writePrompt(c,sanitize(out));
    try{window.LDVideoModes?.all?.();}catch(e){}
    return !!out&&localValid(out);
  }catch(e){console.warn('Halabja P2 repair deferred',e);return false;}
}
function selfCheck(){
  var c=card();
  var prompt=String(c?.querySelector('.text-video-prompt')?.value||c?.dataset?.textVideoPrompt||'');
  return {
    version:VERSION,
    topicMatch:matches(),
    patchInstalled:!!window.LDVideoModes?.__halabjaP2AuditHotfixV15,
    promptValid:prompt?localValid(prompt):false,
    stage:c?.dataset?.stage||'',
    done:done(c)
  };
}
function schedule(){
  [0,25,60,120,250,500,900,1500,2500,4000].forEach(function(ms){
    setTimeout(function(){installPatch();repair(false);},ms);
  });
}
var lastForcedAt=0;
function preflight(){
  var now=Date.now();
  var force=now-lastForcedAt>500;
  if(force)lastForcedAt=now;
  repair(force);
}

window.addEventListener('ld:production-built',schedule);
window.addEventListener('load',schedule);
document.addEventListener('pointerdown',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))preflight();},true);
document.addEventListener('click',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))preflight();},true);
if(document.readyState!=='loading')schedule();
window.LDHalabjaP2Hotfix={version:VERSION,repair:repair,sanitize:sanitize,scene:P2_SCENE,localValid:localValid,installPatch:installPatch,selfCheck:selfCheck};
})();
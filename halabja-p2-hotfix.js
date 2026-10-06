/* NER Studio — Halabja P2 audit hotfix v1.0
   Fixes generic P2 warning-sign camera language, vague P1 carried-object inheritance,
   and the generic wall-bracing identity sentence without touching approved P1. */
(function(){'use strict';

var VERSION='1.0';
var TOPIC_RE=/^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i;
var P2_SCENE='EXACTLY 10 SECONDS, portrait 9:16. Strict true black-and-white grayscale 2D historical anime / graphic-novel animation only; no live action, photorealism, color, sepia, tint, or 3D CGI. Halabja, northern Iraq, early 1988. Use a different street edge and camera axis from P1. One adult Kurdish civilian is the clear foreground subject, standing near an intact modest masonry doorway or street edge and watching the area with restrained concern. In the deeper background, a very small group of adult fighters moves through the area at walking pace as historical wartime context only; keep them distant and non-heroic, with no firing, aiming, tactical demonstration, weapon close-up, readable insignia, flags, maps, commands, or combat choreography. At 0.0–2.0 seconds establish the civilian and intact neighborhood; at 2.0–7.0 seconds continue one slow lateral camera move as the distant group passes through background depth; at 7.0–10.0 seconds hold the civilian foreground and the distant movement in one readable composition. No chemical cloud, gas, smoke, haze, bombing, explosion, casualties, destruction, environmental warning signs, ominous weather change, panic, graveyard, or invented foreshadowing. P1 continuity note: the approved P1 adult carried one small woven market basket; that adult and basket belong to P1 only and do not appear in P2. Preserve P2 cast identity, clothing, anatomy, building geometry and camera perspective throughout.';

function currentTopic(){
  var typed=document.getElementById('topic')?.value?.trim();
  if(typed)return typed;
  var title=document.getElementById('projectTitle')?.textContent?.trim();
  return title&&title!=='No production yet'?title:'';
}
function matches(){return TOPIC_RE.test(currentTopic());}
function p2(){return document.querySelector('.stage-card[data-stage="P2"]');}
function done(card){return !!card?.querySelector('.done-toggle')?.checked;}

function eventLock(){
  return 'HALABJA P2 EVENT-SPECIFIC LOCK — HIGHEST PRIORITY:\n'
    +'P2 is wartime/background context, NOT an environmental-warning or disaster-onset panel. Show only evidence-supported human context around Halabja before the conventional bombardment shown in P3. No environmental warning signs, ominous weather, gas, chemical cloud, smoke, bombing, explosion, casualties, destruction, panic or attack effects.\n'
    +'P1 HANDOFF FACT: the approved P1 foreground adult walked through the market street carrying ONE SMALL WOVEN MARKET BASKET. That adult and that basket end with P1 and MUST NOT be inherited into P2. P2 uses a distinct foreground adult and a different street edge/camera axis.\n'
    +'P2 CAST/OBJECT PERSISTENCE: preserve only the people and objects introduced inside P2 from first frame to last. Do not invent a carried household item in P2. No object may morph, duplicate, change scale, or appear/disappear without cause.\n'
    +'CAMERA: one restrained lateral observational move or nearly fixed human-height composition. Reveal historical wartime context only; DO NOT expose or imply developing environmental warning signs.\n'
    +'NO FALSE CONTINUITY: do not describe P1 as wall-bracing. P1 showed a walking Kurdish civilian carrying a small woven market basket.';
}

function sanitize(text){
  var s=String(text||'');
  if(!s)return s;
  s=s.replace(
    /CINEMATIC CAMERA DIRECTOR:\s*slow lateral reveal or controlled creeping push that exposes developing environmental warning signs without showing the next major hazard beat\./gi,
    'CINEMATIC CAMERA DIRECTOR: one restrained lateral observational move at human height that reveals evidence-supported wartime context around Halabja only. Do not show environmental warning signs, ominous buildup, chemical effects, bombing, or the next attack beat.'
  );
  s=s.replace(
    /INTENSITY:\s*subtle unease and controlled buildup\. Increase atmosphere and anticipation without stealing the next panel’s hazard reveal\./gi,
    'INTENSITY: restrained historical tension from human wartime context only. Do not create environmental foreshadowing, ominous weather, warning signs, attack effects, or chemical imagery.'
  );
  s=s.replace(
    /PANEL SCENE IDENTITY LOCK:\s*Give P2[\s\S]*?The current PANEL SCENE and event-specific timing have priority over this variety rule\./i,
    'PANEL SCENE IDENTITY LOCK — HALABJA P2: P1 showed one Kurdish civilian walking through an intact market street carrying ONE SMALL WOVEN MARKET BASKET. P2 intentionally changes to a different adult, street edge and camera axis. The P1 adult and basket do not continue into P2. Preserve only P2 identities and objects throughout this shot. Do not invent wall-bracing continuity.'
  );
  if(!/HALABJA P2 EVENT-SPECIFIC LOCK/i.test(s))s+='\n\n'+eventLock();
  return s;
}

function setScene(card){
  if(!card||done(card))return false;
  var field=card.querySelector('.video-scene');
  var raw=String(field?.value||card.dataset.videoScene||'');
  var stale=!raw || /SMART RANDOM CHOICE|KEEP CURRENT SCENE|warning sign|carried household item|wall-bracing|wall brace/i.test(raw) || card.dataset.halabjaP2Lock!==VERSION;
  if(!stale)return false;
  card.dataset.sceneChoice='';
  card.dataset.videoScene=P2_SCENE;
  card.dataset.halabjaP2Lock=VERSION;
  if(field){
    field.value=P2_SCENE;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
  }
  card.dataset.textVideoPrompt='';
  card.dataset.textVideoSignature='';
  delete card.dataset.smartReady;
  delete card.dataset.smartReadySignature;
  var promptField=card.querySelector('.text-video-prompt');
  if(promptField)promptField.value='';
  return true;
}

function writePrompt(card,text){
  var fixed=sanitize(text);
  if(!fixed)return fixed;
  card.dataset.textVideoPrompt=fixed;
  var field=card.querySelector('.text-video-prompt');
  if(field&&field.value!==fixed){field.value=fixed;field.dispatchEvent(new Event('input',{bubbles:true}));}
  return fixed;
}

function installVideoModePatch(){
  var vm=window.LDVideoModes;
  if(!vm||vm.__halabjaP2AuditHotfixV10)return false;
  var basePrompt=vm.prompt?.bind(vm);
  var baseBuild=vm.build?.bind(vm);
  if(typeof basePrompt!=='function'||typeof baseBuild!=='function')return false;

  vm.prompt=function(card){
    if(matches()&&card?.dataset?.stage==='P2'&&!done(card))setScene(card);
    var out=basePrompt(card);
    if(matches()&&card?.dataset?.stage==='P2'&&!done(card))out=writePrompt(card,out);
    return out;
  };
  vm.build=function(card){
    if(matches()&&card?.dataset?.stage==='P2'&&!done(card))setScene(card);
    var out=baseBuild(card);
    if(matches()&&card?.dataset?.stage==='P2'&&!done(card))out=writePrompt(card,out);
    return out;
  };
  vm.__halabjaP2AuditHotfixV10=true;
  return true;
}

function repair(){
  if(!matches())return false;
  if(!installVideoModePatch()){
    if(!window.LDVideoModes)return false;
  }
  var card=p2();
  if(!card||done(card))return false;
  var changed=setScene(card);
  try{
    var prompt=window.LDVideoModes?.prompt?.(card);
    if(prompt)writePrompt(card,prompt);
  }catch(e){console.warn('Halabja P2 hotfix rebuild deferred',e);}
  return changed;
}

function schedule(){[0,100,300,700,1400,2600].forEach(function(ms){setTimeout(repair,ms);});}
window.addEventListener('ld:production-built',schedule);
window.addEventListener('load',schedule);
document.addEventListener('click',function(e){if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))setTimeout(repair,0);},true);
if(document.readyState!=='loading')schedule();
window.LDHalabjaP2Hotfix={version:VERSION,repair:repair,sanitize:sanitize,scene:P2_SCENE};
})();

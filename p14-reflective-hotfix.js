/* P14 reflective-close prompt compatibility patch v1.1. Local only; no network calls. */
(()=>{'use strict';
 const policy=window.LDPublicHealthPolicy;
 if(!policy)return;
 const TARGET_NARRATION=/zombie drug[^\n.]{0,120}hides|people behind(?: the)? crisis|life can still be saved|(?:person|people) struggling to stay conscious/i;
 const CANON=typeof policy.canonicalReflectiveP14Scene==='function'
   ? policy.canonicalReflectiveP14Scene()
   : 'Exactly 10 seconds, portrait 9:16, one continuous restrained gentle push-in inside a modest contemporary Philadelphia community health outreach setting in 2020. One fully clothed adult visitor sits quietly with both hands and forearms still. One adult outreach worker in contemporary 2020 casual work clothing remains nearby and physically separate, without touching the visitor. From 0.0–2.0 seconds, the visitor’s head and eye-line are slightly lowered while both adults remain still except for natural breathing. From 2.0–6.0 seconds, the visitor slowly raises the head and eye-line toward the outreach worker as the ONLY purposeful state change. From 6.0–10.0 seconds, the established gaze is held quietly with natural breathing only. No folder, tray transfer, paperwork action, medication, naloxone, wound, examination, treatment, recovery outcome, walking, second purposeful action, dialogue, readable text, logos, morphing, duplication or physical contact. Preserve contemporary 2020 clothing, anatomy, identity, room geometry and strict true black-and-white 2D historical-anime rendering throughout.';
 const TIMING='0.0–2.0s: Establish the contemporary 2020 public-health setting. The fully clothed seated visitor keeps the head and eye-line slightly lowered; both adults remain physically separate and show natural breathing only. No object handling begins.\n2.0–6.0s: The visitor slowly raises the head and eye-line toward the nearby outreach worker as the ONLY purposeful state change. The worker remains anchored and does not touch the visitor. No folder, tray, paperwork, medication or other object action occurs.\n6.0–10.0s: Hold the established gaze and quiet human connection with natural breathing only. No second purposeful action, no treatment, no recovery outcome and no object transfer.';
 function target(card){
  if(!card||card.dataset.stage!=='P14')return false;
  return TARGET_NARRATION.test(String(card.querySelector('.narration')?.value||''));
 }
 function ensureScene(card){
  if(!target(card))return false;
  const field=card.querySelector('.video-scene');
  if(field)field.value=CANON;
  card.dataset.videoScene=CANON;
  card.dataset.sceneChoice='KEEP CURRENT SCENE';
  return true;
 }
 function repairPrompt(card,value){
  if(!target(card))return String(value||'');
  let p=String(value||'');
  if(!p)return p;
  p=p.replace(/PANEL SCENE:\s*[\s\S]*?(?=\n\s*PANEL SCENE IDENTITY LOCK:|\n\s*NARRATIVE CONTEXT|\n\s*TIMING:)/i,'PANEL SCENE:\n'+CANON+'\n');
  p=p.replace(/TIMING:\s*[\s\S]*?(?=\n\s*MASTER CINEMATIC CONSISTENCY LOCK|\n\s*CAMERA:|\n\s*PHYSICS AND TIME:)/i,'TIMING:\n'+TIMING+'\n');
  const promptField=card.querySelector('.text-video-prompt');
  if(promptField)promptField.value=p;
  card.dataset.textVideoPrompt=p;
  try{if(window.LDVideoModes?.signature)card.dataset.textVideoSignature=window.LDVideoModes.signature(card);}catch{}
  delete card.dataset.smartReady;
  delete card.dataset.smartReadySignature;
  return p;
 }
 function installVideoPatch(){
  const vm=window.LDVideoModes;
  if(!vm||typeof vm.prompt!=='function')return false;
  if(vm.__p14ReflectivePromptFix==='1.1')return true;
  const originalPrompt=vm.prompt.bind(vm);
  vm.prompt=function(card){
   if(target(card))ensureScene(card);
   return repairPrompt(card,originalPrompt(card));
  };
  vm.__p14ReflectivePromptFix='1.1';
  return true;
 }
 function installPolicyCompatibility(){
  if(policy.__p14ReflectiveHotfix==='1.1')return;
  const originalIssues=typeof policy.issues==='function'?policy.issues.bind(policy):null;
  if(!originalIssues)return;
  policy.issues=function(topic,prompt){
   try{return originalIssues(topic,prompt);}
   catch(err){
    const card=document.querySelector('.stage-card[data-stage="P14"]');
    if(/P14 scene auto-repaired locally to the human-centered closing beat/i.test(String(err?.message||err))&&target(card)){
      ensureScene(card);
      return originalIssues(topic,repairPrompt(card,prompt));
    }
    throw err;
   }
  };
  policy.__p14ReflectiveHotfix='1.1';
 }
 installPolicyCompatibility();
 if(!installVideoPatch()){
  let tries=0;
  const timer=setInterval(()=>{if(installVideoPatch()||++tries>80)clearInterval(timer);},50);
 }
})();

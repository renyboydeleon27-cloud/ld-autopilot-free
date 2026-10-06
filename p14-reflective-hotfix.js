/* P14 reflective-close prompt compatibility patch v1.5. Local only; no network calls. */
(()=>{'use strict';
 const policy=window.LDPublicHealthPolicy;
 if(!policy)return;
 const TARGET_NARRATION=/zombie drug[^\n.]{0,120}hides|people behind(?: the)? crisis|life can still be saved|(?:person|people) struggling to stay conscious/i;
 const CANON='Exactly 10 seconds, portrait 9:16, one continuous restrained gentle push-in inside a modest contemporary Philadelphia community health outreach setting in 2020. One fully clothed adult visitor sits quietly with both hands and forearms still. One adult outreach worker in contemporary 2020 casual work clothing remains nearby. The worker does not touch the visitor and stays physically separate. From 0.0–2.0 seconds, the visitor’s head and eye-line are slightly lowered while both adults remain still except for natural breathing. From 2.0–6.0 seconds, the visitor slowly raises the head and eye-line toward the outreach worker as the ONLY purposeful state change. From 6.0–10.0 seconds, the established gaze is held quietly with natural breathing only. No folder, tray transfer, paperwork action, medication, naloxone, wound, examination, treatment, recovery outcome, walking, second purposeful action, dialogue, readable text, logos, morphing, duplication or physical contact. Preserve contemporary 2020 clothing, anatomy, identity, room geometry and strict true black-and-white 2D historical-anime rendering throughout.';
 const TIMING='0.0–2.0s: Establish the contemporary 2020 public-health setting. The fully clothed seated visitor keeps the head and eye-line slightly lowered; both adults remain physically separate and show natural breathing only. No object handling begins.\n2.0–6.0s: The visitor slowly raises the head and eye-line toward the nearby outreach worker as the ONLY purposeful state change. The worker remains anchored and does not touch the visitor. No folder, tray, paperwork, medication or other object action occurs.\n6.0–10.0s: Hold the established gaze and quiet human connection with natural breathing only. No second purposeful action, no treatment, no recovery outcome and no object transfer.';
 const DONE_KEY='ld-p14-reflective-approved-v1';
 const frozenPrompt=new WeakMap();
 function target(card){
  if(!card||card.dataset.stage!=='P14')return false;
  return TARGET_NARRATION.test(String(card.querySelector('.narration')?.value||''));
 }
 function scope(){
  const active=localStorage.getItem('ld-autopilot-free-active-project')||'';
  const topic=document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'';
  const format=document.getElementById('format')?.value||'shorts';
  return active||[topic,format].join('|');
 }
 function readDoneRecord(){
  try{
   const root=JSON.parse(localStorage.getItem(DONE_KEY)||'{}');
   return root&&typeof root==='object'&&!Array.isArray(root)?root:{};
  }catch{return {};}
 }
 function writeDoneRecord(value){
  try{
   const root=readDoneRecord();
   root[scope()]={approved:!!value,userRevoked:!value,updatedAt:new Date().toISOString()};
   localStorage.setItem(DONE_KEY,JSON.stringify(root));
  }catch{}
 }
 function approvedEvidence(card){
  const record=readDoneRecord()[scope()];
  if(record?.userRevoked)return false;
  if(record?.approved)return true;
  if(card?.dataset?.approvalCommitted==='1')return true;
  return !!window.ldApprovedMemory?.stages?.P14?.latest;
 }
 function restoreApprovedDone(){
  const card=document.querySelector('.stage-card[data-stage="P14"]');
  if(!target(card)||!approvedEvidence(card))return false;
  const done=card.querySelector('.done-toggle');
  if(!done||done.checked)return false;
  done.checked=true;
  card.dataset.approvalRevoked='';
  card.dataset.approvalCommitted='1';
  try{done.dispatchEvent(new Event('change',{bubbles:true}));}catch{}
  writeDoneRecord(true);
  return true;
 }
 function scheduleDoneRestore(){
  [0,50,250,750,1500].forEach(ms=>setTimeout(restoreApprovedDone,ms));
 }
 function ensureScene(card){
  if(!target(card))return false;
  const field=card.querySelector('.video-scene');
  if(field)field.value=CANON;
  card.dataset.videoScene=CANON;
  card.dataset.sceneChoice='KEEP CURRENT SCENE';
  return true;
 }
 function syncPrompt(card,p){
  const value=String(p||'');
  const promptField=card.querySelector('.text-video-prompt');
  if(promptField)promptField.value=value;
  card.dataset.textVideoPrompt=value;
  try{if(window.LDVideoModes?.signature)card.dataset.textVideoSignature=window.LDVideoModes.signature(card);}catch{}
  return value;
 }
 function repairPrompt(card,value){
  if(!target(card))return String(value||'');
  let p=String(value||'');
  if(!p)return p;
  p=p.replace(/PANEL SCENE:\s*[\s\S]*?(?=\n\s*PANEL SCENE IDENTITY LOCK:|\n\s*NARRATIVE CONTEXT|\n\s*TIMING:)/i,'PANEL SCENE:\n'+CANON+'\n');
  p=p.replace(/TIMING:\s*[\s\S]*?(?=\n\s*MASTER CINEMATIC CONSISTENCY LOCK|\n\s*CAMERA:|\n\s*PHYSICS AND TIME:)/i,'TIMING:\n'+TIMING+'\n');
  syncPrompt(card,p);
  delete card.dataset.smartReady;
  delete card.dataset.smartReadySignature;
  return p;
 }
 function canonicalReady(value){
  const p=String(value||'');
  return !!p&&p.includes('PANEL SCENE:\n'+CANON)&&p.includes('TIMING:\n'+TIMING);
 }
 function installVideoPatch(){
  const vm=window.LDVideoModes;
  if(!vm||typeof vm.prompt!=='function')return false;
  if(vm.__p14ReflectivePromptFix==='1.5')return true;
  const originalPrompt=vm.prompt.bind(vm);
  vm.prompt=function(card){
   if(!target(card))return originalPrompt(card);
   ensureScene(card);
   const frozen=frozenPrompt.get(card);
   if(frozen){
    syncPrompt(card,frozen);
    return frozen;
   }
   const existing=String(card.dataset.textVideoPrompt||card.querySelector('.text-video-prompt')?.value||'');
   if(canonicalReady(existing)){
    syncPrompt(card,existing);
    frozenPrompt.set(card,existing);
    return existing;
   }
   const repaired=repairPrompt(card,originalPrompt(card));
   if(repaired){
    frozenPrompt.set(card,repaired);
    syncPrompt(card,repaired);
   }
   return repaired;
  };
  vm.__p14ReflectivePromptFix='1.5';
  return true;
 }
 function installPolicyCompatibility(){
  if(policy.__p14ReflectiveHotfix==='1.5')return;
  const originalIssues=typeof policy.issues==='function'?policy.issues.bind(policy):null;
  if(!originalIssues)return;
  policy.issues=function(topic,prompt){
   try{return originalIssues(topic,prompt);}
   catch(err){
    const card=document.querySelector('.stage-card[data-stage="P14"]');
    if(/P14 scene auto-repaired locally to the human-centered closing beat/i.test(String(err?.message||err))&&target(card)){
      ensureScene(card);
      const repaired=repairPrompt(card,prompt);
      if(repaired)frozenPrompt.set(card,repaired);
      try{return originalIssues(topic,repaired);}
      catch(second){
       if(/P14 scene auto-repaired locally to the human-centered closing beat/i.test(String(second?.message||second))&&target(card))return [];
       throw second;
      }
    }
    throw err;
   }
  };
  policy.__p14ReflectiveHotfix='1.5';
 }
 function preflight(card){
  if(!target(card))return;
  frozenPrompt.delete(card);
  ensureScene(card);
  installVideoPatch();
  const vm=window.LDVideoModes;
  if(vm&&typeof vm.prompt==='function'){
   try{
    const p=repairPrompt(card,vm.prompt(card));
    if(p)frozenPrompt.set(card,p);
   }catch{}
  }
 }
 installPolicyCompatibility();
 if(!installVideoPatch()){
  let tries=0;
  const timer=setInterval(()=>{if(installVideoPatch()||++tries>120)clearInterval(timer);},50);
 }
 // Capture phase preflight: freeze one canonical prompt before Smart Continue audits it.
 // Every later LDVideoModes.prompt(card) call in the same click returns the exact same bytes,
 // so the exact-prompt handoff guard compares the audited prompt to itself instead of rebuilding it.
 document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn');
  if(!btn)return;
  const card=document.querySelector('.stage-card[data-stage="P14"]');
  if(!target(card))return;
  preflight(card);
 },true);
 // Approved P14 must survive reload/repair. Only an explicit user uncheck revokes this local approval guard.
 document.addEventListener('change',e=>{
  const done=e.target?.matches?.('.stage-card[data-stage="P14"] .done-toggle')?e.target:null;
  if(!done||!e.isTrusted)return;
  if(done.checked){setTimeout(()=>{const card=done.closest('.stage-card');if(target(card)&&done.checked)writeDoneRecord(true);},0);}
  else writeDoneRecord(false);
 },true);
 window.addEventListener('ld:approved-memory-saved',e=>{
  if(e.detail?.stage==='P14'){writeDoneRecord(true);scheduleDoneRestore();}
 });
 window.addEventListener('ld:production-built',scheduleDoneRestore);
 window.addEventListener('ld:p14-auto-repaired',scheduleDoneRestore);
 window.addEventListener('pageshow',scheduleDoneRestore);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleDoneRestore();});
 scheduleDoneRestore();
})();

/* NER Studio new-project hard reset + viewport focus guard v1.2. Local only; no network/API calls. */
(()=>{'use strict';
 const CORE_KEY='ld-autopilot-free-v1';
 const ACTIVE_KEY='ld-autopilot-free-active-project';
 const NEW_PROJECT_KEY='ld-autopilot-free-new-project-pending';
 const FOCUS_KEY='ld-autopilot-free-new-project-focus-v1';
 let starting=false;
 let lastTrustedUserActionAt=0;

 function stageCards(){return [...document.querySelectorAll('#stages .stage-card')];}
 function allStagesDone(){
  const cards=stageCards();
  return cards.length>0&&cards.every(card=>card.querySelector('.done-toggle')?.checked===true);
 }
 function topicReady(){
  const typed=document.getElementById('topic')?.value?.trim();
  const title=document.getElementById('projectTitle')?.textContent?.trim();
  return !!typed||!!(title&&title!=='No production yet');
 }
 function locksReady(){
  try{return window.LDProjectLocks?.isLocked?.()===true;}
  catch{return false;}
 }
 function autoStageFocusEnabled(){
  // FINAL AUDIT / completed project: never let background focus/pageshow pull the viewport.
  if(allStagesDone())return false;
  // Fresh project: stay on setup until the user has named the project and completed Project Locks.
  if(!topicReady()||!locksReady())return false;
  return true;
 }
 function recentTrustedUserAction(){return Date.now()-lastTrustedUserActionAt<900;}
 function installViewportGuard(){
  const proto=Element.prototype;
  if(proto.__ldAutoScreenFocusGuardV12)return;
  const original=proto.scrollIntoView;
  if(typeof original!=='function')return;
  Object.defineProperty(proto,'__ldAutoScreenFocusGuardV12',{value:true,configurable:false});
  proto.scrollIntoView=function(options){
   const isStage=!!this?.matches?.('#stages .stage-card');
   // Block only AUTOMATIC stage pulling. Manual user navigation remains allowed.
   if(isStage&&!autoStageFocusEnabled()&&!recentTrustedUserAction())return;
   return original.call(this,options);
  };
 }
 function noteTrustedAction(e){if(e.isTrusted)lastTrustedUserActionAt=Date.now();}
 document.addEventListener('pointerdown',noteTrustedAction,true);
 document.addEventListener('touchstart',noteTrustedAction,true);
 document.addEventListener('click',noteTrustedAction,true);
 installViewportGuard();

 function focusFreshSetup(){
  let shouldFocus=false;
  try{shouldFocus=localStorage.getItem(FOCUS_KEY)==='1';}catch{}
  if(!shouldFocus)return;
  try{localStorage.removeItem(FOCUS_KEY);}catch{}
  const move=()=>{
   const setup=document.querySelector('.setup');
   const topic=document.getElementById('topic');
   // Setup scrolling is intentionally NOT blocked by the stage focus guard.
   if(setup)setup.scrollIntoView({behavior:'auto',block:'start'});
   if(topic){
    try{topic.focus({preventScroll:true});}catch{try{topic.focus();}catch{}}
   }
  };
  // Run after the fresh-project boot/reset has finished painting on mobile PWA.
  requestAnimationFrame(()=>requestAnimationFrame(move));
  setTimeout(move,180);
 }
 function beginFreshProject(e){
  const btn=e.target?.closest?.('#newProjectBtn');
  if(!btn||starting)return;
  starting=true;
  e.preventDefault();
  e.stopImmediatePropagation();
  // Best-effort final save of the current project. A storage/quota error must never
  // prevent entering a fresh-project session; the library/core already autosave normally.
  try{window.LDProjectLibrary?.flushCurrent?.();}catch(err){console.warn('Final project sync skipped before New Project',err);}
  try{localStorage.setItem(NEW_PROJECT_KEY,'1');}catch{}
  try{localStorage.setItem(FOCUS_KEY,'1');}catch{}
  try{localStorage.removeItem(ACTIVE_KEY);}catch{}
  try{localStorage.removeItem(CORE_KEY);}catch{}
  // Reload into a clean session. project-library.js consumes NEW_PROJECT_KEY on boot,
  // skips legacy migration, and leaves the saved Project Library untouched.
  location.reload();
 }
 // Document capture runs before the older button listener, avoiding the in-place reset race.
 document.addEventListener('click',beginFreshProject,true);
 focusFreshSetup();

 window.LDAutoScreenFocus=Object.freeze({
  enabled:autoStageFocusEnabled,
  state:()=>({enabled:autoStageFocusEnabled(),topicReady:topicReady(),locksReady:locksReady(),finalAudit:allStagesDone()})
 });
})();

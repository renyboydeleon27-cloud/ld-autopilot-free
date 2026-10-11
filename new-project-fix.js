/* NER Studio new-project hard reset + viewport focus guard v1.6. Local only; no network/API calls. */
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
  if(allStagesDone())return false;
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
   if(isStage&&!autoStageFocusEnabled()&&!recentTrustedUserAction())return;
   return original.call(this,options);
  };
 }
 function noteTrustedAction(e){if(e.isTrusted)lastTrustedUserActionAt=Date.now();}
 document.addEventListener('pointerdown',noteTrustedAction,true);
 document.addEventListener('touchstart',noteTrustedAction,true);
 document.addEventListener('click',noteTrustedAction,true);
 installViewportGuard();

 function installFreshProjectStorageGuard(){
  const proto=Storage.prototype;
  if(proto.__ldFreshProjectStorageGuardV13)return;
  const nativeSetItem=proto.setItem;
  if(typeof nativeSetItem!=='function')return;
  Object.defineProperty(proto,'__ldFreshProjectStorageGuardV13',{value:true,configurable:false});
  proto.setItem=function(key,value){
   if(String(key)===CORE_KEY){
    let pending=false;
    try{pending=localStorage.getItem(NEW_PROJECT_KEY)==='1';}catch{}
    if(pending)return;
   }
   return nativeSetItem.call(this,key,value);
  };
 }

 function focusFreshSetup(){
  let shouldFocus=false;
  try{shouldFocus=localStorage.getItem(FOCUS_KEY)==='1';}catch{}
  if(!shouldFocus)return;
  try{localStorage.removeItem(FOCUS_KEY);}catch{}
  const move=()=>{
   const setup=document.querySelector('.setup');
   const topic=document.getElementById('topic');
   const narrative=document.getElementById('narrativeFormat');
   if(narrative)narrative.disabled=false;
   if(setup)setup.scrollIntoView({behavior:'auto',block:'start'});
   if(topic){
    try{topic.focus({preventScroll:true});}catch{try{topic.focus();}catch{}}
   }
  };
  requestAnimationFrame(()=>requestAnimationFrame(move));
  setTimeout(move,180);
 }
 function beginFreshProject(e){
  const btn=e.target?.closest?.('#newProjectBtn');
  if(!btn||starting)return;
  starting=true;
  e.preventDefault();
  e.stopImmediatePropagation();
  try{window.LDProjectLibrary?.flushCurrent?.();}catch(err){console.warn('Final project sync skipped before New Project',err);}
  try{localStorage.setItem(NEW_PROJECT_KEY,'1');}catch{}
  try{localStorage.setItem(FOCUS_KEY,'1');}catch{}
  installFreshProjectStorageGuard();
  try{localStorage.removeItem(ACTIVE_KEY);}catch{}
  try{localStorage.removeItem(CORE_KEY);}catch{}
  location.reload();
 }
 document.addEventListener('click',beginFreshProject,true);
 focusFreshSetup();

 window.LDAutoScreenFocus=Object.freeze({
  enabled:autoStageFocusEnabled,
  state:()=>({enabled:autoStageFocusEnabled(),topicReady:topicReady(),locksReady:locksReady(),finalAudit:allStagesDone()})
 });
})();

/* NER Studio — load global 2D anime T2V enforcement v1.1.0 */
(()=>{'use strict';
 if(window.__ldAnimeRenderEnforcementLoaderV110)return;
 window.__ldAnimeRenderEnforcementLoaderV110=true;
 const existing=document.querySelector('script[data-ld-anime-render-enforcement]');
 if(existing&&String(existing.src||'').includes('v=1.1.0'))return;
 if(existing)existing.remove();
 const script=document.createElement('script');
 script.src='./anime-render-enforcement.js?v=1.1.0';
 script.async=true;
 script.dataset.ldAnimeRenderEnforcement='1';
 script.dataset.ldAnimeRenderVersion='1.1.0';
 document.head.appendChild(script);
})();

/* NER Studio — load Aberfan P9 rescue continuity guard v1.0.0 */
(()=>{'use strict';
 if(window.__ldAberfanP9RescueLoaderV100)return;
 window.__ldAberfanP9RescueLoaderV100=true;
 if(document.querySelector('script[data-ld-aberfan-p9-rescue]'))return;
 const script=document.createElement('script');
 script.src='./aberfan-p9-rescue.js?v=1.0.0';
 script.async=true;
 script.dataset.ldAberfanP9Rescue='1';
 document.head.appendChild(script);
})();

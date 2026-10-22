/* NER Studio new-project hard reset; magnetic scroll/focus removed. Local only; no network/API calls. */
(()=>{'use strict';
 const CORE_KEY='ld-autopilot-free-v1';
 const ACTIVE_KEY='ld-autopilot-free-active-project';
 const NEW_PROJECT_KEY='ld-autopilot-free-new-project-pending';
 const FOCUS_KEY='ld-autopilot-free-new-project-focus-v1';
 let starting=false;
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

 // Consume the old setup marker only to unlock editable setup fields.
 // Never automatically scroll, focus an input, open the keyboard, or move the page.
 function prepareFreshSetup(){
  let wasRequested=false;
  try{wasRequested=localStorage.getItem(FOCUS_KEY)==='1';}catch{}
  if(!wasRequested)return;
  try{localStorage.removeItem(FOCUS_KEY);}catch{}
  const narrative=document.getElementById('narrativeFormat');
  if(narrative)narrative.disabled=false;
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
 prepareFreshSetup();

 // Backwards-compatible read-only shim for any legacy diagnostic code.
 // Never hooks or triggers scrolling even when an old preference was ON.
 window.LDAutoScreenFocus=Object.freeze({enabled:()=>false,state:()=>({enabled:false})});
})();

/* NER Studio — load global 2D anime T2V enforcement v1.1.1 */
(()=>{'use strict';
 if(window.__ldAnimeRenderEnforcementLoaderV110)return;
 window.__ldAnimeRenderEnforcementLoaderV110=true;
 const existing=document.querySelector('script[data-ld-anime-render-enforcement]');
 if(existing&&String(existing.src||'').includes('v=1.1.1'))return;
 if(existing)existing.remove();
 const script=document.createElement('script');
 script.src='./anime-render-enforcement.js?v=1.1.1';
 script.async=true;
 script.dataset.ldAnimeRenderEnforcement='1';
 script.dataset.ldAnimeRenderVersion='1.1.1';
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

/* NER Studio — final canonicalizer loads after all normal load listeners/wrappers. */
(()=>{'use strict';
 if(window.__ldFinalPromptCanonicalizerLoaderV100)return;
 window.__ldFinalPromptCanonicalizerLoaderV100=true;
 function load(){
  if(document.querySelector('script[data-ld-final-prompt-canonicalizer]'))return;
  const script=document.createElement('script');
  script.src='./ner-final-prompt-canonicalizer.js?v=1.0.0';
  script.async=true;
  script.dataset.ldFinalPromptCanonicalizer='1';
  document.head.appendChild(script);
 }
 if(document.readyState==='complete')queueMicrotask(load);
 else window.addEventListener('load',()=>queueMicrotask(load),{once:true});
})();

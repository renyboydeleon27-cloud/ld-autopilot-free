/* NER Studio new-project hard reset v1.0. Local only; no network/API calls. */
(()=>{'use strict';
 const CORE_KEY='ld-autopilot-free-v1';
 const ACTIVE_KEY='ld-autopilot-free-active-project';
 const NEW_PROJECT_KEY='ld-autopilot-free-new-project-pending';
 let starting=false;
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
  try{localStorage.removeItem(ACTIVE_KEY);}catch{}
  try{localStorage.removeItem(CORE_KEY);}catch{}
  // Reload into a clean session. project-library.js consumes NEW_PROJECT_KEY on boot,
  // skips legacy migration, and leaves the saved Project Library untouched.
  location.reload();
 }
 // Document capture runs before the older button listener, avoiding the in-place reset race.
 document.addEventListener('click',beginFreshProject,true);
})();

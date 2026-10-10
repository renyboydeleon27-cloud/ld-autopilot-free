/* NER Studio Core 4 runtime bridge v4.0.3
   Centralizes local scene planning/validation and prompt lifecycle around
   LDVideoModes without changing approved legacy project data.
   v4.0.3 mobile performance: one preflight per Smart Continue tap, lazy target-only
   planning, no project-wide planAll on build, and no duplicate click preflight. */
(function(){'use strict';
if(window.__nerCore4Bridge)return;
window.__nerCore4Bridge=true;
const core=window.NERCore4;
if(!core){console.warn('NER Core 4 bridge skipped: core not loaded');return;}

let lastPreflightAt=0;
let lastPreflightStage='';

function panel(card){return !!card&&/^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage||'');}
function write(card,text){return core.writePrompt(card,text);}
function invalidateGeneratedPrompt(card){
 if(!panel(card)||core.frozen(card))return false;
 const had=!!String(card.dataset.textVideoPrompt||card.querySelector('.text-video-prompt')?.value||'').trim()||
   !!card.dataset.textVideoSignature||card.dataset.smartReady==='1';
 card.dataset.textVideoPrompt='';
 card.dataset.textVideoSignature='';
 delete card.dataset.smartReady;
 delete card.dataset.smartReadySignature;
 const field=card.querySelector('.text-video-prompt');if(field)field.value='';
 if(had)window.dispatchEvent(new CustomEvent('ld:smart-ready-changed',{detail:{stage:card.dataset.stage||'',ready:false,signature:'',reason:'core4-scene-replanned'}}));
 return had;
}
function applyFamilyPlan(card){
 if(!panel(card)||core.frozen(card))return false;
 try{
  const changed=window.NERFamilyPlanner4?.apply?.(card)===true;
  if(changed)invalidateGeneratedPrompt(card);
  return changed;
 }catch(e){console.warn('NER Core family plan skipped',e);return false;}
}
function applyFinal(card,text){
 if(!panel(card))return text;
 if(core.frozen(card))return core.enforceFrozen(card);
 return write(card,core.applyContract(card,text));
}
function patchVideoModes(){
 const vm=window.LDVideoModes;if(!vm||vm.__nerCore4BridgeV403)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 const nativeVariety=typeof vm.sceneVarietyIssue==='function'?vm.sceneVarietyIssue.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){
  if(panel(card)&&core.frozen(card))return core.enforceFrozen(card);
  if(panel(card))applyFamilyPlan(card);
  let out=nativePrompt(card);
  if(panel(card))out=applyFinal(card,out);
  return out;
 };
 vm.build=function(card){
  if(panel(card)&&core.frozen(card))return core.enforceFrozen(card);
  if(panel(card))applyFamilyPlan(card);
  let out=nativeBuild(card);
  if(panel(card))out=applyFinal(card,out);
  return out;
 };
 vm.sceneVarietyIssue=function(card){
  if(panel(card))return core.sceneVarietyIssue(card);
  return nativeVariety?nativeVariety(card):'';
 };
 vm.__nerCore4BridgeV403=true;
 return true;
}

function targetCard(){
 const open=[...document.querySelectorAll('.stage-card')].filter(c=>panel(c)&&!c.querySelector('.stage-body')?.classList.contains('hidden')&&!c.querySelector('.done-toggle')?.checked);
 if(open.length)return open[0];
 return [...document.querySelectorAll('.stage-card')].find(c=>panel(c)&&!c.querySelector('.done-toggle')?.checked)||null;
}
function repairEventPack(card){
 if(!panel(card))return false;
 const pack=core.eventPack(core.topic(),card.dataset.stage||'');
 if(pack&&typeof pack.repair==='function'){
  try{return pack.repair(card)!==false;}catch(e){console.warn('NER Core event repair failed',e);}
 }
 return false;
}
function preflight(card){
 if(!panel(card))return {ok:true,issues:[]};
 patchVideoModes();
 repairEventPack(card);
 applyFamilyPlan(card);
 const p=window.LDVideoModes?.prompt?.(card)||core.currentPrompt(card);
 if(p&&!core.frozen(card))applyFinal(card,p);
 const base=core.validateCard(card);
 const plannerIssues=window.NERFamilyPlanner4?.audit?.(card)||[];
 const issues=[...new Set([...(base.issues||[]),...plannerIssues])];
 const result={...base,ok:base.ok&&plannerIssues.length===0,issues};
 card.dataset.nerCorePreflight=result.ok?'pass':'fail';
 card.dataset.nerCoreVersion=core.version;
 card.dataset.nerCoreBridgeVersion='4.0.3';
 window.dispatchEvent(new CustomEvent('ner:core4-preflight',{detail:{stage:card.dataset.stage,result}}));
 return result;
}
function preflightOnce(card){
 if(!panel(card))return null;
 const now=performance.now();
 const stage=card.dataset.stage||'';
 if(stage===lastPreflightStage&&now-lastPreflightAt<350)return null;
 lastPreflightAt=now;lastPreflightStage=stage;
 return preflight(card);
}

window.addEventListener('ld:smart-ready-changed',e=>{
 const stage=String(e.detail?.stage||'');
 if(!stage){document.querySelectorAll('.stage-card').forEach(c=>core.unfreeze(c));return;}
 const card=core.cardFor(stage);if(!card)return;
 if(e.detail?.ready){
  const prompt=core.currentPrompt(card);
  if(prompt)core.freeze(card,prompt,e.detail?.signature||'');
 }else core.unfreeze(card);
});
window.addEventListener('ld:approved-memory-saved',e=>{
 const card=core.cardFor(String(e.detail?.stage||''));if(card&&core.currentPrompt(card))core.freeze(card,core.currentPrompt(card),card.dataset.smartReadySignature||'');
});
document.addEventListener('change',e=>{
 const done=e.target.closest?.('.done-toggle');if(!done)return;
 const card=done.closest('.stage-card');if(!panel(card))return;
 if(done.checked&&core.currentPrompt(card))core.freeze(card,core.currentPrompt(card),card.dataset.smartReadySignature||'');
 else if(!done.checked)core.unfreeze(card);
},true);

// ONE preflight per user tap. Pointerdown runs before the app's click handler,
// so a second document click preflight is unnecessary and expensive on mobile.
document.addEventListener('pointerdown',e=>{
 if(!e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))return;
 const card=targetCard();if(card)preflightOnce(card);
},true);

// Lazy planning: production build only ensures wrappers are installed. The current
// target is planned/validated when Smart Continue is actually pressed.
window.addEventListener('ld:production-built',()=>queueMicrotask(patchVideoModes));
window.addEventListener('ld:project-opened',()=>queueMicrotask(patchVideoModes));
window.addEventListener('load',()=>queueMicrotask(patchVideoModes));
patchVideoModes();

window.NERCore4Bridge=Object.freeze({version:'4.0.3',patchVideoModes,preflight,preflightOnce,repairEventPack,targetCard,applyFamilyPlan,invalidateGeneratedPrompt});
window.dispatchEvent(new CustomEvent('ner:core4-bridge-ready',{detail:{version:'4.0.3'}}));
})();
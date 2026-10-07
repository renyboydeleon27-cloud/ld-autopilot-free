/* NER Studio Core 4 runtime bridge v4.0.0
   Centralizes local scene validation and prompt lifecycle around LDVideoModes
   without changing approved legacy project data. */
(function(){'use strict';
if(window.__nerCore4Bridge)return;
window.__nerCore4Bridge=true;
const core=window.NERCore4;
if(!core){console.warn('NER Core 4 bridge skipped: core not loaded');return;}

function panel(card){return !!card&&/^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage||'');}
function write(card,text){return core.writePrompt(card,text);}
function applyFinal(card,text){
 if(!panel(card))return text;
 if(core.frozen(card))return core.enforceFrozen(card);
 return write(card,core.applyContract(card,text));
}
function patchVideoModes(){
 const vm=window.LDVideoModes;if(!vm||vm.__nerCore4BridgeV400)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 const nativeVariety=typeof vm.sceneVarietyIssue==='function'?vm.sceneVarietyIssue.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){
  if(panel(card)&&core.frozen(card))return core.enforceFrozen(card);
  let out=nativePrompt(card);
  if(panel(card))out=applyFinal(card,out);
  return out;
 };
 vm.build=function(card){
  if(panel(card)&&core.frozen(card))return core.enforceFrozen(card);
  let out=nativeBuild(card);
  if(panel(card))out=applyFinal(card,out);
  return out;
 };
 vm.sceneVarietyIssue=function(card){
  if(panel(card))return core.sceneVarietyIssue(card);
  return nativeVariety?nativeVariety(card):'';
 };
 vm.__nerCore4BridgeV400=true;
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
 const p=window.LDVideoModes?.prompt?.(card)||core.currentPrompt(card);
 if(p&&!core.frozen(card))applyFinal(card,p);
 const result=core.validateCard(card);
 card.dataset.nerCorePreflight=result.ok?'pass':'fail';
 card.dataset.nerCoreVersion=core.version;
 window.dispatchEvent(new CustomEvent('ner:core4-preflight',{detail:{stage:card.dataset.stage,result}}));
 return result;
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

document.addEventListener('pointerdown',e=>{
 if(!e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))return;
 const card=targetCard();if(card)preflight(card);
},true);
document.addEventListener('click',e=>{
 if(!e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))return;
 const card=targetCard();if(card&&!core.frozen(card))preflight(card);
},true);

window.addEventListener('ld:production-built',()=>setTimeout(()=>{patchVideoModes();const c=targetCard();if(c)preflight(c);},0));
window.addEventListener('load',()=>setTimeout(patchVideoModes,0));
[0,50,150,400,900].forEach(ms=>setTimeout(patchVideoModes,ms));

window.NERCore4Bridge=Object.freeze({version:'4.0.0',patchVideoModes,preflight,repairEventPack,targetCard});
window.dispatchEvent(new CustomEvent('ner:core4-bridge-ready',{detail:{version:'4.0.0'}}));
})();
/* NER Studio — Final Prompt Canonicalizer v1.0.0
   Last-pass local cleanup for unfinished T2V panels.
   Event-pack metadata outranks generic role defaults; anime wording stays illustration-safe.
   No API calls, polling, MutationObserver, or approved-panel mutation. */
(()=>{'use strict';
if(window.__ldFinalPromptCanonicalizerV100)return;
window.__ldFinalPromptCanonicalizerV100=true;
const VERSION='1.0.0';

function stage(card){return String(card?.dataset?.stage||'').toUpperCase();}
function panel(card){return !!card&&/^P(?:[1-9]|1[0-4])$/.test(stage(card));}
function unfinished(card){return panel(card)&&!card.querySelector('.done-toggle')?.checked&&!window.NERCore4?.frozen?.(card);}
function anime(){
 const locked=window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle;
 if(locked==='anime'||locked==='real')return locked==='anime';
 const selected=document.getElementById('visualMode')?.value;
 if(selected==='anime'||selected==='real')return selected==='anime';
 return localStorage.getItem('ld-auto-visual-mode-v1')!=='real';
}
function clean(v){return String(v||'').replace(/\s+/g,' ').trim();}
function slug(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function scene(card){return String(card?.querySelector('.video-scene')?.value||card?.dataset?.videoScene||'');}
function rawPackSpec(card){
 const core=window.NERCore4;if(!core||!panel(card))return null;
 try{const p=core.eventPack?.(core.topic?.()||'',stage(card));return p?.spec?.(stage(card))||null;}catch{return null;}
}
function structured(card){
 const core=window.NERCore4;
 const base=core?.spec?.(card)||{};
 const raw=rawPackSpec(card)||{};
 const sc=scene(card);
 let eventRole=clean(raw.eventRole||raw.eventBeat||base.eventRole||raw.label||base.label||base.role||'');
 let locationType=clean(raw.locationType||base.locationType||'event-specific-setting');
 let actionType=clean(raw.actionType||base.actionType||'documented-action');
 let cameraType=clean(raw.cameraType||raw.camera||base.cameraType||'event-camera');
 let hazardPhase=clean(raw.hazardPhase||base.hazardPhase||'');

 // Current Aberfan P9 predates explicit structured fields in its event-pack object.
 // Keep this compatibility fallback local to that lock while the generic mechanism
 // above supports future event packs that provide explicit fields directly.
 if(/ABERFAN P9 SUSTAINED-RESCUE LOCK V1\.0/i.test(sc)){
  eventRole='sustained-rescue-and-first-visible-extraction';
  locationType='settled-Pantglas-rescue-opening';
  actionType='assisted-survivor-extraction';
  cameraType='stable-human-height-medium-wide-three-quarter-rescue-axis';
  hazardPhase='response';
 }
 if(!eventRole&&raw.key)eventRole=slug(raw.key);
 return {
  family:clean(raw.family||base.family||'event-specific'),
  role:clean(raw.role||base.role||raw.label||'event-specific'),
  eventRole:eventRole||clean(base.role||'event-specific'),
  locationType,actionType,cameraType,hazardPhase,
  source:rawPackSpec(card)?'event-pack':clean(base.source||'core4')
 };
}
function contract(card){
 const s=structured(card);
 return 'NER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:\n'
  +'Family: '+s.family+'.\n'
  +'Role: '+s.role+'.\n'
  +'Event beat: '+s.eventRole+'.\n'
  +'Location type: '+s.locationType+'.\n'
  +'Action type: '+s.actionType+'.\n'
  +'Camera type: '+s.cameraType+'.\n'
  +'Hazard phase: '+s.hazardPhase+'.\n'
  +'This contract organizes continuity and local validation; it is NOT a factual source and may not invent facts beyond the approved narration/research.';
}
function specificAction(action){
 const a=clean(action).toLowerCase();
 if(!a)return '';
 const generic=new Set(['ordinary-activity','observe-context','react-to-onset','survive-or-support','witness-aftermath','move-toward-safety','assist-or-assess','review-evidence','repair-or-adapt','reflect-or-remember','documented-action']);
 return generic.has(a)?'':a;
}
function animeSafe(text){
 let s=String(text||'');if(!anime())return s;
 const replacements=[
  [/subtle realistic blinking/gi,'subtle natural blinking'],
  [/realistic weight shifts/gi,'natural weight shifts'],
  [/that can realistically read at that scale/gi,'that remain naturally readable at that scale'],
  [/Grounded realistic adult anatomy/gi,'Grounded proportional 2D anime adult anatomy'],
  [/Grounded adult human proportions/gi,'Grounded proportional 2D anime adult anatomy'],
  [/Documentary-style cinematic staging/gi,'Historical-anime cinematic staging'],
  [/Cinematic historical-documentary composition/gi,'Cinematic illustrated historical-anime composition'],
  [/Cinematic documentary composition/gi,'Cinematic illustrated historical-anime composition']
 ];
 for(const [re,to] of replacements)s=s.replace(re,to);
 return s;
}
function canonicalize(card,text){
 let s=animeSafe(text);if(!unfinished(card)||!s)return s;
 const raw=rawPackSpec(card);
 if(raw||/CORE 4 EVENT-SPECIFIC SCENE|ABERFAN P9 SUSTAINED-RESCUE LOCK/i.test(scene(card))){
  const sp=structured(card);
  const action=specificAction(sp.actionType);
  if(action){
   const phrase=action.replace(/-/g,' ');
   s=s.replace(/(^|\n)MOTION BUDGET:[^\n]*/i,(m,p)=>p+'MOTION BUDGET: ONE '+phrase+' primary action plus 1–3 restrained secondary motions. Background motion supports the primary action only.');
  }
  s=s.replace(/\n\nNER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:[\s\S]*$/i,'');
  s=s.trim()+'\n\n'+contract(card);
 }
 return s;
}
function sync(card,out){
 if(!card||!out)return out;
 card.dataset.textVideoPrompt=out;
 const f=card.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;
 return out;
}
function patch(){
 const vm=window.LDVideoModes;if(!vm||vm.__finalPromptCanonicalizerV100)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){return sync(card,canonicalize(card,nativePrompt(card)));};
 vm.build=function(card){return sync(card,canonicalize(card,nativeBuild(card)));};
 vm.__finalPromptCanonicalizerV100=true;
 return true;
}
function applyCurrent(){
 patch();
 document.querySelectorAll('.stage-card').forEach(card=>{
  if(!unfinished(card)||card.dataset.videoMode!=='text')return;
  const current=String(card.querySelector('.text-video-prompt')?.value||card.dataset.textVideoPrompt||'');
  if(!current)return;
  const next=canonicalize(card,current);if(next!==current)sync(card,next);
 });
}
window.addEventListener('ld:production-built',()=>queueMicrotask(applyCurrent));
window.addEventListener('ld:project-opened',()=>queueMicrotask(applyCurrent));
document.addEventListener('click',e=>{if(e.target.closest('#ldSmartContinueBtn,#ldSmartStickyBtn,.generate-template-btn,#generateAllBtn'))queueMicrotask(applyCurrent);},true);
applyCurrent();
window.LDFinalPromptCanonicalizer=Object.freeze({version:VERSION,canonicalize,structured,contract,apply:applyCurrent});
})();

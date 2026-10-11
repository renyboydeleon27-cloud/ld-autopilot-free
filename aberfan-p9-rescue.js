/* NER Studio — Aberfan P9 sustained rescue / extraction continuity v1.0.0
   Event-specific chronology guard. Keeps P9 in the same Pantglas rescue zone established by P8
   and prevents generic numeric-panel camera widening from overriding the response beat. */
(()=>{'use strict';
if(window.__ldAberfanP9RescueV100)return;
window.__ldAberfanP9RescueV100=true;

const VERSION='1.0.0';
const ABERFAN_RE=/aberfan\s+disaster.*(?:wales|1966)|aberfan.*1966/i;
const LOCK='ABERFAN P9 SUSTAINED-RESCUE LOCK V1.0';
const CAMERA='CINEMATIC CAMERA DIRECTOR: one stable human-height medium-wide three-quarter rescue view anchored on the SAME settled debris opening carried forward from P8, with at most one restrained slow lateral drift following the extraction action. Keep the opening, rescuers, survivor support, footing, wet coal waste and damaged school edge readable on one coherent axis. No wide observational reveal, no pull-back to a broad aftermath overview, no elevated view, no orbit, no hazard-trailing composition, no camera shake, no second camera move and no return to impact escalation.';
const HANDOFF='PANEL HANDOFF MEMORY: APPROVED P8 established one settled rescue working edge beside the partially buried Pantglas Junior School ruins, with wet/misty conditions, dense black coal-waste/rubble, irreversible P7 damage and adults manually clearing one specific debris opening. P9 continues at that SAME rescue opening after sustained work: preserve the wet/misty atmosphere, dense wet black coal-waste/rubble material identity, damaged school geometry and safe working-zone axis. Advance from digging-only to one restrained survivor-assistance/extraction beat. Do not replay school impact, widen back into generic destruction, reset the weather/material state or begin memorial/statistics imagery.';
const CONTRACT='NER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:\nFamily: landslide.\nRole: response.\nEvent beat: sustained-rescue-and-first-visible-extraction.\nLocation type: settled-Pantglas-rescue-opening.\nAction type: assisted-survivor-extraction.\nCamera type: stable-human-height-medium-wide-three-quarter-rescue-axis.\nHazard phase: response.\nThis contract organizes continuity and local validation; it is NOT a factual source and may not invent facts beyond the approved narration/research.';
const PROGRESSION='DISASTER-FAMILY PROGRESSION LOCK:\nFamily: Landslide / coal-tip collapse.\nStage: P9.\nStory role: response · sustained rescue / extraction.\nStage guard: P8 already established adults digging one settled rescue opening. P9 advances exactly one beat to sustained rescue with one restrained survivor-assistance/extraction action at that same opening. The coal-waste front is no longer active. No new collapse, widening impact, school-strike replay or broad aftermath reveal.\nEvidence guard: Approved narration states rescuers worked for hours pulling children and adults from the wreckage as the scale of the disaster emerged. Represent this with unnamed adult rescuers and one clearly living adult-sized survivor only; do not invent a named person, visible child, injury detail, specialized procedure or dramatic casualty tableau.\nStop before death-toll statistics, mourning, tribunal findings or legacy imagery.';
const SCENE='KEEP CURRENT SCENE — '+LOCK+' — CORE 4 EVENT-SPECIFIC SCENE — P9 · landslide · response / sustained rescue and first visible extraction. LOCATION: the SAME clearly bounded rescue opening beside the settled, partially buried Pantglas Junior School ruins established in approved P8, Aberfan, Wales, 1966. Preserve the existing wet/misty atmosphere, dense wet black coal-waste mixed with rubble, irreversible school damage and the safe working-zone geometry. PRIMARY VISUAL ACTION: a small group of visually distinct unnamed adult rescuers completes ONE restrained assisted extraction of ONE clearly living adult-sized survivor from the same opening. The survivor is conscious or visibly responsive, clothed in period-appropriate attire, and shows no graphic injury. Two rescuers support the survivor under the arms/upper torso while a third adult keeps loose debris clear and stabilizes footing. CAMERA: one stable human-height medium-wide three-quarter rescue view anchored on the same opening, with at most one restrained slow lateral drift following the extraction; do not pull back into a wide observational reveal. TIMING: 0.0–2.0s: continue directly from P8 at the same opening; rescuers finish clearing the immediate edge and establish hand contact/support with the adult-sized survivor. 2.0–7.0s: two adults perform one physically believable coordinated lift-and-assist from the opening while the third clears/stabilizes; bodies and debris keep identity, scale and weight. 7.0–10.0s: the survivor reaches a stable supported kneeling or standing position immediately beside the same opening while rescuers maintain support and continue focused work. No visible children, no bodies, no gore, no fresh collapse, no renewed coal-waste surge, no crowd clones, no sirens, no dialogue, no music. Natural wet-rubble ambience, restrained adult exertion, footsteps and physically motivated debris-handling sounds only.';

function stageName(card){return String(card?.dataset?.stage||card?.querySelector?.('.stage-name')?.textContent||'').trim().toUpperCase().replace(/^P0?/,'P');}
function topic(){const typed=document.getElementById('topic')?.value?.trim();if(typed)return typed;const title=document.getElementById('projectTitle')?.textContent?.trim();return title&&title!=='No production yet'?title:'';}
function isP9(card){
 if(!card||stageName(card)!=='P9'||!ABERFAN_RE.test(topic()))return false;
 const n=String(card.querySelector('.narration')?.value||'');
 return /rescuers worked for hours|pulling children and adults|from the wreckage|true scale of the disaster/i.test(n);
}
function pack(){return {version:VERSION,matches:v=>ABERFAN_RE.test(String(v||topic())),manages:(v,stage)=>String(stage||'').toUpperCase()==='P9',spec:()=>({key:'PANTGLAS SUSTAINED RESCUE EXTRACTION',label:'response',scene:SCENE,timing:'0.0–2.0s continue at same P8 opening and establish survivor support; 2.0–7.0s one coordinated assisted extraction; 7.0–10.0s stable supported survivor beside same opening.',camera:CAMERA.replace(/^CINEMATIC CAMERA DIRECTOR:\s*/i,''),handoff:HANDOFF.replace(/^PANEL HANDOFF MEMORY:\s*/i,'')})};}
function registerPack(){
 const core=window.NERCore4;if(!core?.registerPack)return false;
 if(!window.LDAberfanP9EventPack)window.LDAberfanP9EventPack=Object.freeze(pack());
 try{core.registerPack(window.LDAberfanP9EventPack);return true;}catch{return false;}
}
function forceScene(){
 registerPack();
 const card=document.querySelector('.stage-card[data-stage="P9"]');
 if(!isP9(card)||card.querySelector('.done-toggle')?.checked||window.NERCore4?.frozen?.(card))return false;
 const current=String(card.querySelector('.video-scene')?.value||card.dataset.videoScene||'');
 if(current.includes(LOCK)){card.dataset.sceneChoice='keep';return false;}
 card.dataset.sceneChoice='keep';
 card.dataset.videoScene=SCENE;
 card.dataset.nerCoreSceneOwned='1';
 const field=card.querySelector('.video-scene');
 if(field){field.value=SCENE;field.dispatchEvent(new Event('input',{bubbles:true}));}
 card.dataset.textVideoPrompt='';
 card.dataset.textVideoSignature='';
 delete card.dataset.smartReady;
 delete card.dataset.smartReadySignature;
 const promptField=card.querySelector('.text-video-prompt');if(promptField)promptField.value='';
 window.dispatchEvent(new CustomEvent('ld:smart-ready-changed',{detail:{stage:'P9',ready:false,signature:'',reason:'aberfan-p9-sustained-rescue-v100'}}));
 try{window.LDCore?.saveCurrent?.();}catch{}
 return true;
}
function sanitize(text,card){
 let s=String(text||'');
 if(!s||!isP9(card))return s;
 s=s.replace(/DISASTER-FAMILY PROGRESSION LOCK:[\s\S]*?(?=\n\nPANEL SCENE:)/i,PROGRESSION);
 s=s.replace(/PANEL SCENE:\n[\s\S]*?(?=\n\nPANEL SCENE IDENTITY LOCK:)/i,'PANEL SCENE:\n'+SCENE);
 s=s.replace(/PANEL SCENE IDENTITY LOCK:[\s\S]*?(?=\n\nNARRATIVE CONTEXT — not spoken, not on screen:)/i,'PANEL SCENE IDENTITY LOCK: P8 established the settled Pantglas rescue opening and manual digging. P9 stays at the same rescue edge and advances to one restrained assisted extraction. Preserve wet/misty conditions, dense wet black coal-waste/rubble appearance and irreversible school damage; do not widen to generic aftermath or replay impact.');
 s=s.replace(/PANEL HANDOFF MEMORY(?:\s*—[^:\n]*)?:[\s\S]*?(?=\n\nANCHOR OBJECT SYSTEM:)/i,HANDOFF);
 s=s.replace(/CINEMATIC CAMERA DIRECTOR:[^\n]*/gi,CAMERA);
 s=s.replace(/INTENSITY:[^\n]*/i,'INTENSITY: 5/10 · sustained focused rescue/assisted extraction. Intensity follows the response role, not panel number.');
 s=s.replace(/MOTION BUDGET:[^\n]*/i,'MOTION BUDGET: ONE coordinated assisted-survivor extraction as the primary action plus restrained hand-clearing/support motions only.');
 s=s.replace(/CURRENT PROGRESSION ROLE:[^\n]*/gi,'CURRENT PROGRESSION ROLE: sustained rescue at the same Pantglas debris opening · one assisted survivor extraction.');
 s=s.replace(/\n\nNER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:[\s\S]*?(?=\n\n(?:PRODUCTION DNA OPTIMIZER LOCK:|ABERFAN P9|HUMAN MICRO-LIFE LOCK|EDITORIAL NARRATION CONTRACT|FINAL 2D ANIME STYLE VERIFICATION|$))/i,'\n\n'+CONTRACT+'\n\n');
 s=s.replace(/\n\nABERFAN P9 SUSTAINED-RESCUE LOCK V1\.[0-9]+[\s\S]*?(?=\n\n(?:HUMAN MICRO-LIFE LOCK|EDITORIAL NARRATION CONTRACT|FINAL 2D ANIME STYLE VERIFICATION|$))/i,'');
 if(!s.includes(LOCK))s+='\n\n'+LOCK+' — HIGHEST PRIORITY: P9 continues the same settled Pantglas rescue opening from P8. Preserve wet/misty conditions, dense wet black coal-waste/rubble and existing school damage. Show one restrained assisted extraction of one clearly living adult-sized survivor only. No visible children, bodies, gore, renewed slide, new collapse, broad aftermath reveal, morphing, live action or embedded text.';
 return s;
}
function sync(card,out){
 if(!card||!out)return out;
 card.dataset.textVideoPrompt=out;
 const f=card.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;
 return out;
}
function patchVideoModes(){
 const vm=window.LDVideoModes;
 if(!vm||vm.__aberfanP9RescueV100)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){return sync(card,sanitize(nativePrompt(card),card));};
 vm.build=function(card){return sync(card,sanitize(nativeBuild(card),card));};
 vm.__aberfanP9RescueV100=true;
 return true;
}
function apply(){registerPack();patchVideoModes();forceScene();}
document.addEventListener('DOMContentLoaded',()=>queueMicrotask(apply),{once:true});
window.addEventListener('load',()=>queueMicrotask(apply),{once:true});
window.addEventListener('ld:production-built',()=>queueMicrotask(apply));
window.addEventListener('ld:project-opened',()=>queueMicrotask(apply));
document.addEventListener('click',e=>{if(e.target.closest('#ldSmartContinueBtn,#ldSmartStickyBtn,.generate-template-btn,#generateAllBtn'))queueMicrotask(apply);},true);
apply();
window.LDAberfanP9Rescue=Object.freeze({version:VERSION,apply,sanitize,scene:SCENE,camera:CAMERA,handoff:HANDOFF});
})();
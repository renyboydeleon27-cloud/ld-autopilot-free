(()=>{'use strict';
const plans={
 HOOK:'slow push-in, approximately 3–4% across the full 10-second shot; for earthquakes only, allow extremely restrained documentary vibration layered beneath the push-in',
 P1:'slow track right with gentle foreground parallax',
 P2:'slow push-in, approximately 2–3%',
 P3:'slow track left with stable horizon and gentle parallax',
 P4:'slow pull-back, approximately 3–4%, gradually revealing environmental scale',
 P5:'gentle pan right from a fixed camera position',
 P6:'slow track right with restrained documentary framing',
 P7:'slow push-in, approximately 3–4%, toward the primary action',
 P8:'slow track left with clear foreground/midground/background parallax',
 P9:'slow pull-back, approximately 3–5%, revealing the wider aftermath',
 P10:'gentle pan left, smooth and continuous',
 P11:'slow track right, maintaining stable human proportions and geometry',
 P12:'slow push-in, approximately 2–3%, toward the key recovery or impact detail',
 P13:'slow track left, calm documentary pace',
 P14:'slow pull-back, approximately 3–5%, ending on the wider legacy/recovery scene'
};
const ABERFAN_RE=/aberfan\s+disaster.*(?:wales|1966)|aberfan.*1966/i;
const P7_LOCK='ABERFAN P7 SCHOOL-IMPACT LOCK V1.0';
const P7_CAMERA='CINEMATIC CAMERA DIRECTOR: one stable human-height three-quarter exterior side-depth view with at most one restrained slow lateral drift parallel to the school frontage. Keep the school impact point, building geometry and incoming coal-waste direction readable on one coherent axis for the full 10 seconds. No elevated overview, no orbit, no deep-perspective camera change, no second camera move, no zoom pumping, no camera reset and no sensational victim close-up.';
const P7_SCENE='KEEP CURRENT SCENE — '+P7_LOCK+' — CORE 4 EVENT-SPECIFIC SCENE — P7 · landslide · human-impact / school structural impact. LOCATION: the still-recognizable exterior frontage of Pantglas Junior School in Aberfan, Wales, 1966, continuing the wet/misty atmosphere and the approach direction established in approved P6. The school is the primary structural subject. No visible minors are required. PRIMARY VISUAL ACTION: the already-moving dense wet black coal-waste spoil/slurry and entrained village debris reaches the school edge, makes direct physical contact, progressively loads and crushes a limited wall/window/frontage section, then pushes and piles the same dense material into and against the affected classroom zone. Structural contact is the primary action; any adult scale reference is optional, protected and strictly secondary. CAMERA: one stable human-height three-quarter exterior side-depth view with at most one restrained slow lateral drift parallel to the school frontage; keep impact point, school geometry and hazard direction readable on one axis. TIMING: 0.0–2.0s: continue directly from P6 with the coal-waste mass entering frame and making first physical contact with the school edge before any school failure. 2.0–7.0s: show one continuous contact-to-failure chain: wet coal spoil presses against the frontage, the wall/window area visibly strains and cracks, then a limited section fails under the moving mass; no spontaneous explosion, no instant whole-building disappearance and no morphing. 7.0–10.0s: the same mass accumulates against and partially buries the affected school/classroom frontage while the remaining visible school geometry stays physically consistent. Stop before rescue, aftermath or casualty imagery. MATERIAL LOCK: dense wet man-made coal spoil/slurry mixed with previously entrained building debris, never smoke, lava, water-only flooding, dust cloud or a natural mountain rock avalanche. No visible children, no bodies, no gore, no crowd, no sirens, no dialogue, no music. Natural rain/mist ambience, heavy moving-mass rumble and physically motivated masonry/timber failure sounds only.';
function stageName(card){return (card?.dataset?.stage||card?.querySelector?.('.stage-name')?.textContent||'').trim().toUpperCase().replace(/^P0?/,'P');}
function topic(){const typed=document.getElementById('topic')?.value?.trim();if(typed)return typed;const title=document.getElementById('projectTitle')?.textContent?.trim();return title&&title!=='No production yet'?title:'';}
function isAberfanP7(card){return !!card&&stageName(card)==='P7'&&ABERFAN_RE.test(topic())&&/slide struck the school|struck the school|crushing walls|burying classrooms/i.test(String(card.querySelector('.narration')?.value||''));}
function forceAberfanP7Scene(){
 const card=document.querySelector('.stage-card[data-stage="P7"]');
 if(!isAberfanP7(card)||card.querySelector('.done-toggle')?.checked||window.NERCore4?.frozen?.(card))return false;
 const current=String(card.querySelector('.video-scene')?.value||card.dataset.videoScene||'');
 if(current.includes(P7_LOCK)){card.dataset.sceneChoice='keep';return false;}
 card.dataset.sceneChoice='keep';
 card.dataset.videoScene=P7_SCENE;
 card.dataset.nerCoreSceneOwned='1';
 const field=card.querySelector('.video-scene');
 if(field){field.value=P7_SCENE;field.dispatchEvent(new Event('input',{bubbles:true}));}
 card.dataset.textVideoPrompt='';
 card.dataset.textVideoSignature='';
 delete card.dataset.smartReady;
 delete card.dataset.smartReadySignature;
 const promptField=card.querySelector('.text-video-prompt');if(promptField)promptField.value='';
 window.dispatchEvent(new CustomEvent('ld:smart-ready-changed',{detail:{stage:'P7',ready:false,signature:'',reason:'aberfan-p7-school-impact-v1'}}));
 try{window.LDCore?.saveCurrent?.();}catch{}
 return true;
}
function sanitizeAberfanP7Prompt(text){
 let s=String(text||'');if(!s)return s;
 s=s.replace(/PANEL SCENE:\n[\s\S]*?(?=\n\nPANEL SCENE IDENTITY LOCK:)/i,'PANEL SCENE:\n'+P7_SCENE);
 s=s.replace(/Story role:[^\n]*/i,'Story role: human-impact · school structural impact / burial.');
 s=s.replace(/Stage guard:[^\n]*/i,'Stage guard: P6 established the intact Pantglas Junior School in the approaching slide path. P7 owns direct school contact, progressive wall/frontage failure and partial burial. Do not regress to another adult-support or onset-only beat.');
 s=s.replace(/INTENSITY:[^\n]*/i,'INTENSITY: 9/10 · school structural impact and burial. Intensity follows the approved P7 narration and contact-to-failure chain.');
 s=s.replace(/CINEMATIC CAMERA DIRECTOR:[^\n]*/gi,P7_CAMERA);
 s=s.replace(/CURRENT PROGRESSION ROLE:[^\n]*/gi,'CURRENT PROGRESSION ROLE: Pantglas Junior School structural impact · direct contact · progressive failure · partial burial.');
 s=s.replace(/MOTION BUDGET:[^\n]*/i,'MOTION BUDGET: ONE hazard-to-school contact/failure/burial chain as the primary action; any human motion remains optional and secondary.');
 s=s.replace(/DEBRIS \+ DAMAGE PHYSICS LOCK:[^\n]*/gi,'DEBRIS + DAMAGE PHYSICS LOCK: ABERFAN P7 SCHOOL-IMPACT OVERRIDE — hazard-to-school contact is primary. Physical contact and load must precede wall/frontage failure; failed masonry/timber and existing debris then move only because the dense coal-waste mass pushes or entrains them. No unrelated collapse, no spontaneous explosion, no whole-building disappearance and no casualty imagery.');
 s=s.replace(/\n\nABERFAN P7 SCHOOL-IMPACT LOCK V1\.[0-9]+[\s\S]*$/i,'');
 s+='\n\n'+P7_LOCK+' — HIGHEST PRIORITY: P7 is the Pantglas Junior School impact beat. The dense wet coal-waste mass directly contacts the school before progressive limited structural failure and partial burial. Structural impact is primary; human motion is optional and secondary. Use one stable human-height three-quarter exterior camera only. No visible children, no bodies, no gore, no morphing, no live action.';
 return s;
}
function patchVideoModes(){
 const vm=window.LDVideoModes;if(!vm||vm.__aberfanP7SchoolImpactV1)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){if(isAberfanP7(card))forceAberfanP7Scene();let out=nativePrompt(card);if(isAberfanP7(card))out=sanitizeAberfanP7Prompt(out);if(isAberfanP7(card)){card.dataset.textVideoPrompt=out;const f=card.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;}return out;};
 vm.build=function(card){if(isAberfanP7(card))forceAberfanP7Scene();let out=nativeBuild(card);if(isAberfanP7(card))out=sanitizeAberfanP7Prompt(out);if(isAberfanP7(card)){card.dataset.textVideoPrompt=out;const f=card.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;}return out;};
 vm.__aberfanP7SchoolImpactV1=true;
 return true;
}
function apply(){
 forceAberfanP7Scene();
 patchVideoModes();
 if(window.LDStoryModes?.enabled())return false;
 document.querySelectorAll('.stage-card').forEach(card=>{
  const st=stageName(card); if(!(st in plans))return;
  if(st==='HOOK'||card.dataset.videoMode==='text'||window.LDProjectLocks?.videoMode?.()==='text')return;
  const el=card.querySelector('.flow-prompt'); if(!el||!el.value.trim())return;
  const marker='ADAPTIVE CAMERA MOTION LOCK:';
  if(el.value.includes(marker))return;
  const text=`${marker} Use one simple professional camera movement only: ${plans[st]}. Begin gently within the first 0.5 seconds and continue smoothly through the full 10-second single continuous shot. The movement must fit and preserve the supplied composition; if the specified direction would reveal unsupported scenery or break geometry, reduce its travel rather than inventing content. No dead-static camera unless physical/historical constraints make movement impossible. No cuts, transitions, orbit, crane flourish, whip pan, crash zoom, speed ramp, dramatic roll/rotation, reframing jump, or complicated effects. Do not alternate directions within the shot. Camera motion must not warp people, architecture, vehicles, props, horizon lines, or background geometry. Existing scene-variety, historical, anatomy, structure, HOOK survival and quality-polish locks remain fully active.`;
  el.value=el.value.trim()+'\n\n'+text;
  el.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
document.addEventListener('click',e=>{
 if(e.target.closest('#ldSmartContinueBtn,#ldSmartStickyBtn')){forceAberfanP7Scene();patchVideoModes();return;}
 if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))setTimeout(apply,120);
},true);
window.addEventListener('ld:production-built',()=>queueMicrotask(apply));
window.addEventListener('ld:project-opened',()=>queueMicrotask(apply));
window.addEventListener('load',()=>setTimeout(apply,250));
patchVideoModes();forceAberfanP7Scene();
window.ldApplyCameraMotion=apply;
window.LDAberfanP7SchoolImpactFix=Object.freeze({version:'1.0',apply:forceAberfanP7Scene,scene:P7_SCENE,sanitize:sanitizeAberfanP7Prompt});
})();
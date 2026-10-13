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

const P7_LOCK='ABERFAN P7 SCHOOL-IMPACT LOCK V1.1';
const P7_CAMERA='CINEMATIC CAMERA DIRECTOR: one stable human-height three-quarter exterior side-depth view with at most one restrained slow lateral drift parallel to the school frontage. Keep the school impact point, building geometry and incoming coal-waste direction readable on one coherent axis for the full 10 seconds. No elevated overview, no orbit, no deep-perspective camera change, no second camera move, no zoom pumping, no camera reset and no sensational victim close-up.';
const P7_HANDOFF='PANEL HANDOFF MEMORY: APPROVED P6 established the still-intact Pantglas Junior School with the already-moving coal-waste mass approaching through mist. P7 advances exactly one beat to direct school contact, progressive limited wall/frontage failure and partial burial. Preserve P6 school geometry, wet/misty atmosphere and hazard approach direction until physical contact changes the affected frontage; do not replay the P6 pre-impact reveal and do not jump ahead to rescue or aftermath.';
const P7_CONTRACT='NER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:\nFamily: landslide.\nRole: human-impact.\nEvent beat: school-structural-impact.\nLocation type: Pantglas-Junior-School-frontage.\nAction type: structural-impact.\nCamera type: stable-human-height-three-quarter-side-depth.\nHazard phase: impact.\nThis contract organizes continuity and local validation; it is NOT a factual source and may not invent facts beyond the approved narration/research.';
const P7_SCENE='KEEP CURRENT SCENE — '+P7_LOCK+' — CORE 4 EVENT-SPECIFIC SCENE — P7 · landslide · human-impact / school structural impact. LOCATION: the still-recognizable exterior frontage of Pantglas Junior School in Aberfan, Wales, 1966, continuing the wet/misty atmosphere and the approach direction established in approved P6. The school is the primary structural subject. No visible minors are required. PRIMARY VISUAL ACTION: the already-moving dense wet black coal-waste spoil/slurry and entrained village debris reaches the school edge, makes direct physical contact, progressively loads and crushes a limited wall/window/frontage section, then pushes and piles the same dense material into and against the affected classroom zone. Structural contact is the primary action; any adult scale reference is optional, protected and strictly secondary. CAMERA: one stable human-height three-quarter exterior side-depth view with at most one restrained slow lateral drift parallel to the school frontage; keep impact point, school geometry and hazard direction readable on one axis. TIMING: 0.0–2.0s: continue directly from P6 with the coal-waste mass entering frame and making first physical contact with the school edge before any school failure. 2.0–7.0s: show one continuous contact-to-failure chain: wet coal spoil presses against the frontage, the wall/window area visibly strains and cracks, then a limited section fails under the moving mass; no spontaneous explosion, no instant whole-building disappearance and no morphing. 7.0–10.0s: the same mass accumulates against and partially buries the affected school/classroom frontage while the remaining visible school geometry stays physically consistent. Stop before rescue, aftermath or casualty imagery. MATERIAL LOCK: dense wet man-made coal spoil/slurry mixed with previously entrained building debris, never smoke, lava, water-only flooding, dust cloud or a natural mountain rock avalanche. No visible children, no bodies, no gore, no crowd, no sirens, no dialogue, no music. Natural rain/mist ambience, heavy moving-mass rumble and physically motivated masonry/timber failure sounds only.';

const P8_LOCK='ABERFAN P8 FIRST-RESCUE LOCK V1.0';
const P8_CAMERA='CINEMATIC CAMERA DIRECTOR: one stable human-height medium-wide three-quarter view of a single safe rescue working zone beside the settled school ruins, with at most one restrained slow lateral drift following the adults’ manual digging action. Keep hands, debris, footing and the same work opening readable. No trailing or receding hazard composition, no widening-impact reveal, no elevated overview, no orbit, no camera shake, no second camera move and no return to the P7 impact axis.';
const P8_HANDOFF='PANEL HANDOFF MEMORY: APPROVED P7 established direct impact and partial burial at Pantglas Junior School. P8 begins immediately after that impact at one settled rescue edge: the moving front is no longer the primary action, P7 damage remains irreversible canon, and adults begin manual digging through the existing rubble/coal waste. Do not replay school contact, wall failure or widening destruction. Do not extract or display a casualty in P8; reserve later sustained rescue/extraction for the next narrated beat.';
const P8_CONTRACT='NER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:\nFamily: landslide.\nRole: response.\nEvent beat: first-manual-rescue-at-school-ruins.\nLocation type: settled-Pantglas-rescue-edge.\nAction type: manual-dig-and-clear.\nCamera type: stable-human-height-rescue-side-depth.\nHazard phase: response.\nThis contract organizes continuity and local validation; it is NOT a factual source and may not invent facts beyond the approved narration/research.';
const P8_PROGRESSION='DISASTER-FAMILY PROGRESSION LOCK:\nFamily: Landslide / coal-tip collapse.\nStage: P8.\nStory role: response · first manual rescue at the school ruins.\nStage guard: P7 owns direct school impact and partial burial. P8 advances to adults arriving and manually digging through settled rubble/coal waste for trapped survivors. The moving coal-waste front is no longer the primary visual action. No new collapse, widening impact or repeated school strike.\nEvidence guard: Approved narration establishes parents, miners, teachers, police and neighbors rushing to the ruins and digging for trapped survivors. Use a small representative adult rescue group only; do not invent named people, specialized equipment or visible casualties.\nStop before a survivor is visibly extracted; P9 may advance the sustained rescue/extraction beat if its narration supports it.';
const P8_SCENE='KEEP CURRENT SCENE — '+P8_LOCK+' — CORE 4 EVENT-SPECIFIC SCENE — P8 · landslide · response / first manual rescue. LOCATION: one clearly bounded safe working edge beside the settled, partially buried Pantglas Junior School ruins in Aberfan, Wales, 1966. Preserve P7 damage, wet/misty conditions and dense black coal-waste/rubble appearance, but the destructive moving front has passed or shifted off-screen and no new structural failure occurs. PRIMARY VISUAL ACTION: a small group of visually distinct unnamed adults representing local rescuers manually dig and clear one specific debris opening. One foreground adult lifts one manageable loose masonry/timber piece from the same opening and passes or places it to the side while a second adult immediately clears smaller loose debris from that opening; a third adult may remain secondary in the background. These adults are representative staging only, not named historical persons. CAMERA: one stable human-height medium-wide three-quarter rescue view with at most one slow lateral drift that follows the same digging zone; do not trail the hazard or reveal widening destruction. TIMING: 0.0–2.0s: establish the settled school rubble/coal-waste edge and two or three adult rescuers already converging on one clear work opening; the foreground adult grips one loose debris piece immediately. 2.0–7.0s: complete one physically believable lift-and-clear cycle at that same opening while the second adult clears smaller material by hand; debris has believable weight and does not float, multiply or morph. 7.0–10.0s: the removed piece reaches a stable side position and the adults continue focused hand-clearing/reassessment at the same opening, ending on urgent human rescue effort rather than renewed hazard motion. No survivor extraction is shown in P8. No visible children, no bodies, no gore, no fresh collapse, no renewed coal-waste surge, no crowd clone, no sirens, no dialogue, no music. Natural wet-rubble ambience, adult exertion/footing sounds and physically motivated stone/timber handling only.';

function stageName(card){return (card?.dataset?.stage||card?.querySelector?.('.stage-name')?.textContent||'').trim().toUpperCase().replace(/^P0?/,'P');}
function topic(){const typed=document.getElementById('topic')?.value?.trim();if(typed)return typed;const title=document.getElementById('projectTitle')?.textContent?.trim();return title&&title!=='No production yet'?title:'';}
function isAberfanP7(card){return !!card&&stageName(card)==='P7'&&ABERFAN_RE.test(topic())&&/slide struck the school|struck the school|crushing walls|burying classrooms/i.test(String(card.querySelector('.narration')?.value||''));}
function isAberfanP8(card){return !!card&&stageName(card)==='P8'&&ABERFAN_RE.test(topic())&&/rushed to the ruins|digging .*debris|trapped survivors|parents.*miners.*teachers.*police.*neighbors/i.test(String(card.querySelector('.narration')?.value||''));}

function p7EventPack(){return {version:'1.1',matches:v=>ABERFAN_RE.test(String(v||topic())),manages:(v,stage)=>String(stage||'').toUpperCase()==='P7',spec:stage=>({key:'PANTGLAS SCHOOL DIRECT STRUCTURAL IMPACT',label:'human-impact',scene:P7_SCENE,timing:'0.0–2.0s direct school contact; 2.0–7.0s progressive limited frontage failure; 7.0–10.0s partial burial while geometry remains coherent.',camera:P7_CAMERA.replace(/^CINEMATIC CAMERA DIRECTOR:\s*/i,''),handoff:P7_HANDOFF.replace(/^PANEL HANDOFF MEMORY:\s*/i,'')})};}
function p8EventPack(){return {version:'1.0',matches:v=>ABERFAN_RE.test(String(v||topic())),manages:(v,stage)=>String(stage||'').toUpperCase()==='P8',spec:stage=>({key:'PANTGLAS FIRST MANUAL RESCUE',label:'response',scene:P8_SCENE,timing:'0.0–2.0s establish one settled rescue opening; 2.0–7.0s complete one manual lift-and-clear cycle; 7.0–10.0s continue focused hand-clearing/reassessment with no survivor extraction.',camera:P8_CAMERA.replace(/^CINEMATIC CAMERA DIRECTOR:\s*/i,''),handoff:P8_HANDOFF.replace(/^PANEL HANDOFF MEMORY:\s*/i,'')})};}
function registerEventPacks(){
 const core=window.NERCore4;if(!core?.registerPack)return false;
 if(!window.LDAberfanP7EventPack)window.LDAberfanP7EventPack=Object.freeze(p7EventPack());
 if(!window.LDAberfanP8EventPack)window.LDAberfanP8EventPack=Object.freeze(p8EventPack());
 try{core.registerPack(window.LDAberfanP7EventPack);core.registerPack(window.LDAberfanP8EventPack);return true;}catch{return false;}
}
function forceScene(stage,lock,sceneText,matcher,reason){
 registerEventPacks();
 const card=document.querySelector('.stage-card[data-stage="'+stage+'"]');
 if(!matcher(card)||card.querySelector('.done-toggle')?.checked||window.NERCore4?.frozen?.(card))return false;
 const current=String(card.querySelector('.video-scene')?.value||card.dataset.videoScene||'');
 if(current.includes(lock)){card.dataset.sceneChoice='keep';return false;}
 card.dataset.sceneChoice='keep';
 card.dataset.videoScene=sceneText;
 card.dataset.nerCoreSceneOwned='1';
 const field=card.querySelector('.video-scene');
 if(field){field.value=sceneText;field.dispatchEvent(new Event('input',{bubbles:true}));}
 card.dataset.textVideoPrompt='';
 card.dataset.textVideoSignature='';
 delete card.dataset.smartReady;
 delete card.dataset.smartReadySignature;
 const promptField=card.querySelector('.text-video-prompt');if(promptField)promptField.value='';
 window.dispatchEvent(new CustomEvent('ld:smart-ready-changed',{detail:{stage,ready:false,signature:'',reason}}));
 try{window.LDCore?.saveCurrent?.();}catch{}
 return true;
}
function forceAberfanP7Scene(){return forceScene('P7','ABERFAN P7 SCHOOL-IMPACT LOCK',P7_SCENE,isAberfanP7,'aberfan-p7-school-impact-v11');}
function forceAberfanP8Scene(){return forceScene('P8','ABERFAN P8 FIRST-RESCUE LOCK',P8_SCENE,isAberfanP8,'aberfan-p8-first-rescue-v10');}

function sanitizeAberfanP7Prompt(text){
 let s=String(text||'');if(!s)return s;
 s=s.replace(/PANEL SCENE:\n[\s\S]*?(?=\n\nPANEL SCENE IDENTITY LOCK:)/i,'PANEL SCENE:\n'+P7_SCENE);
 s=s.replace(/PANEL HANDOFF MEMORY(?:\s*—[^:\n]*)?:[\s\S]*?(?=\n\nANCHOR OBJECT SYSTEM:)/i,P7_HANDOFF);
 s=s.replace(/Story role:[^\n]*/i,'Story role: human-impact · school structural impact / burial.');
 s=s.replace(/Stage guard:[^\n]*/i,'Stage guard: P6 established the intact Pantglas Junior School in the approaching slide path. P7 owns direct school contact, progressive wall/frontage failure and partial burial. Do not regress to another adult-support or onset-only beat.');
 s=s.replace(/INTENSITY:[^\n]*/i,'INTENSITY: 9/10 · school structural impact and burial. Intensity follows the approved P7 narration and contact-to-failure chain.');
 s=s.replace(/CINEMATIC CAMERA DIRECTOR:[^\n]*/gi,P7_CAMERA);
 s=s.replace(/CURRENT PROGRESSION ROLE:[^\n]*/gi,'CURRENT PROGRESSION ROLE: Pantglas Junior School structural impact · direct contact · progressive failure · partial burial.');
 s=s.replace(/MOTION BUDGET:[^\n]*/i,'MOTION BUDGET: ONE hazard-to-school contact/failure/burial chain as the primary action; any human motion remains optional and secondary.');
 s=s.replace(/DEBRIS \+ DAMAGE PHYSICS LOCK:[^\n]*/gi,'DEBRIS + DAMAGE PHYSICS LOCK: ABERFAN P7 SCHOOL-IMPACT OVERRIDE — hazard-to-school contact is primary. Physical contact and load must precede wall/frontage failure; failed masonry/timber and existing debris then move only because the dense coal-waste mass pushes or entrains them. No unrelated collapse, no spontaneous explosion, no whole-building disappearance and no casualty imagery.');
 s=s.replace(/\n\nNER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:[\s\S]*$/i,'\n\n'+P7_CONTRACT);
 s=s.replace(/\n\nABERFAN P7 SCHOOL-IMPACT LOCK V1\.[0-9]+[\s\S]*$/i,'');
 s+='\n\n'+P7_LOCK+' — HIGHEST PRIORITY: P7 is the Pantglas Junior School impact beat. The dense wet coal-waste mass directly contacts the school before progressive limited structural failure and partial burial. Structural impact is primary; human motion is optional and secondary. Use one stable human-height three-quarter exterior camera only. No visible children, no bodies, no gore, no morphing, no live action.';
 return s;
}
function sanitizeAberfanP8Prompt(text){
 let s=String(text||'');if(!s)return s;
 s=s.replace(/DISASTER-FAMILY PROGRESSION LOCK:[\s\S]*?(?=\n\nPANEL SCENE:)/i,P8_PROGRESSION);
 s=s.replace(/PANEL SCENE:\n[\s\S]*?(?=\n\nPANEL SCENE IDENTITY LOCK:)/i,'PANEL SCENE:\n'+P8_SCENE);
 s=s.replace(/PANEL SCENE IDENTITY LOCK:[\s\S]*?(?=\n\nNARRATIVE CONTEXT — not spoken, not on screen:)/i,'PANEL SCENE IDENTITY LOCK: P7 was the direct Pantglas school-impact beat. P8 intentionally changes to a settled rescue edge and manual adult digging at one debris opening. Preserve P7 damage, weather and material identity, but do not repeat school contact, wall failure, the P7 camera axis or active hazard escalation.');
 s=s.replace(/PANEL HANDOFF MEMORY(?:\s*—[^:\n]*)?:[\s\S]*?(?=\n\nANCHOR OBJECT SYSTEM:)/i,P8_HANDOFF);
 s=s.replace(/Story role:[^\n]*/i,'Story role: response · first manual rescue at the school ruins.');
 s=s.replace(/Stage guard:[^\n]*/i,'Stage guard: P7 owns direct school impact. P8 owns the first settled manual rescue/digging beat. No renewed slide, widening destruction or survivor extraction yet.');
 s=s.replace(/INTENSITY:[^\n]*/i,'INTENSITY: 6/10 · urgent human rescue effort after impact. Intensity comes from focused manual digging, unstable-looking but settled debris and human urgency, not renewed hazard escalation.');
 s=s.replace(/CINEMATIC INTENSITY CURVE:[^\n]*/i,'CINEMATIC INTENSITY CURVE: Semantic target: 6/10 · urgent immediate rescue. Do not return to peak impact or widening destruction.');
 s=s.replace(/CINEMATIC CAMERA DIRECTOR:[^\n]*/gi,P8_CAMERA);
 s=s.replace(/CURRENT PROGRESSION ROLE:[^\n]*/gi,'CURRENT PROGRESSION ROLE: Immediate human response · adults manually digging at the settled Pantglas school ruins.');
 s=s.replace(/MOTION BUDGET:[^\n]*/i,'MOTION BUDGET: ONE manual lift-and-clear rescue cycle as the primary action plus 1–2 restrained supporting hand/footing motions. No active hazard movement is primary.');
 s=s.replace(/DEBRIS \+ DAMAGE PHYSICS LOCK:[^\n]*/gi,'DEBRIS + DAMAGE PHYSICS LOCK: ABERFAN P8 RESCUE OVERRIDE — P7 damage is settled, irreversible canon. Adults may move only loose manageable debris through visible hand contact and believable weight. No fresh structural collapse, no renewed coal-waste surge, no floating debris, no spontaneous clearing and no visible casualty extraction.');
 s=s.replace(/PHYSICS AND TIME:[^\n]*/i,'PHYSICS AND TIME: the destructive slide impact has already occurred. Show only settled rubble/coal waste and physically believable adult manual clearing at one work opening; no new impact, no renewed flow and no structural reset.');
 s=s.replace(/\n\nNER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:[\s\S]*$/i,'\n\n'+P8_CONTRACT);
 s=s.replace(/\n\nABERFAN P8 FIRST-RESCUE LOCK V1\.[0-9]+[\s\S]*$/i,'');
 s+='\n\n'+P8_LOCK+' — HIGHEST PRIORITY: P8 is the first immediate manual-rescue beat after the Pantglas school impact. Adults dig and clear one settled debris opening; no active slide, no widening impact, no new collapse and no survivor extraction. Use one stable human-height rescue camera only. No visible children, bodies, gore, morphing or live action.';
 return s;
}
function patchVideoModes(){
 const vm=window.LDVideoModes;if(!vm||vm.__aberfanP7P8FixV12)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){
  if(isAberfanP7(card)){registerEventPacks();forceAberfanP7Scene();}
  if(isAberfanP8(card)){registerEventPacks();forceAberfanP8Scene();}
  let out=nativePrompt(card);
  if(isAberfanP7(card))out=sanitizeAberfanP7Prompt(out);
  if(isAberfanP8(card))out=sanitizeAberfanP8Prompt(out);
  if(isAberfanP7(card)||isAberfanP8(card)){card.dataset.textVideoPrompt=out;const f=card.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;}
  return out;
 };
 vm.build=function(card){
  if(isAberfanP7(card)){registerEventPacks();forceAberfanP7Scene();}
  if(isAberfanP8(card)){registerEventPacks();forceAberfanP8Scene();}
  let out=nativeBuild(card);
  if(isAberfanP7(card))out=sanitizeAberfanP7Prompt(out);
  if(isAberfanP8(card))out=sanitizeAberfanP8Prompt(out);
  if(isAberfanP7(card)||isAberfanP8(card)){card.dataset.textVideoPrompt=out;const f=card.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;}
  return out;
 };
 vm.__aberfanP7P8FixV12=true;
 return true;
}
function apply(){
 registerEventPacks();
 forceAberfanP7Scene();
 forceAberfanP8Scene();
 patchVideoModes();
 if(window.LDStoryModes?.enabled())return false;
 document.querySelectorAll('.stage-card').forEach(card=>{
  if(window.NERCore5Runtime?.owns(card))return;
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
 if(e.target.closest('#ldSmartContinueBtn,#ldSmartStickyBtn')){registerEventPacks();forceAberfanP7Scene();forceAberfanP8Scene();patchVideoModes();return;}
 if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))setTimeout(apply,120);
},true);
window.addEventListener('ner:core4-loaded',()=>queueMicrotask(()=>{registerEventPacks();apply();}));
window.addEventListener('ld:production-built',()=>queueMicrotask(apply));
window.addEventListener('ld:project-opened',()=>queueMicrotask(apply));
window.addEventListener('load',()=>setTimeout(apply,250));
registerEventPacks();patchVideoModes();forceAberfanP7Scene();forceAberfanP8Scene();
window.ldApplyCameraMotion=apply;
window.LDAberfanP7SchoolImpactFix=Object.freeze({version:'1.1',apply:forceAberfanP7Scene,scene:P7_SCENE,sanitize:sanitizeAberfanP7Prompt,registerPack:registerEventPacks});
window.LDAberfanP8RescueFix=Object.freeze({version:'1.0',apply:forceAberfanP8Scene,scene:P8_SCENE,sanitize:sanitizeAberfanP8Prompt,registerPack:registerEventPacks});
})();
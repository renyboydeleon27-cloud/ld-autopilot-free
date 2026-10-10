/* NER Studio — Aberfan P4 mist/rumble scene lock v1.0
   Prevents P4 from repeating P3's hazard-onset fingerprint. P3 owns the first
   visible coal-tip collapse; P4 moves to a village doorway/street viewpoint where
   mist obscures the approaching slide and an adult hears the deep rumble.
   Local-only scene repair; no API calls. Approved/frozen P4 is never rewritten. */
(function(){'use strict';
if(window.__ldAberfanP4FixV10)return;
window.__ldAberfanP4FixV10=true;
const VERSION='1.0';
const TOPIC_RE=/aberfan\s+disaster.*(?:wales|1966)|aberfan.*1966/i;
const LOCK='ABERFAN P4 MIST-RUMBLE LOCK V1.0';
const SCENE='KEEP CURRENT SCENE — '+LOCK+' — CORE 4 FAMILY-PLANNED SCENE — P4 · landslide · onset. LOCATION: a different village-level setup from P3: a narrow 1966 Aberfan village street immediately outside an intact terraced-house doorway, with the house wall and doorway as foreground scale, intact neighboring terraces in the midground, and the mist-obscured coal-waste slope aligned in the distant background. PRIMARY ACTION: one unnamed adult resident stands beside the doorway, pauses at the sudden deep rumble, raises the head toward the sound, then takes one short backward step toward the doorway while keeping attention on the mist; this is a listening/orienting beat, not another P3 retreat-from-the-first-collapse shot. CAMERA: mostly locked doorway-side human-height framing with only a very slow lateral drift, preserving the street, doorway and obscured hillside on one coherent axis. TIMING: 0.0–2.0s: establish the intact doorway, adult and mist-limited village depth; the adult visibly pauses as the deep rumble begins, with no building impact. 2.0–7.0s: the adult raises the head toward the sound and makes one short backward step toward the doorway while mist shifts naturally across the background; through the haze, only partial dark movement of the already-moving coal-waste mass becomes intermittently readable. 7.0–10.0s: the mist thins just enough to make the approaching dark coal-waste mass unmistakable behind the village while the adult holds near the doorway, tense and listening. Preserve P3 canon that the coal-tip collapse has already begun, but do NOT replay the initial breakaway. Stop before any structure is struck. No school impact, no crushed buildings, no peak destruction, no children, no crowd, no siren, no dialogue, no music. Natural mist/rain ambience and a physically grounded deep rumble only. FAMILY PHYSICS: the moving material is dense wet man-made coal spoil/slurry and debris traveling downslope under gravity, never smoke, lava, a water-only flood, or a natural mountain rock avalanche.';

function topic(){
 const typed=document.getElementById('topic')?.value?.trim();
 if(typed)return typed;
 const title=document.getElementById('projectTitle')?.textContent?.trim();
 return title&&title!=='No production yet'?title:'';
}
function card(){return document.querySelector('.stage-card[data-stage="P4"]');}
function target(c){
 if(!c||!TOPIC_RE.test(topic()))return false;
 if(c.querySelector('.done-toggle')?.checked)return false;
 if(window.NERCore4?.frozen?.(c))return false;
 return true;
}
function currentScene(c){return String(c?.querySelector('.video-scene')?.value||c?.dataset?.videoScene||'').trim();}
function valid(c){return currentScene(c).includes(LOCK);}
function clearGenerated(c){
 c.dataset.textVideoPrompt='';
 c.dataset.textVideoSignature='';
 delete c.dataset.smartReady;
 delete c.dataset.smartReadySignature;
 const p=c.querySelector('.text-video-prompt');
 if(p)p.value='';
 window.dispatchEvent(new CustomEvent('ld:smart-ready-changed',{detail:{stage:'P4',ready:false,signature:'',reason:'aberfan-p4-scene-lock'}}));
}
function apply(){
 const c=card();
 if(!target(c))return false;
 if(valid(c)){
   c.dataset.sceneChoice='keep';
   c.dataset.aberfanP4Lock=VERSION;
   return true;
 }
 c.dataset.sceneChoice='keep';
 c.dataset.videoScene=SCENE;
 c.dataset.aberfanP4Lock=VERSION;
 const f=c.querySelector('.video-scene');
 if(f){f.value=SCENE;f.dispatchEvent(new Event('input',{bubbles:true}));}
 clearGenerated(c);
 try{window.LDCore?.saveCurrent?.();}catch(e){}
 window.dispatchEvent(new CustomEvent('ld:aberfan-p4-fixed',{detail:{version:VERSION}}));
 return true;
}
function schedule(){[0,80,220,600].forEach(ms=>setTimeout(apply,ms));}
window.addEventListener('load',schedule);
window.addEventListener('ld:production-built',schedule);
window.addEventListener('ld:narration-approval-changed',schedule);
window.addEventListener('ld:project-opened',schedule);
document.addEventListener('pointerdown',e=>{if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))apply();},true);
document.addEventListener('click',e=>{if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))apply();},true);
[250,700,1400,3000].forEach(ms=>setTimeout(apply,ms));
window.LDAberfanP4Fix=Object.freeze({version:VERSION,apply,scene:SCENE,valid});
})();
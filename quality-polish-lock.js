/* LD AUTO v3.31.3 — visual-mode-aware quality polish, mobile-safe */
(()=>{'use strict';
const QUALITY={
 narration:`DOCUMENTARY NARRATION POLISH LOCK: Write natural, human-sounding historical-documentary English for a general audience. Preserve verified facts, dates, places, causes and consequences, but explain technical science in clear cinematic language. Prefer concrete cause-and-effect wording and speakable sentences. Avoid robotic phrasing, awkward event-name insertion, textbook jargon, redundant dates, keyword stuffing and unnecessarily complex clauses. Keep each narration segment concise enough for its intended delivery time. Do not invent facts or certainty.`,
 real:`QUALITY POLISH LOCK: Preserve the supplied image, composition, historical setting and existing motion plan. Keep faces, hands, limbs, clothing, props, vehicles, architecture and background geometry stable and coherent for the entire shot. Motion must remain physically caused, subtle and continuous; avoid AI-like drifting, rubbery anatomy, facial swimming, object warping, texture crawling, duplicated people, spontaneous damage and unsupported movement. Use one restrained professional documentary camera behavior appropriate to the scene and maintain consistent motion quality across the production. Preserve the era-aware archival/restored-film capture treatment consistently from shot to shot; do not drift toward modern HD, glossy digital grading or CGI. Historical objects, infrastructure, signage, transport, clothing and architecture must remain appropriate to the event year and location. Existing scene-variety, location-variety, camera-variety, HOOK survival, anatomy, structure and negative locks remain fully active.`,
 anime:`QUALITY POLISH LOCK: Preserve the supplied composition, historical setting and existing motion plan in a serious 2D historical anime / graphic-novel visual world. Keep faces, hands, limbs, clothing, props, vehicles, architecture and background geometry stable and coherent for the entire shot. Preserve detailed hand-drawn linework, painted 2D backgrounds, grounded adult proportions, natural depth and physically caused motion. Avoid AI-like drifting, rubbery anatomy, facial swimming, object warping, texture crawling, duplicated people, spontaneous damage and unsupported movement. Use one restrained cinematic documentary camera behavior appropriate to the scene. Historical objects, infrastructure, signage, transport, clothing and architecture must remain appropriate to the event year and location. NO live action, NO photorealism, NO archival-film capture treatment, NO 3D CGI, NO glossy render, NO chibi. Existing scene-variety, location-variety, camera-variety, HOOK survival, anatomy, structure and negative locks remain fully active.`
};
function currentFlowLock(){
 return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?QUALITY.real:QUALITY.anime;
}
function upsertQuality(el){
 if(!el||!el.value?.trim())return false;
 const next=currentFlowLock();
 const marker='QUALITY POLISH LOCK:';
 const idx=el.value.indexOf(marker);
 const desired=idx>=0
   ? el.value.slice(0,idx).replace(/\s+$/,'')+"\n\n"+next
   : el.value.trim()+"\n\n"+next;
 if(el.value===desired)return false;
 el.value=desired;
 el.dispatchEvent(new Event('input',{bubbles:true}));
 return true;
}
function polish(){
 document.querySelectorAll('.stage-card').forEach(card=>{
  const stage=(card.dataset.stage||card.querySelector('.stage-name')?.textContent||'').trim().toUpperCase();
  if(stage==='ENDING'||stage==='THUMBNAIL')return;
  if(card.dataset.videoMode==='text')return;
  upsertQuality(card.querySelector('.flow-prompt'));
 });
}
document.addEventListener('click',e=>{
 if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))[100,300,650].forEach(ms=>setTimeout(polish,ms));
},true);
document.addEventListener('change',e=>{
 if(e.target&&e.target.id==='visualMode')setTimeout(polish,80);
});
const stageRoot=document.getElementById('stages');
if(stageRoot)new MutationObserver(()=>setTimeout(polish,120)).observe(stageRoot,{childList:true});
window.addEventListener('load',()=>setTimeout(polish,700));
window.ldApplyQualityPolish=polish;
})();
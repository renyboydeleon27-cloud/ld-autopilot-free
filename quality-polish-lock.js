(()=>{'use strict';
const QUALITY={
 narration:`DOCUMENTARY NARRATION POLISH LOCK: Write natural, human-sounding historical-documentary English for a general audience. Preserve verified facts, dates, places, causes and consequences, but explain technical science in clear cinematic language. Prefer concrete cause-and-effect wording and speakable sentences. Avoid robotic phrasing, awkward event-name insertion, textbook jargon, redundant dates, keyword stuffing and unnecessarily complex clauses. Keep each narration segment concise enough for its intended delivery time. Do not invent facts or certainty.`,
 flow:`QUALITY POLISH LOCK: Preserve the supplied image, composition, historical setting and existing motion plan. Keep faces, hands, limbs, clothing, props, vehicles, architecture and background geometry stable and coherent for the entire shot. Motion must remain physically caused, subtle and continuous; avoid AI-like drifting, rubbery anatomy, facial swimming, object warping, texture crawling, duplicated people, spontaneous damage and unsupported movement. Use one restrained professional documentary camera behavior appropriate to the scene and maintain consistent motion quality across the production. Preserve the era-aware archival/restored-film capture treatment consistently from shot to shot; do not drift toward modern HD, glossy digital grading, live-action modernity or CGI. Historical objects, infrastructure, signage, transport, clothing and architecture must remain appropriate to the event year and location. Existing scene-variety, location-variety, camera-variety, HOOK survival, anatomy, structure and negative locks remain fully active.`
};
function appendOnce(el,text,marker){
 if(!el||!el.value?.trim()||el.value.includes(marker))return;
 el.value=el.value.trim()+"\n\n"+text;
 el.dispatchEvent(new Event('input',{bubbles:true}));
}
function polish(){
 document.querySelectorAll('.stage-card').forEach(card=>{
  const stage=(card.dataset.stage||card.querySelector('.stage-name')?.textContent||'').trim().toUpperCase();
  if(stage==='ENDING'||stage==='THUMBNAIL')return;
  appendOnce(card.querySelector('.narration'),QUALITY.narration,'DOCUMENTARY NARRATION POLISH LOCK:');
  appendOnce(card.querySelector('.flow-prompt'),QUALITY.flow,'QUALITY POLISH LOCK:');
 });
}
document.addEventListener('click',e=>{
 if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))[100,300,650].forEach(ms=>setTimeout(polish,ms));
},true);
new MutationObserver(()=>setTimeout(polish,120)).observe(document.getElementById('stages')||document.body,{childList:true,subtree:true});
window.addEventListener('load',()=>setTimeout(polish,700));
window.ldApplyQualityPolish=polish;
})();
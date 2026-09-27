/* LD AUTO v3.41.0 — 10-design universal thumbnail rotation + anti-repeat */
(()=>{
'use strict';
const stages=document.getElementById('stages');if(!stages)return;
const PREFIX='ld-thumb-layout:';
const HISTORY='ld-thumb-layout-history-v2';
const START='UNIVERSAL THUMBNAIL RANDOMIZATION LOCK:';
const END='END UNIVERSAL THUMBNAIL RANDOMIZATION LOCK.';
const layouts=[
 {id:'survivor',label:'1 · Survivor Close-Up',title:'SURVIVOR CLOSE-UP + DISASTER BEHIND',rule:'Use ONE dominant adult survivor or responder in a large chest-up or waist-up foreground portrait. Keep the face emotionally readable while the active disaster remains clearly visible behind and around the subject. Do not let the face cover the main hazard.'},
 {id:'trigger',label:'2 · Trigger Object',title:'TRIGGER OBJECT + IMPACT REVEAL',rule:'Make one event-relevant object or physical detail the strong foreground focal point while the disaster impact is clearly visible beyond it. The trigger object must be historically plausible and visually connected to the event; never invent a false causal fact.'},
 {id:'split',label:'3 · Split Tension',title:'CALM / IMPACT SPLIT TENSION',rule:'Create a two-zone composition with a quieter warning or pre-impact visual on one side and the disaster impact on the other, blended as one cinematic thumbnail rather than a literal comic-panel divider. Preserve one coherent historical scene.'},
 {id:'street',label:'4 · Street Chaos',title:'STREET-LEVEL CHAOS',rule:'Use an eye-level or slightly low street perspective with debris, damaged structures, environmental motion, and adult survival action. Make the viewer feel inside the event while keeping the main hazard readable at phone size.'},
 {id:'scale',label:'5 · Epic Scale',title:'WIDE EPIC DISASTER SCALE',rule:'Make the disaster and environment dominate most of the frame. Use one smaller adult human or period object as scale reference. Prioritize the magnitude and geography of the event over a large face.'},
 {id:'threat',label:'6 · Foreground Threat',title:'FOREGROUND CHARACTER + MASSIVE THREAT',rule:'Place one adult character in the foreground, usually left or right third, reacting toward a massive hazard in the midground/background. Keep body angle, pose, arm position, and camera height distinct from recent thumbnails.'},
 {id:'rescue',label:'7 · Rescue Survival',title:'RESCUE / SURVIVAL FOCUS',rule:'Center the composition on a historically plausible rescue, sheltering, escape, or survival action by adults. Keep the disaster environment visible enough that the event is instantly identifiable. No gore or corpse-focused imagery.'},
 {id:'landmark',label:'8 · Place Identity',title:'LANDMARK / PLACE IDENTITY',rule:'Use a recognizable event-appropriate location, street form, coastline, landscape, structure type, or city identity as the main anchor. Do not invent a famous landmark if it is not supported by the event and period.'},
 {id:'escape',label:'9 · Motion Escape',title:'MOTION / ESCAPE COMPOSITION',rule:'Use a dynamic diagonal or forward-moving composition with one or more adults escaping, bracing, evacuating, or turning toward the danger. Keep anatomy grounded and avoid repeated running poses from recent thumbnails.'},
 {id:'symbol',label:'10 · Symbolic Punch',title:'SYMBOLIC DISASTER PUNCH',rule:'Use one simplified, instantly readable visual symbol of the current event—such as a giant wave wall, tornado funnel, burning skyline, cracked street, swarm-filled sky, floodline, or collapsing slope—paired with minimal but strong human scale. Keep it physically believable and event-specific.'}
];

function topic(){return document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'Untitled Disaster';}
function key(t){return PREFIX+String(t).toLowerCase().replace(/\s+/g,' ').trim();}
function hash(t){let h=2166136261;for(const ch of String(t)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function family(t){
 const s=String(t||'').toLowerCase();
 if(/tsunami|tidal wave/.test(s))return 'tsunami';
 if(/earthquake|quake|seismic/.test(s))return 'earthquake';
 if(/cyclone|hurricane|typhoon/.test(s))return 'cyclone';
 if(/tornado|twister/.test(s))return 'tornado';
 if(/flood|dam failure|storm surge/.test(s))return 'flood';
 if(/locust|insect|swarm/.test(s))return 'insect';
 if(/wildfire|forest fire|firestorm/.test(s))return 'wildfire';
 if(/landslide|mudslide|avalanche|glacier collapse/.test(s))return 'landslide';
 if(/volcano|eruption|lahar|pyroclastic/.test(s))return 'volcano';
 return 'general';
}
const preferred={
 tsunami:['scale','threat','symbol','street','escape'],
 earthquake:['survivor','trigger','street','escape','landmark','symbol'],
 cyclone:['survivor','threat','rescue','escape','scale'],
 tornado:['threat','street','scale','escape','symbol'],
 flood:['street','threat','rescue','scale','escape'],
 insect:['scale','landmark','symbol','survivor','street'],
 wildfire:['street','threat','rescue','scale','symbol'],
 landslide:['scale','threat','street','escape','symbol'],
 volcano:['scale','threat','landmark','escape','symbol'],
 general:layouts.map(x=>x.id)
};
function readHistory(){
 try{
   const arr=JSON.parse(localStorage.getItem(HISTORY)||'[]');
   return Array.isArray(arr)?arr.filter(x=>layouts.some(y=>y.id===x)).slice(-3):[];
 }catch{return [];}
}
function pushHistory(id){
 const arr=readHistory().filter(x=>x!==id);
 arr.push(id);
 localStorage.setItem(HISTORY,JSON.stringify(arr.slice(-3)));
}
function current(t){
 const saved=localStorage.getItem(key(t));const hit=layouts.find(x=>x.id===saved);if(hit)return hit;
 const recent=readHistory();
 const pool=(preferred[family(t)]||preferred.general).map(id=>layouts.find(x=>x.id===id)).filter(Boolean);
 let candidates=pool.filter(x=>!recent.includes(x.id));
 if(!candidates.length)candidates=layouts.filter(x=>!recent.includes(x.id));
 if(!candidates.length)candidates=pool.length?pool:layouts;
 const pick=candidates[hash(t)%candidates.length];
 localStorage.setItem(key(t),pick.id);
 pushHistory(pick.id);
 return pick;
}
function choose(t,id){
 if(!layouts.some(x=>x.id===id))return;
 localStorage.setItem(key(t),id);
 pushHistory(id);
}
function strip(text){
 const s=String(text||'');
 const a=s.indexOf(START);if(a<0)return s.trim();
 const b=s.indexOf(END,a);
 return (b<0?s.slice(0,a):s.slice(0,a)+s.slice(b+END.length)).trim();
}
function block(t){
 const x=current(t);
 return START+'\n10-DESIGN ROTATION: use the selected design below while preserving the approved Living Disaster Book branding, crop-safe text hierarchy, historical accuracy, and FULL-COLOR THUMBNAIL OVERRIDE. Do NOT repeat the same design used in the recent three projects when an appropriate alternative exists. Vary subject placement, body posture, camera height, zoom level, disaster scale, and foreground/midground relationship. One dominant adult main character only unless the selected design or verified event clearly benefits from a small supporting group.\n\nSELECTED DESIGN — '+x.title+':\n'+x.rule+'\n\nANTI-REPEAT LOCK: never default every episode to the same leaning-forward survivor, same center face, same camera angle, same hand pose, or same disaster placement. Preserve mobile readability and the existing title, casualty, footer, color, historical, and event-specific locks.\n'+END;
}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
function apply(){
 const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');const ta=card?.querySelector('.image-prompt');if(!ta)return false;
 const t=topic();const base=strip(ta.value);const next=base+'\n\n'+block(t);if(ta.value===next)return false;
 ta.value=next;ta.dataset.thumbnailRandomization='v3.41.0-10-designs';fire(ta);return true;
}
function render(){
 const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');const body=card?.querySelector('.stage-body');if(!card||!body)return;
 let box=card.querySelector('.thumbnail-layout-chooser');
 if(!box){box=document.createElement('div');box.className='thumbnail-layout-chooser field-block';box.style.cssText='border:2px solid #ff3b30;border-radius:12px;padding:10px;margin:10px 0';body.prepend(box);}
 const t=topic(),cur=current(t),recent=readHistory();
 box.innerHTML='<div class="field-head"><label>Thumbnail Design · 10-Design Rotation</label></div><p style="margin:5px 0 9px;font-size:11px;color:#9aa7b6">Auto-matched to the disaster family and avoids the last 3 designs when possible. Thumbnail scene is always FULL COLOR even if the episode is B&W.</p><div class="thumb-layout-buttons" style="display:flex;gap:6px;flex-wrap:wrap"></div>';
 const wrap=box.querySelector('.thumb-layout-buttons');
 layouts.forEach(x=>{
   const b=document.createElement('button');b.type='button';b.className='ghost small';
   b.textContent=x.label+(x.id===cur.id?' ✓':'')+(recent.includes(x.id)&&x.id!==cur.id?' · recent':'');
   b.setAttribute('aria-pressed',String(x.id===cur.id));
   if(x.id===cur.id)b.style.outline='2px solid #ff3b30';
   b.onclick=()=>{choose(t,x.id);apply();render();};
   wrap.appendChild(b);
 });
}
function sync(){setTimeout(()=>{apply();render();},80);setTimeout(()=>{apply();render();},260);}
document.getElementById('buildBtn')?.addEventListener('click',sync);
document.getElementById('generateAllBtn')?.addEventListener('click',sync);
document.addEventListener('click',e=>{if(e.target.closest('.generate-template-btn')?.closest('.stage-card')?.dataset?.stage==='THUMBNAIL')sync();});
new MutationObserver(()=>setTimeout(render,40)).observe(stages,{childList:true});
window.addEventListener('load',sync);
setTimeout(sync,300);
window.LDThumbnailRandomization={version:'3.41.0',layouts,current,choose,apply,render,family,readHistory};
})();

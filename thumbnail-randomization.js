/* LD AUTO v3.41.1 — 10-design thumbnail rotation + visual sample previews + anti-repeat */
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

const SAMPLE_DB='ld-thumbnail-design-samples-v1';
const sampleUrls=new Map();
let sampleDbPromise;
function sampleDb(){
 if(!('indexedDB' in window))return Promise.reject(new Error('Image storage is unavailable in this browser.'));
 if(!sampleDbPromise)sampleDbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open(SAMPLE_DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('samples'))req.result.createObjectStore('samples');};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||new Error('Could not open image storage.'));
 });
 return sampleDbPromise;
}
async function readSample(id){
 const db=await sampleDb();
 return new Promise((resolve,reject)=>{
  const req=db.transaction('samples','readonly').objectStore('samples').get(id);
  req.onsuccess=()=>resolve(req.result||null);
  req.onerror=()=>reject(req.error||new Error('Could not load reference photo.'));
 });
}
async function writeSample(id,file){
 const db=await sampleDb();
 return new Promise((resolve,reject)=>{
  const req=db.transaction('samples','readwrite').objectStore('samples').put(file,id);
  req.onsuccess=()=>resolve();
  req.onerror=()=>reject(req.error||new Error('Could not save reference photo.'));
 });
}
function showSample(card,id){
 const preview=card.querySelector('.thumb-design-sample');
 if(!preview)return;
 const cached=sampleUrls.get(id);
 if(cached){preview.innerHTML='';const img=document.createElement('img');img.src=cached;img.alt='Saved design reference photo';preview.appendChild(img);return;}
 readSample(id).then(blob=>{
  if(!blob||!card.isConnected||sampleUrls.has(id))return;
  const url=URL.createObjectURL(blob);sampleUrls.set(id,url);
  showSample(card,id);
 }).catch(()=>{});
}
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
function sampleSvg(layoutId,fam){
 const hazard={
   tsunami:'WAVE',earthquake:'QUAKE',cyclone:'STORM',tornado:'TORNADO',flood:'FLOOD',insect:'SWARM',wildfire:'FIRE',landslide:'SLIDE',volcano:'ERUPTION',general:'DISASTER'
 }[fam]||'DISASTER';
 const common='<rect x="0" y="0" width="160" height="100" rx="8" fill="#202833"/><rect x="8" y="8" width="92" height="9" rx="2" fill="#f4f4f4"/><rect x="8" y="21" width="74" height="7" rx="2" fill="#f6d84a"/><rect x="8" y="84" width="144" height="8" rx="2" fill="#111827" stroke="#64748b" stroke-width="1"/>';
 const person='<circle cx="38" cy="52" r="10" fill="#d9a66c"/><rect x="28" y="62" width="22" height="22" rx="6" fill="#4f7cab"/>';
 const smallPerson='<circle cx="32" cy="70" r="5" fill="#d9a66c"/><rect x="27" y="75" width="10" height="10" rx="3" fill="#4f7cab"/>';
 const hazardShape='<path d="M92 73 C108 43 129 40 151 65 L151 84 L88 84 Z" fill="#5b88b2" opacity=".9"/><text x="102" y="59" fill="#ffffff" font-size="8" font-family="Arial">'+hazard+'</text>';
 let art='';
 if(layoutId==='survivor')art=person+hazardShape;
 else if(layoutId==='trigger')art='<rect x="28" y="49" width="26" height="26" rx="4" fill="#b7c0ca" stroke="#f1f5f9" stroke-width="2"/>'+hazardShape;
 else if(layoutId==='split')art='<rect x="8" y="34" width="68" height="48" rx="5" fill="#334155"/><rect x="84" y="34" width="68" height="48" rx="5" fill="#4b5563"/>'+smallPerson+hazardShape;
 else if(layoutId==='street')art='<path d="M8 83 L58 42 L102 83 Z" fill="#475569"/><path d="M58 83 L105 47 L152 83 Z" fill="#374151"/>'+smallPerson+'<text x="101" y="44" fill="#fff" font-size="8" font-family="Arial">'+hazard+'</text>';
 else if(layoutId==='scale')art=smallPerson+'<path d="M55 82 C77 25 116 18 154 72 L154 84 L52 84 Z" fill="#5b88b2"/><text x="95" y="35" fill="#fff" font-size="8" font-family="Arial">'+hazard+'</text>';
 else if(layoutId==='threat')art='<circle cx="32" cy="59" r="8" fill="#d9a66c"/><rect x="24" y="67" width="18" height="17" rx="5" fill="#4f7cab"/><path d="M70 83 C89 28 126 24 153 66 L153 84 L67 84 Z" fill="#5b88b2"/><text x="106" y="39" fill="#fff" font-size="8" font-family="Arial">'+hazard+'</text>';
 else if(layoutId==='rescue')art='<circle cx="35" cy="60" r="7" fill="#d9a66c"/><circle cx="51" cy="64" r="6" fill="#c9935a"/><rect x="28" y="68" width="30" height="16" rx="5" fill="#4f7cab"/>'+hazardShape;
 else if(layoutId==='landmark')art='<rect x="21" y="48" width="43" height="35" rx="2" fill="#64748b"/><rect x="35" y="34" width="15" height="49" fill="#7c8795"/>'+hazardShape;
 else if(layoutId==='escape')art='<circle cx="36" cy="61" r="6" fill="#d9a66c"/><path d="M34 67 L24 81 M37 67 L48 80 M34 70 L23 68 M39 70 L50 64" stroke="#4f7cab" stroke-width="5" stroke-linecap="round"/>'+hazardShape;
 else art='<path d="M78 83 C88 38 107 24 124 39 C141 53 146 71 153 83 Z" fill="#5b88b2"/><circle cx="37" cy="73" r="5" fill="#d9a66c"/><text x="98" y="49" fill="#fff" font-size="8" font-family="Arial">'+hazard+'</text>';
 return '<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Thumbnail composition sample">'+common+art+'</svg>';
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
 box.innerHTML='<div class="field-head"><label>Thumbnail Design · 10-Design Rotation</label></div><p style="margin:5px 0 9px;font-size:11px;color:#9aa7b6">Tap a card to select a layout. Tap Add reference photo to choose a picture from your gallery for that design. The photo is a visual sample saved in this browser; it is not automatically sent to the image generator. The generated thumbnail remains FULL COLOR.</p><div class="thumb-layout-buttons thumb-design-grid"></div><input type="file" class="thumb-sample-picker" accept="image/*" hidden aria-label="Choose design reference photo">';
 const picker=box.querySelector('.thumb-sample-picker');
 let pendingId='';
 picker.onchange=async()=>{
  const file=picker.files?.[0];const id=pendingId;picker.value='';pendingId='';
  if(!file||!id)return;
  if(!file.type.startsWith('image/')){alert('Choose an image file.');return;}
  try{
   await writeSample(id,file);
   const oldUrl=sampleUrls.get(id);if(oldUrl)URL.revokeObjectURL(oldUrl);
   sampleUrls.set(id,URL.createObjectURL(file));
   render();
  }catch(err){alert('Could not save photo: '+(err?.message||'storage error'));}
 };
 const wrap=box.querySelector('.thumb-layout-buttons');
 const fam=family(t);
 layouts.forEach(x=>{
   const b=document.createElement('button');b.type='button';b.className='ghost small thumb-design-card';
   b.setAttribute('aria-pressed',String(x.id===cur.id));
   b.innerHTML='<span class="thumb-design-sample">'+sampleSvg(x.id,fam)+'</span><span class="thumb-design-label">'+x.label+(x.id===cur.id?' ✓':'')+'</span><span class="thumb-design-meta">'+(recent.includes(x.id)&&x.id!==cur.id?'Recently used':'Tap to select')+'</span>';
   if(x.id===cur.id)b.classList.add('selected');
   b.onclick=()=>{choose(t,x.id);apply();render();};
   wrap.appendChild(b);
   showSample(b,x.id);
   const upload=document.createElement('button');upload.type='button';upload.className='thumb-sample-upload';upload.textContent='Add reference photo';upload.setAttribute('aria-label','Choose gallery photo for '+x.label);
   upload.onclick=()=>{pendingId=x.id;picker.click();};
   const group=document.createElement('div');group.className='thumb-design-item';wrap.replaceChild(group,b);group.append(b,upload);
 });
}
function sync(){setTimeout(()=>{apply();render();},80);setTimeout(()=>{apply();render();},260);}
document.getElementById('buildBtn')?.addEventListener('click',sync);
document.getElementById('generateAllBtn')?.addEventListener('click',sync);
document.addEventListener('click',e=>{if(e.target.closest('.generate-template-btn')?.closest('.stage-card')?.dataset?.stage==='THUMBNAIL')sync();});
new MutationObserver(()=>setTimeout(render,40)).observe(stages,{childList:true});
window.addEventListener('load',sync);
setTimeout(sync,300);
if(!document.getElementById('ldThumbnailSampleStyles')){
 const style=document.createElement('style');style.id='ldThumbnailSampleStyles';
 style.textContent='.thumb-design-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.thumb-design-item{min-width:0;display:flex;flex-direction:column;gap:4px}.thumb-design-card{display:flex!important;flex-direction:column;align-items:stretch!important;gap:5px!important;padding:7px!important;text-align:left!important;min-width:0!important}.thumb-design-card.selected{outline:2px solid #ff3b30;background:rgba(255,59,48,.08)}.thumb-design-sample{display:block;width:100%;overflow:hidden;border-radius:8px;background:#202833}.thumb-design-sample svg,.thumb-design-sample img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover}.thumb-sample-upload{width:100%;border:1px solid #5a86ad;border-radius:7px;padding:7px 4px;background:#183958;color:#e8f5ff;font-size:10px;font-weight:700;cursor:pointer}.thumb-design-label{font-size:11px;font-weight:800;line-height:1.2}.thumb-design-meta{font-size:9px;opacity:.65}@media(min-width:720px){.thumb-design-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}';
 document.head.appendChild(style);
}
window.LDThumbnailRandomization={version:'3.41.2',layouts,current,choose,apply,render,family,readHistory,sampleSvg};
})();

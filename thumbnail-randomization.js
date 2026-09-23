/* LD AUTO v3.26.0 — Universal Thumbnail Randomization */
(()=>{
'use strict';
const stages=document.getElementById('stages');if(!stages)return;
const PREFIX='ld-thumb-layout:';
const LAST='ld-thumb-layout-last';
const START='UNIVERSAL THUMBNAIL RANDOMIZATION LOCK:';
const END='END UNIVERSAL THUMBNAIL RANDOMIZATION LOCK.';
const layouts=[
 {id:'left',label:'1 · Left Shock',title:'LEFT SIDE SHOCK REVEAL',rule:'Place ONE dominant adult subject on the LEFT side, waist-up or knees-up. Use an upright but strained posture with shoulders tense and head turned toward the disaster on the right. Do not use a repeated forward-lunging or gripping pose. Keep the main disaster in the center and right background.'},
 {id:'center',label:'2 · Center Face',title:'CENTER FACE CLOSE-UP',rule:'Place ONE dominant adult subject in the CENTER in a close-up or chest-up framing. Use a readable emotional expression such as fear, shock, grief, or survival tension. Do not use a crouched or lunging posture. Keep the disaster visible behind the face.'},
 {id:'right',label:'3 · Right Crouch',title:'RIGHT SIDE CROUCH / KNEEL',rule:'Place ONE dominant adult subject on the RIGHT side in a crouching, kneeling, half-lowered, or bracing posture. Use the LEFT and center background for the disaster. The body angle and arm position must be clearly different from previous thumbnails.'},
 {id:'back',label:'4 · Back Look',title:'BACK-FACING LOOK-BACK SURVIVOR',rule:'Place ONE dominant adult subject in the LOWER foreground, slightly left or right, shown from behind or three-quarter back view. The subject turns their head toward the disaster or partly back toward camera. Use the background for the full disaster reveal and human scale.'},
 {id:'scale',label:'5 · Big Disaster',title:'SMALL HUMAN, BIG DISASTER',rule:'Make the disaster the dominant visual. Place ONE adult subject smaller in a lower foreground corner or lower-center area, standing, looking outward, or bracing. The person provides scale while the disaster occupies most of the frame. Avoid a repeated action-heavy survivor pose.'}
];
function topic(){return document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'Untitled Disaster';}
function key(t){return PREFIX+String(t).toLowerCase().replace(/\s+/g,' ').trim();}
function hash(t){let h=0;for(const ch of String(t)){h=((h<<5)-h+ch.charCodeAt(0))|0;}return Math.abs(h);}
function current(t){
 const saved=localStorage.getItem(key(t));const hit=layouts.find(x=>x.id===saved);if(hit)return hit;
 let i=hash(t)%layouts.length;const last=localStorage.getItem(LAST);if(layouts[i].id===last)i=(i+1)%layouts.length;
 const pick=layouts[i];localStorage.setItem(key(t),pick.id);localStorage.setItem(LAST,pick.id);return pick;
}
function choose(t,id){if(!layouts.some(x=>x.id===id))return;localStorage.setItem(key(t),id);localStorage.setItem(LAST,id);}
function strip(text){const s=String(text||'');const a=s.indexOf(START);if(a<0)return s.trim();const b=s.indexOf(END,a);return (b<0?s.slice(0,a):s.slice(0,a)+s.slice(b+END.length)).trim();}
function block(t){
 const x=current(t);
 return START+'\nDo NOT repeat the same body posture, body angle, arm position, character placement, facial angle, or zoom level used in previous thumbnails. Keep Living Disaster Book branding consistent while varying composition across ALL disaster topics. One dominant adult main character only unless the current verified event requires otherwise.\n\nSELECTED DESIGN — '+x.title+':\n'+x.rule+'\n\nPOSE VARIETY: never force every episode into the same leaning-forward survivor pose. Preserve mobile readability and the existing title, badge, footer, historical, crop-safe, and event-specific locks.\n'+END;
}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
function apply(){
 const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');const ta=card?.querySelector('.image-prompt');if(!ta)return false;
 const t=topic();const base=strip(ta.value);const next=base+'\n\n'+block(t);if(ta.value===next)return false;ta.value=next;ta.dataset.thumbnailRandomization='v3.26.0';fire(ta);return true;
}
function render(){
 const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');const body=card?.querySelector('.stage-body');if(!card||!body)return;
 let box=card.querySelector('.thumbnail-layout-chooser');
 if(!box){box=document.createElement('div');box.className='thumbnail-layout-chooser field-block';box.style.cssText='border:2px solid #ff3b30;border-radius:12px;padding:10px;margin:10px 0';body.prepend(box);}
 const t=topic(),cur=current(t);
 box.innerHTML='<div class="field-head"><label>Thumbnail Design · Universal Pose Variety</label></div><p style="margin:5px 0 9px;font-size:11px;color:#9aa7b6">Auto-rotated recommendation. Choose any of the 5 layouts. Works for every disaster topic.</p><div class="thumb-layout-buttons" style="display:flex;gap:6px;flex-wrap:wrap"></div>';
 const wrap=box.querySelector('.thumb-layout-buttons');
 layouts.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='ghost small';b.textContent=x.label+(x.id===cur.id?' ✓':'');b.setAttribute('aria-pressed',String(x.id===cur.id));if(x.id===cur.id)b.style.outline='2px solid #ff3b30';b.onclick=()=>{choose(t,x.id);apply();render();};wrap.appendChild(b);});
}
function sync(){setTimeout(()=>{apply();render();},80);setTimeout(()=>{apply();render();},260);}
document.getElementById('buildBtn')?.addEventListener('click',sync);
document.getElementById('generateAllBtn')?.addEventListener('click',sync);
document.addEventListener('click',e=>{if(e.target.closest('.generate-template-btn')?.closest('.stage-card')?.dataset?.stage==='THUMBNAIL')sync();});
new MutationObserver(()=>setTimeout(render,40)).observe(stages,{childList:true});
window.addEventListener('load',sync);
setTimeout(sync,300);
window.LDThumbnailRandomization={layouts,current,choose,apply,render};
})();
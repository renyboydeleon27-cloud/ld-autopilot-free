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
function stageName(card){return (card.dataset.stage||card.querySelector('.stage-name')?.textContent||'').trim().toUpperCase().replace(/^P0?/,'P');}
function apply(){
 document.querySelectorAll('.stage-card').forEach(card=>{
  const st=stageName(card); if(!(st in plans))return;
  const el=card.querySelector('.flow-prompt'); if(!el||!el.value.trim())return;
  const marker='ADAPTIVE CAMERA MOTION LOCK:';
  if(el.value.includes(marker))return;
  const text=`${marker} Use one simple professional camera movement only: ${plans[st]}. Begin gently within the first 0.5 seconds and continue smoothly through the full 10-second single continuous shot. The movement must fit and preserve the supplied composition; if the specified direction would reveal unsupported scenery or break geometry, reduce its travel rather than inventing content. No dead-static camera unless physical/historical constraints make movement impossible. No cuts, transitions, orbit, crane flourish, whip pan, crash zoom, speed ramp, dramatic roll/rotation, reframing jump, or complicated effects. Do not alternate directions within the shot. Camera motion must not warp people, architecture, vehicles, props, horizon lines, or background geometry. Existing scene-variety, historical, anatomy, structure, HOOK survival and quality-polish locks remain fully active.`;
  el.value=el.value.trim()+'\n\n'+text;
  el.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
document.addEventListener('click',e=>{if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))[120,320,700].forEach(ms=>setTimeout(apply,ms));},true);
new MutationObserver(()=>setTimeout(apply,140)).observe(document.getElementById('stages')||document.body,{childList:true,subtree:true});
window.addEventListener('load',()=>setTimeout(apply,850));
window.ldApplyCameraMotion=apply;
})();
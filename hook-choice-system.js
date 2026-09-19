/* LD AUTO v3.17 — Top 3 Hook Choice System. Curated rollout: Earthquake + Locust. */
(function(){'use strict';
window.LD_HOOK_CHOICES_ENABLED=true;
var MODE_KEY='ld-auto-visual-mode-v1', ACTIVE_KEY='ld-auto-active-hook-v1';

function topic(){return (document.getElementById('projectTitle')&&document.getElementById('projectTitle').textContent||document.getElementById('topic')&&document.getElementById('topic').value||'').trim();}
function format(){return /Longform/i.test(document.getElementById('modeText')&&document.getElementById('modeText').textContent||'')?'longform':'shorts';}
function mode(){return localStorage.getItem(MODE_KEY)==='real'?'real':'anime';}
function card(){return Array.from(document.querySelectorAll('.stage-card')).find(function(c){return c.dataset.stage==='HOOK';});}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
function toast(msg){var t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove('show');},1800);}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){if(m==='&')return '&amp;';if(m==='<')return '&lt;';if(m==='>')return '&gt;';if(m==='"')return '&quot;';return '&#39;';});}
function basePrompt(){return 'VIDEO PROMPT — EXACTLY 10 SECONDS\n\n'+topic()+'\n\nFORMAT:\n'+(format()==='longform'?'Landscape 16:9.':'Portrait 9:16.')+'\nExactly 10 seconds.\nText-to-video only.\nOne continuous shot.\n'+(mode()==='real'?'Photorealistic REAL HUMAN documentary mode.':'Serious historical graphic-novel/anime 2D mode.')+'\n\nTOPIC CONTINUITY LOCK:\nMatch the exact selected disaster, year, location, era, architecture, clothing, infrastructure and visual mode. The HOOK must belong to the same world as P1–P14. Do not substitute another city, country, era or disaster.\n\n';}
function replaceAll(s,a,b){return s.split(a).join(b);}

function earthquakeRecommended(){
  return window.LDEarthquakeTwistHookV315&&window.LDEarthquakeTwistHookV315.prompt?window.LDEarthquakeTwistHookV315.prompt():basePrompt()+'EARTHQUAKE HOOK: 1 second calm → glass vibrates and falls by about 4 seconds → six seconds of forward-moving major earthquake impact.';
}
function earthquakeTable(){
  var p=earthquakeRecommended();
  p=replaceAll(p,'ONE adult resident briefly brushes their teeth at a period-appropriate washbasin.\nEXACTLY ONE transparent drinking glass stands clearly near the edge.','One or two ADULTS sit calmly at a modest period-appropriate dining table. A SINGLE lightweight framed photograph hangs clearly on the wall behind them.');
  p=replaceAll(p,'The SAME visible glass vibrates and physically slides toward the edge.','The SAME wall frame begins to shake visibly on its hook while tableware lightly rattles.');
  p=replaceAll(p,'The SAME glass reaches the edge, progressively loses support, tips outward, falls and hits the floor.\nKeep the complete action visually readable:\nVISIBLE GLASS → VIBRATES → SLIDES → REACHES EDGE → TIPS → FALLS → HITS FLOOR.','The SAME wall frame slips from its hook, falls naturally under gravity and hits the floor. Keep the action readable: FRAME SHAKES → HOOK LOOSENS → FRAME FALLS → FLOOR IMPACT.');
  p=replaceAll(p,'glass impact','frame impact');p=replaceAll(p,'glass','frame');p=replaceAll(p,'GLASS','FRAME');
  return p+'\n\nALTERNATIVE-SPECIFIC LOCK: Keep the adults and dining setup stable; the falling wall frame is the single trigger object. No duplicate frame.';
}
function earthquakeInk(){
  var p=earthquakeRecommended();
  p=replaceAll(p,'ONE adult resident briefly brushes their teeth at a period-appropriate washbasin.\nEXACTLY ONE transparent drinking glass stands clearly near the edge.','ONE adult calmly writes at a modest period-appropriate desk. A SINGLE small ink container sits clearly near the desk edge.');
  p=replaceAll(p,'Mirror or reflective surface vibrates where historically appropriate.\nWater ripples.\nSmall objects rattle.\nA hanging object or light sways slightly if present.\nThe SAME visible glass vibrates and physically slides toward the edge.','The desk, lamp and papers begin to vibrate. The SAME ink container rattles and slides toward the edge.');
  p=replaceAll(p,'The SAME glass reaches the edge, progressively loses support, tips outward, falls and hits the floor.\nKeep the complete action visually readable:\nVISIBLE GLASS → VIBRATES → SLIDES → REACHES EDGE → TIPS → FALLS → HITS FLOOR.','The SAME ink container reaches the edge, tips and falls to the floor. Keep the action readable: INK CONTAINER VIBRATES → SLIDES → TIPS → FALLS → FLOOR IMPACT.');
  p=replaceAll(p,'glass impact','ink-container impact');p=replaceAll(p,'glass','ink container');p=replaceAll(p,'GLASS','INK CONTAINER');
  return p+'\n\nALTERNATIVE-SPECIFIC LOCK: Preserve one ink container only. No duplicate container, teleportation or impossible motion.';
}
function locustRecommended(){
  return window.LDLocustLaundryHook&&window.LDLocustLaundryHook.prompt?window.LDLocustLaundryHook.prompt():basePrompt()+'LOCUST HOOK: peaceful laundry → daylight weakens → adult turns → swarm arrives → six seconds of forward camera travel through the invasion.';
}
function locustField(){
  return basePrompt()+'LOCUST FIELD SHADOW REVEAL — FOR TESTING\n\n0.0–1.5s: ONE adult calmly inspects crop leaves in a rural farming area appropriate to the selected locust event. Natural daylight, no visible swarm.\n\n1.5–3.5s: A broad moving shadow crosses the crops although there are no storm clouds. Daylight weakens only slightly. A distant insect-wing rustle rises. The adult pauses, looks across the field, then upward.\n\n3.5–4.0s: A naturally layered locust swarm becomes visible above the crops and advances toward camera. The dimming is caused by insects partially screening sunlight, never by weather, smoke or eclipse.\n\n4.0–10.0s: Six uninterrupted seconds of FORWARD-ONLY camera travel into the field. Swarm density increases through more insects entering from the field, not cloning or sudden spawning. Most insects remain small or medium-small; use background, midground and occasional foreground passes. Show a few believable leaf landings with local plant response.\n\nCAMERA LOCK: forward only, steady pace, fixed focal length, natural parallax; no backward movement, pull-back, zoom-out, orbit, static observer shot, cut or transition. End while still advancing.\n\nLOCUST REALISM: rapid independently phased wingbeats, varied headings, natural depth and occlusion. No giant insects, birdlike flapping, rigid hovering, cloned poses, confetti, ash, dust or flat swarm overlay.\n\nAUDIO: quiet rural ambience → distant wing rustle → dense layered insect-wing sound and brief nonverbal adult reaction. No music or voice-over.\n\nNEGATIVE: no storm clouds, eclipse, sudden nighttime, structural collapse, fire, explosion, flood, duplicated humans, children, gore, morphing, text, captions, logos or watermark.';
}
function locustPath(){
  return basePrompt()+'LOCUST HARVEST PATH REVEAL — FOR TESTING\n\n0.0–1.5s: ONE adult walks calmly along a dirt path carrying a modest basket or bundle of harvested crops. Natural daylight, normal rural ambience, no visible swarm.\n\n1.5–3.5s: Small fast-moving shadows begin flickering across the path and clothing. A distant wing rustle grows steadily. The adult slows, turns toward the field and looks up.\n\n3.5–4.0s: The approaching locust swarm becomes visible across the field and upper background, with many separate insects at varied depths. The adult steps aside and raises an arm to shield the face.\n\n4.0–10.0s: Six uninterrupted seconds of FORWARD-ONLY camera travel deeper along the path and into the swarm. Keep the adult behind; do not track backward to preserve the face. Swarm density grows naturally through incoming insects. Nearby leaves gain scattered landed locusts while visibility remains readable.\n\nCAMERA LOCK: forward only, steady walking pace, fixed focal length, natural parallax; no retreat, pull-back, zoom-out, orbit, static observer shot, cut or transition. Finish while still advancing.\n\nLOCUST REALISM: three-dimensional insects with rapid wingbeats, varied body angles, natural scale, depth, occlusion and occasional close passes. No giant insects, cloned poses, rigid hovering, birdlike flapping, confetti, ash, dust or flat swarm layer.\n\nAUDIO: quiet path ambience → rising wing rustle → layered swarm sound and brief adult reaction. No music or voice-over.\n\nNEGATIVE: no storm, eclipse, sudden night, fire, explosion, flood, structural collapse, duplicated humans, children, gore, morphing, text, captions, logos or watermark.';
}
function family(){var t=topic();if(/\b(?:earthquake|quake|seismic)\b/i.test(t))return 'earthquake';if(/\blocusts?\b/i.test(t))return 'locust';return null;}
function choices(){
  if(family()==='earthquake')return [
    {id:'eq-glass',rec:true,status:'APPROVED',title:'Glass-Fall Twist',concept:'Brief washroom routine → tremor → one glass falls → six seconds of major earthquake impact.',why:'Tested earthquake hook with a clear physical trigger and strong cause-and-effect reveal.',prompt:earthquakeRecommended()},
    {id:'eq-table',status:'FOR TESTING',title:'Family Table Frame',concept:'Calm adult meal → wall frame shakes and falls → earthquake erupts.',why:'Different opening activity and warning object while keeping earthquake physics readable.',prompt:earthquakeTable()},
    {id:'eq-ink',status:'FOR TESTING',title:'Writing Desk Ink',concept:'Adult writing quietly → ink container slides and falls → full quake escalation.',why:'Another intimate setup with a gravity-driven warning cue.',prompt:earthquakeInk()}
  ];
  if(family()==='locust')return [
    {id:'loc-laundry',rec:true,status:'APPROVED',title:'Laundry Shadow Reveal',concept:'Peaceful laundry → daylight weakens → adult turns → swarm arrives → forward invasion.',why:'Locust-specific dread and swarm scale rather than an impact-style trigger.',prompt:locustRecommended()},
    {id:'loc-field',status:'FOR TESTING',title:'Field Shadow Reveal',concept:'Crop inspection → moving shadow crosses plants → adult looks up → swarm fills the field.',why:'Uses changing light and wing sound as the warning.',prompt:locustField()},
    {id:'loc-path',status:'FOR TESTING',title:'Harvest Path Reveal',concept:'Adult walking with crops → flickering shadows → turn → swarm overtakes the path.',why:'Different human activity and reveal angle while preserving natural swarm behavior.',prompt:locustPath()}
  ];
  return [];
}
function getActive(){try{var x=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');return x&&x.topic===topic()?x.id:null;}catch(e){return null;}}
function setActive(id){localStorage.setItem(ACTIVE_KEY,JSON.stringify({topic:topic(),id:id,updatedAt:new Date().toISOString()}));}
function useHook(c){
  var h=card();if(!h)return;
  var img=h.querySelector('.image-prompt'), flow=h.querySelector('.flow-prompt');
  if(img){img.value='TEXT-TO-VIDEO HOOK — NO STARTING IMAGE REQUIRED. Active choice: '+c.title+'. Status: '+c.status+'. Use the Flow prompt below directly.';fire(img);var l=img.closest('.field-block')&&img.closest('.field-block').querySelector('label');if(l)l.textContent='HOOK setup — text-to-video';}
  if(flow){flow.value=c.prompt;fire(flow);}
  var role=h.querySelector('.scene-role');if(role)role.textContent='ACTIVE HOOK · '+c.title+' · '+c.status;
  var note=h.querySelector('.stage-note');if(note)note.textContent='Active HOOK: '+c.title+' · '+c.status+' · text-to-video';
  setActive(c.id);render();toast(c.title+' selected');
}
function addStyles(){
  if(document.getElementById('hookChoiceStyles'))return;
  var s=document.createElement('style');s.id='hookChoiceStyles';
  s.textContent='.hook-choice-system{margin:12px 0 16px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.035)}.hook-choice-head{margin-bottom:12px}.hook-choice-head h3{margin:0 0 4px;font-size:1rem}.hook-choice-head p{margin:0;opacity:.72;font-size:.84rem}.hook-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.hook-choice-card{padding:12px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(0,0,0,.12)}.hook-choice-card.active{outline:2px solid rgba(255,255,255,.32)}.hook-choice-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.hook-choice-badge{font-size:.68rem;font-weight:700;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.09)}.hook-choice-card h4{margin:0 0 6px;font-size:.95rem}.hook-choice-card p{margin:0 0 7px;font-size:.8rem;line-height:1.38;opacity:.84}.hook-choice-why{opacity:.66!important}.hook-choice-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.hook-choice-preview{margin-top:9px;width:100%;min-height:110px;font-size:.74rem;line-height:1.35}.hook-choice-empty{padding:12px;border:1px dashed rgba(255,255,255,.18);border-radius:12px;opacity:.72;font-size:.82rem}#locustLaundryHook{display:none!important}@media(max-width:760px){.hook-choice-grid{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}
function render(){
  addStyles();var old=document.getElementById('locustLaundryHook');if(old)old.remove();
  var h=card();if(!h){var x=document.getElementById('hookChoiceSystem');if(x)x.remove();return;}
  var root=document.getElementById('hookChoiceSystem');
  if(!root){root=document.createElement('section');root.id='hookChoiceSystem';root.className='hook-choice-system';var body=h.querySelector('.stage-body');if(body)body.prepend(root);}
  var list=choices();
  if(!list.length){root.innerHTML='<div class="hook-choice-head"><h3>Top 3 HOOK Choices</h3><p>Curated hook library</p></div><div class="hook-choice-empty">No curated Top 3 hook set for <strong>'+esc(topic())+'</strong> yet. The existing HOOK remains unchanged until this disaster family is tested.</div>';return;}
  var active=getActive();
  root.innerHTML='<div class="hook-choice-head"><h3>Top 3 HOOK Choices</h3><p>'+esc(topic())+' · '+(format()==='longform'?'16:9':'9:16')+' · '+(mode()==='real'?'Real Human':'Historical Anime')+'</p></div><div class="hook-choice-grid"></div>';
  var grid=root.querySelector('.hook-choice-grid');
  list.forEach(function(c,i){
    var el=document.createElement('article');el.className='hook-choice-card'+(active===c.id?' active':'');
    el.innerHTML='<div class="hook-choice-badges"><span class="hook-choice-badge">'+(c.rec?'RECOMMENDED':'ALTERNATIVE '+(i+1))+'</span><span class="hook-choice-badge">'+esc(c.status)+'</span></div><h4>'+esc(c.title)+'</h4><p>'+esc(c.concept)+'</p><p class="hook-choice-why"><strong>Why it fits:</strong> '+esc(c.why)+'</p><div class="hook-choice-actions"><button type="button" class="primary use-hook-btn">'+(active===c.id?'Active Hook ✓':'Use this Hook')+'</button><button type="button" class="ghost small copy-hook-btn">Copy prompt</button><button type="button" class="ghost small preview-hook-btn">Preview</button></div>';
    el.querySelector('.use-hook-btn').addEventListener('click',function(){useHook(c);});
    el.querySelector('.copy-hook-btn').addEventListener('click',function(){navigator.clipboard.writeText(c.prompt).then(function(){toast('Hook prompt copied');}).catch(function(){toast('Copy failed');});});
    el.querySelector('.preview-hook-btn').addEventListener('click',function(e){var ta=el.querySelector('.hook-choice-preview');if(ta){ta.remove();e.currentTarget.textContent='Preview';return;}ta=document.createElement('textarea');ta.className='hook-choice-preview';ta.readOnly=true;ta.value=c.prompt;el.appendChild(ta);e.currentTarget.textContent='Hide';});
    grid.appendChild(el);
  });
}
var queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){setTimeout(function(){queued=false;render();},120);});}
window.addEventListener('load',schedule);
document.addEventListener('change',function(e){if(e.target.matches('#visualMode,#format'))schedule();});
var te=document.getElementById('topic');if(te)te.addEventListener('input',function(){setTimeout(schedule,180);});
document.addEventListener('click',function(e){if(e.target.closest('#buildBtn,.project-list button,.collapse-btn,#jumpStage'))schedule();});
var stages=document.getElementById('stages');if(stages)new MutationObserver(schedule).observe(stages,{childList:true,subtree:true});
window.LDHookChoiceSystem={render:render,choices:choices,useHook:useHook};
schedule();
})();
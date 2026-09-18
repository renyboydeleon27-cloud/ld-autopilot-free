(()=>{'use strict';
  const stages=document.getElementById('stages');
  if(!stages)return;

  const MARKER='GLOBAL SCENE VARIETY LOCK:';
  const CAMERA_MARKER='PROFESSIONAL CAMERA PLAN:';

  const GLOBAL_RULE=`${MARKER} Each stage must present a visually distinct cinematic moment. Do not repeat the same background, same street view, same train-side composition, same environmental layout, or same exact location framing across multiple stages unless continuity absolutely requires it. Do not make several stages feel like the same image with only different characters. Vary historically believable sub-locations across the event when narratively appropriate: homes and interior rooms, schools, hospitals, markets, factories, bridges, rail areas, waterfront or coastal areas, ports, public buildings, shelters, rescue zones, farms, workshops, offices, corridors, treatment areas, and other event-appropriate places. Do not overuse outdoor street scenes. When nearby stages already use a street, railway, or repeated urban exterior, deliberately choose a different plausible sub-location or interior for the next stage when supported by the narration and historical event. Preserve historical, geographic, scientific, and disaster accuracy at all times.

LOCATION VARIETY LOCK: Choose a visually fresh, historically appropriate sub-location that has not been overused in nearby stages. The location must fit the current narration and scene role; never force a school, hospital, coast, train, home, or other setting when it would be historically or narratively unsupported.

CAMERA ANGLE VARIETY LOCK: Use professional cinematic shot planning across stages. Avoid repeating the same camera height, distance, direction, lens feel, and composition in nearby stages. Vary between wide establishing views, medium survival shots, low-angle danger shots, high-angle overview shots, over-the-shoulder views, side-angle action shots, interior framing, foreground-object framing, ground-level perspectives, three-quarter views, and deep perspective compositions as appropriate.

ANTI-REPETITION LOCK: Each stage must differ meaningfully from nearby stages in several of the following: sub-location, camera angle, framing, foreground object, background layout, depth structure, subject placement, dominant action, and disaster interaction. If a train, railway, street, bridge, hospital, school, house, market, coastline, factory, or other recognizable backdrop already appeared recently, do not reuse the same composition merely with different adults. Use a clearly different place, visual purpose, and camera position.`;

  const CAMERA_PLANS={
    HOOK:'Immersive human-level crisis framing with strong foreground depth; use a dynamic three-quarter or low human-level angle rather than a flat centered street view.',
    P1:'Wide establishing composition that clearly introduces a distinct place and normal-world context.',
    P2:'Closer environmental or contextual detail from a different height or direction than P1; use layered foreground framing.',
    P3:'Medium-wide three-quarter view with strong depth and a different background axis from the previous stage.',
    P4:'Interior, doorway, window, corridor, or foreground-object framing when historically and narratively appropriate; otherwise use a clearly new exterior angle.',
    P5:'Low-angle or ground-level danger perspective with a readable dominant action and strong foreground-midground-background separation.',
    P6:'Wide infrastructure or systems-failure view from a side or diagonal perspective; avoid repeating the HOOK composition.',
    P7:'High-angle, elevated, or long-lens overview where plausible, showing a different affected zone rather than the same street.',
    P8:'Over-the-shoulder or side-angle human perspective into the damaged environment; keep the background distinct from P7.',
    P9:'Medium documentary rescue or survivor view with foreground tools/debris framing and a different location axis.',
    P10:'Wider human-cost or emergency-response composition in a distinct sub-location such as treatment, public space, hospital, shelter, or rescue zone when supported.',
    P11:'Interior or semi-interior relief/shelter/treatment composition when appropriate, using layered depth instead of another open street.',
    P12:'Wide material/infrastructure impact view from a fresh elevation or diagonal axis; use a different district or facility when supported.',
    P13:'Medium-wide recovery/rebuilding composition with foreground work detail and a distinct background from earlier destruction scenes.',
    P14:'Calm wide or elevated legacy composition with stable geometry and visual contrast from the disaster-stage camera language.'
  };

  function stageName(card){return (card.dataset.stage||card.querySelector('.stage-name')?.textContent||'').trim().toUpperCase();}
  function cameraPlan(stage){
    if(CAMERA_PLANS[stage])return CAMERA_PLANS[stage];
    if(/^S\d+$/.test(stage)){
      const n=Number(stage.slice(1));
      const plans=[
        'Wide establishing view from a fresh axis with clear foreground-midground-background depth.',
        'Medium human-level documentary angle using foreground-object framing.',
        'Low-angle or ground-level perspective emphasizing scale and danger.',
        'High-angle or elevated overview showing a different sub-location.',
        'Over-the-shoulder or side-angle composition with deep perspective.',
        'Interior or semi-interior framing when narratively plausible; otherwise use a distinct exterior camera axis.'
      ];
      return plans[(n-1)%plans.length];
    }
    return 'Use a professional camera angle and framing that clearly differs from nearby stages while remaining appropriate to the narration.';
  }

  function stripOld(text){
    return String(text||'')
      .replace(/\n*GLOBAL SCENE VARIETY LOCK:[\s\S]*?(?=\n\nPROFESSIONAL CAMERA PLAN:|$)/i,'')
      .replace(/\n*PROFESSIONAL CAMERA PLAN:[^\n]*(?:\n|$)/i,'')
      .trim();
  }

  let guard=false;
  function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}

  function applyCard(card){
    const stage=stageName(card);
    if(!stage||stage==='ENDING'||stage==='THUMBNAIL')return false;
    const el=card.querySelector('.image-prompt');
    if(!el||!el.value.trim())return false;
    const base=stripOld(el.value);
    const next=`${base}\n\n${GLOBAL_RULE}\n\n${CAMERA_MARKER} ${cameraPlan(stage)}`;
    if(next===el.value)return false;
    guard=true;el.value=next;fire(el);guard=false;
    return true;
  }

  function applyAll(){
    stages.querySelectorAll('.stage-card').forEach(applyCard);
  }

  function later(){
    [120,260,520].forEach(ms=>setTimeout(applyAll,ms));
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))later();
  },true);
  document.addEventListener('change',e=>{
    if(e.target.closest('#visualMode,#format'))later();
  },true);
  document.addEventListener('input',e=>{
    if(guard)return;
    if(e.target.closest('#topic'))later();
  },true);

  new MutationObserver(ms=>{
    if(ms.some(m=>m.type==='childList'))setTimeout(applyAll,180);
  }).observe(stages,{childList:true,subtree:true});

  window.addEventListener('load',()=>setTimeout(applyAll,700));
  setTimeout(applyAll,350);
})();
(()=>{
  const stages=document.getElementById('stages');
  if(!stages)return;

  const MARKER='HOOK SURVIVAL LOCK';
  const RULE=`${MARKER}: The HOOK begins DURING THE DISASTER at or near its most dangerous moment. Immediately place the audience inside the active catastrophe, not before it and not after it. Show adult survivors actively struggling against the disaster rather than simply watching it. The environment must already be visibly damaged, destroyed, flooded, burning, collapsing, or violently affected as historically and physically appropriate to the specific event. Use event-appropriate active hazards such as debris, damaged structures, vehicles or boats, flooding, storm surge, fire, smoke, dust, violent weather, collapsing terrain, waves, ash, or other forces supported by the disaster. Adults may be running, gripping structures, escaping dangerous areas, helping one another, protecting themselves, fighting currents or wind, or otherwise making urgent survival efforts appropriate to the event. The disaster must still be actively affecting the scene. The image must immediately create the question: “What happened here—and will they survive?” ABSOLUTE NEGATIVE LOCK: no peaceful HOOK, no calm-before-the-disaster HOOK, no merely approaching-disaster HOOK, no distant observer-only composition, and no quiet aftermath. If any other scene instruction conflicts with this HOOK SURVIVAL LOCK, this lock takes priority.`;

  function fire(el){
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function enforce(){
    const card=stages.querySelector('.stage-card[data-stage="HOOK"]');
    const prompt=card?.querySelector('.image-prompt');
    if(!prompt)return false;
    let base=prompt.value.trim();
    if(base.includes(MARKER))return false;
    base=base.replace(/Curiosity-first disaster reveal[^.]*\.?/gi,'Immediate active-disaster human-survival hook.');
    prompt.value=`${base}\n\n${RULE}`.trim();
    prompt.dataset.hookSurvivalLock='v3.7';
    fire(prompt);
    return true;
  }

  function enforceAfterGenerators(){
    [0,120,320,600].forEach(ms=>setTimeout(enforce,ms));
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#buildBtn, #generateAllBtn, .generate-template-btn')) enforceAfterGenerators();
  },false);

  new MutationObserver(ms=>{
    if(ms.some(m=>m.type==='childList')) enforceAfterGenerators();
  }).observe(stages,{childList:true,subtree:false});

  window.addEventListener('load',()=>setTimeout(enforce,700));
  setTimeout(enforce,250);
})();

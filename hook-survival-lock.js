(()=>{
  const stages=document.getElementById('stages');
  if(!stages)return;

  const MARKER='HOOK SURVIVAL LOCK';
  const FLOW_MARKER='HOOK FLOW SURVIVAL LOCK';
  const RULE=`${MARKER}: The HOOK begins DURING THE DISASTER at or near its most dangerous moment. Immediately place the audience inside the active catastrophe, not before it and not after it. Show adult survivors actively struggling against the disaster rather than simply watching it. The environment must already be visibly damaged, destroyed, flooded, burning, collapsing, or violently affected as historically and physically appropriate to the specific event. Use event-appropriate active hazards such as debris, damaged structures, vehicles or boats, flooding, storm surge, fire, smoke, dust, violent weather, collapsing terrain, waves, ash, or other forces supported by the disaster. Adults may be running, gripping structures, escaping dangerous areas, helping one another, protecting themselves, fighting currents or wind, or otherwise making urgent survival efforts appropriate to the event. The disaster must still be actively affecting the scene. The image must immediately create the question: “What happened here—and will they survive?” ABSOLUTE NEGATIVE LOCK: no peaceful HOOK, no calm-before-the-disaster HOOK, no merely approaching-disaster HOOK, no distant observer-only composition, and no quiet aftermath. If any other scene instruction conflicts with this HOOK SURVIVAL LOCK, this lock takes priority.`;
  const FLOW_RULE=`${FLOW_MARKER}: This HOOK is already inside the active catastrophe. Begin clearly readable disaster-caused motion within 0.5 second and sustain meaningful motion through all 10 seconds. PRIMARY ACTION: active human-survival movement already supported by the supplied illustration—adults may brace, grip, escape, help one another, protect themselves, fight current or wind, or react physically to shaking as appropriate to the event. Animate only disaster effects and environmental elements already supported by the image, with believable physics. Preserve the supplied illustration, adult identity/count/anatomy, historical setting, architecture, objects, perspective, palette and lighting. One continuous 2D shot and one restrained camera behavior only. Natural event-appropriate SFX only; no music or voice-over. No calm-before, pre-event, merely approaching-disaster, or quiet-aftermath motion. No cuts, transitions, morphing, duplication, new people, new structures, unsupported destruction, photoreal drift, live action or 3D CGI.`;

  function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}

  function enforce(){
    const card=stages.querySelector('.stage-card[data-stage="HOOK"]');
    if(!card)return false;
    const prompt=card.querySelector('.image-prompt');
    const flow=card.querySelector('.flow-prompt');
    const role=card.querySelector('.scene-role');
    if(role)role.textContent='ACTIVE DISASTER · HUMAN SURVIVAL · peak-danger opening';
    let changed=false;
    if(prompt&&!prompt.value.includes(MARKER)){
      const base=prompt.value.trim().replace(/Curiosity-first disaster reveal[^.]*\.?/gi,'Immediate active-disaster human-survival hook.');
      prompt.value=`${base}\n\n${RULE}`.trim();fire(prompt);changed=true;
    }
    if(flow&&!flow.value.includes(FLOW_MARKER)){
      let base=flow.value.trim().replace(/subtle pre-event environment motion/gi,'active disaster human-survival movement');
      flow.value=`${base}\n\n${FLOW_RULE}`.trim();fire(flow);changed=true;
    }
    return changed;
  }

  function later(){[0,150,400].forEach(ms=>setTimeout(enforce,ms));}
  document.addEventListener('click',e=>{if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))later();},false);
  window.addEventListener('load',()=>setTimeout(enforce,500));
  setTimeout(enforce,200);
})();

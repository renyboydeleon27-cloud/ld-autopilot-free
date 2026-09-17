(()=>{
  const stages=document.getElementById('stages');
  if(!stages)return;

  const MARKER='HOOK SURVIVAL LOCK';
  const FLOW_MARKER='HOOK FLOW SURVIVAL LOCK';
  const ANATOMY_MARKER='ANATOMY CLARITY LOCK';
  const FLOW_ANATOMY_MARKER='ANATOMY PRESERVATION LOCK';
  const STRUCTURE_MARKER='STRUCTURE PRESERVATION LOCK';
  const FOREGROUND_MARKER='FOREGROUND SUBJECT LOCK';
  const FLOW_FOREGROUND_MARKER='FOREGROUND POSE LOCK';

  const RULE=`${MARKER}: The HOOK begins DURING THE DISASTER at or near its most dangerous moment. Immediately place the audience inside the active catastrophe, not before it and not after it. Show adult survivors actively struggling against the disaster rather than simply watching it. The environment must already be visibly damaged, destroyed, flooded, burning, collapsing, shaking, or violently affected as historically and physically appropriate to the specific event. Use event-appropriate active hazards such as debris, damaged or collapsing structures, vehicles or boats, flooding, storm surge, fire, smoke, dust, violent weather, collapsing terrain, waves, ash, falling materials, broken utilities, or other forces supported by the disaster. Adults may be running, gripping structures, escaping dangerous areas, helping one another, protecting themselves, fighting currents or wind, bracing against shaking, or otherwise making urgent survival efforts appropriate to the event. The disaster must still be actively affecting the scene. The image must immediately create the question: “What happened here—and will they survive?”\n\nABSOLUTE NEGATIVE LOCK: no peaceful HOOK, no calm-before-the-disaster HOOK, no merely approaching-disaster HOOK, no distant observer-only composition, and no quiet aftermath. If any other scene instruction conflicts with this HOOK SURVIVAL LOCK, this lock takes priority.`;

  const ANATOMY_RULE=`${ANATOMY_MARKER}: Keep all adult anatomy clean, readable, and physically correct. Each visible person must have exactly two arms and two hands only, with no duplicated limbs, merged limbs, extra fingers, or ambiguous overlapping hands. Maintain clean silhouette separation between nearby people so no limb appears duplicated, fused, or attached to the wrong person.`;

  const EARTHQUAKE_FOREGROUND_RULE=`${FOREGROUND_MARKER}: The main foreground adult must be shown in a clear, readable survival pose: one hand gripping a vertical wooden post or other clearly visible fixed vertical support for stability and the other hand protecting the head. Keep both arms clearly visible, physically correct, and naturally attached. The pose must read instantly and must not be confusing or tangled.`;

  function isReal(){return document.body.dataset.visualMode==='real'||document.getElementById('visualMode')?.value==='real';}
  function isEarthquake(text){return /earthquake|seismic|ground shaking/i.test(String(text||''));}
  function visualRef(){return isReal()?'supplied live-action historical frame':'supplied illustration';}
  function shotType(){return isReal()?'one continuous live-action historical documentary shot':'one continuous 2D shot';}

  function flowRule(){
    const ref=visualRef();
    return `${FLOW_MARKER}: This HOOK is already inside the active catastrophe. Begin clearly readable disaster-caused motion within 0.5 second and sustain meaningful motion through all 10 seconds. PRIMARY ACTION: active human-survival movement already supported by the ${ref}—adults may brace, grip, escape, help one another, protect themselves, fight current or wind, stumble or regain balance, or react physically to shaking, falling debris, dust, fire, smoke, water, wind, or other event-appropriate hazards. Animate only disaster effects and environmental elements already supported by the image, with believable physics. Preserve the ${ref}, adult identity/count/anatomy, historical setting, architecture, objects, perspective, palette and lighting. Use ${shotType()} and one restrained camera behavior only. Natural event-appropriate SFX only; no music or voice-over.\n\nNEGATIVE LOCK: no calm-before-the-disaster motion, no pre-event motion, no merely approaching-disaster motion, and no quiet aftermath motion. No cuts, transitions, morphing, time-lapse, duplication, new people, new structures, unsupported destruction, architecture reshaping, anime drift, illustration drift, stylized rendering drift, 3D CGI transformation, plastic skin, glossy artificial sharpening, text, captions, logos, or watermark.`;
  }

  const FLOW_ANATOMY_RULE=`${FLOW_ANATOMY_MARKER}: Preserve clean, physically correct anatomy throughout the entire shot. Every visible person must retain exactly two arms and two hands only. No duplicated limbs, no extra hands, no finger multiplication, no limb merging, and no ambiguous overlapping arm motion.`;

  const STRUCTURE_RULE=`${STRUCTURE_MARKER}: Preserve every major building, wall, roofline, utility pole, street edge, vehicle or cart, boat, large terrain feature, and large debris object exactly as shown in the supplied frame. Do not collapse, rebuild, reshape, replace, slide, duplicate, or invent major structures during the shot. Do not alter the layout of streets, waterways, terrain, or the silhouette of architecture. Disaster motion must come only from physically believable movement already supported by the source image: restrained camera response, loose debris already present, dust, smoke, fire, water, wind, precipitation, fabric movement, vegetation movement, and supported human reactions. No large new destruction unless that destruction is already visibly in progress in the supplied frame.`;

  const EARTHQUAKE_FLOW_FOREGROUND_RULE=`${FLOW_FOREGROUND_MARKER}: Keep the foreground adult’s pose anchored throughout the entire shot. One hand must remain gripping the same vertical support and the other hand must remain protecting the head. Do not switch hands, release the support, create a new gesture, or reposition either arm. Allow only tiny natural body vibration, impact reaction, breathing, and supported balance correction while preserving exact limb placement and clear hand readability at all times.`;

  function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
  function appendOnce(text,marker,rule){return text.includes(marker)?text:`${text.trim()}\n\n${rule}`.trim();}

  function enforce(){
    const card=stages.querySelector('.stage-card[data-stage="HOOK"]');
    if(!card)return false;
    const prompt=card.querySelector('.image-prompt');
    const flow=card.querySelector('.flow-prompt');
    const role=card.querySelector('.scene-role');
    if(role)role.textContent='ACTIVE DISASTER · HUMAN SURVIVAL · peak-danger opening';
    let changed=false;

    if(prompt&&prompt.value.trim()){
      let out=prompt.value.trim().replace(/Curiosity-first disaster reveal[^.]*\.?/gi,'Immediate active-disaster human-survival hook.');
      out=appendOnce(out,MARKER,RULE);
      if(isReal())out=appendOnce(out,ANATOMY_MARKER,ANATOMY_RULE);
      if(isReal()&&isEarthquake(`${document.getElementById('topic')?.value||''} ${out}`))out=appendOnce(out,FOREGROUND_MARKER,EARTHQUAKE_FOREGROUND_RULE);
      if(out!==prompt.value){prompt.value=out;fire(prompt);changed=true;}
    }

    if(flow&&flow.value.trim()){
      let out=flow.value.trim().replace(/subtle pre-event environment motion/gi,'active disaster human-survival movement');
      out=appendOnce(out,FLOW_MARKER,flowRule());
      if(isReal())out=appendOnce(out,FLOW_ANATOMY_MARKER,FLOW_ANATOMY_RULE);
      if(isReal())out=appendOnce(out,STRUCTURE_MARKER,STRUCTURE_RULE);
      if(isReal()&&isEarthquake(`${document.getElementById('topic')?.value||''} ${prompt?.value||''}`))out=appendOnce(out,FLOW_FOREGROUND_MARKER,EARTHQUAKE_FLOW_FOREGROUND_RULE);
      if(out!==flow.value){flow.value=out;fire(flow);changed=true;}
    }
    return changed;
  }

  function later(){[0,120,320,700].forEach(ms=>setTimeout(enforce,ms));}
  document.addEventListener('click',e=>{if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))later();},false);
  document.addEventListener('change',e=>{if(e.target.closest('#visualMode'))later();},false);
  document.addEventListener('input',e=>{if(e.target.closest('#topic'))later();},false);
  window.addEventListener('load',()=>setTimeout(enforce,500));
  setTimeout(enforce,200);
})();

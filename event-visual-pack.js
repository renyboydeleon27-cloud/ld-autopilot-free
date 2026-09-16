(()=>{
  const stagesEl=document.getElementById('stages');
  const topicEl=document.getElementById('topic');
  if(!stagesEl||!topicEl)return;

  function normalize(text){return (text||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();}
  function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}

  const TANGSHAN_SCENES={
    HOOK:'Pre-dawn Tangshan at about 3:42 a.m., violent earthquake shaking, damaged brick apartment blocks and industrial structures, cracked street, dust and falling debris, one adult foreground survivor for scale, dramatic low light, immediate disaster readability.',
    P1:'Tangshan before the earthquake: a busy 1976 northern Chinese industrial city with brick apartment blocks, factories, rail infrastructure, bicycles, utility poles, period street lighting and adults beginning or ending night shifts; calm pre-dawn atmosphere.',
    P2:'Conceptual but grounded view of tectonic stress building beneath the Tangshan region, showing the city above and faulted crust below without modern infographic styling; retain serious historical graphic-novel presentation.',
    P3:'The fault ruptures at 3:42 a.m.; strong seismic motion reaches Tangshan, with street surfaces, utility poles, factory structures and apartment blocks visibly reacting while preserving architecture and anatomy.',
    P4:'Inside and immediately outside 1976 residential buildings, adults waking as walls crack, hanging lights swing, plaster falls and rooms shake; no children, no gore, historically appropriate interiors and clothing.',
    P5:'Brick apartment blocks, factory buildings and public structures suffer major structural damage during peak shaking; dust clouds, falling masonry and broken windows, with adults kept at safe readable distance.',
    P6:'A Tangshan transport corridor during the earthquake: cracked road surface, buckled railway tracks, damaged utility lines and industrial infrastructure, with controlled debris and dust.',
    P7:'Night-to-dawn transition in a devastated neighborhood; adult survivors move through dust and darkness between collapsed brick buildings and unstable debris, searching for safe routes.',
    P8:'Wide view of destruction across Tangshan: damaged homes, factory districts, rail lines, utility poles, roads and public buildings, showing the disaster scale without gore.',
    P9:'Early daylight reveals Tangshan in ruins; shattered streets, collapsed brick structures, dense dust haze and adult survivors searching wreckage by hand and with simple tools.',
    P10:'Human-cost scene focused on scale rather than bodies: large ruined urban area, rows of damaged housing and public structures, exhausted adult survivors and responders, restrained memorial tone, no gore.',
    P11:'Emergency survival conditions after the earthquake: adults gathered in open areas and makeshift shelters, limited water and supplies, damaged utilities and medical response activity, all period-appropriate to 1976 China.',
    P12:'Rescue scene with adult civilians, workers and soldiers carefully searching unstable ruins using simple period tools, stretchers and organized aid activity; no gore.',
    P13:'Early reconstruction in Tangshan: rubble clearing, repaired roads, rebuilding crews, surviving industrial structures and emerging new construction, hopeful but historically grounded tone.',
    P14:'Reflective legacy scene combining rebuilt Tangshan with subtle earthquake-preparedness symbolism, stronger urban structures and a calm memorial atmosphere; no modern futuristic elements.',
    ENDING:'Reflective post-disaster Tangshan recovery scene with repaired streets, rebuilding activity, surviving adults looking across a recovering city, warm late-afternoon light, serious hopeful mood. Include clean readable branding: LIVING DISASTER BOOK, 1976 TANGSHAN EARTHQUAKE, THANK YOU FOR WATCHING, LIKE • SHARE • SUBSCRIBE.',
    THUMBNAIL:'High-impact mobile-first composition: one strong adult foreground survivor, devastated 1976 Tangshan clearly visible behind them with collapsed brick apartment blocks, damaged factories, cracked streets, debris and dust. Large readable headline: TANGSHAN 1976. Smaller line: THE DEADLY EARTHQUAKE.'
  };

  const ACTIONS={
    HOOK:'controlled documentary earthquake vibration, falling dust, swinging utility wires, restrained debris movement and a 3% push-in toward the destruction',
    P1:'subtle bicycle wheel movement, light factory smoke, faint utility-wire sway and gentle pre-dawn atmospheric drift with a slow 2% push-in',
    P2:'restrained subsurface fault displacement and traveling seismic energy while the surface city remains compositionally stable; slow 2% push-in',
    P3:'short lateral and restrained vertical earthquake motion, utility-wire oscillation, sign and lamp swing, dust release and a 2% forward creep',
    P4:'controlled room shaking, hanging-light swing, small loose-object movement and falling plaster dust while adults remain anatomically stable; subtle handheld vibration',
    P5:'peak but controlled structural vibration, existing masonry falling, dust expanding and wires oscillating; no invented collapses beyond the supplied scene; 2% push-in',
    P6:'ground vibration, existing rail and utility movement, drifting dust and slight debris shifts with restrained documentary camera vibration',
    P7:'dust haze drifting, small clothing movement, restrained adult walking or bracing where poses support it, distant aftershock vibration and a slow 3% push-in',
    P8:'subtle aftershock tremor, dust settling, loose wires swaying and distant smoke or haze drifting across the wide devastation',
    P9:'restrained rescue hand movement for visible adults, drifting dust, cloth movement, small debris shifts and a slow 3% push-in',
    P10:'very restrained aftermath motion: drifting dust and haze, fabric movement, distant response activity and slow 2% push-in; solemn pacing',
    P11:'tent and cloth flutter, supply handling by visible adults, faint smoke or haze drift and small purposeful movement; 2% push-in',
    P12:'careful independent rescue movement by 3–5 visible adults, dust drift, cloth movement and small debris handling with a slow 3% push-in',
    P13:'restrained rebuilding activity, dust from rubble clearing, cloth and flag movement, limited worker motion and slow 3% push-in',
    P14:'subtle city atmosphere, distant adult movement, light haze and gentle fabric motion with a calm 2% push-in'
  };

  const HIST='HISTORICAL CONTEXT LOCK: Tangshan, China, July 1976. Use era-appropriate brick apartment blocks, factories, railways, roads, bicycles, utility poles, clothing, tools, signs, building materials and infrastructure. Avoid modern cars, LED lighting, glass skyscrapers, contemporary safety gear, smartphones or modern signage.';
  const STYLE='Serious colored historical graphic-novel/anime illustration, detailed hand-inked linework, cel-painted textures, strong cinematic depth and contrast, adult characters only. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore.';

  function imagePrompt(stage){
    const scene=TANGSHAN_SCENES[stage]; if(!scene)return'';
    if(stage==='ENDING'||stage==='THUMBNAIL') return `Create the ${stage==='ENDING'?'ENDING illustration':'YouTube thumbnail'} for the 1976 Tangshan Earthquake, portrait 9:16. ${scene} ${STYLE} ${HIST} Illustration only.`;
    return `Create the Living Disaster Book ${stage} illustration for the 1976 Tangshan Earthquake, portrait 9:16. ${scene} ${STYLE} ${HIST} Keep one clear cinematic focal action and preserve physically believable earthquake damage. No captions, labels, statistics or narration text in the illustration.`;
  }

  function flowPrompt(stage){
    if(stage==='ENDING'||stage==='THUMBNAIL'||!ACTIONS[stage])return'';
    return `Animate the supplied 1976 Tangshan Earthquake ${stage} illustration for exactly 10 seconds, portrait 9:16, as one continuous cinematic 2D shot. Use the supplied image as the absolute visual reference. Preserve the exact serious colored historical graphic-novel/anime illustration, hand-inked linework, cel-painted textures, architecture, adult identities, clothing, objects, perspective, lighting and composition. Begin clearly readable motion within the first 0.5 second and sustain meaningful motion through second 10. PRIMARY ACTION: ${ACTIONS[stage]}. Animate only 3–7 supported environmental elements and up to 3–5 visible adults independently when their poses support movement. Keep adults anchored to established positions and preserve anatomy, faces and count. Maintain foreground, midground and background depth. ${HIST} Natural SFX only: earthquake rumble where appropriate, debris and masonry sounds, wind, cloth, distant rescue or city ambience as supported by the scene. No voice-over and no music. NEGATIVE LOCK: no cuts, transitions, morphing, time-lapse, duplication, new people, new vehicles, invented buildings, unsupported destruction, anatomy drift, object growth, photorealistic drift, live action, 3D CGI, text or logos.`;
  }

  function applyStage(card,force=false){
    if(normalize(topicEl.value)!=='1976 tangshan earthquake')return;
    const stage=card.dataset.stage;
    const img=card.querySelector('.image-prompt');
    const flow=card.querySelector('.flow-prompt');
    if(img && (force||!img.value.trim())){img.value=imagePrompt(stage);img.dataset.eventVisual='tangshan-v3.1';fire(img);}
    if(flow && stage!=='ENDING' && stage!=='THUMBNAIL' && (force||!flow.value.trim())){flow.value=flowPrompt(stage);flow.dataset.eventVisual='tangshan-v3.1';fire(flow);}
  }

  function applyAll(force=false){
    if(normalize(topicEl.value)!=='1976 tangshan earthquake')return false;
    [...stagesEl.querySelectorAll('.stage-card')].forEach(card=>applyStage(card,force));
    return true;
  }

  let freshBuild=false;
  document.addEventListener('click',e=>{
    if(e.target.closest('#buildBtn')){freshBuild=true;setTimeout(()=>{applyAll(true);freshBuild=false;},60);}
    if(e.target.closest('#generateAllBtn'))setTimeout(()=>applyAll(true),60);
    const one=e.target.closest('.generate-template-btn');
    if(one)setTimeout(()=>applyStage(one.closest('.stage-card'),true),60);
  },true);

  new MutationObserver(ms=>{
    if(ms.some(m=>m.type==='childList'&&m.target===stagesEl)) setTimeout(()=>applyAll(freshBuild),20);
  }).observe(stagesEl,{childList:true});

  window.addEventListener('load',()=>setTimeout(()=>applyAll(false),120));
})();

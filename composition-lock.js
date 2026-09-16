(()=>{
  const topicEl=document.getElementById('topic');
  const stagesEl=document.getElementById('stages');
  const generateAllBtn=document.getElementById('generateAllBtn');
  const toast=document.getElementById('toast');
  if(!topicEl||!stagesEl)return;

  const MAPS=[
    {
      test:/1976\s+tangshan\s+earthquake/i,
      stages:{
        P1:'FOREGROUND: quiet period-correct street detail, bicycles or adult residents. MIDGROUND: intact brick worker housing and apartment blocks. BACKGROUND: factory chimneys, rail infrastructure and pre-dawn industrial skyline. Keep the city calm and structurally intact.',
        P2:'FOREGROUND: compressed rock layers and stressed fault textures. MIDGROUND: the locked fault zone beneath Tangshan. BACKGROUND: a small intact city silhouette above the geology for location context. No labels, arrows or fantasy glow.',
        P3:'FOREGROUND: street-level objects, masonry edges and utility fixtures beginning to shake. MIDGROUND: intact 1976 brick apartment blocks, factory structures and utility poles in the first seconds of violent shaking. BACKGROUND: pre-dawn Tangshan industrial skyline. Show onset only: small cracks, dust and swaying fixtures; no widespread collapse, no rubble field, no giant surface fissure.',
        P4:'FOREGROUND: interior furniture, lamps or street fixtures visibly reacting to shaking. MIDGROUND: adult residents bracing as walls crack and plaster falls. BACKGROUND: adjoining Tangshan housing and streets under strong vibration. Destruction is beginning, not yet total.',
        P5:'FOREGROUND: fresh brick and concrete debris with readable directional collapse. MIDGROUND: apartment blocks, homes and factory structures actively failing. BACKGROUND: dense Tangshan neighborhood disappearing into dust haze. Keep adults small and non-graphic.',
        P6:'FOREGROUND: cracked road edge or buckled rail track. MIDGROUND: fallen utility poles, damaged rail infrastructure and industrial facilities. BACKGROUND: smoke-free dust-hazed city infrastructure. Emphasize systems failure rather than human close-ups.',
        P7:'FOREGROUND: broken brick, concrete and steel framing. MIDGROUND: adult survivors surveying collapsed neighborhoods. BACKGROUND: broad early-morning Tangshan ruin field under dusty daylight. No fresh collapse action.',
        P8:'FOREGROUND: cracked road and failed utility details. MIDGROUND: unstable damaged buildings and adults moving cautiously. BACKGROUND: multiple damaged districts extending into haze. Communicate citywide crisis without repeating P5 peak-collapse composition.',
        P9:'FOREGROUND: adult civilians and workers digging by hand with shovels, pry bars and buckets through brick rubble. MIDGROUND: era-appropriate soldiers assisting beside an improvised stretcher and passing debris by hand. BACKGROUND: damaged 1976 worker housing and industrial buildings beneath suspended dust. Rescue is the dominant action; no modern rescue gear, hydraulic equipment, neon safety clothing, modern helmets or contemporary ambulances.',
        P10:'FOREGROUND: subdued adult survivors and basic medical or rescue supplies. MIDGROUND: organized emergency activity and temporary treatment among ruins. BACKGROUND: heavily damaged Tangshan neighborhoods. Convey scale and loss respectfully, with no bodies or gore.',
        P11:'FOREGROUND: water containers, blankets and relief supplies. MIDGROUND: adult survivors and responders around canvas shelters or simple treatment areas. BACKGROUND: damaged city structures. Keep the relief camp organized, period-correct and non-modern.',
        P12:'FOREGROUND: blocked road, broken rail or damaged utility details. MIDGROUND: ruined housing and industrial facilities. BACKGROUND: broader factory and transport network damage. Focus on economic/infrastructure consequences, not another rescue close-up.',
        P13:'FOREGROUND: brick clearing, hand tools and construction materials. MIDGROUND: adult workers rebuilding roads, homes or factories. BACKGROUND: repaired and still-damaged Tangshan structures together. Use restrained hopeful daylight and period-correct machinery.',
        P14:'RECOVERY ERA LOCK: this is a post-1976 legacy and rebuilding scene, not the immediate earthquake moment. FOREGROUND: calm adult residents or historically plausible preparedness-related civic detail. MIDGROUND: rebuilt Tangshan streets and stronger recovery-era structures that visually communicate safer reconstruction. BACKGROUND: a stable recovering city skyline. Reflect rebuilding, lessons learned and seismic preparedness. Do not show active earthquake destruction, fresh rubble, the pre-dawn 1976 disaster moment, futuristic technology, glossy present-day architecture, contemporary neon rescue gear or unsupported modern vehicles.'
      }
    },
    {
      test:/2004\s+indian\s+ocean\s+tsunami/i,
      stages:{
        P1:'FOREGROUND: ordinary shoreline life, fishing gear or adult residents. MIDGROUND: simple coastal homes, boats and market activity. BACKGROUND: calm tropical sea and horizon. Keep everything peaceful and intact.',
        P2:'FOREGROUND: compressed seafloor rock layers. MIDGROUND: locked subduction zone beneath the Indian Ocean. BACKGROUND: deep dark ocean water above. No labels, arrows or fantasy effects.',
        P3:'FOREGROUND: fractured seabed and suspended sediment. MIDGROUND: vertical displacement at the rupture zone. BACKGROUND: deep ocean water reacting above. Focus on geological cause, not a surface coastline.',
        P4:'FOREGROUND: open-ocean surface texture and long low wave energy. MIDGROUND: broad displaced water column. BACKGROUND: distant horizon with wave fronts spreading outward. No giant breaking wave in deep water.',
        P5:'FOREGROUND: exposed wet sand, rocks or stranded small boats. MIDGROUND: adult residents observing the unusually receded sea. BACKGROUND: distant withdrawn waterline and horizon. Emphasize the warning sign, not impact.',
        P6:'FOREGROUND: fast incoming water, foam and small debris. MIDGROUND: adults fleeing or bracing beside homes and shoreline streets. BACKGROUND: the first major surge entering the settlement. Keep the action readable and non-gory.',
        P7:'FOREGROUND: directional floodwater carrying timber or household debris. MIDGROUND: existing boats or vehicles pushed inland. BACKGROUND: damaged coastal town and continuing surge. Emphasize transport of debris rather than another first-impact shot.',
        P8:'FOREGROUND: broad ocean wave energy. MIDGROUND: layered open-water distance. BACKGROUND: multiple distant coastlines suggested in one coherent regional composition. No map labels or infographic look.',
        P9:'FOREGROUND: mud, standing water and scattered wreckage. MIDGROUND: adult survivors among broken boats and damaged homes. BACKGROUND: devastated shoreline beneath haze. The dominant mood is immediate aftermath, not active wave impact.',
        P10:'FOREGROUND: respectful survivor and relief activity. MIDGROUND: damaged neighborhoods and emergency response. BACKGROUND: wide devastation showing human scale. No visible bodies or gore.',
        P11:'FOREGROUND: water containers and basic supplies. MIDGROUND: tents or temporary shelters with adult displaced survivors. BACKGROUND: damaged coastal community. Keep the scene humanitarian and organized.',
        P12:'FOREGROUND: broken road, market or fishing equipment. MIDGROUND: damaged homes, boats and port structures. BACKGROUND: wider harbor and business district destruction. Focus on material and economic loss.',
        P13:'FOREGROUND: cleanup tools and rebuilding materials. MIDGROUND: adults repairing homes, roads or port facilities. BACKGROUND: recovering coastal community. Use restrained hopeful daylight without erasing remaining damage.',
        P14:'FOREGROUND: calm adult residents or preparedness detail. MIDGROUND: rebuilt coastline with warning or evacuation infrastructure where historically appropriate. BACKGROUND: calm ocean horizon. Communicate remembrance, recovery and preparedness.'
      }
    }
  ];

  function pack(){const t=topicEl.value.trim();return MAPS.find(p=>p.test.test(t));}
  function fireInput(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
  function showToast(text){if(!toast)return;toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);}

  function applyCard(card,p){
    const stage=card.dataset.stage;
    const comp=p?.stages?.[stage];
    if(!comp||stage==='ENDING'||stage==='THUMBNAIL')return false;
    const image=card.querySelector('.image-prompt');
    if(!image)return false;
    let next=image.value;
    const marker='SCENE COMPOSITION LOCK:';
    const block=`${marker} ${comp} Preserve clear foreground-midground-background separation, one dominant visual action, readable scale and period-correct spatial relationships.`;
    if(next.includes(marker)) next=next.replace(/SCENE COMPOSITION LOCK:[\s\S]*?(?=\s+HISTORICAL CONTEXT LOCK:|\s+FACT PACK:|$)/i,block);
    else {
      const lockIndex=next.indexOf('HISTORICAL CONTEXT LOCK:');
      if(lockIndex>=0) next=`${next.slice(0,lockIndex).trim()} ${block} ${next.slice(lockIndex)}`;
      else next=`${next.trim()} ${block}`;
    }
    if(next===image.value)return false;
    image.value=next;fireInput(image);return true;
  }

  function applyAll(message=false){
    const p=pack();
    if(!p)return;
    let n=0;
    stagesEl.querySelectorAll('.stage-card').forEach(card=>{if(applyCard(card,p))n++;});
    if(message)showToast(n?`Composition lock synced ${n} stage${n===1?'':'s'}`:'Composition locks already synced');
  }

  generateAllBtn?.addEventListener('click',()=>setTimeout(()=>applyAll(true),320));
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(!btn)return;
    const card=btn.closest('.stage-card');
    setTimeout(()=>{const p=pack();if(p&&applyCard(card,p))showToast('Scene composition lock synced');},320);
  });
  setTimeout(()=>applyAll(false),900);
})();
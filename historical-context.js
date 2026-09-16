(()=>{
  const topicEl=document.getElementById('topic');
  const stagesEl=document.getElementById('stages');
  const generateAllBtn=document.getElementById('generateAllBtn');
  const toast=document.getElementById('toast');
  if(!topicEl||!stagesEl)return;

  function showToast(text){
    if(!toast)return;
    toast.textContent=text;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);
  }

  function topic(){return topicEl.value.trim();}

  const KNOWN_CONTEXTS=[
    {
      test:/1976\s+tangshan\s+earthquake/i,
      place:'Tangshan, China',
      year:'1976',
      era:'mid-1970s northern Chinese industrial city',
      facts:{
        date:'July 28, 1976',
        time:'about 3:42 a.m. local time',
        magnitude:'about magnitude 7.5',
        deaths:'officially more than 242,000 deaths were reported',
        injuries:'more than 160,000 people were seriously injured',
        setting:'Tangshan was a major industrial and coal-mining city with factories, railways, apartment blocks and dense residential districts',
        impact:'large parts of the city were destroyed and transport, utilities and communications were heavily disrupted',
        response:'survivors, workers and soldiers searched collapsed buildings while strong aftershocks continued',
        legacy:'reconstruction and later seismic planning emphasized stronger building standards, preparedness and emergency response'
      },
      stages:{
        HOOK:'At about 3:42 a.m. on July 28, 1976, Tangshan was asleep. Seconds later, a devastating earthquake tore through the industrial city.',
        P1:'Daily life continues across Tangshan before any visible sign of the coming earthquake.',
        P2:'Beneath the region, tectonic stress builds along the fault system affecting Tangshan.',
        P3:'Before dawn on July 28, 1976, a powerful earthquake of about magnitude 7.5 suddenly ruptures beneath the Tangshan region.',
        P4:'Violent shaking strikes the city with almost no warning, throwing sleeping residents awake as buildings begin to fail.',
        P5:'Apartment blocks, homes, factories and public buildings collapse across large parts of Tangshan.',
        P6:'Railways buckle, roads crack, utilities fail and industrial facilities are heavily damaged as the shaking continues.',
        P7:'When daylight arrives, survivors find entire neighborhoods buried beneath concrete, brick and twisted steel.',
        P8:'Strong aftershocks and widespread infrastructure failure expand the crisis beyond the first collapsed areas.',
        P9:'Using bare hands and simple tools, survivors, workers and soldiers search unstable ruins for trapped people.',
        P10:'The human toll becomes catastrophic as emergency response begins across a city with severe transport and communication damage.',
        P11:'Temporary shelters and emergency camps form while survivors wait for food, water, medical care and news of relatives.',
        P12:'Factories, railways, housing, roads and public services lie heavily damaged, disrupting Tangshan’s industrial life and recovery.',
        P13:'Reconstruction begins as debris is cleared and Tangshan gradually rebuilds homes, roads, factories and essential services.',
        P14:'The Tangshan earthquake leaves lasting lessons for earthquake-resistant construction, emergency planning, rescue and seismic preparedness.'
      }
    },
    {
      test:/2004\s+indian\s+ocean\s+tsunami/i,
      place:'Indian Ocean coastal communities',
      year:'2004',
      era:'early-2000s Indian Ocean coastal communities',
      facts:{
        date:'December 26, 2004',
        magnitude:'magnitude 9.1',
        origin:'the earthquake ruptured off northern Sumatra and displaced the seafloor',
        reach:'tsunami waves crossed the Indian Ocean and struck coastlines in more than a dozen countries',
        deaths:'more than 227,000 people were killed or reported missing',
        displaced:'about 1.7 million people were displaced',
        impact:'homes, ports, roads, fishing fleets, businesses and coastal infrastructure were devastated',
        legacy:'the disaster accelerated development of Indian Ocean tsunami warning systems, evacuation planning and regional preparedness'
      },
      stages:{
        HOOK:'The ocean looks calm, then the sea suddenly pulls away from shore. What returns is far more destructive.',
        P1:'Coastal communities around the Indian Ocean begin an ordinary morning beside calm tropical water, unaware of the danger building offshore.',
        P2:'Far beneath the Indian Ocean, immense tectonic plates remain locked while enormous pressure builds beneath the seafloor.',
        P3:'On December 26, 2004, a magnitude 9.1 earthquake ruptures off northern Sumatra and violently displaces the seafloor.',
        P4:'The sudden seafloor movement displaces a vast volume of water, sending long tsunami waves outward across the Indian Ocean.',
        P5:'Along some coasts, the sea draws back unusually far, exposing seabed and stranded boats with little or no warning.',
        P6:'The first major waves reach shore and surge inland with destructive force, overwhelming coastal roads, homes and businesses.',
        P7:'Floodwater carries boats, vehicles, timber and debris deep inland as coastal communities are struck in rapid succession.',
        P8:'The tsunami reaches coastlines across more than a dozen countries, spreading destruction far beyond the first impact zone.',
        P9:'As water recedes, mud, wreckage and standing water cover devastated coastal communities.',
        P10:'More than 227,000 people are killed or reported missing across the affected region, making the disaster one of the deadliest tsunamis in recorded history.',
        P11:'About 1.7 million people are displaced, leaving survivors dependent on temporary shelter, clean water and emergency supplies.',
        P12:'Ports, roads, homes, fishing fleets, businesses and local infrastructure lie heavily damaged across affected coastlines.',
        P13:'Recovery begins as survivors, workers and responders clear debris and rebuild homes, roads, schools, ports and essential services.',
        P14:'The 2004 Indian Ocean Tsunami changes tsunami warning systems, evacuation planning, regional preparedness and remembrance.'
      }
    }
  ];

  function typeFromTopic(t){
    const s=t.toLowerCase();
    if(/tsunami|tidal wave/.test(s))return'tsunami';
    if(/earthquake|quake|seismic/.test(s))return'earthquake';
    if(/volcano|eruption|lahar|pyroclastic/.test(s))return'volcano';
    if(/tornado|twister/.test(s))return'tornado';
    if(/cyclone|hurricane|typhoon/.test(s))return'cyclone';
    if(/flood|dam failure|storm surge/.test(s))return'flood';
    if(/landslide|mudslide|avalanche|glacier collapse/.test(s))return'landslide';
    if(/wildfire|forest fire|firestorm/.test(s))return'wildfire';
    if(/locust|insect/.test(s))return'insect';
    return'generic';
  }

  function inferContext(t){
    const known=KNOWN_CONTEXTS.find(x=>x.test.test(t));
    if(known)return {...known,type:typeFromTopic(t),topic:t,known:true};
    const year=(t.match(/\b(18|19|20)\d{2}\b/)||[])[0]||'';
    const type=typeFromTopic(t);
    const typeWords={earthquake:/\bearthquake\b/i,tsunami:/\btsunami\b/i,volcano:/\b(volcano|eruption)\b/i,tornado:/\btornado\b/i,cyclone:/\b(cyclone|hurricane|typhoon)\b/i,flood:/\bflood\b/i,landslide:/\b(landslide|avalanche|mudslide)\b/i,wildfire:/\b(wildfire|fire)\b/i,insect:/\b(locust|insect)\b/i};
    let core=t.replace(/^\s*(18|19|20)\d{2}\s*/,'').trim();
    if(typeWords[type])core=core.replace(typeWords[type],'').trim();
    const place=core||t;
    return {topic:t,type,year,place,era:year?`${year} historical setting`:'verified historical setting',known:false,facts:{},stages:{}};
  }

  function contextLock(ctx,stage=''){
    if(ctx.known&&/1976\s+tangshan\s+earthquake/i.test(ctx.topic||'')&&stage==='P14'){
      return 'HISTORICAL CONTEXT LOCK: depict Tangshan, China during the post-1976 rebuilding and recovery period, not the immediate pre-dawn earthquake scene and not a present-day glossy city. Use historically believable recovery-era architecture, streets, vehicles, utilities, clothing, tools, signs, building materials and preparedness infrastructure. Show stronger rebuilt structures and seismic-preparedness elements only where plausible for the recovery era. Avoid futuristic technology, contemporary neon emergency gear, present-day vehicles or unsupported modern details.';
    }
    const when=ctx.year?` in ${ctx.year}`:'';
    let factLine='';
    if(ctx.known&&ctx.facts){
      const facts=Object.values(ctx.facts).filter(Boolean).slice(0,5);
      if(facts.length)factLine=` FACT PACK: ${facts.join('; ')}. Use these facts only where relevant to this stage and do not invent unsupported statistics or modern details.`;
    }
    return `HISTORICAL CONTEXT LOCK: depict ${ctx.place}${when}, not a generic modern location. Match era-appropriate architecture, streets, vehicles, utilities, clothing, tools, signs, building materials, terrain and infrastructure. Avoid modern objects or designs that do not belong to the historical setting.${factLine}`;
  }

  function improveNarration(stage,text,ctx){
    if(ctx.stages&&ctx.stages[stage])return ctx.stages[stage];
    let out=(text||'').trim();
    if(!out)return out;

    const place=ctx.place;
    out=out.replace(/across the city or region/gi,`across ${place}`)
      .replace(/the city or region/gi,place)
      .replace(/the affected city or region/gi,place)
      .replace(/the wider region/gi,`the wider area around ${place}`);

    if(ctx.type==='earthquake'){
      out=out.replace(/along the responsible fault/gi,`along the fault system affecting ${place}`);
    }
    return out;
  }

  function periodLine(ctx,stage){
    if(ctx.known&&/1976\s+tangshan\s+earthquake/i.test(ctx.topic||'')&&stage==='P14'){
      return 'Preserve a historically believable post-1976 Tangshan rebuilding and recovery-era setting; this is a legacy scene, not the immediate 1976 pre-dawn disaster moment. Do not introduce futuristic or clearly present-day architecture, vehicles, clothing, electronics, signage or infrastructure.';
    }
    return `Preserve historical period details for ${ctx.place}${ctx.year?` in ${ctx.year}`:''}; do not introduce modern architecture, vehicles, clothing, electronics, signage or infrastructure.`;
  }

  function enhanceCard(card,ctx){
    const stage=card.dataset.stage;
    const narration=card.querySelector('.narration');
    const image=card.querySelector('.image-prompt');
    const flow=card.querySelector('.flow-prompt');

    if(narration&&stage!=='ENDING'&&stage!=='THUMBNAIL'){
      const improved=improveNarration(stage,narration.value,ctx);
      if(improved!==narration.value){
        narration.value=improved;
        narration.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }

    if(image){
      let value=image.value.replace(/HISTORICAL CONTEXT LOCK:[\s\S]*?(?=(?:Adult characters only|No embedded text|No photorealism|Illustration only|$))/i,'').trim();
      if(value&&!/HISTORICAL CONTEXT LOCK:/i.test(value)) value=`${value} ${contextLock(ctx,stage)}`;
      if(value!==image.value){
        image.value=value;
        image.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }

    if(flow&&stage!=='ENDING'&&stage!=='THUMBNAIL'&&flow.value){
      let value=flow.value;
      value=value.replace(/Preserve historical period details for [\s\S]*?infrastructure\./i,'').replace(/Preserve a historically believable post-1976 Tangshan rebuilding and recovery-era setting;[\s\S]*?infrastructure\./i,'').replace(/\s{2,}/g,' ').trim();
      const period=periodLine(ctx,stage);
      value=value.replace('Use the supplied illustration as the absolute visual reference.',`Use the supplied illustration as the absolute visual reference. ${period}`);
      if(value!==flow.value){
        flow.value=value;
        flow.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }
  }

  function enhanceAll(){
    const t=topic();
    if(!t)return;
    const ctx=inferContext(t);
    [...stagesEl.querySelectorAll('.stage-card')].forEach(card=>enhanceCard(card,ctx));
    showToast(ctx.known?`Historical fact pack applied: ${ctx.place} · ${ctx.year}`:`Historical context applied: ${ctx.place}${ctx.year?` · ${ctx.year}`:''}`);
  }

  if(generateAllBtn)generateAllBtn.addEventListener('click',()=>setTimeout(enhanceAll,80));
  stagesEl.addEventListener('click',e=>{
    if(e.target.closest('.generate-template-btn'))setTimeout(()=>{
      const card=e.target.closest('.stage-card');
      if(card)enhanceCard(card,inferContext(topic()));
    },80);
  });

  setTimeout(()=>{
    if(stagesEl.querySelector('.stage-card')&&topic())enhanceAll();
  },250);
})();
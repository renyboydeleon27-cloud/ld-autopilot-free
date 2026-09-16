(()=>{
  const topicEl=document.getElementById('topic');
  const formatEl=document.getElementById('format');
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
      place:'Tangshan, China',year:'1976',era:'mid-1970s northern Chinese industrial city',
      p1:'Daily life continues across Tangshan before any visible sign of the coming earthquake.',
      hook:'Before dawn, Tangshan appears quiet. Then the ground suddenly turns violent and the city is thrown into disaster.',
      legacy:'The Tangshan earthquake leaves lasting lessons for earthquake-resistant construction, emergency planning, rescue, and seismic preparedness.'
    },
    {
      test:/2004\s+indian\s+ocean\s+tsunami/i,
      place:'Indian Ocean coastal communities',year:'2004',era:'early-2000s Indian Ocean coastal communities',
      p1:'Coastal communities around the Indian Ocean begin an ordinary morning beside calm tropical water, unaware of the danger building offshore.',
      hook:'The ocean looks calm, then the sea suddenly pulls away from shore. What returns is far more destructive.',
      legacy:'The 2004 Indian Ocean Tsunami changes tsunami warning systems, evacuation planning, regional preparedness, and remembrance.'
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
    if(known)return {...known,type:typeFromTopic(t),topic:t};
    const year=(t.match(/\b(18|19|20)\d{2}\b/)||[])[0]||'';
    const type=typeFromTopic(t);
    const typeWords={earthquake:/\bearthquake\b/i,tsunami:/\btsunami\b/i,volcano:/\b(volcano|eruption)\b/i,tornado:/\btornado\b/i,cyclone:/\b(cyclone|hurricane|typhoon)\b/i,flood:/\bflood\b/i,landslide:/\b(landslide|avalanche|mudslide)\b/i,wildfire:/\b(wildfire|fire)\b/i,insect:/\b(locust|insect)\b/i};
    let core=t.replace(/^\s*(18|19|20)\d{2}\s*/,'').trim();
    if(typeWords[type])core=core.replace(typeWords[type],'').trim();
    const place=core||t;
    return {topic:t,type,year,place,era:year?`${year} historical setting`:'verified historical setting'};
  }

  function contextLock(ctx){
    const when=ctx.year?` in ${ctx.year}`:'';
    return `HISTORICAL CONTEXT LOCK: depict ${ctx.place}${when}, not a generic modern location. Match era-appropriate architecture, streets, vehicles, utilities, clothing, tools, signs, building materials, terrain and infrastructure. Avoid modern objects or designs that do not belong to the historical setting.`;
  }

  function improveNarration(stage,text,ctx){
    let out=(text||'').trim();
    if(!out)return out;
    if(stage==='HOOK'&&ctx.hook)return ctx.hook;
    if(stage==='P1'&&ctx.p1)return ctx.p1;
    if(stage==='P14'&&ctx.legacy)return ctx.legacy;

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
      if(value&&!/HISTORICAL CONTEXT LOCK:/i.test(value)){
        value=`${value} ${contextLock(ctx)}`;
      }
      if(value!==image.value){
        image.value=value;
        image.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }

    if(flow&&stage!=='ENDING'&&stage!=='THUMBNAIL'&&flow.value){
      let value=flow.value;
      if(!/Preserve historical period details/i.test(value)){
        value=value.replace('Use the supplied illustration as the absolute visual reference.',`Use the supplied illustration as the absolute visual reference. Preserve historical period details for ${ctx.place}${ctx.year?` in ${ctx.year}`:''}; do not introduce modern architecture, vehicles, clothing, electronics, signage or infrastructure.`);
      }
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
    showToast(`Historical context applied: ${ctx.place}${ctx.year?` · ${ctx.year}`:''}`);
  }

  // Run after the existing template generator has filled the fields.
  if(generateAllBtn)generateAllBtn.addEventListener('click',()=>setTimeout(enhanceAll,80));
  stagesEl.addEventListener('click',e=>{
    if(e.target.closest('.generate-template-btn'))setTimeout(()=>{
      const card=e.target.closest('.stage-card');
      if(card)enhanceCard(card,inferContext(topic()));
    },80);
  });

  // Also improve already-generated templates when v2.0 loads.
  setTimeout(()=>{
    if(stagesEl.querySelector('.stage-card')&&topic())enhanceAll();
  },250);
})();
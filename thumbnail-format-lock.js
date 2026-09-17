(()=>{
  const stages=document.getElementById('stages');
  if(!stages)return;

  const MARKER='THUMBNAIL FORMAT LOCK';

  function detectTheme(topic){
    const t=(topic||'').toLowerCase();
    if(/tsunami|tidal wave/.test(t))return {type:'TSUNAMI',hook:'WHEN THE SEA RUSHED IN',visuals:'a violently affected coastline, damaged period buildings or coastal structures, boats and debris, rushing or receding water where appropriate, wet streets, rescue or survival activity'};
    if(/earthquake|quake|seismic/.test(t))return {type:'EARTHQUAKE',hook:'WHEN THE GROUND BROKE',visuals:'cracked streets, collapsing or damaged masonry buildings, dust clouds, broken utilities, rubble, falling debris and earthquake survival activity'};
    if(/volcano|eruption|lahar|pyroclastic/.test(t))return {type:'ERUPTION',hook:'WHEN THE MOUNTAIN ERUPTED',visuals:'ash, volcanic debris, eruption clouds, lava or lahar only where event-appropriate, damaged settlements, evacuation or survival activity'};
    if(/tornado|twister/.test(t))return {type:'TORNADO',hook:'WHEN THE WIND STRUCK',visuals:'a clearly visible tornado or violent rotating storm where event-appropriate, wind-driven debris, damaged buildings, bent vegetation and adult survival activity'};
    if(/cyclone|hurricane|typhoon/.test(t))return {type:'CYCLONE',hook:'WHEN THE STORM HIT',visuals:'violent wind and rain, storm surge or flooding where appropriate, damaged homes, bent vegetation, debris and adult survival activity'};
    if(/flood|dam failure|storm surge/.test(t))return {type:'FLOOD',hook:'WHEN THE WATER ROSE',visuals:'fast or deep floodwater, damaged roads and buildings, floating debris, stranded transport where historically appropriate, rescue or survival activity'};
    if(/landslide|mudslide|avalanche|glacier collapse/.test(t))return {type:'LANDSLIDE',hook:'WHEN THE SLOPE COLLAPSED',visuals:'a large debris field or moving mass appropriate to the event, buried or damaged structures, blocked roads, unstable terrain and adult survival activity'};
    if(/wildfire|forest fire|firestorm/.test(t))return {type:'WILDFIRE',hook:'WHEN THE FIRE SPREAD',visuals:'flames, smoke, embers, burned or threatened structures, evacuation or firefighting activity and adult survival action'};
    if(/locust|insect|swarm/.test(t))return {type:'LOCUST CRISIS',hook:'WHEN THE SWARM ARRIVED',visuals:'dense airborne swarms, damaged crops, farmland, agricultural tools, worried adult farmers or response crews and strong environmental scale'};
    if(/black death|plague|epidemic|pandemic|disease/.test(t))return {type:'PLAGUE',hook:'WHEN THE DISEASE SPREAD',visuals:'historically appropriate streets, homes, caregivers or healers, period carts, records, tense adult crowds or empty streets and disease-era atmosphere without gore'};
    if(/nuclear|radiation/.test(t))return {type:'NUCLEAR DISASTER',hook:'WHEN THE CRISIS BEGAN',visuals:'event-appropriate damaged infrastructure, evacuation or emergency-response activity, smoke or industrial atmosphere only where historically supported, and period-accurate protective equipment'};
    if(/famine|drought/.test(t))return {type:'FAMINE',hook:'WHEN FOOD RAN OUT',visuals:'affected landscapes, damaged agriculture, relief or aid activity, period food and farming objects, adult survivors and strong environmental storytelling without graphic suffering'};
    return {type:'DISASTER',hook:'WHEN DISASTER STRUCK',visuals:'the most recognizable physically believable hazard, damaged environment, adult survival response, debris or infrastructure effects specifically supported by the current topic'};
  }

  function preservedContext(existing){
    const text=existing||'';
    const markers=['HISTORICAL CONTEXT LOCK:','FACT PACK:'];
    let at=-1;
    for(const m of markers){const i=text.indexOf(m);if(i>=0&&(at<0||i<at))at=i;}
    return at>=0?text.slice(at).trim():'';
  }

  function buildPrompt(topic,format,existing){
    const ratio=format==='longform'?'landscape 16:9':'portrait 9:16';
    const theme=detectTheme(topic);
    const context=preservedContext(existing);
    const base=`Create a high-impact Living Disaster Book YouTube thumbnail for the CURRENT TOPIC “${topic}”, ${ratio}. ${MARKER}: use the same approved bold mobile-first thumbnail composition for every episode, while adapting every disaster visual, historical detail, environment and subject to the CURRENT TOPIC only. This must look like a clickable disaster-history thumbnail, not a normal story panel and not an ending card.\n\nLAYOUT LOCK: TOP: a short white lead-in line if needed, then one enormous distressed RED disaster word or short disaster-type headline based on “${theme.type}”. Keep the main headline extremely large and readable on a phone. YELLOW STRIP: use the short truthful hook “${theme.hook}” in bold black letters. EVENT ID: beneath the yellow strip, show only a concise event name/year/date that can be derived directly from the exact current topic “${topic}”; do not invent a city, country, date, ranking or statistic. RIGHT-SIDE CURIOSITY BADGE: use a strong red burst/splatter-style graphic with the exact question “HOW MANY DIED?” Do NOT display a casualty number unless it is explicitly supplied by verified event data elsewhere in the prompt. Never invent or estimate a death toll. BOTTOM LEFT: compact “LIVING DISASTER BOOK” branding with a simple globe/book-style icon. BOTTOM RIGHT: small readable brand line “REAL DISASTERS. REAL HISTORY. STORIES WE SHOULD NEVER FORGET.” Keep bottom branding secondary to the main hook.\n\nMAIN VISUAL: show one large, emotionally readable ADULT foreground survivor or responder occupying roughly the lower-left or lower-center area, with a clear face and urgent body language appropriate to the event. Behind them, show the active disaster or immediate dangerous aftermath using ${theme.visuals}. The disaster must be instantly recognizable at thumbnail size. Use strong foreground-midground-background separation and leave enough visual breathing room for the headline and badge. Adult characters only.\n\nSTYLE LOCK: serious colored historical graphic-novel/anime illustration, detailed 2D hand-inked outlines, cel-painted textures, cinematic depth, dramatic disaster lighting, gritty but clean high-contrast finish, bold white/red/yellow typography, excellent mobile readability. Match architecture, clothing, tools, vehicles, utilities, signs, terrain and infrastructure to the verified historical period.\n\nTRUTH / SAFETY LOCK: no “deadliest”, “worst”, record claim, ranking, exact casualty number, location, date, magnitude, category, wind speed, wave height or other factual claim unless it is explicitly supplied by the current topic or verified fact/context text. “HOW MANY DIED?” is the default curiosity badge when no verified casualty number is supplied. No children, no gore, no corpses as focal subjects, no photorealism, no live action, no 3D CGI, no glossy render, no chibi, no unrelated imagery, no watermark. Illustration only.`;
    return context?`${base}\n\n${context}`:base;
  }

  function fire(el){
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function apply(){
    const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');
    const prompt=card?.querySelector('.image-prompt');
    if(!prompt)return false;
    const topic=document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'Untitled Disaster';
    const format=document.getElementById('format')?.value||'shorts';
    const next=buildPrompt(topic,format,prompt.value);
    if(prompt.value===next)return false;
    prompt.value=next;
    prompt.dataset.thumbnailFormatLock='v1';
    fire(prompt);
    return true;
  }

  function applyAfterGenerators(){[80,220,520].forEach(ms=>setTimeout(apply,ms));}

  document.getElementById('buildBtn')?.addEventListener('click',applyAfterGenerators);
  document.getElementById('generateAllBtn')?.addEventListener('click',applyAfterGenerators);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(!btn)return;
    const card=btn.closest('.stage-card');
    if(card?.dataset?.stage==='THUMBNAIL')applyAfterGenerators();
  },false);
  window.addEventListener('load',()=>setTimeout(apply,450));
  setTimeout(apply,240);
})();
(()=>{
  const stages=document.getElementById('stages');
  if(!stages)return;

  const MARKER='ENDING FORMAT LOCK';

  function topicTheme(topic){
    const t=(topic||'').toLowerCase();
    if(/black death|plague|pandemic|epidemic|disease/.test(t))return {line:'PLAGUE • FEAR • SURVIVAL',visuals:'period streets and buildings, medical or caregiving details, manuscripts or records, maps, carts, personal belongings, memorial or recovery symbolism appropriate to the event'};
    if(/earthquake|quake/.test(t))return {line:'DESTRUCTION • SURVIVAL • RECOVERY',visuals:'collapsed masonry and damaged period buildings, cracked streets, broken utilities, rescue tools, rubble, maps, architectural fragments, survivor and responder activity, rebuilding plans and recovery symbolism'};
    if(/tsunami/.test(t))return {line:'WAVE • LOSS • RECOVERY',visuals:'damaged coastline, wrecked boats, flood debris, sea charts or maps, ruined shore settlements, rescue activity, survivor belongings and rebuilding symbolism'};
    if(/cyclone|hurricane|typhoon/.test(t))return {line:'WIND • FLOOD • RESILIENCE',visuals:'storm-damaged homes, flooded streets or villages, bent vegetation, boats, rescue and shelter activity, weather maps, broken materials and rebuilding symbolism'};
    if(/flood/.test(t))return {line:'WATER • SURVIVAL • RECOVERY',visuals:'flooded settlements, damaged homes and transport, boats, rescue activity, water-stained documents, maps, tools and recovery symbolism'};
    if(/wildfire|forest fire|fire/.test(t))return {line:'FIRE • LOSS • RECOVERY',visuals:'burned structures or landscape, ash and smoke atmosphere, firefighting or evacuation remnants, maps, tools, personal belongings and rebuilding symbolism'};
    if(/volcano|eruption|lahar/.test(t))return {line:'ERUPTION • SURVIVAL • LEGACY',visuals:'ash-covered settlements or terrain, volcanic debris, evacuation or rescue clues, maps, scientific or historical notes, tools and rebuilding symbolism'};
    if(/tornado/.test(t))return {line:'WIND • DESTRUCTION • RESILIENCE',visuals:'storm-damaged period buildings, scattered debris, rescue activity, weather records or maps, tools, personal belongings and recovery symbolism'};
    if(/landslide|avalanche|mudslide/.test(t))return {line:'COLLAPSE • SURVIVAL • RECOVERY',visuals:'buried or damaged settlements, debris fields, rescue tools, maps, survivor belongings and recovery or rebuilding symbolism'};
    if(/locust/.test(t))return {line:'SWARM • HUNGER • RESPONSE',visuals:'damaged fields and crops, locust-related records, agricultural tools, maps, food or aid symbolism, response activity and recovery themes'};
    if(/nuclear|radiation/.test(t))return {line:'CRISIS • EVACUATION • LEGACY',visuals:'event-appropriate damaged infrastructure, evacuation or emergency-response clues, maps, records, protective equipment where historically appropriate, personal belongings and long-term legacy symbolism'};
    if(/famine|drought/.test(t))return {line:'HUNGER • SURVIVAL • RESILIENCE',visuals:'affected landscapes and communities, period food or agricultural objects, maps, relief or aid symbolism, personal belongings and recovery themes'};
    return {line:'DISASTER • SURVIVAL • LEGACY',visuals:'event-specific ruins or aftermath, historically appropriate tools, maps, documents, personal belongings, rescue or recovery clues and legacy symbolism'};
  }

  function buildPrompt(topic,format){
    const ratio=format==='longform'?'landscape 16:9':'portrait 9:16';
    const theme=topicTheme(topic);
    return `Create the Living Disaster Book ENDING illustration for ${topic}, ${ratio}. ${MARKER}: keep the same approved branded ending-poster composition for every episode while adapting all disaster imagery, objects, historical details and atmosphere to the CURRENT TOPIC only. This is a channel ending card and closing page, NOT a normal story panel and NOT a thumbnail. TOP: large readable “LIVING DISASTER BOOK” masthead with the subtitle “REAL EVENTS. LASTING LESSONS.” MAIN TITLE: prominently show the exact current topic “${topic}”; use only a year/date range that is already present in the topic and do not invent factual locations, casualty figures, dates or event names that were not supplied. THEME LINE: “${theme.line}”. CENTER: very large mobile-readable “THANK YOU FOR WATCHING”, followed by clear LIKE / SHARE / SUBSCRIBE call-to-action elements and the small line “MORE TRUE STORIES AWAIT”. LOWER HALF: build a dense, cinematic historical collage themed specifically to ${topic}, using ${theme.visuals}. Include layered foreground artifacts such as historically appropriate books, maps, handwritten notes, small sketch/photo-style inserts, tools, debris or personal objects where relevant; every object must belong to the current disaster and period. Add one short reflective legacy note on a notebook, paper or plaque, but keep it concise and event-appropriate. BACKGROUND: show the aftermath, recovery, memorial, rebuilding or lasting emotional impact of the current disaster with strong foreground-midground-background depth and historically believable architecture, clothing, transport, tools and terrain. STYLE: serious colored historical graphic-novel/anime illustration, detailed 2D hand-inked linework, cel-painted textures, cinematic dramatic lighting, rich poster-like finish, grounded adult proportions. Adult characters only. Keep all major text centered, highly legible and mobile-safe. STRICT NEGATIVE LOCK: no unrelated imagery from another disaster, no invented factual labels or places, no generic empty background, no plain minimalist end card, no photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore, no watermark. Illustration only; no animation prompt.`;
  }

  function fire(el){
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function apply(){
    const card=stages.querySelector('.stage-card[data-stage="ENDING"]');
    const prompt=card?.querySelector('.image-prompt');
    if(!prompt)return false;
    const topic=document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'Untitled Disaster';
    const format=document.getElementById('format')?.value||'shorts';
    const next=buildPrompt(topic,format);
    if(prompt.value===next)return false;
    prompt.value=next;
    prompt.dataset.endingFormatLock='v1';
    fire(prompt);
    return true;
  }

  document.getElementById('buildBtn')?.addEventListener('click',()=>setTimeout(apply,120));
  document.getElementById('generateAllBtn')?.addEventListener('click',()=>setTimeout(apply,120));
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(!btn)return;
    const card=btn.closest('.stage-card');
    if(card?.dataset?.stage==='ENDING')setTimeout(apply,80);
  });
  window.addEventListener('load',()=>setTimeout(apply,350));
  setTimeout(apply,180);
})();

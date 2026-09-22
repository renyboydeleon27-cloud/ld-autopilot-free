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
    const cropRule=format==='longform'
      ? 'LANDSCAPE SAFE LAYOUT: preserve generous top and side breathing room, keep the adult subject fully inside frame, and keep all essential text inside the central safe area so ordinary editor scaling does not crop the head or CTA.'
      : 'APPROVED PORTRAIT ZOOM-SAFE LAYOUT: use the approved Living Disaster Book ending-card reference. Keep the top 20–22% as background/sky/scene breathing room only with NO essential text and NO head touching the upper edge. Place one adult survivor/witness/responder smaller and lower in the upper half, with the FULL HEAD around 27–32% from the top and the body comfortably inside frame. Design for Zoom/Fill use in mobile editors: the head, main CTA, topic title, location/year line and branding must remain visible under a moderate centered zoom.';

    return `Create the Living Disaster Book ENDING card for ${topic}, ${ratio}. ${MARKER} — MASTER APPROVED REFERENCE: preserve the same approved ending-card composition and visual hierarchy for every episode, while rebuilding the disaster background, aftermath, environment, props, historical details and character styling for the CURRENT TOPIC only. This is a channel ending card / closing page, NOT a normal story panel and NOT a thumbnail.

${cropRule}

COMPOSITION LOCK: the disaster scene occupies the upper portion; one emotionally readable ADULT survivor, witness or responder appears in the upper half, looking toward or interacting naturally with the aftermath. Keep the subject smaller than a thumbnail hero so the full head remains safely inside the frame after Zoom/Fill. The CURRENT DISASTER background must be unmistakable and historically grounded: ${theme.visuals}. Use strong foreground-midground-background depth. Do not reuse unrelated scenery, props, boats, buildings, terrain or damage from another disaster.

TEXT HIERARCHY — keep this order in the middle/lower safe area:
1. very large mobile-readable “THANK YOU FOR WATCHING”
2. clear LIKE • SHARE • SUBSCRIBE call-to-action row
3. highlighted CURRENT TOPIC banner using the exact topic “${topic}”
4. concise location/year line only when already present in the supplied topic; do not invent any date, place, casualty number or statistic
5. small footer branding: “LIVING DISASTER BOOK” + “REAL EVENTS. LASTING LESSONS.” + “MORE TRUE STORIES AWAIT.”

THEME LINE / LEGACY: use “${theme.line}” only when it fits cleanly without crowding. Optional foreground documentary artifacts may include historically appropriate maps, notes, photographs, tools, debris, survivor belongings or response objects relevant to ${topic}. A short reflective legacy note may appear on a notebook/paper/plaque, but it must stay concise and event-appropriate.

VISUAL-MODE CONTINUITY LOCK: preserve the CURRENT PRODUCTION’S already-selected visual mode, era-aware capture treatment, monochrome/color rule and historical style. If the current production is Real Human / live-action, render cinematic historical live-action realism with real adult humans. If the current production is Historical Anime, preserve that approved illustration mode. If the episode has a strict black-and-white era/capture lock, keep the entire historical scene grayscale except any explicitly approved ending-card graphic accents. Do NOT force another episode’s style onto the current one.

HISTORICAL / TRUTH LOCK: architecture, clothing, boats, vehicles, utilities, tools, signs, terrain and infrastructure must match the event year/location already supplied by the current topic/context. Adult characters only. No unrelated disaster imagery, no invented factual labels or places, no invented casualty figures, no generic empty background, no plain minimalist card, no modern objects that do not belong, no duplicated people, no distorted anatomy, no extra fingers, no gore, no watermark. Illustration only when the selected production mode is illustration; live-action only when the selected production mode is Real Human. No animation prompt.`;
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
    prompt.dataset.endingFormatLock='v1.2';
    fire(prompt);
    return true;
  }

  function enforceSoon(){[0,120,320,700].forEach(ms=>setTimeout(apply,ms));}

  window.ldApplyEndingFormatLock=apply;
  document.getElementById('buildBtn')?.addEventListener('click',enforceSoon);
  document.getElementById('generateAllBtn')?.addEventListener('click',enforceSoon);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(!btn)return;
    const card=btn.closest('.stage-card');
    if(card?.dataset?.stage==='ENDING')enforceSoon();
  });
  window.addEventListener('load',()=>setTimeout(apply,450));
  setTimeout(apply,220);
})();

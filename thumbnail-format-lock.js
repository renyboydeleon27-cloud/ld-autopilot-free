(()=>{
  const stages=document.getElementById('stages');
  if(!stages)return;

  const MARKER='THUMBNAIL FORMAT LOCK';
  const COLOR_OVERRIDE='THUMBNAIL COLOR OVERRIDE LOCK';

  function detectTheme(topic){
    const t=(topic||'').toLowerCase();
    if(/tsunami|tidal wave/.test(t))return {type:'TSUNAMI',hook:'WHEN THE SEA RUSHED IN',visuals:'a violently affected coastline, damaged period buildings or coastal structures, boats and debris, rushing or receding water where appropriate, wet streets, rescue or survival activity'};
    if(/earthquake|quake|seismic/.test(t))return {type:'EARTHQUAKE',hook:'WHEN THE GROUND BROKE',visuals:'cracked streets, collapsing or damaged masonry buildings, dust clouds, broken utilities, rubble, falling debris and earthquake survival activity'};
    if(/volcano|eruption|lahar|pyroclastic/.test(t))return {type:'ERUPTION',hook:'WHEN THE MOUNTAIN ERUPTED',visuals:'ash, volcanic debris, eruption clouds, lava or lahar only where event-appropriate, damaged settlements, evacuation or survival activity'};
    if(/tornado|twister/.test(t))return {type:'TORNADO',hook:'WHEN THE WIND STRUCK',visuals:'a clearly visible tornado or violent rotating storm where event-appropriate, wind-driven debris, damaged buildings, bent vegetation and adult survival activity'};
    if(/cyclone|hurricane|typhoon/.test(t))return {type:'CYCLONE',hook:'WHEN THE STORM HIT',visuals:'violent wind and rain, storm surge or flooding where appropriate, damaged homes, bent vegetation, debris and adult survival activity'};
    if(/flood|dam failure|storm surge/.test(t))return {type:'FLOOD',hook:'WHEN THE WATER ROSE',visuals:'fast or deep floodwater, damaged roads and buildings, floating debris, stranded transport where historically appropriate, rescue or survival activity'};
    if(/avalanche/.test(t))return {type:'AVALANCHE',hook:'WHEN THE SNOW BROKE LOOSE',visuals:'a massive snow avalanche or its immediate aftermath, deep deposited snow, buried or displaced railway infrastructure where event-appropriate, damaged timber, mountain terrain, conifers and adult survival or response activity'};
    if(/landslide|mudslide|glacier collapse/.test(t))return {type:'LANDSLIDE',hook:'WHEN THE SLOPE COLLAPSED',visuals:'a large debris field or moving mass appropriate to the event, buried or damaged structures, blocked roads, unstable terrain and adult survival activity'};
    if(/wildfire|forest fire|firestorm/.test(t))return {type:'WILDFIRE',hook:'WHEN THE FIRE SPREAD',visuals:'flames, smoke, embers, burned or threatened structures, evacuation or firefighting activity and adult survival action'};
    if(/locust|insect|swarm/.test(t))return {type:'LOCUST CRISIS',hook:'WHEN THE SWARM ARRIVED',visuals:'dense airborne swarms, damaged crops, farmland, agricultural tools, worried adult farmers or response crews and strong environmental scale'};
    if(/black death|plague|epidemic|pandemic|disease/.test(t))return {type:'PLAGUE',hook:'WHEN THE DISEASE SPREAD',visuals:'historically appropriate streets, homes, caregivers or healers, period carts, records, tense adult crowds or empty streets and disease-era atmosphere without gore'};
    if(/nuclear|radiation/.test(t))return {type:'NUCLEAR DISASTER',hook:'WHEN THE CRISIS BEGAN',visuals:'event-appropriate damaged infrastructure, evacuation or emergency-response activity, smoke or industrial atmosphere only where historically supported, and period-accurate protective equipment'};
    if(/famine|drought/.test(t))return {type:'FAMINE',hook:'WHEN FOOD RAN OUT',visuals:'affected landscapes, damaged agriculture, relief or aid activity, period food and farming objects, adult survivors and strong environmental storytelling without graphic suffering'};
    return {type:'DISASTER',hook:'WHEN DISASTER STRUCK',visuals:'the most recognizable physically believable hazard, damaged environment, adult survival response, debris or infrastructure effects specifically supported by the current topic'};
  }

  function preservedContext(existing,topic){
    const text=String(existing||'');
    const current=String(topic||'').trim();
    const prior=text.match(/CURRENT TOPIC\s*[“"]([^”"]+)[”"]/i)?.[1]?.trim()||'';
    if(prior&&current&&prior.toLowerCase()!==current.toLowerCase())return '';
    const markers=['HISTORICAL CONTEXT LOCK:','FACT PACK:'];
    let at=-1;
    for(const m of markers){const i=text.indexOf(m);if(i>=0&&(at<0||i<at))at=i;}
    const context=at>=0?text.slice(at).trim():'';
    if(!context)return '';
    const currentLower=current.toLowerCase();
    if(!/san francisco earthquake/i.test(currentLower)&&/san francisco[^\n.]{0,80}1906|1906[^\n.]{0,80}san francisco/i.test(context))return '';
    return context;
  }

  function hasVerifiedDeaths(context){
    const s=String(context||'');
    if(!s)return false;
    const patterns=[
      /(?:deaths?|fatalities|killed|died|dead|reported missing)[^.;]{0,90}\b(?:more than\s+|over\s+|about\s+|approximately\s+)?([1-9]\d{0,2}(?:,\d{3})*|[1-9]\d*)\b/i,
      /\b(?:more than\s+|over\s+|about\s+|approximately\s+)?([1-9]\d{0,2}(?:,\d{3})*|[1-9]\d*)\b[^.;]{0,90}(?:people\s+)?(?:were\s+)?(?:killed|died|dead|fatalities|deaths|reported missing)/i,
      /\b(?:dozens|hundreds|thousands|tens of thousands|hundreds of thousands)\b[^.;]{0,70}(?:killed|died|dead|fatalities|deaths)/i
    ];
    return patterns.some(rx=>rx.test(s));
  }

  function buildPrompt(topic,format,existing){
    const ratio=format==='longform'?'landscape 16:9':'portrait 9:16';
    const theme=detectTheme(topic);
    const context=preservedContext(existing,topic);
    const showDeathBadge=hasVerifiedDeaths(context);
    const layout=format==='longform'
      ? 'LANDSCAPE SAFE LAYOUT: keep landscape 16:9. Inset all text at least 6% from edges. Use a compact title above the scene, a raised adult survivor at left/center with face and both hands visible, '+(showDeathBadge?'the verified-death curiosity badge at right, ':'no casualty badge, using the right side for visual breathing room, ')+'and an inset footer. Do not apply portrait vertical crop bands to longform.'
      : 'APPROVED PORTRAIT CROP-SAFE LAYOUT — MASTER BIBLE: deliver portrait 9:16; canonical working canvas 1080×1920. Compose all ESSENTIAL poster content as if uniformly reduced to about 82–85% of the canvas and centered on event-specific background bleed. Keep the essential safe frame inside x 8%-92% and y 10%-90%, with roughly 8–10% nonessential scene bleed at left/right and 9–10% at top/bottom. This is specifically intended to survive about 12–15% centered InShot Zoom/Fill without losing the headline, face, hands, event line or branding. Title block: y 11%-30%; main headline y 11%-21%; yellow hook strip y 21%-26%; event/location/year y 26%-30%; title width normally x 9%-91%. For human-subject designs, do not fill the frame with the person: keep character width at or below about 42% of canvas width, keep the full head inside the frame with breathing room, and keep both hands fully visible above about y 78% whenever hands are required. For DESIGN No. 4 LOOKING BACK / ESCAPE specifically, place the character approximately x 50%-92%, y 32%-86%, full head top around y 32%-35%, head center around x 72%-76% / y 41%-44%, and keep the main hazard/environment readable on the opposite side around x 5%-60%, y 30%-80%. '+(showDeathBadge?'Place the verified-death curiosity badge only inside the same safe frame without covering the face or hazard. ':'Do NOT place any casualty/death badge; use that area for disaster visuals and breathing room. ')+'Keep the complete footer/branding within y 80%-88% and x 8%-92%, leaving nonessential scene/texture bleed below it. No cropped letters, face, hands, logo or footer; no text over the face. If a draft is too tight, reduce the entire essential composition together rather than moving or cropping one element.';
    const base=`Create a high-impact Living Disaster Book YouTube thumbnail for the CURRENT TOPIC “${topic}”, ${ratio}. ${MARKER}: preserve the approved mobile-first visual hierarchy and branding while allowing the selected Thumbnail Design system to vary composition, subject placement, camera emphasis and disaster scale from episode to episode. Adapt every disaster visual, historical detail, environment and subject to the CURRENT TOPIC only. This must look like a clickable disaster-history thumbnail, not a normal story panel and not an ending card.

${COLOR_OVERRIDE}: the THUMBNAIL is ALWAYS FULL COLOR, even when the main production, HOOK, P1–P14, Ending, project color lock, Shared Visual DNA, or inherited historical prompt is strict black-and-white. Do NOT inherit grayscale, monochrome, sepia, tint, or black-and-white instructions into the thumbnail scene. Render the historical anime/graphic-novel scene in rich, controlled full color with period-appropriate materials, skin, clothing, sky, fire, water, vegetation, dust and environment. Approved overlay colors remain WHITE headline, YELLOW hook strip, RED curiosity badge when allowed. This thumbnail-specific color override has higher priority than any global monochrome instruction.\n\nLAYOUT LOCK: ${layout} Within the title block, use one enormous distressed WHITE disaster word or short disaster-type headline based on “${theme.type}”. Keep the main headline extremely large and readable on a phone. YELLOW STRIP: use the short truthful hook “${theme.hook}” in bold black letters. EVENT ID: beneath the yellow strip, show only a concise event name/year/date that can be derived directly from the exact current topic “${topic}”; do not invent a city, country, date, ranking or statistic. ${showDeathBadge?'RIGHT-SIDE CURIOSITY BADGE: verified casualty evidence is present in the supplied historical context, so use a strong red burst/splatter-style graphic with the exact question “HOW MANY DIED?” Do NOT display a casualty number unless it is explicitly supplied by verified event data elsewhere in the prompt. Never invent or estimate a death toll.':'CASUALTY BADGE RULE: no verified positive death toll is supplied in the current historical context, so OMIT the “HOW MANY DIED?” badge entirely. Do not imply deaths, do not invent casualties, and do not replace it with another death-related question.'} INSET FOOTER LEFT: compact “LIVING DISASTER BOOK” branding with a simple globe/book-style icon. INSET FOOTER RIGHT: small readable brand line “REAL DISASTERS. REAL HISTORY. STORIES WE SHOULD NEVER FORGET.” Keep bottom branding secondary to the main hook.\n\nMAIN VISUAL: show one emotionally readable ADULT foreground survivor or responder at the side and scale prescribed by the selected Thumbnail Design. Keep the clear face, visible torso and BOTH hands when that design requires hands/action. Never enlarge the person merely to fill the frame; preserve the crop-safe scale and enough event environment around the subject. Keep the important action above the footer; never place the face or hands at the bottom edge. Behind them, show the active disaster or immediate dangerous aftermath using ${theme.visuals}. The disaster must be instantly recognizable at thumbnail size. Use strong foreground-midground-background separation and leave enough visual breathing room for the headline and any permitted badge. Adult characters only.\n\nSTYLE LOCK: FULL-COLOR historical graphic-novel/anime thumbnail only. Serious colored 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions, cinematic depth, dramatic disaster lighting, gritty but clean high-contrast finish, bold white/red/yellow typography, excellent mobile readability. Never render the thumbnail scene in black-and-white, grayscale, sepia, muted monochrome, or selective monochrome. Match architecture, clothing, tools, vehicles, utilities, signs, terrain and infrastructure to the verified historical period.\n\nTRUTH / SAFETY LOCK: no “deadliest”, “worst”, record claim, ranking, exact casualty number, location, date, magnitude, category, wind speed, wave height or other factual claim unless it is explicitly supplied by the current topic or verified fact/context text. Use “HOW MANY DIED?” only when the supplied verified historical context contains positive death/fatality evidence. If no verified positive death toll is supplied, omit the casualty badge entirely. Adult characters only. No gore, no corpses as focal subjects, no 3D CGI, no glossy render, no chibi, no unrelated imagery, no watermark. Illustration only.`;
    return context?`${base}\n\n${context}`:base;
  }

  function fire(el){
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function apply(){
    if(window.LDStoryModes?.enabled())return false;
    const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');
    const prompt=card?.querySelector('.image-prompt');
    if(!prompt)return false;
    const topic=document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'Untitled Disaster';
    const format=document.getElementById('format')?.value||'shorts';
    const next=buildPrompt(topic,format,prompt.value);
    if(prompt.value===next)return false;
    prompt.value=next;
    prompt.dataset.thumbnailFormatLock='v3.42.3-crop-safe-bible';
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
  function checkCurrent(){
    const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');
    const prompt=card?.querySelector('.image-prompt')?.value||'';
    if(!prompt.trim())return {ok:false,issue:'Thumbnail prompt is empty.',hasVerifiedDeaths:false};
    const context=preservedContext(prompt,document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'');
    const deaths=hasVerifiedDeaths(context);
    const hasVerifiedBranch=/RIGHT-SIDE CURIOSITY BADGE:\s*verified casualty evidence is present/i.test(prompt);
    const hasOmitBranch=/CASUALTY BADGE RULE:\s*no verified positive death toll/i.test(prompt);
    const hasColorOverride=/THUMBNAIL COLOR OVERRIDE LOCK:[\s\S]*?ALWAYS FULL COLOR/i.test(prompt);
    const hasCropBible=/82.?85%[\s\S]*?12.?15% centered InShot Zoom\/Fill/i.test(prompt);
    if(!hasColorOverride)return {ok:false,issue:'Thumbnail must include the full-color override and must not inherit the project B&W lock.',hasVerifiedDeaths:deaths};
    if(!hasCropBible)return {ok:false,issue:'Thumbnail is missing the approved crop-safe master bible for scale, margins and InShot zoom protection.',hasVerifiedDeaths:deaths};
    if(deaths&&!hasVerifiedBranch)return {ok:false,issue:'Thumbnail casualty badge rule is stale for verified death evidence.',hasVerifiedDeaths:true};
    if(!deaths&&!hasOmitBranch)return {ok:false,issue:'Thumbnail must explicitly omit the death badge because no verified positive death toll is supplied.',hasVerifiedDeaths:false};
    return {ok:true,issue:'',hasVerifiedDeaths:deaths,thumbnailColorMode:'color',cropSafeBible:'v1'};
  }

  window.LDThumbnailFormatLock=Object.freeze({apply,buildPrompt,hasVerifiedDeaths,checkCurrent});

  window.addEventListener('load',()=>setTimeout(apply,450));
  setTimeout(apply,240);
})();
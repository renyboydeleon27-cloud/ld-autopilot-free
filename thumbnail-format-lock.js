/* Living Disaster Book — Thumbnail Master Format v4
   Universal zoom-out / InShot edit-safe layout + dynamic topic-family text. */
(()=>{
  'use strict';
  const stages=document.getElementById('stages');
  if(!stages)return;

  const VERSION='v3.51.0-zoomout-dynamic-text-v4';
  const MARKER='THUMBNAIL FORMAT LOCK';
  const COLOR_OVERRIDE='THUMBNAIL COLOR OVERRIDE LOCK';
  const MASTER_SAFE='UNIVERSAL ZOOM-OUT / INSHOT EDIT-SAFE MASTER FORMAT — HIGHEST PRIORITY';

  function hashText(text){
    let h=2166136261;
    for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function choose(topic,list,salt=''){return list[hashText(`${topic}|${salt}`)%list.length];}

  const THEMES=[
    {rx:/dam failure|dam collapse|reservoir breach|dam burst/i,heads:['DAM FAILURE','DAM COLLAPSE'],hooks:['WHEN THE DAM BROKE','WHEN THE WALL OF WATER CAME','WHEN THE RESERVOIR BURST'],visuals:'a failed dam or reservoir setting, powerful floodwater, damaged downstream infrastructure and adult evacuation or rescue activity only where historically supported'},
    {rx:/chemical attack|chemical weapon|chemical warfare|halabja|sarin|mustard gas|toxic gas/i,heads:['CHEMICAL ATTACK','CHEMICAL WARFARE','TOXIC GAS'],hooks:['WHEN CHEMICAL WEAPONS STRUCK','WHEN THE TOXIC CLOUD SPREAD','WHEN THE AIR TURNED DEADLY','WHEN THE GAS DESCENDED'],visuals:'the event-supported chemical-attack environment or immediate dangerous aftermath, historically appropriate civilian survival response, architecture, streets and atmospheric hazard cues without inventing tactical procedures'},
    {rx:/toxic leak|gas leak|industrial poison|chemical leak/i,heads:['TOXIC LEAK','TOXIC DISASTER'],hooks:['WHEN THE TOXIC CLOUD SPREAD','WHEN THE AIR TURNED DEADLY','WHEN THE LEAK ESCAPED'],visuals:'event-supported industrial or civic surroundings, toxic atmospheric hazard cues, evacuation or response activity and period-appropriate infrastructure without inventing procedures'},
    {rx:/earthquake|quake|seismic/i,heads:['EARTHQUAKE','GREAT QUAKE'],hooks:['WHEN THE GROUND BROKE','WHEN THE EARTH SHOOK','WHEN THE QUAKE HIT','WHEN THE CITY SHOOK'],visuals:'cracked streets, collapsing or damaged masonry buildings, dust clouds, broken utilities, rubble, falling debris and earthquake survival activity'},
    {rx:/tsunami|tidal wave|mega-tsunami/i,heads:['TSUNAMI','GIANT WAVE','WALL OF WATER'],hooks:['WHEN THE SEA RUSHED IN','WHEN THE OCEAN STRUCK','WHEN THE WAVES CAME','WHEN THE COAST WAS HIT'],visuals:'a violently affected coastline, damaged period buildings or coastal structures, boats and debris, rushing or receding water where appropriate, wet streets, rescue or survival activity'},
    {rx:/tornado|twister/i,heads:['TORNADO','TWISTER'],hooks:['WHEN THE WIND STRUCK','WHEN THE TWISTER HIT','WHEN THE SKY TURNED VIOLENT','WHEN THE STORM TORE THROUGH'],visuals:'a clearly visible tornado or violent rotating storm where event-appropriate, wind-driven debris, damaged buildings, bent vegetation and adult survival activity'},
    {rx:/cyclone|hurricane|typhoon/i,heads:['CYCLONE','HURRICANE','TYPHOON','SUPERSTORM'],hooks:['WHEN THE STORM HIT','WHEN THE WINDS CAME','WHEN THE STORM SURGED IN','WHEN WIND AND WATER ROSE'],visuals:'violent wind and rain, storm surge or flooding where appropriate, damaged homes, bent vegetation, debris and adult survival activity'},
    {rx:/flash flood|flood|storm surge/i,heads:['FLOOD','FLASH FLOOD','RAGING WATERS'],hooks:['WHEN THE WATER ROSE','WHEN THE FLOOD CAME','WHEN THE RIVER BROKE FREE','WHEN THE TOWN WENT UNDER'],visuals:'fast or deep floodwater, damaged roads and buildings, floating debris, stranded transport where historically appropriate, rescue or survival activity'},
    {rx:/avalanche/i,heads:['AVALANCHE','SNOW COLLAPSE'],hooks:['WHEN THE SNOW BROKE LOOSE','WHEN THE AVALANCHE HIT','WHEN THE SLOPE GAVE WAY','WHEN THE MOUNTAIN RELEASED'],visuals:'a massive snow avalanche or its immediate aftermath, deep deposited snow, buried or displaced railway infrastructure where event-appropriate, damaged timber, mountain terrain, conifers and adult survival or response activity'},
    {rx:/landslide|mudslide|debris flow|glacier collapse/i,heads:['LANDSLIDE','MUDSLIDE','MOUNTAIN COLLAPSE'],hooks:['WHEN THE SLOPE COLLAPSED','WHEN THE HILLS GAVE WAY','WHEN THE MOUNTAIN FELL','WHEN THE EARTH SLID DOWN'],visuals:'a large debris field or moving mass appropriate to the event, buried or damaged structures, blocked roads, unstable terrain and adult survival activity'},
    {rx:/volcano|eruption|lahar|pyroclastic/i,heads:['ERUPTION','VOLCANO','VOLCANIC ERUPTION'],hooks:['WHEN THE VOLCANO ERUPTED','WHEN ASH FILLED THE SKY','WHEN THE MOUNTAIN ERUPTED','WHEN FIRE CAME FROM THE EARTH'],visuals:'ash, volcanic debris, eruption clouds, lava or lahar only where event-appropriate, damaged settlements, evacuation or survival activity'},
    {rx:/wildfire|forest fire|firestorm/i,heads:['WILDFIRE','FIRESTORM'],hooks:['WHEN THE FIRE SPREAD','WHEN THE FLAMES ARRIVED','WHEN THE FIRESTORM HIT','WHEN THE LAND BURNED'],visuals:'flames, smoke, embers, burned or threatened structures, evacuation or firefighting activity and adult survival action'},
    {rx:/urban fire|city fire|great fire|conflagration/i,heads:['CITY FIRE','INFERNO','FIRE DISASTER'],hooks:['WHEN THE CITY BURNED','WHEN THE FLAMES TORE THROUGH','WHEN THE BLAZE SPREAD','WHEN FIRE TOOK OVER'],visuals:'historically supported urban fire, smoke, damaged period buildings, evacuation or firefighting activity and strong city-scale depth'},
    {rx:/famine|starvation|food crisis/i,heads:['FAMINE','HUNGER CRISIS'],hooks:['WHEN FOOD RAN OUT','WHEN HUNGER TOOK HOLD','WHEN THE CROPS FAILED','WHEN SURVIVAL MEANT HUNGER'],visuals:'affected landscapes, damaged agriculture, relief or aid activity, period food and farming objects, adult survivors and strong environmental storytelling without graphic suffering'},
    {rx:/drought/i,heads:['DROUGHT','HUNGER CRISIS'],hooks:['WHEN THE RAINS FAILED','WHEN THE LAND DRIED UP','WHEN THE CROPS DIED','WHEN WATER RAN SHORT'],visuals:'dry event-supported landscapes, stressed agriculture or water sources, period tools, relief activity and adult survival context without invented details'},
    {rx:/heat wave|heatwave|extreme heat/i,heads:['HEAT WAVE','DEADLY HEAT'],hooks:['WHEN THE HEAT WOULD NOT END','WHEN THE TEMPERATURE SOARED','WHEN THE SUMMER TURNED DEADLY'],visuals:'period-appropriate urban or rural heat conditions, exhausted adult civilians, shade/water response and environmental heat cues without invented temperature claims'},
    {rx:/blizzard|snowstorm|winter storm|extreme cold/i,heads:['BLIZZARD','WINTER STORM','FROZEN DISASTER'],hooks:['WHEN THE SNOW TOOK OVER','WHEN WINTER HIT HARD','WHEN THE COLD TURNED DEADLY','WHEN THE STORM FROZE THE LAND'],visuals:'heavy event-supported snow, wind, buried or blocked infrastructure, cold-weather survival and historically appropriate transport or shelter'},
    {rx:/dust storm|sandstorm|dust bowl/i,heads:['DUST STORM','SANDSTORM','WALL OF DUST'],hooks:['WHEN THE SKY TURNED TO DUST','WHEN THE STORM BLINDED THE LAND','WHEN THE SAND CAME','WHEN THE AIR DISAPPEARED'],visuals:'a dense wall of dust or sand where event-supported, low visibility, period roads/buildings/fields and adult sheltering or survival activity'},
    {rx:/locust|swarm|insect plague/i,heads:['LOCUST PLAGUE','SWARM','LOCUST CRISIS'],hooks:['WHEN THE SWARM ARRIVED','WHEN THE SKY FILLED WITH LOCUSTS','WHEN THE CROPS DISAPPEARED','WHEN THE FIELDS WERE STRIPPED'],visuals:'dense airborne swarms, damaged crops, farmland, agricultural tools, worried adult farmers or response crews and strong environmental scale'},
    {rx:/black death|plague|pandemic|epidemic|outbreak|disease/i,heads:['PLAGUE','PANDEMIC','EPIDEMIC','OUTBREAK'],hooks:['WHEN THE DISEASE SPREAD','WHEN THE OUTBREAK BEGAN','WHEN THE PLAGUE ARRIVED','WHEN ILLNESS TOOK OVER'],visuals:'historically appropriate streets, homes, caregivers or healers, period carts or records, tense adult crowds or empty streets and disease-era atmosphere without gore'},
    {rx:/xylazine|drug crisis|opioid|public health crisis|health crisis/i,heads:['DRUG CRISIS','HEALTH CRISIS','PUBLIC HEALTH CRISIS'],hooks:['WHEN THE CRISIS SPREAD','WHEN THE STREETS CHANGED','WHEN THE EMERGENCY GREW','WHEN SURVIVAL BECAME A STRUGGLE'],visuals:'event-supported public-health street, outreach, clinic or community context with adult civilians and responders, avoiding sensational suffering or invented medical details'},
    {rx:/nuclear|radiation|reactor|meltdown|chernobyl|fukushima/i,heads:['NUCLEAR DISASTER','RADIATION DISASTER','REACTOR MELTDOWN'],hooks:['WHEN RADIATION SPREAD','WHEN THE REACTOR FAILED','WHEN THE MELTDOWN BEGAN','WHEN THE INVISIBLE THREAT ESCAPED'],visuals:'event-appropriate damaged infrastructure, evacuation or emergency-response activity, smoke or industrial atmosphere only where historically supported, and period-accurate protective equipment'},
    {rx:/factory explosion|industrial explosion|plant explosion|refinery explosion/i,heads:['INDUSTRIAL DISASTER','FACTORY EXPLOSION'],hooks:['WHEN THE PLANT EXPLODED','WHEN INDUSTRY TURNED DEADLY','WHEN THE EXPLOSION HIT','WHEN TOXIC SMOKE ROSE'],visuals:'period-appropriate industrial infrastructure, event-supported explosion/fire/smoke damage, emergency response and adult survival activity'},
    {rx:/shipwreck|maritime disaster|ferry disaster|sinking|ocean liner/i,heads:['SHIPWRECK','MARITIME DISASTER','OCEAN TRAGEDY'],hooks:['WHEN THE SHIP WENT DOWN','WHEN THE SEA TOOK THE VESSEL','WHEN THE VOYAGE FAILED','WHEN THE WRECK BEGAN'],visuals:'event-appropriate vessel, sea conditions, maritime rescue or wreck aftermath and period-correct clothing/equipment without inventing ship details'},
    {rx:/train disaster|rail disaster|derailment|rail crash/i,heads:['TRAIN DISASTER','RAIL DISASTER','DERAILMENT'],hooks:['WHEN THE TRAIN LEFT THE TRACKS','WHEN THE RAILS FAILED','WHEN THE DERAILMENT HIT'],visuals:'period-appropriate railway, damaged rolling stock or track only where event-supported, adult passengers/responders and grounded rescue or aftermath activity'},
    {rx:/plane crash|air disaster|aviation disaster|flight crash/i,heads:['AIR DISASTER','PLANE CRASH','FLIGHT TRAGEDY'],hooks:['WHEN THE FLIGHT FAILED','WHEN THE SKY TURNED DEADLY','WHEN THE PLANE WENT DOWN'],visuals:'event-appropriate aircraft or crash setting, rescue/aftermath cues and period-correct aviation details without inventing airline branding'},
    {rx:/mine disaster|mine collapse|mining disaster|pit collapse/i,heads:['MINE DISASTER','PIT COLLAPSE','TRAPPED BELOW'],hooks:['WHEN THE MINE COLLAPSED','WHEN THE TUNNEL FAILED','WHEN THE EARTH TRAPPED THEM'],visuals:'period-appropriate mine entrance, underground or rescue setting, adult miners/responders, debris and historically grounded equipment'},
    {rx:/bridge collapse|building collapse|structural collapse|stadium collapse/i,heads:['COLLAPSE','BRIDGE DISASTER','BUILDING FAILURE'],hooks:['WHEN THE STRUCTURE GAVE WAY','WHEN THE BRIDGE FELL','WHEN THE BUILDING COLLAPSED'],visuals:'event-supported structural failure, period-appropriate architecture/infrastructure, debris and adult rescue or survival activity'},
    {rx:/massacre|genocide|civilian attack|war crime/i,heads:['CIVILIAN ATTACK','MASSACRE','GENOCIDE'],hooks:['WHEN CIVILIANS WERE TARGETED','WHEN WAR TURNED ON THE PEOPLE','WHEN THE ATTACK REACHED THE CITY'],visuals:'historically grounded civilian setting, restrained aftermath or escape context and adult witnesses/survivors without gore, propaganda or invented military detail'}
  ];

  function detectTheme(topic){
    const t=String(topic||'');
    for(const f of THEMES){
      if(f.rx.test(t))return {type:choose(t,f.heads,'headline'),hook:choose(t,f.hooks,'hook'),visuals:f.visuals,fallback:false};
    }
    const first=t.split(/\s+[—-]\s+/)[0].trim();
    const safe=first&&first.length<=24?first.toUpperCase():'DISASTER';
    return {type:safe,hook:choose(t,['WHEN EVERYTHING CHANGED','WHEN SURVIVAL BEGAN','WHEN THE CRISIS HIT','WHEN DISASTER STRUCK'],'fallback'),visuals:'the most recognizable physically believable hazard, damaged environment, adult survival response, debris or infrastructure effects specifically supported by the current topic',fallback:true};
  }

  function preservedContext(existing,topic){
    const text=String(existing||'');
    const current=String(topic||'').trim();
    const prior=text.match(/CURRENT TOPIC\s*[“\"]([^”\"]+)[”\"]/i)?.[1]?.trim()||'';
    if(prior&&current&&prior.toLowerCase()!==current.toLowerCase())return '';
    const markers=['HISTORICAL CONTEXT LOCK:','FACT PACK:'];
    let at=-1;
    for(const m of markers){const i=text.indexOf(m);if(i>=0&&(at<0||i<at))at=i;}
    const context=at>=0?text.slice(at).trim():'';
    if(!context)return '';
    if(!/san francisco earthquake/i.test(current.toLowerCase())&&/san francisco[^\n.]{0,80}1906|1906[^\n.]{0,80}san francisco/i.test(context))return '';
    return context;
  }

  function hasVerifiedDeaths(context){
    const s=String(context||'');
    if(!s)return false;
    return [
      /(?:deaths?|fatalities|killed|died|dead|reported missing)[^.;]{0,90}\b(?:more than\s+|over\s+|about\s+|approximately\s+)?([1-9]\d{0,2}(?:,\d{3})*|[1-9]\d*)\b/i,
      /\b(?:more than\s+|over\s+|about\s+|approximately\s+)?([1-9]\d{0,2}(?:,\d{3})*|[1-9]\d*)\b[^.;]{0,90}(?:people\s+)?(?:were\s+)?(?:killed|died|dead|fatalities|deaths|reported missing)/i,
      /\b(?:dozens|hundreds|thousands|tens of thousands|hundreds of thousands)\b[^.;]{0,70}(?:killed|died|dead|fatalities|deaths)/i
    ].some(rx=>rx.test(s));
  }

  function portraitLayout(showDeathBadge){
    return `${MASTER_SAFE}: This is the permanent framing and geometry lock for ALL 10 Thumbnail Design variants. The generator must intentionally compose the native thumbnail slightly ZOOMED OUT / PULLED BACK so a later centered 12–15% InShot Zoom/Fill tightens the poster without cutting important detail. If any design-specific instruction creates a tight final crop or pushes essential content toward an edge, THIS MASTER FORMAT WINS.

Deliver portrait 9:16; canonical working canvas 1080×1920. Build ALL ESSENTIAL poster content as ONE unified composition scaled to roughly 78–82% of the full canvas and centered within nonessential event-specific background bleed. Do not make individual elements edge-dependent. Keep the essential safe frame inside x 10%-90% and y 12%-88%. The outer area is nonessential bleed only.

CAMERA DISTANCE LOCK: use a slightly wider / more pulled-back camera framing than a normal finished poster. The native generation must NOT look like the final crop is already consumed. Preserve visible room to crop inward later. Do not enlarge a character, trigger object, hazard or symbol merely to fill empty space.

TITLE SAFE ZONE: complete title block x 10%-90%, y 12%-28%. Main headline y 12%-20%. Yellow hook strip y 20%-24.5%. Event/location/year line y 24.5%-28%. Top 0%-12% is nonessential sky/smoke/environment breathing room only. No essential letters near the top or side edges.

SUBJECT SAFE ZONE: for normal human-subject designs, keep the dominant adult usually around 28–38% of canvas width, with full head, face, torso and any required hands comfortably inside the safe frame. Keep important hands/action above roughly y 78%. Pull the subject inward from the side edge. Extreme-close-up designs may enlarge the intended eyes/face only when that is the concept, but critical facial features, title, event line and footer must remain safe after centered zoom.

HAZARD / TRIGGER / SYMBOL SAFE ZONE: keep the recognizable disaster, trigger object, landmark or symbol visually strong but not dependent on the outer bleed. Critical hazard cues must remain readable after centered zoom. Foreground trigger objects must be pulled upward/inward instead of sitting on the bottom boundary. Do not let the subject cover the only recognizable hazard cue.

${showDeathBadge?'BADGE SAFE RULE: a verified-death curiosity badge may appear only inside the same safe frame and must not cover the face, hands, title, primary hazard or footer.':'BADGE SAFE RULE: no casualty/death badge. Use the freed area for hazard readability and breathing room.'}

FOOTER SAFE ZONE: keep ALL branding fully inside x 10%-90% and y 79%-85%. Keep “LIVING DISASTER BOOK” and the footer tagline fully inset and readable. Leave visible nonessential ground/rubble/water/texture bleed BELOW the footer. Never place branding directly on the bottom edge.

WHOLE-COMPOSITION COMPRESSION RULE: if anything feels even slightly tight, uniformly reduce and recenter the ENTIRE essential composition together — title, strip, event line, subject, trigger/hazard/symbol emphasis and footer. Never solve crop pressure by sacrificing one hand, moving one label to an edge, cropping the face, enlarging the subject, lowering the footer, or pushing branding off-screen.

ANTI-TIGHT / EDITING INTENT RULE: generate WIDE FIRST, CROP LATER. The first image should look complete but slightly pulled back. After moderate centered Zoom/Fill in InShot it should become tighter and stronger while retaining the full headline, event line, face, required hands, key trigger object, primary hazard cue, logo and footer.

ANTI-CROP: no cropped headline letters, event line, face, required hands, key trigger object, logo or footer. No text over the face. Layout stability under later Zoom/Fill outranks decorative edge filling.`;
  }

  function buildPrompt(topic,format,existing){
    const ratio=format==='longform'?'landscape 16:9':'portrait 9:16';
    const theme=detectTheme(topic);
    const context=preservedContext(existing,topic);
    const showDeathBadge=hasVerifiedDeaths(context);
    const layout=format==='longform'
      ? 'LANDSCAPE SAFE LAYOUT: keep landscape 16:9. Inset all essential text, subject and branding at least 7% from every edge. Use a slightly wider native composition so later editor crop has room. If tight, uniformly reduce and recenter all essential content together.'
      : portraitLayout(showDeathBadge);

    const base=`Create a high-impact Living Disaster Book YouTube thumbnail for the CURRENT TOPIC “${topic}”, ${ratio}. ${MARKER}: preserve the approved mobile-first visual hierarchy and branding while allowing the selected Thumbnail Design system to vary composition, subject placement, camera emphasis and disaster scale from episode to episode. Adapt every disaster visual, historical detail, environment and subject to the CURRENT TOPIC only. This must look like a clickable disaster-history thumbnail, not a normal story panel and not an ending card.

${COLOR_OVERRIDE}: the THUMBNAIL is ALWAYS FULL COLOR, even when the main production, HOOK, P1–P14, Ending, project color lock, Shared Visual DNA, or inherited historical prompt is strict black-and-white. Do NOT inherit grayscale, monochrome, sepia, tint or black-and-white instructions into the thumbnail scene. Render the historical anime/graphic-novel scene in rich, controlled full color with period-appropriate materials, skin, clothing, sky, fire, water, vegetation, dust and environment. Approved overlay colors remain WHITE headline, YELLOW hook strip and RED curiosity badge only when allowed. This thumbnail-specific color override has higher priority than any global monochrome instruction.

LAYOUT LOCK: ${layout}

DYNAMIC TOPIC TEXT LOCK — HIGH PRIORITY: Do NOT default every episode to “DISASTER / WHEN DISASTER STRUCK”. For THIS CURRENT TOPIC use the exact BIG WHITE MAIN HEADLINE “${theme.type}” and the exact YELLOW STRIP hook “${theme.hook}”. These two strings override any generic headline/hook wording elsewhere in the thumbnail prompt. The selection is based on the current disaster/event family and stays stable for this project while varying across different topics.

EVENT ID: beneath the yellow strip, show only a concise identity derived directly from the exact current topic “${topic}”. Preserve the supplied event/place/country/region and year/date when present; do not invent or replace geography, date, ranking or statistic. ${showDeathBadge?'RIGHT-SIDE CURIOSITY BADGE: verified casualty evidence is present in supplied historical context, so a strong red badge may use the exact question “HOW MANY DIED?” Do NOT display a casualty number unless explicitly supplied by verified event data. Never invent or estimate a death toll.':'CASUALTY BADGE RULE: no verified positive death toll is supplied in current historical context, so OMIT the “HOW MANY DIED?” badge entirely. Do not imply deaths, invent casualties or replace it with another death-related question.'} INSET FOOTER LEFT: compact “LIVING DISASTER BOOK” branding with a simple globe/book-style icon. INSET FOOTER RIGHT: small readable brand line “REAL DISASTERS. REAL HISTORY. STORIES WE SHOULD NEVER FORGET.”

MAIN VISUAL: show one emotionally readable ADULT foreground survivor or responder at the side and scale prescribed by the selected Thumbnail Design, unless that design is intentionally object/symbol/environment-led. Keep the clear face, visible torso and BOTH hands when that design requires hands/action. Never enlarge the person merely to fill the frame. Keep important action above the footer. Behind or around the subject, show the active disaster or immediate dangerous aftermath using ${theme.visuals}. The disaster must be instantly recognizable at thumbnail size. Use strong foreground-midground-background separation and enough breathing room for the title and branding. Adult characters only.

STYLE LOCK: FULL-COLOR historical graphic-novel/anime thumbnail only. Serious colored 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions, cinematic depth, dramatic disaster lighting, gritty but clean high-contrast finish, bold white/red/yellow typography and excellent mobile readability. Never render the thumbnail scene in black-and-white, grayscale, sepia, muted monochrome or selective monochrome. Match architecture, clothing, tools, vehicles, utilities, signs, terrain and infrastructure to the verified historical period.

TRUTH / SAFETY LOCK: no “deadliest”, “worst”, record claim, ranking, exact casualty number, location, date, magnitude, category, wind speed, wave height or other factual claim unless explicitly supplied by the current topic or verified fact/context text. Adult characters only. No gore, no corpses as focal subjects, no 3D CGI, no glossy render, no chibi, no unrelated imagery and no watermark. Illustration only.`;
    return context?`${base}\n\n${context}`:base;
  }

  function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}

  function apply(){
    if(window.LDStoryModes?.enabled())return false;
    const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');
    const prompt=card?.querySelector('.image-prompt');
    if(!prompt)return false;
    const topic=document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'Untitled Disaster';
    const format=document.getElementById('format')?.value||'shorts';
    const next=buildPrompt(topic,format,prompt.value);
    if(prompt.value===next){prompt.dataset.thumbnailFormatLock=VERSION;return false;}
    prompt.value=next;
    prompt.dataset.thumbnailFormatLock=VERSION;
    fire(prompt);
    return true;
  }

  function applyAfterGenerators(){[40,120,260,520,900,1250].forEach(ms=>setTimeout(apply,ms));}
  document.getElementById('buildBtn')?.addEventListener('click',applyAfterGenerators);
  document.getElementById('generateAllBtn')?.addEventListener('click',applyAfterGenerators);
  document.addEventListener('click',e=>{const btn=e.target.closest('.generate-template-btn');if(btn?.closest('.stage-card')?.dataset?.stage==='THUMBNAIL')applyAfterGenerators();},false);

  function checkCurrent(){
    const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');
    const prompt=card?.querySelector('.image-prompt')?.value||'';
    if(!prompt.trim())return {ok:false,issue:'Thumbnail prompt is empty.',hasVerifiedDeaths:false};
    const topic=document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'';
    const context=preservedContext(prompt,topic);
    const deaths=hasVerifiedDeaths(context);
    const theme=detectTheme(topic);
    const hasColor=/THUMBNAIL COLOR OVERRIDE LOCK:[\s\S]*?ALWAYS FULL COLOR/i.test(prompt);
    const hasMaster=/UNIVERSAL ZOOM-OUT \/ INSHOT EDIT-SAFE MASTER FORMAT[\s\S]*?78.?82%[\s\S]*?x 10%-90%[\s\S]*?y 12%-88%/i.test(prompt);
    const hasIntent=/generate WIDE FIRST, CROP LATER/i.test(prompt);
    const hasFooter=/FOOTER SAFE ZONE:[\s\S]*?y 79%-85%/i.test(prompt);
    const hasDynamic=prompt.includes(`BIG WHITE MAIN HEADLINE “${theme.type}”`)&&prompt.includes(`YELLOW STRIP hook “${theme.hook}”`);
    const hasVerified=/RIGHT-SIDE CURIOSITY BADGE:/i.test(prompt);
    const hasOmit=/CASUALTY BADGE RULE:\s*no verified positive death toll/i.test(prompt);
    if(!hasColor)return {ok:false,issue:'Thumbnail must include the full-color override.',hasVerifiedDeaths:deaths};
    if(!hasMaster||!hasIntent||!hasFooter)return {ok:false,issue:'Thumbnail is missing the zoom-out / InShot edit-safe Master Format.',hasVerifiedDeaths:deaths};
    if(!hasDynamic)return {ok:false,issue:'Thumbnail is missing the dynamic topic-family headline/hook lock.',hasVerifiedDeaths:deaths};
    if(deaths&&!hasVerified)return {ok:false,issue:'Thumbnail casualty badge rule is stale for verified death evidence.',hasVerifiedDeaths:true};
    if(!deaths&&!hasOmit)return {ok:false,issue:'Thumbnail must explicitly omit the death badge because no verified positive death toll is supplied.',hasVerifiedDeaths:false};
    return {ok:true,issue:'',hasVerifiedDeaths:deaths,thumbnailColorMode:'color',cropSafeBible:'v4-zoomout-dynamic-text',headline:theme.type,hook:theme.hook,version:VERSION};
  }

  window.LDThumbnailFormatLock=Object.freeze({apply,buildPrompt,hasVerifiedDeaths,detectTheme,checkCurrent,version:VERSION});
  window.addEventListener('load',()=>setTimeout(apply,320));
  setTimeout(apply,180);
})();

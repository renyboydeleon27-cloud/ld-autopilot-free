/* Living Disaster Book — Thumbnail Master Format v3
   Universal zoom-out / InShot edit-safe layout for ALL thumbnail design variants. */
(()=>{
  'use strict';
  const stages=document.getElementById('stages');
  if(!stages)return;

  const VERSION='v3.50.9-master-zoomout-edit-safe-v3';
  const MARKER='THUMBNAIL FORMAT LOCK';
  const COLOR_OVERRIDE='THUMBNAIL COLOR OVERRIDE LOCK';
  const MASTER_SAFE='UNIVERSAL ZOOM-OUT / INSHOT EDIT-SAFE MASTER FORMAT — HIGHEST PRIORITY';

  function detectTheme(topic){
    const t=String(topic||'').toLowerCase();
    if(/chemical attack|chemical weapon|halabja|sarin|mustard gas/.test(t))return {type:'DISASTER',hook:'WHEN DISASTER STRUCK',visuals:'the event-supported chemical-attack environment or immediate dangerous aftermath, historically appropriate civilian survival response, architecture, streets and atmospheric hazard cues without inventing tactical procedures'};
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

TITLE SYSTEM: Within the protected title block, use one enormous distressed WHITE disaster word or short disaster-type headline based on “${theme.type}”. Keep it extremely readable on a phone. YELLOW STRIP: use the short truthful hook “${theme.hook}” in bold black letters. EVENT ID: beneath the yellow strip, show only a concise event name/year/date that can be derived directly from the exact current topic “${topic}”; do not invent a city, country, date, ranking or statistic. ${showDeathBadge?'RIGHT-SIDE CURIOSITY BADGE: verified casualty evidence is present in supplied historical context, so a strong red badge may use the exact question “HOW MANY DIED?” Do NOT display a casualty number unless explicitly supplied by verified event data. Never invent or estimate a death toll.':'CASUALTY BADGE RULE: no verified positive death toll is supplied in current historical context, so OMIT the “HOW MANY DIED?” badge entirely. Do not imply deaths, invent casualties or replace it with another death-related question.'} INSET FOOTER LEFT: compact “LIVING DISASTER BOOK” branding with a simple globe/book-style icon. INSET FOOTER RIGHT: small readable brand line “REAL DISASTERS. REAL HISTORY. STORIES WE SHOULD NEVER FORGET.”

MAIN VISUAL: show one emotionally readable ADULT foreground survivor or responder at the side and scale prescribed by the selected Thumbnail Design, unless that design is intentionally object/symbol/environment-led. Keep the clear face, visible torso and BOTH hands when that design requires hands/action. Never enlarge the person merely to fill the frame. Keep important action above the footer. Behind or around the subject, show the active disaster or immediate dangerous aftermath using ${theme.visuals}. The disaster must be instantly recognizable at thumbnail size. Use strong foreground-midground-background separation and enough breathing room for the title and branding. Adult characters only.

STYLE LOCK: FULL-COLOR historical graphic-novel/anime thumbnail only. Serious colored 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions, cinematic depth, dramatic disaster lighting, gritty but clean high-contrast finish, bold white/red/yellow typography and excellent mobile readability. Never render the thumbnail scene in black-and-white, grayscale, sepia, muted monochrome or selective monochrome. Match architecture, clothing, tools, vehicles, utilities, signs, terrain and infrastructure to the verified historical period.

TRUTH / SAFETY LOCK: no “deadliest”, “worst”, record claim, ranking, exact casualty number, location, date, magnitude, category, wind speed, wave height or other factual claim unless explicitly supplied by the current topic or verified fact/context text. Adult characters only. No gore, no corpses as focal subjects, no 3D CGI, no glossy render, no chibi, no unrelated imagery and no watermark. Illustration only.`;
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
    if(prompt.value===next){prompt.dataset.thumbnailFormatLock=VERSION;return false;}
    prompt.value=next;
    prompt.dataset.thumbnailFormatLock=VERSION;
    fire(prompt);
    return true;
  }

  function applyAfterGenerators(){[40,120,260,520,900].forEach(ms=>setTimeout(apply,ms));}
  document.getElementById('buildBtn')?.addEventListener('click',applyAfterGenerators);
  document.getElementById('generateAllBtn')?.addEventListener('click',applyAfterGenerators);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(btn?.closest('.stage-card')?.dataset?.stage==='THUMBNAIL')applyAfterGenerators();
  },false);

  function checkCurrent(){
    const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');
    const prompt=card?.querySelector('.image-prompt')?.value||'';
    if(!prompt.trim())return {ok:false,issue:'Thumbnail prompt is empty.',hasVerifiedDeaths:false};
    const topic=document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'';
    const context=preservedContext(prompt,topic);
    const deaths=hasVerifiedDeaths(context);
    const hasColor=/THUMBNAIL COLOR OVERRIDE LOCK:[\s\S]*?ALWAYS FULL COLOR/i.test(prompt);
    const hasMaster=/UNIVERSAL ZOOM-OUT \/ INSHOT EDIT-SAFE MASTER FORMAT[\s\S]*?78.?82%[\s\S]*?x 10%-90%[\s\S]*?y 12%-88%/i.test(prompt);
    const hasIntent=/generate WIDE FIRST, CROP LATER/i.test(prompt);
    const hasFooter=/FOOTER SAFE ZONE:[\s\S]*?y 79%-85%/i.test(prompt);
    const hasCompression=/WHOLE-COMPOSITION COMPRESSION RULE/i.test(prompt);
    const hasVerified=/RIGHT-SIDE CURIOSITY BADGE:/i.test(prompt);
    const hasOmit=/CASUALTY BADGE RULE:\s*no verified positive death toll/i.test(prompt);
    if(!hasColor)return {ok:false,issue:'Thumbnail must include the full-color override.',hasVerifiedDeaths:deaths};
    if(!hasMaster||!hasIntent||!hasFooter||!hasCompression)return {ok:false,issue:'Thumbnail is missing the v3 zoom-out / InShot edit-safe Master Format.',hasVerifiedDeaths:deaths};
    if(deaths&&!hasVerified)return {ok:false,issue:'Thumbnail casualty badge rule is stale for verified death evidence.',hasVerifiedDeaths:true};
    if(!deaths&&!hasOmit)return {ok:false,issue:'Thumbnail must explicitly omit the death badge because no verified positive death toll is supplied.',hasVerifiedDeaths:false};
    return {ok:true,issue:'',hasVerifiedDeaths:deaths,thumbnailColorMode:'color',cropSafeBible:'v3-zoomout-edit-safe',version:VERSION};
  }

  window.LDThumbnailFormatLock=Object.freeze({apply,buildPrompt,hasVerifiedDeaths,checkCurrent,version:VERSION});
  window.addEventListener('load',()=>setTimeout(apply,320));
  setTimeout(apply,180);
})();

/* Living Disaster Book — Thumbnail Dynamic Text Engine v1
   Family-specific headline + varied yellow-strip hook + exact event identity. */
(()=>{
  'use strict';
  const stages=document.getElementById('stages');
  if(!stages)return;

  const VERSION='v1.0.0';
  const START='THUMBNAIL TEXT VARIATION OVERRIDE — HIGH PRIORITY';
  const END='END THUMBNAIL TEXT VARIATION OVERRIDE.';
  let applying=false;

  function hashText(text){
    let h=2166136261;
    for(const ch of String(text||'')){
      h^=ch.charCodeAt(0);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  }
  function choose(topic,list){
    return list[hashText(topic)%list.length];
  }

  const FAMILIES=[
    {rx:/dam failure|dam collapse|reservoir breach|dam burst/i,head:['DAM FAILURE','DAM COLLAPSE'],hooks:['WHEN THE DAM BROKE','WHEN THE WALL OF WATER CAME','WHEN THE RESERVOIR BURST']},
    {rx:/chemical attack|chemical weapon|chemical warfare|halabja|sarin|mustard gas|toxic gas/i,head:['CHEMICAL ATTACK','CHEMICAL WARFARE','TOXIC GAS'],hooks:['WHEN CHEMICAL WEAPONS STRUCK','WHEN THE TOXIC CLOUD SPREAD','WHEN THE AIR TURNED DEADLY','WHEN THE GAS DESCENDED']},
    {rx:/toxic leak|gas leak|industrial poison|chemical leak/i,head:['TOXIC LEAK','TOXIC DISASTER'],hooks:['WHEN THE TOXIC CLOUD SPREAD','WHEN THE AIR TURNED DEADLY','WHEN THE LEAK ESCAPED']},
    {rx:/earthquake|quake|seismic/i,head:['EARTHQUAKE','GREAT QUAKE'],hooks:['WHEN THE GROUND BROKE','WHEN THE EARTH SHOOK','WHEN THE QUAKE HIT','WHEN THE CITY SHOOK']},
    {rx:/tsunami|tidal wave|mega-tsunami/i,head:['TSUNAMI','GIANT WAVE','WALL OF WATER'],hooks:['WHEN THE SEA RUSHED IN','WHEN THE OCEAN STRUCK','WHEN THE WAVES CAME','WHEN THE COAST WAS HIT']},
    {rx:/tornado|twister/i,head:['TORNADO','TWISTER'],hooks:['WHEN THE WIND STRUCK','WHEN THE TWISTER HIT','WHEN THE SKY TURNED VIOLENT','WHEN THE STORM TORE THROUGH']},
    {rx:/cyclone|hurricane|typhoon/i,head:['CYCLONE','HURRICANE','TYPHOON','SUPERSTORM'],hooks:['WHEN THE STORM HIT','WHEN THE WINDS CAME','WHEN THE STORM SURGED IN','WHEN WIND AND WATER ROSE']},
    {rx:/flash flood|flood|storm surge/i,head:['FLOOD','FLASH FLOOD','RAGING WATERS'],hooks:['WHEN THE WATER ROSE','WHEN THE FLOOD CAME','WHEN THE RIVER BROKE FREE','WHEN THE TOWN WENT UNDER']},
    {rx:/avalanche/i,head:['AVALANCHE','SNOW COLLAPSE'],hooks:['WHEN THE SNOW BROKE LOOSE','WHEN THE AVALANCHE HIT','WHEN THE SLOPE GAVE WAY','WHEN THE MOUNTAIN RELEASED']},
    {rx:/landslide|mudslide|debris flow|glacier collapse/i,head:['LANDSLIDE','MUDSLIDE','MOUNTAIN COLLAPSE'],hooks:['WHEN THE SLOPE COLLAPSED','WHEN THE HILLS GAVE WAY','WHEN THE MOUNTAIN FELL','WHEN THE EARTH SLID DOWN']},
    {rx:/volcano|eruption|lahar|pyroclastic/i,head:['ERUPTION','VOLCANO','VOLCANIC ERUPTION'],hooks:['WHEN THE VOLCANO ERUPTED','WHEN ASH FILLED THE SKY','WHEN THE MOUNTAIN ERUPTED','WHEN FIRE CAME FROM THE EARTH']},
    {rx:/wildfire|forest fire|firestorm/i,head:['WILDFIRE','FIRESTORM'],hooks:['WHEN THE FIRE SPREAD','WHEN THE FLAMES ARRIVED','WHEN THE FIRESTORM HIT','WHEN THE LAND BURNED']},
    {rx:/urban fire|city fire|great fire|conflagration/i,head:['CITY FIRE','INFERNO','FIRE DISASTER'],hooks:['WHEN THE CITY BURNED','WHEN THE FLAMES TORE THROUGH','WHEN THE BLAZE SPREAD','WHEN FIRE TOOK OVER']},
    {rx:/famine|starvation|food crisis/i,head:['FAMINE','HUNGER CRISIS'],hooks:['WHEN FOOD RAN OUT','WHEN HUNGER TOOK HOLD','WHEN THE CROPS FAILED','WHEN SURVIVAL MEANT HUNGER']},
    {rx:/drought/i,head:['DROUGHT','HUNGER CRISIS'],hooks:['WHEN THE RAINS FAILED','WHEN THE LAND DRIED UP','WHEN THE CROPS DIED','WHEN WATER RAN SHORT']},
    {rx:/heat wave|heatwave|extreme heat/i,head:['HEAT WAVE','DEADLY HEAT'],hooks:['WHEN THE HEAT WOULD NOT END','WHEN THE TEMPERATURE SOARED','WHEN THE SUMMER TURNED DEADLY']},
    {rx:/blizzard|snowstorm|winter storm|extreme cold/i,head:['BLIZZARD','WINTER STORM','FROZEN DISASTER'],hooks:['WHEN THE SNOW TOOK OVER','WHEN WINTER HIT HARD','WHEN THE COLD TURNED DEADLY','WHEN THE STORM FROZE THE LAND']},
    {rx:/dust storm|sandstorm|dust bowl/i,head:['DUST STORM','SANDSTORM','WALL OF DUST'],hooks:['WHEN THE SKY TURNED TO DUST','WHEN THE STORM BLINDED THE LAND','WHEN THE SAND CAME','WHEN THE AIR DISAPPEARED']},
    {rx:/locust|swarm|insect plague/i,head:['LOCUST PLAGUE','SWARM','LOCUST CRISIS'],hooks:['WHEN THE SWARM ARRIVED','WHEN THE SKY FILLED WITH LOCUSTS','WHEN THE CROPS DISAPPEARED','WHEN THE FIELDS WERE STRIPPED']},
    {rx:/black death|plague|pandemic|epidemic|outbreak|disease/i,head:['PLAGUE','PANDEMIC','EPIDEMIC','OUTBREAK'],hooks:['WHEN THE DISEASE SPREAD','WHEN THE OUTBREAK BEGAN','WHEN THE PLAGUE ARRIVED','WHEN ILLNESS TOOK OVER']},
    {rx:/xylazine|drug crisis|opioid|public health crisis|health crisis/i,head:['DRUG CRISIS','HEALTH CRISIS','PUBLIC HEALTH CRISIS'],hooks:['WHEN THE CRISIS SPREAD','WHEN THE STREETS CHANGED','WHEN THE EMERGENCY GREW','WHEN SURVIVAL BECAME A STRUGGLE']},
    {rx:/nuclear|radiation|reactor|meltdown|chernobyl|fukushima/i,head:['NUCLEAR DISASTER','RADIATION DISASTER','REACTOR MELTDOWN'],hooks:['WHEN RADIATION SPREAD','WHEN THE REACTOR FAILED','WHEN THE MELTDOWN BEGAN','WHEN THE INVISIBLE THREAT ESCAPED']},
    {rx:/factory explosion|industrial explosion|plant explosion|refinery explosion/i,head:['INDUSTRIAL DISASTER','FACTORY EXPLOSION'],hooks:['WHEN THE PLANT EXPLODED','WHEN INDUSTRY TURNED DEADLY','WHEN THE EXPLOSION HIT','WHEN TOXIC SMOKE ROSE']},
    {rx:/shipwreck|maritime disaster|ferry disaster|sinking|ocean liner/i,head:['SHIPWRECK','MARITIME DISASTER','OCEAN TRAGEDY'],hooks:['WHEN THE SHIP WENT DOWN','WHEN THE SEA TOOK THE VESSEL','WHEN THE VOYAGE FAILED','WHEN THE WRECK BEGAN']},
    {rx:/train disaster|rail disaster|derailment|rail crash/i,head:['TRAIN DISASTER','RAIL DISASTER','DERAILMENT'],hooks:['WHEN THE TRAIN LEFT THE TRACKS','WHEN THE RAILS FAILED','WHEN THE DERAILMENT HIT']},
    {rx:/plane crash|air disaster|aviation disaster|flight crash/i,head:['AIR DISASTER','PLANE CRASH','FLIGHT TRAGEDY'],hooks:['WHEN THE FLIGHT FAILED','WHEN THE SKY TURNED DEADLY','WHEN THE PLANE WENT DOWN']},
    {rx:/mine disaster|mine collapse|mining disaster|pit collapse/i,head:['MINE DISASTER','PIT COLLAPSE','TRAPPED BELOW'],hooks:['WHEN THE MINE COLLAPSED','WHEN THE TUNNEL FAILED','WHEN THE EARTH TRAPPED THEM']},
    {rx:/bridge collapse|building collapse|structural collapse|stadium collapse/i,head:['COLLAPSE','BRIDGE DISASTER','BUILDING FAILURE'],hooks:['WHEN THE STRUCTURE GAVE WAY','WHEN THE BRIDGE FELL','WHEN THE BUILDING COLLAPSED']},
    {rx:/massacre|genocide|civilian attack|war crime/i,head:['CIVILIAN ATTACK','MASSACRE','GENOCIDE'],hooks:['WHEN CIVILIANS WERE TARGETED','WHEN WAR TURNED ON THE PEOPLE','WHEN THE ATTACK REACHED THE CITY']}
  ];

  function topicText(){
    return document.getElementById('projectTitle')?.textContent?.trim()||document.getElementById('topic')?.value?.trim()||'Untitled Disaster';
  }

  function classify(topic){
    for(const family of FAMILIES){
      if(family.rx.test(topic)){
        return {
          headline:choose(topic+'|headline',family.head),
          hook:choose(topic+'|hook',family.hooks),
          fallback:false
        };
      }
    }
    const compact=String(topic||'').split(/\s+[—-]\s+/)[0].trim();
    const safeHead=compact&&compact.length<=24?compact.toUpperCase():'DISASTER';
    return {
      headline:safeHead,
      hook:choose(topic+'|fallback',['WHEN EVERYTHING CHANGED','WHEN SURVIVAL BEGAN','WHEN THE CRISIS HIT','WHEN DISASTER STRUCK']),
      fallback:true
    };
  }

  function stripOldOverride(text){
    const s=String(text||'');
    const start=s.indexOf(START);
    if(start<0)return s;
    const end=s.indexOf(END,start);
    if(end<0)return s.slice(0,start).trimEnd();
    return (s.slice(0,start)+s.slice(end+END.length)).replace(/\n{3,}/g,'\n\n').trim();
  }

  function buildOverride(topic){
    const {headline,hook}=classify(topic);
    return `${START}:
This block overrides any earlier generic thumbnail headline or yellow-strip wording for THIS CURRENT TOPIC only.

BIG WHITE MAIN HEADLINE — EXACT TEXT: “${headline}”
YELLOW HOOK STRIP — EXACT TEXT: “${hook}”
EVENT ID LINE: keep a concise identity derived only from the exact current topic “${topic}”. Preserve the supplied place/country/region and year/date when present. Do not invent or replace supplied geography or year.

VARIATION RULE: headline and hook are selected from the current disaster/event family rather than defaulting every episode to “DISASTER / WHEN DISASTER STRUCK”. Keep the selected wording short, truthful, mobile-readable and stable for this project. The generic pair may be used only when no safer specific family can be inferred.

TEXT SAFETY: no casualty number, ranking, record claim, extra date, extra place, or unsupported factual claim may be introduced by this text system. The existing full-color, historical-accuracy, zoom-out/InShot edit-safe layout and design-rotation locks remain unchanged.
${END}`;
  }

  function transform(prompt,topic){
    const clean=stripOldOverride(prompt);
    const block=buildOverride(topic);
    const marker='\n\nMAIN VISUAL:';
    const at=clean.indexOf(marker);
    if(at>=0)return clean.slice(0,at)+`\n\n${block}`+clean.slice(at);
    return `${clean.trim()}\n\n${block}`;
  }

  function apply(){
    if(applying)return false;
    const card=stages.querySelector('.stage-card[data-stage="THUMBNAIL"]');
    const prompt=card?.querySelector('.image-prompt');
    if(!prompt||!prompt.value.trim())return false;
    const topic=topicText();
    const next=transform(prompt.value,topic);
    if(next===prompt.value){prompt.dataset.thumbnailTextVariation=VERSION;return false;}
    applying=true;
    try{
      prompt.value=next;
      prompt.dataset.thumbnailTextVariation=VERSION;
      prompt.dispatchEvent(new Event('input',{bubbles:true}));
      prompt.dispatchEvent(new Event('change',{bubbles:true}));
    }finally{
      setTimeout(()=>{applying=false;},0);
    }
    return true;
  }

  function applyAfterGenerators(){[70,180,360,700,1050,1350].forEach(ms=>setTimeout(apply,ms));}

  document.getElementById('buildBtn')?.addEventListener('click',applyAfterGenerators);
  document.getElementById('generateAllBtn')?.addEventListener('click',applyAfterGenerators);
  document.addEventListener('click',e=>{
    const card=e.target.closest('.stage-card[data-stage="THUMBNAIL"]');
    if(card)setTimeout(apply,60);
  },false);
  document.addEventListener('input',e=>{
    if(applying)return;
    if(e.target?.matches?.('.stage-card[data-stage="THUMBNAIL"] .image-prompt'))setTimeout(apply,20);
  });

  const previous=window.LDThumbnailFormatLock;
  if(previous){
    window.LDThumbnailFormatLock=Object.freeze({...previous,
      apply:()=>{const changed=previous.apply?.()||false;setTimeout(apply,20);return changed;},
      buildPrompt:(topic,format,existing)=>transform(previous.buildPrompt(topic,format,existing),topic),
      textVariationVersion:VERSION
    });
  }
  window.LDThumbnailTextVariation=Object.freeze({apply,transform,classify,version:VERSION});

  window.addEventListener('load',()=>setTimeout(apply,420));
  setTimeout(apply,260);
})();

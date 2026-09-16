(()=>{
  const generateAllBtn=document.getElementById('generateAllBtn');
  const stagesEl=document.getElementById('stages');
  const topicEl=document.getElementById('topic');
  const formatEl=document.getElementById('format');
  const toast=document.getElementById('toast');
  if(!stagesEl)return;

  function showToast(text){if(!toast)return;toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);}
  function fireInput(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
  function topic(){return topicEl?.value.trim()||'this disaster';}
  function isShorts(){return formatEl?.value!=='longform';}
  function detectType(){
    const s=topic().toLowerCase();
    if(/tsunami|tidal wave/.test(s))return'tsunami';
    if(/earthquake|quake|seismic/.test(s))return'earthquake';
    if(/volcano|eruption|lahar|pyroclastic/.test(s))return'volcano';
    if(/tornado|twister/.test(s))return'tornado';
    if(/cyclone|hurricane|typhoon/.test(s))return'cyclone';
    if(/flood|dam failure|storm surge/.test(s))return'flood';
    if(/landslide|mudslide|avalanche|glacier collapse/.test(s))return'landslide';
    if(/wildfire|forest fire|firestorm|fire /.test(s))return'wildfire';
    if(/locust|insect|plague of insects/.test(s))return'insect';
    if(/plague|black death|epidemic|pandemic|disease/.test(s))return'disease';
    return'generic';
  }

  const SHORTS={
    tsunami:[
      'Coastal communities begin an ordinary day beside calm water, unaware of the danger building offshore.',
      'Deep beneath the ocean, tectonic stress builds along a major fault beneath the seafloor.',
      'A powerful undersea rupture suddenly lifts and drops the seafloor, displacing a vast volume of water.',
      'Long tsunami waves spread outward across the open ocean at high speed.',
      'Along some coasts, the sea draws back unusually far, exposing seabed and stranded boats.',
      'The first major wave reaches shore and surges inland with destructive force.',
      'Floodwater carries boats, vehicles, timber, and debris through coastal streets.',
      'The tsunami reaches multiple coastlines, widening the disaster far beyond the first impact zone.',
      'As water begins to recede, mud, wreckage, and standing water cover devastated communities.',
      'The human toll becomes clear as survivors search ruins and emergency response begins.',
      'Displaced survivors gather in temporary shelters while clean water and basic supplies become urgent needs.',
      'Ports, roads, homes, fishing fleets, businesses, and local infrastructure lie heavily damaged.',
      'Recovery begins as survivors, workers, and responders clear debris and rebuild essential structures.',
      'The disaster changes tsunami warning systems, evacuation planning, preparedness, and remembrance.'
    ],
    earthquake:[
      'Daily life continues across the city or region before any visible sign of the coming earthquake.',
      'Stress accumulates along the responsible fault as locked crustal blocks resist movement.',
      'The fault ruptures suddenly, releasing stored energy through powerful seismic waves.',
      'The first violent shaking reaches streets and buildings, turning normal movement into immediate danger.',
      'Walls crack, lights swing, utilities fail, and loose objects fall as shaking intensifies.',
      'Buildings and infrastructure suffer their first major structural failures during the strongest motion.',
      'Roads, rail lines, bridges, factories, or neighborhoods are damaged as the disaster escalates.',
      'Aftershocks and widespread infrastructure failure expand the crisis beyond the first collapsed areas.',
      'When the main shaking ends, survivors emerge into dust, debris, damaged streets, and unstable structures.',
      'Rescue begins as civilians and responders search collapsed buildings and damaged neighborhoods.',
      'Temporary camps and emergency aid appear while survivors face shortages and displacement.',
      'Transport, utilities, homes, workplaces, and public buildings remain heavily disrupted.',
      'Reconstruction begins as rubble is cleared and damaged neighborhoods are rebuilt.',
      'The earthquake leaves lasting lessons for building codes, emergency planning, and seismic preparedness.'
    ],
    volcano:[
      'Life continues around the volcano while the mountain appears familiar and deceptively stable.',
      'Magma, gas, and pressure build beneath the volcano, creating increasing geological unrest.',
      'Scientists or residents notice escalating warning signs such as tremors, gas, steam, or ash.',
      'The eruption begins as ash, gas, lava, or explosive material bursts from the vent.',
      'Ash darkens the sky and falling material begins affecting nearby roads, roofs, and farmland.',
      'The main volcanic hazard surges outward: lava, pyroclastic flow, lahar, or heavy ashfall, depending on the event.',
      'Communities, roads, rivers, and infrastructure are overwhelmed as volcanic hazards spread.',
      'The wider region experiences ash, evacuation, transport disruption, or secondary hazards.',
      'After the peak eruption, buried roads, damaged buildings, ash-covered land, or mud-choked valleys remain.',
      'Survivors and responders confront the human cost and begin rescue or evacuation operations.',
      'Displaced residents gather in safer areas while emergency supplies and shelter become essential.',
      'Agriculture, transport, homes, utilities, and local economies suffer lasting damage.',
      'Cleanup and rebuilding begin as ash, debris, or lahar deposits are removed.',
      'The eruption leaves enduring lessons for monitoring, hazard maps, evacuation, and volcanic preparedness.'
    ],
    tornado:[
      'An ordinary day continues beneath warm, unstable air before severe weather fully develops.',
      'Powerful atmospheric instability and wind shear organize a rotating thunderstorm.',
      'A funnel descends and the tornado forms, connecting the storm base with the ground.',
      'The tornado approaches populated areas as wind, dust, and debris intensify.',
      'Roofs, trees, signs, and lightweight structures begin failing under extreme winds.',
      'The tornado strikes with full force, tearing through buildings and streets along its path.',
      'Debris fills the air as the damage path cuts through neighborhoods, farms, or towns.',
      'The storm continues across a wider area before weakening or lifting.',
      'After the tornado passes, a narrow but severe corridor of destruction is revealed.',
      'Survivors and responders search damaged buildings and blocked streets.',
      'Emergency shelters and aid support people displaced from destroyed or unsafe homes.',
      'Homes, businesses, utilities, farms, and transport routes remain heavily damaged.',
      'Cleanup and rebuilding begin across the tornado track.',
      'The disaster strengthens awareness of warnings, shelters, construction, and severe-weather preparedness.'
    ],
    cyclone:[
      'Coastal communities continue normal life while a distant tropical system strengthens over warm water.',
      'The storm organizes around a deepening low-pressure center and intensifying winds.',
      'Warnings increase as the cyclone grows stronger and turns toward vulnerable coastlines.',
      'Outer rain bands reach land, bringing worsening wind, rain, and rising water.',
      'Storm surge and flooding begin pushing into low-lying communities before the eye or core arrives.',
      'The cyclone makes landfall with destructive wind, rain, waves, and surge.',
      'Roofs fail, trees fall, power systems collapse, and floodwater spreads through communities.',
      'The storm affects a wider region with flooding, landslides, transport disruption, or prolonged outages.',
      'As the storm weakens, flooded streets, damaged buildings, debris, and uprooted trees remain.',
      'Rescue teams and survivors move through damaged areas while communications and access remain difficult.',
      'Temporary shelters and relief distribution support displaced residents.',
      'Homes, ports, roads, farms, utilities, and businesses suffer major losses.',
      'Cleanup and rebuilding begin as water drains and essential services return.',
      'The cyclone leaves lessons for evacuation, coastal defenses, forecasting, and disaster planning.'
    ],
    flood:[
      'Daily life continues near rivers, floodplains, or low-lying communities before the water begins rising.',
      'Heavy rain, saturated ground, dam failure, surge, or upstream runoff builds the flood threat.',
      'Water levels rise rapidly and the first roads, fields, or low areas begin to disappear.',
      'Floodwater crosses banks, barriers, or drainage systems and enters populated areas.',
      'Current speed and depth increase, trapping vehicles and cutting access routes.',
      'The flood reaches destructive levels, entering homes and damaging infrastructure.',
      'Fast-moving water carries debris and isolates communities as conditions worsen.',
      'The affected area expands downstream or across a wider floodplain.',
      'As water stabilizes or recedes, mud, debris, contamination, and standing water remain.',
      'Rescue operations focus on stranded residents and cut-off neighborhoods.',
      'Evacuees gather in shelters while clean water, food, sanitation, and medicine become priorities.',
      'Roads, bridges, homes, farms, businesses, and utilities show extensive damage.',
      'Cleanup begins as water drains and communities remove mud and debris.',
      'The flood leaves lessons for warning systems, drainage, land use, dams, and evacuation planning.'
    ],
    landslide:[
      'Life continues below unstable slopes, cliffs, mountains, or snow-covered terrain before failure begins.',
      'Rain, earthquakes, erosion, ice, snow, or weakened geology increases instability in the slope.',
      'Cracks, shifting ground, falling rocks, or other warning signs reveal that the slope is beginning to fail.',
      'A large mass suddenly breaks free and accelerates downhill.',
      'Rock, mud, snow, or debris gains speed and volume as it follows gravity into lower terrain.',
      'The moving mass strikes roads, homes, valleys, or settlements with overwhelming force.',
      'Debris blocks transport routes and buries structures as the disaster reaches peak intensity.',
      'Secondary slides, blocked rivers, or isolated communities widen the emergency.',
      'When movement stops, a vast debris field covers the impact zone.',
      'Survivors and responders search unstable terrain for trapped or missing people.',
      'Evacuated residents face disrupted roads, utilities, shelter, and supply access.',
      'Homes, farms, roads, bridges, and local infrastructure remain buried or damaged.',
      'Debris removal, slope stabilization, and rebuilding begin during recovery.',
      'The disaster leaves lessons for slope monitoring, hazard mapping, drainage, and land-use planning.'
    ],
    wildfire:[
      'Communities and forests sit under dry conditions before the first dangerous fire growth becomes visible.',
      'Heat, drought, dry vegetation, and wind create conditions for rapid fire spread.',
      'Smoke thickens and flames expand as the fire escapes initial containment.',
      'Wind drives the fire toward roads, homes, farms, or forest communities.',
      'Embers leap ahead of the main front and ignite new vegetation or structures.',
      'The wildfire reaches peak intensity with powerful flame fronts and dense smoke.',
      'Roads close, utilities fail, and evacuation routes become urgent as the fire spreads.',
      'The burned area expands across a wider landscape before weather or firefighting slows the advance.',
      'After the flames pass, blackened terrain, damaged structures, smoke, and ash remain.',
      'Firefighters and residents assess losses and search affected areas.',
      'Evacuees gather in temporary shelters while air quality and basic needs remain concerns.',
      'Homes, forests, farms, utilities, businesses, and wildlife habitat show extensive damage.',
      'Cleanup, restoration, and rebuilding begin across burned communities.',
      'The wildfire leaves lessons for fuel management, evacuation, fire-resistant construction, and preparedness.'
    ],
    insect:[
      'Farmers work healthy fields before unusual insect activity becomes impossible to ignore.',
      'Favorable weather and breeding conditions allow insect populations to multiply rapidly.',
      'Scouts or farmers notice growing swarms gathering across vegetation and open land.',
      'Dense airborne swarms begin moving toward productive farmland.',
      'The swarm reaches crops and feeding damage becomes visible across fields.',
      'At peak infestation, huge numbers of insects cover plants and darken parts of the sky.',
      'Crop losses spread as multiple farms and communities face the same outbreak.',
      'The crisis expands across regions or borders as swarms continue migrating.',
      'Damaged fields reveal the scale of lost food and income after swarms pass.',
      'Farmers and authorities assess losses while food-security concerns grow.',
      'Response teams organize surveillance, ground control, or aircraft operations where available.',
      'Agriculture, household income, markets, and food supplies face wider economic pressure.',
      'Control campaigns and monitoring reduce swarm pressure while affected communities begin recovery.',
      'The outbreak leaves lessons for early warning, weather monitoring, surveillance, and rapid response.'
    ],
    generic:[]
  };

  function narrationTemplate(stage){
    const t=topic();if(stage==='ENDING'||stage==='THUMBNAIL')return'';
    const type=detectType();
    if(stage==='HOOK'){
      const hooks={tsunami:`The sea did something terrifying before ${t}: it pulled away from the coast, and what returned was far worse.`,earthquake:`There was almost no time to react when the ground beneath ${t} suddenly turned violent.`,volcano:`The mountain had warned people for days or weeks, but when ${t} erupted, the landscape changed in minutes.`,tornado:`The sky changed fast, and within minutes ${t} became a moving wall of wind and debris.`,cyclone:`The storm kept growing over warm water until ${t} reached the coast with wind, rain, and rising sea.`,flood:`The water kept rising until roads, homes, and escape routes disappeared during ${t}.`,landslide:`The slope looked stable until gravity took over and ${t} came down in one unstoppable mass.`,wildfire:`A small fire became a fast-moving wall of flame as ${t} raced toward communities.`,insect:`That dark cloud was alive: ${t} was not weather, but a moving mass of insects heading toward crops.`};
      return hooks[type]||`At first, everything seemed normal. Then one warning sign revealed that ${t} was about to change everything.`;
    }
    const n=Number(stage.slice(1));
    if(isShorts()&&SHORTS[type]?.length)return SHORTS[type][n-1].replace(/the disaster/gi,t);
    if(isShorts())return `Continue the verified story of ${t} with one clear historical fact and one strong visual beat for panel ${n}.`;
    if(n<=3)return`Before ${t}, show the normal world, location, people, and context before the disaster.`;
    if(n<=6)return`Build tension through verified warning signs, environmental changes, and the known cause of ${t}.`;
    if(n<=10)return`Show the trigger and first major impacts of ${t} with clear, physically believable action.`;
    if(n<=15)return`Escalate ${t} through infrastructure failure, environmental hazards, and adult human response.`;
    if(n<=20)return`Show the peak phase of ${t} with the strongest verified disaster action and cinematic scale.`;
    if(n<=24)return`Show the wider regional impact of ${t}, including disrupted communities and infrastructure.`;
    if(n<=27)return`Show aftermath, rescue, emergency response, and the first stages of recovery after ${t}.`;
    if(n<=29)return`Show the lessons, preparedness changes, and historical significance that followed ${t}.`;
    return`End with a reflective visual showing how ${t} is remembered and what changed afterward.`;
  }

  function actionFor(stage){
    const type=detectType(); const n=stage==='HOOK'?0:Number(stage.slice(1));
    const actions={
      tsunami:['seawater visibly recedes from the shoreline','gentle normal coastal motion','subtle geological tension beneath calm water','seafloor rupture and vertical displacement','long wave energy travels across open ocean','water continues withdrawing from shore','the first wave surges inland','floodwater and existing debris move inland','broad wave energy travels toward distant coastlines','water drains through a devastated coastal scene','restrained rescue and aftermath movement','temporary relief activity','damaged coastal infrastructure settles in wind and shallow water','rebuilding activity','calm recovered coastline and preparedness elements'],
      earthquake:['subtle pre-event environment motion','ordinary city activity','small pre-event environmental movement','fault rupture and seismic wave release','controlled building and object shaking','stronger shaking with loose objects reacting','peak ground shaking and supported structural failure','debris dust and infrastructure vibration','aftershocks and emergency movement','dust haze and unstable aftermath','restrained rescue movement','temporary camp activity','damaged infrastructure settling','rebuilding work','calm rebuilt city with preparedness details'],
      volcano:['subtle steam haze around the volcano','ordinary landscape motion','subtle volcanic unrest','increasing steam gas and tremor','eruption column or vent action','ashfall and windblown ash','main volcanic hazard advances','ash debris and evacuation environment','regional ash and haze movement','post-eruption ash and debris settling','rescue or evacuation activity','relief camp movement','damaged infrastructure under ash','cleanup and rebuilding','calm monitored volcano and recovered community'],
      tornado:['cloud and wind tension','ordinary environmental motion','storm clouds organize and rotate','funnel descends toward ground','winds strengthen and debris begins moving','roofs trees and loose objects react to extreme wind','tornado crosses the scene with fast debris','debris-laden wind continues along the damage path','storm moves away across wider terrain','dust settles across the damage path','search and rescue activity','shelter and aid movement','damaged infrastructure in gusty wind','cleanup and rebuilding','calm rebuilt community under monitored skies'],
      cyclone:['distant storm bands move toward coast','ordinary coastal motion','storm organization over water','warning weather intensifies','outer rain bands and wind arrive','surge and flooding begin','landfall wind rain and water intensify','debris wind and floodwater move through communities','storm bands spread across the wider region','rain eases over damaged flooded streets','rescue activity in wind and standing water','shelter and relief movement','damaged infrastructure settles after storm','cleanup and drainage','calm recovered coast with preparedness elements'],
      flood:['water level begins rising','ordinary riverside motion','rain runoff or water pressure builds','water crosses banks or barriers','floodwater enters roads and low areas','current deepens and accelerates','floodwater moves through buildings and streets','debris and water isolate communities','water spreads across the floodplain','water recedes leaving mud and debris','rescue boats or supported emergency movement','shelter and aid activity','damaged roads homes and utilities settle','mud removal and cleanup','calm recovered waterway with flood defenses'],
      landslide:['small debris shifts on an unstable slope','ordinary mountain environment motion','water erosion snow or rock stress builds','cracks and loose material begin moving','the slope fails and mass accelerates downhill','debris gains speed and volume','moving mass strikes lower terrain','debris continues through the impact zone','secondary slope movement or blocked access','dust settles across the debris field','careful rescue activity on unstable ground','evacuation and relief activity','buried infrastructure and debris settling','debris removal and slope stabilization','stable recovered slope with monitoring elements'],
      wildfire:['smoke first appears beyond dry vegetation','ordinary dry landscape motion','heat wind and dry vegetation build danger','smoke and flame grow','wind drives flames toward structures','embers travel ahead of the main fire','main fire front advances across the scene','smoke embers and evacuation environment intensify','fire spreads across wider terrain','smoke and ash drift over burned ground','firefighter and survivor assessment activity','evacuation shelter movement','burned infrastructure settles in smoky air','cleanup and rebuilding','regrowth and recovered community under watch'],
      insect:['airborne insects begin gathering','healthy crops move in field wind','small insect clusters multiply','swarm density grows','swarm moves toward farmland','insects land and feed on crops','dense swarm crosses and covers the field','multiple swarm layers migrate across the landscape','damaged crops move beneath thinning swarm','farmers assess damaged fields','control teams prepare equipment','spray aircraft or supported response activity','damaged agriculture under lingering swarms','monitoring and control activity','recovered fields with surveillance and preparedness']
    };
    return actions[type]?.[n]||'animate the single most important event already visible in the image';
  }

  function imageTemplate(stage,role){
    const t=topic(), ratio=isShorts()?'portrait 9:16':'landscape 16:9', type=detectType();
    if(stage==='ENDING')return`Create the Living Disaster Book ENDING illustration for ${t}, ${ratio}. Show a reflective post-disaster scene appropriate to a ${type} event and the verified historical setting. Include Living Disaster Book branding, chapter title, disaster name/year, THANK YOU FOR WATCHING, LIKE / SHARE / SUBSCRIBE. Serious colored historical graphic-novel/anime style, hand-inked linework, cel-painted textures, cinematic depth, adult characters only if visible. No photorealism, no live action, no 3D CGI, no chibi, no gore. Illustration only.`;
    if(stage==='THUMBNAIL')return`Create a high-impact YouTube thumbnail for ${t}, ${ratio}. Use the most recognizable visual language of a ${type} disaster: ${actionFor('P6')}. Show one strong adult foreground subject for scale and emotion where appropriate. Serious colored historical graphic-novel/anime style, hand-inked linework, cel-painted textures, strong contrast, cinematic atmosphere, bold readable headline, mobile-first composition. No photorealism, no live action, no 3D CGI, no chibi, no gore. Illustration only.`;
    return`Create ${stage} illustration for ${t}, ${ratio}. Disaster type: ${type}. Scene role: ${role}. Visual beat: ${narrationTemplate(stage)} Show one historically and scientifically believable moment with clear foreground, midground, and background storytelling. Serious colored historical graphic-novel/anime style, detailed 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions, historically believable architecture, clothing, tools and terrain, cinematic depth, appropriate disaster atmosphere. Adult characters only. No embedded text. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore.`;
  }

  function flowTemplate(stage){
    const t=topic(), ratio=isShorts()?'portrait 9:16':'landscape 16:9';
    return`Animate the supplied ${stage} illustration for exactly 10 seconds, ${ratio}, as one continuous cinematic 2D shot for ${t}. Use the supplied illustration as the absolute visual reference. Preserve the exact historical graphic-novel/anime linework, cel-painted textures, anatomy, architecture, terrain, objects, perspective, palette and lighting. Begin clearly readable motion within the first 0.5 second and sustain meaningful motion through second 10. PRIMARY ACTION: ${actionFor(stage)}. Animate 3–7 supported environmental elements with believable physics. Animate visible adults only when pose and visibility safely support restrained natural movement; otherwise keep them static. CAMERA: use one restrained 2–4% push-in, slight track/tilt, controlled pull-back, or event-appropriate documentary vibration. Do not invent unsupported destruction. Preserve adult identity, count and anatomy. Natural SFX only; no music or voice-over. Negative lock: no cuts, transitions, morphing, time-lapse, new people, vehicles or buildings, duplication, anatomy changes, unnatural growth, photoreal drift, live-action transformation, 3D CGI, text, captions, logos or watermark.`;
  }

  function applyToCard(card,{overwrite=false}={}){
    const stage=card.dataset.stage;if(!stage)return false;
    const role=card.querySelector('.scene-role')?.textContent||'';
    const narration=card.querySelector('.narration'),image=card.querySelector('.image-prompt'),flow=card.querySelector('.flow-prompt');
    let changed=false;
    if(stage!=='ENDING'&&stage!=='THUMBNAIL'&&narration&&(overwrite||!narration.value.trim())){narration.value=narrationTemplate(stage);fireInput(narration);changed=true;}
    if(image&&(overwrite||!image.value.trim())){image.value=imageTemplate(stage,role);fireInput(image);changed=true;}
    if(stage!=='ENDING'&&stage!=='THUMBNAIL'&&flow&&(overwrite||!flow.value.trim())){flow.value=flowTemplate(stage);fireInput(flow);changed=true;}
    return changed;
  }

  function wireStageButtons(){
    stagesEl.querySelectorAll('.stage-card').forEach(card=>{
      const btn=card.querySelector('.generate-template-btn');if(!btn||btn.dataset.wired)return;btn.dataset.wired='1';
      btn.addEventListener('click',()=>{
        const hasContent=[card.querySelector('.narration')?.value,card.querySelector('.image-prompt')?.value,card.querySelector('.flow-prompt')?.value].some(v=>v&&v.trim());
        let overwrite=false;
        if(hasContent){overwrite=confirm(`Replace the existing template content for ${card.dataset.stage} with the new ${detectType()}-specific template?`);if(!overwrite){const changed=applyToCard(card,{overwrite:false});showToast(changed?'Filled missing fields':'No empty fields');return;}}
        applyToCard(card,{overwrite});showToast(`${card.dataset.stage} ${detectType()} template generated`);
      });
    });
  }

  generateAllBtn?.addEventListener('click',()=>{
    const cards=[...stagesEl.querySelectorAll('.stage-card')];if(!cards.length)return showToast('No production yet');
    const hasAny=cards.some(card=>[card.querySelector('.narration')?.value,card.querySelector('.image-prompt')?.value,card.querySelector('.flow-prompt')?.value].some(v=>v&&v.trim()));
    const overwrite=hasAny?confirm(`Regenerate all stage templates using the detected disaster type: ${detectType()}? Existing content will be replaced.`):false;
    let changed=0;cards.forEach(card=>{if(applyToCard(card,{overwrite}))changed++;});
    showToast(changed?`${detectType()} templates generated for ${changed} stages`:'No empty fields to fill');
  });

  const observer=new MutationObserver(()=>wireStageButtons());observer.observe(stagesEl,{childList:true,subtree:true});wireStageButtons();
})();
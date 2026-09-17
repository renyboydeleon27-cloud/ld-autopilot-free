(()=>{
  const stagesEl=document.getElementById('stages');
  const topicEl=document.getElementById('topic');
  const formatEl=document.getElementById('format');
  if(!stagesEl)return;

  function topic(){return (topicEl?.value||'this disaster').trim();}
  function type(){
    const s=topic().toLowerCase();
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

  const hooks={
    tsunami:'A destructive surge was already tearing through the coast as adults fought floodwater, debris, and collapsing structures to survive.',
    earthquake:'The ground was already shaking violently as adults struggled through falling debris, dust, and collapsing structures to survive.',
    volcano:'The eruption was already in progress as adults fled through ash, debris, and dangerous volcanic conditions to survive.',
    tornado:'The tornado was already tearing through the area as adults fought violent wind, flying debris, and failing structures to survive.',
    cyclone:'The cyclone was already battering the coast as adults struggled against violent wind, rain, flooding, debris, and storm surge to survive.',
    flood:'Fast-moving floodwater was already overwhelming the area as adults fought currents, debris, and disappearing escape routes to survive.',
    landslide:'The slope was already collapsing as adults struggled to escape moving rock, mud, snow, or debris rushing through the impact zone.',
    wildfire:'The fire was already sweeping through the area as adults escaped flames, smoke, embers, and dangerous heat.',
    insect:'A massive living swarm was already engulfing farmland as adults confronted the rapidly spreading infestation and crop destruction.',
    generic:'The disaster was already at its most dangerous moment as adults struggled against the active catastrophe around them to survive.'
  };

  const shorts={
    earthquake:['Daily life continues across the city or region before any visible sign of the coming earthquake.','Stress builds along the fault as locked sections of the crust resist movement beneath the surface.','The fault suddenly ruptures, releasing stored energy through powerful seismic waves.','Violent shaking reaches streets and buildings, turning ordinary movement into immediate danger.','Walls crack, utilities fail, and loose objects fall as the shaking intensifies.','Buildings and infrastructure suffer major structural damage during the strongest motion.','Roads, rail lines, bridges, factories, and neighborhoods are damaged as the crisis expands.','Aftershocks and broken infrastructure make rescue and movement more difficult across the affected area.','When the main shaking ends, survivors emerge into dust, debris, and unstable streets.','Civilians and responders begin searching damaged buildings for survivors and trapped residents.','Temporary camps and emergency aid appear as thousands face displacement and shortages.','Homes, transport, utilities, workplaces, and public buildings remain heavily disrupted.','Recovery begins as rubble is cleared and damaged neighborhoods start to rebuild.','The earthquake leaves lasting lessons for safer construction, emergency planning, and preparedness.'],
    tsunami:['Coastal communities begin an ordinary day beside calm water, unaware of the danger building offshore.','Deep beneath the ocean, tectonic stress builds along a major fault below the seafloor.','A powerful rupture suddenly displaces the seafloor and pushes a huge volume of water upward.','Long tsunami waves spread outward across the ocean at high speed.','Along some coasts, the sea withdraws unusually far and exposes the seabed.','The first major wave reaches shore and surges inland with destructive force.','Floodwater carries boats, timber, vehicles, and debris through coastal communities.','The tsunami reaches wider coastlines and expands the disaster beyond the first impact zone.','As water recedes, mud, wreckage, and standing water cover devastated areas.','Survivors and responders begin rescue operations across damaged coastal communities.','Displaced residents gather in temporary shelters while clean water and supplies become urgent.','Ports, roads, homes, fishing fleets, businesses, and utilities suffer severe damage.','Recovery begins as debris is cleared and essential structures are rebuilt.','The disaster changes warning systems, evacuation planning, preparedness, and remembrance.'],
    volcano:['Life continues around the volcano while the mountain appears familiar and stable.','Magma, gas, and pressure build beneath the volcano and increase geological unrest.','Warning signs such as tremors, steam, gas, or ash become harder to ignore.','The eruption begins as ash, gas, lava, or explosive material bursts from the vent.','Ash darkens the sky and begins affecting nearby roads, roofs, and farmland.','The main volcanic hazard surges outward with destructive force.','Communities, roads, rivers, and infrastructure are overwhelmed as volcanic hazards spread.','The wider region faces evacuation, ashfall, transport disruption, or secondary hazards.','After the peak eruption, buried roads, damaged buildings, and ash-covered land remain.','Survivors and responders confront the human cost and begin rescue operations.','Displaced residents gather in safer areas while shelter and supplies become essential.','Agriculture, transport, homes, utilities, and local economies suffer lasting damage.','Cleanup and rebuilding begin as ash, debris, and deposits are removed.','The eruption leaves lasting lessons for monitoring, evacuation, hazard maps, and preparedness.'],
    tornado:['An ordinary day continues beneath unstable air before severe weather fully develops.','Powerful instability and wind shear organize a rotating thunderstorm.','A funnel descends and the tornado reaches the ground.','The tornado approaches populated areas as wind, dust, and debris intensify.','Roofs, trees, signs, and lightweight structures begin failing under extreme winds.','The tornado strikes with full force and tears through buildings and streets.','Debris fills the air as the damage path cuts through neighborhoods, farms, or towns.','The storm continues across a wider area before weakening or lifting.','After the tornado passes, a narrow but severe corridor of destruction is revealed.','Survivors and responders search damaged buildings and blocked streets.','Emergency shelters support people displaced from destroyed or unsafe homes.','Homes, businesses, utilities, farms, and transport routes remain heavily damaged.','Cleanup and rebuilding begin across the tornado track.','The disaster strengthens awareness of warnings, shelters, construction, and preparedness.'],
    cyclone:['Coastal communities continue normal life while a distant tropical system strengthens over warm water.','The storm organizes around a deepening low-pressure center and intensifying winds.','Warnings increase as the cyclone grows stronger and turns toward vulnerable coastlines.','Outer rain bands reach land and bring worsening wind, rain, and rising water.','Storm surge and flooding begin pushing into low-lying communities.','The cyclone makes landfall with destructive wind, rain, waves, and surge.','Roofs fail, trees fall, power systems collapse, and floodwater spreads through communities.','The storm affects a wider region with flooding, landslides, transport disruption, or outages.','As the storm weakens, flooded streets, damaged buildings, and debris remain.','Rescue teams and survivors move through damaged areas while access remains difficult.','Temporary shelters and relief distribution support displaced residents.','Homes, ports, roads, farms, utilities, and businesses suffer major losses.','Cleanup and rebuilding begin as water drains and essential services return.','The cyclone leaves lessons for evacuation, coastal defenses, forecasting, and planning.'],
    flood:['Daily life continues near rivers or low-lying communities before water levels begin rising.','Heavy rain, runoff, dam failure, or surge builds the flood threat.','Water rises quickly and the first roads, fields, or low areas begin to disappear.','Floodwater crosses banks, barriers, or drainage systems and enters populated areas.','Current speed and depth increase, trapping vehicles and cutting access routes.','The flood reaches destructive levels and enters homes and infrastructure.','Fast-moving water carries debris and isolates communities as conditions worsen.','The affected area expands downstream or across a wider floodplain.','As water recedes, mud, debris, contamination, and standing water remain.','Rescue operations focus on stranded residents and cut-off neighborhoods.','Evacuees gather in shelters while clean water, food, and sanitation become priorities.','Roads, bridges, homes, farms, businesses, and utilities show extensive damage.','Cleanup begins as water drains and communities remove mud and debris.','The flood leaves lessons for warning systems, drainage, land use, and evacuation planning.'],
    landslide:['Life continues below unstable slopes or mountains before the ground begins to fail.','Rain, earthquakes, erosion, ice, snow, or weak geology increases instability in the slope.','Cracks, shifting ground, or falling rocks reveal that the slope is beginning to fail.','A large mass suddenly breaks free and accelerates downhill.','Rock, mud, snow, or debris gains speed and volume as it follows gravity.','The moving mass strikes roads, homes, valleys, or settlements with overwhelming force.','Debris blocks transport routes and buries structures as the disaster reaches peak intensity.','Secondary slides, blocked rivers, or isolated communities widen the emergency.','When movement stops, a vast debris field covers the impact zone.','Survivors and responders search unstable terrain for trapped or missing people.','Evacuated residents face disrupted roads, utilities, shelter, and supply access.','Homes, farms, roads, bridges, and infrastructure remain buried or damaged.','Debris removal, slope stabilization, and rebuilding begin during recovery.','The disaster leaves lessons for monitoring, hazard mapping, drainage, and land-use planning.'],
    wildfire:['Communities and forests sit under dry conditions before dangerous fire growth becomes visible.','Heat, drought, dry vegetation, and wind create conditions for rapid fire spread.','Smoke thickens and flames expand as the fire escapes initial containment.','Wind drives the fire toward roads, homes, farms, or forest communities.','Embers leap ahead of the main front and ignite new vegetation or structures.','The wildfire reaches peak intensity with powerful flame fronts and dense smoke.','Roads close, utilities fail, and evacuation routes become urgent as the fire spreads.','The burned area expands across a wider landscape before the advance finally slows.','After the flames pass, blackened terrain, damaged structures, smoke, and ash remain.','Firefighters and residents assess losses and search affected areas.','Evacuees gather in temporary shelters while air quality and basic needs remain concerns.','Homes, forests, farms, utilities, businesses, and habitat show extensive damage.','Cleanup, restoration, and rebuilding begin across burned communities.','The wildfire leaves lessons for fuel management, evacuation, fire-resistant construction, and preparedness.'],
    insect:['Farmers work healthy fields before unusual insect activity becomes impossible to ignore.','Favorable weather and breeding conditions allow insect populations to multiply rapidly.','Scouts or farmers notice growing swarms gathering across vegetation and open land.','Dense airborne swarms begin moving toward productive farmland.','The swarm reaches crops and feeding damage becomes visible across fields.','At peak infestation, huge numbers of insects cover plants and darken parts of the sky.','Crop losses spread as multiple farms and communities face the same outbreak.','The crisis expands across regions or borders as swarms continue migrating.','Damaged fields reveal the scale of lost food and income after swarms pass.','Farmers and authorities assess losses while food-security concerns grow.','Response teams organize surveillance and control operations where available.','Agriculture, household income, markets, and food supplies face wider pressure.','Control campaigns and monitoring reduce swarm pressure while recovery begins.','The outbreak leaves lessons for early warning, weather monitoring, surveillance, and rapid response.']
  };

  function smartNarration(stage){
    if(stage==='ENDING'||stage==='THUMBNAIL')return'';
    const t=topic(), ty=type();
    if(stage==='HOOK')return `${hooks[ty]} This was ${t}.`;
    const n=Number(stage.slice(1));
    if(formatEl?.value!=='longform'){
      const list=shorts[ty];
      if(list?.[n-1])return list[n-1];
      return `The story of ${t} continues as the disaster develops and its effects spread across the affected area.`;
    }
    if(n<=3)return `Before ${t}, daily life continues while the setting, people, and local environment establish the world before disaster.`;
    if(n<=6)return `Warning signs and underlying causes build tension as the conditions behind ${t} become increasingly dangerous.`;
    if(n<=10)return `The trigger arrives and the first major impacts of ${t} begin to unfold across the affected area.`;
    if(n<=15)return `The disaster escalates as infrastructure fails, hazards intensify, and people react to rapidly worsening conditions.`;
    if(n<=20)return `At the peak of ${t}, the strongest verified impacts overwhelm the landscape and surrounding communities.`;
    if(n<=24)return `The wider effects of ${t} spread across more communities, transport routes, services, and infrastructure.`;
    if(n<=27)return `In the aftermath, rescue, emergency response, and the first stages of recovery begin across the damaged area.`;
    if(n<=29)return `The disaster leads to new lessons about risk, preparedness, engineering, warnings, and future response.`;
    return `The story ends with the lasting legacy of ${t} and the changes that followed in the years afterward.`;
  }

  function fillBlankNarrations(){
    let changed=false;
    stagesEl.querySelectorAll('.stage-card').forEach(card=>{
      const stage=card.dataset.stage;
      const box=card.querySelector('.narration');
      if(!box||box.value.trim()||stage==='ENDING'||stage==='THUMBNAIL')return;
      box.value=smartNarration(stage);
      box.dispatchEvent(new Event('input',{bubbles:true}));
      changed=true;
    });
    return changed;
  }

  window.ldFillStaticNarration=fillBlankNarrations;
  window.addEventListener('load',()=>setTimeout(fillBlankNarrations,80));
  setTimeout(fillBlankNarrations,0);
})();

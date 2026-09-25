/* LD AUTO v3.36.0 — Disaster-family progression engine.
   Story-position guidance only. Event-specific verified facts and locked event panels always win. */
(()=>{'use strict';

const VERSION='3.36.0-family-progression-v1';

const COMMON_LATE={
  P9:{role:'Immediate aftermath · hazard has passed or shifted locally',rule:'Show the first readable aftermath appropriate to the event. Do not reset to peak impact and do not jump straight to full recovery.'},
  P10:{role:'Human response · rescue, assessment or emergency action',rule:'Show response only when supported by event context. Keep methods, clothing, vehicles, tools and organization accurate to the event year and location.'},
  P11:{role:'Displacement, relief or short-term survival needs',rule:'Focus on immediate human needs or temporary disruption only when supported. Do not invent modern aid systems, equipment or agencies.'},
  P12:{role:'Wider consequences · infrastructure, agriculture, economy or environment',rule:'Broaden the impact without repeating P10 or P11. Use only consequences supported by the narration/research for this event.'},
  P13:{role:'Early recovery, cleanup, adaptation or rebuilding',rule:'Show gradual recovery only. Do not imply instant normalization, complete reconstruction or outcomes not supported by the event context.'},
  P14:{role:'Historical legacy · final reflective state',rule:'Close on the event’s documented legacy, lasting landscape/community state, preparedness lesson or historical identity. Do not introduce a new disaster beat.'}
};

function mergeLate(early){
  return Object.assign({},early,COMMON_LATE);
}

const FAMILIES={
  tsunami:{
    label:'Tsunami / Megatsunami',
    detect:/\b(tsunami(?:s)?|mega[- ]?tsunami(?:s)?|tidal wave(?:s)?)\b/i,
    stages:mergeLate({
      P1:{role:'Normal coastal or bay setting · calm pre-disaster world',rule:'Establish ordinary life and the vulnerable shoreline before the tsunami. No wave impact, flooding or destruction yet.'},
      P2:{role:'Verified tsunami source or trigger context',rule:'Explain or visualize the documented trigger only: earthquake, landslide, volcanic process or another verified source. Never substitute a generic offshore earthquake when the event had a different cause.'},
      P3:{role:'Earliest local warning or source effects',rule:'Show only warning signs or source effects documented for this event. Do not assume strong shaking, sea recession or public awareness unless supported.'},
      P4:{role:'Tsunami approaches or first abnormal water response',rule:'Move from warning into clearly abnormal water behavior. Do not show the maximum wave or total destruction yet.'},
      P5:{role:'First damaging surge or rapidly escalating water',rule:'Show the first serious water impact appropriate to the event while reserving the strongest documented impact for the next beat when possible.'},
      P6:{role:'Peak local wave / maximum destructive impact',rule:'This is the principal tsunami-impact beat. Keep scale tied to documented context; no invented heights or impossible wall-of-water geometry.'},
      P7:{role:'Destructive inundation · structures and people at risk',rule:'Show water moving through the affected built or natural environment with believable physics. Avoid repeating the exact P6 composition.'},
      P8:{role:'Repeated waves, continuing inundation or wider coastal impact',rule:'Show the continuing or geographically wider tsunami threat if supported. Do not invent repeated waves for an event when the context does not establish them.'}
    })
  },
  earthquake:{
    label:'Earthquake',
    detect:/\b(earthquake(?:s)?|quake(?:s)?|seismic)\b/i,
    stages:mergeLate({
      P1:{role:'Normal life · intact setting before shaking',rule:'Keep the environment stable and ordinary. No cracks, collapse, panic or disaster damage yet.'},
      P2:{role:'Verified tectonic or fault context',rule:'Show the documented earthquake source or pre-event context without inventing a fault mechanism, magnitude or subsurface visualization that is not supported.'},
      P3:{role:'First perceptible shaking · early reaction',rule:'Begin clear but limited shaking and natural human/object response. Do not jump immediately to citywide collapse.'},
      P4:{role:'Strong shaking · disaster fully underway',rule:'Escalate structural motion and falling objects while preserving plausible physics and period construction.'},
      P5:{role:'Major structural damage · danger intensifies',rule:'Show localized failures caused by the shaking. Avoid duplicating the exact P4 action and do not make every structure collapse at once.'},
      P6:{role:'Peak earthquake impact · severe failure / survival crisis',rule:'Use the strongest primary shaking-impact beat here. Keep damage scale consistent with the event context.'},
      P7:{role:'Wider damage or documented secondary hazard',rule:'Broaden the disaster. Fire, liquefaction, landslide or tsunami may appear only when specifically supported for this event.'},
      P8:{role:'Aftershocks, unstable structures or access obstacles',rule:'Move beyond the main shock into continuing danger. Do not present aftershocks as another identical peak-collapse scene.'}
    })
  },
  cyclone:{
    label:'Cyclone / Hurricane / Typhoon',
    detect:/\b(cyclone(?:s)?|hurricane(?:s)?|typhoon(?:s)?|tropical storm(?:s)?)\b/i,
    stages:mergeLate({
      P1:{role:'Normal coastal/community life before storm conditions',rule:'Establish the intact place and ordinary activity. No destructive wind, surge or major flooding yet.'},
      P2:{role:'Storm development, path or meteorological context',rule:'Show only documented storm-development or approach context. Do not invent satellite-era visuals, forecasts or instruments for historical events.'},
      P3:{role:'Early wind, rain or sea deterioration',rule:'Introduce the first clear weather deterioration while keeping structures and community mostly intact.'},
      P4:{role:'Storm intensifies · hazardous conditions build',rule:'Increase wind, rain, waves or pressure effects without jumping to the peak landfall state.'},
      P5:{role:'Landfall / core storm impact begins',rule:'Show the storm striking the affected area with coherent wind direction, rain and debris physics.'},
      P6:{role:'Peak wind and rain · strongest primary storm impact',rule:'Use the strongest wind/rain beat here. Avoid impossible debris motion, instant building disappearance or tornado-like behavior unless documented.'},
      P7:{role:'Storm surge or major flooding if documented',rule:'Use surge/flooding only when supported by the event. Keep water motion distinct from a tsunami and physically consistent with storm-driven inundation.'},
      P8:{role:'Wider structural, coastal or agricultural destruction',rule:'Broaden damage beyond the peak shot without simply repeating P6 or P7.'}
    })
  },
  tornado:{
    label:'Tornado',
    detect:/\b(tornado(?:es)?|twister(?:s)?)\b/i,
    stages:mergeLate({
      P1:{role:'Normal community / farmland before severe weather',rule:'Show intact ordinary life with no funnel, debris cloud or tornado damage yet.'},
      P2:{role:'Verified severe-weather setup',rule:'Show storm development only at the level supported by the event context. Do not invent radar, forecasts or scientific instruments outside the era.'},
      P3:{role:'Funnel formation or first visible tornado development',rule:'Introduce the tornado form progressively. No full destruction yet.'},
      P4:{role:'Touchdown / initial contact with the ground',rule:'Show a physically connected condensation/debris circulation at the surface. Avoid a floating funnel or instant giant debris wall.'},
      P5:{role:'Initial damage along the track',rule:'Show localized wind damage and moving debris with believable trajectories.'},
      P6:{role:'Peak tornado impact · strongest track segment',rule:'Use the strongest tornado-damage beat here while keeping the vortex shape and debris physics coherent.'},
      P7:{role:'Wider damage path · multiple affected properties',rule:'Broaden the track rather than repeating the same single structure.'},
      P8:{role:'Tornado moves on / residual danger and damaged landscape',rule:'Transition out of the peak vortex beat toward the first readable aftermath.'}
    })
  },
  flood:{
    label:'Flood / Dam Failure',
    detect:/\b(flood(?:s|ing)?|inundation|dam failure|dam break|levee breach)\b/i,
    stages:mergeLate({
      P1:{role:'Normal river, dam, town or floodplain before crisis',rule:'Establish intact normal conditions and ordinary water level. No inundation or structural breach yet.'},
      P2:{role:'Verified flood trigger or hydrologic buildup',rule:'Show rainfall, river rise, dam stress, snowmelt or another documented cause only when supported.'},
      P3:{role:'Water level rises / warning stage',rule:'Make the growing water threat readable but keep major inundation for later panels.'},
      P4:{role:'Overflow, breach or first entry of floodwater',rule:'Show the documented transition into flooding. A dam/levee breach may appear only when it is part of the event.'},
      P5:{role:'Rapid inundation · current strengthens',rule:'Show water entering streets, fields or structures with plausible flow and buoyancy.'},
      P6:{role:'Peak flood impact · deepest / fastest destructive conditions',rule:'Use the strongest documented flood state here without inventing wave-like tsunami behavior.'},
      P7:{role:'Structural, agricultural or transport damage',rule:'Show distinct consequences of flooding rather than another identical water-only shot.'},
      P8:{role:'Wider flooded region · crisis continues',rule:'Broaden geography or affected systems while maintaining consistent water levels and event chronology.'}
    })
  },
  volcano:{
    label:'Volcanic Eruption',
    detect:/\b(volcan|eruption|pyroclastic|lahar|magma)\b/i,
    stages:mergeLate({
      P1:{role:'Normal life around the volcano before eruption',rule:'Keep the landscape and settlement intact. No eruption plume, lava, pyroclastic flow or ash disaster yet.'},
      P2:{role:'Verified volcanic unrest / internal mechanism',rule:'Show seismic, magmatic or geological buildup only when supported. Scientific cutaways must be clearly explanatory, not eyewitness footage.'},
      P3:{role:'Documented precursors or first visible unrest',rule:'Use only verified warning signs such as ash, tremor, steam or deformation. Do not invent dramatic precursors.'},
      P4:{role:'Eruption begins',rule:'Show the first eruptive release without immediately combining every volcanic hazard.'},
      P5:{role:'Primary eruptive hazard intensifies',rule:'Focus on the event’s documented main hazard: ash column, lava, pyroclastic density current, explosion or another verified mechanism.'},
      P6:{role:'Peak eruptive phase · strongest primary impact',rule:'Use the strongest supported eruptive beat here; keep scale and motion geologically plausible.'},
      P7:{role:'Secondary volcanic hazard if documented',rule:'Lahar, ashfall, collapse, tsunami or fire may appear only when supported for this event.'},
      P8:{role:'Wider settlement / landscape impact',rule:'Broaden consequences without repeating the exact P5–P7 hazard shot.'}
    })
  },
  avalanche:{
    label:'Avalanche',
    detect:/\b(avalanche(?:s)?|snowslide(?:s)?|snow slide(?:s)?)\b/i,
    stages:mergeLate({
      P1:{role:'Stable mountain / settlement before avalanche',rule:'Show intact snowpack and ordinary mountain activity. No moving avalanche or damage yet.'},
      P2:{role:'Verified snowpack / weather / trigger context',rule:'Show only the documented instability or trigger. Do not invent an explosion, skier or earthquake trigger.'},
      P3:{role:'Initial snow failure / fracture begins',rule:'Start the release locally and clearly. Reserve the full moving mass for later panels.'},
      P4:{role:'Avalanche accelerates downslope',rule:'Show gravity-driven snow movement following terrain. No smoke-like behavior or impossible uphill motion.'},
      P5:{role:'Avalanche reaches vulnerable area',rule:'Bring the moving snow mass into contact with the documented path, structures or people at risk.'},
      P6:{role:'Peak avalanche impact',rule:'Use the strongest burial/impact beat here with believable snow mass, momentum and terrain interaction.'},
      P7:{role:'Burial zone / structural damage',rule:'Show the resulting debris field and distinct local damage rather than repeating the moving front.'},
      P8:{role:'Blocked access / wider affected slope or community',rule:'Broaden consequences and transition toward aftermath.'}
    })
  },
  landslide:{
    label:'Landslide / Mudslide / Rockslide',
    detect:/\b(landslide(?:s)?|mudslide(?:s)?|rockslide(?:s)?|debris flow(?:s)?|mountain collapse|slope failure)\b/i,
    stages:mergeLate({
      P1:{role:'Stable slope / community before failure',rule:'Show the intact landscape and ordinary life. No moving slope, collapse or buried structures yet.'},
      P2:{role:'Verified trigger or slope instability context',rule:'Show rainfall, earthquake, erosion or another documented trigger only when supported.'},
      P3:{role:'First visible slope failure / ground movement',rule:'Begin localized cracking, slumping or movement without jumping instantly to the full mass failure.'},
      P4:{role:'Mass movement accelerates',rule:'Show gravity-driven earth/rock/mud following terrain with plausible material behavior.'},
      P5:{role:'Moving mass reaches vulnerable area',rule:'Bring the failure into contact with the documented road, settlement, river or structures at risk.'},
      P6:{role:'Peak landslide impact',rule:'Use the strongest supported collapse/burial beat here with clear cause and momentum.'},
      P7:{role:'Burial / blockage / structural damage zone',rule:'Show the distinct result of the mass movement rather than another identical moving-slope shot.'},
      P8:{role:'Wider access, river or terrain disruption',rule:'Broaden consequences while transitioning into aftermath.'}
    })
  },
  wildfire:{
    label:'Wildfire / Firestorm',
    detect:/\b(wildfire(?:s)?|forest fire(?:s)?|bushfire(?:s)?|firestorm(?:s)?|urban fire(?:s)?|great fire(?:s)?)\b/i,
    stages:mergeLate({
      P1:{role:'Normal settlement / forest / grassland before fire',rule:'Show intact structures and vegetation. No active destructive fire or smoke emergency yet.'},
      P2:{role:'Verified ignition or fire-weather context',rule:'Use the documented ignition or environmental conditions only. Do not invent a cause when unknown.'},
      P3:{role:'First active flames / smoke column',rule:'Introduce a localized fire before the rapid spread phase.'},
      P4:{role:'Fire spreads through fuel / structures',rule:'Show wind and fuel-driven spread with coherent flame direction and heat effects.'},
      P5:{role:'Danger escalates · fire front approaches people/property',rule:'Increase exposure and urgency without reaching the strongest firestorm beat yet.'},
      P6:{role:'Peak fire / firestorm impact',rule:'Use the strongest supported flame, ember and structural-loss beat here. Avoid explosive behavior unless documented.'},
      P7:{role:'Wider burn area / multiple structures affected',rule:'Broaden damage while keeping ember, smoke and wind behavior physically coherent.'},
      P8:{role:'Fire moves through / residual burning and smoke',rule:'Transition from peak flame front toward the burned aftermath without instant cleanup.'}
    })
  },
  insect:{
    label:'Insect / Locust Outbreak',
    detect:/\b(locust(?:s)?|grasshopper(?:s)?|insect plague(?:s)?|insect outbreak(?:s)?|pest swarm(?:s)?)\b/i,
    stages:{
      P1:{role:'Healthy farm / normal landscape before visible outbreak',rule:'Keep crops healthy and ordinary. No visible swarm or outbreak damage yet unless the event-specific panel explicitly overrides this.'},
      P2:{role:'Early insect population buildup',rule:'Show normal-sized separate insects accumulating near ground/vegetation. No smoke-like sky mass or instant crop destruction.'},
      P3:{role:'Human realization / larger visible gathering',rule:'Increase the visible insect presence and concern while keeping the full plague state for later panels.'},
      P4:{role:'Airborne front / outbreak spreads toward productive land',rule:'Show movement into new areas. Insects remain individually readable and must not resemble smoke, dust, fog or a solid black cloud.'},
      P5:{role:'First major crop contact / feeding damage begins',rule:'Show insects physically interacting with crops; most vegetation should not vanish instantly.'},
      P6:{role:'Peak infestation · dense feeding and airborne activity',rule:'Use the strongest outbreak beat here with plausible separate insects, layered depth and continuous feeding.'},
      P7:{role:'Widespread agricultural damage',rule:'Shift emphasis from swarm spectacle to crop loss across multiple affected fields.'},
      P8:{role:'Regional spread / multiple farms or communities affected',rule:'Broaden geography rather than repeating another close feeding scene.'},
      P9:{role:'Post-swarm stripped fields / immediate agricultural aftermath',rule:'Reduce airborne swarm density and make the damaged landscape the primary visual story.'},
      P10:{role:'Loss assessment / household and farm hardship',rule:'Show period-appropriate assessment and practical consequences, not modern emergency command systems.'},
      P11:{role:'Relief, local control or practical assistance if documented',rule:'Use only response methods supported by the event and era. No aircraft, trucks, radios or modern pesticides in historical settings unless verified.'},
      P12:{role:'Broader shortages / economic or community consequences',rule:'Differentiate from P11 by focusing on recipients and continuing hardship rather than aid sorting or control operations.'},
      P13:{role:'Gradual field recovery / replanting preparation',rule:'Show clearing, seed, soil preparation or other supported recovery steps. No instant green recovery.'},
      P14:{role:'Historical agricultural legacy',rule:'Close on the documented historical significance or long recovery without introducing a new swarm.'}
    }
  },
  nuclear:{
    label:'Nuclear / Radiation Accident',
    detect:/\b(nuclear|reactor|radiation|meltdown|chernobyl|fukushima)\b/i,
    stages:mergeLate({
      P1:{role:'Normal facility / surrounding community before accident',rule:'Show intact operations and ordinary surroundings with period-accurate equipment. No radiation glow or visible contamination.'},
      P2:{role:'Verified initiating event or system condition',rule:'Show only the documented technical or external trigger. Do not invent control-room actions, alarms or component failures.'},
      P3:{role:'Operational anomaly / early emergency escalation',rule:'Make the developing problem readable without jumping to the final release or explosion.'},
      P4:{role:'Loss of control / accident becomes severe',rule:'Escalate only along the verified accident sequence. Radiation itself is invisible; never portray it as glowing green energy.'},
      P5:{role:'Major release, explosion or core damage if documented',rule:'Show the event’s verified main accident mechanism without Hollywood-style nuclear detonation unless that actually occurred.'},
      P6:{role:'Peak site emergency / strongest immediate impact',rule:'Use the strongest supported facility-emergency beat here.'},
      P7:{role:'Immediate site damage / exposure-control crisis',rule:'Show site-level consequences and protective response only when supported.'},
      P8:{role:'Wider evacuation / contamination zone if documented',rule:'Broaden beyond the facility using supported evacuation or contamination context; contamination is not visually glowing.'}
    })
  },
  epidemic:{
    label:'Epidemic / Pandemic',
    detect:/\b(plague|pandemic|epidemic|disease outbreak|black death|cholera|influenza)\b/i,
    stages:mergeLate({
      P1:{role:'Ordinary community life before recognized outbreak',rule:'Show normal daily life without visibly labeling people as infected or inventing symptoms.'},
      P2:{role:'Verified origin / early case context',rule:'Use only documented origin, transmission or early-case context. Do not invent a patient zero.'},
      P3:{role:'Early spread / growing concern',rule:'Show increasing strain or documented symptoms carefully, without sensationalized body horror.'},
      P4:{role:'Outbreak recognized / spread becomes clear',rule:'Make the expanding public-health problem readable while keeping interventions era-appropriate.'},
      P5:{role:'Cases and community disruption increase',rule:'Escalate human and institutional strain without using unsupported casualty counts.'},
      P6:{role:'Peak outbreak pressure',rule:'Use the strongest supported health/community impact beat here; avoid gore and dehumanizing imagery.'},
      P7:{role:'Wider geographic or institutional impact',rule:'Broaden the crisis beyond a single room or household.'},
      P8:{role:'Control measures / continued spread if documented',rule:'Show quarantine, sanitation, treatment or other measures only when supported for the event and era.'}
    })
  },
  drought:{
    label:'Drought',
    detect:/\b(drought|dust bowl|water shortage)\b/i,
    stages:mergeLate({
      P1:{role:'Normal farm / landscape before prolonged drought',rule:'Show healthy or ordinary baseline conditions before severe stress.'},
      P2:{role:'Rainfall deficit / climate context',rule:'Show only documented dry conditions or weather context; do not invent a single dramatic trigger.'},
      P3:{role:'Early soil and vegetation stress',rule:'Introduce gradual dryness and wilting without instant total crop death.'},
      P4:{role:'Water shortage becomes visible',rule:'Show declining water availability, dry soil or stressed agriculture with slow-onset realism.'},
      P5:{role:'Crop / pasture losses intensify',rule:'Increase agricultural damage gradually and avoid sudden disaster-movie transitions.'},
      P6:{role:'Peak drought conditions',rule:'Use the strongest documented dry-landscape and livelihood impact here.'},
      P7:{role:'Livestock / ecosystem / water-system pressure',rule:'Show secondary drought consequences only when supported.'},
      P8:{role:'Wider regional drought impact',rule:'Broaden geography and sustained hardship rather than repeating a single cracked-field shot.'}
    })
  },
  generic:{
    label:'General Disaster',
    detect:/.*/,
    stages:mergeLate({
      P1:{role:'Normal world · intact setting before disaster',rule:'Establish the place, era and ordinary conditions before visible disaster impact.'},
      P2:{role:'Verified cause / background context',rule:'Show only the documented cause or buildup. Do not invent a mechanism just to fill the panel.'},
      P3:{role:'First warning / first visible change',rule:'Introduce the earliest supported sign of danger without jumping to peak destruction.'},
      P4:{role:'Disaster begins · initial impact',rule:'Move clearly into the event while preserving a readable escalation path.'},
      P5:{role:'Escalation · danger and damage intensify',rule:'Increase the primary hazard without duplicating P4.'},
      P6:{role:'Peak primary impact',rule:'Use the strongest supported main-hazard beat here.'},
      P7:{role:'Wider destruction / secondary effects',rule:'Broaden consequences; secondary hazards require event-specific support.'},
      P8:{role:'Continuing danger / transition toward aftermath',rule:'Show continuing risk without resetting to an identical peak-impact scene.'}
    })
  }
};

const ORDER=['tsunami','earthquake','cyclone','tornado','flood','volcano','avalanche','landslide','wildfire','insect','nuclear','epidemic','drought'];

function family(topic){
  const t=String(topic||'');
  for(const key of ORDER)if(FAMILIES[key].detect.test(t))return key;
  return 'generic';
}
function stage(topic,stageName){
  const key=family(topic);
  const data=FAMILIES[key];
  const item=data.stages[String(stageName||'').toUpperCase()]||null;
  if(!item)return null;
  return {
    version:VERSION,
    family:key,
    familyLabel:data.label,
    stage:String(stageName||'').toUpperCase(),
    role:item.role,
    rule:item.rule,
    evidenceRule:'This is a story-position lock, not a fact source. Event-specific research, narration and approved event panels control factual details. If a named sub-hazard or response is not verified for this event, do not invent it.'
  };
}
function role(topic,stageName){
  return stage(topic,stageName)?.role||'';
}
function rule(topic,stageName){
  const x=stage(topic,stageName);
  return x?[x.rule,x.evidenceRule].join(' '):'';
}
function all(topic){
  const key=family(topic), data=FAMILIES[key];
  return Object.fromEntries(Object.keys(data.stages).map(k=>[k,stage(topic,k)]));
}
function summary(topic){
  const key=family(topic), data=FAMILIES[key];
  return {version:VERSION,family:key,familyLabel:data.label,stages:all(topic)};
}

window.LDDisasterProgression=Object.freeze({version:VERSION,family,stage,role,rule,all,summary});
})();
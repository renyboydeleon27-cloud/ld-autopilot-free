/* LD AUTO v3.36.0 — Disaster-family progression engine.
   Generic P1–P14 story architecture only. Event-specific approved packs still override these rules. */
(function(){'use strict';

const FAMILY_ORDER=[
  ['tsunami',/tsunami|mega[- ]?tsunami|tidal wave/i],
  ['earthquake',/earthquake|quake|seismic/i],
  ['cyclone',/cyclone|hurricane|typhoon|tropical storm|storm surge/i],
  ['tornado',/tornado|twister/i],
  ['flood',/flood|deluge|river overflow|flash flood/i],
  ['volcano',/volcan|eruption|pyroclastic|lahar/i],
  ['wildfire',/wildfire|forest fire|bushfire|firestorm/i],
  ['landslide',/landslide|mudslide|rockslide|debris flow|avalanche/i],
  ['insect',/locust|insect|grasshopper|armyworm|beetle|pest outbreak/i],
  ['nuclear',/nuclear|radiation|reactor|meltdown|chernobyl|fukushima/i]
];

const MAPS={
 tsunami:[
  'Normal coastal world · location and ordinary life before the trigger',
  'Trigger/source begins · earthquake, landslide, eruption, or other verified mechanism only',
  'Local warning or source aftermath · do not show the main tsunami impact yet',
  'First clear water anomaly or approaching-wave evidence when historically supported',
  'Danger visibly escalates · water movement grows toward shore',
  'First major impact · destructive surge reaches the focal coast',
  'Peak local destruction · strongest water force and immediate survival crisis',
  'Continuing waves / secondary surge · danger persists without repeating P6–P7 composition',
  'Immediate aftermath · inundation, debris, stranded survivors, or damaged coast',
  'Wider geographic impact · another affected zone or broader damage scale',
  'Human consequences / response · rescue, displacement, relief, or documented losses',
  'Measured / documented physical impact · run-up, inundation, survey, or verified evidence only',
  'Recovery / scientific understanding · distinct from rescue and peak destruction',
  'Historical legacy · reflective final consequence without restarting the disaster'
 ],
 earthquake:[
  'Normal daily life · intact environment before shaking',
  'Hidden tectonic cause or pre-event context · no visible destruction yet',
  'First unmistakable shaking · small objects and people react',
  'Shaking intensifies · structural stress begins but avoid peak collapse',
  'Major structural failure · falling masonry, cracking, or localized collapse',
  'Peak earthquake destruction · strongest ground motion and survival crisis',
  'Wider urban/rural damage · distinct location and infrastructure consequences',
  'Secondary hazards · fire, landslide, liquefaction, aftershock, or utility failure only when supported',
  'Immediate aftermath · dust settles, survivors emerge, unstable structures remain',
  'Search and rescue · trapped survivors / organized response when supported',
  'Displacement and emergency aid · shelters, food, medical response when supported',
  'Broader disruption · transport, utilities, economy, or regional damage',
  'Recovery / rebuilding · debris clearance and reconstruction begin',
  'Legacy · engineering, preparedness, or historical significance'
 ],
 cyclone:[
  'Calm pre-storm life · ordinary coastal or inland setting',
  'Storm development / approach · distant weather change, no landfall destruction yet',
  'Warnings and preparation · only historically appropriate systems and behavior',
  'Outer bands arrive · wind and rain begin, structures still mostly intact',
  'Conditions intensify · stronger wind, rain, rising water, escalating danger',
  'Landfall / peak wind · strongest atmospheric impact begins',
  'Storm surge / flooding / structural failure · peak local crisis',
  'Wider destruction · another neighborhood or infrastructure system affected',
  'Storm passes or weakens · immediate aftermath becomes visible',
  'Survivors / rescue · dangerous debris and flooded access remain',
  'Displacement / relief · aid, shelter, shortages when supported',
  'Regional consequences · agriculture, utilities, transport, disease risk, or economy when supported',
  'Recovery begins · cleanup, repairs, rebuilding',
  'Historical legacy · lessons, warning systems, preparedness, or lasting impact'
 ],
 tornado:[
  'Normal pre-storm community · intact homes, farms, or town',
  'Atmospheric buildup · darkening storm / unstable weather without tornado impact yet',
  'Warning signs / funnel formation · tornado not yet at peak damage',
  'Tornado fully forms and approaches structures',
  'First direct impact · debris and localized structural damage',
  'Peak destruction · strongest visible tornado impact',
  'Damage path expands · distinct block, farm, or infrastructure scene',
  'Tornado moves on / secondary hazards · debris, downed lines, damaged structures',
  'Immediate aftermath · survivors emerge across the damage path',
  'Search and rescue · responders / neighbors where historically supported',
  'Displacement and urgent needs · shelter, medical help, supplies',
  'Wider community losses · homes, farms, businesses, infrastructure',
  'Cleanup / rebuilding begins',
  'Historical legacy · forecasting, warning, construction, or preparedness lessons'
 ],
 flood:[
  'Normal riverside / urban / rural life before water rises',
  'Trigger conditions build · rain, snowmelt, dam stress, or river rise only when verified',
  'First visible water rise · low-lying areas begin to flood',
  'Flooding spreads · roads / fields / homes begin losing access',
  'Water depth and current intensify · evacuation or danger escalates',
  'Peak flood impact · strongest current / inundation / structural loss',
  'Wider geographic flooding · distinct district, farmland, or infrastructure',
  'Continuing hazard · contaminated water, isolated areas, dam/levee effects, or further rise when supported',
  'Immediate aftermath / receding water · debris and mud become dominant',
  'Rescue / evacuation / access restoration when supported',
  'Displacement and relief · shelter, food, clean water, medical needs',
  'Broader consequences · agriculture, transport, utilities, disease, economy when supported',
  'Recovery / cleanup / rebuilding begins',
  'Historical legacy · flood control, warning, planning, or lasting impact'
 ],
 volcano:[
  'Normal life around the volcano before visible unrest',
  'Geologic buildup / unrest · verified seismic, gas, deformation, or subsurface mechanism',
  'First visible warning signs · ash/steam/minor activity only when supported',
  'Eruption begins · initial explosive or effusive activity',
  'Escalation · ash column, lava, ballistic material, or pyroclastic activity grows',
  'Peak eruption · strongest verified volcanic impact',
  'Primary destruction · settlements, forests, or infrastructure affected',
  'Secondary hazard · lahar, ashfall, fire, tsunami, roof collapse, or flow when supported',
  'Immediate aftermath · ash-covered / damaged landscape',
  'Evacuation / rescue / survivor response when supported',
  'Displacement / relief / health impacts when supported',
  'Regional consequences · agriculture, transport, climate, economy when supported',
  'Recovery / resettlement / monitoring begins',
  'Historical / scientific legacy'
 ],
 wildfire:[
  'Normal landscape / settlement before ignition or spread',
  'Ignition / dry conditions / wind context · only verified cause or conditions',
  'Small fire establishes · localized flames and smoke, no community-wide destruction yet',
  'Rapid spread · fire front grows toward vegetation or structures',
  'First direct structural / ecological impact',
  'Peak firestorm · strongest flame front and survival crisis',
  'Wider burn area · distinct neighborhood / forest / infrastructure damage',
  'Continuing hazards · embers, wind shift, smoke, spot fires, blocked routes',
  'Immediate aftermath · burned landscape, damaged structures, residual smoke',
  'Evacuation / rescue / firefighting response when supported',
  'Displacement / relief / air-quality or medical consequences',
  'Broader ecological / economic / infrastructure impact',
  'Recovery / containment / rebuilding begins',
  'Historical legacy · fire management, preparedness, or ecological lessons'
 ],
 landslide:[
  'Normal slope / mountain / settlement before failure',
  'Instability builds · rain, earthquake, erosion, snow loading, or other verified trigger',
  'First visible slope movement / cracking / snow instability',
  'Failure begins · material starts moving downslope',
  'Acceleration · moving mass gains speed and volume',
  'Peak impact · strongest collision / burial / avalanche runout',
  'Wider destruction · roads, homes, forest, valley, or infrastructure',
  'Secondary hazard · flooding, damming, debris flow, wave, or isolation when supported',
  'Immediate aftermath · buried / blocked landscape and survivors',
  'Search and rescue / access challenge when supported',
  'Displacement / relief / isolated communities',
  'Broader transport / economic / environmental consequences',
  'Recovery / clearance / slope stabilization begins',
  'Historical legacy · monitoring, engineering, land-use, or warning lessons'
 ],
 insect:[
  'Normal healthy environment / farming life · zero outbreak impact',
  'Early population buildup · insects appear in unusual but limited numbers',
  'Human realization · clearly abnormal concentrations become noticeable',
  'Outbreak expands spatially · approaching or spreading swarm/pest front',
  'First direct feeding / crop contact · damage begins',
  'Peak infestation · densest active feeding / swarm pressure',
  'Damage spreads across neighboring farms / ecosystems',
  'Wider regional spread · distinct geography, not a repeat close-up',
  'Post-swarm / post-feeding aftermath · stripped crops or depleted vegetation',
  'Human hardship / loss assessment · livelihoods and food pressure',
  'Relief / control response appropriate to the era and evidence',
  'Continuing social / economic consequences · distinct from P11 response',
  'Recovery / replanting / scientific response begins',
  'Historical legacy · lasting agricultural / ecological lesson'
 ],
 nuclear:[
  'Normal facility / community before the initiating failure',
  'Initiating technical or natural trigger · no large release yet',
  'Systems begin failing · alarms / equipment / containment stress when supported',
  'Critical failure / accident begins',
  'Escalation · fire, explosion, release, or loss of control when supported',
  'Peak accident conditions · strongest verified physical event',
  'Immediate site consequences · damaged systems / hazardous zone',
  'Protective actions / evacuation begin when supported',
  'Wider contamination / exclusion / monitoring consequences',
  'Emergency response / medical monitoring when supported',
  'Displacement / long-duration restrictions',
  'Economic / environmental / infrastructure consequences',
  'Cleanup / containment / decommissioning / recovery',
  'Historical legacy · safety regulation, design, monitoring, or policy consequences'
 ],
 generic:[
  'Normal world · location and ordinary life before the hazard',
  'Cause / trigger context · no peak impact yet',
  'First warning signs / early hazard manifestation',
  'Disaster begins · first direct impact',
  'Escalation · damage and danger intensify',
  'Peak impact · strongest local crisis',
  'Wider destruction · distinct area / system affected',
  'Continuing or secondary hazards · do not repeat the peak shot',
  'Immediate aftermath · survivors and damaged environment',
  'Search / rescue / assessment when supported',
  'Displacement / relief / urgent needs when supported',
  'Broader regional / social / infrastructure consequences',
  'Recovery / rebuilding begins',
  'Historical legacy · lessons and lasting impact'
 ]
};

function family(topic){
  const t=String(topic||'');
  for(const [name,re] of FAMILY_ORDER)if(re.test(t))return name;
  return 'generic';
}
function panelIndex(stage){
  const m=/^P([1-9]|1[0-4])$/.exec(String(stage||'').toUpperCase());
  return m?Number(m[1]):0;
}
function role(topic,stage){
  const n=panelIndex(stage); if(!n)return '';
  const f=family(topic);
  return (MAPS[f]||MAPS.generic)[n-1]||MAPS.generic[n-1]||'';
}
function previousRole(topic,stage){
  const n=panelIndex(stage); return n>1?role(topic,'P'+(n-1)):'';
}
function nextRole(topic,stage){
  const n=panelIndex(stage); return n&&n<14?role(topic,'P'+(n+1)):'';
}
function lock(topic,stage){
  const n=panelIndex(stage); if(!n)return '';
  const f=family(topic);
  const current=role(topic,stage),prev=previousRole(topic,stage),next=nextRole(topic,stage);
  return [
    'DISASTER-FAMILY PROGRESSION LOCK:',
    'Family: '+f+'.',
    'Current stage '+stage+': '+current+'.',
    prev?'Previous stage role: '+prev+'.':'This is the first narrative panel after the HOOK.',
    next?'Next stage role: '+next+'.':'This is the final P1–P14 narrative panel.',
    'Show ONLY the current stage beat. Do not visually jump forward into the next stage and do not repeat the previous stage composition as the main action.',
    'Event-specific verified facts, Approved Memory, approved event packs, narration evidence, year/location locks, and explicit user instructions override this generic family architecture.',
    'Do not invent a warning sign, secondary hazard, casualty, response action, measurement, cause, or technology merely because it appears as an option in this family template.',
    'END DISASTER-FAMILY PROGRESSION LOCK.'
  ].filter(Boolean).join('\n');
}
function all(topic){return (MAPS[family(topic)]||MAPS.generic).slice();}
window.LDDisasterFamilyEngine=Object.freeze({family,role,previousRole,nextRole,lock,all,maps:MAPS});
})();
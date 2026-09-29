/* LD AUTO Continuity Engine v1.0.0 — coordinated T2V consistency system for P1–P14. */
(function(){'use strict';

function topic(){
  return String(document.getElementById('projectTitle')?.textContent||document.getElementById('topic')?.value||'').trim();
}
function stageName(cardOrStage){
  return typeof cardOrStage==='string'?cardOrStage:String(cardOrStage?.dataset?.stage||'');
}
function stageNumber(cardOrStage){
  const n=parseInt(stageName(cardOrStage).replace(/\D/g,''),10);
  return Number.isFinite(n)?n:0;
}
function family(){
  return window.LDDisasterProgression?.family?.(topic())||(
    /avalanche|landslide/i.test(topic())?'landslide':
    /earthquake/i.test(topic())?'earthquake':
    /tsunami/i.test(topic())?'tsunami':
    /cyclone|hurricane|typhoon/i.test(topic())?'cyclone':
    /tornado/i.test(topic())?'tornado':
    /flood/i.test(topic())?'flood':
    /locust|grasshopper|insect/i.test(topic())?'insect':'generic'
  );
}
function approved(stage){
  return window.ldApprovedMemory?.stages?.[stage]?.latest||null;
}
function previousStage(stage){
  const n=stageNumber(stage);return n>1?'P'+(n-1):'';
}
function compact(value,max=420){
  const s=String(value||'').replace(/\s+/g,' ').trim();
  if(s.length<=max)return s;
  const cut=s.slice(0,max);
  const i=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('; '),cut.lastIndexOf(', '),cut.lastIndexOf(' '));
  return cut.slice(0,i>220?i:max).trim()+'…';
}
function cameraGrammar(stage){
  const n=stageNumber(stage);
  const base='SHOT BIBLE / CAMERA GRAMMAR: Use one coherent cinematic language for the episode: grounded human-height or motivated environmental viewpoints, normal-to-moderately-wide perspective, stable horizon, readable foreground-midground-background depth, and one motivated continuous move. Avoid fisheye distortion, random orbiting, drone-like motion without narrative reason, repeated identical camera axes, zoom pumping and camera teleportation.';
  if(n<=3)return base+' Early panels favor restrained observation, slow lateral movement or a gentle forward push.';
  if(n<=8)return base+' Impact panels may use stronger low-angle, tracking or deep-perspective movement, but operator motion remains controlled and physically readable.';
  if(n<=12)return base+' Aftermath and response panels return to human-height observational movement and deliberate reveals.';
  return base+' Recovery and legacy panels use calm tracking, restrained crane-like reveals or nearly locked compositions.';
}
function physicsBible(stage){
  const fam=family();
  const common='DISASTER PHYSICS BIBLE: Motion must have visible cause, mass, inertia, gravity, resistance and direction. No hovering heavy debris, reverse motion without force, spontaneous explosions, instant repair, geometry melt, teleportation or fantasy energy.';
  const specific={
    earthquake:' Earthquake motion propagates through ground and structures; loose objects react before major failure, structural damage accumulates, and collapse follows load paths and gravity rather than exploding outward.',
    landslide:' Snow, rock, soil or debris moves downslope under gravity. Dense material stays low and heavy; powder or dust is secondary to the moving mass. Trees or structures react only when physically contacted or shaken.',
    tsunami:' Water motion preserves gravity, depth, shoreline geometry and momentum. Rising or surging water pushes floating debris with the flow; water does not behave like smoke, a rigid wall or an explosive blast.',
    cyclone:' Wind, rain, surge and debris share one coherent directional system. Light material accelerates first; heavy structures fail progressively. Rain, flooding and wind effects evolve rather than appearing as unrelated effects.',
    tornado:' Rotational wind and inflow drive debris; lighter objects travel farther and higher than heavy objects. Damage follows the tornado path and does not appear everywhere at once.',
    flood:' Water follows terrain and gravity, rises or flows progressively, carries floating debris downstream, and does not jump between levels without a physical path.',
    insect:' Swarms move as many small organisms with continuous migration. Crop damage progresses through feeding; insects do not multiply instantly, form a solid object or erase fields in one frame.'
  }[fam]||' Preserve the documented disaster mechanism and believable cause-and-effect for the selected event.';
  return common+specific;
}
function panelHandoff(stage){
  const prev=previousStage(stage);
  if(!prev)return 'PANEL HANDOFF MEMORY: P1 establishes the normal physical world. No earlier panel may be invented as visual history.';
  const snap=approved(prev);
  if(!snap)return 'PANEL HANDOFF MEMORY: No approved '+prev+' handoff is available. Preserve only project-level canon and do not invent continuity from an unapproved prior panel.';
  const canon=snap.continuityCanon||{};
  const scene=compact(canon.scene||snap.videoScene||'',300);
  const narration=compact(snap.narration||'',220);
  const damage=compact(canon.damageState||'',220);
  return 'PANEL HANDOFF MEMORY: Carry forward only established facts from APPROVED '+prev+'. Previous scene: '+(scene||'not explicitly recorded')+'. Previous story beat: '+(narration||'not explicitly recorded')+'. Previous damage/state: '+(damage||'preserve only visibly established conditions')+'. Do not reset established environment, weather, damage, recurring object or hazard direction unless the story clearly changes location/time or a visible physical cause changes it.';
}
function anchorObjectSystem(){
  const fam=family();
  const anchors={
    earthquake:'period street/ground surface language, facade and roof construction family, utility poles or fixtures when established, recurring masonry/wood details',
    landslide:'slope direction, snow/rock surface language, conifer/tree scale when established, railway or mountain infrastructure only when location-appropriate',
    tsunami:'shoreline profile, waterline/elevation cues, coastal construction language, vegetation, harbor/boat scale when established',
    cyclone:'regional roof/wall material language, road/ground condition, vegetation, drainage/coastal cues, recurring storm-exposed objects',
    tornado:'field/town scale, fences, utility structures, road surface, farm/building material language, horizon character',
    flood:'river/street edges, elevation cues, building material language, vegetation, bridges/utilities when established',
    insect:'field boundaries, crop identity once established, fences, barns, wagons/tools and prairie terrain'
  }[fam]||'terrain profile, construction language, ground surface, vegetation and recurring infrastructure';
  return 'ANCHOR OBJECT SYSTEM: Use 1–3 recurring environmental anchors to make separate clips feel like one episode. Candidate anchor family: '+anchors+'. Reuse an anchor only when it is already established or historically/location appropriate. Keep its scale, material and orientation coherent; do not force the exact same background into every panel.';
}
function lightingBible(stage){
  const prev=previousStage(stage),snap=prev?approved(prev):null;
  const ref=snap?compact(snap.continuityCanon?.lightingState||'',220):'';
  return 'LIGHTING CONTINUITY BIBLE: Time-of-day, sky brightness, shadow direction, contrast, visibility, precipitation and ground wetness are continuity variables, not decoration. '+(ref?'Carry forward the approved prior lighting state: '+ref+'. ':'If no lighting fact is established, keep lighting restrained and period-neutral rather than inventing a dramatic change. ')+'Change lighting only when the narrative, weather progression or passage of time supports it; transitions must be progressive, not a sudden unrelated reset.';
}
function damageState(stage){
  const n=stageNumber(stage);
  const fam=family();
  if(n<=2)return 'pre-impact / intact baseline unless this event explicitly starts earlier';
  if(n===3)return 'first observable disturbance; major destruction not yet earned';
  if(n<=5)return 'initial-to-strong damage accumulating locally';
  if(n<=8)return 'major damage / peak-to-wider impact; preserve all earlier irreversible failures';
  if(n===9)return 'immediate aftermath; damage remains and no spontaneous repair occurs';
  if(n<=12)return 'response / displacement / infrastructure consequence; damaged world persists';
  if(n===13)return 'early cleanup or recovery; only deliberate human repair may change damage state';
  return fam==='generic'?'legacy state consistent with prior panels':'reflective legacy/recovery state consistent with accumulated damage and documented recovery';
}
function damageMemory(stage){
  const prev=previousStage(stage),snap=prev?approved(prev):null;
  const previous=snap?.continuityCanon?.damageState||'';
  return 'DAMAGE MEMORY / NO-RESET RULE: Current expected state: '+damageState(stage)+'. '+(previous?'Approved prior state: '+previous+'. ':'')+'Once a structure, road, tree, vehicle, field, shoreline feature or major object is visibly damaged, displaced or destroyed, that state persists in the same/nearby continuity until a believable repair, cleanup, relocation or time jump is explicitly shown. No silent reconstruction, respawn or return to pristine condition.';
}
function intensityValue(stage){
  const n=stageNumber(stage);
  const map={1:1,2:2,3:3,4:5,5:7,6:10,7:9,8:8,9:6,10:5,11:4,12:4,13:3,14:2};
  return map[n]||5;
}
function intensityCurve(stage){
  const v=intensityValue(stage);
  return 'CINEMATIC INTENSITY CURVE: Target '+v+'/10 for '+stage+'. Intensity controls scale, camera urgency, environmental motion and emotional pressure—not random chaos. Preserve contrast between calm buildup, peak impact, aftermath and recovery so every panel does not feel equally loud.';
}
function motionBudget(stage){
  const v=intensityValue(stage);
  const secondary=v>=9?'4–6':v>=6?'3–5':v>=4?'2–4':'1–3';
  return 'MOTION BUDGET: ONE dominant primary action plus '+secondary+' restrained secondary motions maximum. Background motion must support the main action rather than compete with it. Do not animate every object, every person and every environmental layer simultaneously. More motion is allowed at peak impact, but each movement still needs a visible physical cause.';
}
function frameLock(card){
  const stage=stageName(card);
  const scene=compact(card?.querySelector?.('.video-scene')?.value||card?.dataset?.videoScene||'',260);
  return 'FIRST-FRAME / LAST-FRAME LOCK: FIRST FRAME must already establish the '+stage+' location, required cast/object count, current damage state and the core environmental anchors before major motion develops. '+(scene?'Scene anchor: '+scene+'. ':'')+'LAST FRAME must preserve the same identities, environment geometry and surviving anchor objects, showing only changes physically caused during this shot. No unexplained new person, object, building, road, weather state or replacement background may appear at the end.';
}
function snapshot(card){
  const stage=stageName(card);
  return {
    version:'1.0',
    stage,
    family:family(),
    intensity:intensityValue(stage),
    scene:String(card?.querySelector?.('.video-scene')?.value||card?.dataset?.videoScene||''),
    damageState:damageState(stage),
    cameraGrammar:cameraGrammar(stage),
    anchorSystem:anchorObjectSystem(),
    lightingState:'Preserve only lighting/weather visibly established in this approved clip and project context.',
    motionBudget:motionBudget(stage)
  };
}
function promptBlock(card){
  const stage=stageName(card);
  if(!/^P(?:[1-9]|1[0-4])$/.test(stage))return '';
  return [
    'EPISODE CANON — CONTINUITY ENGINE:',
    cameraGrammar(stage),
    physicsBible(stage),
    panelHandoff(stage),
    anchorObjectSystem(),
    lightingBible(stage),
    damageMemory(stage),
    intensityCurve(stage),
    motionBudget(stage),
    frameLock(card),
    'APPROVED CANON PANEL: This block is the source-of-truth continuity contract for '+stage+'. Project/event facts and dedicated event-specific locks outrank generic guidance. Once this panel is approved, its established environment, damage, lighting, anchors and scene state become eligible handoff canon for the next panel. Never copy unsupported facts from a different disaster or location.'
  ].join('\n\n');
}
function episodeCanonPreview(){
  return '10-SYSTEM CONTINUITY ENGINE ACTIVE:\n1 Shot Bible / Camera Grammar\n2 Disaster Physics Bible\n3 Panel Handoff Memory\n4 Anchor Object System\n5 Lighting Continuity Bible\n6 Damage Memory / No-Reset Rule\n7 Cinematic Intensity Curve\n8 Motion Budget\n9 First-Frame / Last-Frame Lock\n10 Approved Canon Panel';
}
window.LDContinuityEngine=Object.freeze({
  version:'1.0.0',promptBlock,snapshot,episodeCanonPreview,cameraGrammar,physicsBible,panelHandoff,
  anchorObjectSystem,lightingBible,damageMemory,intensityCurve,motionBudget,frameLock
});
})();
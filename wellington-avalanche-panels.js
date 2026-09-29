/* Wellington Avalanche — Washington, USA — 1910
   Approved P4 master DNA and P4–P14 inheritance rules.
   Approved visual reference: 1000268865.mp4 */
(function(){'use strict';

const VERSION='1.0.3';
const APPROVED_P4_REFERENCE='1000268865.mp4';

function matches(topic){
  const t=String(topic||'').toLowerCase();
  return t.includes('wellington avalanche')&&t.includes('1910');
}
function stageNumber(stage){
  const n=parseInt(String(stage||'').replace(/\D/g,''),10);
  return Number.isFinite(n)?n:0;
}
function activeStage(stage){
  const n=stageNumber(stage);
  return n>=4&&n<=14;
}
const ROLES={
  P4:'snowpack fracture, slab release, rapid fragmentation, and early dense downhill flow only; end before impact',
  P5:'stronger downhill acceleration and growing avalanche mass; build speed and scale without replaying the P4 crown-fracture shot',
  P6:'true primary destructive impact; the moving avalanche reaches the historically appropriate railway/train impact zone with maximum physically coherent force',
  P7:'peak immediate consequences after the primary impact; expand damage and danger without repeating the exact P6 composition',
  P8:'wider consequences and remaining avalanche-related hazard; preserve all irreversible damage already established',
  P9:'immediate aftermath; the avalanche has stopped or passed and the damaged snow-covered impact zone is revealed without a new major release',
  P10:'search and rescue in the unstable aftermath; human-scale purposeful action, persistent damage, and no reset to an intact world',
  P11:'relief, displacement, or urgent short-term human needs after the disaster; restrained action and persistent winter damage',
  P12:'wider transport, infrastructure, access, and community consequences; no new peak-avalanche replay',
  P13:'cleanup, recovery, or stabilization begins slowly; only deliberate work may change the accumulated damage state',
  P14:'reflective recovery and historical legacy; calm closure with the disaster-scarred environment still coherent'
};
function stageRole(stage){return ROLES[stage]||'';}

function narration(topic,stage){
  if(!matches(topic))return '';
  if(stage==='P4')return 'After days of heavy snow and worsening weather, the snowpack destabilized, and a massive slab broke loose above Wellington.';
  if(stage==='P5')return 'The avalanche accelerated down the mountainside, gathering speed and mass as it raced toward the railway area below.';
  if(stage==='P6')return 'The avalanche struck the stranded trains at Wellington, sweeping rail cars from the tracks and down the mountainside.';
  return '';
}

function videoNarrativeContext(topic,stage){
  if(!matches(topic)||!activeStage(stage))return '';
  return 'Narration is handled separately during editing. DO NOT read, speak, whisper, chant, announce, summarize, or vocalize any narration, title, label, instruction, or sentence from this prompt. Generate visuals and permitted environmental sound effects only.';
}

function audioLock(topic,stage){
  if(!matches(topic)||!activeStage(stage))return '';
  const n=stageNumber(stage);
  let allowed='natural winter mountain ambience and physically caused object/environment sounds';
  if(n===4)allowed='natural mountain wind, one deep snow crown-fracture crack, snow friction, dense snow movement, and a low avalanche rumble caused by the visible release';
  else if(n>=5&&n<=8)allowed='natural winter wind, dense avalanche movement, snow friction, physically caused tree/rail/structure impacts only when visible, and low terrain-coupled avalanche rumble';
  else if(n>=9&&n<=14)allowed='quiet winter ambience plus restrained physically visible rescue, cleanup, tool, timber, snow, clothing, footstep, or infrastructure sounds appropriate to the panel';
  return 'ABSOLUTE AUDIO LOCK — WELLINGTON P4–P14 — HIGHEST PRIORITY:\nENVIRONMENTAL / OBJECT SFX ONLY. Allowed: '+allowed+'. NO voice-over. NO narrator. NO spoken words. NO dialogue. NO off-screen speech. NO announcements. NO radio voice. NO whispering. NO chanting. NO singing. NO lyrics. NO human vocalization. NO synthetic voice. NO prompt reading. NO narration reading. NO music. Every audible event must have a visible or environmentally credible cause.';
}
function characterLock(topic,stage){
  if(!matches(topic)||!activeStage(stage))return '';
  const n=stageNumber(stage);
  if(n===4||n===5){
    return 'CHARACTER DIVERSITY + ANTI-CLONE LOCK: ZERO PEOPLE in this shot. No adults, children, silhouettes, distant figures, faces, hands, bodies, bystanders, rescuers, or human-shaped background forms may appear. Because no humans are permitted, do not inject a cast profile, crowd, wardrobe, or facial-animation requirement. Preserve the mountain, snow, trees, railway context when appropriate, and avalanche physics only.';
  }
  if(n>=6&&n<=8){
    return 'CHARACTER DIVERSITY + ANTI-CLONE LOCK: Do NOT force humans into this panel. Show adults only when the panel scene genuinely requires them and their presence is historically and physically plausible. If any adult is visible, keep each person unmistakably hand-drawn 2D anime with one stable identity, front-facing or clean three-quarter face when the face matters, no complex head rotation, no duplicated extras, and no photoreal facial drift.';
  }
  return 'CHARACTER DIVERSITY + ANTI-CLONE LOCK: Use only the small number of adults required by the response, rescue, relief, recovery, or legacy scene. Keep every visible person unmistakably hand-drawn 2D historical anime with distinct face, age, hair, clothing and body proportions. When a face matters, prefer front-facing or clean three-quarter view; avoid back-of-head-to-face morphs and multi-angle head rotations. No cloned extras, duplicate silhouettes, changing identity, photographic skin, or live-action drift.';
}

function chapterDna(topic,stage){
  if(!matches(topic)||!activeStage(stage))return '';
  const role=stageRole(stage);
  const n=stageNumber(stage);
  const snowPhysics=n<=8
    ? 'AVALANCHE MATERIAL DNA: Snow must behave like dense, compressible, granular snow under gravity. Preserve one coherent downhill direction and terrain-following momentum. Large cohesive slab shapes may exist only briefly where physically appropriate, then fragment into irregular snow chunks and dense granular flow. Powder is secondary and restrained; never let it replace the readable dense avalanche body. No glacier-calving look, frozen-lake polygons, concrete plates, hovering chunks, smoke plume, mushroom cloud, or unexplained whiteout.'
    : 'POST-AVALANCHE MATERIAL DNA: Preserve the established snow depth, avalanche-debris texture, deposited snow mass, broken vegetation, railway/infrastructure damage, and terrain geometry. Do not silently reset the landscape to an untouched pre-avalanche state.';
  return 'WELLINGTON CHAPTER MASTER DNA — APPROVED P4 INHERITANCE:\n'
    +'Approved P4 visual reference: '+APPROVED_P4_REFERENCE+'.\n'
    +'RENDERING: serious hand-drawn 2D historical anime / graphic-novel animation in STRICT true black-and-white grayscale. No live action, no photorealistic skin or faces, no 3D CGI-human look, no color, sepia, tint, or selective color.\n'
    +'ENVIRONMENT: preserve one coherent Wellington 1910 winter mountain world: established slope direction, snow-depth family, rugged terrain geometry, conifer scale, railway/mountain infrastructure language when historically appropriate, and consistent lighting/weather unless the story explicitly changes them. Do not clone the exact same background when the panel moves to a new sublocation.\n'
    +snowPhysics+'\n'
    +'CAMERA DNA: one continuous motivated shot; grounded low-to-mid or human-height viewpoints when appropriate, readable foreground/midground/background depth, stable horizon and perspective, no random orbit, drone teleport, zoom pumping, or unexplained viewpoint reset. P4–P5 build force, P6 carries the strongest primary impact, P7–P8 broaden consequences, and P9–P14 progressively calm down.\n'
    +'ANIME FACE STABILITY: When an adult face is important, keep it front-facing or in a clean three-quarter illustrated view for most of the shot. Avoid prolonged full-profile rotation, back-of-head-to-face transformations, or complex multi-angle head turns. Preserve the same drawn eye, nose, jaw, hair, age, clothing, grayscale linework, and cel shading from first to last frame. Never increase photographic facial or skin detail during motion. Do not force a person to stare at the camera when the story action does not require it.\n'
    +'DAMAGE MEMORY: established damage, displaced snow, broken trees, railway damage, buried objects, footprints, debris, and altered terrain persist until a believable cleanup, rescue, relocation, repair, or time jump changes them. No silent repair or pristine reset.\n'
    +'CURRENT PANEL ROLE — '+stage+': '+role+'. Do not advance into a later panel role or replay an earlier panel as the same shot.\n'
    +audioLock(topic,stage);
}

function panel(topic,stage){
  if(!matches(topic))return null;
  if(stage==='P5'){
    return {
      approved:false,
      lockedScene:true,
      scientific:false,
      scene:'Continue outdoors on the same Wellington mountain system established by approved P4. No people are visible. The released avalanche is already moving downslope; do NOT replay the crown fracture or slab breakaway. Show the dense granular snow mass accelerating along the established downhill path, growing wider and heavier as additional loose snow is entrained. Dark conifers and rugged terrain provide scale. The railway corridor may appear far below or in the distance only as destination context, but the avalanche must NOT contact trains, tracks, buildings, bridges or people yet. Keep the dense snow body readable with restrained secondary powder.',
      narrative:'P5 is the acceleration-and-growth bridge between P4 release and P6 railway impact. The avalanche is already in motion, gains speed and mass, and ends before any train or infrastructure contact. Narration is added separately during editing and must never be spoken in the generated video.',
      timing:'0.0–2.0s: Begin with the already-released dense avalanche moving downhill in the same established direction as P4; no new crown fracture and no reset to an intact slope.\n2.0–6.5s: The avalanche accelerates and grows as loose snow is entrained. Dense granular snow remains terrain-coupled; conifers and slope features provide scale.\n6.5–9.0s: Increase speed, width and visual mass while preserving the same downhill path. Keep powder secondary and the dense snow body clearly readable.\n9.0–10.0s: End with the avalanche clearly approaching the lower railway area but BEFORE any contact with trains, tracks, buildings, bridges or people.',
      camera:'One continuous grounded low-to-mid diagonal tracking shot following the avalanche downhill from a safe offset. Preserve the same slope direction and mountain geometry established by P4. Use controlled forward/downhill movement with readable foreground, midground and background depth. No orbit, drone transition, random zoom, teleportation, viewpoint reset or excessive shake.',
      physics:'The avalanche is already fragmented from P4 and must remain a dense, granular, gravity-driven snow flow. It gains speed and mass by entraining loose snow along the path. No new slab-release event, no giant rigid ice plates, no glacier-calving look, no rockslide behavior, no floating chunks, no reverse motion, no explosion, no smoke plume and no early whiteout. Trees react only when physically contacted. The avalanche must NOT hit railway infrastructure in P5.',
      audio:'Natural winter wind, dense snow friction, low terrain-coupled avalanche rumble and physically caused snow/tree contact only. ABSOLUTE NO VOICE-OVER, NO narrator, NO speech, NO dialogue, NO announcements, NO prompt reading and NO music.',
      extraNegative:'NO people. NO human characters. NO bakery. NO kitchen. NO workroom. NO interior scene. NO crown-fracture replay. NO fresh slab breakaway. NO train impact. NO track impact. NO building impact. NO bridge impact. NO settlement destruction. NO modern objects. NO giant ice blocks. NO concrete-like snow plates. NO smoke-like powder. NO giant powder wall. NO explosion. NO fireball. NO floating debris. NO color. NO sepia. NO text. NO subtitles. NO logos. NO watermark. NO gore.'
    };
  }
  if(stage==='P6'){
    return {
      approved:false,
      lockedScene:true,
      scientific:false,
      scene:'At the snow-covered Wellington railway area in 1910, show the stranded period passenger and mail train cars on the mountain track below the established avalanche path. No people are required in frame. The dense granular avalanche arrives from uphill with the same downhill direction and snow material established by P4–P5. The moving snow physically contacts the train cars and railway area, then pushes and displaces cars from the track under overwhelming mass and momentum. Keep the train geometry, wheels, couplers, track alignment, mountain terrain and conifers readable long enough for the impact to be understood. This is the PRIMARY IMPACT panel. Do not substitute roads, homes, a generic village, a bridge-dominant composition or an unrelated settlement.',
      narrative:'P6 is the true primary Wellington railway/train impact. The avalanche reaches the stranded trains and physically displaces rail cars. Narration is added separately during editing and must never be spoken in the generated video.',
      timing:'0.0–2.0s: Establish the stranded period train cars and snow-covered railway zone with the dense avalanche already approaching from the established uphill direction; keep train and track geometry clear.\n2.0–6.5s: The dense terrain-following avalanche makes direct physical contact with the railway/train zone. Snow strikes the cars progressively; wheels, couplers and car bodies react only after contact.\n6.5–9.0s: The snow mass pushes and displaces rail cars from the track area with believable inertia and gravity. Cars may tilt, shift or begin moving downslope only as the avalanche physically forces them.\n9.0–10.0s: End on the strongest readable impact state with displaced rail cars, dense moving snow and damaged railway context still visually coherent. Do not jump ahead to the quiet aftermath or rescue phase.',
      camera:'One continuous grounded low-to-mid three-quarter view along the railway zone, looking partly uphill so the avalanche approach and train impact remain readable in the same shot. Use a restrained forward/lateral tracking move with strong foreground-midground-background depth. No orbit, drone transition, cut, teleport, extreme shake or viewpoint reset.',
      physics:'This is a dense snow-avalanche impact, not an explosion. The avalanche remains terrain-coupled, granular and gravity-driven with secondary restrained powder. Train cars have heavy inertia and move only after direct snow contact. Wheels, bogies, couplers, rails, timber and car bodies keep stable geometry until physically bent, displaced or obscured. No floating cars, instant disappearance, train duplication, spontaneous derailment before contact, giant rigid ice plates, smoke behavior, fireball, blast wave or fantasy force.',
      audio:'Natural winter wind, dense avalanche rumble, snow friction, rail and timber strain, wheel/rail scraping, coupler impacts and physically synchronized train-car movement only. ABSOLUTE NO VOICE-OVER, NO narrator, NO speech, NO dialogue, NO announcements, NO prompt reading and NO music.',
      extraNegative:'NO forced human characters. NO children. NO generic homes or village as the main target. NO road-only impact. NO bridge-dominant composition. NO modern train. NO diesel locomotive. NO automobiles. NO modern rescue equipment. NO explosion. NO fireball. NO smoke-like avalanche. NO giant powder wall hiding the train before contact. NO giant ice blocks. NO concrete-like snow plates. NO floating rail cars. NO train duplication. NO teleporting cars. NO instant disappearance. NO gore. NO color. NO sepia. NO text. NO subtitles. NO logos. NO watermark.'
    };
  }
  if(stage!=='P4')return null;
  return {
    approved:true,
    lockedScene:true,
    approvedLabel:'FINAL APPROVED MASTER — WELLINGTON P4 · REF '+APPROVED_P4_REFERENCE,
    scientific:false,
    scene:'Upper snowy mountainside above Wellington, Washington, in 1910. No people are visible. Begin on one coherent, heavily loaded natural snow slope with dark conifers and rugged terrain providing scale. One long irregular crown fracture opens across the upper snowpack. The broad slab below it releases under gravity, remains cohesive only briefly, then rapidly fragments into irregular compressed snow chunks and a dense granular avalanche that stays close to the terrain. The moving snow gains early downhill momentum but stops this panel before reaching trains, railway structures, buildings, people, or the final impact zone. Keep powder minor and secondary to the clearly visible dense snow body.',
    narrative:'P4 is only the initial snow-slab release and early acceleration. The Living Disaster Book narration is added separately during editing and must never be spoken in the generated video.',
    timing:'0.0–1.5s: Establish the intact heavily loaded slope with natural continuous snow, conifers, and stable mountain geometry.\n1.5–3.0s: ONE long irregular crown fracture opens naturally across the upper snowpack; no spiderweb or polygon-tile cracking.\n3.0–4.5s: One broad cohesive snow slab begins sliding downhill under gravity; its leading edge starts crumbling almost immediately.\n4.5–7.5s: The slab rapidly fragments into irregular soft snow chunks that collide, crumble, and merge into dense granular terrain-following flow.\n7.5–10.0s: The dense avalanche gains early downhill momentum with only a thin restrained veil of fine snow. End before trains, railway structures, buildings, people, or the final impact area are reached.',
    camera:'One continuous low-to-mid diagonal mountain shot with a subtle controlled forward-and-downhill tracking movement after release. Preserve the same slope geometry, downhill direction, conifer scale, and depth throughout. No orbit, drone transition, random zoom, teleportation, abrupt viewpoint reset, or excessive shake.',
    physics:'This is a snow-slab avalanche, not glacier calving, icefall, rockslide, frozen-lake breakup, or concrete-slab collapse. Use one natural crown fracture. The initial slab is soft dense snow and remains cohesive only briefly before progressively fragmenting into irregular compressed snow chunks and dense granular flow. Gravity controls all movement. The main avalanche body remains terrain-coupled and readable. Powder stays secondary and restrained. No giant persistent rigid plates, hovering snow, reverse movement, sideways force without cause, explosion, smoke behavior, or early whiteout.',
    audio:'Natural mountain wind, one deep snow-fracture crack, snow friction, dense snow movement, and a low avalanche rumble caused by the visible release only. ABSOLUTE NO VOICE-OVER, NO narrator, NO speech, NO dialogue, NO prompt reading, and NO music.',
    extraNegative:'NO people. NO human characters. NO train impact. NO train. NO bridge-dominant composition. NO building impact. NO full destruction. NO glacier collapse. NO glacier calving. NO icefall. NO giant ice blocks. NO giant flat slabs persisting after the initial release. NO concrete-like plates. NO polygon snow tiles. NO spiderweb crack network. NO frozen-lake appearance. NO rockslide appearance. NO smoke. NO giant powder cloud. NO white explosion. NO early whiteout. NO floating snow. NO hovering debris. NO random sideways avalanche. NO modern objects. NO color. NO sepia. NO text. NO subtitles. NO logo. NO watermark. NO gore.'
  };
}

window.LDWellingtonAvalanche1910=Object.freeze({
  version:VERSION,
  approvedP4Reference:APPROVED_P4_REFERENCE,
  matches,
  activeStage,
  stageRole,
  narration,
  videoNarrativeContext,
  audioLock,
  characterLock,
  chapterDna,
  panel,
  trialPolicy:'Default to one render per next panel. Use a three-video same-prompt trial only when a panel shows stage-logic, physics, continuity, anime-to-human drift, camera, environment, audio, morphing, or artifact problems; refine until a new master prompt is established.'
});
})();
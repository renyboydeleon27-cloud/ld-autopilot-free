/* Wellington Avalanche — Washington, USA — 1910
   Approved P4 + P12 master DNA and P4–P14 inheritance rules.
   Approved visual references: P4 1000268865.mp4 · P12 1000269411.mp4 */
(function(){'use strict';

const VERSION='1.1.0';
const APPROVED_P4_REFERENCE='1000268865.mp4';
const APPROVED_P12_REFERENCE='1000269411.mp4';

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
  P11:'outdoor displacement and movement away from the buried railway zone; survivors relocate through the snow before organized shelter care begins',
  P12:'temporary shelter, survivor care, warmth, and immediate human relief inside a protected railway refuge; clearly distinct from P13 outdoor debris clearing',
  P13:'cleanup, recovery, or stabilization begins slowly; only deliberate work may change the accumulated damage state',
  P14:'reflective recovery and historical legacy; calm closure with the disaster-scarred environment still coherent'
};
function stageRole(stage){return ROLES[stage]||'';}

const FINAL_NARRATION=Object.freeze({
  HOOK:'',
  P1:'By late February 1910, relentless snow buried Wellington, Washington, while railway workers fought to keep the mountain route open.',
  P2:'Above the town, days of heavy snowfall left the mountain slopes overloaded and increasingly unstable.',
  P3:'As snow continued to build, people watched the mountains anxiously while the stranded trains remained trapped nearby.',
  P4:'Two Great Northern trains, a passenger train and a fast mail train, were stranded near Wellington as crews cleared snow.',
  P5:'On February 28, rain and thunderstorms weakened the snowpack, and a massive slab broke loose on Windy Mountain.',
  P6:'At about 1:42 a.m. on March 1, the avalanche slammed into the stranded trains with overwhelming force.',
  P7:'Rail cars and locomotives were torn from the tracks, hurled downhill, and buried beneath snow and wreckage.',
  P8:'The slide left Wellington isolated, with railway access buried and the mountain route blocked by snow and destruction.',
  P9:'When the avalanche settled, the railway zone had become a field of shattered timber, buried cars, and deep snow.',
  P10:'Wellington residents and railway workers rushed into the wreckage, probing the snow and searching for survivors.',
  P11:'Those pulled free received immediate help and basic supplies while rescue work continued across the snowbound site.',
  P12:'Inside shelter, survivors received warmth, rest, and simple care while the recovery effort continued outside.',
  P13:'For days, crews dug through snow and debris, recovering victims and clearing the devastated railway area.',
  P14:'Ninety-six people died, making Wellington the deadliest avalanche disaster in U.S. history. Great Northern later expanded snow-shed protection.',
  ENDING:'Please like, share, and subscribe for more Living Disaster stories.'
});

function narration(topic,stage){
  if(!matches(topic))return '';
  return Object.prototype.hasOwnProperty.call(FINAL_NARRATION,stage)?FINAL_NARRATION[stage]:'';
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
  if(stage==='P11'){
    return {
      approved:false,
      lockedScene:true,
      scientific:false,
      frameLock:'P11 OUTDOOR DISPLACEMENT LOCK — HIGHEST PRIORITY: Every frame MUST remain hand-drawn 2D historical anime / graphic-novel art in strict true black-and-white grayscale. This panel is OUTDOORS and must be clearly different from P12 interior shelter care. Show displaced adults moving away from the buried railway impact zone through deep snow toward a safer temporary refuge. No aid handoff, no cup, no blanket distribution, no indoor shelter action, no shoveling cleanup and no rescue probing.',
      scene:'Outdoors in the Wellington aftermath, show EXACTLY THREE distinct adult survivors moving carefully through deep deposited snow away from the damaged railway avalanche zone toward a simple temporary refuge visible farther ahead. One adult supports a tired companion by the forearm while the third carries one small period-correct personal bundle. Keep damaged rail timber, partly buried railway context, conifers and heavy avalanche deposits behind them so the displacement reads as a direct consequence of the disaster. The destination shelter remains in the distance or at the edge of frame; do NOT enter it in P11. This panel is about relocation and displacement only. P12 will handle indoor warmth, care and relief.',
      narrative:'P11 shows displaced survivors leaving the buried railway zone and moving through the snow toward safer temporary shelter. No organized indoor relief begins yet. Narration is added separately during editing and must never be spoken in the generated video.',
      timing:'0.0–2.0s: Establish EXACTLY THREE adult survivors outdoors in deep snow with the damaged railway avalanche zone behind them.\n2.0–6.5s: The group moves slowly and carefully toward a safer temporary refuge. One adult supports a tired companion while the third carries one small personal bundle.\n6.5–9.0s: Continue the same displacement movement with stable identities, clothing and environment. Keep the shelter ahead but do not enter it.\n9.0–10.0s: End with the three adults still outdoors, closer to safety, while the damaged snowbound railway area remains visible behind them.',
      camera:'One continuous human-height three-quarter tracking shot moving with or slightly beside the displaced adults. Keep the damaged railway aftermath behind them and the refuge ahead for clear direction of travel. No interior cut, orbit, drone move, back-to-front head reveal, zoom pumping, teleportation or excessive shake.',
      physics:'Walking through deep snow is slow and effortful. Boots compress snow naturally. The supporting arm contact remains stable. The small personal bundle keeps constant size and shape. No object morphing, duplication, pop-in, disappearance, hand penetration or spontaneous repositioning. Deposited snow and damaged railway objects remain fixed unless physically contacted.',
      audio:'Quiet winter wind, footsteps compressing snow, restrained clothing movement and distant timber or railway creaks only. ABSOLUTE NO VOICE-OVER, NO narrator, NO spoken words, NO dialogue, NO calling, NO whispering, NO announcements, NO synthetic voice, NO prompt reading and NO music.',
      extraNegative:'EXACTLY THREE ADULTS ONLY. NO children. NO crowd. NO interior shelter scene. NO hospital. NO relief center interior. NO cup handoff. NO blanket distribution. NO supply-box handoff. NO food distribution. NO rescue probing. NO shoveling cleanup. NO rebuilding. NO new avalanche impact. NO modern rescue equipment. NO live action. NO photorealistic humans. NO photographic skin. NO 3D CGI humans. NO face morphing. NO identity swap. NO duplicate adults. NO color. NO sepia. NO text. NO subtitles. NO logos. NO watermark. NO gore.'
    };
  }
  if(stage==='P12'){
    return {
      approved:true,
      lockedScene:true,
      approvedLabel:'FINAL APPROVED MASTER — WELLINGTON P12 · REF '+APPROVED_P12_REFERENCE,
      scientific:false,
      frameLock:'P12 2D ANIME + SHELTER RELIEF LOCK — HIGHEST PRIORITY: Every frame MUST remain hand-drawn 2D historical anime / graphic-novel art in strict true black-and-white grayscale. Keep adult faces, clothing, hands and body proportions illustrated and stable from first to last frame. This panel is an INTERIOR TEMPORARY SHELTER / PROTECTED RAILWAY REFUGE scene. DELIBERATE CONTINUITY TRANSITION FROM P11: P12 changes location to an already-occupied refuge after displacement. Do NOT inherit any P11 exact-three-person limit, supply box, personal bundle, blanket geometry, outdoor walking action or prior object count as a mandatory P12 lock. Several distinct adult survivors and responders may already be present in the shelter from frame 1; they must not appear, multiply or arrive by morphing during the shot. Carry forward only the Wellington 1910 winter world, strict B/W anime DNA, snowbound aftermath, weather/lighting continuity and persistent disaster damage visible outside. It must remain clearly different from P13, which is outdoor debris clearing. No shoveling is the main action. No live-action or photoreal drift. No visible text anywhere.',
      scene:'Inside a simple temporary railway shelter or protected refuge during the Wellington Avalanche aftermath, show exhausted adult survivors and responders in a serious hand-drawn 2D historical anime scene. One weakened or lightly injured adult sits wrapped in a blanket while a responder provides simple care. Another adult offers a cup or small item of immediate relief, while a few other adults rest quietly in the background. Use a wooden 1910-era shelter interior, period winter clothing, blankets, lanterns, benches and simple historically appropriate objects. Through an open doorway or window, deep snow and winter conditions remain visible outside. The emotional focus is survival, warmth, exhaustion and human support after the avalanche. This is NOT outdoor cleanup and NOT a replay of rescue probing.',
      narrative:'P12 focuses on temporary shelter, survivor care, warmth and immediate human relief after the avalanche. The snowy disaster environment remains visible outside, while P13 will move to outdoor debris clearing. Narration is added separately during editing and must never be spoken in the generated video.',
      timing:'0.0–3.0s: Establish the temporary wooden shelter/refuge with several exhausted adult survivors and responders in period winter clothing. One adult is already seated and wrapped in a blanket while a responder stays nearby.\n3.0–6.5s: The camera moves slowly through the shelter. A responder offers a small cup or simple relief item, and another adult supports or checks a fatigued or lightly injured survivor. Keep all motion restrained and physically believable.\n6.5–10.0s: Settle on a calm human-relief tableau: the seated survivor remains supported, responders stay nearby, and snowy conditions are still visible through the doorway or window. End on quiet survival and support, not cleanup or rebuilding.',
      camera:'One continuous slow human-height interior shot with a restrained forward or lateral move. Keep the scene intimate and readable, with foreground survivor care, midground responders and a glimpse of the snowy exterior for continuity. No cuts, orbit, drone move, random zoom, teleportation, back-of-head-to-face morph or excessive shake.',
      physics:'Human motion is slow and grounded. Blankets, cups, benches, lanterns and clothing keep stable geometry and move only when physically handled. No object morphing, duplication, pop-in, disappearance, hand penetration or spontaneous repositioning. The wooden shelter remains fixed. Snow outside remains consistent with the established aftermath and does not reset to a pristine pre-disaster state.',
      audio:'Quiet winter wind outside, muted interior movement, fabric rustle, soft footsteps, subtle wooden creaks and restrained object-contact sounds only. ABSOLUTE NO VOICE-OVER, NO narrator, NO spoken words, NO dialogue, NO whispering, NO announcements, NO synthetic voice, NO prompt reading and NO music.',
      extraNegative:'NO TEXT OF ANY KIND. NO title. NO location label. NO year. NO captions. NO subtitles. NO readable generated signs. NO shoveling as the main action. NO outdoor debris-clearing focus. NO repeated P13 scene type. NO rescue-probe replay. NO new avalanche impact. NO smoke. NO fog effect. NO live action. NO photorealistic humans. NO photographic skin. NO 3D CGI humans. NO color. NO sepia. NO modern medical equipment. NO modern furniture. NO modern emergency gear. NO morphing. NO duplicate cloned people. NO extra limbs. NO malformed hands. NO gore.'
    };
  }
  if(stage==='P10'){
    return {
      approved:false,
      lockedScene:true,
      scientific:false,
      frameLock:'P10 2D ANIME FRAME LOCK — HIGHEST PRIORITY: Every frame, including the first, middle and final frame, MUST remain visibly hand-drawn 2D historical anime / graphic-novel art in strict true black-and-white grayscale. Every adult must have clear ink contours around face, eyes, nose, jaw, hair, hands, coat folds and boots; simplified illustrated skin planes; deliberate anime facial construction; grayscale cel shading; and painted 2D background layers. NEVER increase photographic facial detail during motion. NEVER render photographic skin pores, live-action lighting on faces, camera-captured humans, realistic photographic eyes, realistic beard stubble, glossy 3D humans, or documentary/newsreel-looking real people. A human that looks real at any frame is a failed render. Keep faces front-facing or clean three-quarter for most of the shot; no back-of-head-to-face turn, no full-profile-to-front morph, no complex head rotation.',
      scene:'Outdoors in the damaged Wellington railway avalanche zone after the main impact, show EXACTLY THREE distinct adult rescuers conducting a careful search across deep deposited snow beside damaged or partly buried railway wreckage. All three adults are clearly hand-drawn 2D historical anime characters in 1910 winter clothing. Keep the lead rescuer in a stable clean three-quarter or near-front view while using a long wooden probe in the snow; the other two adults remain visually distinct and perform restrained purposeful search actions nearby. Preserve buried/displaced rail context, damaged track or railway timber, heavy snow deposits, conifers and the same mountain environment established by P6–P9. This is search/rescue after the avalanche, not a new impact and not cleanup or rebuilding.',
      narrative:'P10 shows human-scale search and rescue in the buried Wellington railway zone after the avalanche. Exactly three adult rescuers perform one coherent search action. The Living Disaster Book narration is added separately during editing and must never be spoken in the generated video.',
      timing:'0.0–2.0s: Establish EXACTLY THREE hand-drawn anime adult rescuers in the damaged outdoor railway avalanche zone. The lead rescuer is already in a stable three-quarter or near-front illustrated view holding a long wooden probe; buried railway wreckage and deep snow are readable behind them.\n2.0–6.5s: The lead rescuer presses the probe carefully into the snow while the other two adults perform restrained coordinated search actions. Faces, clothing, body proportions and linework remain unchanged. No one turns from back-of-head into a front face.\n6.5–9.0s: Continue the same purposeful search with small believable repositioning only. Preserve the deposited snow, damaged track/railway timber and wreckage state; no new avalanche impact and no cleanup transformation.\n9.0–10.0s: End on a readable search tableau with all three adults still unmistakably 2D anime, stable in identity and clothing, surrounded by the same damaged Wellington railway aftermath.',
      camera:'One continuous human-height historical-anime shot with a restrained lateral or slight forward move. Keep the lead rescuer in a clean three-quarter or near-front view for most of the shot, while the other two remain readable without complex head rotation. Use one lens/perspective family and stable horizon. No orbit, no circling behind characters, no back-to-front reveal, no drone move, no random zoom, no teleportation and no excessive shake.',
      physics:'Human motion is slow, deliberate and physically grounded in deep snow. The wooden probe moves only through visible hand/arm action. Boots compress snow naturally. Damaged railway objects and deposited avalanche snow remain fixed unless physically contacted. No new avalanche release, no fresh train impact, no floating debris, no spontaneous object movement, no instant repair and no geometry melt.',
      audio:'Quiet winter wind, snow compression under boots, clothing movement, wooden probe contacting snow or buried debris, and restrained physically caused railway/timber creaks only. ABSOLUTE NO VOICE-OVER, NO narrator, NO spoken words, NO dialogue, NO calling, NO shouting, NO whispering, NO announcements, NO synthetic voice, NO prompt reading and NO music.',
      extraNegative:'EXACTLY THREE ADULT RESCUERS ONLY. NO children. NO crowd. NO extra background people. NO live action. NO photorealistic humans. NO photographic skin. NO realistic camera-captured faces. NO newsreel-looking real people. NO 3D CGI humans. NO face morphing. NO identity swap. NO changing hair. NO changing coat. NO changing body proportions. NO back-of-head-to-face transformation. NO complex head spin. NO full-profile morph. NO duplicated rescuer. NO indoor room. NO kitchen. NO workroom. NO cleanup or rebuilding. NO new avalanche impact. NO explosion. NO smoke. NO modern rescue equipment. NO color. NO sepia. NO text. NO subtitles. NO logos. NO watermark. NO gore.'
    };
  }
  if(stage==='P7'){
    return {
      approved:false,
      lockedScene:true,
      scientific:false,
      scene:'Remain outdoors in the Wellington railway disaster zone immediately after the P6 primary train impact. Show the same physical disaster world from a DISTINCT wider three-quarter viewpoint: displaced and partly buried period rail cars, damaged or obscured track sections, heavy avalanche deposits, broken railway timbers and snow-covered debris spread across the impact path. The main collision has already happened; do NOT replay a fresh train strike. Residual dense snow may still settle or push through gaps around the wreckage, but the visual focus is the expanded immediate consequence of the P6 impact. Keep the mountain slope, conifers, snow material and downhill direction coherent with P4–P6. ZERO PEOPLE in this P7 test shot so the disaster footprint remains the subject. No interior rooms, cabins, kitchens, workrooms or cleanup activity.',
      narrative:'P7 shows the immediate expanded consequences of the P6 railway impact: displaced and partly buried rail cars, damaged track and heavy deposited snow across the same outdoor disaster zone. It is not a second train collision and not yet rescue or cleanup. Narration is added separately during editing and must never be spoken in the generated video.',
      timing:'0.0–2.0s: Establish a wider outdoor view of the already-damaged railway impact zone. Displaced rail cars, heavy avalanche deposits and damaged track context are visible immediately; no fresh impact begins.\n2.0–6.0s: Reveal more of the consequence field with controlled camera movement: partly buried cars, snow-packed track, broken railway timbers and debris. Residual dense snow may continue settling or moving slowly through the wreckage only where physically plausible.\n6.0–9.0s: Broaden the scale of damage without introducing a new avalanche release or a second train strike. Preserve the same car identities, terrain geometry, deposited snow and downhill direction.\n9.0–10.0s: End on a strong readable wide consequence frame. Keep the scene in the immediate impact phase; do NOT transition into rescue, survivors, cleanup, shelter or quiet long-term aftermath.',
      camera:'One continuous wider three-quarter railway-zone shot from a new camera position distinct from P6. Use a restrained lateral or slight forward reveal that exposes the expanded wreckage field while preserving readable foreground, midground and mountain background. No exact P6 camera-axis replay, no orbit, drone transition, cut, teleportation, zoom pumping or excessive shake.',
      physics:'The P6 collision has already occurred. Rail cars remain displaced, tilted or partly buried according to the established damage state and do not reset to intact track positions. Deposited avalanche snow stays dense, granular and terrain-coupled. Any residual movement is slower settling or continued snow pressure around existing wreckage, not a new explosive impact. No spontaneous derailment, floating cars, duplicated cars, geometry melting, instant repair, smoke behavior, giant rigid ice plates or unexplained new destruction.',
      audio:'Natural winter wind, settling snow, low residual avalanche rumble, timber/rail strain and occasional physically caused creaks or debris settling only. ABSOLUTE NO VOICE-OVER, NO narrator, NO speech, NO dialogue, NO announcements, NO prompt reading and NO music.',
      extraNegative:'ZERO PEOPLE. NO adults. NO children. NO silhouettes. NO indoor room. NO cabin interior. NO kitchen. NO bakery. NO workroom. NO cleanup. NO rescue yet. NO fresh train impact. NO second collision. NO intact train reset. NO pristine tracks. NO generic village or homes as the main subject. NO bridge-dominant composition. NO modern train. NO diesel locomotive. NO automobiles. NO modern rescue equipment. NO explosion. NO fireball. NO smoke-like avalanche. NO giant powder wall. NO giant ice blocks. NO concrete-like snow plates. NO floating rail cars. NO train duplication. NO teleporting cars. NO instant repair. NO color. NO sepia. NO text. NO subtitles. NO logos. NO watermark. NO gore.'
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
  approvedP12Reference:APPROVED_P12_REFERENCE,
  finalNarration:FINAL_NARRATION,
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
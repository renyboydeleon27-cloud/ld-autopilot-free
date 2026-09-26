/* LD AUTO v3.40.1 — cinematic consistency + controlled character diversity / anti-clone system. */
(function(){'use strict';
const T2V_POLICY_VERSION='3.40.1-character-diversity-v1';
function supports(card){return /^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage);}
function current(){return document.getElementById('projectTitle').textContent;}
function style(){var locked=window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle;if(locked==='real'||locked==='anime')return locked;var selected=document.getElementById('visualMode')?.value;if(selected==='real'||selected==='anime')return selected;return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?'real':'anime';}
function colorMode(){var locked=window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode;if(locked==='bw'||locked==='color')return locked;return style()==='real'?'bw':'color';}
function format(){return document.getElementById('format').value;}
function state(card){return {mode:card.dataset.videoMode||'image',text:card.dataset.textVideoPrompt||'',scene:card.dataset.videoScene||'',signature:card.dataset.textVideoSignature||''};}
function defaults(topic){var year=(topic.match(/\b(?:1\d{3}|20\d{2}|2100)\b/)||[])[0]||'';return {year:year,location:'',details:''};}
function continuity(){return Object.assign(defaults(current()),window.ldVideoContinuity||{});}
function ready(){var c=continuity();return /^\d{4}$/.test(c.year)&&!!c.location.trim();}
function monochromeRequired(){return colorMode()==='bw';}
function generatedVisualDna(){
 var c=continuity();
 var year=/^\d{4}$/.test(String(c.year||''))?String(c.year):'historical era';
 var location=cleanLocation(c.location)||'the confirmed event location';
 var setting=location+', '+year;
 if(style()==='anime'){
   if(colorMode()==='bw'){
     return 'AUTO VISUAL DNA — MONOCHROME HISTORICAL ANIME: Serious 2D historical anime / graphic-novel visual world for '+setting+' in STRICT true black-and-white grayscale only. ZERO color, ZERO selective color, ZERO sepia, ZERO tint, ZERO muted color accents. Detailed hand-drawn linework, grayscale tonal rendering and ink-like shading. Grounded adult human proportions. Historically accurate clothing, architecture, tools, transport, terrain, vegetation, crops when relevant, utilities and technology. Cinematic historical-documentary composition, natural depth and physically believable disaster motion. Preserve one consistent monochrome anime visual world from HOOK through P14 while allowing each panel its own historically correct sublocation, camera view and action. No live action, no photorealism, no glossy 3D CGI, no chibi, no modern objects outside the era and no embedded text.';
   }
   return 'AUTO VISUAL DNA — HISTORICAL ANIME: Serious 2D historical anime / graphic-novel visual world for '+setting+'. Detailed hand-drawn linework and painted 2D backgrounds, grounded adult human proportions, historically accurate clothing, architecture, tools, transport, terrain, vegetation, crops when relevant, utilities and technology. Cinematic documentary composition, natural depth and physically believable disaster motion. Keep one consistent character-design language, rendering style and chapter visual world from HOOK through P14 while allowing each panel to use its own historically correct sublocation, camera view and action. No live action, no photorealism, no 3D CGI, no glossy render, no chibi, no modern objects outside the era, no embedded text.';
 }
 if(colorMode()==='bw'){
   return 'AUTO VISUAL DNA — REAL HUMAN MONOCHROME: Photorealistic historical live-action documentary world for '+setting+'. STRICT true black-and-white grayscale only. No color, sepia, tint or selective color. Real adult humans with natural anatomy, skin, hair and fabric; historically accurate clothing, architecture, tools, transport, terrain, vegetation, utilities and technology. Cinematic documentary composition, practical lighting, natural depth and physically believable disaster motion. Preserve one consistent monochrome visual world from HOOK through P14 while allowing each panel its own historically correct sublocation, camera view and action. No anime, no illustration, no 3D CGI, no glossy artificial render, no modern objects outside the era, no embedded text.';
 }
 return 'AUTO VISUAL DNA — REAL HUMAN: Photorealistic historical live-action documentary world for '+setting+'. Real adult humans with natural anatomy, skin, hair and fabric; historically accurate clothing, architecture, tools, transport, terrain, vegetation, utilities and technology. Cinematic documentary composition, practical lighting, natural depth and physically believable disaster motion. Keep one consistent chapter visual world from HOOK through P14 while allowing each panel to use its own historically correct sublocation, camera view and action. No anime, no illustration, no 3D CGI, no glossy artificial render, no modern objects outside the era, no embedded text.';
}
function effectiveVisualDna(){
 var c=continuity();
 var base=generatedVisualDna();
 var extra=String(c.details||'').trim();
 return base+(extra?'\nADVANCED VISUAL OVERRIDE: '+extra:'');
}
function refreshAutoDnaUi(root){
 root=root||document.getElementById('chapterVideoContext');
 if(!root)return;
 var field=root.querySelector('.video-auto-dna');
 if(field)field.value=generatedVisualDna();
}
function universalHookDna(){
 if(colorMode()!=='bw')return '';
 if(style()==='anime'){
   return 'UNIVERSAL MONOCHROME ANIME VISUAL DNA — HOOK + P1–P14:\nSTRICT true black-and-white grayscale from frame 1 through frame 10.\nNo color.\nNo sepia.\nNo tint.\nNo selective color.\nSerious 2D historical anime / graphic-novel rendering.\nDetailed hand-drawn linework.\nGrayscale tonal shading and restrained ink-like contrast.\nGrounded realistic adult anatomy.\nHistorically accurate environment and period objects.\nDocumentary-style cinematic staging.\nNo live action.\nNo photorealism.\nNo glossy 3D CGI.\nNo chibi.\nBLACK-AND-WHITE PRIORITY: every visible element must remain true grayscale for the entire shot. If an inherited instruction conflicts with this rule, the monochrome rule wins.';
 }
 return 'UNIVERSAL MONOCHROME REAL-HUMAN VISUAL DNA — HOOK + P1–P14:\nSTRICT true black-and-white grayscale.\nNo color.\nNo sepia.\nNo tint.\nNo selective color.\nPhotorealistic historical live-action.\nArchival documentary / newsreel capture.\nSoft optical detail.\nOrganic film grain.\nSlight gate weave.\nRestrained exposure flicker.\nSame visual world as the approved HOOK for the current episode.\nBLACK-AND-WHITE PRIORITY: The entire 10-second shot must remain true grayscale from start to finish. No colorization or color returning in skin, clothing, sky, water, vegetation, fire, lightning, debris or any other visible element. If any inherited instruction conflicts with this monochrome rule, ignore that conflicting color instruction.';
}
function cleanLocation(value){
 var s=String(value||'').trim();
 s=s.replace(/\bYEAR\s*:\s*\d{4}\b/gi,'').replace(/\bLOCATION\s*:\s*/gi,'').replace(/^[\s,;:\-]+|[\s,;:\-]+$/g,'').replace(/\s{2,}/g,' ');
 return s;
}
function textOnlyAccuracyLock(){
 var mode=window.LDProjectLocks?.videoMode?.()||window.ldProjectLocks?.videoMode||'';
 if(mode!=='text')return '';
 return 'TEXT-ONLY ACCURACY LOCK:\nThis production does not rely on an image or photo reference. Visual accuracy must come from the locked event year, location, approved narration facts, disaster-family progression, event-specific panel locks and the current panel role.\nClothing, architecture, streets, homes, tools, transport, crops, terrain, vegetation, utilities, signs, infrastructure and technology must remain historically appropriate to the event year and location.\nNever invent a specific historical fact merely to make the scene more dramatic. Never introduce a later disaster stage early. Do not copy visual geography, people or event-specific facts from another production.';
}
function lock(){
 var c=continuity();
 var location=cleanLocation(c.location)||'UNCONFIRMED — specify the chapter location';
 return 'CHAPTER CONTINUITY LOCK:\nEvent: '+current()+'.\nEvent year: '+(c.year||'UNCONFIRMED')+'.\nMain location: '+location+'.\n'+effectiveVisualDna()+'\nThe auto visual DNA controls the shared chapter rendering language and is generated from Visual Style + Color Treatment + event year + main location. Clothing, architecture, crops, terrain, transport, utilities, tools and technology must match this event and location. Use the same chapter visual world from HOOK through P14, with distinct sublocations and camera views. P1 returns to normal life before the event; later panels follow their own historical time and narrative beat. Recovery or wider-impact panels may change date or location only when explicitly established by that panel. Never carry peak destruction into a pre-disaster scene. Keep recurring adult appearance and wardrobe consistent when adults are present. No invented historical facts.'+(textOnlyAccuracyLock()?'\n'+textOnlyAccuracyLock():'')+'\nEND CHAPTER CONTINUITY LOCK.';
}
function stripLock(s){return String(s||'').replace(/\s*CHAPTER CONTINUITY LOCK:[\s\S]*?END CHAPTER CONTINUITY LOCK\./g,'').trim();}
function stripColorConflicts(prompt){
 var s=String(prompt||'');
 if(monochromeRequired()){
   s=s.replace(/Natural color and believable lighting\.?/gi,'STRICT BLACK-AND-WHITE grayscale only.')
      .replace(/\bnatural color\b/gi,'black-and-white grayscale')
      .replace(/\bfull color\b/gi,'black-and-white grayscale')
      .replace(/\bcolored\b/gi,'monochrome')
      .replace(/\bcolorized\b/gi,'monochrome')
      .replace(/\bsepia\b/gi,'black-and-white grayscale')
      .replace(/\btinted\b/gi,'black-and-white grayscale')
      .replace(/\bselective color\b/gi,'black-and-white grayscale');
 }
 return s;
}
function absoluteStyleLock(){
 if(style()==='anime'){
   return colorMode()==='bw'
     ? 'ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: 2D HISTORICAL ANIME ONLY. Render every frame as hand-drawn 2D historical anime / graphic-novel animation in strict true black-and-white grayscale. NEVER render live-action footage, photorealistic people, photographic skin, camera-captured humans, 3D CGI humans, or a documentary/newsreel photographic look. Documentary language elsewhere refers only to composition and historical seriousness, NOT to live-action rendering. If any other wording conflicts, THIS 2D ANIME LOCK WINS.'
     : 'ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: 2D HISTORICAL ANIME ONLY. Render every frame as hand-drawn 2D historical anime / graphic-novel animation. NEVER render live-action footage, photorealistic people, photographic skin, camera-captured humans, or 3D CGI humans. Documentary language elsewhere refers only to composition and historical seriousness, NOT to live-action rendering. If any other wording conflicts, THIS 2D ANIME LOCK WINS.';
 }
 return colorMode()==='bw'
   ? 'ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: PHOTOREALISTIC REAL HUMAN LIVE ACTION ONLY in strict true black-and-white grayscale. No anime, no illustration, no graphic-novel rendering, no 3D CGI people. If any other wording conflicts, THIS REAL-HUMAN LOCK WINS.'
   : 'ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: PHOTOREALISTIC REAL HUMAN LIVE ACTION ONLY. No anime, no illustration, no graphic-novel rendering, no 3D CGI people. If any other wording conflicts, THIS REAL-HUMAN LOCK WINS.';
}
function sanitizeSceneForStyle(value){
 var s=String(value||'').trim();
 if(style()==='anime'){
   s=s.replace(/\bphotorealistic\s+(?:real\s+human\s+)?(?:historical\s+)?live[- ]action\b/gi,'2D historical anime')
      .replace(/\bphotorealistic\s+real\s+human\b/gi,'2D historical anime')
      .replace(/\breal[- ]human\s+live[- ]action\b/gi,'2D historical anime');
 }else{
   s=s.replace(/\bserious\s+2D\s+historical\s+(?:graphic[- ]novel\/)?anime(?:\s+animation)?\b/gi,'photorealistic historical live action')
      .replace(/\b2D\s+historical\s+anime(?:\s*\/\s*graphic[- ]novel)?\b/gi,'photorealistic historical live action');
 }
 return cleanSceneText(s);
}
function promptStyleCompatible(text){
 var s=String(text||'');
 if(style()==='anime'){
   var affirmative=/ABSOLUTE RENDERING MODE[^\n]*2D HISTORICAL ANIME ONLY/i.test(s)
     && /(?:2D historical anime|graphic[- ]novel\/anime animation|hand-drawn 2D historical anime)/i.test(s);
   var opposite=/(?:^|\n)\s*(?:PHOTOREALISTIC\s+REAL\s+HUMAN|PHOTOREALISTIC\s+LIVE[- ]ACTION|Photorealistic historical live[- ]action)/im.test(s);
   return affirmative&&!opposite;
 }
 var affirmativeReal=/ABSOLUTE RENDERING MODE[^\n]*PHOTOREALISTIC REAL HUMAN LIVE ACTION ONLY/i.test(s)
   && /Photorealistic REAL HUMAN historical documentary recreation|PHOTOREALISTIC REAL HUMAN LIVE ACTION ONLY/i.test(s);
 var oppositeAnime=/(?:^|\n)\s*(?:Serious 2D historical graphic[- ]novel\/anime animation|AUTO VISUAL DNA — MONOCHROME HISTORICAL ANIME)/im.test(s);
 return affirmativeReal&&!oppositeAnime;
}
function withLock(prompt){
 var base=stripColorConflicts(stripLock(prompt));
 if(!ready())return base;
 return absoluteStyleLock()+'\n\n'+base+'\n\n'+(universalHookDna()?universalHookDna()+'\n\n':'')+lock();
}
function sceneFrom(card){var existing=state(card).scene;if(existing)return existing;
var image=card.querySelector('.image-prompt').value||'';
image=image.replace(/ERA-AWARE CAPTURE LOCK:[\s\S]*?END ERA LOCK\.?/gi,'');
// The opening scene description precedes the renderer/style locks in existing packs.
image=image.split(/Serious colored|Cinematic historical live-action realism|COMPOSITION LOCK:|SCENE VARIETY LOCK:/i)[0];
image=image.replace(/^Create\s+(?:the Living Disaster Book\s+)?(?:P\d+)\s+(?:illustration|live-action historical frame)\s+for\s+[^.]*\./i,'').replace(/\b(?:portrait 9:16|landscape 16:9)\.?/gi,'').trim();
return cleanSceneText(image||card.querySelector('.narration').value.trim());}
function cleanSceneText(value){
 var s=String(value||'').trim();
 s=s.replace(/\.\s*\.+/g,'.').replace(/\s{2,}/g,' ');
 var m=s.match(/^Scene role:\s*[^.]+\.\s*Visual beat:\s*([\s\S]+)$/i);
 if(m)s=m[1].trim();
 return s.replace(/\.\s*\.$/,'.').trim();
}
function scientificScene(card,scene){
 var source=(String(scene||'')+' '+String(card.querySelector('.narration')?.value||'')).toLowerCase();
 return /scientific cutaway|documentary cutaway|geological|tectonic stress|beneath the seafloor|below the seafloor|deep beneath|plate boundary|fault beneath|underground cross-section|magma chamber|subsurface/.test(source);
}
function isLituya1958(){
 var t=String(current()||'').toLowerCase();
 return t.includes('lituya bay')&&t.includes('1958');
}
function lituyaCause(stage){
 if(!isLituya1958())return null;
 var map={
  P1:{
   approved:true,
   approvedLabel:'FINAL APPROVED — LITUYA P1',
   scientific:false,
   scene:'Calm normal life at remote Lituya Bay, Alaska, in 1958 before any visible sign of disaster. Show the back or three-quarter back of one elderly adult man outside a modest period-appropriate wooden cabin near the bay, quietly tending or standing beside neatly arranged clay flower pots. The bay and steep mountains sit peacefully in the background. Everything is stable and ordinary: no earthquake shaking, no falling objects, no rockslide, no unusual water motion, no tsunami, no panic, and no destruction. Preserve the same elderly man, cabin, flower-pot language, remote shoreline world, and strict black-and-white archival DNA established by the approved HOOK, but return the story to calm pre-disaster life.',
   narrative:'Life at remote Lituya Bay appears calm and ordinary before the earthquake begins.',
   timing:'0.0–2.0s: Establish the quiet 1958 cabin-side setting, elderly man, flower pots, calm bay, and mountains. Nothing dangerous happens.\n2.0–7.0s: Sustain natural ordinary-life motion only: restrained body movement, faint clothing movement, gentle environmental motion, and calm water.\n7.0–10.0s: Hold the peaceful pre-disaster composition and end with no warning event yet, preserving a clear contrast with the coming earthquake.',
   camera:'One restrained historical documentary shot with a very subtle slow push or stable observational framing. Keep the elderly man, cabin-side flower pots, bay, and mountains readable together. No cuts, no transitions, no orbit, no time-lapse, and no disaster-camera behavior.',
   physics:'This is the normal-world panel. All objects remain stable and gravity behaves normally. No tremor, no falling flower pot, no cracks, no slope movement, no sudden water rise, and no invented precursor. Preserve plausible 1958 objects, clothing, terrain, and natural motion.',
   audio:'Quiet natural bay ambience, light wind, faint water, subtle cabin-side environmental sounds only. No earthquake rumble, no voiceover, and no music.',
   extraNegative:'No earthquake yet. No shaking. No falling flower pot. No rockslide. No tsunami. No abnormal water. No destruction. No panic. No modern objects. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark, or any on-screen text.'
  },
  P2:{
   approved:true,
   approvedLabel:'FINAL APPROVED — LITUYA P2',
   scientific:true,
   scene:'A restrained scientific documentary cutaway of the Fairweather Fault zone beneath the region near Lituya Bay. Show tectonic stress building along the fault just before and at the beginning of rupture. Massive rock layers are under extreme pressure. The strata strain, subtly deform, and begin to shift mainly in a horizontal shearing motion. The geological force must feel powerful but controlled and believable. The rock layers remain largely intact. This panel explains the hidden earthquake source only. Do not create a giant open chasm, collapsing trench, cave-in, large rock blocks falling into a void, seabed collapse, underwater landslide, mountain rockslide, or tsunami.',
   narrative:'Tectonic stress along the Fairweather Fault reaches a critical point, and the earthquake rupture begins beneath the region near Lituya Bay.',
   timing:'0.0–2.0s: Establish the geological setting clearly. Show layered rock under pressure in a serious documentary cutaway style. Subtle motion begins within the first half-second.\n2.0–7.0s: Show restrained fault strain and the beginning of rupture through realistic horizontal shearing, tension, and slight structural offset. Keep the motion grounded and believable.\n7.0–10.0s: Sustain the unstable buildup and finish on a clear image of mounting tectonic force and active rupture, without jumping ahead to the mountainside rockslide or tsunami.',
   camera:'A slow lateral track revealing the geological scene depth. Fixed focal length, natural depth and occlusion. Never pass through solid objects unnaturally. No cuts, no transitions, no orbit, no time-lapse. Keep the shot serious, readable, and documentary-like.',
   physics:'This panel is an explanatory scientific visualization. Do not depict invisible subsurface processes as ordinary eyewitness footage. Keep the mechanism restrained, physically plausible, and geologically grounded. Show primarily horizontal fault displacement. No fantasy energy, no glowing cracks, no sci-fi light effects, no exaggerated destruction, and no impossible motion.',
   audio:'Low deep-earth rumble, restrained rock strain, subtle subsurface vibration, and natural documentary ambience only. No voiceover. No music.',
   extraNegative:'No human figures. No seabed cave-in. No underwater landslide. No giant underground collapse. No giant open trench. No dramatic vertical pit opening. No falling rock blocks into a void. No mountain collapse yet. No visible tsunami yet. No fantasy glowing cracks. No sci-fi visuals. ABSOLUTE NO-TEXT: no labels, geological names, year, captions, titles, typography, logos, watermark, or any on-screen text.'
  },
  P3:{
   approved:true,
   approvedLabel:'FINAL APPROVED — LITUYA P3',
   scientific:false,
   scene:'The earthquake reaches the Lituya Bay region. Show a remote shoreline area near the bay with steep mountain walls in the background, dense forest, rough natural terrain, and a few period-appropriate details such as a small wooden structure, dock elements, moored boat, or simple outdoor equipment. Strong seismic shaking is already underway. Trees shudder, loose rock shifts, the ground trembles, and the environment reacts violently but realistically. If adult people are present, keep them few in number and show them reacting naturally to the shaking. This panel must clearly communicate that the earthquake is striking the region, but the catastrophic mountainside rockslide has not happened yet and the tsunami is not visible yet.',
   narrative:'Strong earthquake shaking strikes the Lituya Bay region and destabilizes the steep terrain around the head of the bay.',
   timing:'0.0–2.0s: Establish the shoreline or bay-side setting clearly. The earthquake shaking is already active within the first half-second.\n2.0–7.0s: Sustain strong realistic seismic motion across the environment. Trees, loose rock, small structures, shoreline details, and any visible boats or equipment react naturally to the shaking.\n7.0–10.0s: Maintain the dangerous shaking and end on a clear sense that the landscape is being destabilized, without jumping ahead to the full mountainside rockslide or tsunami.',
   camera:'A restrained handheld-feeling documentary shot or a grounded lateral/forward observational move is allowed, but keep it readable and realistic. Fixed focal behavior, natural depth and occlusion. Never pass through solid objects. No cuts, no transitions, no orbit, no time-lapse. The camera may react subtly to the shaking, but do not make it chaotic or unreadable.',
   physics:'This panel shows the real earthquake impact on the visible environment. Keep all motion physically plausible and historically grounded. Structures, trees, rocks, shoreline, and water must respond with believable seismic behavior. Do not exaggerate into fantasy destruction. Do not show the major mountainside collapse yet. Do not show the tsunami yet.',
   audio:'Earthquake rumble, wood creaking, rock shifting, tree movement, light shoreline water disturbance, and natural environment SFX only. No voiceover. No music.',
   extraNegative:'No duplicated people. No distorted anatomy. No morphing. No unrelated disaster. No modern objects. No modern vehicles. No fantasy destruction. No mountain rockslide yet. No massive slope collapse yet. No visible tsunami yet. No seabed collapse as wave source. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark, or any on-screen text.'
  },
  P4:{
   approved:true,
   approvedLabel:'FINAL APPROVED — LITUYA P4',
   scientific:false,
   scene:'At the head of Lituya Bay, the steep mountainside is beginning to fail under violent earthquake shaking. Show rugged near-vertical terrain with exposed rock, broken slope surfaces, scattered vegetation, and trees clinging to the slope. Cracks widen through rock and surface material. Loose boulders, smaller rocks, soil, and trees begin shifting downslope. Parts of the slope buckle and break free, but the main catastrophic rockslide has not yet fully plunged into the water. This is the final unstable moment before the giant mountainside collapse.',
   narrative:'The earthquake destabilizes the steep mountainside at the head of Lituya Bay, pushing the slope toward catastrophic collapse.',
   timing:'0.0–2.0s: Establish the steep mountainside clearly. Instability is visible within the first half-second through shaking rock, widening cracks, and shifting surface material.\n2.0–7.0s: Sustain the slope-failure buildup. More fractures open, loose material slides, trees lean or break free, and the mountainside grows visibly more unstable.\n7.0–10.0s: Intensify the imminent-collapse feeling and end with the slope about to give way completely, without yet showing the full rockslide plunging into the water.',
   camera:'A grounded observational documentary shot with a restrained lateral track or restrained push-in. Keep the mountainside readable and imposing. Fixed focal behavior, natural depth and occlusion. Never pass through solid objects. No cuts, no transitions, no orbit, no time-lapse. Subtle earthquake camera reaction is allowed, but the frame must remain readable.',
   physics:'This panel shows real slope destabilization caused by earthquake shaking. Rocks, trees, soil, and debris must move with believable gravity and seismic cause-and-effect. Do not exaggerate into fantasy destruction. Do not show the full rockslide entering the water yet. Do not show the tsunami yet.',
   audio:'Earthquake rumble, cracking rock, falling stones, shifting debris, snapping roots or trees under strain, dust movement, and natural mountain ambience only. No voiceover. No music.',
   extraNegative:'No seabed collapse. No underwater landslide. No full rockslide impact into the bay yet. No visible tsunami yet. No wave generation yet. No fantasy destruction. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark, or any on-screen text.'
  },
  P5:{
   scientific:false,
   scene:'A massive rockslide breaks loose from the steep mountainside at the head of Lituya Bay and plunges downslope into Gilbert Inlet. Show an enormous mass of rock and debris accelerating under gravity and entering the water with violent impact. The source of the coming megatsunami must clearly be the mountain rockslide entering the bay.',
   narrative:'A massive earthquake-triggered rockslide plunges from the mountainside into the water at the head of Lituya Bay.',
   extraNegative:'Do not imply that a seabed collapse or underwater landslide is the primary wave source. No fantasy wave behavior.'
  },
  P6:{
   scientific:false,
   scene:'Immediately after the mountain rockslide slams into Gilbert Inlet, the displaced water erupts outward with tremendous force. Show the bay water being driven upward and across the inlet by the rockslide impact, beginning the megatsunami surge. Keep the rockslide-water impact relationship visually unmistakable.',
   narrative:'The rockslide impact violently displaces the water, generating the megatsunami.',
   extraNegative:'Do not show an unrelated offshore tsunami source. No seabed cave-in as the cause. Keep the wave generation tied directly to the rockslide impact.'
  }
 };
 return map[stage]||null;
}
function isRockyMountainLocust1874(){
 var t=String(current()||'').toLowerCase();
 return t.includes('rocky mountain locust')&&t.includes('1874');
}
function rockyMountainLocustPanel(stage){
 if(!isRockyMountainLocust1874()||!/^P[1-9]$/.test(stage))return null;
 var map={
  P1:{
   approved:false,
   scientific:false,
   scene:'A calm ordinary farming day across the Great Plains, USA, in 1874, before the Rocky Mountain locust outbreak becomes visibly threatening. Adult frontier farmers work healthy crop fields using period-accurate hand tools while a horse-drawn wagon, simple wooden farmhouse, barn, fences and broad prairie farmland establish the historical setting. Crops are still healthy and intact. The farmers behave normally and show no panic. There must be ZERO visible locusts or other visible swarming insects anywhere in the frame at any time. No insects in the air, on crops, on soil, near the camera, or in the distance. No visible swarm, no crop destruction and no unusual darkening of the sky. Establish a completely calm pre-disaster world before the locust plague becomes visible at all.',
   narrative:'Adult frontier farmers work healthy Great Plains fields during an ordinary day in 1874, before the locust swarm becomes visibly threatening.',
   timing:'0.0–2.0s: Establish a peaceful 1874 Great Plains farm with healthy crops, adult farmers, period hand tools, and a horse-drawn wagon or nearby wooden farm structures. No disaster is visible.\\n2.0–7.0s: Continue normal farm work with restrained natural movement in clothing, crops, horses and prairie vegetation. Keep the fields healthy and the atmosphere calm.\\n7.0–10.0s: Hold the peaceful pre-disaster world with ZERO visible locusts or swarming insects. Keep the sky clear, crops healthy, and the farm completely normal through the final frame.',
   camera:'One restrained cinematic documentary shot with a gentle forward track or slow lateral drift. Keep foreground crops, working adults and the wider prairie farm readable together. Let the active Visual Mode control whether the rendering is Historical Anime or Real Human. No cuts, transitions, orbit, time-lapse or disaster-camera behavior.',
   physics:'This is the calm-before-disaster panel. Crops remain healthy, farm objects remain stable, adults continue ordinary work, and horses and vegetation move naturally. ZERO visible locusts or swarming insects are allowed in this panel. No insect buildup, no sudden swarm formation, no instant crop loss, no impossible insect growth, no panic and no destruction.',
   audio:'Quiet prairie ambience, light wind through crops, subtle farm-tool sounds, distant horse or wagon movement and natural rural environment SFX only. No voiceover, no dialogue and no music.',
   extraNegative:'No visible locusts at any time. No insects in the air, on crops, on soil, near the camera, or in the distance. No swarm. No distant insect cloud. No dense insects. No sky darkening. No crop destruction. No stripped vegetation. No panic. No giant insects. No modern machinery. No children. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark or any on-screen text.'
  },
  P2:{
   approved:false,
   scientific:false,
   scene:'Across the Great Plains, USA, in 1874, favorable seasonal conditions have produced an unusually dense early buildup of Rocky Mountain locusts in open prairie breeding ground near farmland. Keep the visual emphasis low to the ground: normal-sized locusts crawl and hop across bare soil, prairie grass and low plants in clearly abnormal numbers, with only a few lifting into short flights. Nearby crop fields remain mostly intact, the sky stays broad and largely clear, and no adults are yet stopping to react. This panel is the biological buildup before P3 human realization and before any sky-filling swarm.',
   narrative:'Favorable seasonal conditions allow Rocky Mountain locust populations to build rapidly across the Great Plains before the full plague forms.',
   timing:'0.0–2.0s: Establish open 1874 prairie breeding ground near farmland, with healthy vegetation and a visibly unusual number of locusts already present on soil and low plants.\\n2.0–7.0s: Show the early buildup continuing as more small locusts crawl, hop and lift briefly into loose clusters across the ground and vegetation. Keep nearby crops mostly intact and the sky largely clear.\\n7.0–10.0s: End on a clearly abnormal but still early-stage concentration of locusts, creating ominous escalation without becoming a full sky-darkening swarm.',
   camera:'A low restrained lateral track across foreground soil and prairie vegetation, close enough to read many separate locusts while keeping intact farmland visible in the background. Keep the horizon and sky open so the panel cannot be mistaken for the later airborne swarm. No cuts, transitions, orbit or time-lapse.',
   physics:'This is an early population-buildup panel, not an instant plague. Locusts remain normal-sized and move through plausible crawling, hopping and short flight. Do not depict magical reproduction, instant multiplication, sudden crop death or impossible insect density. Crops remain mostly intact.',
   audio:'Prairie wind, dry grass movement, subtle natural insect activity and distant farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No full locust cloud. No blackened sky. No total crop destruction. No stripped fields. No panic crowd. No giant insects. No impossible instant multiplication. No modern machinery. No children. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark or any on-screen text.'
  },
  P3:{
   approved:false,
   scientific:false,
   scene:'Across the Great Plains, USA, in 1874, adult farmers or frontier scouts clearly notice a rapidly growing concentration of Rocky Mountain locusts gathering across prairie vegetation, fence lines and open ground near farmland. Show large numbers of locusts clinging to grasses, low plants and patches of soil while more insects rise in loose moving clusters above the land. The buildup should now feel serious and alarming, with adults stopping their work to look across the fields and open prairie in concern. However, this is still not yet the full sky-darkening plague. Most crops remain standing, and the swarm is gathering visibly rather than completely overwhelming the landscape. The scene should communicate a clear early realization that a major locust disaster is approaching.',
   narrative:'Farmers and scouts begin to realize that rapidly growing Rocky Mountain locust gatherings are forming across the Great Plains and may become a major disaster.',
   timing:'0.0–2.0s: Begin with adult farmers or frontier scouts already noticing dense locust concentrations on nearby grasses, fence lines and open ground. Their attention shifts toward the growing insect activity.\\n2.0–7.0s: More locusts rise into loose moving clusters above the prairie while adults stop work and watch with visible concern. Keep most crops standing and avoid full landscape overwhelm.\\n7.0–10.0s: Build a strong sense of approaching danger as the gathering becomes larger and more organized, but stop before the sky is darkened or the fields are completely invaded.',
   camera:'A restrained push-in toward the concerned adults and the visibly gathering locust concentrations, preserving readable foreground vegetation, midground people and open prairie depth. No cuts, transitions, orbit or time-lapse.',
   physics:'Locust density is clearly higher than P2, but movement remains physically plausible and insects remain normal-sized. The gathering forms through many individual insects crawling, hopping and taking short flight; do not show instant materialization or impossible multiplication. Most crops remain standing and largely intact.',
   audio:'Growing natural insect wing and movement sounds mixed with prairie wind, light farm ambience and subtle human movement only. No voiceover, dialogue or music.',
   extraNegative:'No full sky-darkening plague yet. No complete crop stripping. No total field destruction. No giant insects. No magical insect appearance. No panic stampede. No modern objects. No children. ABSOLUTE NO-TEXT: no labels, location names, year, captions, titles, typography, logos, watermark or any on-screen text.'
  },
  P4:{
   approved:false,
   scientific:false,
   scene:'Across intact 1874 Great Plains farmland, an airborne front of Rocky Mountain locusts is now visibly advancing from the open prairie toward productive crop fields. Adult farmers stand near a fence line or field edge and look toward the incoming movement while thousands of separate normal-sized insects cross the air at layered depths. The main story beat is movement toward the crops, not feeding yet: foreground plants remain standing and largely undamaged. The swarm can occupy a large part of the sky, but individual insects must remain readable and the mass must never resemble smoke, fog, dust or a solid black cloud.',
   narrative:'Dense airborne swarms begin moving toward productive farmland across the Great Plains.',
   timing:'0.0–2.0s: Establish intact crops and adults at the field edge as the incoming swarm becomes clearly visible over the prairie.\n2.0–7.0s: The airborne front moves steadily closer in layered depth while adults watch and react with concern; crops remain mostly untouched.\n7.0–10.0s: End with the swarm reaching the immediate edge of the farmland, stopping before widespread feeding damage begins.',
   camera:'A restrained forward track from the field edge toward the approaching airborne swarm, keeping intact crops in the foreground and the moving insect front readable in depth. No cuts, orbit, time-lapse or sudden disaster zoom.',
   physics:'The swarm advances through the sustained flight of many separate normal-sized locusts. No instant appearance, teleporting, impossible density jump or smoke-like merging. Wind and crop movement remain natural and feeding damage has not yet become the focal action.',
   audio:'Growing natural wing activity, prairie wind, crop movement and restrained farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No major feeding damage yet. No stripped field. No total crop loss. No smoke-like swarm. No fog, ash, dust cloud or solid black mass. No giant insects. No modern objects. No children.'
  },
  P5:{
   approved:false,
   scientific:false,
   scene:'The Rocky Mountain locust swarm reaches productive Great Plains crops in 1874 and the first unmistakable feeding damage becomes visible. Normal-sized locusts land on corn, grain or other field plants, cling to leaves and stalks, and actively chew vegetation while adult farmers remain nearby watching the attack unfold. Keep most plants still standing so this reads as first crop contact rather than the later peak devastation. The action must be clearly different from P4: the swarm is no longer only approaching; insects are now physically on the crops and eating them.',
   narrative:'The swarm reaches crops and feeding damage becomes visible across fields.',
   timing:'0.0–2.0s: Begin with locusts already landing on standing crop plants while adults notice the first visible feeding damage.\n2.0–7.0s: Show separate insects clinging, crawling and feeding on leaves and stalks as localized damage increases naturally.\n7.0–10.0s: End with clearly damaged but still standing crops, setting up the much denser peak infestation of P6.',
   camera:'A restrained side track through standing crop rows that keeps feeding insects in the foreground and adult farmers readable in the midground. No cuts, orbit or time-lapse.',
   physics:'Locusts remain normal-sized and physically separate. Leaves and plant edges show progressive local feeding damage rather than instant disappearance. No magical multiplication or immediate total field stripping.',
   audio:'Natural insect wing and feeding movement, rustling crops, prairie wind and subdued farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No completely bare field yet. No smoke-like swarm. No giant insects. No instant crop disappearance. No modern machinery. No children.'
  },
  P6:{
   approved:false,
   scientific:false,
   scene:'At peak infestation across an 1874 Great Plains field, enormous numbers of Rocky Mountain locusts fill the air and cover standing vegetation while active feeding strips leaves from crops. Parts of the sky may look darker because of the sheer number of separate insects, but the swarm must remain visibly composed of individual locusts at multiple depths and never resemble smoke, storm cloud, fog, soot or ash. Adult farmers may appear small within the scene to communicate scale, but the visual emphasis is the overwhelming density and active crop attack.',
   narrative:'At peak infestation, huge numbers of insects cover plants and darken parts of the sky.',
   timing:'0.0–2.0s: Open inside a visibly dense but still physically readable swarm over standing crops.\n2.0–7.0s: Sustain intense flight and feeding as insects cover vegetation and leaves are progressively stripped.\n7.0–10.0s: Hold the overwhelming peak density and severe crop attack without jumping ahead to the post-swarm aftermath.',
   camera:'A wide restrained push through the crop rows with strong depth layers: insects near camera, damaged vegetation midground and adults or farm structures small in the distance. No cuts, orbit or time-lapse.',
   physics:'The density comes from many separate normal-sized insects. Crop loss progresses through feeding; plants do not vanish instantly. No solid swarm mass, giant insects, magical multiplication or impossible scale.',
   audio:'Dense natural wing activity, crop rustle, prairie wind and restrained environmental movement only. No voiceover, dialogue or music.',
   extraNegative:'No black smoke effect. No dust-cloud swarm. No fog-like insects. No giant locusts. No instant total crop disappearance. No modern objects. No children.'
  },
  P7:{
   approved:false,
   scientific:false,
   scene:'Across several neighboring Great Plains farm plots in 1874, crop losses are now visibly widespread. Show damaged rows, partly stripped plants and adults moving through the affected farmland while a reduced but still active number of locusts remains in the air and on vegetation. The visual emphasis is no longer the spectacle of the densest swarm; it is the spread of agricultural damage across more than one field or farm area. Keep some standing vegetation so P9 can later show the much barer post-swarm result.',
   narrative:'Crop losses spread as multiple farms and communities face the same outbreak.',
   timing:'0.0–2.0s: Establish more than one damaged field or farm area in the same wider landscape.\n2.0–7.0s: Adults move through damaged rows while remaining locust activity continues at a lower visual priority than the crop loss.\n7.0–10.0s: End on a wider view that makes the spread of agricultural damage unmistakable.',
   camera:'A measured lateral documentary move that reveals one damaged field, then a neighboring affected plot or farm structure in the same continuous shot. No cuts, orbit or time-lapse.',
   physics:'Damage is cumulative and already present across multiple fields. Remaining insects move naturally. Do not restore crops, instantly destroy new fields, or make the swarm denser than the P6 peak.',
   audio:'Prairie wind, dry crop movement, lighter insect activity, footsteps and restrained farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No return to peak P6 swarm density. No pristine undamaged landscape dominating the frame. No smoke-like swarm. No giant insects. No modern machinery. No children.'
  },
  P8:{
   approved:false,
   scientific:false,
   scene:'The 1874 locust crisis now reads at a broader regional scale: from an elevated but still period-plausible ground viewpoint, show a wide Great Plains landscape containing several separated farmsteads, field sections, fences or wagon routes while the moving swarm continues beyond the first farms toward more distant agricultural land. Keep foreground adults small and secondary if present. The focal idea is geographic spread and continued migration, clearly different from P7 field-level crop damage and P9 aftermath. Do not use a modern aerial-drone perspective.',
   narrative:'The crisis expands across the Great Plains as swarms continue migrating beyond the first affected farms.',
   timing:'0.0–2.0s: Establish a broad prairie farming landscape with multiple separated farm areas visible in depth.\n2.0–7.0s: Show the swarm continuing across the landscape toward more distant fields, with individual insects still readable near and mid distance.\n7.0–10.0s: Finish on the wider geographic scale of the moving outbreak rather than on one damaged crop row.',
   camera:'A slow elevated ground-level pan or lateral drift from one farm area toward more distant fields and the continuing swarm path. No modern aerial-drone movement, cuts, orbit or time-lapse.',
   physics:'The swarm migrates continuously across real terrain. Relative scale and depth remain stable. No teleporting swarm, impossible horizon-sized solid mass or instant landscape destruction.',
   audio:'Broad prairie wind, layered insect wing activity, distant farm ambience and natural environmental movement only. No voiceover, dialogue or music.',
   extraNegative:'No drone shot. No aircraft. No modern roads. No smoke-like swarm. No giant insects. No instant regional destruction. No children.'
  },
  P9:{
   approved:false,
   scientific:false,
   scene:'After the main swarm has moved on from an 1874 Great Plains farm, reveal the stark agricultural aftermath: broad rows of denuded or heavily stripped vegetation, exposed soil and damaged stalks dominate the frame. One or two adult farmers inspect the barren field at close or mid distance, touching a stripped stalk or kneeling beside the damaged ground. Only a few isolated locusts may remain; there must be no dense active swarm. The visual beat is loss after passage, not ongoing attack.',
   narrative:'Damaged fields reveal the scale of lost food and income after the swarms pass.',
   timing:'0.0–2.0s: Establish a visibly denuded field after the main swarm has moved away.\n2.0–7.0s: An adult farmer examines stripped stalks or exposed soil while the camera reveals the scale of the loss.\n7.0–10.0s: End on the quiet contrast between the barren rows and the farmer, with only minimal residual insect activity.',
   camera:'A restrained downward-to-forward move beginning on stripped plants or soil and settling on the adult farmer inspecting the damage. No cuts, orbit or time-lapse.',
   physics:'The damage is already complete when the panel begins. No crops disappear during the shot and no new dense swarm forms. Human movement remains slow and grounded.',
   audio:'Dry wind, footsteps, brittle plant movement and sparse residual insect sounds only. No voiceover, dialogue or music.',
   extraNegative:'No dense swarm. No sky-darkening insects. No lush healthy crop field dominating the frame. No giant insects. No modern machinery. No children.'
  }
 };
 return map[stage]||null;
}
function rockyMountainLocustLatePanel(stage){
 if(!isRockyMountainLocust1874()||!/^P1[0-4]$/.test(stage))return null;
 var base={approved:false,scientific:false};
 var map={
  P10:{
   scene:'In an 1874 Great Plains farming community after the worst locust feeding has passed, adult farmers and local civic officials inspect stripped fields, damaged crop rows, nearly empty storage areas and surviving farm equipment. Two or three adults compare the damage directly in the field while one records losses in a small period notebook or ledger. Keep the emphasis on visible agricultural loss and sober assessment, not modern emergency-management staging. No aircraft, motor vehicles, radios, plastic equipment or modern uniforms.',
   narrative:'Farmers and local officials assess the scale of crop losses and the growing threat to food and household survival.',
   timing:'0.0–2.0s: Establish stripped fields, damaged crops and a small group of adults inspecting the loss.\n2.0–7.0s: One farmer lifts damaged stalks while another adult checks nearby storage or records losses in a period notebook.\n7.0–10.0s: Hold on the contrast between devastated farmland and the adults quietly assessing what remains.',
   camera:'A restrained lateral documentary track across damaged rows toward the adults assessing the field. No cuts, orbit, time-lapse or modern disaster-news behavior.',
   physics:'Damage is already present. Nothing repairs or collapses instantly. Adults handle real crop remnants and period objects naturally. Preserve plausible 1874 farm scale and materials.',
   audio:'Dry prairie wind, footsteps through damaged vegetation, light handling of stalks and paper, distant farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No aircraft. No motor vehicles. No radio equipment. No modern emergency uniforms. No plastic containers. No modern clipboards. No intact lush field dominating the scene. No giant insects.'
  },
  P11:{
   scene:'In an 1874 Great Plains town or rural relief point after the locust disaster, adult volunteers, farmers and local relief organizers sort period-appropriate aid for affected families. Show sacks of grain or flour, folded clothing, seed bags, wooden crates and simple supplies arranged beside a storehouse, rail-side freight area or public building, then loaded by hand onto one horse-drawn wagon. Keep the composition centered on organized supply handling and outbound delivery so P11 reads clearly as the relief-response panel. Keep every object believable for 1874. Absolutely no aircraft, motor trucks, tractors, radios, plastic packaging, modern disaster-response gear or twentieth-century relief equipment.',
   narrative:'Communities organize food, clothing, seed and other practical relief for families hit by the 1874 locust disaster.',
   timing:'0.0–2.0s: Establish the period relief point with adult volunteers, stacked sacks, wooden crates and a horse-drawn wagon.\n2.0–7.0s: Adults sort and lift supplies by hand, passing sacks or seed bags toward the wagon in one continuous practical workflow.\n7.0–10.0s: End with the wagon partly loaded and the relief effort visibly organized for delivery to affected farms.',
   camera:'One continuous restrained forward-and-side documentary move that keeps the supply stacks, adult workers and horse-drawn wagon readable together. No cuts, orbit or time-lapse.',
   physics:'Supplies have realistic weight. Adults lift, pass and load one item at a time with believable body mechanics. The horse and wagon remain stable. No instant loading, teleporting objects or duplicated people.',
   audio:'Wooden crate movement, cloth sacks shifting, wagon creaks, horse movement, footsteps and quiet outdoor town ambience only. No voiceover, dialogue or music.',
   extraNegative:'No aircraft. No helicopters. No airplanes. No motor trucks. No tractors. No radios. No plastic bags. No modern pallets. No fluorescent vests. No modern aid logos. No twentieth-century relief equipment. No giant insects.'
  },
  P12:{
   scene:'During the difficult aftermath of the 1874 locust disaster, shift away from P11 supply loading and focus on the households living through the shortage. In a modest Great Plains street, farmyard or public distribution area, adult residents receive only a small amount of food, seed, clothing or other basic relief while damaged farmland or depleted farm storage remains visible in context. Keep the available supplies visibly limited and the mood tired and practical. This panel should communicate continuing household and community hardship, not another warehouse-loading scene and not a modern refugee camp.',
   narrative:'The crop disaster creates wider hardship as affected households depend on limited food, seed and material assistance.',
   timing:'0.0–2.0s: Establish a modest 1870s community relief scene with damaged farmland visible in context.\n2.0–7.0s: Adults receive, carry or organize limited supplies with restrained, tired movement.\n7.0–10.0s: Hold on the small scale of available aid against the wider agricultural damage.',
   camera:'A slow observational push toward one or two adult recipients carrying limited supplies, with the damaged agricultural setting held clearly in the background. Avoid repeating P11’s wagon-loading composition. No cuts, orbit or time-lapse.',
   physics:'Objects remain scarce, physical and period-correct. Adults carry realistic loads. No instant crowd growth, magical supply appearance or modern logistics.',
   audio:'Wind, footsteps, cloth and crate handling, wagon creaks and subdued outdoor ambience only. No voiceover, dialogue or music.',
   extraNegative:'No modern refugee camp. No aircraft. No motor vehicles. No plastic packaging. No modern tents. No loudspeakers. No modern uniforms. No aid-brand logos.'
  },
  P13:{
   scene:'As the immediate crisis begins to ease, adult Great Plains farmers begin the first practical steps of recovery using period-appropriate 1870s methods. Show a visibly damaged field where one adult clears dead stalks while another opens or measures seed from a cloth sack and a horse-drawn implement waits nearby for the next step. Keep the ground scarred and the field mostly unrecovered. The focal action is preparation to replant, clearly different from P12 relief distribution and from P14’s broader reflective recovery view.',
   narrative:'Recovery begins slowly as affected farmers clear damaged ground, secure seed and prepare to plant again.',
   timing:'0.0–2.0s: Establish damaged but quiet farmland with adults preparing seed and period tools.\n2.0–7.0s: Farmers clear rows, handle seed sacks and ready horse-drawn equipment in a deliberate recovery workflow.\n7.0–10.0s: End on the first visible steps toward replanting while much of the landscape remains damaged.',
   camera:'A restrained lateral move along damaged rows toward the recovery work. No cuts, time-lapse, orbit or instant seasonal transformation.',
   physics:'Recovery is gradual. Fields do not become green instantly. Tools, horses, seed and soil behave naturally and remain period-accurate.',
   audio:'Light wind, soil and tool sounds, sack movement, horse tack and restrained farm ambience only. No voiceover, dialogue or music.',
   extraNegative:'No instant green recovery. No modern tractors. No aircraft. No powered machinery outside the era. No plastic seed bags. No modern irrigation. No giant insects.'
  },
  P14:{
   scene:'A reflective closing view of the Great Plains after the 1874 Rocky Mountain locust disaster: one adult farmer works a horse-drawn plow or cultivator across a broad field where new cultivation appears beside clearly visible scarred or sparsely recovered patches. Keep the composition wide and quiet so the final image feels like gradual return to farming rather than instant restoration. Preserve the late nineteenth-century world and let the contrast between surviving damage and renewed cultivation carry the final lesson visually. No written lesson, title card, modern technology or invented monument is shown.',
   narrative:'The 1874 locust disaster remains a stark historical example of how quickly an environmental crisis could devastate farming communities across the Great Plains.',
   timing:'0.0–2.0s: Establish a broad recovered-but-still-scarred prairie farming landscape.\n2.0–7.0s: Show adult farmers continuing steady period-appropriate work among visible reminders of past crop damage.\n7.0–10.0s: Finish on a wide, quiet historical composition that feels reflective rather than triumphant.',
   camera:'A slow restrained pullback or lateral drift revealing the wider prairie and recovering farms. No cuts, orbit, time-lapse or modern aerial-drone look.',
   physics:'The landscape shows gradual recovery, not instant transformation. Human and animal movement remains natural and period-correct.',
   audio:'Prairie wind, distant horse and farm-tool sounds, light vegetation movement only. No voiceover, dialogue or music.',
   extraNegative:'No modern machinery. No aircraft. No drone view. No modern roads. No text, captions, memorial plaque or title card. No giant insects.'
  }
 };
 return map[stage]||null;
}
function isNargis2008(){
 var t=String(current()||'').toLowerCase();
 return t.includes('cyclone nargis')&&t.includes('2008');
}
function nargisPanel(stage){
 if(!isNargis2008()||!/^P(?:[1-9]|1[0-4])$/.test(stage))return null;
 var base={approved:true,approvedLabel:'FINAL APPROVED — NARGIS '+stage,scientific:false};
 if(stage==='P7'){
   base.scene='During the height of Cyclone Nargis in a low-lying Ayeyarwady Delta community, wider destruction and infrastructure failure are already underway. Roofs fail, trees bend or fall, simple power systems collapse, and floodwater spreads through the community. CRITICAL RAIN VISIBILITY LOCK: heavy wind-driven rain must be strongly visible from the first second to the last second. Show dense slanting rain streaks and sheets crossing foreground and background, rain splashing off roofs, walls, debris and floodwater, and spray mixing with rainfall. The viewer must clearly see heavy rain lashing through the shot, not just strong wind.';
   base.narrative='Roofs fail, trees fall, power systems collapse, and floodwater spreads through communities as Cyclone Nargis lashes the delta with violent wind and heavy visible rain.';
   base.timing='0.0–2.0s: Begin immediately with heavy rain already clearly visible and violent storm conditions active. The viewer must instantly see rain lashing through the scene and one focal failure such as roofing damage, a falling tree, or floodwater movement.\n2.0–7.0s: Maintain dense visible rain throughout while roofs fail further, trees break or collapse, debris moves with the wind, and floodwater spreads.\n7.0–10.0s: Sustain full storm intensity. Keep rain strongly visible, wind violent, and flooding/destruction active until the final frame.';
   base.camera='A restrained forward tracking move with clear parallax or grounded observational drift. Keep foreground, midground and background readable and keep rainfall visible in the frame at all times. Fixed focal length, natural depth and occlusion. No cuts, transitions, orbit or time-lapse.';
   base.physics='Keep all motion physically plausible and cyclone-specific. Show believable interaction between wind, heavy visible rain, floodwater, debris, trees and damaged structures. Rain must remain continuous and visually obvious; do not reduce the scene to wind-only motion.';
   base.audio='Loud wind-driven rain, roof impacts, rattling and breaking structures, tree cracking, floodwater movement, debris strikes and natural storm ambience only. ABSOLUTE NO VOICEOVER. No narration. No spoken dialogue. No music.';
   base.extraNegative='No weak invisible rain. No light drizzle. No mostly dry scene. No wind-only storm look. Rain must remain visible from first frame to last frame.';
 }
 if(stage==='P11'){
   base.scene='Post-disaster displacement in the Ayeyarwady Delta after Cyclone Nargis. Adult displaced residents gather around temporary emergency shelters made from simple tarpaulins, bamboo, salvaged wood and improvised covering. Relief distribution is taking place but supplies are visibly limited. Show adults waiting, sitting, carrying containers, receiving basic aid, or standing near sparse relief materials. Muddy ground and storm-damaged surroundings remain visible. Shelter conditions look temporary, strained and inadequate. No children.';
   base.narrative='Temporary shelters and limited relief distribution support displaced residents after Cyclone Nargis.';
   base.timing='0.0–2.0s: Begin immediately with the displacement and relief setting clearly readable, with one adult already receiving aid, carrying a container, or waiting beside an improvised shelter.\n2.0–7.0s: Continue the same grounded action. Adults shift position, receive or carry limited supplies, and move naturally through the shelter area while scarcity remains visible.\n7.0–10.0s: Sustain the humanitarian-crisis atmosphere and end with temporary shelters, limited aid and displaced adults clearly visible.';
   base.camera='A slow lateral track or grounded observational drift revealing scene depth. Keep foreground, midground and background readable. Fixed focal length, natural depth and occlusion. No cuts, transitions, orbit or time-lapse.';
   base.physics='This is a post-disaster displacement panel. Keep motion calm, tired and grounded. Shelter fabric and improvised materials may shift gently. Preserve object count, human identity and plausible scale.';
   base.audio='Natural environment and object SFX only: light wind, shelter fabric flapping, mud or water footsteps, container handling and subdued aftermath ambience. ABSOLUTE NO-VOICEOVER / NO-SPEECH LOCK: no voiceover, no narration, no spoken dialogue, no interview audio, no public announcement, no radio voice, no off-screen talking, no foreground human speech, no chanting, no prayer audio, no reporter audio, no explanatory voice of any kind, and no music. The entire clip must remain nonverbal except for natural environment and object sounds.';
   base.extraNegative='No overcrowded polished refugee-camp look. No abundant aid stockpile. No comfortable camp atmosphere. No voiceover. No narration. No dialogue. No reporter. No radio speech. No public announcement. No human speech of any kind.';
 }
 return base;
}
function triStateTornadoPanel(stage){
 var t=String(current()||'').toLowerCase();
 if(!(t.includes('tri-state tornado')&&t.includes('1925'))||stage!=='P14')return null;
 return {
   approved:false,
   scientific:false,
   scene:'Final reflective aftermath along the Tri-State Tornado track in a historically appropriate 1925 Midwestern town setting. The violent tornado is gone. Show a quiet damaged street edge or neighborhood with surviving period homes, broken trees, cleared debris, salvaged lumber, and a small number of adult residents calmly looking across the storm-scarred community as recovery continues. Keep clothing, buildings, roads, utility details, tools, and any vehicles appropriate to 1925 Missouri, Illinois, or Indiana. The frame should communicate lasting community memory and the need for future preparedness through grounded aftermath details only, without inventing a specific warning system, agency, memorial, policy, technology, or statistic. No active funnel, no new destruction, no modern sirens, no modern emergency vehicles, no modern signage, and no on-screen text.',
   narrative:'Close on the lasting historical legacy of the Tri-State Tornado without introducing a new disaster beat or unsupported modern preparedness system.',
   timing:'0.0–2.0s: Establish the quiet post-disaster 1925 Midwestern setting with storm damage still readable and no active tornado.\n2.0–7.0s: Slowly reveal adults, surviving structures, cleared debris, and restrained recovery activity that communicates the event’s lasting community impact.\n7.0–10.0s: End on a reflective wide composition of the storm-scarred town and ongoing recovery, with no new hazard or dramatic escalation.',
   camera:'One restrained slow push or lateral documentary-style move rendered strictly in the locked 2D historical-anime style. Keep the final image reflective rather than action-heavy. No cuts, no transition, no orbit, no time-lapse.',
   physics:'The tornado has already passed. Debris remains where plausible; recovery activity is slow and human-scale. No sudden rebuilding, no new structural collapse, no active vortex, no impossible wind, and no invented modern preparedness equipment.',
   audio:'Quiet post-storm ambience, light wind, distant wood and cleanup sounds, restrained adult movement. No tornado roar, no voiceover, no music.',
   extraNegative:'No live action. No photorealistic people. No photographic skin. No 3D CGI humans. No active tornado. No new destruction. No modern sirens, emergency vehicles, radar screens, electronic warning devices, captions, titles, logos, or watermark.'
 };
}
function eventPanel(stage){
 return triStateTornadoPanel(stage)||rockyMountainLocustPanel(stage)||rockyMountainLocustLatePanel(stage)||nargisPanel(stage)||lituyaCause(stage);
}
function progression(stage,special){
 if(special)return null;
 return window.LDDisasterProgression?.stage?.(current(),stage)||null;
}
function progressionLock(stage,special){
 var p=progression(stage,special);
 if(!p)return special
   ? 'EVENT-SPECIFIC PROGRESSION OVERRIDE: This panel uses a dedicated event-specific scene and timing lock. The generic disaster-family stage is intentionally superseded.'
   : '';
 return 'DISASTER-FAMILY PROGRESSION LOCK:\nFamily: '+p.familyLabel+'.\nStage: '+stage+'.\nStory role: '+p.role+'.\nStage guard: '+p.rule+'\nEvidence guard: '+p.evidenceRule+'\nDo not jump ahead to a later panel, repeat the previous panel as the same shot, or pull recovery/aftermath imagery into an earlier stage.';
}
function stageNumber(stage){var n=parseInt(String(stage||'').replace(/\D/g,''),10);return Number.isFinite(n)?n:0;}
function familyKey(){return window.LDDisasterProgression?.family?.(current())||'generic';}
function previousStageName(stage){var n=stageNumber(stage);return n>1?'P'+(n-1):'';}
function previousApprovedContinuity(stage){
 var prev=previousStageName(stage);if(!prev)return '';
 var snap=window.ldApprovedMemory?.stages?.[prev]?.latest;
 var card=document.querySelector('.stage-card[data-stage="'+prev+'"]');
 var scene=clean(snap?.videoScene||card?.querySelector('.video-scene')?.value||card?.dataset?.videoScene||'');
 var narration=clean(snap?.narration||card?.querySelector('.narration')?.value||'');
 var summary=[scene,narration].filter(Boolean).join(' ');
 if(!summary)return '';
 return summary.slice(0,620);
}
function intensityDirector(stage){
 var n=stageNumber(stage),fam=familyKey();
 if(n===1)return 'INTENSITY: restrained normal-world tension. The scene must feel alive and cinematic, but do not foreshadow with impossible destruction.';
 if(n===2)return 'INTENSITY: subtle unease and controlled buildup. Increase atmosphere and anticipation without stealing the next panel’s hazard reveal.';
 if(n===3)return 'INTENSITY: first unmistakable danger. Make the developing hazard readable immediately, but preserve room for later escalation.';
 if(n===4||n===5)return 'INTENSITY: strong escalation with clear physical cause-and-effect. Use human/environment scale and mounting force rather than random chaos.';
 if(n===6)return 'INTENSITY: PEAK PRIMARY IMPACT. This is the strongest primary-disaster beat when consistent with the '+fam+' progression. Maximize scale, danger, depth and emotional pressure while keeping physics coherent and the image readable.';
 if(n===7||n===8)return 'INTENSITY: sustained major danger / wider impact. Keep the scene powerful but distinct from P6; broaden consequences rather than replaying the same composition.';
 if(n===9)return 'INTENSITY: immediate aftermath. Let visual shock come from scale of damage, silence, atmosphere and human reaction rather than new destruction.';
 if(n>=10&&n<=12)return 'INTENSITY: human consequence and wider impact. Favor emotionally grounded, purposeful action and strong environmental storytelling over spectacle.';
 if(n===13)return 'INTENSITY: restrained recovery. Use deliberate human-scale motion, visible damage continuity and cautious forward movement.';
 return 'INTENSITY: reflective cinematic closure. End with visual weight, historical memory and a composed final image; do not introduce a new disaster beat.';
}
function cameraDirector(stage,scientific){
 var n=stageNumber(stage);
 if(scientific)return 'CINEMATIC CAMERA DIRECTOR: one precise explanatory camera move only — restrained lateral reveal or slow push that clarifies mechanism and scale. Stable horizon, coherent lens, no dramatic handheld behavior, no orbit, no hidden cut.';
 var map={
  1:'CINEMATIC CAMERA DIRECTOR: composed wide-to-medium observational framing with subtle parallax or a very slow motivated dolly. Let normal life and spatial geography read clearly.',
  2:'CINEMATIC CAMERA DIRECTOR: slow lateral reveal or controlled creeping push that exposes developing environmental warning signs without showing the next major hazard beat.',
  3:'CINEMATIC CAMERA DIRECTOR: measured push toward the first unmistakable hazard cue. Keep foreground scale references and background threat in the same coherent visual axis.',
  4:'CINEMATIC CAMERA DIRECTOR: low-to-human-height tracking or restrained reveal that makes first contact / onset physically legible. Camera movement follows the action rather than circling it.',
  5:'CINEMATIC CAMERA DIRECTOR: street-level or human-scale medium-wide tracking with strong foreground–midground–background depth. Keep the main hazard readable while localized damage develops.',
  6:'CINEMATIC CAMERA DIRECTOR: professional peak-impact composition. Use a strong wide or medium-wide perspective with one foreground scale reference and the main hazard dominating depth. Controlled operator movement only; no frantic random shake.',
  7:'CINEMATIC CAMERA DIRECTOR: broaden the geography with an elevated, lateral or deep-perspective move. Show wider consequences without copying P6’s camera path.',
  8:'CINEMATIC CAMERA DIRECTOR: controlled trailing, receding or side-on composition that shows the hazard moving on / widening impact. Avoid another head-on peak shot.',
  9:'CINEMATIC CAMERA DIRECTOR: slow observational reveal of aftermath. Allow damage layers and human scale to enter naturally; avoid action-movie movement.',
 10:'CINEMATIC CAMERA DIRECTOR: human-height purposeful tracking following rescue, assessment or response. Keep faces and hands stable; camera does not outrun the subjects.',
 11:'CINEMATIC CAMERA DIRECTOR: intimate medium shot or gentle lateral move centered on lived consequence / relief. Prioritize human readability over spectacle.',
 12:'CINEMATIC CAMERA DIRECTOR: wider environmental composition with controlled movement that connects infrastructure, landscape and human consequence in one readable geography.',
 13:'CINEMATIC CAMERA DIRECTOR: calm purposeful tracking or restrained crane-like reveal showing cleanup / recovery at believable pace.',
 14:'CINEMATIC CAMERA DIRECTOR: slow, restrained final composition — gentle push, lateral reveal or nearly locked-off frame. Finish on a deliberate movie-ending image.'
 };
 return (map[n]||map[6])+' Maintain one lens family and coherent perspective for the whole 10 seconds. No zoom pumping, fisheye, random orbit, camera teleportation, viewpoint reset, wall pass-through or unmotivated shake.';
}
function weatherContinuityLock(stage){
 var prev=previousApprovedContinuity(stage);
 var bridge=prev?'\nPREVIOUS APPROVED PANEL CONTINUITY REFERENCE: '+prev:'';
 return 'WEATHER + ATMOSPHERE CONTINUITY LOCK:\nWeather is story continuity, not decoration. Preserve cloud direction, wind direction, light direction, visibility, precipitation state, ground wetness/dust state and atmospheric density from the preceding story beat unless the current panel explicitly requires a change. Any change must evolve progressively on-screen, never reset abruptly. Storm buildup must darken / thicken / intensify progressively; aftermath may ease only when the story position supports it. Keep foreground, midground and background atmosphere layered so the primary subject and hazard remain readable.'+bridge;
}
function transitionMorphLock(){
 return 'MICRO-TRANSITION + MORPH CONTROL:\nAll state changes need visible physical intermediates. Wind builds before objects accelerate. People brace, turn, stumble or react before changing position. Structures flex / strain / detach before failure. Debris begins moving before reaching speed. Damage never reverses. No morph dissolve, hidden cut, snap transformation, pop-in, pop-out, teleportation, duplicate person, replacement face, changing clothing, changing body proportions, geometry melt, respawn, spontaneous repair or unexplained object multiplication. Large objects keep identity, scale and orientation until a visible force changes them.';
}
function subjectObjectLock(){
 return 'SUBJECT + OBJECT PERSISTENCE LOCK:\nWithin this shot, each adult keeps the same face, age, hair, clothing, body proportions and accessories from first frame to last. Buildings, windows, roofs, poles, trees, fences, vehicles and large debris preserve geometry and identity unless visibly altered by a physical event. Across panels, reuse a recurring adult only when continuity context establishes that it is the same person; otherwise do not invent false character continuity.';
}
function audioDirector(stage){
 var n=stageNumber(stage);
 var phase=n<=2?'quiet tension with restrained ambience':n<=5?'rising environmental pressure with selective impacts':n<=8?'powerful hazard sound with controlled dynamic peaks':n===9?'post-impact atmosphere with space, distant detail and natural decay':n<=12?'human-scale ambience with restrained work / movement sounds':'quiet recovery / reflective ambience';
 return 'PROFESSIONAL CINEMATIC AUDIO MIX:\nAudio phase: '+phase+'. Use natural, scene-specific sound only unless music or dialogue is explicitly requested. Hierarchy: primary environmental hazard/ambience first, secondary environment second, occasional physically motivated impacts third, subtle human movement/reaction last. No repetitive identical impact loop, constant metallic clanging, random cinematic boom, camera whoosh, high-pitched continuous screech, artificial bass hit, unsupported explosion, or modern siren/alarm. Keep dynamic range: quieter tension → rising pressure → peak → natural decay when appropriate. Every major audible event must have a visible cause and occur in sync with the image.';
}
function debrisPhysicsLock(){
 return 'DEBRIS + DAMAGE PHYSICS LOCK:\nDebris obeys mass, gravity, wind direction and momentum. Light debris may rise higher; shingles and small boards may travel farther; heavy timber, furniture and structural fragments stay lower and move with believable inertia. No hovering heavy objects, reverse-direction debris without cause, giant foreground debris that blocks the main hazard, or sudden scale changes. Damage accumulates irreversibly: broken remains broken; detached remains detached; collapsed elements do not rebuild.';
}
function stageCastProfile(stage){
 var n=stageNumber(stage);
 if(n===1)return 'normal life / pre-disaster adults';
 if(n===2)return 'pre-impact adults with subtle concern';
 if(n===3)return 'small number of adults recognizing danger';
 if(n===4||n===5)return 'exposed adults near first impact';
 if(n===6||n===7)return 'high-intensity survival adults and scattered bystanders';
 if(n===8||n===9)return 'aftermath survivors / affected adults';
 if(n>=10&&n<=12)return 'response, relief, affected families, workers or townspeople';
 if(n===13)return 'recovery adults / cleanup adults';
 return 'reflective survivors / community adults';
}
function stageCrowdLevel(stage){
 var n=stageNumber(stage);
 if(n<=2)return 'very small cast only';
 if(n===3||n===4)return 'small cast';
 if(n===5||n===6)return 'small-to-medium cast only when the location logically supports it';
 if(n===7||n===8)return 'medium cast if needed';
 if(n>=9&&n<=12)return 'small-to-medium cast with varied support/background adults';
 return 'small cast with selective background adults';
}
function roleWardrobePool(stage){
 var fam=familyKey(),n=stageNumber(stage);
 if(fam==='tornado'){
   if(n<=4)return 'historically appropriate everyday Midwestern adult clothing for the event year: varied hats, coats, dresses, work shirts, suspenders, aprons, boots, trousers, skirts and outerwear depending on class, weather and role';
   if(n<=8)return 'storm-exposed clothing with natural disorder: coats flapping, dust, loosened hats, wet or dirt-marked garments, but still historically appropriate and varied';
   return 'post-disaster / recovery clothing with historically appropriate adult workwear, aprons, coats, boots, hats, shawls, rolled sleeves and simple town/rural garments appropriate to the year and place';
 }
 if(fam==='insect')return 'historically appropriate rural/farming wardrobe variety: hats, bonnets, work shirts, aprons, dresses, suspenders, boots, coats and local workwear appropriate to the year and region';
 if(fam==='tsunami'||fam==='cyclone'||fam==='flood')return 'historically appropriate regional adult clothing varied by role, class and weather exposure, with practical differences across survivors, workers and townspeople';
 return 'historically appropriate adult wardrobe variety by role, class, weather and local setting';
}
function recurringCharacterPolicy(stage){
 var n=stageNumber(stage);
 if(n<=2)return 'If one principal adult is featured, preserve that person’s exact identity consistently across the whole shot.';
 if(n<=6)return 'If a principal adult or small group is central, preserve their exact identity consistently across the whole shot and keep them visually distinct from supporting adults.';
 if(n<=10)return 'Preserve any central survivor / responder identity when clearly foregrounded, but allow varied supporting adults around them.';
 return 'Use continuity only where narratively useful. Do not force every panel to reuse the same person, but if a recurring foreground adult appears, keep identity stable inside the shot.';
}
function characterDiversityLock(stage){
 return 'CHARACTER DIVERSITY + ANTI-CLONE LOCK:\n'
  +'Cast profile: '+stageCastProfile(stage)+'.\n'
  +'Crowd level: '+stageCrowdLevel(stage)+'.\n'
  +'Wardrobe pool: '+roleWardrobePool(stage)+'.\n'
  +recurringCharacterPolicy(stage)+'\n'
  +'For supporting adults and background adults, introduce natural visual variation appropriate to the event year, location and social setting.\n'
  +'Vary face shape, age appearance, height, body build, hairstyle, headwear, outerwear, workwear, layering and clothing combinations.\n'
  +'Do not duplicate the same face, hairstyle, hat, coat, dress, apron, body proportions or clothing pattern across multiple adults unless a historically correct uniform or shared role specifically requires it.\n'
  +'Crowds must feel naturally varied and human, not cloned. Avoid background extras that look like copies of the foreground subject.\n'
  +'No mirrored crowd members. No repeated identical silhouettes lined up unnaturally. No accidental twin copies created by the generator.\n'
  +'If a family or repeated small group appears, keep each member recognizably consistent while preserving clear visual differences between individuals.\n'
  +'Controlled variation only: never randomize away established identity, era, ethnicity, local dress norms, role, weather exposure or continuity.';
}
function antiClonePromptCompatible(text){
 var s=String(text||'');
 return s.includes('CHARACTER DIVERSITY + ANTI-CLONE LOCK:');
}
function cinematicMasterLock(stage,scientific){
 return 'MASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY:\n'
  +intensityDirector(stage)+'\n'
  +transitionMorphLock()+'\n'
  +subjectObjectLock()+'\n'
  +characterDiversityLock(stage)+'\n'
  +weatherContinuityLock(stage)+'\n'
  +debrisPhysicsLock()+'\n'
  +cameraDirector(stage,scientific)+'\n'
  +audioDirector(stage)+'\n'
  +'ERA + ACCURACY: every visible and audible element must fit the locked year, location and verified event context. Never add modern vehicles, electronics, warning systems, emergency gear, architecture, tools, signage or sound cues unless supported. Historical accuracy outranks drama.\n'
  +'FRAME QUALITY TEST: first, middle and final frames must preserve style, recurring-subject identity, supporting-cast diversity, environment geometry, weather logic, lens perspective and story-stage boundaries. Intensity comes from scale, staging, timing, depth and believable reaction — never random chaos.';
}
function qualityPromptCompatible(text){
 var s=String(text||'');
 return s.includes('MASTER CINEMATIC CONSISTENCY LOCK — HIGH PRIORITY:')
   &&s.includes('MICRO-TRANSITION + MORPH CONTROL:')
   &&s.includes('CHARACTER DIVERSITY + ANTI-CLONE LOCK:')
   &&s.includes('WEATHER + ATMOSPHERE CONTINUITY LOCK:')
   &&s.includes('CINEMATIC CAMERA DIRECTOR:')
   &&s.includes('PROFESSIONAL CINEMATIC AUDIO MIX:')
   &&s.includes('DEBRIS + DAMAGE PHYSICS LOCK:');
}
function clean(value){return window.ldCleanNarrationInstructions?window.ldCleanNarrationInstructions(value):String(value||'').trim();}
function normalizedSignature(value){try{var parts=JSON.parse(value);if(parts[0]!==T2V_POLICY_VERSION)return '';parts[6]=clean(parts[6]);parts[7]=clean(parts[7]);return JSON.stringify(parts);}catch(e){return '';}}
function pinScene(card){
 var special=eventPanel(card.dataset.stage);
 if(special&&special.scene){
   card.dataset.videoScene=clean(special.scene);
   var field=card.querySelector('.video-scene');
   if(field)field.value=card.dataset.videoScene;
   return;
 }
 if(!state(card).scene)card.dataset.videoScene=clean(sceneFrom(card));
}
function signature(card){var dna=window.LDProductionDNA?.signature?.()||'';var progressionVersion=window.LDDisasterProgression?.version||'';return JSON.stringify([T2V_POLICY_VERSION,current(),format(),style(),colorMode(),continuity(),clean(sceneFrom(card)),clean(card.querySelector('.narration').value),dna,progressionVersion]);}
function build(card){
 var scene=cleanSceneText(sceneFrom(card));
 if(!scene)throw Error('Add the panel scene description first.');
 if(!ready())throw Error('Set the shared year and location before creating Text-to-Video prompts.');
 var stage=card.dataset.stage;
 var special=eventPanel(stage);
 if(special&&special.scene)scene=special.scene;
 scene=sanitizeSceneForStyle(scene);
 var familyProgression=progression(stage,special);
 var scientific=special?!!special.scientific:scientificScene(card,scene);
 var camera=cameraDirector(stage,scientific);
 var modeLine=style()==='real'
   ? (scientific?'Photorealistic historical documentary explanatory visualization. This is a scientific cutaway, not an eyewitness human-camera scene. No anime or illustration.':'Photorealistic REAL HUMAN historical documentary recreation. No anime or illustration.')
   : (colorMode()==='bw'?'Serious 2D historical graphic-novel/anime animation in STRICT true black-and-white grayscale only. No live action, no photorealism, no color, no sepia, no tint, no selective color.':'Serious 2D historical graphic-novel/anime animation. No live action.');
 var timing=special&&special.timing?special.timing:(scientific
   ? '0.0–2.0s: Establish the geological or scientific setting and the focal mechanism clearly; readable natural motion begins within the first half-second.\n2.0–7.0s: Continue the same mechanism with restrained, coherent cause-and-effect motion at plausible scale.\n7.0–10.0s: Sustain the buildup or explanatory beat and end on a clear readable composition without jumping to the next story stage.'
   : '0.0–2.0s: Establish the described setting, visible adult positions when adults are present, and one clear focal action; readable natural motion begins within the first half-second.\n2.0–7.0s: Continue that same action with coherent cause and effect, natural momentum and local environmental response.\n7.0–10.0s: Sustain the panel’s intended beat and finish on a readable composition; do not jump to the next story stage.');
 var physics=special&&special.physics?special.physics:(scientific
   ? 'This panel is an explanatory scientific visualization. Do not depict invisible subsurface processes as ordinary eyewitness footage. Keep the mechanism grounded, restrained and physically plausible. No fantasy energy, glowing magic cracks or exaggerated sci-fi effects. Preserve plausible geological scale and cause-and-effect.'
   : 'Only the selected disaster mechanism belongs here. Calm scenes stay calm. Slow-onset effects are already present; no instant infection, starvation, crop death or insect reproduction. Preserve object count, human identity when people are present, and plausible scale throughout the clip.');
 var audio=special&&special.audio?special.audio:(scientific
   ? 'Restrained natural documentary ambience appropriate to the mechanism, such as low underwater rumble, rock strain or deep-earth vibration when supported by the scene. No voiceover or music.'
   : 'Natural scene-specific ambience and SFX only. No voiceover or music.');
 var negative=scientific
   ? 'No children, gore, human figures unless the panel specifically requires them, fantasy energy, glowing sci-fi fault lines, unsupported destruction, unrelated disaster, modern objects outside the era, text, captions, logos or watermark.'
   : 'No children, gore, duplicated people, distorted anatomy, morphing, giant insects, unsupported destruction, unrelated disaster, modern objects outside the era, text, captions, logos or watermark.';
 if(style()==='anime')negative+=' ABSOLUTE STYLE NEGATIVE: no live action, no photorealistic humans, no photographic skin, no newsreel-looking real people, no 3D CGI people.';
 else negative+=' ABSOLUTE STYLE NEGATIVE: no anime, no illustration, no graphic-novel people, no 3D CGI people.';
 if(special&&special.extraNegative)negative+=' '+special.extraNegative;
 var result='VIDEO PROMPT — EXACTLY 10 SECONDS\n'+current()+' · '+stage+'\n\n'
   +absoluteStyleLock()+'\n\n'
   +(universalHookDna()?universalHookDna()+'\n\n':'')
   +'TEXT-TO-VIDEO. Create the entire scene from this description. No reference image is required. '+(format()==='shorts'?'Portrait 9:16.':'Landscape 16:9.')+' One continuous shot. '+modeLine
   +'\n\n'+lock()
   +'\n\n'+progressionLock(stage,special)
   +'\n\nPANEL SCENE:\n'+scene
   +'\n\nNARRATIVE CONTEXT — not spoken, not on screen:\n'+(special&&special.narrative?special.narrative:(card.querySelector('.narration').value.trim()||'Follow this panel scene only; do not invent narration or statistics.'))
   +'\n\nTIMING:\n'+timing
   +'\n\n'+cinematicMasterLock(stage,scientific)
   +'\n\nCAMERA:\n'+(special&&special.camera?(special.camera+' '+camera):camera)
   +'\n\nPHYSICS AND TIME:\n'+physics+' '+debrisPhysicsLock()
   +'\n\nAUDIO:\n'+audio+'\n'+audioDirector(stage)
   +'\n\nNEGATIVE:\n'+negative
   +'\n\nSTATUS: '+(special&&special.approved?(special.approvedLabel+' — locked final prompt.'):'FOR TESTING — review historical details and rendered continuity before approval.');
 return window.LDProductionDNA?.polishPrompt?window.LDProductionDNA.polishPrompt(card,result):result;
}
function generate(card){try{rebuildTextPrompt(card);}catch(e){showToast(e.message);}}
function completeTextPrompt(text){
 var s=String(text||'');
 return s.includes('VIDEO PROMPT — EXACTLY 10 SECONDS')&&s.includes('PANEL SCENE:')&&s.includes('TIMING:')&&s.includes('CAMERA:')&&s.includes('PHYSICS AND TIME:')&&s.includes('AUDIO:')&&s.includes('NEGATIVE:');
}
function rebuildTextPrompt(card){
 pinScene(card);
 var text=build(card);
 if(!promptStyleCompatible(text))throw Error('Visual-style lock mismatch. Rebuild the panel prompt before approval.');
 if(!qualityPromptCompatible(text))throw Error('Cinematic consistency lock is incomplete. Rebuild the panel prompt before approval.');
 if(!antiClonePromptCompatible(text))throw Error('Character diversity / anti-clone lock is incomplete. Rebuild the panel prompt before approval.');
 card.dataset.textVideoPrompt=text;
 card.dataset.textVideoSignature=signature(card);
 var ta=card.querySelector('.text-video-prompt');
 if(ta)ta.value=text;
 saveCurrent();
 update(card);
 syncGlobalControl();
 return text;
}
function valid(card){return completeTextPrompt(state(card).text)&&promptStyleCompatible(state(card).text)&&qualityPromptCompatible(state(card).text)&&antiClonePromptCompatible(state(card).text)&&normalizedSignature(state(card).signature)===signature(card)&&ready();}
function completionReady(card){
 if(!supports(card))return false;
 if(state(card).mode!=='text')return true;
 if(!ready())return false;
 if(!card.querySelector('.narration')?.value.trim())return false;
 if(valid(card))return true;
 try{return completeTextPrompt(rebuildTextPrompt(card));}catch(e){return false;}
}
function completionIssue(card){
 if(!ready())return 'Set the shared event year and main location first.';
 if(!card.querySelector('.narration')?.value.trim())return 'Add the panel narration first.';
 if(!completeTextPrompt(state(card).text))return 'Build the FULL Text-to-Video prompt first.';
 return 'Refresh the Text-to-Video prompt, then mark Done.';
}
function prompt(card){
 if(supports(card)&&state(card).mode==='text'){
   if(!valid(card))return rebuildTextPrompt(card);
   return state(card).text;
 }
 var base=card.querySelector('.flow-prompt').value;
 if(!base.trim())throw Error('This panel has no Image-to-Video prompt yet.');
 var out=withLock(base);
 return window.LDProductionDNA?.polishPrompt?window.LDProductionDNA.polishPrompt(card,out):out;
}
function update(card){if(!supports(card))return;var mode=state(card).mode;
card.querySelector('.flow-wrap').hidden=mode==='text';
var panel=card.querySelector('.text-video-fields');if(panel)panel.hidden=mode!=='text';
var image=card.querySelector('.image-prompt').closest('.field-block');if(image)image.hidden=mode==='text';
var workspace=card.querySelector('.image-workspace');if(workspace)workspace.hidden=mode==='text';
var status=card.querySelector('.video-mode-status');var statusText=mode==='image'?'Use a starting image with the Image-to-Video prompt.':valid(card)?'Text-to-Video ready for testing · no starting image needed.':'Text-to-Video needs building or refresh. Copy FULL Video Prompt will rebuild it automatically.';if(status&&status.textContent!==statusText)status.textContent=statusText;
var fullBtn=card.querySelector('.copy-active-video');if(fullBtn)fullBtn.textContent=mode==='text'?'Copy FULL Text-to-Video Prompt':'Copy FULL Image-to-Video Prompt';
var label=card.querySelector('.flow-wrap label');if(label&&label.textContent!=='Image-to-Video prompt')label.textContent='Image-to-Video prompt';}
function decorate(card){if(!supports(card)||card.querySelector('.video-mode-controls'))return;
// Restore the exact scene used by older saved text prompts before image helpers run.
if(state(card).text&&!state(card).scene){try{var saved=JSON.parse(state(card).signature);if(Array.isArray(saved)&&typeof saved[4]==='string')card.dataset.videoScene=clean(saved[4]);}catch(e){}}

var box=document.createElement('div');box.className='video-mode-controls';box.innerHTML='<p class="video-mode-status"></p><button type="button" class="ghost copy-active-video">Copy FULL Video Prompt</button><div class="text-video-fields"><label>Panel scene description<textarea class="video-scene" rows="4"></textarea></label><button type="button" class="ghost build-text-video">Build / refresh Text-to-Video prompt</button><label>Text-to-Video prompt<textarea class="text-video-prompt" rows="10"></textarea></label><button type="button" class="ghost copy-text-video">Copy FULL Text-to-Video Prompt</button></div>';
card.querySelector('.flow-wrap').before(box);
var scene=box.querySelector('.video-scene');scene.value=sceneFrom(card);var text=box.querySelector('.text-video-prompt');text.value=state(card).text;

scene.oninput=function(){card.dataset.videoScene=scene.value;card.querySelector('.done-toggle').checked=false;update(card);saveCurrent();};
text.oninput=function(){card.dataset.textVideoPrompt=text.value;card.querySelector('.done-toggle').checked=false;saveCurrent();};
box.querySelector('.build-text-video').onclick=function(){generate(card);};
box.querySelector('.copy-text-video').onclick=function(){try{copyText(prompt(card));}catch(e){showToast(e.message);}};
box.querySelector('.copy-active-video').onclick=function(){try{copyText(prompt(card));}catch(e){showToast(e.message);}};
update(card);}
function panelCards(){return Array.from(document.querySelectorAll('.stage-card')).filter(supports);}
function selectedMode(){var cards=panelCards();if(!cards.length)return '';var mode=state(cards[0]).mode;return cards.every(function(c){return state(c).mode===mode;})?mode:'mixed';}
function syncGlobalControl(){var root=document.getElementById('productionVideoMethod');if(!root)return;var cards=panelCards(),mode=selectedMode();root.querySelectorAll('[data-method]').forEach(function(button){button.disabled=!cards.length;button.setAttribute('aria-pressed',String(button.dataset.method===mode));});var pending=cards.filter(function(c){return state(c).mode==='text'&&!valid(c);}).length;
var message=!cards.length?'Create or open a Shorts production to choose the video method.':mode==='mixed'?'This saved production has mixed methods. Choose one button to apply it to every panel.':(mode==='text'?'Text-to-Video':'Image-to-Video')+' is active for all '+cards.length+' panels.';
if(pending)message+=' '+pending+' text prompts need building or refresh; check the shared setting below.';
var status=root.querySelector('.production-video-status');if(status.textContent!==message)status.textContent=message;}
function setAllMode(mode){
 var locked=window.LDProjectLocks?.videoMode?.()||window.ldProjectLocks?.videoMode;
 if(window.ldProjectLocks?.locked&&locked&&mode!==locked){showToast('Video Mode is locked for this project.');return;}
 if(mode!=='image'&&mode!=='text')return;var cards=panelCards();if(!cards.length)return;
var built=0;cards.forEach(function(card){if(state(card).mode!==mode)card.querySelector('.done-toggle').checked=false;card.dataset.videoMode=mode;
// Build only missing text versions. Switching never replaces an edited prompt.
if(mode==='text'&&!valid(card)&&ready()){try{pinScene(card);card.dataset.textVideoPrompt=build(card);card.dataset.textVideoSignature=signature(card);var text=card.querySelector('.text-video-prompt');if(text)text.value=state(card).text;built++;}catch(e){/* Keep the panel's missing-prompt status visible. */}}
});all();saveCurrent();window.dispatchEvent(new Event('ld:video-mode-changed'));showToast((mode==='text'?'Text-to-Video':'Image-to-Video')+' applied to all '+cards.length+' panels'+(built?' · '+built+' prompts built':''));}
function rebuildAll(force){
 if(!ready())return 0;
 var count=0;
 panelCards().forEach(function(card){
   if(state(card).mode==='text'&&(force||!valid(card))){
     rebuildTextPrompt(card);
     count++;
   }
 });
 return count;
}
function resignAll(){
 var count=0;
 panelCards().forEach(function(card){
   if(state(card).mode==='text'&&completeTextPrompt(state(card).text)){
     card.dataset.textVideoSignature=signature(card);
     count++;
   }
 });
 // Signature refresh is metadata-only: prompts, narration, scenes and DONE checks stay untouched.
 saveCurrent();
 return count;
}
function sanitizeSceneForMode(value){
 var s=String(value||'').trim();
 if(style()==='real'){
   s=s.replace(/serious 2D historical graphic-novel\/anime animation/gi,'photorealistic historical documentary recreation')
      .replace(/serious 2D historical anime \/ graphic-novel visual world/gi,'photorealistic historical live-action documentary world')
      .replace(/historical-anime documentary shot/gi,'historical documentary shot')
      .replace(/historical anime documentary-style/gi,'historical documentary')
      .replace(/historical anime scene/gi,'historical live-action scene')
      .replace(/\b2D historical anime\b/gi,'photorealistic historical live-action')
      .replace(/\banime adult characters\b/gi,'real adult humans');
 }else{
   s=s.replace(/photorealistic REAL HUMAN historical documentary recreation/gi,'serious 2D historical graphic-novel/anime animation')
      .replace(/photorealistic historical live-action documentary world/gi,'serious 2D historical anime / graphic-novel visual world')
      .replace(/historical live-action documentary shot/gi,'historical anime documentary-style shot')
      .replace(/historical live-action scene/gi,'historical anime scene')
      .replace(/\bphotorealistic historical live-action\b/gi,'2D historical anime')
      .replace(/\breal adult humans\b/gi,'grounded adult characters');
 }
 return s.replace(/\s{2,}/g,' ').trim();
}
function hardResetVisualMode(){
 var cards=panelCards();
 var rebuilt=0;
 refreshAutoDnaUi();
 cards.forEach(function(card){
   var special=eventPanel(card.dataset.stage);
   var scene=special&&special.scene?special.scene:sanitizeSceneForMode(state(card).scene||sceneFrom(card));
   card.dataset.videoScene=clean(scene);
   var sceneField=card.querySelector('.video-scene');
   if(sceneField)sceneField.value=card.dataset.videoScene;
   card.dataset.textVideoPrompt='';
   card.dataset.textVideoSignature='';
   var textField=card.querySelector('.text-video-prompt');
   if(textField)textField.value='';
   var done=card.querySelector('.done-toggle');
   if(done)done.checked=false;
   if(ready()){
     try{
       card.dataset.textVideoPrompt=build(card);
       card.dataset.textVideoSignature=signature(card);
       if(textField)textField.value=card.dataset.textVideoPrompt;
       rebuilt++;
     }catch(e){}
   }
 });
 all();
 saveCurrent();
 window.dispatchEvent(new CustomEvent('ld:visual-mode-hard-reset',{detail:{mode:style(),rebuilt:rebuilt}}));
 return rebuilt;
}
function globalControl(){var root=document.getElementById('productionVideoMethod');if(!root){root=document.createElement('section');root.id='productionVideoMethod';root.className='video-mode-controls';root.innerHTML='<h3>Video method · P1–P14</h3><div class="production-video-buttons" role="group" aria-label="Video method for all panels"><button type="button" class="ghost" data-method="image" aria-pressed="false">Image-to-Video</button><button type="button" class="ghost" data-method="text" aria-pressed="false">Text-to-Video</button></div><p class="production-video-status" role="status"></p><p>One choice applies to every panel. Both prompt versions stay saved.</p>';var setup=document.getElementById('buildBtn').closest('section');setup.after(root);root.querySelectorAll('[data-method]').forEach(function(button){button.onclick=function(){setAllMode(button.dataset.method);};});}syncGlobalControl();}
function panel(){globalControl();var old=document.getElementById('chapterVideoContext');if(old)old.remove();if(!document.querySelector('.stage-card'))return;
var box=document.createElement('section');box.id='chapterVideoContext';box.className='video-mode-controls';box.innerHTML='<h3>HOOK → P14 shared setting</h3><p>Shared Visual DNA is generated automatically from Visual Style + Color Treatment + event year + main location. No copy-paste needed. Use Advanced override only when this chapter needs special recurring details. Build or refresh Text-to-Video prompts after changing the mode, year, location or override. Image-to-Video retains your existing prompt.</p><label>Event year<input class="video-year" inputmode="numeric" maxlength="4"></label><label>Main location<input class="video-location" placeholder="e.g. Tokyo, Japan"></label><label>Auto visual DNA<textarea class="video-auto-dna" rows="6" readonly aria-readonly="true"></textarea></label><details class="video-advanced"><summary>Advanced override (optional)</summary><label>Custom continuity details<textarea class="video-details" rows="3" placeholder="Only add special recurring character, wardrobe, building, terrain or palette details when needed."></textarea></label></details><button type="button" class="ghost build-missing-video">Build / refresh Text-to-Video prompts (P1–P14)</button><p>New prompts are for testing. Review the scene details; prompts cannot guarantee identical faces across separate generated clips.</p>';
var c=continuity();['year','location','details'].forEach(function(k){var field=box.querySelector('.video-'+k);field.value=c[k]||'';field.oninput=function(){window.ldVideoContinuity=continuity();window.ldVideoContinuity[k]=field.value;refreshAutoDnaUi(box);all();saveCurrent();if(window.LDHookChoiceSystem)window.LDHookChoiceSystem.render();};});refreshAutoDnaUi(box);
box.querySelector('.build-missing-video').onclick=function(){if(!ready())return showToast('Fill in the shared year and location first.');var refreshed=0;document.querySelectorAll('.stage-card').forEach(function(card){if(supports(card)&&!valid(card)){generate(card);refreshed++;}});syncGlobalControl();showToast(refreshed?refreshed+' Text-to-Video prompts built/refreshed.':'All Text-to-Video prompts are already current.');};
document.getElementById('stages').before(box);}
function all(){document.querySelectorAll('.stage-card').forEach(function(card){decorate(card);update(card);});syncGlobalControl();}
window.LDVideoModes={version:'3.40.1',supports:supports,state:state,defaults:defaults,lock:lock,generatedVisualDna:generatedVisualDna,effectiveVisualDna:effectiveVisualDna,absoluteStyleLock:absoluteStyleLock,sanitizeSceneForStyle:sanitizeSceneForStyle,promptStyleCompatible:promptStyleCompatible,qualityPromptCompatible:qualityPromptCompatible,antiClonePromptCompatible:antiClonePromptCompatible,cinematicMasterLock:cinematicMasterLock,characterDiversityLock:characterDiversityLock,cameraDirector:cameraDirector,weatherContinuityLock:weatherContinuityLock,audioDirector:audioDirector,withLock:withLock,build:build,signature:signature,valid:valid,completionReady:completionReady,completionIssue:completionIssue,prompt:prompt,all:all,setAllMode:setAllMode,selectedMode:selectedMode,rebuildAll:rebuildAll,hardResetVisualMode:hardResetVisualMode,colorMode:colorMode,monochromeRequired:monochromeRequired,textOnlyAccuracyLock:textOnlyAccuracyLock,rockyMountainLocustPanel:rockyMountainLocustPanel,lituyaCause:lituyaCause,nargisPanel:nargisPanel,triStateTornadoPanel:triStateTornadoPanel,eventPanel:eventPanel,progression:progression,progressionLock:progressionLock,resignAll:resignAll};
var css=document.createElement('style');css.textContent='.video-mode-controls{padding:14px;margin:14px 0;border:1px solid #455365;border-radius:12px}#chapterVideoContext{border:3px solid #ff3b30!important;box-shadow:0 0 0 2px rgba(255,59,48,.18)!important}.video-mode-controls label{display:block;margin:10px 0}.video-mode-controls input,.video-mode-controls textarea{display:block;width:100%;box-sizing:border-box}.video-mode-controls p{font-size:.85rem;opacity:.8}.production-video-buttons{display:flex;gap:10px;flex-wrap:wrap}.production-video-buttons button{flex:1;min-width:140px}.production-video-buttons [aria-pressed=true]{background:#244837;border-color:#65c28d;color:#fff}.stage-card [hidden]{display:none!important}';document.head.appendChild(css);
window.addEventListener('ld:production-built',function(){panel();all();});document.addEventListener('change',function(e){if(e.target.matches('#visualMode,#format')){refreshAutoDnaUi();all();saveCurrent();if(window.LDHookChoiceSystem)window.LDHookChoiceSystem.render();}});document.addEventListener('input',function(e){if(e.target.matches('.image-prompt,.narration')){var card=e.target.closest('.stage-card');if(card&&supports(card)){var field=card.querySelector('.video-scene');if(field&&!state(card).scene)field.value=sceneFrom(card);update(card);}}});
new MutationObserver(function(){globalControl();all();}).observe(document.getElementById('stages'),{childList:true});panel();all();setTimeout(all,700);
})();


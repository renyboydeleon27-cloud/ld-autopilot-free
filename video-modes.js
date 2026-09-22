/* LD AUTO v3.25.0 — approved Lituya + Cyclone Nargis production locks + Production DNA Engine. */
(function(){'use strict';
const T2V_POLICY_VERSION='3.25.0-nargis-approved-v1';
function supports(card){return /^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage);}
function current(){return document.getElementById('projectTitle').textContent;}
function style(){return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?'real':'anime';}
function format(){return document.getElementById('format').value;}
function state(card){return {mode:card.dataset.videoMode||'image',text:card.dataset.textVideoPrompt||'',scene:card.dataset.videoScene||'',signature:card.dataset.textVideoSignature||''};}
function defaults(topic){var year=(topic.match(/\b(?:1\d{3}|20\d{2}|2100)\b/)||[])[0]||'';return {year:year,location:'',details:''};}
function continuity(){return Object.assign(defaults(current()),window.ldVideoContinuity||{});}
function ready(){var c=continuity();return /^\d{4}$/.test(c.year)&&!!c.location.trim();}
function monochromeRequired(){return style()==='real';}
function universalHookDna(){
 if(style()!=='real')return '';
 return 'UNIVERSAL APPROVED HOOK DNA:\nSTRICT true black-and-white grayscale.\nNo color.\nNo sepia.\nNo tint.\nNo selective color.\nPhotorealistic historical live-action.\nArchival documentary / newsreel capture.\nSoft optical detail.\nOrganic film grain.\nSlight gate weave.\nRestrained exposure flicker.\nSame visual world as the approved HOOK for the current episode.\nBLACK-AND-WHITE PRIORITY: The entire 10-second shot must remain true grayscale from start to finish. No colorization or color returning in skin, clothing, sky, water, vegetation, fire, lightning, debris or any other visible element. If any inherited instruction conflicts with this monochrome rule, ignore that conflicting color instruction.';
}
function cleanLocation(value){
 var s=String(value||'').trim();
 s=s.replace(/\bYEAR\s*:\s*\d{4}\b/gi,'').replace(/\bLOCATION\s*:\s*/gi,'').replace(/^[\s,;:\-]+|[\s,;:\-]+$/g,'').replace(/\s{2,}/g,' ');
 return s;
}
function lock(){
 var c=continuity();
 var location=cleanLocation(c.location)||'UNCONFIRMED — specify the chapter location';
 return 'CHAPTER CONTINUITY LOCK:\nEvent: '+current()+'.\nEvent year: '+(c.year||'UNCONFIRMED')+'.\nMain location: '+location+'.\nThe universal visual DNA above controls capture style only. Clothing, architecture, crops, terrain, transport, utilities, tools and technology must match this event and location. '+(c.details?'Shared visual details: '+c.details+'\n':'')+'Use the same chapter visual world from HOOK through P14, with distinct sublocations and camera views. P1 returns to normal life before the event; later panels follow their own historical time and narrative beat. Recovery or wider-impact panels may change date or location only when explicitly established by that panel. Never carry peak destruction into a pre-disaster scene. Keep recurring adult appearance and wardrobe consistent when adults are present. No invented historical facts.\nEND CHAPTER CONTINUITY LOCK.';
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
function withLock(prompt){
 var base=stripColorConflicts(stripLock(prompt));
 if(!ready())return base;
 return base+'\n\n'+(universalHookDna()?universalHookDna()+'\n\n':'')+lock();
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
function eventPanel(stage){
 return nargisPanel(stage)||lituyaCause(stage);
}
function clean(value){return window.ldCleanNarrationInstructions?window.ldCleanNarrationInstructions(value):String(value||'').trim();}
function normalizedSignature(value){try{var parts=JSON.parse(value);if(parts[0]!==T2V_POLICY_VERSION)return '';parts[5]=clean(parts[5]);parts[6]=clean(parts[6]);return JSON.stringify(parts);}catch(e){return '';}}
function pinScene(card){if(!state(card).scene)card.dataset.videoScene=clean(sceneFrom(card));}
function signature(card){var dna=window.LDProductionDNA?.signature?.()||'';return JSON.stringify([T2V_POLICY_VERSION,current(),format(),style(),continuity(),clean(sceneFrom(card)),clean(card.querySelector('.narration').value),dna]);}
function build(card){
 var scene=cleanSceneText(sceneFrom(card));
 if(!scene)throw Error('Add the panel scene description first.');
 if(!ready())throw Error('Set the shared year and location before creating Text-to-Video prompts.');
 var stage=card.dataset.stage;
 var special=eventPanel(stage);
 if(special&&special.scene)scene=special.scene;
 var scientific=special?!!special.scientific:scientificScene(card,scene);
 var camera=Number(stage.slice(1))%3===1?'A restrained forward tracking move with clear parallax':Number(stage.slice(1))%3===2?'A slow lateral track revealing the scene depth':'A restrained push-in toward the principal action';
 var modeLine=style()==='real'
   ? (scientific?'Photorealistic historical documentary explanatory visualization. This is a scientific cutaway, not an eyewitness human-camera scene. No anime or illustration.':'Photorealistic REAL HUMAN historical documentary recreation. No anime or illustration.')
   : 'Serious 2D historical graphic-novel/anime animation. No live action.';
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
 if(special&&special.extraNegative)negative+=' '+special.extraNegative;
 var result='VIDEO PROMPT — EXACTLY 10 SECONDS\n'+current()+' · '+stage+'\n\n'
   +(universalHookDna()?universalHookDna()+'\n\n':'')
   +'TEXT-TO-VIDEO. Create the entire scene from this description. No reference image is required. '+(format()==='shorts'?'Portrait 9:16.':'Landscape 16:9.')+' One continuous shot. '+modeLine
   +'\n\n'+lock()
   +'\n\nPANEL SCENE:\n'+scene
   +'\n\nNARRATIVE CONTEXT — not spoken, not on screen:\n'+(special&&special.narrative?special.narrative:(card.querySelector('.narration').value.trim()||'Follow this panel scene only; do not invent narration or statistics.'))
   +'\n\nTIMING:\n'+timing
   +'\n\nCAMERA:\n'+(special&&special.camera?special.camera:(camera+'. Fixed focal length, natural depth and occlusion. Never pass through solid objects unnaturally. No cuts, transitions, orbit or time-lapse. This panel uses its own camera behavior; the HOOK’s forward-charge behavior does not automatically apply here.'))
   +'\n\nPHYSICS AND TIME:\n'+physics
   +'\n\nAUDIO:\n'+audio
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
 card.dataset.textVideoPrompt=text;
 card.dataset.textVideoSignature=signature(card);
 var ta=card.querySelector('.text-video-prompt');
 if(ta)ta.value=text;
 saveCurrent();
 update(card);
 syncGlobalControl();
 return text;
}
function valid(card){return completeTextPrompt(state(card).text)&&normalizedSignature(state(card).signature)===signature(card)&&ready();}
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
function setAllMode(mode){if(mode!=='image'&&mode!=='text')return;var cards=panelCards();if(!cards.length)return;
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
function globalControl(){var root=document.getElementById('productionVideoMethod');if(!root){root=document.createElement('section');root.id='productionVideoMethod';root.className='video-mode-controls';root.innerHTML='<h3>Video method · P1–P14</h3><div class="production-video-buttons" role="group" aria-label="Video method for all panels"><button type="button" class="ghost" data-method="image" aria-pressed="false">Image-to-Video</button><button type="button" class="ghost" data-method="text" aria-pressed="false">Text-to-Video</button></div><p class="production-video-status" role="status"></p><p>One choice applies to every panel. Both prompt versions stay saved.</p>';var setup=document.getElementById('buildBtn').closest('section');setup.after(root);root.querySelectorAll('[data-method]').forEach(function(button){button.onclick=function(){setAllMode(button.dataset.method);};});}syncGlobalControl();}
function panel(){globalControl();var old=document.getElementById('chapterVideoContext');if(old)old.remove();if(!document.querySelector('.stage-card'))return;
var box=document.createElement('section');box.id='chapterVideoContext';box.className='video-mode-controls';box.innerHTML='<h3>HOOK → P14 shared setting</h3><p>Use one year, main location and visual description for both video methods. Build or refresh Text-to-Video prompts after era/context changes. Image-to-Video retains your existing prompt.</p><label>Event year<input class="video-year" inputmode="numeric" maxlength="4"></label><label>Main location<input class="video-location" placeholder="e.g. Tokyo, Japan"></label><label>Shared visual details<textarea class="video-details" rows="3" placeholder="Recurring adult appearance and wardrobe, buildings, crops, terrain, palette. Add panel-specific time changes in each scene."></textarea></label><button type="button" class="ghost build-missing-video">Build / refresh Text-to-Video prompts (P1–P14)</button><p>New prompts are for testing. Review the scene details; prompts cannot guarantee identical faces across separate generated clips.</p>';
var c=continuity();['year','location','details'].forEach(function(k){var field=box.querySelector('.video-'+k);field.value=c[k]||'';field.oninput=function(){window.ldVideoContinuity=continuity();window.ldVideoContinuity[k]=field.value;all();saveCurrent();if(window.LDHookChoiceSystem)window.LDHookChoiceSystem.render();};});
box.querySelector('.build-missing-video').onclick=function(){if(!ready())return showToast('Fill in the shared year and location first.');var refreshed=0;document.querySelectorAll('.stage-card').forEach(function(card){if(supports(card)&&!valid(card)){generate(card);refreshed++;}});syncGlobalControl();showToast(refreshed?refreshed+' Text-to-Video prompts built/refreshed.':'All Text-to-Video prompts are already current.');};
document.getElementById('stages').before(box);}
function all(){document.querySelectorAll('.stage-card').forEach(function(card){decorate(card);update(card);});syncGlobalControl();}
window.LDVideoModes={supports:supports,state:state,defaults:defaults,lock:lock,withLock:withLock,build:build,signature:signature,valid:valid,completionReady:completionReady,completionIssue:completionIssue,prompt:prompt,all:all,setAllMode:setAllMode,selectedMode:selectedMode,rebuildAll:rebuildAll,lituyaCause:lituyaCause,nargisPanel:nargisPanel,eventPanel:eventPanel};
var css=document.createElement('style');css.textContent='.video-mode-controls{padding:14px;margin:14px 0;border:1px solid #455365;border-radius:12px}#chapterVideoContext{border:3px solid #ff3b30!important;box-shadow:0 0 0 2px rgba(255,59,48,.18)!important}.video-mode-controls label{display:block;margin:10px 0}.video-mode-controls input,.video-mode-controls textarea{display:block;width:100%;box-sizing:border-box}.video-mode-controls p{font-size:.85rem;opacity:.8}.production-video-buttons{display:flex;gap:10px;flex-wrap:wrap}.production-video-buttons button{flex:1;min-width:140px}.production-video-buttons [aria-pressed=true]{background:#244837;border-color:#65c28d;color:#fff}.stage-card [hidden]{display:none!important}';document.head.appendChild(css);
window.addEventListener('ld:production-built',function(){panel();all();});document.addEventListener('change',function(e){if(e.target.matches('#visualMode,#format')){all();saveCurrent();}});document.addEventListener('input',function(e){if(e.target.matches('.image-prompt,.narration')){var card=e.target.closest('.stage-card');if(card&&supports(card)){var field=card.querySelector('.video-scene');if(field&&!state(card).scene)field.value=sceneFrom(card);update(card);}}});
new MutationObserver(function(){globalControl();all();}).observe(document.getElementById('stages'),{childList:true});panel();all();setTimeout(all,700);
})();


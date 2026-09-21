/* LD AUTO v3.22.8 — universal B&W HOOK DNA + Lituya 1958 cause-chain lock. */
(function(){'use strict';
const T2V_POLICY_VERSION='3.22.8-lituya-cause-chain-v1';
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
  P2:{
   scientific:true,
   scene:'A restrained scientific documentary cross-section of the Fairweather Fault zone near Lituya Bay. Show rock masses under increasing tectonic stress and the beginning of fault rupture. The geology strains and shifts subtly, but nothing collapses into the sea. This panel explains the earthquake source only; no seabed cave-in, no underwater landslide, no mountain rockslide, and no tsunami yet.',
   narrative:'Tectonic stress along the Fairweather Fault reaches a critical point, and the earthquake rupture begins.',
   extraNegative:'No seabed cave-in, no underwater landslide, no giant underground collapse, no mountain rockslide yet, no visible tsunami, no fantasy glowing cracks.'
  },
  P3:{
   scientific:false,
   scene:'The earthquake reaches the Lituya Bay region. The bay shoreline, steep mountain walls, trees, loose rock and period-appropriate structures or boats shake violently under strong seismic motion. Show the earthquake itself affecting the landscape, but do not begin the major rockslide yet and do not show the megatsunami yet.',
   narrative:'Strong earthquake shaking strikes the Lituya Bay region and destabilizes the steep terrain around the head of the bay.',
   extraNegative:'No major rockslide yet, no megatsunami yet, no seabed collapse as the tsunami source.'
  },
  P4:{
   scientific:false,
   scene:'At the head of Lituya Bay, the steep mountainside begins to fail under the earthquake shaking. Cracks widen, loose rock breaks free, trees and surface material shift downslope, and the slope becomes visibly unstable. Build tension toward a catastrophic rockslide, but do not send the full rock mass into the water yet.',
   narrative:'The earthquake destabilizes the steep mountainside at the head of Lituya Bay.',
   extraNegative:'No full rockslide impact yet, no megatsunami yet, no underwater landslide as the primary cause.'
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
function clean(value){return window.ldCleanNarrationInstructions?window.ldCleanNarrationInstructions(value):String(value||'').trim();}
function normalizedSignature(value){try{var parts=JSON.parse(value);if(parts[0]!==T2V_POLICY_VERSION)return '';parts[5]=clean(parts[5]);parts[6]=clean(parts[6]);return JSON.stringify(parts);}catch(e){return '';}}
function pinScene(card){if(!state(card).scene)card.dataset.videoScene=clean(sceneFrom(card));}
function signature(card){return JSON.stringify([T2V_POLICY_VERSION,current(),format(),style(),continuity(),clean(sceneFrom(card)),clean(card.querySelector('.narration').value)]);}
function build(card){
 var scene=cleanSceneText(sceneFrom(card));
 if(!scene)throw Error('Add the panel scene description first.');
 if(!ready())throw Error('Set the shared year and location before creating Text-to-Video prompts.');
 var stage=card.dataset.stage;
 var lituya=lituyaCause(stage);
 if(lituya)scene=lituya.scene;
 var scientific=lituya?!!lituya.scientific:scientificScene(card,scene);
 var camera=Number(stage.slice(1))%3===1?'A restrained forward tracking move with clear parallax':Number(stage.slice(1))%3===2?'A slow lateral track revealing the scene depth':'A restrained push-in toward the principal action';
 var modeLine=style()==='real'
   ? (scientific?'Photorealistic historical documentary explanatory visualization. This is a scientific cutaway, not an eyewitness human-camera scene. No anime or illustration.':'Photorealistic REAL HUMAN historical documentary recreation. No anime or illustration.')
   : 'Serious 2D historical graphic-novel/anime animation. No live action.';
 var timing=scientific
   ? '0.0–2.0s: Establish the geological or scientific setting and the focal mechanism clearly; readable natural motion begins within the first half-second.\n2.0–7.0s: Continue the same mechanism with restrained, coherent cause-and-effect motion at plausible scale.\n7.0–10.0s: Sustain the buildup or explanatory beat and end on a clear readable composition without jumping to the next story stage.'
   : '0.0–2.0s: Establish the described setting, visible adult positions when adults are present, and one clear focal action; readable natural motion begins within the first half-second.\n2.0–7.0s: Continue that same action with coherent cause and effect, natural momentum and local environmental response.\n7.0–10.0s: Sustain the panel’s intended beat and finish on a readable composition; do not jump to the next story stage.';
 var physics=scientific
   ? 'This panel is an explanatory scientific visualization. Do not depict invisible subsurface processes as ordinary eyewitness footage. Keep the mechanism grounded, restrained and physically plausible. No fantasy energy, glowing magic cracks or exaggerated sci-fi effects. Preserve plausible geological scale and cause-and-effect.'
   : 'Only the selected disaster mechanism belongs here. Calm scenes stay calm. Slow-onset effects are already present; no instant infection, starvation, crop death or insect reproduction. Preserve object count, human identity when people are present, and plausible scale throughout the clip.';
 var audio=scientific
   ? 'Restrained natural documentary ambience appropriate to the mechanism, such as low underwater rumble, rock strain or deep-earth vibration when supported by the scene. No voiceover or music.'
   : 'Natural scene-specific ambience and SFX only. No voiceover or music.';
 var negative=scientific
   ? 'No children, gore, human figures unless the panel specifically requires them, fantasy energy, glowing sci-fi fault lines, unsupported destruction, unrelated disaster, modern objects outside the era, text, captions, logos or watermark.'
   : 'No children, gore, duplicated people, distorted anatomy, morphing, giant insects, unsupported destruction, unrelated disaster, modern objects outside the era, text, captions, logos or watermark.';
 if(lituya&&lituya.extraNegative)negative+=' '+lituya.extraNegative;
 return 'VIDEO PROMPT — EXACTLY 10 SECONDS\n'+current()+' · '+stage+'\n\n'
   +(universalHookDna()?universalHookDna()+'\n\n':'')
   +'TEXT-TO-VIDEO. Create the entire scene from this description. No reference image is required. '+(format()==='shorts'?'Portrait 9:16.':'Landscape 16:9.')+' One continuous shot. '+modeLine
   +'\n\n'+lock()
   +'\n\nPANEL SCENE:\n'+scene
   +'\n\nNARRATIVE CONTEXT — not spoken, not on screen:\n'+(lituya?lituya.narrative:(card.querySelector('.narration').value.trim()||'Follow this panel scene only; do not invent narration or statistics.'))
   +'\n\nTIMING:\n'+timing
   +'\n\nCAMERA:\n'+camera+'. Fixed focal length, natural depth and occlusion. Never pass through solid objects unnaturally. No cuts, transitions, orbit or time-lapse. This panel uses its own camera behavior; the HOOK’s forward-charge behavior does not automatically apply here.'
   +'\n\nPHYSICS AND TIME:\n'+physics
   +'\n\nAUDIO:\n'+audio
   +'\n\nNEGATIVE:\n'+negative
   +'\n\nSTATUS: FOR TESTING — review historical details and rendered continuity before approval.';
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
function prompt(card){
 if(supports(card)&&state(card).mode==='text'){
   if(!valid(card))return rebuildTextPrompt(card);
   return state(card).text;
 }
 var base=card.querySelector('.flow-prompt').value;
 if(!base.trim())throw Error('This panel has no Image-to-Video prompt yet.');
 return withLock(base);
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
function globalControl(){var root=document.getElementById('productionVideoMethod');if(!root){root=document.createElement('section');root.id='productionVideoMethod';root.className='video-mode-controls';root.innerHTML='<h3>Video method · P1–P14</h3><div class="production-video-buttons" role="group" aria-label="Video method for all panels"><button type="button" class="ghost" data-method="image" aria-pressed="false">Image-to-Video</button><button type="button" class="ghost" data-method="text" aria-pressed="false">Text-to-Video</button></div><p class="production-video-status" role="status"></p><p>One choice applies to every panel. Both prompt versions stay saved.</p>';var setup=document.getElementById('buildBtn').closest('section');setup.after(root);root.querySelectorAll('[data-method]').forEach(function(button){button.onclick=function(){setAllMode(button.dataset.method);};});}syncGlobalControl();}
function panel(){globalControl();var old=document.getElementById('chapterVideoContext');if(old)old.remove();if(!document.querySelector('.stage-card'))return;
var box=document.createElement('section');box.id='chapterVideoContext';box.className='video-mode-controls';box.innerHTML='<h3>HOOK → P14 shared setting</h3><p>Use one year, main location and visual description for both video methods. Build or refresh Text-to-Video prompts after era/context changes. Image-to-Video retains your existing prompt.</p><label>Event year<input class="video-year" inputmode="numeric" maxlength="4"></label><label>Main location<input class="video-location" placeholder="e.g. Tokyo, Japan"></label><label>Shared visual details<textarea class="video-details" rows="3" placeholder="Recurring adult appearance and wardrobe, buildings, crops, terrain, palette. Add panel-specific time changes in each scene."></textarea></label><button type="button" class="ghost build-missing-video">Build / refresh Text-to-Video prompts (P1–P14)</button><p>New prompts are for testing. Review the scene details; prompts cannot guarantee identical faces across separate generated clips.</p>';
var c=continuity();['year','location','details'].forEach(function(k){var field=box.querySelector('.video-'+k);field.value=c[k]||'';field.oninput=function(){window.ldVideoContinuity=continuity();window.ldVideoContinuity[k]=field.value;all();saveCurrent();if(window.LDHookChoiceSystem)window.LDHookChoiceSystem.render();};});
box.querySelector('.build-missing-video').onclick=function(){if(!ready())return showToast('Fill in the shared year and location first.');var refreshed=0;document.querySelectorAll('.stage-card').forEach(function(card){if(supports(card)&&!valid(card)){generate(card);refreshed++;}});syncGlobalControl();showToast(refreshed?refreshed+' Text-to-Video prompts built/refreshed.':'All Text-to-Video prompts are already current.');};
document.getElementById('stages').before(box);}
function all(){document.querySelectorAll('.stage-card').forEach(function(card){decorate(card);update(card);});syncGlobalControl();}
window.LDVideoModes={supports:supports,state:state,defaults:defaults,lock:lock,withLock:withLock,build:build,signature:signature,valid:valid,prompt:prompt,all:all,setAllMode:setAllMode,selectedMode:selectedMode,lituyaCause:lituyaCause};
var css=document.createElement('style');css.textContent='.video-mode-controls{padding:14px;margin:14px 0;border:1px solid #455365;border-radius:12px}#chapterVideoContext{border:3px solid #ff3b30!important;box-shadow:0 0 0 2px rgba(255,59,48,.18)!important}.video-mode-controls label{display:block;margin:10px 0}.video-mode-controls input,.video-mode-controls textarea{display:block;width:100%;box-sizing:border-box}.video-mode-controls p{font-size:.85rem;opacity:.8}.production-video-buttons{display:flex;gap:10px;flex-wrap:wrap}.production-video-buttons button{flex:1;min-width:140px}.production-video-buttons [aria-pressed=true]{background:#244837;border-color:#65c28d;color:#fff}.stage-card [hidden]{display:none!important}';document.head.appendChild(css);
window.addEventListener('ld:production-built',function(){panel();all();});document.addEventListener('change',function(e){if(e.target.matches('#visualMode,#format')){all();saveCurrent();}});document.addEventListener('input',function(e){if(e.target.matches('.image-prompt,.narration')){var card=e.target.closest('.stage-card');if(card&&supports(card)){var field=card.querySelector('.video-scene');if(field&&!state(card).scene)field.value=sceneFrom(card);update(card);}}});
new MutationObserver(function(){globalControl();all();}).observe(document.getElementById('stages'),{childList:true});panel();all();setTimeout(all,700);
})();


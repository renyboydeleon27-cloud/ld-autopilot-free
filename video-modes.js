/* LD AUTO v3.20.3 — separate per-panel video prompts with strict pre-1930 monochrome refresh. */
(function(){'use strict';
const T2V_POLICY_VERSION='3.20.3-monochrome-v1';
function supports(card){return /^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage);}
function current(){return document.getElementById('projectTitle').textContent;}
function style(){return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?'real':'anime';}
function format(){return document.getElementById('format').value;}
function state(card){return {mode:card.dataset.videoMode||'image',text:card.dataset.textVideoPrompt||'',scene:card.dataset.videoScene||'',signature:card.dataset.textVideoSignature||''};}
function defaults(topic){var year=(topic.match(/\b(?:1\d{3}|20\d{2}|2100)\b/)||[])[0]||'';return {year:year,location:'',details:''};}
function continuity(){return Object.assign(defaults(current()),window.ldVideoContinuity||{});}
function ready(){var c=continuity();return /^\d{4}$/.test(c.year)&&!!c.location.trim();}
function monochromeRequired(){var c=continuity();var y=Number(c.year)||0;return style()==='real'&&y>0&&y<=1929;}
function monochromeDirective(){
 if(!monochromeRequired())return '';
 return 'HIGH-PRIORITY MONOCHROME FORMAT LOCK: THIS ENTIRE 10-SECOND VIDEO MUST BE TRUE BLACK-AND-WHITE GRAYSCALE FROM FRAME 1 THROUGH FRAME 240. ZERO COLOR AT ANY TIME. ZERO SEPIA. ZERO TINT. ZERO SELECTIVE COLOR. ZERO COLORIZATION. Skin, clothing, wood, sky, water, vegetation, fire, lightning, debris and every other visible element must remain grayscale. This is a hard rendering-format requirement, not a suggestion or post-production option. If any other instruction implies natural color, colored lighting, warm/cool color, or period color, IGNORE THAT CONFLICTING COLOR INSTRUCTION and keep the whole shot monochrome.';
}
function lock(){var c=continuity();var look=style()==='real'&&window.LDEraCapture?window.LDEraCapture.eraForYear(Number(c.year)||null).look:'Serious colored historical 2D graphic-novel/anime; hand-inked outlines and cel-painted textures. No photorealism or live action.';
return 'CHAPTER CONTINUITY LOCK:\nEvent: '+current()+'. Event year: '+(c.year||'UNCONFIRMED')+'. Main location: '+(c.location||'UNCONFIRMED — specify the chapter location')+'.\n'+(monochromeDirective()?monochromeDirective()+'\n':'')+look+'\nThe recording appearance affects only the capture treatment. Clothing, architecture, crops, terrain, transport, utilities, tools and technology must match this event and location. '+(c.details?'Shared visual details: '+c.details+'\n':'')+'Use the same chapter visual world from HOOK through P14, with distinct sublocations and camera views. P1 returns to normal life before the event; later panels follow their own historical time and narrative beat. Recovery or wider-impact panels may change date or location only when explicitly established by that panel. Never carry peak destruction into a pre-disaster scene. Keep recurring adult appearance and wardrobe consistent with the shared visual details. No invented historical facts.\nEND CHAPTER CONTINUITY LOCK.';}
function stripLock(s){return String(s||'').replace(/\s*CHAPTER CONTINUITY LOCK:[\s\S]*?END CHAPTER CONTINUITY LOCK\./g,'').trim();}
function stripColorConflicts(prompt){
 var c=continuity(),year=Number(c.year)||0,s=String(prompt||'');
 if(style()==='real'&&year&&year<=1929){
   s=s.replace(/Natural color and believable lighting\.?/gi,'STRICT BLACK-AND-WHITE grayscale only.')
      .replace(/\bnatural color\b/gi,'black-and-white grayscale')
      .replace(/\bfull color\b/gi,'black-and-white grayscale')
      .replace(/\bcolored\b/gi,'monochrome');
 }
 return s;
}
function withLock(prompt){return ready()?stripColorConflicts(stripLock(prompt))+'\n\n'+lock():stripColorConflicts(String(prompt||''));}
function sceneFrom(card){var existing=state(card).scene;if(existing)return existing;
var image=card.querySelector('.image-prompt').value||'';
image=image.replace(/ERA-AWARE CAPTURE LOCK:[\s\S]*?END ERA LOCK\.?/gi,'');
// The opening scene description precedes the renderer/style locks in existing packs.
image=image.split(/Serious colored|Cinematic historical live-action realism|COMPOSITION LOCK:|SCENE VARIETY LOCK:/i)[0];
image=image.replace(/^Create\s+(?:the Living Disaster Book\s+)?(?:P\d+)\s+(?:illustration|live-action historical frame)\s+for\s+[^.]*\./i,'').replace(/\b(?:portrait 9:16|landscape 16:9)\.?/gi,'').trim();
return image||card.querySelector('.narration').value.trim();}
function clean(value){return window.ldCleanNarrationInstructions?window.ldCleanNarrationInstructions(value):String(value||'').trim();}
function normalizedSignature(value){try{var parts=JSON.parse(value);if(parts[0]!==T2V_POLICY_VERSION)return '';parts[5]=clean(parts[5]);parts[6]=clean(parts[6]);return JSON.stringify(parts);}catch(e){return '';}}
function pinScene(card){if(!state(card).scene)card.dataset.videoScene=clean(sceneFrom(card));}
function signature(card){return JSON.stringify([T2V_POLICY_VERSION,current(),format(),style(),continuity(),clean(sceneFrom(card)),clean(card.querySelector('.narration').value)]);}
function build(card){var scene=sceneFrom(card);if(!scene)throw Error('Add the panel scene description first.');if(!ready())throw Error('Set the shared year and location before creating Text-to-Video prompts.');
var stage=card.dataset.stage;var camera=Number(stage.slice(1))%3===1?'A restrained forward tracking move with clear parallax':Number(stage.slice(1))%3===2?'A slow lateral track revealing the scene depth':'A restrained push-in toward the principal action';
return 'VIDEO PROMPT — EXACTLY 10 SECONDS\n'+current()+' · '+stage+'\n\n'+(monochromeDirective()?monochromeDirective()+'\n\n':'')+'TEXT-TO-VIDEO. Create the entire scene from this description. No reference image is required. '+(format()==='shorts'?'Portrait 9:16.':'Landscape 16:9.')+' One continuous shot. '+(style()==='real'?'Photorealistic REAL HUMAN historical documentary recreation. No anime or illustration.':'Serious 2D historical graphic-novel/anime animation. No live action.')+'\n\n'+lock()+'\n\nPANEL SCENE:\n'+scene+'\n\nNARRATIVE CONTEXT — not spoken, not on screen:\n'+(card.querySelector('.narration').value.trim()||'Follow this panel scene only; do not invent narration or statistics.')+'\n\nTIMING:\n0.0–2.0s: Establish the described setting, adult positions and one clear focal action; readable natural motion begins within the first half-second.\n2.0–7.0s: Continue that same action with coherent cause and effect, natural momentum and local environmental response.\n7.0–10.0s: Sustain the panel’s intended beat and finish on a readable composition; do not jump to the next story stage.\n\nCAMERA:\n'+camera+'. Fixed focal length, natural depth and occlusion. Never pass through solid objects. No cuts, transitions, orbit or time-lapse. This panel uses its own camera behavior; the HOOK’s six-second forward-charge rule does not automatically apply here.\n\nPHYSICS AND TIME:\nOnly the selected disaster mechanism belongs here. Calm scenes stay calm; cause/explanation scenes must not depict invisible processes as ordinary camera footage. For a scientific cutaway, make it an explicitly separate explanatory visualization consistent with the chapter palette, with no fabricated eyewitness viewpoint. Slow-onset effects are already present; no instant infection, starvation, crop death or insect reproduction. Preserve object count, human identity and plausible scale throughout the clip.\n\nAUDIO:\nNatural scene-specific ambience and SFX only. No voiceover or music.\n\nNEGATIVE:\nNo children, gore, duplicated people, distorted anatomy, morphing, giant insects, unsupported destruction, unrelated disaster, modern objects outside the era, text, captions, logos or watermark.\n\nSTATUS: FOR TESTING — review historical details and rendered continuity before approval.';}
function generate(card){try{pinScene(card);var text=build(card);card.dataset.textVideoPrompt=text;card.dataset.textVideoSignature=signature(card);var ta=card.querySelector('.text-video-prompt');if(ta)ta.value=text;saveCurrent();update(card);syncGlobalControl();}catch(e){showToast(e.message);}}
function valid(card){return !!state(card).text&&normalizedSignature(state(card).signature)===signature(card)&&ready();}
function prompt(card){if(supports(card)&&state(card).mode==='text'){if(!valid(card))throw Error('Rebuild this Text-to-Video prompt after setting the chapter context or editing the scene.');return state(card).text;}
return withLock(card.querySelector('.flow-prompt').value);}
function update(card){if(!supports(card))return;var mode=state(card).mode;
card.querySelector('.flow-wrap').hidden=mode==='text';
var panel=card.querySelector('.text-video-fields');if(panel)panel.hidden=mode!=='text';
var image=card.querySelector('.image-prompt').closest('.field-block');if(image)image.hidden=mode==='text';
var workspace=card.querySelector('.image-workspace');if(workspace)workspace.hidden=mode==='text';
var status=card.querySelector('.video-mode-status');var statusText=mode==='image'?'Use a starting image with the Image-to-Video prompt.':valid(card)?'Text-to-Video ready for testing · no starting image needed.':'Text-to-Video needs building or refresh. Check the shared setting and panel scene.';if(status&&status.textContent!==statusText)status.textContent=statusText;
var label=card.querySelector('.flow-wrap label');if(label&&label.textContent!=='Image-to-Video prompt')label.textContent='Image-to-Video prompt';}
function decorate(card){if(!supports(card)||card.querySelector('.video-mode-controls'))return;
// Restore the exact scene used by older saved text prompts before image helpers run.
if(state(card).text&&!state(card).scene){try{var saved=JSON.parse(state(card).signature);if(Array.isArray(saved)&&typeof saved[4]==='string')card.dataset.videoScene=clean(saved[4]);}catch(e){}}

var box=document.createElement('div');box.className='video-mode-controls';box.innerHTML='<p class="video-mode-status"></p><div class="text-video-fields"><label>Panel scene description<textarea class="video-scene" rows="4"></textarea></label><button type="button" class="ghost build-text-video">Build / refresh Text-to-Video prompt</button><label>Text-to-Video prompt<textarea class="text-video-prompt" rows="10"></textarea></label><button type="button" class="ghost copy-text-video">Copy Text-to-Video prompt</button></div>';
card.querySelector('.flow-wrap').before(box);
var scene=box.querySelector('.video-scene');scene.value=sceneFrom(card);var text=box.querySelector('.text-video-prompt');text.value=state(card).text;

scene.oninput=function(){card.dataset.videoScene=scene.value;card.querySelector('.done-toggle').checked=false;update(card);saveCurrent();};
text.oninput=function(){card.dataset.textVideoPrompt=text.value;card.querySelector('.done-toggle').checked=false;saveCurrent();};
box.querySelector('.build-text-video').onclick=function(){generate(card);};box.querySelector('.copy-text-video').onclick=function(){try{if(!valid(card))throw Error('Build / refresh this prompt first.');copyText(state(card).text);}catch(e){showToast(e.message);}};update(card);}
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
window.LDVideoModes={supports:supports,state:state,defaults:defaults,lock:lock,withLock:withLock,build:build,signature:signature,valid:valid,prompt:prompt,all:all,setAllMode:setAllMode,selectedMode:selectedMode};
var css=document.createElement('style');css.textContent='.video-mode-controls{padding:14px;margin:14px 0;border:1px solid #455365;border-radius:12px}.video-mode-controls label{display:block;margin:10px 0}.video-mode-controls input,.video-mode-controls textarea{display:block;width:100%;box-sizing:border-box}.video-mode-controls p{font-size:.85rem;opacity:.8}.production-video-buttons{display:flex;gap:10px;flex-wrap:wrap}.production-video-buttons button{flex:1;min-width:140px}.production-video-buttons [aria-pressed=true]{background:#244837;border-color:#65c28d;color:#fff}.stage-card [hidden]{display:none!important}';document.head.appendChild(css);
window.addEventListener('ld:production-built',function(){panel();all();});document.addEventListener('change',function(e){if(e.target.matches('#visualMode,#format')){all();saveCurrent();}});document.addEventListener('input',function(e){if(e.target.matches('.image-prompt,.narration')){var card=e.target.closest('.stage-card');if(card&&supports(card)){var field=card.querySelector('.video-scene');if(field&&!state(card).scene)field.value=sceneFrom(card);update(card);}}});
new MutationObserver(function(){globalControl();all();}).observe(document.getElementById('stages'),{childList:true});panel();all();setTimeout(all,700);
})();


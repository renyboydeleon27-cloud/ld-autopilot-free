/* LD AUTO v3.39.0 — Top 3 Hook Choice System with visual + color treatment sync. */
(function(){'use strict';
window.LD_HOOK_CHOICES_ENABLED=true;
var HOOK_POLICY_VERSION='3.39.0-color-treatment-v1';
var MODE_KEY='ld-auto-visual-mode-v1', ACTIVE_KEY='ld-auto-active-hook-v1';

function topic(){var input=document.getElementById('topic');var typed=(input&&input.value||'').trim();if(typed)return typed;var title=(document.getElementById('projectTitle')&&document.getElementById('projectTitle').textContent||'').trim();return title==='No production yet'?'':title;}
function format(){return /Longform/i.test(document.getElementById('modeText')&&document.getElementById('modeText').textContent||'')?'longform':'shorts';}
function mode(){var locked=window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle;if(locked==='real'||locked==='anime')return locked;return localStorage.getItem(MODE_KEY)==='real'?'real':'anime';}
function colorMode(){var locked=window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode;if(locked==='bw'||locked==='color')return locked;return mode()==='real'?'bw':'color';}
function card(){return Array.from(document.querySelectorAll('.stage-card')).find(function(c){return c.dataset.stage==='HOOK';});}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
function toast(msg){var t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove('show');},1800);}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){if(m==='&')return '&amp;';if(m==='<')return '&lt;';if(m==='>')return '&gt;';if(m==='"')return '&quot;';return '&#39;';});}
function overrideKey(){return 'ld-auto-hook-family:'+topic().toLowerCase();}
function context(){return {topic:topic(),format:format(),mode:mode(),colorMode:colorMode(),family:localStorage.getItem(overrideKey())||''};}
function choices(){var list=window.LDHookFamilyLibrary?window.LDHookFamilyLibrary.choices(context()):[];if(window.LDVideoModes)list.forEach(function(c){c.prompt=window.LDVideoModes.withLock(c.prompt);});if(window.LDProductionDNA)list.forEach(function(c){c.prompt=window.LDProductionDNA.polishHookPrompt(c.prompt);});return list;}
function getActiveRecord(){try{return JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');}catch(e){return null;}}
function matchesCurrent(x){return !!(x&&x.topic===topic()&&x.format===format()&&x.mode===mode()&&x.colorMode===colorMode()&&x.family===context().family);}
function getActive(){var x=getActiveRecord();return matchesCurrent(x)?x.id:null;}
function setActive(id){localStorage.setItem(ACTIVE_KEY,JSON.stringify({topic:topic(),format:format(),mode:mode(),colorMode:colorMode(),family:context().family,id:id,policyVersion:HOOK_POLICY_VERSION,updatedAt:new Date().toISOString()}));}
function refreshStaleActive(list){
  var x=getActiveRecord();if(!matchesCurrent(x)||!x.id||x.policyVersion===HOOK_POLICY_VERSION)return false;
  var c=list.find(function(item){return item.id===x.id;});if(!c)return false;
  var h=card(),flow=h&&h.querySelector('.flow-prompt');if(!flow)return false;
  flow.value=c.prompt;fire(flow);setActive(c.id);
  var note=h.querySelector('.stage-note');if(note)note.textContent='Active HOOK refreshed to current era/capture policy · '+c.title;
  toast('Active HOOK prompt refreshed');
  return true;
}
function useHook(c){
  var h=card();if(!h)return;
  var img=h.querySelector('.image-prompt'), flow=h.querySelector('.flow-prompt');
  if(img){img.value='TEXT-TO-VIDEO HOOK — NO STARTING IMAGE REQUIRED. Active choice: '+c.title+'. Status: '+c.status+'. Use the Flow prompt below directly.';fire(img);var l=img.closest('.field-block')&&img.closest('.field-block').querySelector('label');if(l)l.textContent='HOOK setup — text-to-video';}
  if(flow){flow.value=c.prompt;fire(flow);}
  var role=h.querySelector('.scene-role');if(role)role.textContent='ACTIVE HOOK · '+c.title+' · '+c.status;
  var note=h.querySelector('.stage-note');if(note)note.textContent='Active HOOK: '+c.title+' · '+c.status+' · text-to-video';
  setActive(c.id);render();toast(c.title+' selected');
}
function syncVisualMode(previousMode){
  var prior=getActiveRecord();
  var list=choices();
  if(!list.length){render();return null;}
  var chosen=null;
  if(prior&&prior.topic===topic()&&prior.format===format()&&prior.mode===previousMode&&prior.id){
    chosen=list.find(function(item){return item.id===prior.id;})||null;
  }
  if(!chosen){
    var activeNow=getActive();
    if(activeNow)chosen=list.find(function(item){return item.id===activeNow;})||null;
  }
  if(chosen){
    useHook(chosen);
    var h=card(),done=h&&h.querySelector('.done-toggle');if(done)done.checked=false;
    return chosen.title;
  }
  render();
  return null;
}
function syncColorMode(){
  var prior=getActiveRecord();
  var list=choices();
  if(!list.length){render();return null;}
  var chosen=prior&&prior.id?list.find(function(item){return item.id===prior.id;})||null:null;
  if(chosen){useHook(chosen);return chosen.title;}
  render();
  return null;
}
function addStyles(){
  if(document.getElementById('hookChoiceStyles'))return;
  var s=document.createElement('style');s.id='hookChoiceStyles';
  s.textContent='.hook-choice-system{margin:12px 0 16px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.035)}.hook-choice-head{margin-bottom:12px}.hook-choice-head h3{margin:0 0 4px;font-size:1rem}.hook-choice-head p{margin:0;opacity:.72;font-size:.84rem}.hook-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.hook-choice-card{padding:12px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(0,0,0,.12)}.hook-choice-card.active{outline:2px solid rgba(255,255,255,.32)}.hook-choice-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.hook-choice-badge{font-size:.68rem;font-weight:700;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.09)}.hook-choice-card h4{margin:0 0 6px;font-size:.95rem}.hook-choice-card p{margin:0 0 7px;font-size:.8rem;line-height:1.38;opacity:.84}.hook-choice-why{opacity:.66!important}.hook-choice-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.hook-choice-preview{margin-top:9px;width:100%;min-height:110px;font-size:.74rem;line-height:1.35}.hook-choice-empty{padding:12px;border:1px dashed rgba(255,255,255,.18);border-radius:12px;opacity:.72;font-size:.82rem}#locustLaundryHook{display:none!important}@media(max-width:760px){.hook-choice-grid{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}
function render(){
  addStyles();var old=document.getElementById('locustLaundryHook');if(old)old.remove();
  var h=card();if(!h){var x=document.getElementById('hookChoiceSystem');if(x)x.remove();return;}
  var root=document.getElementById('hookChoiceSystem');
  if(!root){root=document.createElement('section');root.id='hookChoiceSystem';root.className='hook-choice-system';var body=h.querySelector('.stage-body');if(body)body.prepend(root);}
  var list=choices();
  if(list.length)refreshStaleActive(list);
  if(!list.length){root.innerHTML='<div class="hook-choice-head"><h3>Top 3 HOOK Choices</h3><p>Curated hook library</p></div><div class="hook-choice-empty">No curated Top 3 hook set for <strong>'+esc(topic())+'</strong> yet. The existing HOOK remains unchanged until this disaster family is tested.</div>';return;}
  var active=getActive();
  root.innerHTML='<div class="hook-choice-head"><h3>Top 3 HOOK Choices</h3><p>'+esc(topic())+' · '+(format()==='longform'?'16:9':'9:16')+' · '+(mode()==='real'?'Real Human':'Historical Anime')+' · '+(colorMode()==='bw'?'Black & White':'Color')+'</p></div><div class="hook-choice-grid"></div>';
  var selector=document.createElement('label');
  selector.textContent='Disaster family: ';
  var select=document.createElement('select');select.setAttribute('aria-label','Disaster family');
  var auto=document.createElement('option');auto.value='';auto.textContent='Auto-detect';select.appendChild(auto);
  window.LDHookFamilyLibrary.families.forEach(function(f){var option=document.createElement('option');option.value=f.id;option.textContent=f.label;select.appendChild(option);});
  select.value=context().family;select.addEventListener('change',function(){if(select.value)localStorage.setItem(overrideKey(),select.value);else localStorage.removeItem(overrideKey());render();});
  selector.appendChild(select);root.querySelector('.hook-choice-head').appendChild(selector);
  var source=document.createElement('p');source.textContent='Showing: '+window.LDHookFamilyLibrary.families.find(function(f){return f.id===list[0].family;}).label+' · Choose a hook to replace the saved prompt. New templates require testing.';root.querySelector('.hook-choice-head').appendChild(source);
  var grid=root.querySelector('.hook-choice-grid');
  list.forEach(function(c,i){
    var el=document.createElement('article');el.className='hook-choice-card'+(active===c.id?' active':'');
    el.innerHTML='<div class="hook-choice-badges"><span class="hook-choice-badge">'+(c.rec?'RECOMMENDED':'ALTERNATIVE '+(i+1))+'</span><span class="hook-choice-badge">'+esc(c.status)+' · '+esc(c.source)+'</span></div><h4>'+esc(c.title)+'</h4><p>'+esc(c.concept)+'</p><p class="hook-choice-why"><strong>Why it fits:</strong> '+esc(c.why)+'</p><div class="hook-choice-actions"><button type="button" class="primary use-hook-btn">'+(active===c.id?'Active Hook ✓':'Use this Hook')+'</button><button type="button" class="ghost small copy-hook-btn">Copy prompt</button><button type="button" class="ghost small preview-hook-btn">Preview</button></div>';
    el.querySelector('.use-hook-btn').addEventListener('click',function(){useHook(c);});
    el.querySelector('.copy-hook-btn').addEventListener('click',function(){navigator.clipboard.writeText(c.prompt).then(function(){toast('Hook prompt copied');}).catch(function(){toast('Copy failed');});});
    el.querySelector('.preview-hook-btn').addEventListener('click',function(e){var ta=el.querySelector('.hook-choice-preview');if(ta){ta.remove();e.currentTarget.textContent='Preview';return;}ta=document.createElement('textarea');ta.className='hook-choice-preview';ta.readOnly=true;ta.value=c.prompt;el.appendChild(ta);e.currentTarget.textContent='Hide';});
    grid.appendChild(el);
  });
}
var queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){setTimeout(function(){queued=false;render();},120);});}
window.addEventListener('load',schedule);
document.addEventListener('change',function(e){if(e.target.matches('#visualMode,#format,.video-year,.video-location,.video-details,input[name="ldProjectColorMode"]'))schedule();});
window.addEventListener('ld:project-locks-changed',schedule);
var te=document.getElementById('topic');if(te)te.addEventListener('input',function(){
  try{
    var x=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');
    var now=topic();
    if(x&&x.topic!==now)localStorage.removeItem(ACTIVE_KEY);
  }catch(e){localStorage.removeItem(ACTIVE_KEY);}
  setTimeout(schedule,60);
});
document.addEventListener('click',function(e){if(e.target.closest('#buildBtn,.project-list button,.collapse-btn,#jumpStage'))schedule();});
var stages=document.getElementById('stages');if(stages)new MutationObserver(schedule).observe(stages,{childList:true});
window.LDHookChoiceSystem={render:render,choices:choices,useHook:useHook,syncVisualMode:syncVisualMode,syncColorMode:syncColorMode};
schedule();
})();


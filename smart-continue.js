/* LD AUTO v3.34.0 — SMART CONTINUE obeys PROJECT LOCKS */
(()=>{'use strict';

const stages=document.getElementById('stages');
const setup=document.querySelector('.setup');
const toast=document.getElementById('toast');
if(!stages||!setup)return;

let busy=false;

function showToast(message){
  if(!toast)return;
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t=setTimeout(()=>toast.classList.remove('show'),2200);
}
function topic(){
  const typed=document.getElementById('topic')?.value?.trim();
  if(typed)return typed;
  const title=document.getElementById('projectTitle')?.textContent?.trim();
  return title&&title!=='No production yet'?title:'';
}
function format(){return document.getElementById('format')?.value||'shorts';}
function visualMode(){
  const locked=window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle;
  if(locked==='real'||locked==='anime')return locked;
  const selected=document.getElementById('visualMode')?.value;
  if(selected==='real'||selected==='anime')return selected;
  return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?'real':'anime';
}
function eligible(card){
  return !!card&&/^(HOOK|P(?:[1-9]|1[0-4])|ENDING|THUMBNAIL)$/.test(card.dataset.stage||'');
}
function currentCard(){
  const cards=[...stages.querySelectorAll('.stage-card')].filter(eligible);
  if(!cards.length)return null;
  const open=cards.filter(card=>!card.querySelector('.stage-body')?.classList.contains('hidden'));
  const pool=open.length?open:cards;
  const center=(window.innerHeight||800)/2;
  return pool.slice().sort((a,b)=>{
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
    return Math.abs((ar.top+ar.height/2)-center)-Math.abs((br.top+br.height/2)-center);
  })[0]||cards[0];
}
function setOpen(card){
  if(!card)return;
  stages.querySelectorAll('.stage-card').forEach(c=>{
    const body=c.querySelector('.stage-body'),btn=c.querySelector('.collapse-btn');
    if(!body||!btn)return;
    const active=c===card;
    body.classList.toggle('hidden',!active);
    btn.textContent=active?'Close':'Open';
  });
  card.scrollIntoView({behavior:'smooth',block:'start'});
}
function nextCard(card){
  const cards=[...stages.querySelectorAll('.stage-card')].filter(eligible);
  const i=cards.indexOf(card);
  return i>=0?cards[i+1]||null:null;
}
function saveDone(card){
  const done=card.querySelector('.done-toggle');
  if(!done)return;
  done.checked=true;
  done.dispatchEvent(new Event('change',{bubbles:true}));
}
function clearSmartState(){
  stages.querySelectorAll('.stage-card').forEach(c=>delete c.dataset.smartReady);
}
async function copyText(value){
  try{await navigator.clipboard.writeText(String(value||''));return true;}
  catch{return false;}
}
function status(text,type=''){
  const el=document.getElementById('ldSmartContinueStatus');
  if(!el)return;
  el.textContent=text;
  el.dataset.state=type;
}
function buttonLabel(text){
  const btn=document.getElementById('ldSmartContinueBtn');
  if(btn)btn.textContent=text;
}
function panelPayload(card){
  const continuity=window.ldVideoContinuity||{};
  const sceneField=card.querySelector('.video-scene');
  const promptField=card.querySelector('.text-video-prompt');
  return {
    topic:topic(),
    stage:card.dataset.stage||'',
    format:format(),
    visualMode:visualMode(),
    year:String(continuity.year||'').trim(),
    location:String(continuity.location||'').trim(),
    sharedDetails:String(continuity.details||'').trim(),
    narration:String(card.querySelector('.narration')?.value||'').trim(),
    currentScene:String(sceneField?.value||card.dataset.videoScene||'').trim(),
    currentPrompt:String(promptField?.value||card.dataset.textVideoPrompt||'').trim().slice(0,14000)
  };
}
async function ensureNarration(card){
  if(!/^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage||''))return true;
  const narration=card.querySelector('.narration');
  if(narration?.value.trim())return true;

  status('SMART CONTINUE · Narration is missing, so LD AUTO is running the verified narration pipeline…','working');
  const r=await fetch('/api/ai-narration',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({topic:topic(),format:format()})
  });
  const raw=await r.text();
  let d;
  try{d=JSON.parse(raw);}catch{throw new Error('Narration service returned an invalid response.');}
  if(!r.ok||!d.ok)throw new Error(d.error||('Narration HTTP '+r.status));

  let filled=0;
  stages.querySelectorAll('.stage-card').forEach(c=>{
    const field=c.querySelector('.narration');
    const value=d.stages?.[c.dataset.stage];
    if(field&&value&&!field.value.trim()){
      field.value=value;
      field.dispatchEvent(new Event('input',{bubbles:true}));
      field.dispatchEvent(new Event('change',{bubbles:true}));
      filled++;
    }
  });
  if(!narration?.value.trim()&&d.stages?.[card.dataset.stage]){
    narration.value=d.stages[card.dataset.stage];
    narration.dispatchEvent(new Event('input',{bubbles:true}));
  }
  if(!narration?.value.trim())throw new Error('Narration is still missing for '+card.dataset.stage+'.');
  showToast('Narration prepared · '+filled+' stage'+(filled===1?'':'s')+' filled');
  return true;
}
async function audit(payload){
  const r=await fetch('/api/ai-t2v-audit',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const raw=await r.text();
  let d;
  try{d=JSON.parse(raw);}catch{throw new Error('T2V Audit returned an invalid response.');}
  if(!r.ok||!d.ok)throw new Error(d.error||('T2V Audit HTTP '+r.status));
  return d;
}
async function fixPanel(card,payload){
  const r=await fetch('/api/ai-panel-fix',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const raw=await r.text();
  let d;
  try{d=JSON.parse(raw);}catch{throw new Error('Panel Fix returned an invalid response.');}
  if(!r.ok||!d.ok)throw new Error(d.error||('Panel Fix HTTP '+r.status));
  const field=card.querySelector('.video-scene');
  if(!field)throw new Error('Text-to-Video panel scene is unavailable.');
  field.value=String(d.scene||'').trim();
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.dispatchEvent(new Event('change',{bubbles:true}));
  return d;
}
async function prepareHook(card){
  let choices=window.LDHookChoiceSystem?.choices?.()||[];
  const flow=card.querySelector('.flow-prompt');
  if(!flow?.value.trim()&&choices.length){
    window.LDHookChoiceSystem.useHook(choices[0]);
  }else if(choices.length&&!/ACTIVE HOOK/i.test(card.querySelector('.scene-role')?.textContent||'')){
    window.LDHookChoiceSystem.useHook(choices[0]);
  }
  const prompt=card.querySelector('.flow-prompt')?.value?.trim();
  if(!prompt)throw new Error('No HOOK prompt is ready yet.');
  const copied=await copyText(prompt);
  card.dataset.smartReady='1';
  buttonLabel('✅ RESULT APPROVED → NEXT');
  status('HOOK READY FOR FLOW'+(copied?' · prompt copied automatically':' · use Copy prompt if clipboard is blocked')+'. After you review the generated clip, press this same button again to approve and continue.','pass');
}
async function prepareImageStage(card){
  const stage=card.dataset.stage;
  const image=card.querySelector('.image-prompt')?.value?.trim();
  if(!image)throw new Error(stage+' image prompt is empty.');
  const copied=await copyText(image);
  card.dataset.smartReady='1';
  buttonLabel('✅ RESULT APPROVED → NEXT');
  status(stage+' READY'+(copied?' · image prompt copied automatically':'')+'. After reviewing the result, press this same button again.','pass');
}
async function prepareImageToVideo(card){
  const img=card.querySelector('.image-prompt')?.value?.trim();
  const flow=card.querySelector('.flow-prompt')?.value?.trim();
  if(!img||!flow){
    const gen=card.querySelector('.generate-template-btn');
    if(gen)gen.click();
    await new Promise(r=>setTimeout(r,180));
  }
  const prompt=card.querySelector('.flow-prompt')?.value?.trim();
  if(!prompt)throw new Error('Image-to-Video prompt is not ready.');
  const copied=await copyText(prompt);
  card.dataset.smartReady='1';
  buttonLabel('✅ RESULT APPROVED → NEXT');
  status(card.dataset.stage+' IMAGE-TO-VIDEO READY'+(copied?' · Flow prompt copied automatically':'')+'. Review the Flow result, then press this same button again.','pass');
}
async function prepareTextToVideo(card){
  await ensureNarration(card);

  const continuity=window.ldVideoContinuity||{};
  if(!/^\d{4}$/.test(String(continuity.year||''))||!String(continuity.location||'').trim()){
    const ctx=document.getElementById('chapterVideoContext');
    ctx?.scrollIntoView({behavior:'smooth',block:'center'});
    throw new Error('Fill in Event year and Main location once. SMART CONTINUE will handle the rest.');
  }

  status('SMART CONTINUE · Building the current Text-to-Video prompt…','working');
  const prompt=window.LDVideoModes?.prompt?.(card);
  if(!prompt)throw new Error('Text-to-Video prompt could not be built.');

  let payload=panelPayload(card);
  status('SMART CONTINUE · AI is auditing '+payload.stage+'…','working');
  let result=await audit(payload);

  if(result.result!=='PASS'){
    const issues=Array.isArray(result.issues)?result.issues.join(' · '):'Prompt needs a fix.';
    status('SMART CONTINUE · Audit found an issue. Fixing the current panel automatically… '+issues,'working');
    await fixPanel(card,payload);
    const rebuilt=window.LDVideoModes?.prompt?.(card);
    if(!rebuilt)throw new Error('The prompt could not be rebuilt after AI Fix.');
    payload=panelPayload(card);
    status('SMART CONTINUE · Re-auditing after the automatic fix…','working');
    result=await audit(payload);
  }

  if(result.result!=='PASS'){
    const issues=Array.isArray(result.issues)&&result.issues.length?result.issues.join(' · '):result.summary||'Review required.';
    throw new Error('AI Audit still needs review: '+issues);
  }

  const finalPrompt=window.LDVideoModes?.prompt?.(card)||payload.currentPrompt;
  const copied=await copyText(finalPrompt);
  card.dataset.smartReady='1';
  buttonLabel('✅ RESULT APPROVED → NEXT');
  status('✅ '+card.dataset.stage+' READY FOR FLOW · AI T2V Audit PASS'+(copied?' · prompt copied automatically':'')+'. Generate in Flow, review the clip, then press this same button again.','pass');
}
async function prepare(card){
  delete card.dataset.smartReady;
  buttonLabel('🚀 SMART CONTINUE');

  const stage=card.dataset.stage;
  if(stage==='HOOK')return prepareHook(card);
  if(stage==='ENDING'||stage==='THUMBNAIL')return prepareImageStage(card);

  const lockedMode=window.LDProjectLocks?.videoMode?.()||window.ldProjectLocks?.videoMode;
  const mode=(lockedMode==='text'||lockedMode==='image')?lockedMode:(card.dataset.videoMode||'image');
  if(card.dataset.videoMode!==mode&&window.LDVideoModes?.setAllMode)window.LDVideoModes.setAllMode(mode);
  if(mode==='text')return prepareTextToVideo(card);
  return prepareImageToVideo(card);
}
async function run(){
  if(busy)return;
  busy=true;
  const btn=document.getElementById('ldSmartContinueBtn');
  if(btn)btn.disabled=true;
  try{
    if(!window.LDProjectLocks?.isLocked?.()&&!window.ldProjectLocks?.locked){
      document.getElementById('ldProjectLocks')?.scrollIntoView({behavior:'smooth',block:'center'});
      throw new Error('Lock Video Mode and Visual Style first.');
    }
    if(!stages.querySelector('.stage-card')){
      const t=topic();
      if(!t)throw new Error('Enter the disaster topic first.');
      document.getElementById('buildBtn')?.click();
      await new Promise(r=>setTimeout(r,350));
    }

    let card=currentCard();
    if(!card)throw new Error('No production stage is available.');

    if(card.dataset.smartReady==='1'){
      saveDone(card);
      delete card.dataset.smartReady;
      const next=nextCard(card);
      if(!next){
        buttonLabel('✅ PRODUCTION COMPLETE');
        status('Production complete. All guided stages are finished.','pass');
        return;
      }
      setOpen(next);
      buttonLabel('🚀 SMART CONTINUE');
      status(card.dataset.stage+' approved. Preparing '+next.dataset.stage+'…','working');
      await new Promise(r=>setTimeout(r,180));
      card=next;
    }

    await prepare(card);
  }catch(e){
    buttonLabel('🚀 SMART CONTINUE');
    status('⚠️ '+String(e?.message||e),'error');
  }finally{
    busy=false;
    if(btn)btn.disabled=false;
  }
}

function mountAdvanced(){
  let details=document.getElementById('ldAdvancedTools');
  if(!details){
    details=document.createElement('details');
    details.id='ldAdvancedTools';
    details.className='card ld-advanced-tools';
    details.innerHTML='<summary>🛠 Advanced Tools</summary><div class="ld-advanced-tools-body"><p>Manual diagnostics and template controls. SMART CONTINUE handles the normal workflow.</p><div id="ldAdvancedMovedTools"></div></div>';
    document.getElementById('ldSmartContinuePanel')?.after(details);
    details.addEventListener('toggle',()=>document.body.classList.toggle('ld-advanced-open',details.open));
  }
  const target=details.querySelector('#ldAdvancedMovedTools');
  const ai=document.getElementById('ldAiTestBox');
  if(ai&&ai.parentElement!==target)target.appendChild(ai);
}

function mount(){
  if(document.getElementById('ldSmartContinuePanel'))return;
  const panel=document.createElement('section');
  panel.id='ldSmartContinuePanel';
  panel.className='card ld-smart-continue';
  panel.innerHTML='<div class="ld-smart-head"><div><span class="audit-label">GUIDED MODE</span><strong>LD Autopilot</strong><p>One button prepares the current stage, audits/fixes T2V when needed, and advances after you approve the result.</p></div></div><button type="button" id="ldSmartContinueBtn" class="primary">🚀 SMART CONTINUE</button><div id="ldSmartContinueStatus" class="ld-smart-status">Open a production and press SMART CONTINUE.</div>';
  setup.after(panel);
  panel.querySelector('#ldSmartContinueBtn').addEventListener('click',run);
  mountAdvanced();

  const style=document.createElement('style');
  style.id='ldSmartContinueStyles';
  style.textContent=`
    .ld-smart-continue{margin:14px 0;padding:16px;border:2px solid rgba(124,92,255,.75);border-radius:16px;background:rgba(124,92,255,.08)}
    .ld-smart-head strong{display:block;font-size:1.05rem;margin:3px 0}.ld-smart-head p{font-size:.85rem;opacity:.82;margin:4px 0 12px}
    #ldSmartContinueBtn{width:100%;min-height:48px;font-size:1rem;font-weight:800}
    .ld-smart-status{margin-top:10px;padding:10px;border-radius:10px;background:rgba(0,0,0,.18);font-size:.84rem;white-space:pre-wrap}
    .ld-smart-status[data-state="pass"]{outline:1px solid rgba(101,194,141,.55)}
    .ld-smart-status[data-state="error"]{outline:1px solid rgba(255,110,110,.55)}
    .ld-advanced-tools{margin:10px 0}.ld-advanced-tools summary{cursor:pointer;font-weight:700}
    body:not(.ld-advanced-open) #generateAllBtn,
    body:not(.ld-advanced-open) .generate-template-btn,
    body:not(.ld-advanced-open) .build-missing-video,
    body:not(.ld-advanced-open) .build-text-video,
    body:not(.ld-advanced-open) .copy-text-video{display:none!important}
  `;
  document.head.appendChild(style);
}

const observer=new MutationObserver(()=>mountAdvanced());
observer.observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();

window.LDSmartContinue={run,prepare,currentCard};
})();
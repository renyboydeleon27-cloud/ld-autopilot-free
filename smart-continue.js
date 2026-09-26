/* LD AUTO v3.39.6 — visual-style approval gate + persistent current-panel return. */
(()=>{'use strict';

const stages=document.getElementById('stages');
const setup=document.querySelector('.setup');
const toast=document.getElementById('toast');
if(!stages||!setup)return;

let busy=false;
const auditPassCache=new Map();
let phaseTimer=null;

const SMART_SESSION_PREFIX='ld-auto-smart-continue-session-v1:';
function smartScope(){
  const active=localStorage.getItem('ld-autopilot-free-active-project')||'';
  return active||[topic(),format()].join('|');
}
function smartSessionKey(){return SMART_SESSION_PREFIX+smartScope();}
function readSmartSession(){
  try{
    const x=JSON.parse(localStorage.getItem(smartSessionKey())||'null');
    if(!x||x.topic!==topic()||x.format!==format())return null;
    return x;
  }catch{return null;}
}
function writeSmartSession(patch){
  const prev=readSmartSession()||{version:'1.0',topic:topic(),format:format(),targetStage:'',pending:null};
  const next={...prev,...patch,version:'1.0',topic:topic(),format:format(),updatedAt:new Date().toISOString()};
  try{localStorage.setItem(smartSessionKey(),JSON.stringify(next));}catch{}
  return next;
}
function stageDone(card){return !!card?.querySelector('.done-toggle')?.checked;}
function firstIncompleteCard(cards){
  return (cards||[]).find(card=>!stageDone(card))||null;
}

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
function colorMode(){
  const locked=window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode;
  if(locked==='bw'||locked==='color')return locked;
  return visualMode()==='real'?'bw':'color';
}
function eligible(card){
  return !!card&&/^(HOOK|P(?:[1-9]|1[0-4])|ENDING|THUMBNAIL)$/.test(card.dataset.stage||'');
}
function currentCard(){
  const cards=[...stages.querySelectorAll('.stage-card')].filter(eligible);
  if(!cards.length)return null;

  const session=readSmartSession();
  const remembered=session?.targetStage?cards.find(card=>card.dataset.stage===session.targetStage):null;
  if(remembered&&!stageDone(remembered))return remembered;

  const open=cards.filter(card=>!card.querySelector('.stage-body')?.classList.contains('hidden'));
  const openIncomplete=open.filter(card=>!stageDone(card));
  if(openIncomplete.length){
    const center=(window.innerHeight||800)/2;
    return openIncomplete.slice().sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      return Math.abs((ar.top+ar.height/2)-center)-Math.abs((br.top+br.height/2)-center);
    })[0];
  }

  const incomplete=firstIncompleteCard(cards);
  if(incomplete)return incomplete;

  if(remembered)return remembered;
  if(open.length)return open[0];
  return cards[cards.length-1]||cards[0];
}
function currentTargetText(){
  const card=currentCard();
  return card?'CURRENT TARGET: '+(card.dataset.stage||'CURRENT'):'CURRENT TARGET: —';
}
function updateTargetLabel(){
  const text=currentTargetText();
  document.querySelectorAll('.ld-smart-target').forEach(el=>{
    if(el.textContent!==text)el.textContent=text;
  });
}
function setOpen(card,options={}){
  if(!card)return;
  stages.querySelectorAll('.stage-card').forEach(c=>{
    const body=c.querySelector('.stage-body'),btn=c.querySelector('.collapse-btn');
    if(!body||!btn)return;
    const active=c===card;
    body.classList.toggle('hidden',!active);
    btn.textContent=active?'Close':'Open';
  });
  writeSmartSession({targetStage:card.dataset.stage||''});
  if(options.scroll!==false)card.scrollIntoView({behavior:'smooth',block:'start'});
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
function approvedSnapshot(card){
  const continuity=window.ldVideoContinuity||{};
  return {
    version:'1.0',
    stage:card?.dataset?.stage||'',
    topic:topic(),
    format:format(),
    approvedAt:new Date().toISOString(),
    narration:String(card?.querySelector('.narration')?.value||''),
    imagePrompt:String(card?.querySelector('.image-prompt')?.value||''),
    flowPrompt:String(card?.querySelector('.flow-prompt')?.value||''),
    videoMode:String(card?.dataset?.videoMode||window.LDProjectLocks?.videoMode?.()||'image'),
    visualStyle:visualMode(),
    colorMode:colorMode(),
    year:String(continuity.year||''),
    location:String(continuity.location||''),
    sharedDetails:String(continuity.details||''),
    videoScene:String(card?.querySelector('.video-scene')?.value||card?.dataset?.videoScene||''),
    textVideoPrompt:String(card?.querySelector('.text-video-prompt')?.value||card?.dataset?.textVideoPrompt||''),
    textVideoSignature:String(card?.dataset?.textVideoSignature||''),
    auditSignature:String(card?.dataset?.smartReadySignature||'')
  };
}
function saveApprovedMemory(card){
  if(!card)return null;
  const stage=card.dataset.stage||'';
  if(!stage)return null;
  let root=window.ldApprovedMemory;
  if(!root||typeof root!=='object'||Array.isArray(root)||root.topic!==topic()||root.format!==format()){
    root={version:'1.0',topic:topic(),format:format(),stages:{}};
  }
  if(!root.stages||typeof root.stages!=='object'||Array.isArray(root.stages))root.stages={};
  const previous=root.stages[stage];
  const snapshot=approvedSnapshot(card);
  const history=Array.isArray(previous?.history)?previous.history.slice(-4):[];
  if(previous?.latest)history.push(previous.latest);
  root.stages[stage]={latest:snapshot,history:history.slice(-5)};
  root.updatedAt=snapshot.approvedAt;
  window.ldApprovedMemory=root;
  window.dispatchEvent(new CustomEvent('ld:approved-memory-saved',{detail:{stage,snapshot}}));
  return snapshot;
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
  if(el){el.textContent=text;el.dataset.state=type;}
  const sticky=document.getElementById('ldSmartStickyStatus');
  if(sticky){sticky.textContent=text;sticky.dataset.state=type;}
}
function emptyApiUsage(){
  return {version:'1.0',topic:topic(),format:format(),priceSnapshot:'2026-09-25',currency:'USD',calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}};
}
function usageNumber(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?n:0;
}
function currentApiUsage(){
  const u=window.ldApiUsage;
  if(!u||typeof u!=='object'||Array.isArray(u)||u.topic!==topic()||u.format!==format())window.ldApiUsage=emptyApiUsage();
  return window.ldApiUsage;
}
function addModelUsage(target,source){
  for(const [model,u] of Object.entries(source||{})){
    const m=target[model]||(target[model]={calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0});
    m.calls+=usageNumber(u.calls);
    m.inputTokens+=usageNumber(u.inputTokens);
    m.cachedInputTokens+=usageNumber(u.cachedInputTokens);
    m.outputTokens+=usageNumber(u.outputTokens);
    m.totalTokens+=usageNumber(u.totalTokens);
    m.estimatedCostUsd=Math.round((m.estimatedCostUsd+(Number(u.estimatedCostUsd)||0))*1e8)/1e8;
  }
}
function formatApiCost(value){
  const n=Math.max(0,Number(value)||0);
  if(n===0)return '$0.00000';
  if(n<0.01)return '$'+n.toFixed(5);
  if(n<1)return '$'+n.toFixed(4);
  return '$'+n.toFixed(3);
}
function formatTokenCount(value){
  const n=Math.max(0,Math.round(Number(value)||0));
  if(n>=1000000)return (n/1000000).toFixed(n>=10000000?1:2)+'M';
  if(n>=1000)return (n/1000).toFixed(n>=10000?1:2)+'K';
  return String(n);
}
function refreshApiCostCounter(){
  const u=currentApiUsage();
  const calls=Math.round(usageNumber(u.calls));
  const label='PROJECT API · '+calls+' call'+(calls===1?'':'s')+' · '+formatTokenCount(u.totalTokens)+' tokens · '+formatApiCost(u.estimatedCostUsd)+' est.';
  document.querySelectorAll('.ld-api-cost-counter').forEach(el=>{
    el.textContent=label;
    el.title='Estimated tracked OpenAI API cost for this project from API-reported token usage. This is not your OpenAI account balance. Pricing snapshot: '+(u.priceSnapshot||'unknown')+'.';
  });
}
function recordApiUsage(usage){
  if(!usage||typeof usage!=='object'||usageNumber(usage.calls)<=0)return;
  const root=currentApiUsage();
  root.priceSnapshot=usage.priceSnapshot||root.priceSnapshot||'2026-09-25';
  root.currency=usage.currency||'USD';
  root.calls+=usageNumber(usage.calls);
  root.inputTokens+=usageNumber(usage.inputTokens);
  root.cachedInputTokens+=usageNumber(usage.cachedInputTokens);
  root.outputTokens+=usageNumber(usage.outputTokens);
  root.totalTokens+=usageNumber(usage.totalTokens);
  root.estimatedCostUsd=Math.round((root.estimatedCostUsd+(Number(usage.estimatedCostUsd)||0))*1e8)/1e8;
  root.byModel=root.byModel&&typeof root.byModel==='object'?root.byModel:{};
  addModelUsage(root.byModel,usage.byModel);
  root.updatedAt=new Date().toISOString();
  window.ldApiUsage=root;
  refreshApiCostCounter();
  window.dispatchEvent(new CustomEvent('ld:api-usage-updated',{detail:{...root}}));
}
function smartButtons(){
  return [document.getElementById('ldSmartContinueBtn'),document.getElementById('ldSmartStickyBtn')].filter(Boolean);
}
function buttonLabel(text){
  smartButtons().forEach(btn=>btn.textContent=text);
}
function approveLabel(card){
  const stage=card?.dataset?.stage||'CURRENT';
  return '✅ APPROVE '+stage+' → NEXT';
}
function promptHash(value){
  const s=String(value||'');
  let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(36);
}
function auditCacheKey(payload){
  return [payload.stage,payload.visualMode,payload.colorMode,payload.year,payload.location,promptHash(payload.currentPrompt)].join('|');
}
function readinessSignature(card){
  if(!card)return '';
  const stage=card.dataset.stage||'';
  const mode=card.dataset.videoMode||window.LDProjectLocks?.videoMode?.()||'image';
  const continuity=window.ldVideoContinuity||{};
  if(/^P(?:[1-9]|1[0-4])$/.test(stage)&&mode==='text'){
    return 't2v|'+auditCacheKey(panelPayload(card));
  }
  if(stage==='HOOK'){
    // HOOK approval depends on the actual final Flow/T2V prompt and project locks.
    // Ignore placeholder image/narration fields so legacy image decorators cannot revoke readiness.
    const hookParts=[
      stage,
      window.LDProjectLocks?.videoMode?.()||window.ldProjectLocks?.videoMode||mode,
      visualMode(),
      colorMode(),
      topic(),
      format(),
      String(continuity.year||''),
      String(continuity.location||''),
      String(card.querySelector('.flow-prompt')?.value||'')
    ];
    return 'hook|'+promptHash(hookParts.join('\u241f'));
  }
  const parts=[
    stage,
    mode,
    visualMode(),
    colorMode(),
    String(continuity.year||''),
    String(continuity.location||''),
    String(card.querySelector('.narration')?.value||''),
    String(card.querySelector('.image-prompt')?.value||''),
    String(card.querySelector('.flow-prompt')?.value||'')
  ];
  return 'stage|'+promptHash(parts.join('\u241f'));
}
function markSmartReady(card){
  const signature=readinessSignature(card);
  card.dataset.smartReady='1';
  card.dataset.smartReadySignature=signature;
  writeSmartSession({
    targetStage:card.dataset.stage||'',
    pending:{stage:card.dataset.stage||'',signature,readyAt:new Date().toISOString()}
  });
}
function clearCardSmartReady(card){
  if(!card)return;
  const stage=card.dataset.stage||'';
  delete card.dataset.smartReady;
  delete card.dataset.smartReadySignature;
  const session=readSmartSession();
  if(session?.pending?.stage===stage)writeSmartSession({pending:null});
}
function smartReadyStillCurrent(card){
  return card?.dataset?.smartReady==='1'
    && !!card.dataset.smartReadySignature
    && card.dataset.smartReadySignature===readinessSignature(card);
}
function restoreSmartSession(){
  const cards=[...stages.querySelectorAll('.stage-card')].filter(eligible);
  if(!cards.length)return null;

  let session=readSmartSession();
  let target=session?.targetStage?cards.find(card=>card.dataset.stage===session.targetStage):null;
  if(!target||stageDone(target)){
    target=firstIncompleteCard(cards)||target||cards[cards.length-1]||cards[0];
    if(target)session=writeSmartSession({targetStage:target.dataset.stage||''});
  }

  const pending=session?.pending;
  if(pending?.stage){
    const card=cards.find(x=>x.dataset.stage===pending.stage);
    if(card&&!stageDone(card)&&pending.signature&&pending.signature===readinessSignature(card)){
      card.dataset.smartReady='1';
      card.dataset.smartReadySignature=pending.signature;
      target=card;
      setOpen(card,{scroll:false});
      buttonLabel(approveLabel(card));
      status('🟡 '+card.dataset.stage+' READY FOR APPROVAL · restored after returning to LD AUTO. If the Flow result is okay, press '+approveLabel(card)+'.','pass');
      updateTargetLabel();
      return card;
    }
    writeSmartSession({pending:null});
  }

  if(target){
    setOpen(target,{scroll:false});
    buttonLabel('🚀 SMART CONTINUE');
    updateTargetLabel();
  }
  return target;
}
let lastHiddenAt=0;
let viewportRestoreTimer=null;
function currentSessionCard(){
  const cards=[...stages.querySelectorAll('.stage-card')].filter(eligible);
  if(!cards.length)return null;
  const session=readSmartSession();
  const remembered=session?.targetStage?cards.find(card=>card.dataset.stage===session.targetStage):null;
  if(remembered&&!stageDone(remembered))return remembered;
  return firstIncompleteCard(cards)||remembered||currentCard();
}
function restoreCurrentPanelViewport(options={}){
  clearTimeout(viewportRestoreTimer);
  const delay=Number.isFinite(options.delay)?options.delay:140;
  viewportRestoreTimer=setTimeout(()=>{
    restoreSmartSession();
    const card=currentSessionCard();
    if(!card)return;
    setOpen(card,{scroll:false});
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      card.scrollIntoView({behavior:options.smooth?'smooth':'auto',block:'start'});
      updateTargetLabel();
    }));
  },delay);
}

function stopPhase(){
  if(phaseTimer){clearInterval(phaseTimer);phaseTimer=null;}
}
function startPhase(label,stage){
  stopPhase();
  const started=Date.now();
  const update=()=>{
    const sec=Math.max(0,Math.floor((Date.now()-started)/1000));
    buttonLabel('⏳ '+label+' '+stage+(sec?' · '+sec+'s':''));
  };
  update();
  phaseTimer=setInterval(update,1000);
}
async function fetchWithTimeout(url,options,timeoutMs=55000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(url,{...options,signal:controller.signal});
  }catch(e){
    if(e?.name==='AbortError')throw new Error('AI request timed out. Tap SMART CONTINUE to retry.');
    throw e;
  }finally{
    clearTimeout(timer);
  }
}
function panelPayload(card){
  const continuity=window.ldVideoContinuity||{};
  const sceneField=card.querySelector('.video-scene');
  const promptField=card.querySelector('.text-video-prompt');
  const stage=card.dataset.stage||'';
  const eventSpecificOverride=!!window.LDVideoModes?.eventPanel?.(stage);
  const progression=eventSpecificOverride?null:window.LDDisasterProgression?.stage?.(topic(),stage);
  return {
    topic:topic(),
    stage,
    format:format(),
    visualMode:visualMode(),
    colorMode:colorMode(),
    year:String(continuity.year||'').trim(),
    location:String(continuity.location||'').trim(),
    sharedDetails:String(continuity.details||'').trim(),
    narration:String(card.querySelector('.narration')?.value||'').trim(),
    currentScene:String(sceneField?.value||card.dataset.videoScene||'').trim(),
    currentPrompt:String(promptField?.value||card.dataset.textVideoPrompt||'').trim().slice(0,14000),
    eventSpecificOverride,
    progressionVersion:String(progression?.version||window.LDDisasterProgression?.version||''),
    progressionFamily:String(progression?.familyLabel||''),
    progressionRole:String(progression?.role||''),
    progressionRule:String(progression?([progression.rule,progression.evidenceRule].filter(Boolean).join(' ')):'')
  };
}
function isRocky1874(){
  const t=topic().toLowerCase();
  return t.includes('rocky mountain locust')&&t.includes('1874');
}
function migrateLegacyNarration(card){
  if(!isRocky1874()||!card)return false;
  const field=card.querySelector('.narration');
  if(!field)return false;
  const current=String(field.value||'').trim();
  const stage=card.dataset.stage||'';
  const replacements={
    P11:{
      tests:[
        /^Response teams organize surveillance(?:, ground control, or aircraft operations| and control operations) where available\.?$/i,
        /^Response teams organize surveillance and control operations where available\.?$/i
      ],
      value:'Communities organize food, clothing, seed and other practical relief for families hit by the 1874 locust disaster.'
    },
    P12:{
      tests:[
        /^Agriculture, household income, markets, and food supplies face wider economic pressure\.?$/i
      ],
      value:'The crop disaster creates wider hardship as affected households depend on limited food, seed and material assistance.'
    },
    P13:{
      tests:[
        /^Control campaigns and monitoring reduce swarm pressure while affected communities begin recovery\.?$/i,
        /^Communities organize monitoring, local control efforts, and emergency relief suited to the time and place\.?$/i
      ],
      value:'Recovery begins slowly as affected farmers clear damaged ground, secure seed and prepare to plant again.'
    },
    P14:{
      tests:[
        /^The outbreak leaves lessons for early warning, weather monitoring, surveillance, and rapid response\.?$/i,
        /^As swarm pressure eases or shifts, affected communities begin the long process of recovery and replanting\.?$/i
      ],
      value:'The 1874 locust disaster remains a stark historical example of how quickly an environmental crisis could devastate farming communities across the Great Plains.'
    }
  };
  const rule=replacements[stage];
  if(!rule||!rule.tests.some(rx=>rx.test(current)))return false;
  field.value=rule.value;
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.dispatchEvent(new Event('change',{bubbles:true}));
  delete card.dataset.smartReady;
  auditPassCache.clear();
  return true;
}
function migrateLegacyNarrations(){
  let changed=0;
  stages.querySelectorAll('.stage-card').forEach(card=>{if(migrateLegacyNarration(card))changed++;});
  if(changed)showToast('Updated '+changed+' legacy 1874 narration'+(changed===1?'':'s')+' to match the historical panel scenes.');
  return changed;
}
async function ensureNarration(card){
  if(!/^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage||''))return true;
  migrateLegacyNarration(card);
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
  recordApiUsage(d.apiUsage);
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
  const key=auditCacheKey(payload);
  const cached=auditPassCache.get(key);
  if(cached)return {...cached,cached:true};

  startPhase('AUDITING',payload.stage);
  const r=await fetchWithTimeout('/api/ai-t2v-audit',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const raw=await r.text();
  let d;
  try{d=JSON.parse(raw);}catch{throw new Error('T2V Audit returned an invalid response.');}
  recordApiUsage(d.apiUsage);
  if(!r.ok||!d.ok)throw new Error(d.error||('T2V Audit HTTP '+r.status));
  if(d.result==='PASS')auditPassCache.set(key,d);
  return d;
}
async function fixPanel(card,payload){
  startPhase('FIXING',payload.stage);
  const r=await fetchWithTimeout('/api/ai-panel-fix',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const raw=await r.text();
  let d;
  try{d=JSON.parse(raw);}catch{throw new Error('Panel Fix returned an invalid response.');}
  recordApiUsage(d.apiUsage);
  if(!r.ok||!d.ok)throw new Error(d.error||('Panel Fix HTTP '+r.status));
  const field=card.querySelector('.video-scene');
  if(!field)throw new Error('Text-to-Video panel scene is unavailable.');
  const safeScene=window.LDVideoModes?.sanitizeSceneForStyle
    ? window.LDVideoModes.sanitizeSceneForStyle(d.scene)
    : String(d.scene||'').trim();
  if(!safeScene)throw new Error('AI panel fix returned an empty scene after visual-style safety cleanup.');
  field.value=safeScene;
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.dispatchEvent(new Event('change',{bubbles:true}));
  return {...d,scene:safeScene};
}
async function prepareHook(card){
  let choices=window.LDHookChoiceSystem?.choices?.()||[];
  const flow=card.querySelector('.flow-prompt');
  if(!flow?.value.trim()&&choices.length){
    window.LDHookChoiceSystem.useHook(choices[0]);
  }else if(choices.length&&!/ACTIVE HOOK/i.test(card.querySelector('.scene-role')?.textContent||'')){
    window.LDHookChoiceSystem.useHook(choices[0]);
  }
  // Allow any already-queued legacy UI decorators to finish before capturing the approval signature.
  await new Promise(r=>setTimeout(r,220));
  const prompt=card.querySelector('.flow-prompt')?.value?.trim();
  if(!prompt)throw new Error('No HOOK prompt is ready yet.');
  const copied=await copyText(prompt);
  markSmartReady(card);
  buttonLabel(approveLabel(card));
  status('🟡 HOOK READY FOR FLOW · NOT YET APPROVED · LOCAL CHECK ONLY · 0 API calls'+(copied?' · prompt copied automatically':' · use Copy prompt if clipboard is blocked')+'. Review the generated clip, then press ✅ APPROVE HOOK → NEXT.','pass');
}
async function prepareImageStage(card){
  const stage=card.dataset.stage;
  const image=card.querySelector('.image-prompt')?.value?.trim();
  if(!image)throw new Error(stage+' image prompt is empty.');
  const copied=await copyText(image);
  markSmartReady(card);
  buttonLabel(approveLabel(card));
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
  markSmartReady(card);
  buttonLabel(approveLabel(card));
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
    startPhase('RE-AUDITING',payload.stage);
    result=await audit(payload);
  }

  if(result.result!=='PASS'){
    const issues=Array.isArray(result.issues)&&result.issues.length?result.issues.join(' · '):result.summary||'Review required.';
    throw new Error('AI Audit still needs review: '+issues);
  }

  stopPhase();
  const auditedKey=auditCacheKey(payload);
  const finalPrompt=window.LDVideoModes?.prompt?.(card)||payload.currentPrompt;
  if(window.LDVideoModes?.promptStyleCompatible&&!window.LDVideoModes.promptStyleCompatible(finalPrompt)){
    throw new Error('Visual-style lock mismatch: this project is locked to '+(visualMode()==='anime'?'Anime':'Real Human')+'. The panel prompt was blocked before approval.');
  }
  let finalPayload=panelPayload(card);
  if(auditCacheKey(finalPayload)!==auditedKey){
    status('SMART CONTINUE · Final prompt changed after rebuild. Verifying the exact final version…','working');
    const finalResult=await audit(finalPayload);
    if(finalResult.result!=='PASS'){
      const issues=Array.isArray(finalResult.issues)&&finalResult.issues.length?finalResult.issues.join(' · '):finalResult.summary||'Review required.';
      throw new Error('Final prompt changed after audit and still needs review: '+issues);
    }
  }
  const exactPrompt=window.LDVideoModes?.prompt?.(card)||finalPrompt;
  if(window.LDVideoModes?.promptStyleCompatible&&!window.LDVideoModes.promptStyleCompatible(exactPrompt)){
    throw new Error('Visual-style lock mismatch after final rebuild. SMART CONTINUE will not approve this panel.');
  }
  const copied=await copyText(exactPrompt);
  markSmartReady(card);
  buttonLabel(approveLabel(card));
  status('🟡 '+card.dataset.stage+' READY FOR FLOW · NOT YET APPROVED · exact prompt signature verified'+(copied?' · prompt copied automatically':'')+'. Generate in Flow, review the clip, then press '+approveLabel(card)+'.','pass');
}
async function prepare(card){
  clearCardSmartReady(card);
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
  smartButtons().forEach(b=>b.disabled=true);
  try{
    if(!window.LDProjectLocks?.isLocked?.()&&!window.ldProjectLocks?.locked){
      document.getElementById('ldProjectLocks')?.scrollIntoView({behavior:'smooth',block:'center'});
      throw new Error('Lock Video Mode, Visual Style and Color Treatment first.');
    }
    if(!stages.querySelector('.stage-card')){
      const t=topic();
      if(!t)throw new Error('Enter the disaster topic first.');
      document.getElementById('buildBtn')?.click();
      await new Promise(r=>setTimeout(r,350));
    }

    let card=currentCard();
    if(!card)throw new Error('No production stage is available.');
    buttonLabel('⏳ CHECKING '+(card.dataset.stage||'CURRENT')+'…');
    status('SMART CONTINUE received · checking '+(card.dataset.stage||'current stage')+'…','working');

    if(card.dataset.smartReady==='1'){
      if(!smartReadyStillCurrent(card)){
        const changedStage=card.dataset.stage||'CURRENT';
        clearCardSmartReady(card);
        auditPassCache.clear();
        buttonLabel('🔄 RECHECK '+changedStage);
        status('🔄 '+changedStage+' changed after its last audit/ready state. Rechecking the current version before approval…','working');
        await prepare(card);
        return;
      }
      const approvedStage=card.dataset.stage||'CURRENT';
      saveApprovedMemory(card);
      saveDone(card);
      clearCardSmartReady(card);
      const next=nextCard(card);
      if(!next){
        buttonLabel('✅ PRODUCTION COMPLETE');
        status('✅ '+approvedStage+' approved · Approved Memory Saved. Production complete.','pass');
        showToast('Approved Memory Saved · '+approvedStage);
        return;
      }
      setOpen(next);
      buttonLabel('🚀 SMART CONTINUE');
      status('✅ '+approvedStage+' approved · Approved Memory Saved. Preparing '+next.dataset.stage+'…','working');
      showToast('Approved Memory Saved · '+approvedStage);
      await new Promise(r=>setTimeout(r,180));
      card=next;
    }

    await prepare(card);
  }catch(e){
    stopPhase();
    const failed=currentCard();
    const stage=failed?.dataset?.stage||'CURRENT';
    buttonLabel('⚠️ '+stage+' NEEDS REVIEW · TAP RETRY');
    status('⚠️ '+stage+': '+String(e?.message||e),'error');
  }finally{
    stopPhase();
    busy=false;
    smartButtons().forEach(b=>b.disabled=false);
  }
}

// Robust delegated binding: SMART CONTINUE still responds if the panel/sticky UI already exists after navigation/cache restoration.
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn');
  if(!btn)return;
  e.preventDefault();
  run();
});

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
  panel.innerHTML='<div class="ld-smart-head"><div><span class="audit-label">GUIDED MODE</span><strong>LD Autopilot</strong><p>One button prepares the current stage, audits/fixes T2V when needed, and advances after you approve the result.</p></div></div><div class="ld-smart-target">CURRENT TARGET: —</div><div class="ld-api-cost-counter">PROJECT API · 0 calls · 0 tokens · $0.00000 est.</div><button type="button" id="ldSmartContinueBtn" class="primary">🚀 SMART CONTINUE</button><div id="ldSmartContinueStatus" class="ld-smart-status">Open a production and press SMART CONTINUE.</div>';
  setup.after(panel);


  let sticky=document.getElementById('ldSmartStickyBar');
  if(!sticky){
    sticky=document.createElement('div');
    sticky.id='ldSmartStickyBar';
    sticky.className='ld-smart-sticky-bar';
    sticky.innerHTML='<div class="ld-smart-target">CURRENT TARGET: —</div><div class="ld-api-cost-counter">PROJECT API · 0 calls · 0 tokens · $0.00000 est.</div><button type="button" id="ldSmartStickyBtn" class="primary">🚀 SMART CONTINUE</button><div id="ldSmartStickyStatus" class="ld-smart-sticky-status">Ready.</div>';
    document.body.appendChild(sticky);

  }

  mountAdvanced();

  stages.addEventListener('input',e=>{
    const card=e.target.closest?.('.stage-card');
    if(!card||card.dataset.smartReady!=='1')return;
    if(!e.target.matches?.('.narration,.image-prompt,.flow-prompt,.video-scene,.text-video-prompt'))return;
    if(card.dataset.smartReadySignature&&card.dataset.smartReadySignature!==readinessSignature(card)){
      clearCardSmartReady(card);
      buttonLabel('🚀 SMART CONTINUE');
      status('Current '+(card.dataset.stage||'stage')+' changed after readiness. SMART CONTINUE will recheck it before approval.','working');
    }
  });

  const style=document.createElement('style');
  style.id='ldSmartContinueStyles';
  style.textContent=`
    .ld-smart-continue{margin:14px 0;padding:16px;border:2px solid rgba(124,92,255,.75);border-radius:16px;background:rgba(124,92,255,.08)}
    .ld-smart-head strong{display:block;font-size:1.05rem;margin:3px 0}.ld-smart-head p{font-size:.85rem;opacity:.82;margin:4px 0 12px}
    #ldSmartContinueBtn{width:100%;min-height:48px;font-size:1rem;font-weight:800}
    .ld-smart-target{font-size:.76rem;font-weight:900;letter-spacing:.06em;text-align:center;margin:0 0 5px;opacity:.92}
    .ld-api-cost-counter{font-size:.69rem;font-weight:800;text-align:center;margin:0 0 7px;opacity:.82;font-variant-numeric:tabular-nums}
    .ld-smart-sticky-bar{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(94vw,680px);z-index:9999;padding:8px;border-radius:16px;background:rgba(15,22,32,.94);backdrop-filter:blur(10px);box-shadow:0 8px 28px rgba(0,0,0,.42);border:1px solid rgba(124,92,255,.65)}
    #ldSmartStickyBtn{width:100%;min-height:50px;font-size:1rem;font-weight:900}
    .ld-smart-sticky-status{margin-top:6px;font-size:.72rem;line-height:1.25;text-align:center;opacity:.86;white-space:normal}
    .ld-smart-sticky-status[data-state="error"]{opacity:1;font-weight:800}
    .shell{padding-bottom:112px}
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
  updateTargetLabel();
  refreshApiCostCounter();
}

let targetQueued=false;
function scheduleTargetUpdate(){
  if(targetQueued)return;
  targetQueued=true;
  requestAnimationFrame(()=>{
    targetQueued=false;
    updateTargetLabel();
  });
}
const observer=new MutationObserver(()=>{
  mountAdvanced();
  scheduleTargetUpdate();
});
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('scroll',scheduleTargetUpdate,{passive:true});
window.addEventListener('resize',scheduleTargetUpdate,{passive:true});
document.addEventListener('click',e=>{
  const card=e.target.closest?.('.stage-card');
  if(card&&e.target.closest('.collapse-btn,.next-stage-btn')){
    setTimeout(()=>{
      if(eligible(card))writeSmartSession({targetStage:card.dataset.stage||''});
      scheduleTargetUpdate();
    },60);
    return;
  }
  if(e.target.closest('#nextIncompleteBtn,#auditNextBtn,#jumpStage,.done-toggle'))setTimeout(scheduleTargetUpdate,60);
});
document.addEventListener('change',e=>{
  if(e.target.closest('#jumpStage')){
    const stage=String(e.target.value||'');
    if(stage)writeSmartSession({targetStage:stage});
    setTimeout(scheduleTargetUpdate,60);
    return;
  }
  if(e.target.closest('.done-toggle'))setTimeout(()=>{
    restoreSmartSession();
    scheduleTargetUpdate();
  },80);
});
window.addEventListener('ld:production-built',()=>{
  setTimeout(()=>{
    migrateLegacyNarrations();
    restoreSmartSession();
    scheduleTargetUpdate();
    refreshApiCostCounter();
  },180);
});

// Keep the user's current production panel on-screen after switching to Flow or another app/tab.
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    lastHiddenAt=Date.now();
    const card=currentCard();
    if(card)writeSmartSession({targetStage:card.dataset.stage||''});
    return;
  }
  if(Date.now()-lastHiddenAt>=300)restoreCurrentPanelViewport({delay:120});
});
window.addEventListener('pageshow',()=>restoreCurrentPanelViewport({delay:180}));
window.addEventListener('focus',()=>{
  if(lastHiddenAt&&Date.now()-lastHiddenAt>=300)restoreCurrentPanelViewport({delay:100});
});
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{
    mount();
    setTimeout(()=>{
      migrateLegacyNarrations();
      restoreSmartSession();
    },280);
  });
}else{
  mount();
  setTimeout(()=>{
    migrateLegacyNarrations();
    restoreSmartSession();
  },280);
}

window.LDSmartContinue={version:'3.39.6',run,prepare,currentCard,updateTargetLabel,restoreSmartSession,restoreCurrentPanelViewport,migrateLegacyNarrations,saveApprovedMemory,getApprovedMemory:(stage)=>window.ldApprovedMemory?.stages?.[stage]?.latest||null,readinessSignature,smartReadyStillCurrent,recordApiUsage,getApiUsage:()=>({...currentApiUsage()})};
})();
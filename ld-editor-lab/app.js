(()=>{
'use strict';

const VERSION='0.5.5';
// Keep the v0.2 key so existing projects migrate in place after APK update.
const STORE='ld-editor-lab-project-v0.2';
const EXPORT_DB='ld-editor-lab-export-db-v1';
const EXPORT_STORE='exports';
const EXPORT_KEY='last-render';
const THUMB_KEY='project-thumbnail';
const ENDING_IMAGE_KEY='ending-image';
const AI_NARRATOR_KEY='generated-ai-narrator';
const AI_API_ORIGIN='https://ld-autopilot-free.vercel.app';
const STAGES=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
const TARGET={HOOK:10,ENDING:5};
for(let i=1;i<=14;i++)TARGET['P'+i]=10;

const state={
  clips:new Map(),
  narration:null,
  music:null,
  thumbnail:null,
  lastExport:null,
  apiTracker:{
    projectCostUsd:0,
    lifetimeCostUsd:0,
    lastGenerationCostUsd:0,
    lastGenerationId:'',
    history:[]
  },
  sessionCostUsd:0,
  activeGenerationId:'',
  activeGenerationLabel:'',
  activeGenerationCostUsd:0,
  projectTopic:'',
  autoCut:{
    enabled:false,
    builtAt:'',
    script:'',
    captions:{},
    plan:{},
    transitionMs:160,
    autoNarrator:true,
    narratorVoice:'cedar',
    narratorSourceKey:''
  },
  playing:false,
  playIndex:0,
  exportAbort:false,
  exportUrl:null,
  imagePreviewTime:0,
  imagePreviewRaf:0
};

const $=id=>document.getElementById(id);
const timeline=$('timeline'),preview=$('previewVideo'),placeholder=$('previewPlaceholder');
const narrationAudio=$('narrationAudio'),musicAudio=$('musicAudio');
const isNative=()=>!!window.LDNative&&typeof window.LDNative.pickMedia==='function';

function setUpdateStatus(message){
  const el=$('updateStatus');if(el)el.textContent=message;
}
function getNativeUpdateState(){
  if(!isNative()||typeof window.LDNative?.getWebUpdateState!=='function')return null;
  try{return safeJson(window.LDNative.getWebUpdateState(),null);}catch{return null;}
}
window.LDWebUpdateStatus=info=>{
  info=info||{};
  const check=$('checkUpdateBtn'),install=$('installUpdateBtn');
  if(info.status==='available'){
    setUpdateStatus('Update available · v'+(info.version||'?')+(info.notes?' · '+info.notes:''));
    if(install){install.hidden=false;install.disabled=false;install.dataset.version=info.version||'';}
    if(check)check.disabled=false;
  }else if(info.status==='installing'){
    setUpdateStatus('Installing v'+(info.version||'latest')+'… Keep the app open.');
    if(check)check.disabled=true;if(install)install.disabled=true;
  }else if(info.status==='current'){
    setUpdateStatus('Up to date · v'+(info.version||VERSION));
    if(install){install.hidden=true;install.disabled=true;}if(check)check.disabled=false;
  }else if(info.status==='error'){
    setUpdateStatus('Update check failed · '+(info.message||'Try again later.'));
    if(check)check.disabled=false;if(install)install.disabled=false;
  }
};
function checkForUpdates(){
  if(!isNative()||typeof window.LDNative?.checkWebUpdate!=='function'){
    setUpdateStatus('Browser build · updates arrive with the deployed site.');return;
  }
  const check=$('checkUpdateBtn');if(check)check.disabled=true;
  setUpdateStatus('Checking for updates…');
  try{window.LDNative.checkWebUpdate();}catch(e){window.LDWebUpdateStatus({status:'error',message:e.message});}
}
function installAvailableUpdate(){
  if(!isNative()||typeof window.LDNative?.installWebUpdate!=='function')return;
  const install=$('installUpdateBtn');if(install)install.disabled=true;
  setUpdateStatus('Preparing update…');
  try{window.LDNative.installWebUpdate();}catch(e){window.LDWebUpdateStatus({status:'error',message:e.message});}
}

function money(v){
  const n=Number(v)||0;
  return '$'+n.toFixed(n>=1?4:6);
}
function normalizeApiTracker(raw){
  const t=raw&&typeof raw==='object'?raw:{};
  return {
    projectCostUsd:Number(t.projectCostUsd)||0,
    lifetimeCostUsd:Number(t.lifetimeCostUsd)||0,
    lastGenerationCostUsd:Number(t.lastGenerationCostUsd)||0,
    lastGenerationId:String(t.lastGenerationId||''),
    history:Array.isArray(t.history)?t.history.slice(-100):[]
  };
}
function latestGenerationEntries(){
  const id=state.activeGenerationId||state.apiTracker.lastGenerationId;
  if(!id)return [];
  return state.apiTracker.history.filter(x=>x&&x.generationId===id);
}
function featureCost(entries,feature){
  return entries.filter(x=>x.feature===feature).reduce((a,x)=>a+(Number(x.costUsd)||0),0);
}
function renderApiTracker(){
  const t=state.apiTracker||normalizeApiTracker(null),entries=latestGenerationEntries();
  const generationCost=state.activeGenerationId?state.activeGenerationCostUsd:t.lastGenerationCostUsd;
  const put=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
  put('apiThisGeneration',money(generationCost));
  put('apiNarratorCost',money(featureCost(entries,'narrator_voice')));
  put('apiMusicCost',money(featureCost(entries,'ai_music')));
  put('apiSfxCost',money(featureCost(entries,'ai_sfx')));
  put('apiTextCost',money(featureCost(entries,'text_narration')));
  put('apiSessionCost',money(state.sessionCostUsd));
  put('apiProjectCost',money(t.projectCostUsd));
  put('apiLifetimeCost',money(t.lifetimeCostUsd));
  const body=$('apiHistoryBody');if(!body)return;
  body.innerHTML='';
  const recent=[...t.history].reverse().slice(0,20);
  if(!recent.length){
    const tr=document.createElement('tr');tr.innerHTML='<td colspan="5" class="muted">No generations recorded yet.</td>';body.appendChild(tr);return;
  }
  for(const item of recent){
    const tr=document.createElement('tr');
    const badge=item.free?'<span class="cost-badge free">FREE</span>':'<span class="cost-badge paid">PAID</span>';
    const tokenText=Number(item.totalTokens)>0?Number(item.totalTokens).toLocaleString()+' tok':'—';
    tr.innerHTML='<td>'+escapeHtml(new Date(item.at).toLocaleString())+'</td><td>'+escapeHtml(item.featureLabel||item.feature||'AI')+'</td><td>'+escapeHtml(item.model||'—')+'</td><td>'+tokenText+'</td><td>'+badge+' '+money(item.costUsd)+(item.estimated?' <span class="muted">EST.</span>':'')+'</td>';
    body.appendChild(tr);
  }
}
function beginApiGeneration(label='FULL AUTO CUT'){
  state.activeGenerationId='gen-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  state.activeGenerationLabel=String(label||'Generation');
  state.activeGenerationCostUsd=0;
  renderApiTracker();saveProject();
  return state.activeGenerationId;
}
function recordApiUsage(entry={}){
  if(!state.activeGenerationId)beginApiGeneration(entry.generationLabel||entry.featureLabel||'Generation');
  const free=entry.free===true||String(entry.billing||'').toUpperCase()==='FREE';
  const cost=free?0:Math.max(0,Number(entry.costUsd)||0);
  const rec={
    id:'usage-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
    generationId:state.activeGenerationId,
    generationLabel:state.activeGenerationLabel,
    at:new Date().toISOString(),
    feature:String(entry.feature||'other'),
    featureLabel:String(entry.featureLabel||entry.feature||'AI'),
    model:String(entry.model||''),
    inputTokens:Number(entry.inputTokens)||0,
    outputTokens:Number(entry.outputTokens)||0,
    totalTokens:Number(entry.totalTokens)||0,
    costUsd:cost,
    free,
    estimated:entry.estimated===true
  };
  state.apiTracker.history.push(rec);state.apiTracker.history=state.apiTracker.history.slice(-100);
  state.activeGenerationCostUsd+=cost;
  state.sessionCostUsd+=cost;
  state.apiTracker.projectCostUsd+=cost;
  state.apiTracker.lifetimeCostUsd+=cost;
  renderApiTracker();saveProject();
  return rec;
}
function endApiGeneration(){
  if(!state.activeGenerationId)return;
  state.apiTracker.lastGenerationId=state.activeGenerationId;
  state.apiTracker.lastGenerationCostUsd=state.activeGenerationCostUsd;
  state.activeGenerationId='';state.activeGenerationLabel='';state.activeGenerationCostUsd=0;
  renderApiTracker();saveProject();
}
window.LDBeginApiGeneration=beginApiGeneration;
window.LDRecordApiUsage=recordApiUsage;
window.LDEndApiGeneration=endApiGeneration;

function normalizeAutoCut(raw){
  const a=raw&&typeof raw==='object'?raw:{};
  return {
    enabled:a.enabled===true,
    builtAt:String(a.builtAt||''),
    script:String(a.script||''),
    captions:a.captions&&typeof a.captions==='object'?a.captions:{},
    plan:a.plan&&typeof a.plan==='object'?a.plan:{},
    transitionMs:Number.isFinite(Number(a.transitionMs))?Math.max(80,Math.min(400,Number(a.transitionMs))):160,
    autoNarrator:a.autoNarrator!==false,
    narratorVoice:String(a.narratorVoice||'cedar'),
    narratorSourceKey:String(a.narratorSourceKey||'')
  };
}
function splitNarrationToStages(text){
  const raw=String(text||'').trim();
  if(!raw)return {};
  const out={};
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  for(const line of lines){
    const m=line.match(/^(HOOK|ENDING|P\s*0?(?:1[0-4]|[1-9]))\s*[:\-–—]\s*(.+)$/i);
    if(m){
      const key=/^P/i.test(m[1])?'P'+Number(m[1].replace(/\D/g,'')):m[1].toUpperCase();
      out[key]=m[2].trim();
    }
  }
  if(Object.keys(out).length)return out;
  if(lines.length>=STAGES.length){
    STAGES.forEach((stage,i)=>{out[stage]=lines[i]||'';});
    return out;
  }
  const sentences=(raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[]).map(x=>x.trim()).filter(Boolean);
  if(!sentences.length)return out;
  const buckets=Array.from({length:STAGES.length},()=>[]);
  sentences.forEach((s,i)=>{
    const slot=Math.min(STAGES.length-1,Math.floor(i*STAGES.length/sentences.length));
    buckets[slot].push(s);
  });
  STAGES.forEach((stage,i)=>{out[stage]=buckets[i].join(' ').trim();});
  return out;
}
function captionChunks(text){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean);
  if(!words.length)return [];
  const chunks=[];
  for(let i=0;i<words.length;i+=7)chunks.push(words.slice(i,i+7).join(' '));
  return chunks;
}
function buildAutoCaptions(script){
  const mapped=splitNarrationToStages(script),captions={};
  for(const stage of STAGES){
    const chunks=captionChunks(mapped[stage]||'');
    if(chunks.length)captions[stage]=chunks;
  }
  return captions;
}
function autoStageNumbers(stage){
  if(stage==='HOOK')return {clip:1.05,music:0.90,transition:'hard'};
  if(stage==='ENDING')return {clip:0.55,music:0.65,transition:'fade'};
  const n=Number(String(stage).replace('P',''))||0;
  if(n<=3)return {clip:0.72,music:0.82,transition:'fade'};
  if(n<=9)return {clip:1.18,music:1.14,transition:'hard'};
  return {clip:0.82,music:0.78,transition:'fade'};
}
function buildAutoCutPlan(){
  const plan={};
  for(const stage of STAGES){
    const item=state.clips.get(stage);
    if(!item)continue;
    const actual=Math.max(0,Number(item.duration)||0);
    const target=stage==='ENDING'?5:(TARGET[stage]||actual);
    const duration=target?Math.min(actual,target):actual;
    const mix=autoStageNumbers(stage);
    plan[stage]={
      duration:Math.max(0.1,duration||actual||0.1),
      transitionIn:stage==='HOOK'?'none':mix.transition,
      transitionOut:stage==='ENDING'?'fade':mix.transition,
      clipFactor:mix.clip,
      musicFactor:mix.music
    };
  }
  return plan;
}
function autoCutStagePlan(stage){return state.autoCut?.plan?.[stage]||null;}
function effectiveDuration(stage,item){
  const actual=Math.max(0,Number(item?.duration)||0);
  if(stage==='ENDING'&&actual>0)return Math.min(actual,5);
  if(!state.autoCut?.enabled)return actual;
  const planned=Number(autoCutStagePlan(stage)?.duration);
  return Number.isFinite(planned)&&planned>0?Math.min(actual||planned,planned):actual;
}
function autoCaptionAt(stage,time,duration){
  if(!state.autoCut?.enabled)return'';
  if(stage==='HOOK')return'';
  if(stage==='ENDING'&&Number(time)>=4.5)return'';
  const chunks=state.autoCut?.captions?.[stage];
  if(!Array.isArray(chunks)||!chunks.length)return'';
  const d=Math.max(.1,Number(duration)||1);
  const idx=Math.min(chunks.length-1,Math.floor(Math.max(0,Number(time)||0)/d*chunks.length));
  return chunks[idx]||'';
}
function narrationApiUrl(){
  const protocol=String(location.protocol||'');
  const host=String(location.hostname||'');
  if((protocol==='https:'||protocol==='http:')&&!/github\.io$/i.test(host))return '/api/ai-narration';
  return AI_API_ORIGIN+'/api/ai-narration';
}
function generatedStagesToScript(stages){
  const lines=[];
  for(let i=1;i<=14;i++){
    const key='P'+i,txt=String(stages?.[key]||'').trim();
    if(txt)lines.push(key+': '+txt);
  }
  lines.push('ENDING: Thank you for watching. Subscribe for more Living Disaster stories.');
  return lines.join('\n');
}
function recordTextNarrationUsage(apiUsage){
  const usage=apiUsage&&typeof apiUsage==='object'?apiUsage:{};
  const models=Object.keys(usage.byModel||{});
  recordApiUsage({
    feature:'text_narration',featureLabel:'AI text / narration',
    model:models.length?models.join(' + '):'gpt-5-mini',
    inputTokens:Number(usage.inputTokens)||0,
    outputTokens:Number(usage.outputTokens)||0,
    totalTokens:Number(usage.totalTokens)||0,
    costUsd:Number(usage.estimatedCostUsd)||0,
    estimated:true
  });
}
async function generateAutoNarrationScript(topic){
  const cleanTopic=String(topic||'').trim();
  if(!cleanTopic)throw new Error('Enter the Project Topic first so Auto Cut knows which disaster to narrate.');
  setAutoCutStatus('Step 1/3 · researching and generating fact-checked narration…');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),240000);
  let response;
  try{
    response=await fetch(narrationApiUrl(),{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({topic:cleanTopic,format:'shorts',narrativeFormat:'causal-v1'}),
      signal:controller.signal
    });
  }catch(e){
    if(e?.name==='AbortError')throw new Error('AI narration timed out. Please try again.');
    throw new Error('Could not reach AI narration service: '+String(e?.message||e));
  }finally{clearTimeout(timer);}
  let data=null;try{data=await response.json();}catch{}
  if(!response.ok||!data?.ok)throw new Error(data?.error||'AI narration generation failed.');
  const script=generatedStagesToScript(data.stages);
  if(!script.trim())throw new Error('AI narration returned no usable panel narration.');
  recordTextNarrationUsage(data.apiUsage);
  state.projectTopic=cleanTopic;state.autoCut.script=script;
  if($('projectTopic'))$('projectTopic').value=cleanTopic;
  if($('autoCutScript'))$('autoCutScript').value=script;
  return script;
}

function narratorApiUrl(){
  const protocol=String(location.protocol||'');
  const host=String(location.hostname||'');
  if((protocol==='https:'||protocol==='http:')&&!/github\.io$/i.test(host))return '/api/ai-voice';
  return AI_API_ORIGIN+'/api/ai-voice';
}
function simpleHash(text){
  let h=2166136261;
  const s=String(text||'');
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16);
}
function voiceNarrationText(script){
  const mapped=splitNarrationToStages(script);
  return STAGES.filter(s=>s!=='HOOK').map(s=>String(mapped[s]||'').trim()).filter(Boolean).join('\n\n').trim();
}
function narratorSourceKey(text,voice){return String(voice||'cedar')+':'+simpleHash(text);}
function arrayBufferToBlob(buffer,type='audio/mpeg'){return new Blob([buffer],{type});}
async function putGeneratedNarrator(blob,meta={}){
  const db=await openExportDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readwrite');
      tx.objectStore(EXPORT_STORE).put({
        blob,name:meta.name||'LD-AI-Narrator.mp3',mime:meta.mime||blob.type||'audio/mpeg',
        size:Number(blob.size)||0,model:meta.model||'gpt-4o-mini-tts',voice:meta.voice||'cedar',
        sourceKey:meta.sourceKey||'',duration:Number(meta.duration)||0,savedAt:new Date().toISOString()
      },AI_NARRATOR_KEY);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Could not save AI narrator.'));
      tx.onabort=()=>reject(tx.error||new Error('AI narrator save was aborted.'));
    });
  }finally{db.close();}
}
async function getGeneratedNarrator(){
  const db=await openExportDb();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readonly');
      const req=tx.objectStore(EXPORT_STORE).get(AI_NARRATOR_KEY);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error||new Error('Could not restore AI narrator.'));
    });
  }finally{db.close();}
}
async function clearGeneratedNarrator(){
  if(!('indexedDB' in window))return;
  const db=await openExportDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readwrite');
      tx.objectStore(EXPORT_STORE).delete(AI_NARRATOR_KEY);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Could not clear AI narrator.'));
    });
  }finally{db.close();}
}
function probeAudioDuration(url){
  return new Promise((resolve,reject)=>{
    const a=document.createElement('audio');a.preload='metadata';
    a.onloadedmetadata=()=>resolve(Number(a.duration)||0);
    a.onerror=()=>reject(new Error('Generated narrator audio could not be read.'));
    a.src=url;
  });
}
function setNarratorAiStatus(message,kind=''){
  const el=$('narratorAiStatus');if(!el)return;
  el.textContent=message;el.className='meta narrator-ai-status '+kind;
}
function syncNarratorControls(){
  const toggle=$('autoNarrator'),voice=$('narratorVoice');
  if(toggle)toggle.checked=state.autoCut.autoNarrator!==false;
  if(voice)voice.value=state.autoCut.narratorVoice||'cedar';
  if(state.narration?.generated)setNarratorAiStatus('AI narrator ready · '+(state.narration.voice||'cedar')+' · '+fmt(state.narration.duration||0),'ready');
  else if(toggle?.checked)setNarratorAiStatus('ON · narrator will generate with FULL AUTO CUT','paid');
  else setNarratorAiStatus('OFF · imported narrator only','');
}
async function generateAiNarrator(script,voice){
  const speech=voiceNarrationText(script);
  if(!speech)throw new Error('Paste the final narration script first. HOOK is automatically excluded from voice-over.');
  if(speech.length>3900)throw new Error('Narration is too long for one-click voice. Keep the spoken script under about 3,900 characters.');
  const sourceKey=narratorSourceKey(speech,voice);
  if(state.narration?.generated&&state.narration.sourceKey===sourceKey&&state.narration.url){
    setNarratorAiStatus('Reusing saved AI narrator · no new API charge','ready');
    return {reused:true,costUsd:0,sourceKey};
  }
  const saved=await getGeneratedNarrator().catch(()=>null);
  if(saved?.blob&&saved.sourceKey===sourceKey){
    releaseItem(state.narration,false);
    const url=URL.createObjectURL(saved.blob);
    state.narration={
      name:saved.name||'LD-AI-Narrator.mp3',mime:saved.mime||'audio/mpeg',size:Number(saved.size||saved.blob.size)||0,
      url,objectUrl:true,browserStored:true,generated:true,model:saved.model||'gpt-4o-mini-tts',
      voice:saved.voice||voice,sourceKey,duration:Number(saved.duration)||0
    };
    setupAudioElement('narration');applyVolumes();
    setNarratorAiStatus('Reusing saved AI narrator · no new API charge','ready');
    return {reused:true,costUsd:0,sourceKey};
  }
  setNarratorAiStatus('Generating cinematic AI narrator…','busy');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),180000);
  let response;
  try{
    response=await fetch(narratorApiUrl(),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:speech,voice}),
      signal:controller.signal
    });
  }catch(e){
    if(e?.name==='AbortError')throw new Error('AI narrator timed out. Please try again.');
    throw new Error('Could not reach AI narrator service: '+String(e?.message||e));
  }finally{clearTimeout(timer);}
  if(!response.ok){
    let msg='AI narrator generation failed.';
    try{const data=await response.json();if(data?.error)msg=data.error;}catch{}
    throw new Error(msg);
  }
  const blob=arrayBufferToBlob(await response.arrayBuffer(),response.headers.get('Content-Type')||'audio/mpeg');
  if(!blob.size)throw new Error('AI narrator returned an empty audio file.');
  releaseItem(state.narration);
  const url=URL.createObjectURL(blob),duration=await probeAudioDuration(url);
  const model=response.headers.get('X-LD-Model')||'gpt-4o-mini-tts';
  const inputTokens=Number(response.headers.get('X-LD-Input-Tokens'))||0;
  const outputTokens=Number(response.headers.get('X-LD-Output-Tokens'))||0;
  const totalTokens=Number(response.headers.get('X-LD-Total-Tokens'))||(inputTokens+outputTokens);
  const hasUsage=inputTokens>0||outputTokens>0;
  const calculatedCost=hasUsage?((inputTokens*0.60+outputTokens*12)/1000000):(duration/60*0.015);
  state.narration={
    name:'LD-AI-Narrator-'+voice+'.mp3',mime:blob.type||'audio/mpeg',size:blob.size,url,objectUrl:true,
    browserStored:true,generated:true,model,voice,sourceKey,duration
  };
  await putGeneratedNarrator(blob,state.narration);
  setupAudioElement('narration');applyVolumes();saveProject();
  recordApiUsage({
    feature:'narrator_voice',featureLabel:'Narrator voice',model,
    inputTokens,outputTokens,totalTokens,costUsd:calculatedCost,estimated:!hasUsage
  });
  setNarratorAiStatus('AI narrator ready · '+voice+' · '+fmt(duration)+' · '+money(calculatedCost)+(hasUsage?'':' EST.'),'ready');
  return {reused:false,costUsd:calculatedCost,sourceKey};
}

function setAutoCutStatus(message){const el=$('autoCutStatus');if(el)el.textContent=message;}
function missingStageNames(){return STAGES.filter(s=>!state.clips.has(s));}
function refreshEndingPhotoUi(){
  const el=$('endingPhotoMeta');if(!el)return;
  const item=state.clips.get('ENDING');
  if(item&&isImageItem(item)){
    el.textContent='✓ '+(item.name||'ENDING photo')+' · 5.0s ready';
    el.classList.add('ready');
  }else{
    el.textContent='Missing ENDING photo · required before FULL AUTO CUT';
    el.classList.remove('ready');
  }
}
function refreshAutoCutUi(){
  const script=$('autoCutScript');if(script&&document.activeElement!==script)script.value=state.autoCut?.script||'';
  const topic=$('projectTopic');if(topic&&document.activeElement!==topic)topic.value=state.projectTopic||'';
  const missing=missingStageNames(),ready=missing.length===0;
  const btn=$('autoCutBtn'),previewBtn=$('previewAutoCutBtn');
  if(btn)btn.disabled=!ready;
  if(previewBtn)previewBtn.disabled=!ready;
  syncNarratorControls();refreshEndingPhotoUi();
  if(state.autoCut?.enabled){
    const captionStages=Object.keys(state.autoCut.captions||{}).length;
    setAutoCutStatus('Auto Cut ready · ENDING locked 5.0s · thumbnail hold 4.5–5.0s · narrator off last 0.5s · '+captionStages+' caption stage'+(captionStages===1?'':'s')+' · local engine FREE');
  }else{
    if(!ready)setAutoCutStatus('Missing stage'+(missing.length>1?'s':'')+': '+missing.join(', ')+'. Add '+(missing.length===1&&missing[0]==='ENDING'?'the ENDING photo':'all required stages')+' first.');
    else if(!String(state.autoCut.script||'').trim()&&!String(state.projectTopic||'').trim())setAutoCutStatus('Ready · enter Project Topic once, then FULL AUTO CUT will generate narration + voice automatically.');
    else setAutoCutStatus('Ready for true one-tap Auto Cut.');
  }
}
async function runFullAutoCut(previewAfter=false){
  const missing=missingStageNames();
  if(missing.length)return alert('Missing stage'+(missing.length>1?'s':'')+': '+missing.join(', ')+'. '+(missing.length===1&&missing[0]==='ENDING'?'Import the ENDING photo first.':'Load all required stages first.'));
  let script=String($('autoCutScript')?$('autoCutScript').value:state.autoCut.script||'').trim();
  const topic=String($('projectTopic')?.value||state.projectTopic||'').trim();
  const autoNarrator=$('autoNarrator')?$('autoNarrator').checked:true;
  const voice=String($('narratorVoice')?.value||state.autoCut.narratorVoice||'cedar');
  if(!script&&!topic)return alert('Enter the Project Topic once. FULL AUTO CUT will generate narration text and AI voice automatically.');
  const btn=$('autoCutBtn'),previewBtn=$('previewAutoCutBtn');
  if(btn)btn.disabled=true;if(previewBtn)previewBtn.disabled=true;
  state.autoCut.enabled=true;
  state.autoCut.builtAt=new Date().toISOString();
  state.projectTopic=topic||state.projectTopic;
  state.autoCut.autoNarrator=autoNarrator;
  state.autoCut.narratorVoice=voice;
  state.autoCut.plan=buildAutoCutPlan();
  $('narrationVol').value='1';
  $('musicVol').value='0.16';
  $('clipVol').value='0.42';
  $('autoDuck').checked=true;
  applyVolumes();
  beginApiGeneration('FULL AUTO CUT');
  try{
    if(!script)script=await generateAutoNarrationScript(topic);
    state.autoCut.script=script;
    state.autoCut.captions=buildAutoCaptions(script);
    if($('autoCutScript'))$('autoCutScript').value=script;
    if(autoNarrator){
      setAutoCutStatus('Step 2/3 · generating AI narrator voice…');
      const generated=await generateAiNarrator(script,voice);
      state.autoCut.narratorSourceKey=generated.sourceKey||'';
    }
    setAutoCutStatus('Step 3/3 · building cuts, subtitles and audio mix…');
    recordApiUsage({feature:'auto_cut_local',featureLabel:'Auto Cut Engine',model:'Local v1',free:true});
    endApiGeneration();
    saveProject();render();refreshAutoCutUi();
    setAutoCutStatus('ONE CLICK complete · narration + AI voice '+(autoNarrator?'ready':'text only')+' · HOOK no voice · ENDING voice stops at 4.5s · cuts + subtitles + SFX/music mix ready');
    if(previewAfter)playAll();
  }catch(e){
    endApiGeneration();saveProject();render();refreshAutoCutUi();
    setAutoCutStatus('Auto Cut stopped · '+String(e?.message||e));
    alert(String(e?.message||e));
  }finally{
    if(btn)btn.disabled=STAGES.some(s=>!state.clips.has(s));
    if(previewBtn)previewBtn.disabled=STAGES.some(s=>!state.clips.has(s));
  }
}
function drawAutoTransition(ctx,stage,time,duration){
  if(!state.autoCut?.enabled)return;
  const plan=autoCutStagePlan(stage);if(!plan)return;
  const t=Math.max(0,Number(time)||0),d=Math.max(.1,Number(duration)||1),fade=(state.autoCut.transitionMs||160)/1000;
  let alpha=0;
  if(plan.transitionIn==='fade'&&t<fade)alpha=Math.max(alpha,1-t/fade);
  if(plan.transitionOut==='fade'&&d-t<fade)alpha=Math.max(alpha,1-Math.max(0,d-t)/fade);
  if(alpha>0){
    ctx.save();ctx.fillStyle='rgba(0,0,0,'+Math.min(.88,alpha*.88)+')';ctx.fillRect(0,0,720,1280);ctx.restore();
  }
}
function drawCaption(ctx,text){
  if(!text)return;
  ctx.save();
  ctx.font='800 34px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const maxWidth=610,words=String(text).split(/\s+/),lines=[];let line='';
  for(const word of words){
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;
  }
  if(line)lines.push(line);
  const shown=lines.slice(0,3),lineH=43,boxH=shown.length*lineH+28,y=1070;
  ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(45,y-boxH/2,630,boxH);
  ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=8;
  shown.forEach((ln,i)=>ctx.fillText(ln,360,y-(shown.length-1)*lineH/2+i*lineH,maxWidth));
  ctx.restore();
}
function updatePreviewCaption(){
  const el=$('previewCaption');if(!el)return;
  const stage=STAGES[state.playIndex]||$('previewStage')?.textContent||'';
  const item=state.clips.get(stage),dur=effectiveDuration(stage,item);
  const text=autoCaptionAt(stage,previewStageTime(),dur);
  el.textContent=text;el.style.display=text?'block':'none';
  updateThumbnailOverlay();
}
window.LDRunFullAutoCut=runFullAutoCut;

function fmt(sec){
  if(!Number.isFinite(sec))return'—';
  const m=Math.floor(sec/60),s=Math.max(0,sec-m*60);
  return m+':'+s.toFixed(1).padStart(4,'0');
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function detectStage(name){
  const s=String(name||'').toUpperCase().replace(/[^A-Z0-9]+/g,' ');
  if(/\bHOOK\b/.test(s))return'HOOK';
  if(/\bENDING\b|\bEND CARD\b|\bOUTRO\b/.test(s))return'ENDING';
  const m=s.match(/\bP\s*0?(1[0-4]|[1-9])\b/);
  return m?'P'+Number(m[1]):null;
}
function firstMissing(){return STAGES.find(x=>!state.clips.has(x))||null;}
function firstMissingVideo(){return STAGES.find(x=>x!=='ENDING'&&!state.clips.has(x))||null;}
function isImageItem(item){return !!item&&(item.kind==='image'||String(item.mime||'').startsWith('image/'));}
function totalDuration(){return STAGES.reduce((sum,s)=>sum+effectiveDuration(s,state.clips.get(s)),0);}
function duplicateStages(){
  const byName=new Map(),dupes=new Set();
  for(const [stage,item] of state.clips){
    const key=String(item?.name||'').trim().toLowerCase();
    if(!key)continue;
    if(byName.has(key)){dupes.add(stage);dupes.add(byName.get(key));}
    else byName.set(key,stage);
  }
  return dupes;
}
function safeJson(text,fallback=null){try{return JSON.parse(String(text||''));}catch{return fallback;}}

function openExportDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window))return reject(new Error('Persistent browser storage is unavailable.'));
    const req=indexedDB.open(EXPORT_DB,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(EXPORT_STORE))db.createObjectStore(EXPORT_STORE);
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Could not open persistent export storage.'));
  });
}
async function putBrowserExport(blob,meta){
  const db=await openExportDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readwrite');
      tx.objectStore(EXPORT_STORE).put({
        blob,
        name:meta?.name||'LD-Editor-Lab-Final.webm',
        mime:meta?.mime||blob.type||'video/webm',
        size:Number(blob.size)||0,
        savedAt:meta?.savedAt||new Date().toISOString()
      },EXPORT_KEY);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Could not save rendered video.'));
      tx.onabort=()=>reject(tx.error||new Error('Rendered video save was aborted.'));
    });
  }finally{db.close();}
}
async function getBrowserExport(){
  const db=await openExportDb();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readonly');
      const req=tx.objectStore(EXPORT_STORE).get(EXPORT_KEY);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error||new Error('Could not restore rendered video.'));
    });
  }finally{db.close();}
}
async function clearBrowserExport(){
  if(!('indexedDB' in window))return;
  const db=await openExportDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readwrite');
      tx.objectStore(EXPORT_STORE).delete(EXPORT_KEY);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Could not clear saved render.'));
    });
  }finally{db.close();}
}
async function putProjectThumbnail(file){
  const db=await openExportDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readwrite');
      tx.objectStore(EXPORT_STORE).put({
        blob:file,
        name:file.name||'thumbnail',
        mime:file.type||'image/jpeg',
        size:Number(file.size)||0,
        savedAt:new Date().toISOString()
      },THUMB_KEY);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Could not save thumbnail.'));
      tx.onabort=()=>reject(tx.error||new Error('Thumbnail save was aborted.'));
    });
  }finally{db.close();}
}
async function getProjectThumbnail(){
  const db=await openExportDb();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readonly');
      const req=tx.objectStore(EXPORT_STORE).get(THUMB_KEY);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error||new Error('Could not restore thumbnail.'));
    });
  }finally{db.close();}
}
async function clearProjectThumbnail(){
  if(!('indexedDB' in window))return;
  const db=await openExportDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readwrite');
      tx.objectStore(EXPORT_STORE).delete(THUMB_KEY);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Could not clear thumbnail.'));
    });
  }finally{db.close();}
}
async function putEndingImage(file){
  const db=await openExportDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readwrite');
      tx.objectStore(EXPORT_STORE).put({
        blob:file,name:file.name||'ending-image',mime:file.type||'image/jpeg',
        size:Number(file.size)||0,savedAt:new Date().toISOString()
      },ENDING_IMAGE_KEY);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Could not save ENDING image.'));
      tx.onabort=()=>reject(tx.error||new Error('ENDING image save was aborted.'));
    });
  }finally{db.close();}
}
async function getEndingImage(){
  const db=await openExportDb();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readonly');
      const req=tx.objectStore(EXPORT_STORE).get(ENDING_IMAGE_KEY);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error||new Error('Could not restore ENDING image.'));
    });
  }finally{db.close();}
}
async function clearEndingImage(){
  if(!('indexedDB' in window))return;
  const db=await openExportDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(EXPORT_STORE,'readwrite');
      tx.objectStore(EXPORT_STORE).delete(ENDING_IMAGE_KEY);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Could not clear ENDING image.'));
    });
  }finally{db.close();}
}
function updateThumbnailMeta(){
  const el=$('thumbnailMeta');if(!el)return;
  el.textContent=state.thumbnail?(state.thumbnail.name+' · final 0.5s'):'No thumbnail loaded';
}
async function setThumbnailFile(file){
  if(!file||!String(file.type||'').startsWith('image/'))return alert('Please choose a thumbnail image.');
  if(state.thumbnail?.objectUrl&&state.thumbnail.url)URL.revokeObjectURL(state.thumbnail.url);
  const url=URL.createObjectURL(file);
  state.thumbnail={name:file.name,mime:file.type,size:file.size,url,objectUrl:true,browserStored:true};
  await putProjectThumbnail(file).catch(()=>{});
  updateThumbnailMeta();saveProject();
}
function loadImageElement(url){
  return new Promise((resolve,reject)=>{
    if(!url)return resolve(null);
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('Could not load thumbnail image.'));
    img.src=url;
  });
}
function drawCover(ctx,img,x,y,w,h){
  if(!img||!img.naturalWidth||!img.naturalHeight)return;
  const s=Math.max(w/img.naturalWidth,h/img.naturalHeight);
  const dw=img.naturalWidth*s,dh=img.naturalHeight*s;
  ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function updateThumbnailOverlay(){
  const img=$('thumbnailOverlay');if(!img)return;
  const stage=STAGES[state.playIndex]||'';
  const show=stage==='ENDING'&&previewStageTime()>=4.5&&state.thumbnail?.url;
  if(show){if(img.src!==state.thumbnail.url)img.src=state.thumbnail.url;img.style.display='block';}
  else img.style.display='none';
}

async function requestPersistentStorage(){
  try{if(navigator.storage?.persist)await navigator.storage.persist();}catch{}
}
async function downloadBrowserExport(){
  const rec=await getBrowserExport().catch(()=>null);
  if(!rec?.blob)return alert('Saved render is unavailable. Please render the final video again.');
  const name=rec.name||'LD-Editor-Lab-Final.webm';
  const mime=rec.mime||rec.blob.type||'video/webm';
  if(typeof window.showSaveFilePicker==='function'){
    try{
      const handle=await window.showSaveFilePicker({
        suggestedName:name,
        types:[{description:'WebM video',accept:{[mime]:['.webm']}}]
      });
      const writable=await handle.createWritable();
      await writable.write(rec.blob);await writable.close();
      $('exportStatus').textContent='Video saved. A persistent copy remains in LD Editor Lab.';
      return;
    }catch(e){if(e?.name==='AbortError')return;}
  }
  const url=URL.createObjectURL(rec.blob);
  const a=document.createElement('a');
  a.href=url;a.download=name;a.rel='noopener';a.style.display='none';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('exportStatus').textContent='Download started. A persistent copy remains in LD Editor Lab.';
}
async function shareBrowserExport(){
  const rec=await getBrowserExport().catch(()=>null);
  if(!rec?.blob)return alert('Saved render is unavailable. Please render the final video again.');
  const file=new File([rec.blob],rec.name||'LD-Editor-Lab-Final.webm',{type:rec.mime||rec.blob.type||'video/webm'});
  try{
    if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:file.name});return;}
  }catch(e){if(e?.name==='AbortError')return;}
  alert('Sharing is not supported here. Use Download rendered video instead.');
}

function serialItem(item){
  if(!item||!item.native)return null;
  return {
    id:item.id,name:item.name,mime:item.mime||'',url:item.url,size:Number(item.size)||0,
    duration:Number(item.duration)||0,width:Number(item.width)||0,height:Number(item.height)||0,native:true
  };
}
function projectPayload(){
  const clips={};
  for(const [stage,item] of state.clips.entries()){
    const clean=serialItem(item);if(clean)clips[stage]=clean;
  }
  return {
    version:VERSION,clips,
    projectTopic:state.projectTopic||'',
    narration:serialItem(state.narration),
    music:serialItem(state.music),
    thumbnail:state.thumbnail?{name:state.thumbnail.name||'thumbnail',mime:state.thumbnail.mime||'image/jpeg',size:Number(state.thumbnail.size)||0,browserStored:true}:null,
    lastExport:state.lastExport||null,
    apiTracker:state.apiTracker,
    autoCut:state.autoCut,
    volumes:{
      narration:Number($('narrationVol').value),
      music:Number($('musicVol').value),
      clip:Number($('clipVol').value),
      autoDuck:$('autoDuck').checked
    },
    updatedAt:new Date().toISOString()
  };
}
function saveProject(){
  const raw=JSON.stringify(projectPayload());
  try{localStorage.setItem(STORE,raw);}catch{}
  if(isNative()&&typeof window.LDNative.saveProjectState==='function'){
    try{window.LDNative.saveProjectState(raw);}catch{}
  }
}
function readProjectRaw(){
  if(isNative()&&typeof window.LDNative.loadProjectState==='function'){
    try{
      const raw=window.LDNative.loadProjectState();
      if(raw&&String(raw).trim())return String(raw);
    }catch{}
  }
  try{return localStorage.getItem(STORE)||'';}catch{return'';}
}
function restoreProject(){
  const data=safeJson(readProjectRaw(),null);
  if(!data||typeof data!=='object')return;
  for(const stage of STAGES){
    const item=data.clips?.[stage];
    if(item?.native&&item.url)state.clips.set(stage,{stage,...item});
  }
  if(data.narration?.native&&data.narration.url)state.narration=data.narration;
  if(data.music?.native&&data.music.url)state.music=data.music;
  if(data.lastExport&&(data.lastExport.uri||data.lastExport.browserStored))state.lastExport=data.lastExport;
  state.projectTopic=String(data.projectTopic||'');
  if($('projectTopic'))$('projectTopic').value=state.projectTopic;
  state.apiTracker=normalizeApiTracker(data.apiTracker);
  state.autoCut=normalizeAutoCut(data.autoCut);
  if($('autoCutScript'))$('autoCutScript').value=state.autoCut.script||'';
  if(data.volumes){
    $('narrationVol').value=Number.isFinite(Number(data.volumes.narration))?data.volumes.narration:1;
    $('musicVol').value=Number.isFinite(Number(data.volumes.music))?data.volumes.music:0.18;
    $('clipVol').value=Number.isFinite(Number(data.volumes.clip))?data.volumes.clip:0.45;
    $('autoDuck').checked=data.volumes.autoDuck!==false;
  }
}

function probeVideoUrl(url,name){
  return new Promise((resolve,reject)=>{
    const v=document.createElement('video');v.preload='metadata';
    v.onloadedmetadata=()=>resolve({duration:v.duration,width:v.videoWidth,height:v.videoHeight});
    v.onerror=()=>reject(new Error('Cannot read '+name));
    v.src=url;
  });
}
function loadMetadataFile(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),v=document.createElement('video');v.preload='metadata';
    v.onloadedmetadata=()=>resolve({url,duration:v.duration,width:v.videoWidth,height:v.videoHeight});
    v.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Cannot read '+file.name));};
    v.src=url;
  });
}
async function loadEndingImageFile(file){
  if(!file||!String(file.type||'').startsWith('image/'))throw new Error('ENDING must be a photo/image.');
  const url=URL.createObjectURL(file);
  try{
    const img=await loadImageElement(url);
    return {url,duration:5,width:img.naturalWidth||0,height:img.naturalHeight||0,kind:'image',objectUrl:true};
  }catch(e){URL.revokeObjectURL(url);throw e;}
}
async function hydrateRestored(){
  let changed=false;
  for(const stage of STAGES){
    const item=state.clips.get(stage);if(!item?.native)continue;
    try{Object.assign(item,await probeVideoUrl(item.url,item.name));}
    catch{state.clips.delete(stage);changed=true;}
  }
  const endingStored=await getEndingImage().catch(()=>null);
  if(endingStored?.blob){
    const old=state.clips.get('ENDING');if(old)releaseItem(old,false);
    const url=URL.createObjectURL(endingStored.blob);
    try{
      const img=await loadImageElement(url);
      state.clips.set('ENDING',{
        stage:'ENDING',name:endingStored.name||'ending-image',mime:endingStored.mime||endingStored.blob.type||'image/jpeg',
        size:Number(endingStored.size||endingStored.blob.size)||0,url,objectUrl:true,browserStored:true,kind:'image',
        duration:5,width:img.naturalWidth||0,height:img.naturalHeight||0
      });
    }catch{URL.revokeObjectURL(url);await clearEndingImage().catch(()=>{});}
  }
  const aiNarrator=await getGeneratedNarrator().catch(()=>null);
  if(aiNarrator?.blob&&!state.narration?.native){
    if(state.narration?.objectUrl&&state.narration.url)URL.revokeObjectURL(state.narration.url);
    state.narration={
      name:aiNarrator.name||'LD-AI-Narrator.mp3',mime:aiNarrator.mime||aiNarrator.blob.type||'audio/mpeg',
      size:Number(aiNarrator.size||aiNarrator.blob.size)||0,url:URL.createObjectURL(aiNarrator.blob),objectUrl:true,
      browserStored:true,generated:true,model:aiNarrator.model||'gpt-4o-mini-tts',voice:aiNarrator.voice||'cedar',
      sourceKey:aiNarrator.sourceKey||'',duration:Number(aiNarrator.duration)||0
    };
  }
  setupAudioElement('narration');
  setupAudioElement('music');
  const thumbStored=await getProjectThumbnail().catch(()=>null);
  if(thumbStored?.blob){
    if(state.thumbnail?.objectUrl&&state.thumbnail.url)URL.revokeObjectURL(state.thumbnail.url);
    state.thumbnail={
      name:thumbStored.name||'thumbnail',
      mime:thumbStored.mime||thumbStored.blob.type||'image/jpeg',
      size:Number(thumbStored.size||thumbStored.blob.size)||0,
      url:URL.createObjectURL(thumbStored.blob),
      objectUrl:true,
      browserStored:true
    };
  }
  updateThumbnailMeta();
  if(!state.lastExport?.uri){
    const stored=await getBrowserExport().catch(()=>null);
    if(stored?.blob){
      state.lastExport={
        browserStored:true,
        name:stored.name||'LD-Editor-Lab-Final.webm',
        mime:stored.mime||stored.blob.type||'video/webm',
        size:Number(stored.size||stored.blob.size)||0,
        savedAt:stored.savedAt||new Date().toISOString()
      };
    }else if(state.lastExport?.browserStored){state.lastExport=null;}
  }
  if(changed)saveProject();else saveProject(); // also migrates localStorage project into native backup
  render();showLastExport();renderApiTracker();refreshAutoCutUi();
}

function releaseItem(item,deleteNative=true){
  if(!item)return;
  if(item.objectUrl&&item.url)URL.revokeObjectURL(item.url);
  if(deleteNative&&item.native&&item.id&&window.LDNative?.deleteMedia){
    try{window.LDNative.deleteMedia(item.id);}catch{}
  }
}
async function addBrowserFiles(files){
  for(const file of [...files]){
    if(!file.type.startsWith('video/'))continue;
    let stage=detectStage(file.name);
    if(stage==='ENDING')stage=null;
    if(!stage||state.clips.has(stage))stage=firstMissingVideo();
    if(!stage)break;
    try{
      const meta=await loadMetadataFile(file);
      releaseItem(state.clips.get(stage));
      state.clips.set(stage,{stage,name:file.name,mime:file.type,size:file.size,native:false,objectUrl:true,...meta});
    }catch(e){alert(e.message);}
  }
  render();saveProject();
}
async function addNativeClips(items,specificStage){
  for(const raw of items||[]){
    if(!raw?.url)continue;
    let stage=specificStage||detectStage(raw.name);
    if(!specificStage&&stage==='ENDING')stage=null;
    if(!stage||state.clips.has(stage))stage=specificStage||firstMissingVideo();
    if(!stage)break;
    try{
      const meta=await probeVideoUrl(raw.url,raw.name||stage);
      releaseItem(state.clips.get(stage));
      state.clips.set(stage,{stage,...raw,...meta,native:true});
    }catch(e){
      if(raw.id)try{window.LDNative?.deleteMedia?.(raw.id);}catch{}
      alert(e.message);
    }
  }
  render();saveProject();
  const first=specificStage||(items?.length?detectStage(items[0].name):null);
  if(first&&state.clips.has(first))showStage(first,false);
}
function openPicker(kind,multiple=false){
  if(kind==='stage:ENDING'){
    const input=$('endingImageInput');if(input){input.value='';input.click();return;}
  }
  if(isNative()){
    try{window.LDNative.pickMedia(kind,!!multiple);return;}catch{}
  }
  if(kind==='clips')return $('clipInput').click();
  if(kind==='narration')return $('narrationInput').click();
  if(kind==='music')return $('musicInput').click();
  if(kind.startsWith('stage:')){
    const stage=kind.slice(6),input=document.createElement('input');
    input.type='file';input.accept=stage==='ENDING'?'image/*':'video/*';
    input.onchange=()=>addSpecificBrowser(stage,input.files?.[0]);input.click();
  }
}
async function addSpecificBrowser(stage,file){
  if(!file)return;
  try{
    if(stage==='ENDING'){
      const meta=await loadEndingImageFile(file);
      releaseItem(state.clips.get(stage));
      state.clips.set(stage,{stage,name:file.name,mime:file.type,size:file.size,native:false,browserStored:true,...meta});
      await putEndingImage(file);
    }else{
      const meta=await loadMetadataFile(file);
      releaseItem(state.clips.get(stage));
      state.clips.set(stage,{stage,name:file.name,mime:file.type,size:file.size,native:false,objectUrl:true,...meta});
    }
    render();showStage(stage,false);saveProject();
  }catch(e){alert(e.message);}
}

function render(){
  timeline.innerHTML='';
  const dupes=duplicateStages();
  for(const stage of STAGES){
    const item=state.clips.get(stage),target=TARGET[stage];
    const timingReview=!!item&&target&&Number.isFinite(item.duration)&&Math.abs(item.duration-target)>.35;
    const duplicate=dupes.has(stage);
    const row=document.createElement('div');
    row.className='stage-row '+(item?((timingReview||duplicate)?'review':'loaded'):'');
    row.innerHTML=
      '<strong class="stage-name">'+stage+'</strong>'+
      '<span class="file-name">'+(item?escapeHtml(item.name||stage)+(isImageItem(item)?' · PHOTO':''):'Missing '+(stage==='ENDING'?'photo':'clip'))+(duplicate?' · DUPLICATE?':'')+'</span>'+
      '<span class="duration">'+(item?fmt(effectiveDuration(stage,item)):'—')+'</span>'+
      '<span class="target">'+(target?'target '+target+'s':'flexible')+'</span>'+
      (item?'<button class="remove" type="button" title="Remove">×</button>':'')+
      (!item?'<button class="stage-drop" type="button">Add '+stage+'</button>':'');
    if(item)row.querySelector('.remove').onclick=()=>{
      if(preview.getAttribute('src')===item.url){preview.pause();preview.removeAttribute('src');placeholder.style.display='grid';}
      if(stage==='ENDING'&&isImageItem(item)){clearEndingImage().catch(()=>{});const pi=$('previewImage');if(pi){pi.removeAttribute('src');pi.style.display='none';}}
      releaseItem(item);state.clips.delete(stage);render();saveProject();
    };
    else row.querySelector('.stage-drop').onclick=()=>openPicker('stage:'+stage,false);
    timeline.appendChild(row);
  }
  const loaded=state.clips.size,missing=STAGES.length-loaded;
  $('clipCount').textContent=loaded+' / '+STAGES.length;
  $('missingCount').textContent=String(missing);
  $('totalDuration').textContent=fmt(totalDuration());
  $('readyStatus').textContent=dupes.size?('Review duplicate'+(dupes.size>1?'s':'')):missing===0?'Ready':loaded?'Saved · incomplete':'Waiting';
  $('exportBtn').disabled=missing!==0;
  $('playAllBtn').disabled=loaded===0;
  renderApiTracker();refreshAutoCutUi();
  if(loaded&&!preview.getAttribute('src')){
    const first=STAGES.find(s=>state.clips.has(s));showStage(first,false);
  }
}
function setupAudioElement(key){
  const item=state[key],audio=key==='narration'?narrationAudio:musicAudio;
  const metaId=key==='narration'?'narrationMeta':'musicMeta';
  if(!item?.url){
    audio.removeAttribute('src');$(metaId).textContent=key==='narration'?'No narrator loaded':'No music loaded';return;
  }
  audio.src=item.url;
  audio.onloadedmetadata=()=>{
    item.duration=audio.duration;
    $(metaId).textContent=(item.name||key)+' · '+fmt(audio.duration)+(item.generated?' · AI generated · saved':item.native?' · saved':' · session only');
    if(item.native||item.generated)saveProject();
  };
  audio.onerror=()=>{$(metaId).textContent='Saved file unavailable · re-import';};
}
function setBrowserAudio(input,key){
  const file=input.files?.[0];if(!file)return;
  if(key==='narration')clearGeneratedNarrator().catch(()=>{});
  releaseItem(state[key]);const url=URL.createObjectURL(file);
  state[key]={name:file.name,mime:file.type,size:file.size,url,objectUrl:true,native:false};
  setupAudioElement(key);applyVolumes();saveProject();
}
function setNativeAudio(key,raw){
  if(!raw?.url)return;
  if(key==='narration')clearGeneratedNarrator().catch(()=>{});
  releaseItem(state[key]);state[key]={...raw,native:true};
  setupAudioElement(key);applyVolumes();saveProject();
}
window.LDNativeFilesImported=(kind,items)=>{
  if(typeof items==='string')items=safeJson(items,[]);
  if(!Array.isArray(items)||!items.length)return;
  if(kind==='clips')return addNativeClips(items,null);
  if(String(kind).startsWith('stage:'))return addNativeClips(items,String(kind).slice(6));
  if(kind==='narration')return setNativeAudio('narration',items[0]);
  if(kind==='music')return setNativeAudio('music',items[0]);
};

function currentAudioVolumes(){
  const narr=Number($('narrationVol').value),clip=Number($('clipVol').value);
  let music=Number($('musicVol').value);
  if($('autoDuck').checked&&state.narration)music*=0.45;
  return{narr,music,clip};
}
function applyVolumes(){
  const v=currentAudioVolumes();
  preview.volume=v.clip;narrationAudio.volume=Math.min(1,v.narr);musicAudio.volume=v.music;
  $('narrationVolOut').textContent=Math.round(Number($('narrationVol').value)*100)+'%';
  $('musicVolOut').textContent=Math.round(Number($('musicVol').value)*100)+'%';
  $('clipVolOut').textContent=Math.round(Number($('clipVol').value)*100)+'%';
}
function previewStageTime(){return isImageItem(state.clips.get(STAGES[state.playIndex]))?state.imagePreviewTime:(Number(preview.currentTime)||0);}
function updatePreviewProgress(){
  if(!state.playing)return;
  const stage=STAGES[state.playIndex],item=state.clips.get(stage),stageDuration=effectiveDuration(stage,item);
  let elapsed=Math.min(previewStageTime(),stageDuration||previewStageTime());
  for(let i=0;i<state.playIndex;i++)elapsed+=effectiveDuration(STAGES[i],state.clips.get(STAGES[i]));
  const total=totalDuration();$('playTime').textContent=fmt(elapsed)+' / '+fmt(total);
  $('playProgress').style.width=(total?elapsed/total*100:0)+'%';
}
function startImageStagePreview(stage,item){
  cancelAnimationFrame(state.imagePreviewRaf);state.imagePreviewTime=0;
  const started=performance.now(),duration=effectiveDuration(stage,item)||5;
  const tick=now=>{
    if(!state.playing||STAGES[state.playIndex]!==stage)return;
    state.imagePreviewTime=Math.min(duration,(now-started)/1000);
    updatePreviewCaption();updateThumbnailOverlay();updatePreviewProgress();
    if(stage==='ENDING'&&state.imagePreviewTime>=4.5&&!narrationAudio.paused)narrationAudio.pause();
    if(state.imagePreviewTime>=duration){advancePreview();return;}
    state.imagePreviewRaf=requestAnimationFrame(tick);
  };
  state.imagePreviewRaf=requestAnimationFrame(tick);
}
function showStage(stage,autoplay){
  const item=state.clips.get(stage);if(!item)return;
  state.playIndex=STAGES.indexOf(stage);$('previewStage').textContent=stage;placeholder.style.display='none';
  if(stage==='HOOK'&&state.narration){narrationAudio.pause();try{narrationAudio.currentTime=0;}catch{}}
  if(stage==='P1'&&autoplay&&state.narration&&narrationAudio.paused)narrationAudio.play().catch(()=>{});
  preview.removeAttribute('data-advancing');
  const pi=$('previewImage');
  if(isImageItem(item)){
    preview.pause();preview.removeAttribute('src');preview.style.display='none';
    if(pi){pi.src=item.url;pi.style.display='block';}
    state.imagePreviewTime=0;applyVolumes();updatePreviewCaption();updateThumbnailOverlay();
    if(autoplay)startImageStagePreview(stage,item);
  }else{
    cancelAnimationFrame(state.imagePreviewRaf);state.imagePreviewTime=0;
    if(pi)pi.style.display='none';preview.style.display='block';
    preview.src=item.url;preview.currentTime=0;applyVolumes();updatePreviewCaption();updateThumbnailOverlay();
    if(autoplay)preview.play().catch(()=>{});
  }
}
function loadedSequence(){return STAGES.filter(s=>state.clips.has(s));}
async function playAll(){
  const seq=loadedSequence();if(!seq.length)return;
  stopPlayback();state.playing=true;state.playIndex=STAGES.indexOf(seq[0]);
  if(state.narration){narrationAudio.pause();narrationAudio.currentTime=0;}
  if(state.music){musicAudio.currentTime=0;musicAudio.play().catch(()=>{});}
  applyVolumes();showStage(seq[0],true);
}
function stopPlayback(){
  state.playing=false;preview.pause();narrationAudio.pause();musicAudio.pause();cancelAnimationFrame(state.imagePreviewRaf);state.imagePreviewTime=0;
  try{preview.currentTime=0;}catch{}
  updateThumbnailOverlay();
  $('playProgress').style.width='0%';$('playTime').textContent='0:00 / '+fmt(totalDuration());
}
function advancePreview(){
  if(!state.playing)return;
  let i=state.playIndex+1;while(i<STAGES.length&&!state.clips.has(STAGES[i]))i++;
  if(i>=STAGES.length){stopPlayback();return;}showStage(STAGES[i],true);
}
preview.addEventListener('ended',advancePreview);
preview.addEventListener('timeupdate',()=>{
  if(!state.playing)return;
  const stage=STAGES[state.playIndex],item=state.clips.get(stage),stageDuration=effectiveDuration(stage,item);
  updatePreviewCaption();
  if(state.autoCut?.enabled&&stageDuration>0&&preview.currentTime>=stageDuration-.04&&!preview.dataset.advancing){
    preview.dataset.advancing='1';preview.pause();advancePreview();return;
  }
  if(stage==='ENDING'&&preview.currentTime>=4.5&&!narrationAudio.paused)narrationAudio.pause();
  updatePreviewProgress();
});

function blobToBase64(blob){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(String(r.result||'').split(',')[1]||'');
    r.onerror=()=>reject(r.error||new Error('Could not encode render chunk.'));
    r.readAsDataURL(blob);
  });
}
function renderFilename(){
  const d=new Date(),pad=n=>String(n).padStart(2,'0');
  return 'LD-Editor-Lab-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds())+'.webm';
}
function showLastExport(){
  const wrap=$('downloadWrap');wrap.innerHTML='';
  if(!state.lastExport)return;
  if(state.lastExport.uri){
    const btn=document.createElement('button');btn.className='btn primary';btn.type='button';btn.textContent='Open saved video';
    btn.onclick=()=>{
      if(isNative()&&window.LDNative?.openMedia){
        try{window.LDNative.openMedia(state.lastExport.uri,state.lastExport.mime||'video/webm');return;}catch{}
      }
      alert('Saved video: '+(state.lastExport.name||state.lastExport.uri));
    };
    wrap.appendChild(btn);
    const p=document.createElement('p');p.className='meta';
    p.textContent='Saved: '+(state.lastExport.name||'final video')+' · Movies/LD Editor Lab';
    wrap.appendChild(p);
    return;
  }
  if(state.lastExport.browserStored){
    const btn=document.createElement('button');btn.className='btn primary';btn.type='button';btn.textContent='Download rendered video';
    btn.onclick=downloadBrowserExport;wrap.appendChild(btn);
    if(typeof navigator.share==='function'){
      const share=document.createElement('button');share.className='btn ghost';share.type='button';share.textContent='Share / Save video';
      share.onclick=shareBrowserExport;wrap.appendChild(share);
    }
    const p=document.createElement('p');p.className='meta';
    p.textContent='Saved in app storage: '+(state.lastExport.name||'final video')+' · remains available after reopening the app';
    wrap.appendChild(p);
  }
}
async function renderExport(){
  if(STAGES.some(s=>!state.clips.has(s)))return alert('Load HOOK, P1–P14 and ENDING first.');
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){
    return alert('This Android WebView does not support the experimental browser renderer yet.');
  }

  const nativeSave=isNative()&&typeof window.LDNative.beginRender==='function'&&typeof window.LDNative.appendRenderChunk==='function'&&typeof window.LDNative.finishRender==='function';
  const filename=renderFilename();
  if(nativeSave){
    const begin=safeJson(window.LDNative.beginRender(filename,'video/webm'),{ok:false,error:'Native save did not start.'});
    if(!begin?.ok)return alert(begin?.error||'Could not create output file.');
  }

  const canvas=$('renderCanvas'),ctx=canvas.getContext('2d',{alpha:false}),stream=canvas.captureStream(30);
  const ac=new (window.AudioContext||window.webkitAudioContext)();
  const dest=ac.createMediaStreamDestination(),master=ac.createGain();master.connect(dest);
  const renderVideo=document.createElement('video');renderVideo.playsInline=true;renderVideo.preload='auto';renderVideo.muted=false;
  const clipSource=ac.createMediaElementSource(renderVideo),clipGain=ac.createGain();clipSource.connect(clipGain).connect(master);
  const vols=currentAudioVolumes();clipGain.gain.value=vols.clip;
  let narrEl=null,musicEl=null,musicGain=null;
  if(state.narration){
    narrEl=document.createElement('audio');narrEl.src=state.narration.url;narrEl.preload='auto';
    const src=ac.createMediaElementSource(narrEl),gain=ac.createGain();gain.gain.value=vols.narr;src.connect(gain).connect(master);
  }
  if(state.music){
    musicEl=document.createElement('audio');musicEl.src=state.music.url;musicEl.preload='auto';musicEl.loop=true;
    const src=ac.createMediaElementSource(musicEl);musicGain=ac.createGain();musicGain.gain.value=vols.music;src.connect(musicGain).connect(master);
  }
  for(const t of dest.stream.getAudioTracks())stream.addTrack(t);

  const mime=['video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x))||'video/webm';
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4_500_000});
  const chunks=[];
  let nativeWrite=Promise.resolve();
  let nativeWriteError=null;
  rec.ondataavailable=e=>{
    if(!e.data.size)return;
    if(nativeSave){
      nativeWrite=nativeWrite.then(async()=>{
        const base64=await blobToBase64(e.data);
        const result=safeJson(window.LDNative.appendRenderChunk(base64),{ok:false,error:'Native write failed.'});
        if(!result?.ok)throw new Error(result?.error||'Native write failed.');
      }).catch(err=>{nativeWriteError=err;throw err;});
    }else chunks.push(e.data);
  };

  state.exportAbort=false;$('cancelExportBtn').disabled=false;$('exportBtn').disabled=true;
  $('downloadWrap').innerHTML='';$('exportStatus').textContent='Preparing render & save…';$('exportProgress').style.width='0%';
  const renderThumb=state.thumbnail?.url?await loadImageElement(state.thumbnail.url).catch(()=>null):null;
  let drawId=0,currentRenderStage='',currentRenderDuration=0,currentRenderImage=null,currentStillTime=0;
  const draw=()=>{
    ctx.fillStyle='#000';ctx.fillRect(0,0,720,1280);
    const renderTime=currentRenderImage?currentStillTime:(Number(renderVideo.currentTime)||0);
    if(currentRenderImage)drawCover(ctx,currentRenderImage,0,0,720,1280);
    else{
      const vw=renderVideo.videoWidth||720,vh=renderVideo.videoHeight||1280;
      const scale=Math.min(720/vw,1280/vh),w=vw*scale,h=vh*scale;
      ctx.drawImage(renderVideo,(720-w)/2,(1280-h)/2,w,h);
    }
    if(currentRenderStage==='ENDING'&&renderTime>=4.5&&renderThumb){
      ctx.fillStyle='#000';ctx.fillRect(0,0,720,1280);drawCover(ctx,renderThumb,0,0,720,1280);
    }
    if(state.autoCut?.enabled){
      drawAutoTransition(ctx,currentRenderStage,renderTime,currentRenderDuration);
      drawCaption(ctx,autoCaptionAt(currentRenderStage,renderTime,currentRenderDuration));
    }
    drawId=requestAnimationFrame(draw);
  };

  try{
    await ac.resume();rec.start(1000);draw();if(narrEl){narrEl.pause();narrEl.currentTime=0;}musicEl?.play().catch(()=>{});
    const total=totalDuration();let elapsedBase=0;
    for(const stage of STAGES){
      if(state.exportAbort)break;
      const item=state.clips.get(stage),stageDuration=effectiveDuration(stage,item);
      currentRenderStage=stage;currentRenderDuration=stageDuration;
      if(stage==='P1'&&narrEl&&narrEl.paused)narrEl.play().catch(()=>{});
      const plan=autoCutStagePlan(stage);
      if(state.autoCut?.enabled&&plan){
        clipGain.gain.setValueAtTime(Math.min(1.5,vols.clip*(Number(plan.clipFactor)||1)),ac.currentTime);
        if(musicGain)musicGain.gain.setValueAtTime(Math.min(1,vols.music*(Number(plan.musicFactor)||1)),ac.currentTime);
      }else{
        clipGain.gain.setValueAtTime(vols.clip,ac.currentTime);
        if(musicGain)musicGain.gain.setValueAtTime(vols.music,ac.currentTime);
      }
      $('exportStatus').textContent=(state.autoCut?.enabled?'Auto Cut rendering ':'Rendering ')+stage+' of '+STAGES.length+'…';
      if(isImageItem(item)){
        renderVideo.pause();currentRenderImage=await loadImageElement(item.url);currentStillTime=0;
        const started=performance.now();
        await new Promise(resolve=>{
          const tick=now=>{
            if(state.exportAbort){resolve();return;}
            currentStillTime=Math.min(stageDuration,(now-started)/1000);
            if(stage==='ENDING'&&currentStillTime>=4.5&&narrEl&&!narrEl.paused)narrEl.pause();
            $('exportProgress').style.width=((elapsedBase+currentStillTime)/total*100)+'%';
            if(currentStillTime>=stageDuration){resolve();return;}requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }else{
        currentRenderImage=null;currentStillTime=0;renderVideo.src=item.url;renderVideo.currentTime=0;
        await new Promise((resolve,reject)=>{
          const ready=()=>resolve(),bad=()=>reject(new Error('Could not load '+stage));
          if(renderVideo.readyState>=1)return resolve();
          renderVideo.addEventListener('loadedmetadata',ready,{once:true});renderVideo.addEventListener('error',bad,{once:true});
        });
        await renderVideo.play();
        await new Promise((resolve,reject)=>{
          const tick=()=>{
            if(state.exportAbort){renderVideo.pause();resolve();return;}
            const local=Math.min(renderVideo.currentTime,stageDuration);
            if(stage==='ENDING'&&local>=4.5&&narrEl&&!narrEl.paused)narrEl.pause();
            $('exportProgress').style.width=((elapsedBase+local)/total*100)+'%';
            if(renderVideo.ended||local>=stageDuration-.02){renderVideo.pause();resolve();return;}requestAnimationFrame(tick);
          };
          renderVideo.onerror=()=>reject(new Error('Could not render '+stage));tick();
        });
      }
      elapsedBase+=stageDuration;
    }

    narrEl?.pause();musicEl?.pause();cancelAnimationFrame(drawId);
    if(rec.state!=='inactive')rec.stop();
    await new Promise(resolve=>rec.addEventListener('stop',resolve,{once:true}));
    await nativeWrite;
    if(nativeWriteError)throw nativeWriteError;

    if(state.exportAbort){
      if(nativeSave)try{window.LDNative.cancelRender();}catch{}
      $('exportStatus').textContent='Render cancelled.';$('exportProgress').style.width='0%';
    }else if(nativeSave){
      const done=safeJson(window.LDNative.finishRender(),{ok:false,error:'Could not finish saved video.'});
      if(!done?.ok)throw new Error(done?.error||'Could not finish saved video.');
      state.lastExport={uri:done.uri,name:done.name||filename,mime:done.mime||'video/webm',savedAt:new Date().toISOString()};
      saveProject();$('exportProgress').style.width='100%';
      $('exportStatus').textContent='Render complete · saved to Movies/LD Editor Lab.';
      showLastExport();
    }else{
      const blob=new Blob(chunks,{type:mime});
      const savedAt=new Date().toISOString();
      await putBrowserExport(blob,{name:filename,mime,savedAt});
      if(state.exportUrl){URL.revokeObjectURL(state.exportUrl);state.exportUrl=null;}
      state.lastExport={browserStored:true,name:filename,mime,size:blob.size,savedAt};
      saveProject();$('exportProgress').style.width='100%';
      $('exportStatus').textContent='Render complete · saved persistently. Tap Download rendered video.';
      showLastExport();
    }
  }catch(e){
    try{if(rec.state!=='inactive')rec.stop();}catch{}
    if(nativeSave)try{window.LDNative.cancelRender();}catch{}
    cancelAnimationFrame(drawId);$('exportStatus').textContent='Render failed: '+e.message;
  }finally{
    renderVideo.pause();narrEl?.pause();musicEl?.pause();ac.close().catch(()=>{});
    $('cancelExportBtn').disabled=true;$('exportBtn').disabled=STAGES.some(s=>!state.clips.has(s));
  }
}

const checkUpdateBtn=$('checkUpdateBtn'),installUpdateBtn=$('installUpdateBtn');
if(checkUpdateBtn)checkUpdateBtn.onclick=checkForUpdates;
if(installUpdateBtn)installUpdateBtn.onclick=installAvailableUpdate;
const initialUpdateState=getNativeUpdateState();
if(initialUpdateState?.currentVersion)setUpdateStatus('Installed v'+initialUpdateState.currentVersion+' · automatic update checks enabled');
else if(!isNative())setUpdateStatus('Browser build · automatic native updates unavailable here.');

$('clipPickerBtn').onclick=()=>openPicker('clips',true);
$('narrationPickerBtn').onclick=()=>openPicker('narration',false);
$('musicPickerBtn').onclick=()=>openPicker('music',false);
$('clipInput').addEventListener('change',e=>addBrowserFiles(e.target.files));
if($('endingImageInput'))$('endingImageInput').addEventListener('change',()=>addSpecificBrowser('ENDING',$('endingImageInput').files?.[0]));
$('narrationInput').addEventListener('change',()=>setBrowserAudio($('narrationInput'),'narration'));
$('musicInput').addEventListener('change',()=>setBrowserAudio($('musicInput'),'music'));
if($('endingPhotoPickerBtn'))$('endingPhotoPickerBtn').onclick=()=>openPicker('stage:ENDING',false);
if($('thumbnailPickerBtn'))$('thumbnailPickerBtn').onclick=()=>$('thumbnailInput')?.click();
if($('thumbnailInput'))$('thumbnailInput').addEventListener('change',()=>setThumbnailFile($('thumbnailInput').files?.[0]));
['narrationVol','musicVol','clipVol','autoDuck'].forEach(id=>$(id).addEventListener('input',()=>{applyVolumes();saveProject();}));
$('playAllBtn').onclick=playAll;$('stopBtn').onclick=stopPlayback;
if($('autoCutBtn'))$('autoCutBtn').onclick=()=>runFullAutoCut(false);
if($('previewAutoCutBtn'))$('previewAutoCutBtn').onclick=()=>runFullAutoCut(true);
if($('projectTopic'))$('projectTopic').addEventListener('input',()=>{state.projectTopic=$('projectTopic').value;saveProject();refreshAutoCutUi();});
if($('autoCutScript'))$('autoCutScript').addEventListener('input',()=>{state.autoCut.script=$('autoCutScript').value;saveProject();refreshAutoCutUi();});
if($('autoNarrator'))$('autoNarrator').addEventListener('change',()=>{state.autoCut.autoNarrator=$('autoNarrator').checked;syncNarratorControls();saveProject();});
if($('narratorVoice'))$('narratorVoice').addEventListener('change',()=>{state.autoCut.narratorVoice=$('narratorVoice').value;syncNarratorControls();saveProject();});
$('exportBtn').onclick=renderExport;
$('cancelExportBtn').onclick=()=>{state.exportAbort=true;$('cancelExportBtn').disabled=true;};
$('clearBtn').onclick=()=>{
  if(!confirm('Clear all clips, narrator and music saved in LD Editor Lab?'))return;
  stopPlayback();for(const x of state.clips.values())releaseItem(x,false);
  state.clips.clear();state.narration=null;state.music=null;state.lastExport=null;state.projectTopic='';
  if(state.thumbnail?.objectUrl&&state.thumbnail.url)URL.revokeObjectURL(state.thumbnail.url);
  state.thumbnail=null;clearProjectThumbnail().catch(()=>{});clearEndingImage().catch(()=>{});clearGeneratedNarrator().catch(()=>{});
  state.autoCut=normalizeAutoCut(null);
  if($('projectTopic'))$('projectTopic').value='';
  if($('autoCutScript'))$('autoCutScript').value='';
  state.apiTracker.projectCostUsd=0;
  state.apiTracker.lastGenerationCostUsd=0;
  state.apiTracker.lastGenerationId='';
  state.activeGenerationId='';state.activeGenerationLabel='';state.activeGenerationCostUsd=0;
  try{window.LDNative?.clearMedia?.();}catch{}
  try{window.LDNative?.clearProjectState?.();}catch{}
  try{localStorage.removeItem(STORE);}catch{}
  clearBrowserExport().catch(()=>{});
  if(state.exportUrl){URL.revokeObjectURL(state.exportUrl);state.exportUrl=null;}
  narrationAudio.removeAttribute('src');musicAudio.removeAttribute('src');preview.removeAttribute('src');
  placeholder.style.display='grid';$('previewStage').textContent='—';
  $('narrationMeta').textContent='No narrator loaded';$('musicMeta').textContent='No music loaded';
  $('clipInput').value='';if($('endingImageInput'))$('endingImageInput').value='';$('narrationInput').value='';$('musicInput').value='';if($('thumbnailInput'))$('thumbnailInput').value='';updateThumbnailMeta();$('downloadWrap').innerHTML='';
  $('exportStatus').textContent='Ready when all required clips are loaded.';render();saveProject();
};

requestPersistentStorage();restoreProject();applyVolumes();render();hydrateRestored();
})();

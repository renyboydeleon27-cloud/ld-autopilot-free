(()=>{
'use strict';

const VERSION='0.4.1';
// Keep the v0.2 key so existing projects migrate in place after APK update.
const STORE='ld-editor-lab-project-v0.2';
const EXPORT_DB='ld-editor-lab-export-db-v1';
const EXPORT_STORE='exports';
const EXPORT_KEY='last-render';
const STAGES=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
const TARGET={HOOK:10,ENDING:null};
for(let i=1;i<=14;i++)TARGET['P'+i]=10;

const state={
  clips:new Map(),
  narration:null,
  music:null,
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
  playing:false,
  playIndex:0,
  exportAbort:false,
  exportUrl:null
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
  return '  if(!Number.isFinite(sec))return'—';
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
function totalDuration(){return STAGES.reduce((sum,s)=>sum+(Number(state.clips.get(s)?.duration)||0),0);}
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
    narration:serialItem(state.narration),
    music:serialItem(state.music),
    lastExport:state.lastExport||null,
    apiTracker:state.apiTracker,
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
  state.apiTracker=normalizeApiTracker(data.apiTracker);
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
async function hydrateRestored(){
  let changed=false;
  for(const stage of STAGES){
    const item=state.clips.get(stage);if(!item?.native)continue;
    try{Object.assign(item,await probeVideoUrl(item.url,item.name));}
    catch{state.clips.delete(stage);changed=true;}
  }
  setupAudioElement('narration');
  setupAudioElement('music');
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
  render();showLastExport();renderApiTracker();
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
    if(!stage||state.clips.has(stage))stage=firstMissing();
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
    if(!stage||state.clips.has(stage))stage=firstMissing();
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
  if(isNative()){
    try{window.LDNative.pickMedia(kind,!!multiple);return;}catch{}
  }
  if(kind==='clips')return $('clipInput').click();
  if(kind==='narration')return $('narrationInput').click();
  if(kind==='music')return $('musicInput').click();
  if(kind.startsWith('stage:')){
    const stage=kind.slice(6),input=document.createElement('input');
    input.type='file';input.accept='video/*';
    input.onchange=()=>addSpecificBrowser(stage,input.files?.[0]);input.click();
  }
}
async function addSpecificBrowser(stage,file){
  if(!file)return;
  try{
    const meta=await loadMetadataFile(file);
    releaseItem(state.clips.get(stage));
    state.clips.set(stage,{stage,name:file.name,mime:file.type,size:file.size,native:false,objectUrl:true,...meta});
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
      '<span class="file-name">'+(item?escapeHtml(item.name||stage):'Missing clip')+(duplicate?' · DUPLICATE?':'')+'</span>'+
      '<span class="duration">'+(item?fmt(item.duration):'—')+'</span>'+
      '<span class="target">'+(target?'target '+target+'s':'flexible')+'</span>'+
      (item?'<button class="remove" type="button" title="Remove">×</button>':'')+
      (!item?'<button class="stage-drop" type="button">Add '+stage+'</button>':'');
    if(item)row.querySelector('.remove').onclick=()=>{
      if(preview.getAttribute('src')===item.url){preview.pause();preview.removeAttribute('src');placeholder.style.display='grid';}
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
  renderApiTracker();
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
    $(metaId).textContent=(item.name||key)+' · '+fmt(audio.duration)+(item.native?' · saved':' · session only');
    if(item.native)saveProject();
  };
  audio.onerror=()=>{$(metaId).textContent='Saved file unavailable · re-import';};
}
function setBrowserAudio(input,key){
  const file=input.files?.[0];if(!file)return;
  releaseItem(state[key]);const url=URL.createObjectURL(file);
  state[key]={name:file.name,mime:file.type,size:file.size,url,objectUrl:true,native:false};
  setupAudioElement(key);applyVolumes();saveProject();
}
function setNativeAudio(key,raw){
  if(!raw?.url)return;
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
function showStage(stage,autoplay){
  const item=state.clips.get(stage);if(!item)return;
  state.playIndex=STAGES.indexOf(stage);$('previewStage').textContent=stage;placeholder.style.display='none';
  preview.src=item.url;preview.currentTime=0;applyVolumes();if(autoplay)preview.play().catch(()=>{});
}
function loadedSequence(){return STAGES.filter(s=>state.clips.has(s));}
async function playAll(){
  const seq=loadedSequence();if(!seq.length)return;
  stopPlayback();state.playing=true;state.playIndex=STAGES.indexOf(seq[0]);
  if(state.narration){narrationAudio.currentTime=0;narrationAudio.play().catch(()=>{});}
  if(state.music){musicAudio.currentTime=0;musicAudio.play().catch(()=>{});}
  applyVolumes();showStage(seq[0],true);
}
function stopPlayback(){
  state.playing=false;preview.pause();narrationAudio.pause();musicAudio.pause();
  try{preview.currentTime=0;}catch{}
  $('playProgress').style.width='0%';$('playTime').textContent='0:00 / '+fmt(totalDuration());
}
preview.addEventListener('ended',()=>{
  if(!state.playing)return;
  let i=state.playIndex+1;while(i<STAGES.length&&!state.clips.has(STAGES[i]))i++;
  if(i>=STAGES.length){stopPlayback();return;}showStage(STAGES[i],true);
});
preview.addEventListener('timeupdate',()=>{
  if(!state.playing)return;
  let elapsed=preview.currentTime;for(let i=0;i<state.playIndex;i++)elapsed+=state.clips.get(STAGES[i])?.duration||0;
  const total=totalDuration();$('playTime').textContent=fmt(elapsed)+' / '+fmt(total);
  $('playProgress').style.width=(total?elapsed/total*100:0)+'%';
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
  let narrEl=null,musicEl=null;
  if(state.narration){
    narrEl=document.createElement('audio');narrEl.src=state.narration.url;narrEl.preload='auto';
    const src=ac.createMediaElementSource(narrEl),gain=ac.createGain();gain.gain.value=vols.narr;src.connect(gain).connect(master);
  }
  if(state.music){
    musicEl=document.createElement('audio');musicEl.src=state.music.url;musicEl.preload='auto';musicEl.loop=true;
    const src=ac.createMediaElementSource(musicEl),gain=ac.createGain();gain.gain.value=vols.music;src.connect(gain).connect(master);
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
  let drawId=0;
  const draw=()=>{
    const vw=renderVideo.videoWidth||720,vh=renderVideo.videoHeight||1280;
    ctx.fillStyle='#000';ctx.fillRect(0,0,720,1280);
    const scale=Math.min(720/vw,1280/vh),w=vw*scale,h=vh*scale;
    ctx.drawImage(renderVideo,(720-w)/2,(1280-h)/2,w,h);
    drawId=requestAnimationFrame(draw);
  };

  try{
    await ac.resume();rec.start(1000);draw();narrEl?.play().catch(()=>{});musicEl?.play().catch(()=>{});
    const total=totalDuration();let elapsedBase=0;
    for(const stage of STAGES){
      if(state.exportAbort)break;
      const item=state.clips.get(stage);renderVideo.src=item.url;renderVideo.currentTime=0;
      await new Promise((resolve,reject)=>{
        const ready=()=>resolve(),bad=()=>reject(new Error('Could not load '+stage));
        if(renderVideo.readyState>=1)return resolve();
        renderVideo.addEventListener('loadedmetadata',ready,{once:true});renderVideo.addEventListener('error',bad,{once:true});
      });
      await renderVideo.play();$('exportStatus').textContent='Rendering '+stage+' of '+STAGES.length+'…';
      await new Promise((resolve,reject)=>{
        const tick=()=>{
          if(state.exportAbort){renderVideo.pause();resolve();return;}
          $('exportProgress').style.width=((elapsedBase+renderVideo.currentTime)/total*100)+'%';
          if(renderVideo.ended){resolve();return;}requestAnimationFrame(tick);
        };
        renderVideo.onerror=()=>reject(new Error('Could not render '+stage));tick();
      });
      elapsedBase+=Number(item.duration)||0;
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
$('narrationInput').addEventListener('change',()=>setBrowserAudio($('narrationInput'),'narration'));
$('musicInput').addEventListener('change',()=>setBrowserAudio($('musicInput'),'music'));
['narrationVol','musicVol','clipVol','autoDuck'].forEach(id=>$(id).addEventListener('input',()=>{applyVolumes();saveProject();}));
$('playAllBtn').onclick=playAll;$('stopBtn').onclick=stopPlayback;
$('exportBtn').onclick=renderExport;
$('cancelExportBtn').onclick=()=>{state.exportAbort=true;$('cancelExportBtn').disabled=true;};
$('clearBtn').onclick=()=>{
  if(!confirm('Clear all clips, narrator and music saved in LD Editor Lab?'))return;
  stopPlayback();for(const x of state.clips.values())releaseItem(x,false);
  state.clips.clear();state.narration=null;state.music=null;state.lastExport=null;
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
  $('clipInput').value='';$('narrationInput').value='';$('musicInput').value='';$('downloadWrap').innerHTML='';
  $('exportStatus').textContent='Ready when all required clips are loaded.';render();saveProject();
};

requestPersistentStorage();restoreProject();applyVolumes();render();hydrateRestored();
})();+n.toFixed(n>=1?4:6);
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
    const tr=document.createElement('tr');tr.innerHTML='<td colspan="5" class="muted">No paid generations yet.</td>';body.appendChild(tr);return;
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
function totalDuration(){return STAGES.reduce((sum,s)=>sum+(Number(state.clips.get(s)?.duration)||0),0);}
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
    narration:serialItem(state.narration),
    music:serialItem(state.music),
    lastExport:state.lastExport||null,
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
async function hydrateRestored(){
  let changed=false;
  for(const stage of STAGES){
    const item=state.clips.get(stage);if(!item?.native)continue;
    try{Object.assign(item,await probeVideoUrl(item.url,item.name));}
    catch{state.clips.delete(stage);changed=true;}
  }
  setupAudioElement('narration');
  setupAudioElement('music');
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
  render();showLastExport();
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
    if(!stage||state.clips.has(stage))stage=firstMissing();
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
    if(!stage||state.clips.has(stage))stage=firstMissing();
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
  if(isNative()){
    try{window.LDNative.pickMedia(kind,!!multiple);return;}catch{}
  }
  if(kind==='clips')return $('clipInput').click();
  if(kind==='narration')return $('narrationInput').click();
  if(kind==='music')return $('musicInput').click();
  if(kind.startsWith('stage:')){
    const stage=kind.slice(6),input=document.createElement('input');
    input.type='file';input.accept='video/*';
    input.onchange=()=>addSpecificBrowser(stage,input.files?.[0]);input.click();
  }
}
async function addSpecificBrowser(stage,file){
  if(!file)return;
  try{
    const meta=await loadMetadataFile(file);
    releaseItem(state.clips.get(stage));
    state.clips.set(stage,{stage,name:file.name,mime:file.type,size:file.size,native:false,objectUrl:true,...meta});
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
      '<span class="file-name">'+(item?escapeHtml(item.name||stage):'Missing clip')+(duplicate?' · DUPLICATE?':'')+'</span>'+
      '<span class="duration">'+(item?fmt(item.duration):'—')+'</span>'+
      '<span class="target">'+(target?'target '+target+'s':'flexible')+'</span>'+
      (item?'<button class="remove" type="button" title="Remove">×</button>':'')+
      (!item?'<button class="stage-drop" type="button">Add '+stage+'</button>':'');
    if(item)row.querySelector('.remove').onclick=()=>{
      if(preview.getAttribute('src')===item.url){preview.pause();preview.removeAttribute('src');placeholder.style.display='grid';}
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
    $(metaId).textContent=(item.name||key)+' · '+fmt(audio.duration)+(item.native?' · saved':' · session only');
    if(item.native)saveProject();
  };
  audio.onerror=()=>{$(metaId).textContent='Saved file unavailable · re-import';};
}
function setBrowserAudio(input,key){
  const file=input.files?.[0];if(!file)return;
  releaseItem(state[key]);const url=URL.createObjectURL(file);
  state[key]={name:file.name,mime:file.type,size:file.size,url,objectUrl:true,native:false};
  setupAudioElement(key);applyVolumes();saveProject();
}
function setNativeAudio(key,raw){
  if(!raw?.url)return;
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
function showStage(stage,autoplay){
  const item=state.clips.get(stage);if(!item)return;
  state.playIndex=STAGES.indexOf(stage);$('previewStage').textContent=stage;placeholder.style.display='none';
  preview.src=item.url;preview.currentTime=0;applyVolumes();if(autoplay)preview.play().catch(()=>{});
}
function loadedSequence(){return STAGES.filter(s=>state.clips.has(s));}
async function playAll(){
  const seq=loadedSequence();if(!seq.length)return;
  stopPlayback();state.playing=true;state.playIndex=STAGES.indexOf(seq[0]);
  if(state.narration){narrationAudio.currentTime=0;narrationAudio.play().catch(()=>{});}
  if(state.music){musicAudio.currentTime=0;musicAudio.play().catch(()=>{});}
  applyVolumes();showStage(seq[0],true);
}
function stopPlayback(){
  state.playing=false;preview.pause();narrationAudio.pause();musicAudio.pause();
  try{preview.currentTime=0;}catch{}
  $('playProgress').style.width='0%';$('playTime').textContent='0:00 / '+fmt(totalDuration());
}
preview.addEventListener('ended',()=>{
  if(!state.playing)return;
  let i=state.playIndex+1;while(i<STAGES.length&&!state.clips.has(STAGES[i]))i++;
  if(i>=STAGES.length){stopPlayback();return;}showStage(STAGES[i],true);
});
preview.addEventListener('timeupdate',()=>{
  if(!state.playing)return;
  let elapsed=preview.currentTime;for(let i=0;i<state.playIndex;i++)elapsed+=state.clips.get(STAGES[i])?.duration||0;
  const total=totalDuration();$('playTime').textContent=fmt(elapsed)+' / '+fmt(total);
  $('playProgress').style.width=(total?elapsed/total*100:0)+'%';
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
  let narrEl=null,musicEl=null;
  if(state.narration){
    narrEl=document.createElement('audio');narrEl.src=state.narration.url;narrEl.preload='auto';
    const src=ac.createMediaElementSource(narrEl),gain=ac.createGain();gain.gain.value=vols.narr;src.connect(gain).connect(master);
  }
  if(state.music){
    musicEl=document.createElement('audio');musicEl.src=state.music.url;musicEl.preload='auto';musicEl.loop=true;
    const src=ac.createMediaElementSource(musicEl),gain=ac.createGain();gain.gain.value=vols.music;src.connect(gain).connect(master);
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
  let drawId=0;
  const draw=()=>{
    const vw=renderVideo.videoWidth||720,vh=renderVideo.videoHeight||1280;
    ctx.fillStyle='#000';ctx.fillRect(0,0,720,1280);
    const scale=Math.min(720/vw,1280/vh),w=vw*scale,h=vh*scale;
    ctx.drawImage(renderVideo,(720-w)/2,(1280-h)/2,w,h);
    drawId=requestAnimationFrame(draw);
  };

  try{
    await ac.resume();rec.start(1000);draw();narrEl?.play().catch(()=>{});musicEl?.play().catch(()=>{});
    const total=totalDuration();let elapsedBase=0;
    for(const stage of STAGES){
      if(state.exportAbort)break;
      const item=state.clips.get(stage);renderVideo.src=item.url;renderVideo.currentTime=0;
      await new Promise((resolve,reject)=>{
        const ready=()=>resolve(),bad=()=>reject(new Error('Could not load '+stage));
        if(renderVideo.readyState>=1)return resolve();
        renderVideo.addEventListener('loadedmetadata',ready,{once:true});renderVideo.addEventListener('error',bad,{once:true});
      });
      await renderVideo.play();$('exportStatus').textContent='Rendering '+stage+' of '+STAGES.length+'…';
      await new Promise((resolve,reject)=>{
        const tick=()=>{
          if(state.exportAbort){renderVideo.pause();resolve();return;}
          $('exportProgress').style.width=((elapsedBase+renderVideo.currentTime)/total*100)+'%';
          if(renderVideo.ended){resolve();return;}requestAnimationFrame(tick);
        };
        renderVideo.onerror=()=>reject(new Error('Could not render '+stage));tick();
      });
      elapsedBase+=Number(item.duration)||0;
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
$('narrationInput').addEventListener('change',()=>setBrowserAudio($('narrationInput'),'narration'));
$('musicInput').addEventListener('change',()=>setBrowserAudio($('musicInput'),'music'));
['narrationVol','musicVol','clipVol','autoDuck'].forEach(id=>$(id).addEventListener('input',()=>{applyVolumes();saveProject();}));
$('playAllBtn').onclick=playAll;$('stopBtn').onclick=stopPlayback;
$('exportBtn').onclick=renderExport;
$('cancelExportBtn').onclick=()=>{state.exportAbort=true;$('cancelExportBtn').disabled=true;};
$('clearBtn').onclick=()=>{
  if(!confirm('Clear all clips, narrator and music saved in LD Editor Lab?'))return;
  stopPlayback();for(const x of state.clips.values())releaseItem(x,false);
  state.clips.clear();state.narration=null;state.music=null;state.lastExport=null;
  try{window.LDNative?.clearMedia?.();}catch{}
  try{window.LDNative?.clearProjectState?.();}catch{}
  try{localStorage.removeItem(STORE);}catch{}
  clearBrowserExport().catch(()=>{});
  if(state.exportUrl){URL.revokeObjectURL(state.exportUrl);state.exportUrl=null;}
  narrationAudio.removeAttribute('src');musicAudio.removeAttribute('src');preview.removeAttribute('src');
  placeholder.style.display='grid';$('previewStage').textContent='—';
  $('narrationMeta').textContent='No narrator loaded';$('musicMeta').textContent='No music loaded';
  $('clipInput').value='';$('narrationInput').value='';$('musicInput').value='';$('downloadWrap').innerHTML='';
  $('exportStatus').textContent='Ready when all required clips are loaded.';render();
};

requestPersistentStorage();restoreProject();applyVolumes();render();hydrateRestored();
})();
(()=>{
'use strict';

const STAGES=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
const TARGET={HOOK:10,ENDING:null};
for(let i=1;i<=14;i++)TARGET['P'+i]=10;

const state={
  clips:new Map(),
  narration:null,
  music:null,
  playing:false,
  playIndex:0,
  playStartedAt:0,
  exportAbort:false,
  exportUrl:null
};

const $=id=>document.getElementById(id);
const timeline=$('timeline'), preview=$('previewVideo'), placeholder=$('previewPlaceholder');
const narrationAudio=$('narrationAudio'), musicAudio=$('musicAudio');

function fmt(sec){
  if(!Number.isFinite(sec))return'—';
  const m=Math.floor(sec/60),s=Math.max(0,sec-m*60);
  return m+':'+s.toFixed(s>=10?1:1).padStart(4,'0');
}
function detectStage(name){
  const s=String(name||'').toUpperCase().replace(/[^A-Z0-9]+/g,' ');
  if(/\bHOOK\b/.test(s))return'HOOK';
  if(/\bENDING\b|\bEND CARD\b|\bOUTRO\b/.test(s))return'ENDING';
  const m=s.match(/\bP\s*0?(1[0-4]|[1-9])\b/);
  return m?'P'+Number(m[1]):null;
}
function firstMissing(){
  return STAGES.find(x=>!state.clips.has(x))||null;
}
function loadMetadata(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const v=document.createElement('video');
    v.preload='metadata';
    v.onloadedmetadata=()=>resolve({url,duration:v.duration,width:v.videoWidth,height:v.videoHeight});
    v.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Cannot read '+file.name));};
    v.src=url;
  });
}
async function addFiles(files){
  for(const file of [...files]){
    if(!file.type.startsWith('video/'))continue;
    let stage=detectStage(file.name);
    if(!stage||state.clips.has(stage))stage=firstMissing();
    if(!stage)break;
    try{
      const meta=await loadMetadata(file);
      const old=state.clips.get(stage);if(old)URL.revokeObjectURL(old.url);
      state.clips.set(stage,{stage,file,...meta});
    }catch(e){alert(e.message);}
  }
  render();
}
function render(){
  timeline.innerHTML='';
  for(const stage of STAGES){
    const item=state.clips.get(stage),target=TARGET[stage];
    const timingReview=!!item&&target&&Math.abs(item.duration-target)>.35;
    const row=document.createElement('div');
    row.className='stage-row '+(item?(timingReview?'review':'loaded'):'');
    row.innerHTML=
      '<strong class="stage-name">'+stage+'</strong>'+
      '<span class="file-name">'+(item?escapeHtml(item.file.name):'Missing clip')+'</span>'+
      '<span class="duration">'+(item?fmt(item.duration):'—')+'</span>'+
      '<span class="target">'+(target?'target '+target+'s':'flexible')+'</span>'+
      (item?'<button class="remove" type="button" title="Remove">×</button>':'')+
      (!item?'<label class="stage-drop">Add '+stage+' <input type="file" accept="video/*" hidden></label>':'');
    if(item)row.querySelector('.remove').onclick=()=>{
      URL.revokeObjectURL(item.url);state.clips.delete(stage);render();
    };
    else row.querySelector('input').onchange=e=>addSpecific(stage,e.target.files?.[0]);
    timeline.appendChild(row);
  }
  const loaded=state.clips.size, missing=STAGES.length-loaded;
  $('clipCount').textContent=loaded+' / '+STAGES.length;
  $('missingCount').textContent=String(missing);
  $('totalDuration').textContent=fmt(totalDuration());
  $('readyStatus').textContent=missing===0?'Ready':loaded?'Incomplete':'Waiting';
  $('exportBtn').disabled=missing!==0;
  $('playAllBtn').disabled=loaded===0;
  if(loaded&&!preview.src){
    const first=STAGES.find(s=>state.clips.has(s));showStage(first,false);
  }
}
async function addSpecific(stage,file){
  if(!file)return;
  try{
    const meta=await loadMetadata(file),old=state.clips.get(stage);
    if(old)URL.revokeObjectURL(old.url);
    state.clips.set(stage,{stage,file,...meta});render();showStage(stage,false);
  }catch(e){alert(e.message);}
}
function totalDuration(){
  return STAGES.reduce((sum,s)=>sum+(state.clips.get(s)?.duration||0),0);
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function setFileAudio(input,audio,key,metaEl){
  const file=input.files?.[0];
  if(state[key]?.url)URL.revokeObjectURL(state[key].url);
  state[key]=null;audio.removeAttribute('src');
  if(!file){$(metaEl).textContent=key==='narration'?'No narrator loaded':'No music loaded';return;}
  const url=URL.createObjectURL(file);state[key]={file,url};audio.src=url;
  audio.onloadedmetadata=()=>$(metaEl).textContent=file.name+' · '+fmt(audio.duration);
}
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
  state.playIndex=STAGES.indexOf(stage);
  $('previewStage').textContent=stage;placeholder.style.display='none';
  preview.src=item.url;preview.currentTime=0;applyVolumes();
  if(autoplay)preview.play().catch(()=>{});
}
function loadedSequence(){return STAGES.filter(s=>state.clips.has(s));}
async function playAll(){
  const seq=loadedSequence();if(!seq.length)return;
  stopPlayback();
  state.playing=true;state.playIndex=STAGES.indexOf(seq[0]);state.playStartedAt=performance.now();
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
  let i=state.playIndex+1;
  while(i<STAGES.length&&!state.clips.has(STAGES[i]))i++;
  if(i>=STAGES.length){stopPlayback();return;}
  showStage(STAGES[i],true);
});
preview.addEventListener('timeupdate',()=>{
  if(!state.playing)return;
  let elapsed=preview.currentTime;
  for(let i=0;i<state.playIndex;i++)elapsed+=state.clips.get(STAGES[i])?.duration||0;
  const total=totalDuration();
  $('playTime').textContent=fmt(elapsed)+' / '+fmt(total);
  $('playProgress').style.width=(total?elapsed/total*100:0)+'%';
});

async function waitEvent(el,name){
  return new Promise((resolve,reject)=>{
    const ok=()=>{cleanup();resolve();},bad=()=>{cleanup();reject(new Error('Media load failed.'));};
    const cleanup=()=>{el.removeEventListener(name,ok);el.removeEventListener('error',bad);};
    el.addEventListener(name,ok,{once:true});el.addEventListener('error',bad,{once:true});
  });
}
async function renderExport(){
  if(STAGES.some(s=>!state.clips.has(s)))return alert('Load HOOK, P1–P14 and ENDING first.');
  const canvas=$('renderCanvas'),ctx=canvas.getContext('2d',{alpha:false});
  const stream=canvas.captureStream(30);
  const ac=new (window.AudioContext||window.webkitAudioContext)();
  const dest=ac.createMediaStreamDestination();
  const master=ac.createGain();master.connect(dest);
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

  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x))||'video/webm';
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:7_000_000});
  const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  state.exportAbort=false;$('cancelExportBtn').disabled=false;$('exportBtn').disabled=true;
  $('downloadWrap').innerHTML='';$('exportStatus').textContent='Preparing browser render…';$('exportProgress').style.width='0%';

  let drawId=0;
  const draw=()=>{
    const vw=renderVideo.videoWidth||720,vh=renderVideo.videoHeight||1280;
    ctx.fillStyle='#000';ctx.fillRect(0,0,720,1280);
    const scale=Math.min(720/vw,1280/vh),w=vw*scale,h=vh*scale;
    ctx.drawImage(renderVideo,(720-w)/2,(1280-h)/2,w,h);
    drawId=requestAnimationFrame(draw);
  };

  try{
    await ac.resume();rec.start(1000);draw();
    narrEl?.play().catch(()=>{});musicEl?.play().catch(()=>{});
    const total=totalDuration();let elapsedBase=0;
    for(const stage of STAGES){
      if(state.exportAbort)break;
      const item=state.clips.get(stage);
      renderVideo.src=item.url;renderVideo.currentTime=0;
      if(renderVideo.readyState<1)await waitEvent(renderVideo,'loadedmetadata');
      await renderVideo.play();
      $('exportStatus').textContent='Rendering '+stage+'…';
      await new Promise((resolve,reject)=>{
        const tick=()=>{
          if(state.exportAbort){renderVideo.pause();resolve();return;}
          const elapsed=elapsedBase+renderVideo.currentTime;
          $('exportProgress').style.width=(elapsed/total*100)+'%';
          if(renderVideo.ended){resolve();return;}
          requestAnimationFrame(tick);
        };
        renderVideo.onerror=()=>reject(new Error('Could not render '+stage));
        tick();
      });
      elapsedBase+=item.duration;
    }
    narrEl?.pause();musicEl?.pause();cancelAnimationFrame(drawId);
    if(rec.state!=='inactive')rec.stop();
    await new Promise(resolve=>rec.addEventListener('stop',resolve,{once:true}));
    if(state.exportAbort){
      $('exportStatus').textContent='Render cancelled.';$('exportProgress').style.width='0%';
    }else{
      const blob=new Blob(chunks,{type:mime});
      if(state.exportUrl)URL.revokeObjectURL(state.exportUrl);
      state.exportUrl=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=state.exportUrl;a.download='LD-Editor-Lab-Final.webm';a.textContent='Download rendered video';
      $('downloadWrap').appendChild(a);$('exportProgress').style.width='100%';$('exportStatus').textContent='Render complete · local WebM ready.';
    }
  }catch(e){
    try{if(rec.state!=='inactive')rec.stop();}catch{}
    cancelAnimationFrame(drawId);$('exportStatus').textContent='Render failed: '+e.message;
  }finally{
    renderVideo.pause();narrEl?.pause();musicEl?.pause();ac.close().catch(()=>{});
    $('cancelExportBtn').disabled=true;$('exportBtn').disabled=STAGES.some(s=>!state.clips.has(s));
  }
}

$('clipInput').addEventListener('change',e=>addFiles(e.target.files));
$('narrationInput').addEventListener('change',()=>setFileAudio($('narrationInput'),narrationAudio,'narration','narrationMeta'));
$('musicInput').addEventListener('change',()=>setFileAudio($('musicInput'),musicAudio,'music','musicMeta'));
['narrationVol','musicVol','clipVol','autoDuck'].forEach(id=>$(id).addEventListener('input',applyVolumes));
$('playAllBtn').onclick=playAll;$('stopBtn').onclick=stopPlayback;
$('exportBtn').onclick=renderExport;$('cancelExportBtn').onclick=()=>{state.exportAbort=true;$('cancelExportBtn').disabled=true;};
$('clearBtn').onclick=()=>{
  stopPlayback();
  for(const x of state.clips.values())URL.revokeObjectURL(x.url);
  state.clips.clear();
  for(const k of ['narration','music'])if(state[k]?.url){URL.revokeObjectURL(state[k].url);state[k]=null;}
  narrationAudio.removeAttribute('src');musicAudio.removeAttribute('src');preview.removeAttribute('src');
  placeholder.style.display='grid';$('previewStage').textContent='—';
  $('narrationMeta').textContent='No narrator loaded';$('musicMeta').textContent='No music loaded';
  $('clipInput').value='';$('narrationInput').value='';$('musicInput').value='';render();
};
window.addEventListener('beforeunload',()=>{
  for(const x of state.clips.values())URL.revokeObjectURL(x.url);
  if(state.narration?.url)URL.revokeObjectURL(state.narration.url);
  if(state.music?.url)URL.revokeObjectURL(state.music.url);
  if(state.exportUrl)URL.revokeObjectURL(state.exportUrl);
});
applyVolumes();render();
})();
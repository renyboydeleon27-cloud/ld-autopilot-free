const topicEl=document.getElementById('topic');
const formatEl=document.getElementById('format');
const buildBtn=document.getElementById('buildBtn');
const resetBtn=document.getElementById('resetBtn');
const stagesEl=document.getElementById('stages');
const tpl=document.getElementById('stageTemplate');
const projectTitle=document.getElementById('projectTitle');
const stageCount=document.getElementById('stageCount');
const doneCount=document.getElementById('doneCount');
const progressText=document.getElementById('progressText');
const modeText=document.getElementById('modeText');
const stageNav=document.getElementById('stageNav');
const jumpStage=document.getElementById('jumpStage');
const nextIncompleteBtn=document.getElementById('nextIncompleteBtn');
const collapseAllBtn=document.getElementById('collapseAllBtn');
const progressBar=document.getElementById('progressBar');
const progressLabel=document.getElementById('progressLabel');
const completeBanner=document.getElementById('completeBanner');
const toast=document.getElementById('toast');
const auditCard=document.getElementById('auditCard');
const auditStatus=document.getElementById('auditStatus');
const requiredStatus=document.getElementById('requiredStatus');
const remainingStages=document.getElementById('remainingStages');
const auditNextBtn=document.getElementById('auditNextBtn');
const copyAllBtn=document.getElementById('copyAllBtn');
const backupBtn=document.getElementById('backupBtn');

const STORE_KEY='ld-autopilot-free-v1';

function shortsStages(){return ['HOOK',...Array.from({length:14},(_,i)=>`P${i+1}`),'ENDING','THUMBNAIL'];}
function longformStages(){return ['HOOK',...Array.from({length:30},(_,i)=>`S${i+1}`)];}

function sceneRole(stage,format){
  if(stage==='HOOK') return 'Curiosity-first disaster reveal · immediate visual tension';
  if(stage==='ENDING') return 'Branded closing card · reflective final mood';
  if(stage==='THUMBNAIL') return 'High-impact clickable disaster thumbnail';
  const n=Number(stage.slice(1));
  if(format==='shorts'){
    if(n<=3) return 'Normal world · location · context · cause';
    if(n<=6) return 'Warning signs · trigger · disaster begins';
    if(n<=10) return 'Escalation · peak impact · human response';
    if(n<=12) return 'Wider impact · aftermath · rescue';
    return 'Lessons · legacy · emotional conclusion';
  }
  if(n<=3) return 'Calm normal life · setting introduction';
  if(n<=6) return 'Warning signs · buildup · historical/scientific context';
  if(n<=10) return 'Trigger · disaster begins';
  if(n<=15) return 'Escalation · infrastructure failure · reactions';
  if(n<=20) return 'Peak disaster · strongest cinematic impact';
  if(n<=24) return 'Wider regional/national impact';
  if(n<=27) return 'Aftermath · rescue · response';
  if(n<=29) return 'Lessons · historical significance';
  return 'Conclusion · final emotional beat';
}

function defaultImagePrompt(stage,format,topic){
  const ratio=format==='shorts'?'portrait 9:16':'landscape 16:9';
  if(stage==='ENDING') return `Create the Living Disaster Book ENDING illustration for ${topic}, ${ratio}. Serious colored historical graphic-novel/anime, hand-inked linework, cel-painted textures, adult characters only, no photorealistic humans, no live action, no 3D CGI people. Include Living Disaster Book branding, chapter title, disaster name/year, THANK YOU FOR WATCHING, LIKE / SHARE / SUBSCRIBE, reflective cinematic mood. Illustration only.`;
  if(stage==='THUMBNAIL') return `Create a high-impact YouTube thumbnail illustration for ${topic}, ${ratio}. Serious colored historical graphic-novel/anime, hand-inked linework, cel-painted textures, adult characters only, no photorealistic humans, no live action, no 3D CGI people. Bold readable disaster headline, dramatic adult foreground subject, strong contrast, cinematic atmosphere. Illustration only.`;
  return `Create ${stage} illustration for ${topic}, ${ratio}. Scene role: ${sceneRole(stage,format)}. Serious colored historical graphic-novel/anime style, detailed 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions, historically believable architecture, clothing, tools and terrain, cinematic foreground-midground-background depth, atmospheric disaster conditions appropriate to the scene. Adult characters only. No embedded text. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore.`;
}

function defaultFlowPrompt(stage,format,topic){
  const ratio=format==='shorts'?'portrait 9:16':'landscape 16:9';
  return `Animate the supplied ${stage} illustration for exactly 10 seconds, ${ratio}, as one continuous cinematic 2D shot for ${topic}. Use the supplied illustration as the absolute visual reference. Preserve the exact historical graphic-novel/anime linework, cel-painted textures, anatomy, architecture, terrain, objects, perspective, palette and lighting. Begin clearly readable motion within the first 0.5 second and sustain meaningful motion through second 10. Use one dominant PRIMARY ACTION appropriate to the supplied image; animate 3-7 supported environmental elements with believable physics. Animate visible adults only when their pose and visibility safely support restrained natural movement; otherwise keep them static. Use one restrained camera behavior such as a 2-4% push-in, slight track/tilt, controlled pull-back, or event-appropriate documentary vibration. Do not invent unsupported destruction. Preserve adult identity, count and anatomy. Natural SFX only; no music or voice-over. Negative lock: no cuts, transitions, morphing, time-lapse, new people, vehicles or buildings, duplication, anatomy changes, unnatural growth, photoreal drift, live-action transformation, 3D CGI, text, captions, logos or watermark.`;
}

function stageTitle(stage){
  if(stage==='HOOK') return 'Opening Hook';
  if(stage==='ENDING') return 'Ending Card';
  if(stage==='THUMBNAIL') return 'Thumbnail';
  return stage.startsWith('P')?`Panel ${stage.slice(1)}`:`Scene ${stage.slice(1)}`;
}
function requiredReady(card){
  const stage=card.dataset.stage;
  const img=card.querySelector('.image-prompt').value.trim();
  if(stage==='ENDING'||stage==='THUMBNAIL') return !!img;
  const nar=card.querySelector('.narration').value.trim();
  const flow=card.querySelector('.flow-prompt').value.trim();
  return !!nar && !!img && !!flow;
}
function refreshCard(card){
  const ready=requiredReady(card);
  const done=card.querySelector('.done-toggle');
  const status=card.querySelector('.stage-status');
  if(done.checked&&!ready) done.checked=false;
  done.disabled=!ready;
  if(done.checked){status.textContent='Complete';card.classList.add('complete');card.classList.remove('ready');}
  else if(ready){status.textContent='Ready to mark done';card.classList.add('ready');card.classList.remove('complete');}
  else{status.textContent='Needs required fields';card.classList.remove('ready','complete');}
}
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1500);}
async function copyText(text){try{await navigator.clipboard.writeText(text);showToast('Copied');}catch{showToast('Copy failed');}}
function scrollToCard(card){if(!card)return;const body=card.querySelector('.stage-body');body.classList.remove('hidden');card.querySelector('.collapse-btn').textContent='Close';card.scrollIntoView({behavior:'smooth',block:'start'});}
function updateJumpMenu(){jumpStage.innerHTML='';[...stagesEl.querySelectorAll('.stage-card')].forEach(card=>{const opt=document.createElement('option');opt.value=card.dataset.stage;opt.textContent=`${card.dataset.stage} — ${card.querySelector('.stage-title').textContent}`;jumpStage.appendChild(opt);});stageNav.classList.toggle('hidden',!jumpStage.options.length);}
function stagePackage(card){
  const name=card.dataset.stage;
  const narration=card.querySelector('.narration').value;
  const imagePrompt=card.querySelector('.image-prompt').value;
  const flowPrompt=card.querySelector('.flow-prompt').value;
  const parts=[`${name} — ${stageTitle(name)}`,`Scene role: ${sceneRole(name,formatEl.value)}`];
  if(name!=='ENDING'&&name!=='THUMBNAIL') parts.push(`Narration:\n${narration||'[empty]'}`);
  parts.push(`Image prompt:\n${imagePrompt}`);
  if(name!=='ENDING'&&name!=='THUMBNAIL') parts.push(`Flow prompt:\n${flowPrompt}`);
  return parts.join('\n\n');
}

function buildProduction(seed){
  const topic=(seed?.topic||topicEl.value.trim()||'Untitled Disaster');
  const format=seed?.format||formatEl.value;
  topicEl.value=topic;formatEl.value=format;
  const names=format==='shorts'?shortsStages():longformStages();
  const savedStages=seed?.stages||{};
  stagesEl.innerHTML='';
  names.forEach((name,index)=>{
    const node=tpl.content.firstElementChild.cloneNode(true);
    node.dataset.stage=name;
    node.querySelector('.stage-name').textContent=name;
    node.querySelector('.stage-title').textContent=stageTitle(name);
    node.querySelector('.scene-role').textContent=sceneRole(name,format);
    const narration=node.querySelector('.narration');
    const imagePrompt=node.querySelector('.image-prompt');
    const flowPrompt=node.querySelector('.flow-prompt');
    const done=node.querySelector('.done-toggle');
    const flowWrap=node.querySelector('.flow-wrap');
    const narrationWrap=node.querySelector('.narration-wrap');
    const note=node.querySelector('.stage-note');
    const body=node.querySelector('.stage-body');
    const collapseBtn=node.querySelector('.collapse-btn');
    const data=savedStages[name]||{};
    narration.value=data.narration||'';
    imagePrompt.value=data.imagePrompt||defaultImagePrompt(name,format,topic);
    flowPrompt.value=data.flowPrompt||defaultFlowPrompt(name,format,topic);
    done.checked=!!data.done;
    if(index===0){body.classList.remove('hidden');collapseBtn.textContent='Close';}
    if(name==='ENDING'||name==='THUMBNAIL'){
      narrationWrap.classList.add('hidden');flowWrap.classList.add('hidden');note.textContent='Illustration only · no animation prompt';
    } else note.textContent='Narration target ~8 seconds · animation target 10 seconds';
    [narration,imagePrompt,flowPrompt].forEach(el=>el.addEventListener('input',()=>{refreshCard(node);saveCurrent();}));
    done.addEventListener('change',()=>{refreshCard(node);saveCurrent();});
    collapseBtn.addEventListener('click',()=>{const closed=body.classList.toggle('hidden');collapseBtn.textContent=closed?'Open':'Close';});
    node.querySelectorAll('.copy-btn').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.copy;const field=key==='narration'?narration:key==='imagePrompt'?imagePrompt:flowPrompt;copyText(field.value);}));
    node.querySelector('.copy-package-btn').addEventListener('click',()=>copyText(stagePackage(node)));
    node.querySelector('.next-stage-btn').addEventListener('click',()=>scrollToCard(node.nextElementSibling));
    refreshCard(node);stagesEl.appendChild(node);
  });
  projectTitle.textContent=topic;
  modeText.textContent=format==='shorts'?'Shorts 9:16':'Longform 16:9';
  stageCount.textContent=names.length;
  updateJumpMenu();updateStats();saveCurrent();
}

function collectState(){
  const stages={};
  [...stagesEl.querySelectorAll('.stage-card')].forEach(card=>{stages[card.dataset.stage]={narration:card.querySelector('.narration').value,imagePrompt:card.querySelector('.image-prompt').value,flowPrompt:card.querySelector('.flow-prompt').value,done:card.querySelector('.done-toggle').checked};});
  return {version:'1.3',topic:projectTitle.textContent==='No production yet'?'':projectTitle.textContent,format:formatEl.value,stages,updatedAt:new Date().toISOString()};
}
function updateAudit(cards){
  if(!cards.length){auditCard.classList.add('hidden');return;}
  auditCard.classList.remove('hidden');
  const ready=cards.filter(requiredReady);
  const incomplete=cards.filter(c=>!c.querySelector('.done-toggle').checked);
  const missingRequired=cards.filter(c=>!requiredReady(c));
  requiredStatus.textContent=`${ready.length}/${cards.length} ready`;
  if(!incomplete.length){
    auditStatus.textContent='Audit passed';
    remainingStages.textContent='No remaining stages. All required fields are present and every stage is marked Done.';
  }else{
    auditStatus.textContent=`${incomplete.length} stage${incomplete.length===1?'':'s'} remaining`;
    const names=incomplete.map(c=>c.dataset.stage).join(', ');
    const missing=missingRequired.map(c=>c.dataset.stage);
    remainingStages.textContent=`Remaining: ${names}.${missing.length?` Missing required content: ${missing.join(', ')}.`:''}`;
  }
}
function updateStats(){
  const cards=[...stagesEl.querySelectorAll('.stage-card')];
  cards.forEach(refreshCard);
  const done=cards.filter(c=>c.querySelector('.done-toggle').checked&&requiredReady(c)).length;
  const percent=cards.length?Math.round(done/cards.length*100):0;
  doneCount.textContent=done;progressText.textContent=`${percent}%`;progressBar.style.width=`${percent}%`;
  progressLabel.textContent=cards.length?`${done} of ${cards.length} stages complete`:'No production yet';
  completeBanner.classList.toggle('hidden',!cards.length||done!==cards.length);
  updateAudit(cards);
}
function saveCurrent(){updateStats();localStorage.setItem(STORE_KEY,JSON.stringify(collectState()));}
function load(){const raw=localStorage.getItem(STORE_KEY);if(!raw)return;try{const state=JSON.parse(raw);topicEl.value=state.topic||'';formatEl.value=state.format||'shorts';buildProduction(state);}catch(e){console.warn(e)}}
function nextIncomplete(){const card=[...stagesEl.querySelectorAll('.stage-card')].find(c=>!c.querySelector('.done-toggle').checked);scrollToCard(card);if(!card)showToast('All stages complete');}
function copyAllPackages(){const cards=[...stagesEl.querySelectorAll('.stage-card')];if(!cards.length)return showToast('No production yet');const header=`LIVING DISASTER BOOK\n${projectTitle.textContent}\n${modeText.textContent}\n`;copyText(`${header}\n\n${cards.map(stagePackage).join('\n\n====================\n\n')}`);}
function downloadBackup(){
  const state=collectState();
  if(!Object.keys(state.stages).length)return showToast('No production yet');
  const safe=(state.topic||'living-disaster').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${safe||'living-disaster'}-backup.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);showToast('Backup downloaded');
}

buildBtn.addEventListener('click',()=>buildProduction());
resetBtn.addEventListener('click',()=>{localStorage.removeItem(STORE_KEY);stagesEl.innerHTML='';projectTitle.textContent='No production yet';stageCount.textContent='0';doneCount.textContent='0';progressText.textContent='0%';modeText.textContent='—';progressBar.style.width='0%';progressLabel.textContent='No production yet';completeBanner.classList.add('hidden');auditCard.classList.add('hidden');topicEl.value='';formatEl.value='shorts';stageNav.classList.add('hidden');});
jumpStage.addEventListener('change',()=>scrollToCard(stagesEl.querySelector(`[data-stage="${jumpStage.value}"]`)));
nextIncompleteBtn.addEventListener('click',nextIncomplete);
auditNextBtn.addEventListener('click',nextIncomplete);
copyAllBtn.addEventListener('click',copyAllPackages);
backupBtn.addEventListener('click',downloadBackup);
collapseAllBtn.addEventListener('click',()=>{[...stagesEl.querySelectorAll('.stage-card')].forEach(card=>{card.querySelector('.stage-body').classList.add('hidden');card.querySelector('.collapse-btn').textContent='Open';});});
load();

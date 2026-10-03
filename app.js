// Remove only the known accidentally embedded authoring instruction, preserving user prose.
const LD_NARRATION_INSTRUCTION="DOCUMENTARY NARRATION POLISH LOCK: Write natural, human-sounding historical-documentary English for a general audience. Preserve verified facts, dates, places, causes and consequences, but explain technical science in clear cinematic language. Prefer concrete cause-and-effect wording and speakable sentences. Avoid robotic phrasing, awkward event-name insertion, textbook jargon, redundant dates, keyword stuffing and unnecessarily complex clauses. Keep each narration segment concise enough for its intended delivery time. Do not invent facts or certainty.";
function cleanNarrationInstructions(value){
 const pattern=LD_NARRATION_INSTRUCTION.split(/\s+/).map(word=>word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s+');
 return String(value||'').replace(new RegExp(pattern,'g'),'').replace(/[^\S\n]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
window.ldCleanNarrationInstructions=cleanNarrationInstructions;
const topicEl=document.getElementById('topic');
const categoryEl=document.getElementById('productionCategory');
const storyPremiseEl=document.getElementById('storyPremise');
const storyBibleEl=document.getElementById('storyBible');
function syncStorySetup(){const fiction=(categoryEl?.value||'disaster')!=='disaster';const box=document.getElementById('storySetup');if(box)box.hidden=!fiction;const label=document.getElementById('topicLabel');if(label)label.textContent=fiction?'Story title':'Disaster topic';if(topicEl)topicEl.placeholder=fiction?'Give your drama or fantasy story a title':'Event — Location — Year';}
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
const importBackupBtn=document.getElementById('importBackupBtn');
const backupFileInput=document.getElementById('backupFileInput');
const STORE_KEY='ld-autopilot-free-v1';
const DONE_SHADOW_KEY='ld-autopilot-free-done-shadow-v1';
const APPROVAL_LEDGER_KEY='ld-autopilot-free-approval-ledger-v1';
const PROJECT_LIBRARY_KEY='ld-autopilot-free-project-library-v1';
const ACTIVE_PROJECT_KEY='ld-autopilot-free-active-project';
let saveCurrentTimer=null;
function shortsStages(){return ['HOOK',...Array.from({length:14},(_,i)=>`P${i+1}`),'ENDING','THUMBNAIL'];}
function longformStages(){return ['HOOK',...Array.from({length:30},(_,i)=>`S${i+1}`)];}
function sceneRole(stage,format,topic=''){if(window.LDStoryModes?.enabled())return window.LDStoryModes.role(stage);if(stage==='HOOK')return 'ACTIVE DISASTER · HUMAN SURVIVAL · peak-danger opening';if(stage==='ENDING')return 'Branded closing card · reflective final mood';if(stage==='THUMBNAIL')return 'High-impact clickable disaster thumbnail';const n=Number(stage.slice(1));const publicHealthCrisis=/xylazine|zombie drug|tranq|opioid|fentanyl|drug crisis|overdose crisis/i.test(topic);if(format==='shorts'&&publicHealthCrisis){const roles={1:'Public-health context · identify the substance and affected community',2:'Early local evidence · establish the emerging crisis',3:'Spread · surveillance shows the threat expanding',4:'Warning intensifies · growing regional detection',5:'Exposure pattern · xylazine enters the illicit fentanyl supply',6:'Peak human danger · overdose harm and life-threatening exposure',7:'Visible human impact · severe xylazine-associated wounds',8:'Medical complications · infection, sepsis and amputation risk',9:'Scale of the crisis · broader mortality trend and community burden',10:'Medical response · withdrawal management and emergency care',11:'Wound care · treatment support and harm reduction',12:'Overdose response · training and lifesaving intervention',13:'Surveillance and prevention · drug checking and test-strip response',14:'Continuing public-health legacy · Philadelphia response and ongoing harm reduction'};return roles[n]||'Public-health crisis · evidence-based response';}if(format==='shorts'&&window.LDDisasterProgression){const progressionRole=window.LDDisasterProgression.role(topic,stage);if(progressionRole)return progressionRole;}if(format==='shorts'&&/tsunami/i.test(topic)){if(n===1)return 'Location · coastal setting · historical context';if(n===2)return 'Trigger · earthquake source · geologic cause';if(n===3)return 'Initial shaking · local timing · weak warning';if(n===4)return 'Sea recession · first local warning';if(n===5)return 'Water begins to rise · danger escalates';if(n===6)return 'Largest observed wave · peak local impact';if(n===7)return 'Destructive surge · houses swept away';if(n===8)return 'Repeated waves · danger continues';if(n===9)return 'Instrumental evidence · regional tsunami record';if(n===10)return 'Human toll · coastwide survey scale';if(n===11)return 'Historical survey · major run-up measurement';if(n===12)return 'Later survey · extreme reported height';if(n===13)return 'Run-up variability · scientific context';if(n===14)return 'Closing historical identity · legacy';}if(format==='shorts'&&/locust|insect|grasshopper/i.test(topic)){if(n===1)return 'Great Plains location · 1874 historical context';if(n===2)return 'Outbreak scale · regional range';if(n===3)return 'June spread · southern Dakota';if(n===4)return 'July spread · Colorado Nebraska Minnesota';if(n===5)return 'Late July spread · Iowa western Kansas';if(n===6)return 'August spread · southeast Kansas Missouri';if(n===7)return 'October spread · reaches Texas';if(n===8)return 'Agricultural devastation · crops and rangelands';if(n===9)return 'Fields denuded · local destruction';if(n===10)return 'Farming families · severe distress';if(n===11)return 'Relief response · food and assistance';if(n===12)return 'Broader swarm years · continuing crisis';if(n===13)return 'Scientific response · Entomological Commission';if(n===14)return 'Kansas Grasshopper Year · historical legacy';}if(format==='shorts'){if(n<=3)return 'Normal world · location · context · cause/build-up';if(n===4)return 'Trigger · disaster begins · immediate impact';if(n===5)return 'Escalation · destruction intensifies · human danger';if(n===6)return 'Peak impact · major structural failure · survival crisis';if(n===7)return 'Wider destruction · infrastructure failure · crisis expands';if(n===8)return 'Aftershocks · unstable infrastructure · rescue obstacles';if(n===9)return 'Survivors emerge · immediate aftermath · continued danger';if(n===10)return 'Search and rescue · trapped survivors · emergency response';if(n===11)return 'Displacement · emergency shelters · aid shortages';if(n===12)return 'Widespread disruption · damaged infrastructure · long-term impact';if(n===13)return 'Recovery begins · debris clearance · rebuilding';if(n===14)return 'Lessons · preparedness · safer rebuilding · legacy';return 'Recovery · lessons · legacy';}if(n<=3)return 'Calm normal life · setting introduction';if(n<=6)return 'Warning signs · buildup · historical/scientific context';if(n<=10)return 'Trigger · disaster begins';if(n<=15)return 'Escalation · infrastructure failure · reactions';if(n<=20)return 'Peak disaster · strongest cinematic impact';if(n<=24)return 'Wider regional/national impact';if(n<=27)return 'Aftermath · rescue · response';if(n<=29)return 'Lessons · historical significance';return 'Conclusion · final emotional beat';}
function defaultImagePrompt(stage,format,topic){if(window.LDStoryModes?.enabled())return window.LDStoryModes.image(stage,format,topic);const ratio=format==='shorts'?'portrait 9:16':'landscape 16:9';if(stage==='ENDING')return `Create the Living Disaster Book ENDING illustration for ${topic}, ${ratio}. Serious colored historical graphic-novel/anime, hand-inked linework, cel-painted textures, adult characters only, no photorealistic humans, no live action, no 3D CGI people. Include Living Disaster Book branding, chapter title, disaster name/year, THANK YOU FOR WATCHING, LIKE / SHARE / SUBSCRIBE, reflective cinematic mood. Illustration only.`;if(stage==='THUMBNAIL')return `Create a high-impact YouTube thumbnail illustration for ${topic}, ${ratio}. Serious colored historical graphic-novel/anime, hand-inked linework, cel-painted textures, adult characters only, no photorealistic humans, no live action, no 3D CGI people. Bold readable disaster headline, dramatic adult foreground subject, strong contrast, cinematic atmosphere. Illustration only.`;return `Create ${stage} illustration for ${topic}, ${ratio}. Scene role: ${sceneRole(stage,format,topic)}. Serious colored historical graphic-novel/anime style, detailed 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions, historically believable architecture, clothing, tools and terrain, cinematic foreground-midground-background depth, atmospheric disaster conditions appropriate to the scene. Adult characters only. No embedded text. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore.`;}
function defaultFlowPrompt(stage,format,topic){if(window.LDStoryModes?.enabled())return window.LDStoryModes.flow(stage,format,topic);const ratio=format==='shorts'?'portrait 9:16':'landscape 16:9';return `Animate the supplied ${stage} illustration for exactly 10 seconds, ${ratio}, as one continuous cinematic 2D shot for ${topic}. Use the supplied illustration as the absolute visual reference. Preserve the exact historical graphic-novel/anime linework, cel-painted textures, anatomy, architecture, terrain, objects, perspective, palette and lighting. Begin clearly readable motion within the first 0.5 second and sustain meaningful motion through second 10. Use one dominant PRIMARY ACTION appropriate to the supplied image; animate 3-7 supported environmental elements with believable physics. Animate visible adults only when their pose and visibility safely support restrained natural movement; otherwise keep them static. Use one restrained camera behavior such as a 2-4% push-in, slight track/tilt, controlled pull-back, or event-appropriate documentary vibration. Do not invent unsupported destruction. Preserve adult identity, count and anatomy. Natural SFX only; no music or voice-over. Negative lock: no cuts, transitions, morphing, time-lapse, new people, vehicles or buildings, duplication, anatomy changes, unnatural growth, photoreal drift, live-action transformation, 3D CGI, text, captions, logos or watermark.`;}
function stageTitle(stage){if(stage==='HOOK')return 'Opening Hook';if(stage==='ENDING')return 'Ending Card';if(stage==='THUMBNAIL')return 'Thumbnail';return stage.startsWith('P')?`Panel ${stage.slice(1)}`:`Scene ${stage.slice(1)}`;}
function requiredReady(card){const stage=card.dataset.stage;if(window.LDVideoModes?.supports(card)&&card.dataset.videoMode==='text')return !!card.querySelector('.narration').value.trim()&&window.LDVideoModes.valid(card);const img=card.querySelector('.image-prompt').value.trim();if(stage==='ENDING'||stage==='THUMBNAIL')return !!img;const nar=card.querySelector('.narration').value.trim();const flow=card.querySelector('.flow-prompt').value.trim();return !!nar&&!!img&&!!flow;}
function renderApprovalStamp(card){
 const actions=card?.querySelector('.stage-actions-top');
 if(!actions)return;
 let stamp=actions.querySelector('.approved-stamp');
 const done=!!card.querySelector('.done-toggle')?.checked;
 const latest=window.ldApprovedMemory?.stages?.[card.dataset.stage||'']?.latest;
 const approved=done&&((!!latest&&approvedMemoryMatchesCard(card))||ledgerSaysApproved(card));
 if(!approved){
   stamp?.remove();
   card.classList.remove('approved-card');
   return;
 }
 if(!stamp){
   stamp=document.createElement('span');
   stamp.className='approved-stamp';
   actions.prepend(stamp);
 }
 stamp.textContent='✓ APPROVED';
 const when=latest?.approvedAt?new Date(latest.approvedAt):null;
 stamp.title=when&&!Number.isNaN(when.getTime())?'Approved '+when.toLocaleString():'Approved';
 card.classList.add('approved-card');
}
function refreshCard(card){
 const ready=requiredReady(card);
 const legacyReady=!!card.querySelector('.done-toggle')?.checked&&legacyManualDoneAllowed(card);
 const done=card.querySelector('.done-toggle');
 const status=card.querySelector('.stage-status');
 done.disabled=false;
 if(done.checked){
   status.textContent=(ready||legacyReady)?'Complete':'Approved · prompt needs refresh';
   card.classList.add('complete');
   card.classList.remove('ready');
 }else if(ready){
   status.textContent='Ready to mark done';
   card.classList.add('ready');
   card.classList.remove('complete');
 }else{
   status.textContent='Needs required fields · tap Done to validate';
   card.classList.remove('ready','complete');
 }
 renderApprovalStamp(card);
}
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);}
async function copyText(text){try{await navigator.clipboard.writeText(text);showToast('Copied');}catch{showToast('Copy failed');}}
function scrollToCard(card){if(!card)return;const body=card.querySelector('.stage-body');body.classList.remove('hidden');card.querySelector('.collapse-btn').textContent='Close';card.scrollIntoView({behavior:'smooth',block:'start'});}
function updateJumpMenu(){jumpStage.innerHTML='';[...stagesEl.querySelectorAll('.stage-card')].forEach(card=>{const opt=document.createElement('option');opt.value=card.dataset.stage;opt.textContent=`${card.dataset.stage} — ${card.querySelector('.stage-title').textContent}`;jumpStage.appendChild(opt);});stageNav.classList.toggle('hidden',!jumpStage.options.length);}
function stagePackage(card){const name=card.dataset.stage;const narration=card.querySelector('.narration').value;const imagePrompt=card.querySelector('.image-prompt').value;const textMode=window.LDVideoModes?.supports(card)&&card.dataset.videoMode==='text';const flowPrompt=window.LDVideoModes?window.LDVideoModes.prompt(card):card.querySelector('.flow-prompt').value;const parts=[`${name} — ${stageTitle(name)}`,`Scene role: ${sceneRole(name,formatEl.value,topicEl.value)}`];if(name!=='ENDING'&&name!=='THUMBNAIL')parts.push(`Narration:\n${narration||'[empty]'}`);if(!textMode)parts.push(`Image prompt:\n${imagePrompt}`);if(name!=='ENDING'&&name!=='THUMBNAIL')parts.push(`${textMode?'Text-to-Video':'Flow'} prompt:\n${flowPrompt}`);return parts.join('\n\n');}
function doneShadowHash(value){
 const str=String(value||'');let h=2166136261;
 for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
 return (h>>>0).toString(36);
}
function doneShadowIdentityCandidates(){
 const category=window.ldProductionCategory||categoryEl?.value||'disaster';
 const format=formatEl?.value||'shorts';
 const topic=(projectTitle?.textContent&&projectTitle.textContent!=='No production yet'?projectTitle.textContent:topicEl?.value||'').trim();
 const active=localStorage.getItem(ACTIVE_PROJECT_KEY)||'';
 const identity='identity:'+doneShadowHash([category,format,topic,...(window.ldNarrativeFormat==='causal-v1'?['causal-v1']:[])].join('\u241f'));
 return active?['project:'+active,identity]:[identity];
}
function readDoneShadow(){
 try{
  const value=JSON.parse(localStorage.getItem(DONE_SHADOW_KEY)||'{"projects":{}}');
  if(!value||typeof value!=='object'||Array.isArray(value))return {projects:{}};
  value.projects=value.projects&&typeof value.projects==='object'&&!Array.isArray(value.projects)?value.projects:{};
  return value;
 }catch{return {projects:{}};}
}
function stageDoneFingerprint(card){
 if(!card)return '';
 const parts=[
  card.dataset.stage||'',
  card.dataset.videoMode||'image',
  card.querySelector('.narration')?.value||'',
  card.querySelector('.image-prompt')?.value||'',
  card.querySelector('.flow-prompt')?.value||'',
  card.dataset.videoScene||'',
  card.dataset.textVideoPrompt||''
 ];
 return doneShadowHash(parts.join('\u241f'));
}
function writeDoneShadow(card,value){
 if(!card?.dataset?.stage)return;
 const root=readDoneShadow(),now=new Date().toISOString(),fingerprint=value?stageDoneFingerprint(card):'';
 for(const id of doneShadowIdentityCandidates()){
  const record=root.projects[id]&&typeof root.projects[id]==='object'?root.projects[id]:{stages:{}};
  record.stages=record.stages&&typeof record.stages==='object'?record.stages:{};
  record.stages[card.dataset.stage]={done:!!value,fingerprint,updatedAt:now};
  record.updatedAt=now;root.projects[id]=record;
 }
 const entries=Object.entries(root.projects).sort((a,b)=>String(b[1]?.updatedAt||'').localeCompare(String(a[1]?.updatedAt||'')));
 root.projects=Object.fromEntries(entries.slice(0,50));
 try{localStorage.setItem(DONE_SHADOW_KEY,JSON.stringify(root));}catch{}
}
function shadowSaysDone(card){
 if(!card||card.dataset.approvalRevoked==='1')return false;
 const root=readDoneShadow(),fingerprint=stageDoneFingerprint(card);
 for(const id of doneShadowIdentityCandidates()){
  const item=root.projects?.[id]?.stages?.[card.dataset.stage];
  if(!item)continue;
  if(!item.done)return false;
  return !!fingerprint&&item.fingerprint===fingerprint;
 }
 return false;
}
function recoverDoneShadow(cards){
 let count=0;
 for(const card of cards||[]){
  const done=card.querySelector('.done-toggle');
  if(!done||done.checked||(!requiredReady(card)&&!legacyManualDoneAllowed(card))||!shadowSaysDone(card))continue;
  done.checked=true;refreshCard(card);count++;
 }
 return count;
}
function seedDoneShadow(cards){
 for(const card of cards||[]){
  if(card.querySelector('.done-toggle')?.checked)writeDoneShadow(card,true);
 }
}
function slimApprovedSnapshotForStorage(snap){
 if(!snap||typeof snap!=='object')return null;
 return {
  version:'1.1',
  storyVoice:String(snap.storyVoice||'none'),
  storyFocus:String(snap.storyFocus||'auto'),
  stage:String(snap.stage||''),
  topic:String(snap.topic||''),
  format:String(snap.format||''),
  approvedAt:String(snap.approvedAt||''),
  narration:String(snap.narration||''),
  videoMode:String(snap.videoMode||''),
  visualStyle:String(snap.visualStyle||''),
  colorMode:String(snap.colorMode||''),
  year:String(snap.year||''),
  location:String(snap.location||''),
  sharedDetails:String(snap.sharedDetails||''),
  videoScene:String(snap.videoScene||''),
  textVideoSignature:String(snap.textVideoSignature||''),
  auditSignature:String(snap.auditSignature||''),
  approvalMethod:String(snap.approvalMethod||''),
  continuityCanon:snap.continuityCanon&&typeof snap.continuityCanon==='object'?snap.continuityCanon:null
 };
}
function compactApprovedMemoryForStorage(root){
 if(!root||typeof root!=='object'||Array.isArray(root))return root;
 const out={...root,version:'1.1',stages:{}};
 for(const [stage,entry] of Object.entries(root.stages||{})){
  const latest=slimApprovedSnapshotForStorage(entry?.latest);
  if(latest)out.stages[stage]={latest};
 }
 return out;
}
function compactLedgerObject(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {projects:{}};
 const out={projects:{}};
 const entries=Object.entries(value.projects||{}).sort((x,y)=>String(y[1]?.updatedAt||'').localeCompare(String(x[1]?.updatedAt||''))).slice(0,30);
 for(const [id,record] of entries){
  const stages={};
  for(const [stage,item] of Object.entries(record?.stages||{})){
   stages[stage]={approved:!!item?.approved,updatedAt:String(item?.updatedAt||'')};
  }
  out.projects[id]={stages,updatedAt:String(record?.updatedAt||'')};
 }
 return out;
}
function compactProjectStateForStorage(state){
 if(!state||typeof state!=='object'||Array.isArray(state))return state;
 const out={...state};
 if(out.approvedMemory)out.approvedMemory=compactApprovedMemoryForStorage(out.approvedMemory);
 return out;
}
function isStorageQuotaError(error){
 return !!error&&(error.name==='QuotaExceededError'||error.name==='NS_ERROR_DOM_QUOTA_REACHED'||error.code===22||error.code===1014);
}
function compactLdLocalStorage(){
 try{
  const rawLedger=localStorage.getItem(APPROVAL_LEDGER_KEY);
  if(rawLedger){
   const compact=compactLedgerObject(JSON.parse(rawLedger));
   localStorage.setItem(APPROVAL_LEDGER_KEY,JSON.stringify(compact));
  }
 }catch{}
 try{
  const rawCore=localStorage.getItem(STORE_KEY);
  if(rawCore){
   const core=compactProjectStateForStorage(JSON.parse(rawCore));
   localStorage.setItem(STORE_KEY,JSON.stringify(core));
  }
 }catch{}
 try{
  const rawLib=localStorage.getItem(PROJECT_LIBRARY_KEY);
  if(rawLib){
   const lib=JSON.parse(rawLib);
   if(lib&&Array.isArray(lib.projects)){
    lib.projects=lib.projects.map(p=>({...p,state:compactProjectStateForStorage(p.state)}));
    localStorage.setItem(PROJECT_LIBRARY_KEY,JSON.stringify(lib));
   }
  }
 }catch{}
}
function readApprovalLedger(){
 try{
  const value=compactLedgerObject(JSON.parse(localStorage.getItem(APPROVAL_LEDGER_KEY)||'{"projects":{}}'));
  return value;
 }catch{return {projects:{}};}
}
function approvalLedgerSnapshot(card){
 return {
  stage:card?.dataset?.stage||'',
  videoMode:String(card?.dataset?.videoMode||'image'),
  textVideoSignature:String(card?.dataset?.textVideoSignature||'')
 };
}
function writeApprovalLedger(card,value){
 if(!card?.dataset?.stage)return;
 const root=readApprovalLedger(),now=new Date().toISOString();
 for(const id of doneShadowIdentityCandidates()){
  const record=root.projects[id]&&typeof root.projects[id]==='object'?root.projects[id]:{stages:{}};
  record.stages=record.stages&&typeof record.stages==='object'?record.stages:{};
  record.stages[card.dataset.stage]=value
    ?{approved:true,snapshot:approvalLedgerSnapshot(card),updatedAt:now}
    :{approved:false,updatedAt:now};
  record.updatedAt=now;
  root.projects[id]=record;
 }
 const entries=Object.entries(root.projects).sort((x,y)=>String(y[1]?.updatedAt||'').localeCompare(String(x[1]?.updatedAt||'')));
 root.projects=Object.fromEntries(entries.slice(0,50));
 try{localStorage.setItem(APPROVAL_LEDGER_KEY,JSON.stringify(compactLedgerObject(root)));}catch(e){if(isStorageQuotaError(e)){compactLdLocalStorage();try{localStorage.setItem(APPROVAL_LEDGER_KEY,JSON.stringify(compactLedgerObject(root)));}catch{}}}
 card.dataset.approvalCommitted=value?'1':'';
}
function approvalLedgerEntry(stage){
 const root=readApprovalLedger();
 let best=null;
 for(const id of doneShadowIdentityCandidates()){
  const item=root.projects?.[id]?.stages?.[stage];
  if(!item)continue;
  if(!best||String(item.updatedAt||'')>String(best.updatedAt||''))best=item;
 }
 return best;
}
function ledgerSaysApproved(card){
 if(!card||card.dataset.approvalRevoked==='1')return false;
 const item=approvalLedgerEntry(card.dataset.stage||'');
 return !!item?.approved;
}
function applyApprovalLedgerSnapshot(card,snapshot){
 if(!card||!snapshot)return;
 const nar=card.querySelector('.narration'),img=card.querySelector('.image-prompt'),flow=card.querySelector('.flow-prompt'),text=card.querySelector('.text-video-prompt'),scene=card.querySelector('.video-scene');
 if(typeof snapshot.narration==='string'&&snapshot.narration){if(nar)nar.value=snapshot.narration;}
 if(typeof snapshot.imagePrompt==='string'&&snapshot.imagePrompt){if(img)img.value=snapshot.imagePrompt;}
 if(typeof snapshot.flowPrompt==='string'&&snapshot.flowPrompt){if(flow)flow.value=snapshot.flowPrompt;}
 if(snapshot.videoMode==='text'||snapshot.videoMode==='image')card.dataset.videoMode=snapshot.videoMode;
 if(typeof snapshot.textVideoPrompt==='string'&&snapshot.textVideoPrompt){card.dataset.textVideoPrompt=snapshot.textVideoPrompt;if(text)text.value=snapshot.textVideoPrompt;}
 if(typeof snapshot.videoScene==='string'&&snapshot.videoScene){card.dataset.videoScene=snapshot.videoScene;if(scene)scene.value=snapshot.videoScene;}
 if(typeof snapshot.textVideoSignature==='string'&&snapshot.textVideoSignature)card.dataset.textVideoSignature=snapshot.textVideoSignature;
}
function recoverApprovalLedger(cards){
 let count=0;
 for(const card of cards||[]){
  const done=card.querySelector('.done-toggle');
  if(!done||done.checked||card.dataset.approvalRevoked==='1')continue;
  const item=approvalLedgerEntry(card.dataset.stage||'');
  if(!item?.approved)continue;
  applyApprovalLedgerSnapshot(card,item.snapshot);
  done.checked=true;
  card.dataset.approvalCommitted='1';
  refreshCard(card);
  count++;
 }
 return count;
}
function seedApprovalLedger(cards){
 for(const card of cards||[]){
  const done=card.querySelector('.done-toggle');
  const stage=card.dataset.stage||'';
  if(!done?.checked)continue;
  if(card.dataset.approvalCommitted==='1'||window.ldApprovedMemory?.stages?.[stage]?.latest)writeApprovalLedger(card,true);
 }
}
function revokeApproval(stage){
 const card=stagesEl.querySelector('.stage-card[data-stage="'+stage+'"]');
 if(card){
  card.dataset.approvalRevoked='1';
  card.dataset.approvalCommitted='';
  writeApprovalLedger(card,false);
 }
}
function revokeAllApprovals(){
 [...stagesEl.querySelectorAll('.stage-card')].forEach(card=>{
  card.dataset.approvalRevoked='1';
  card.dataset.approvalCommitted='';
  writeApprovalLedger(card,false);
 });
}
function normalizedStageText(value){return cleanNarrationInstructions(value).trim();}
function isSanFrancisco1906Topic(value){
 const text=String(value||'');
 return /San Francisco Earthquake/i.test(text)&&/\b1906\b/.test(text);
}
function legacyProjectApprovalCompat(seed,topic){
 if(!seed||typeof seed!=='object')return false;
 const stages=seed.stages&&typeof seed.stages==='object'?seed.stages:{};
 const hadDone=Object.values(stages).some(item=>item&&item.done===true);
 const hadApproved=Object.keys(seed.approvedMemory?.stages||{}).length>0;
 return hadDone||hadApproved||isSanFrancisco1906Topic(topic);
}
function legacyStageHasSavedWork(data,stage){
 if(!data||typeof data!=='object')return false;
 if(data.done===true)return true;
 if(stage==='ENDING'||stage==='THUMBNAIL')return !!String(data.imagePrompt||'').trim();
 if(data.videoMode==='text')return !!String(data.narration||'').trim()&&!!String(data.textVideoPrompt||'').trim();
 return !!String(data.narration||'').trim()&&!!String(data.imagePrompt||'').trim()&&!!String(data.flowPrompt||'').trim();
}
function legacyManualDoneAllowed(card){
 if(!card)return false;
 const stage=card.dataset.stage||'';
 const isSfP11=isSanFrancisco1906Topic(projectTitle?.textContent||topicEl?.value||'')&&stage==='P11';
 if(window.LDVideoModes?.supports?.(card)&&card.dataset.videoMode==='text'){
   const savedText=String(card.dataset.textVideoPrompt||card.querySelector('.text-video-prompt')?.value||'').trim();
   const approvedP11=window.ldApprovedMemory?.stages?.P11?.latest;
   // P11 was approved under an older San Francisco rule set. Preserve that exact saved
   // T2V prompt instead of forcing the newer P11 frame-lock/signature onto old work.
   if(isSfP11&&savedText&&card.querySelector('.narration')?.value.trim())return true;
   if(isSfP11&&approvedP11&&card.querySelector('.narration')?.value.trim())return true;
   if(card.dataset.legacyManualDone!=='1')return false;
   return !!window.LDVideoModes.legacyCompletionReady?.(card);
 }
 if(card.dataset.legacyManualDone!=='1'&&!isSfP11)return false;
 return requiredReady(card);
}
function effectiveReady(card){
 return requiredReady(card)||(!!card?.querySelector('.done-toggle')?.checked&&legacyManualDoneAllowed(card));
}
function approvedMemoryMatchesCard(card){
 const root=window.ldApprovedMemory;
 const stage=card?.dataset?.stage||'';
 const snap=root?.stages?.[stage]?.latest;
 if(!snap||root?.topic!==topicEl.value.trim()||root?.format!==formatEl.value)return false;
 if(card.dataset.approvalRevoked==='1')return false;
 const mode=card.dataset.videoMode||'image';
 if(snap.videoMode&&snap.videoMode!==mode)return false;
 const current={
   narration:card.querySelector('.narration')?.value||'',
   imagePrompt:card.querySelector('.image-prompt')?.value||'',
   flowPrompt:card.querySelector('.flow-prompt')?.value||'',
   videoScene:card.dataset.videoScene||'',
   textVideoPrompt:card.dataset.textVideoPrompt||''
 };
 let compared=0;
 for(const key of ['narration','imagePrompt','flowPrompt','videoScene','textVideoPrompt']){
   const approved=normalizedStageText(snap[key]||'');
   if(!approved)continue;
   compared++;
   if(approved!==normalizedStageText(current[key]||''))return false;
 }
 return compared>0;
}
function recoverAccidentalDoneReset(){
 const cards=[...stagesEl.querySelectorAll('.stage-card')];
 if(!cards.length)return 0;
 // Repair any missing Done check whose approved snapshot still exactly matches.
 const recoverable=cards.filter(card=>!card.querySelector('.done-toggle')?.checked&&approvedMemoryMatchesCard(card));
 if(!recoverable.length)return 0;
 recoverable.forEach(card=>{card.querySelector('.done-toggle').checked=true;refreshCard(card);});
 return recoverable.length;
}
function buildProduction(seed){if(seed&&['drama','fantasy'].includes(seed.category)&&!window.LDStoryModes){showToast('Open this project in its separate studio.');return;}seed=window.NERSerial?.prepare(seed)||seed;const requestedCategory=seed?(seed.category||'disaster'):(categoryEl?.value||'disaster');const category=['disaster','drama','fantasy'].includes(requestedCategory)?requestedCategory:'disaster';window.ldProductionCategory=category;window.ldNarrativeFormat=category==='disaster'?(window.LDStoryFormat?.normalize(seed?seed.narrativeFormat:document.getElementById('narrativeFormat')?.value)||'original'):'original';const narrativeSelect=document.getElementById('narrativeFormat');if(narrativeSelect){narrativeSelect.value=window.ldNarrativeFormat;narrativeSelect.disabled=true;}if(categoryEl)categoryEl.value=category;syncStorySetup();if(storyPremiseEl)storyPremiseEl.value=seed?.storyPremise||(!seed?storyPremiseEl.value:'');if(storyBibleEl)storyBibleEl.value=seed?.storyBible||(!seed?storyBibleEl.value:'');window.ldYoutubeTitle=typeof seed?.youtubeTitle==='string'?seed.youtubeTitle:null;window.ldFinalPackageMeta=seed?.finalPackageMeta&&typeof seed.finalPackageMeta==='object'&&!Array.isArray(seed.finalPackageMeta)?JSON.parse(JSON.stringify(seed.finalPackageMeta)):(window.ldFinalPackageMeta||{description:'',musicCredit:'',uploadNotes:''});window.ldVideoContinuity=seed?.videoContinuity||{};window.ldProjectLocks=seed?((Object.prototype.hasOwnProperty.call(seed,'projectLocks'))?seed.projectLocks:null):(window.ldProjectLocks||null);const topic=(seed?.topic||topicEl.value.trim()||(category==='disaster'?'Untitled Disaster':'Untitled Story'));const format=seed?.format||formatEl.value;const legacyApprovalCompat=legacyProjectApprovalCompat(seed,topic);const incomingApproved=seed?.approvedMemory&&typeof seed.approvedMemory==='object'&&!Array.isArray(seed.approvedMemory)?seed.approvedMemory:null;const sameApprovedTopic=!seed&&window.ldApprovedMemory&&window.ldApprovedMemory.topic===topic&&window.ldApprovedMemory.format===format&&window.ldApprovedMemory.category===category;window.ldApprovedMemory=compactApprovedMemoryForStorage(incomingApproved?JSON.parse(JSON.stringify(incomingApproved)):(sameApprovedTopic?window.ldApprovedMemory:{version:'1.1',topic,format,category,stages:{}}));const incomingApiUsage=seed?.apiUsage&&typeof seed.apiUsage==='object'&&!Array.isArray(seed.apiUsage)?seed.apiUsage:null;const sameUsageTopic=!seed&&window.ldApiUsage&&window.ldApiUsage.topic===topic&&window.ldApiUsage.format===format&&window.ldApiUsage.category===category;window.ldApiUsage=incomingApiUsage?JSON.parse(JSON.stringify(incomingApiUsage)):(sameUsageTopic?window.ldApiUsage:{version:'1.0',topic,format,category,priceSnapshot:'2026-09-25',currency:'USD',calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}});topicEl.value=topic;formatEl.value=format;const names=window.ldStoryEpisode?Object.keys(seed?.stages||{}).filter(k=>/^P\d+$/.test(k)).sort((a,b)=>Number(a.slice(1))-Number(b.slice(1))):format==='shorts'?shortsStages():longformStages();const savedStages=seed?.stages||{};stagesEl.innerHTML='';names.forEach((name,index)=>{const node=tpl.content.firstElementChild.cloneNode(true);node.dataset.stage=name;node.querySelector('.stage-name').textContent=name;node.querySelector('.stage-title').textContent=stageTitle(name);node.querySelector('.scene-role').textContent=sceneRole(name,format,topic);const narration=node.querySelector('.narration');const imagePrompt=node.querySelector('.image-prompt');const flowPrompt=node.querySelector('.flow-prompt');const done=node.querySelector('.done-toggle');const flowWrap=node.querySelector('.flow-wrap');const narrationWrap=node.querySelector('.narration-wrap');const note=node.querySelector('.stage-note');const body=node.querySelector('.stage-body');const collapseBtn=node.querySelector('.collapse-btn');const data=savedStages[name]||{};node.dataset.legacyManualDone=legacyApprovalCompat&&legacyStageHasSavedWork(data,name)?'1':'';node.dataset.videoMode=data.videoMode==='text'?'text':'image';node.dataset.textVideoPrompt=cleanNarrationInstructions(data.textVideoPrompt);node.dataset.videoScene=cleanNarrationInstructions(data.videoScene);node.dataset.textVideoSignature=data.textVideoSignature||'';node.dataset.approvalRevoked=data.approvalRevoked?'1':'';node.dataset.approvalCommitted=data.approvalCommitted?'1':'';node.dataset.storyVoice=data.storyVoice||'none';node.dataset.storyFocus=data.storyFocus||'auto';node.dataset.storyPolishKey=data.storyPolishKey||'';node.dataset.smartReady=data.smartReady?'1':'';node.dataset.smartReadySignature=data.smartReadySignature||'';narration.value=cleanNarrationInstructions(data.narration);imagePrompt.value=cleanNarrationInstructions(data.imagePrompt)||(window.LDStoryFormat?.decorate(defaultImagePrompt(name,format,topic),name,format)||defaultImagePrompt(name,format,topic));flowPrompt.value=data.flowPrompt||(window.LDStoryFormat?.decorate(defaultFlowPrompt(name,format,topic),name,format)||defaultFlowPrompt(name,format,topic));done.checked=!!data.done||!!data.approvalCommitted;if(index===0){body.classList.remove('hidden');collapseBtn.textContent='Close';}if(name==='ENDING'||name==='THUMBNAIL'){narrationWrap.classList.add('hidden');flowWrap.classList.add('hidden');note.textContent='Illustration only · no animation prompt';}else note.textContent='Narration target ~8 seconds · animation target 10 seconds';[narration,imagePrompt,flowPrompt].forEach(el=>el.addEventListener('input',()=>{refreshCard(node);scheduleCurrentSave();}));done.addEventListener('change',event=>{if(!done.checked&&event.isTrusted){node.dataset.approvalRevoked='1';writeApprovalLedger(node,false);}if(done.checked)node.dataset.approvalRevoked='';const legacyRestore=done.checked&&legacyManualDoneAllowed(node);if(done.checked&&!requiredReady(node)&&!legacyRestore){if(window.LDVideoModes?.supports(node)&&node.dataset.videoMode==='text'){const fixed=window.LDVideoModes.completionReady?.(node);if(!fixed){done.checked=false;showToast(window.LDVideoModes.completionIssue?.(node)||'Complete the required Text-to-Video fields first.');}}else{done.checked=false;showToast('Complete the required fields first.');}}if(event.isTrusted&&done.checked&&(requiredReady(node)||legacyRestore)&&window.LDSmartContinue?.saveApprovedMemory)window.LDSmartContinue.saveApprovedMemory(node,{method:legacyRestore?'legacy-manual-done':'manual-done'});if(done.checked&&(event.isTrusted||window.ldApprovedMemory?.stages?.[node.dataset.stage]?.latest)){writeApprovalLedger(node,true);}writeDoneShadow(node,done.checked);refreshCard(node);saveCurrent();if(done.checked&&legacyRestore)showToast('Done restored · saved approved prompt preserved');});collapseBtn.addEventListener('click',()=>{const closed=body.classList.toggle('hidden');collapseBtn.textContent=closed?'Open':'Close';});node.querySelectorAll('.copy-btn').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.copy;const field=key==='narration'?narration:key==='imagePrompt'?imagePrompt:flowPrompt;try{copyText(key==='flowPrompt'&&window.LDVideoModes?window.LDVideoModes.prompt(node):field.value);}catch(e){showToast(e.message);}}));node.querySelector('.copy-package-btn').addEventListener('click',()=>{try{copyText(stagePackage(node));}catch(e){showToast(e.message);}});node.querySelector('.next-stage-btn').addEventListener('click',()=>scrollToCard(node.nextElementSibling));stagesEl.appendChild(node);});projectTitle.textContent=topic;modeText.textContent=(category==='disaster'?'':window.LDStoryModes.label()+' · ')+(format==='shorts'?'Shorts 9:16':'Longform 16:9');stageCount.textContent=names.length;updateJumpMenu();const builtCards=[...stagesEl.querySelectorAll('.stage-card')];seedApprovalLedger(builtCards);const recoveredLedger=recoverApprovalLedger(builtCards);const recoveredShadow=recoverDoneShadow(builtCards);const recoveredApproved=recoverAccidentalDoneReset();seedDoneShadow(builtCards);seedApprovalLedger(builtCards);const recoveredDone=recoveredLedger+recoveredShadow+recoveredApproved;updateStats();saveCurrent();if(recoveredDone)showToast('Recovered '+recoveredDone+' approved Done stage'+(recoveredDone===1?'':'s'));window.dispatchEvent(new CustomEvent('ld:production-built',{detail:{state:collectState(),fresh:!seed,recoveredDone}}));}
function collectState(){const stages={};[...stagesEl.querySelectorAll('.stage-card')].forEach(card=>{stages[card.dataset.stage]={narration:card.querySelector('.narration').value,imagePrompt:card.querySelector('.image-prompt').value,flowPrompt:card.querySelector('.flow-prompt').value,done:card.querySelector('.done-toggle').checked,videoMode:card.dataset.videoMode||'image',textVideoPrompt:card.dataset.textVideoPrompt||'',videoScene:card.dataset.videoScene||'',textVideoSignature:card.dataset.textVideoSignature||'',approvalRevoked:card.dataset.approvalRevoked==='1',approvalCommitted:ledgerSaysApproved(card),storyVoice:card.dataset.storyVoice||'none',storyFocus:card.dataset.storyFocus||'auto',storyPolishKey:card.dataset.storyPolishKey||'',smartReady:card.dataset.smartReady==='1',smartReadySignature:card.dataset.smartReadySignature||''};});return {version:'2.5',storyEpisode:window.ldStoryEpisode?JSON.parse(JSON.stringify(window.ldStoryEpisode)):null,category:window.ldProductionCategory||'disaster',narrativeFormat:window.ldNarrativeFormat||'original',storyPremise:storyPremiseEl?.value||'',storyBible:storyBibleEl?.value||'',youtubeTitle:window.ldYoutubeTitle??null,finalPackageMeta:window.ldFinalPackageMeta||{description:'',musicCredit:'',uploadNotes:''},videoContinuity:window.ldVideoContinuity||{},projectLocks:window.ldProjectLocks||null,approvedMemory:compactApprovedMemoryForStorage(window.ldApprovedMemory||{version:'1.1',topic:projectTitle.textContent==='No production yet'?'':projectTitle.textContent,format:formatEl.value,stages:{}}),apiUsage:window.ldApiUsage||{version:'1.0',topic:projectTitle.textContent==='No production yet'?'':projectTitle.textContent,format:formatEl.value,priceSnapshot:'2026-09-25',currency:'USD',calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}},topic:projectTitle.textContent==='No production yet'?'':projectTitle.textContent,format:formatEl.value,stages,updatedAt:new Date().toISOString()};}
function updateAudit(cards){if(!cards.length){auditCard.classList.add('hidden');return;}auditCard.classList.remove('hidden');const ready=cards.filter(effectiveReady);const incomplete=cards.filter(c=>!c.querySelector('.done-toggle').checked);const missingRequired=cards.filter(c=>!effectiveReady(c));requiredStatus.textContent=`${ready.length}/${cards.length} ready`;if(!incomplete.length){auditStatus.textContent='Audit passed';remainingStages.textContent='No remaining stages. All required fields are present and every stage is marked Done.';}else{auditStatus.textContent=`${incomplete.length} stage${incomplete.length===1?'':'s'} remaining`;const names=incomplete.map(c=>c.dataset.stage).join(', ');const missing=missingRequired.map(c=>c.dataset.stage);remainingStages.textContent=`Remaining: ${names}.${missing.length?` Missing required content: ${missing.join(', ')}.`:''}`;}}
function updateStats(){const cards=[...stagesEl.querySelectorAll('.stage-card')];cards.forEach(refreshCard);const done=cards.filter(c=>c.querySelector('.done-toggle').checked).length;const percent=cards.length?Math.round(done/cards.length*100):0;doneCount.textContent=done;progressText.textContent=`${percent}%`;progressBar.style.width=`${percent}%`;progressLabel.textContent=cards.length?`${done} of ${cards.length} stages complete`:'No production yet';completeBanner.classList.toggle('hidden',!cards.length||done!==cards.length);updateAudit(cards);}
function saveCurrent(){
 clearTimeout(saveCurrentTimer);saveCurrentTimer=null;
 updateStats();
 const state=collectState();
 const payload=JSON.stringify(state);
 try{
  localStorage.setItem(STORE_KEY,payload);
 }catch(error){
  if(!isStorageQuotaError(error))throw error;
  compactLdLocalStorage();
  try{
   localStorage.setItem(STORE_KEY,payload);
   showToast('Storage compacted automatically · project saved');
  }catch(second){
   console.error('LD AUTO storage quota still exceeded after safe compaction',second);
   showToast('Local storage is full · project kept open, free space before closing');
   return false;
  }
 }
 window.dispatchEvent(new CustomEvent('ld:core-state-saved',{detail:{topic:state.topic,format:state.format,category:state.category,updatedAt:state.updatedAt}}));
 return true;
}
function scheduleCurrentSave(delay=360){
 clearTimeout(saveCurrentTimer);
 saveCurrentTimer=setTimeout(()=>saveCurrent(),delay);
}
function load(){const raw=localStorage.getItem(STORE_KEY);if(!raw)return;try{const state=JSON.parse(raw);topicEl.value=state.topic||'';formatEl.value=state.format||'shorts';if(categoryEl)categoryEl.value=state.category||'disaster';syncStorySetup();buildProduction(state);}catch(e){console.warn(e)}}
function nextIncomplete(){const card=[...stagesEl.querySelectorAll('.stage-card')].find(c=>!c.querySelector('.done-toggle').checked);scrollToCard(card);if(!card)showToast('All stages complete');}
function copyAllPackages(){try{const cards=[...stagesEl.querySelectorAll('.stage-card')];if(!cards.length)return showToast('No production yet');const header=`${window.ldProductionCategory==='disaster'?'LIVING DISASTER BOOK':'NER STUDIO'}\n${projectTitle.textContent}\n${modeText.textContent}\n`;copyText(`${header}\n\n${cards.map(stagePackage).join('\n\n====================\n\n')}`);}catch(e){showToast(e.message);}}
function downloadBackup(){const state=collectState();if(!Object.keys(state.stages).length)return showToast('No production yet');const safe=(state.topic||'living-disaster').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${safe||'living-disaster'}-backup.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);showToast('Backup downloaded');}
function validateBackup(state){if(!state||typeof state!=='object')throw new Error('Invalid backup file');if(!['shorts','longform'].includes(state.format))throw new Error('Unknown production format');if(typeof state.topic!=='string'||!state.topic.trim())throw new Error('Backup has no disaster topic');if(!state.stages||typeof state.stages!=='object')throw new Error('Backup has no stage data');if(state.videoContinuity!==undefined){if(!state.videoContinuity||typeof state.videoContinuity!=='object'||Array.isArray(state.videoContinuity))throw new Error('Invalid video continuity');['year','location','details','environmentDetails'].forEach(k=>{if(state.videoContinuity[k]!==undefined&&typeof state.videoContinuity[k]!=='string')throw new Error('Invalid continuity field');});}if(state.projectLocks!==undefined&&state.projectLocks!==null){if(typeof state.projectLocks!=='object'||Array.isArray(state.projectLocks))throw new Error('Invalid project locks');if(state.projectLocks.videoMode!==undefined&&!['image','text'].includes(state.projectLocks.videoMode))throw new Error('Invalid locked video mode');if(state.projectLocks.visualStyle!==undefined&&!['anime','real'].includes(state.projectLocks.visualStyle))throw new Error('Invalid locked visual style');if(state.projectLocks.colorMode!==undefined&&!['bw','color'].includes(state.projectLocks.colorMode))throw new Error('Invalid locked color mode');}if(state.approvedMemory!==undefined&&state.approvedMemory!==null){if(typeof state.approvedMemory!=='object'||Array.isArray(state.approvedMemory))throw new Error('Invalid approved memory');if(state.approvedMemory.stages!==undefined&&(typeof state.approvedMemory.stages!=='object'||Array.isArray(state.approvedMemory.stages)))throw new Error('Invalid approved memory stages');}if(state.apiUsage!==undefined&&state.apiUsage!==null){if(typeof state.apiUsage!=='object'||Array.isArray(state.apiUsage))throw new Error('Invalid API usage');['calls','inputTokens','cachedInputTokens','outputTokens','totalTokens','estimatedCostUsd'].forEach(k=>{if(state.apiUsage[k]!==undefined&&!Number.isFinite(Number(state.apiUsage[k])))throw new Error('Invalid API usage '+k);});}const expected=state.format==='shorts'?shortsStages():longformStages();const present=Object.keys(state.stages);const unknown=present.filter(name=>!expected.includes(name));if(unknown.length)throw new Error(`Unknown stages: ${unknown.join(', ')}`);expected.forEach(name=>{const item=state.stages[name];if(!item||typeof item!=='object')throw new Error(`Missing stage: ${name}`);['narration','imagePrompt','flowPrompt','textVideoPrompt','videoScene','textVideoSignature','smartReadySignature'].forEach(key=>{if(item[key]!==undefined&&typeof item[key]!=='string')throw new Error(`Invalid ${key} in ${name}`);});if(item.videoMode!==undefined&&!['image','text'].includes(item.videoMode))throw new Error('Invalid video mode');if(item.done!==undefined&&typeof item.done!=='boolean')throw new Error(`Invalid Done status in ${name}`);if(item.approvalCommitted!==undefined&&typeof item.approvalCommitted!=='boolean')throw new Error(`Invalid approval status in ${name}`);if(item.smartReady!==undefined&&typeof item.smartReady!=='boolean')throw new Error(`Invalid Smart Ready status in ${name}`);});return true;}
async function importBackupFile(file){if(!file)return;try{const text=await file.text();const state=JSON.parse(text);validateBackup(state);if(['drama','fantasy'].includes(state.category)&&!window.LDStoryModes)throw new Error('Import this backup in the separate AI Drama or Anime Adventure studio.');localStorage.setItem(STORE_KEY,JSON.stringify(state));topicEl.value=state.topic;formatEl.value=state.format;buildProduction(state);showToast('Backup restored');}catch(err){console.error(err);showToast(`Import failed: ${err.message||'invalid file'}`);}finally{backupFileInput.value='';}}
categoryEl?.addEventListener('change',syncStorySetup);[storyPremiseEl,storyBibleEl].forEach(field=>field?.addEventListener('input',()=>{if(stagesEl.querySelector('.stage-card'))scheduleCurrentSave();}));syncStorySetup();
buildBtn.addEventListener('click',()=>buildProduction());
resetBtn.addEventListener('click',()=>{localStorage.removeItem(STORE_KEY);window.LDStoryFormat?.reset();window.ldFinalPackageMeta={description:'',musicCredit:'',uploadNotes:''};window.ldApprovedMemory={version:'1.0',topic:'',format:'shorts',stages:{}};window.ldApiUsage={version:'1.0',topic:'',format:'shorts',priceSnapshot:'2026-09-25',currency:'USD',calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}};stagesEl.innerHTML='';projectTitle.textContent='No production yet';stageCount.textContent='0';doneCount.textContent='0';progressText.textContent='0%';modeText.textContent='—';progressBar.style.width='0%';progressLabel.textContent='No production yet';completeBanner.classList.add('hidden');auditCard.classList.add('hidden');topicEl.value='';formatEl.value='shorts';if(categoryEl)categoryEl.value='disaster';window.ldProductionCategory='disaster';if(storyPremiseEl)storyPremiseEl.value='';if(storyBibleEl)storyBibleEl.value='';syncStorySetup();stageNav.classList.add('hidden');});
jumpStage.addEventListener('change',()=>scrollToCard(stagesEl.querySelector(`[data-stage="${jumpStage.value}"]`)));
nextIncompleteBtn.addEventListener('click',nextIncomplete);auditNextBtn.addEventListener('click',nextIncomplete);copyAllBtn.addEventListener('click',copyAllPackages);backupBtn.addEventListener('click',downloadBackup);importBackupBtn.addEventListener('click',()=>backupFileInput.click());backupFileInput.addEventListener('change',()=>importBackupFile(backupFileInput.files?.[0]));collapseAllBtn.addEventListener('click',()=>{[...stagesEl.querySelectorAll('.stage-card')].forEach(card=>{card.querySelector('.stage-body').classList.add('hidden');card.querySelector('.collapse-btn').textContent='Open';});});window.addEventListener('ld:api-usage-updated',()=>{if(stagesEl.querySelector('.stage-card'))saveCurrent();});window.addEventListener('ld:approved-memory-saved',()=>{[...stagesEl.querySelectorAll('.stage-card')].forEach(refreshCard);scheduleCurrentSave(80);});window.addEventListener('ld:smart-ready-changed',()=>{if(stagesEl.querySelector('.stage-card'))scheduleCurrentSave(80);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&stagesEl.querySelector('.stage-card'))saveCurrent();});
window.addEventListener('pagehide',()=>{if(stagesEl.querySelector('.stage-card'))saveCurrent();});
window.LDCore=Object.freeze({buildProduction,collectState,compactStorage:compactLdLocalStorage,compactApprovedMemory:compactApprovedMemoryForStorage,loadProductionState:(state)=>buildProduction(state),recoverAccidentalDoneReset,recoverDoneShadow,recoverApprovalLedger,isApprovalCommitted:(stage)=>{const card=stagesEl.querySelector('.stage-card[data-stage="'+stage+'"]');return card?ledgerSaysApproved(card):!!approvalLedgerEntry(stage)?.approved;},revokeApproval,revokeAllApprovals,commitApproval:(stage)=>{const card=stagesEl.querySelector('.stage-card[data-stage="'+stage+'"]');if(card)writeApprovalLedger(card,true);}});compactLdLocalStorage();load();

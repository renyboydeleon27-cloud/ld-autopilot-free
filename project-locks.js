/* LD AUTO v3.34.0 — PROJECT LOCKS: choose once before production */
(()=>{'use strict';

const CORE_KEY='ld-autopilot-free-v1';
const MODE_KEY='ld-auto-visual-mode-v1';
const setup=document.querySelector('.setup');
const stages=document.getElementById('stages');
const buildBtn=document.getElementById('buildBtn');
const toast=document.getElementById('toast');
if(!setup||!buildBtn)return;

let editing=false;

function showToast(message){
  if(!toast)return;
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t=setTimeout(()=>toast.classList.remove('show'),2200);
}
function current(){
  const x=window.ldProjectLocks;
  return x&&x.locked&&['image','text'].includes(x.videoMode)&&['anime','real'].includes(x.visualStyle)?x:null;
}
function hasProduction(){return !!stages?.querySelector('.stage-card');}
function inferExisting(){
  if(!hasProduction())return null;
  const cards=[...stages.querySelectorAll('.stage-card')].filter(c=>/^P(?:[1-9]|1[0-4])$/.test(c.dataset.stage||''));
  let videoMode=cards[0]?.dataset.videoMode==='text'?'text':'image';
  if(cards.length&&!cards.every(c=>(c.dataset.videoMode||'image')===videoMode))videoMode='text';
  const selected=document.getElementById('visualMode')?.value;
  const visualStyle=(selected==='real'||selected==='anime')?selected:(localStorage.getItem(MODE_KEY)==='real'?'real':'anime');
  return {locked:true,videoMode,visualStyle,migrated:true,lockedAt:new Date().toISOString()};
}
function persist(){
  if(window.LDCore?.collectState){
    try{localStorage.setItem(CORE_KEY,JSON.stringify(window.LDCore.collectState()));}catch(e){}
  }
  const field=stages?.querySelector('textarea');
  if(field)field.dispatchEvent(new Event('input',{bubbles:true}));
}
function lockedLabel(lock){
  if(!lock)return 'Project not locked yet.';
  return 'Locked: '+(lock.videoMode==='text'?'Text-to-Video':'Image-to-Video')+' + '+(lock.visualStyle==='real'?'Real Human':'Anime');
}
function ui(){
  return document.getElementById('ldProjectLocks');
}
function readSelection(){
  const root=ui();
  return {
    videoMode:root?.querySelector('input[name="ldProjectVideoMode"]:checked')?.value||'',
    visualStyle:root?.querySelector('input[name="ldProjectVisualStyle"]:checked')?.value||''
  };
}
function setSelection(lock){
  const root=ui(); if(!root)return;
  root.querySelectorAll('input[name="ldProjectVideoMode"]').forEach(x=>x.checked=!!lock&&x.value===lock.videoMode);
  root.querySelectorAll('input[name="ldProjectVisualStyle"]').forEach(x=>x.checked=!!lock&&x.value===lock.visualStyle);
}
function render(){
  const root=ui(); if(!root)return;
  const lock=current();
  const status=root.querySelector('.project-lock-status');
  const lockBtn=root.querySelector('.lock-project-btn');
  const changeBtn=root.querySelector('.change-project-locks-btn');
  const inputs=[...root.querySelectorAll('input[type="radio"]')];

  if(lock&&!editing){
    setSelection(lock);
    inputs.forEach(x=>x.disabled=true);
    lockBtn.hidden=true;
    changeBtn.hidden=false;
    status.textContent=lockedLabel(lock);
    status.dataset.state='locked';
    buildBtn.disabled=false;
  }else{
    inputs.forEach(x=>x.disabled=false);
    lockBtn.hidden=false;
    changeBtn.hidden=true;
    status.textContent=editing?'Choose the new locks, then press Lock Project.':'Choose Video Mode and Visual Style before production.';
    status.dataset.state='open';
    buildBtn.disabled=true;
  }

  document.body.classList.toggle('ld-project-locked',!!lock&&!editing);
}
function syncVisualStyle(lock,force=false){
  localStorage.setItem(MODE_KEY,lock.visualStyle);
  const select=document.getElementById('visualMode');
  if(select){
    const changed=select.value!==lock.visualStyle;
    select.value=lock.visualStyle;
    if(changed||force)select.dispatchEvent(new Event('change',{bubbles:true}));
  }
}
function syncVideoMode(lock){
  if(!hasProduction())return;
  if(window.LDVideoModes?.setAllMode)window.LDVideoModes.setAllMode(lock.videoMode);
  else stages.querySelectorAll('.stage-card').forEach(card=>{
    if(/^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage||''))card.dataset.videoMode=lock.videoMode;
  });
}
function applyLock(lock,{forceVisual=false}={}){
  window.ldProjectLocks=lock;
  syncVisualStyle(lock,forceVisual);
  syncVideoMode(lock);
  window.LDHookChoiceSystem?.render?.();
  window.ldApplyQualityPolish?.();
  persist();
  render();
  window.dispatchEvent(new CustomEvent('ld:project-locks-changed',{detail:{...lock}}));
}
function lockProject(){
  const selected=readSelection();
  if(!['image','text'].includes(selected.videoMode)||!['anime','real'].includes(selected.visualStyle)){
    showToast('Choose both Video Mode and Visual Style first.');
    return;
  }
  const previous=current();
  const next={
    locked:true,
    videoMode:selected.videoMode,
    visualStyle:selected.visualStyle,
    lockedAt:new Date().toISOString()
  };
  const visualChanged=!!previous&&previous.visualStyle!==next.visualStyle;
  const videoChanged=!!previous&&previous.videoMode!==next.videoMode;
  editing=false;
  applyLock(next,{forceVisual:visualChanged});
  if(hasProduction()&&(visualChanged||videoChanged)){
    stages.querySelectorAll('.done-toggle').forEach(done=>{
      done.checked=false;
      done.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }
  showToast('Project locked · '+(next.videoMode==='text'?'Text-to-Video':'Image-to-Video')+' + '+(next.visualStyle==='real'?'Real Human':'Anime'));
}
function changeLocks(){
  const lock=current(); if(!lock)return;
  if(hasProduction()){
    const ok=confirm('Changing Project Locks will rebuild prompts and remove the previous mode/style footprint. Continue?');
    if(!ok)return;
  }
  editing=true;
  setSelection(lock);
  render();
}
function resetForNewProject(){
  editing=false;
  window.ldProjectLocks=null;
  const root=ui();
  if(root)root.querySelectorAll('input[type="radio"]').forEach(x=>{x.checked=false;x.disabled=false;});
  render();
  persist();
}
function migrateIfNeeded(){
  if(current())return;
  const migrated=inferExisting();
  if(!migrated)return;
  window.ldProjectLocks=migrated;
  persist();
}
function syncProduction(){
  if(!current())migrateIfNeeded();
  const lock=current();
  if(!lock){render();return;}
  syncVisualStyle(lock,false);
  syncVideoMode(lock);
  render();
}

function mount(){
  if(ui())return;
  const root=document.createElement('section');
  root.id='ldProjectLocks';
  root.className='project-locks-box';
  root.innerHTML=`
    <div class="project-locks-head">
      <div><span class="audit-label">PROJECT LOCKS</span><strong>Choose once before production</strong></div>
      <span class="project-lock-status">Project not locked yet.</span>
    </div>
    <div class="project-lock-grid">
      <fieldset>
        <legend>Video Mode</legend>
        <label><input type="radio" name="ldProjectVideoMode" value="image"> <span>Image-to-Video</span></label>
        <label><input type="radio" name="ldProjectVideoMode" value="text"> <span>Text-to-Video</span></label>
      </fieldset>
      <fieldset>
        <legend>Visual Style</legend>
        <label><input type="radio" name="ldProjectVisualStyle" value="real"> <span>Real Human</span></label>
        <label><input type="radio" name="ldProjectVisualStyle" value="anime"> <span>Anime</span></label>
      </fieldset>
    </div>
    <div class="project-lock-actions">
      <button type="button" class="primary lock-project-btn">🔒 Lock Project</button>
      <button type="button" class="ghost change-project-locks-btn" hidden>Change Locks</button>
    </div>
  `;
  const oldVisual=setup.querySelector('.visual-mode-field');
  setup.insertBefore(root,oldVisual||buildBtn);
  root.querySelector('.lock-project-btn').addEventListener('click',lockProject);
  root.querySelector('.change-project-locks-btn').addEventListener('click',changeLocks);

  const style=document.createElement('style');
  style.id='ldProjectLocksStyles';
  style.textContent=`
    #ldProjectLocks{grid-column:1/-1;padding:14px;border:2px solid rgba(101,194,141,.55);border-radius:14px;background:rgba(101,194,141,.06)}
    .project-locks-head{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}
    .project-locks-head strong{display:block;margin-top:3px}.project-lock-status{font-size:.82rem;opacity:.9;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.07)}
    .project-lock-status[data-state="locked"]{outline:1px solid rgba(101,194,141,.55)}
    .project-lock-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.project-lock-grid fieldset{margin:0;padding:10px;border:1px solid rgba(255,255,255,.14);border-radius:12px}
    .project-lock-grid legend{font-size:.78rem;font-weight:800;padding:0 5px}.project-lock-grid label{display:flex;align-items:center;gap:7px;padding:7px 4px;font-size:.88rem}
    .project-lock-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.project-lock-actions button{flex:1;min-width:140px}
    .visual-mode-field{display:none!important}
    #productionVideoMethod{display:none!important}
    @media(max-width:620px){.project-lock-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  migrateIfNeeded();
  render();
}

buildBtn.addEventListener('click',e=>{
  if(current())return;
  e.preventDefault();
  e.stopImmediatePropagation();
  showToast('Lock Video Mode and Visual Style first.');
  ui()?.scrollIntoView({behavior:'smooth',block:'center'});
},true);

document.getElementById('newProjectBtn')?.addEventListener('click',()=>setTimeout(resetForNewProject,0));
window.addEventListener('ld:production-built',()=>setTimeout(syncProduction,120));
window.addEventListener('load',()=>setTimeout(syncProduction,250));

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();

window.LDProjectLocks={
  get:()=>editing?null:current(),
  isLocked:()=>!!current()&&!editing,
  videoMode:()=>editing?'':(current()?.videoMode||''),
  visualStyle:()=>editing?'':(current()?.visualStyle||''),
  lock:lockProject,
  resetForNewProject,
  syncProduction
};
})();
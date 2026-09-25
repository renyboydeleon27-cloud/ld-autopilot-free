(()=>{
  const CORE_KEY='ld-autopilot-free-v1';
  const LIB_KEY='ld-autopilot-free-project-library-v1';
  const ACTIVE_KEY='ld-autopilot-free-active-project';
  const NEW_PROJECT_KEY='ld-autopilot-free-new-project-pending';
  const listEl=document.getElementById('projectList');
  const countEl=document.getElementById('libraryCount');
  const newBtn=document.getElementById('newProjectBtn');
  const buildBtn=document.getElementById('buildBtn');
  const resetBtn=document.getElementById('resetBtn');
  const backupFileInput=document.getElementById('backupFileInput');
  if(!listEl||!countEl||!newBtn)return;

  function readLibrary(){
    try{return JSON.parse(localStorage.getItem(LIB_KEY)||'{"projects":[]}');}
    catch{return {projects:[]};}
  }
  function writeLibrary(lib){localStorage.setItem(LIB_KEY,JSON.stringify(lib));}
  function activeId(){return localStorage.getItem(ACTIVE_KEY)||'';}
  function setActive(id){if(id)localStorage.setItem(ACTIVE_KEY,id);else localStorage.removeItem(ACTIVE_KEY);}
  function uid(){return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
  function readCore(){
    try{return JSON.parse(localStorage.getItem(CORE_KEY)||'null');}
    catch{return null;}
  }
  function validState(state){return !!(state&&state.topic&&state.stages&&typeof state.stages==='object');}
  function projectStats(state){
    const expected=state?.format==='longform'?31:17;
    const items=state?.stages?Object.values(state.stages):[];
    const done=items.filter(x=>x&&x.done).length;
    return {done,total:expected,percent:expected?Math.round(done/expected*100):0};
  }
  function displayName(p){return p.name||p.state?.topic||'Untitled project';}
  function formatLabel(state){return state?.format==='longform'?'Longform 16:9':'Shorts 9:16';}
  function prettyTime(iso){
    if(!iso)return 'Saved locally';
    const d=new Date(iso);if(Number.isNaN(d.getTime()))return 'Saved locally';
    return d.toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function deepClone(obj){return JSON.parse(JSON.stringify(obj));}
  function replaceLiteral(text,from,to){
    if(typeof text!=='string'||!from||from===to)return text;
    return text.split(from).join(to);
  }
  function syncTitleInsideState(state,oldTitle,newTitle){
    if(!state||typeof state!=='object')return state;
    state.topic=newTitle;
    state.version='1.9';
    state.updatedAt=new Date().toISOString();
    Object.values(state.stages||{}).forEach(stage=>{
      if(!stage||typeof stage!=='object')return;
      ['narration','imagePrompt','flowPrompt'].forEach(key=>{
        if(typeof stage[key]==='string')stage[key]=replaceLiteral(stage[key],oldTitle,newTitle);
      });
    });
    return state;
  }
  function render(){
    const lib=readLibrary();const current=activeId();
    countEl.textContent=`${lib.projects.length} project${lib.projects.length===1?'':'s'}`;
    listEl.innerHTML='';
    if(!lib.projects.length){
      const empty=document.createElement('p');empty.className='library-empty';empty.textContent='No saved projects yet. Create a production to add your first project.';listEl.appendChild(empty);return;
    }
    [...lib.projects].sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0)).forEach(p=>{
      const stats=projectStats(p.state);
      const card=document.createElement('article');card.className=`project-item${p.id===current?' active-project':''}`;
      card.innerHTML=`<div class="project-main"><div class="project-title-row"><strong></strong><span class="project-mode"></span></div><div class="project-meta"><span>${stats.done}/${stats.total} complete</span><span>${stats.percent}%</span><span>${prettyTime(p.updatedAt)}</span></div><div class="mini-track"><div style="width:${stats.percent}%"></div></div></div><div class="project-actions"><button type="button" class="ghost small open-project">${p.id===current?'Current':'Open'}</button><button type="button" class="ghost small duplicate-project">Duplicate</button><button type="button" class="ghost small rename-project">Rename</button><button type="button" class="ghost small delete-project">Delete</button></div>`;
      card.querySelector('.project-title-row strong').textContent=displayName(p);
      card.querySelector('.project-mode').textContent=formatLabel(p.state);
      card.querySelector('.open-project').addEventListener('click',()=>openProject(p.id));
      card.querySelector('.duplicate-project').addEventListener('click',()=>duplicateProject(p.id));
      card.querySelector('.rename-project').addEventListener('click',()=>renameProject(p.id));
      card.querySelector('.delete-project').addEventListener('click',()=>deleteProject(p.id));
      listEl.appendChild(card);
    });
  }
  let switchingProject=false;
  function sameProjectIdentity(project,state){
    if(!project||!state)return false;
    const pt=(project.state?.topic||project.name||'').trim();
    const st=(state.topic||'').trim();
    return !!pt&&!!st&&pt===st&&project.state?.format===state.format;
  }
  function syncCurrent(forceNew=false){
    if(switchingProject)return;
    const state=readCore();if(!validState(state))return;
    const lib=readLibrary();let id=forceNew?'':activeId();
    let p=id?lib.projects.find(x=>x.id===id):null;

    // Never overwrite one saved project with another topic's live pipeline.
    if(p&&!sameProjectIdentity(p,state)){
      const match=lib.projects.find(x=>x.id!==p.id&&sameProjectIdentity(x,state));
      if(match){p=match;id=match.id;setActive(id);}
      else{p=null;id='';}
    }

    if(!p){
      id=uid();
      p={id,name:state.topic,state:deepClone(state),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      lib.projects.push(p);
      setActive(id);
    }else{
      p.state=deepClone(state);
      p.updatedAt=new Date().toISOString();
      if(!p.name)p.name=state.topic;
    }
    writeLibrary(lib);render();
  }
  function migrateLegacy(){
    const core=readCore();const lib=readLibrary();
    if(!lib.projects.length&&validState(core)){
      const id=uid();lib.projects.push({id,name:core.topic,state:core,createdAt:core.updatedAt||new Date().toISOString(),updatedAt:core.updatedAt||new Date().toISOString()});writeLibrary(lib);setActive(id);
    }else if(lib.projects.length&&!activeId()){
      const match=validState(core)?lib.projects.find(p=>p.state?.topic===core.topic&&p.state?.format===core.format):null;
      if(match)setActive(match.id);
    }
  }
  function openProject(id){
    const lib=readLibrary();
    const p=lib.projects.find(x=>x.id===id);if(!p)return;
    clearTimeout(timer);
    switchingProject=true;
    localStorage.removeItem(NEW_PROJECT_KEY);

    const savedTopic=(p.state?.topic||'').trim();
    const cardTopic=(p.name||'').trim();
    const stats=projectStats(p.state);
    const clearlyCorrupted=!!cardTopic&&!!savedTopic&&cardTopic!==savedTopic&&stats.done===0&&!/\sCopy$/i.test(cardTopic);

    if(clearlyCorrupted&&window.LDCore?.loadProductionState){
      // Previous sync bug could leave the card name correct while its internal state belonged to another topic.
      // For untouched 0%-complete projects, safely rebuild from the visible project title.
      const repaired={version:'2.0',topic:cardTopic,format:p.state?.format||'shorts',stages:{},updatedAt:new Date().toISOString()};
      localStorage.setItem(CORE_KEY,JSON.stringify(repaired));
      setActive(id);
      window.LDCore.loadProductionState(repaired);
      const fresh=readCore();
      if(validState(fresh)){
        p.state=deepClone(fresh);
        p.name=fresh.topic;
        p.updatedAt=new Date().toISOString();
        writeLibrary(lib);
      }
      render();
      setTimeout(()=>{switchingProject=false;render();},0);
      return;
    }

    if(!validState(p.state)){switchingProject=false;return;}
    localStorage.setItem(CORE_KEY,JSON.stringify(p.state));
    setActive(id);
    if(window.LDCore?.loadProductionState){
      window.LDCore.loadProductionState(deepClone(p.state));
      render();
      setTimeout(()=>{switchingProject=false;render();},0);
    }else{
      switchingProject=false;
      location.reload();
    }
  }
  function duplicateProject(id){
    syncCurrent();
    const lib=readLibrary();const source=lib.projects.find(x=>x.id===id);if(!source)return;
    const copy=deepClone(source);
    const now=new Date().toISOString();
    copy.id=uid();
    copy.name=`${displayName(source)} Copy`;
    copy.createdAt=now;copy.updatedAt=now;
    if(copy.state){copy.state.updatedAt=now;copy.state.version='1.9';}
    lib.projects.push(copy);writeLibrary(lib);render();
  }
  function renameProject(id){
    const lib=readLibrary();const p=lib.projects.find(x=>x.id===id);if(!p)return;
    const oldDisplay=displayName(p);
    const oldTopic=(p.state?.topic||oldDisplay).trim();
    const next=prompt('Project name',oldDisplay);if(next===null)return;
    const clean=next.trim();if(!clean||clean===oldDisplay)return;
    const now=new Date().toISOString();
    p.name=clean;
    if(p.state)syncTitleInsideState(p.state,oldTopic,clean);
    p.updatedAt=now;
    writeLibrary(lib);
    if(activeId()===id&&p.state){
      localStorage.setItem(CORE_KEY,JSON.stringify(p.state));
      location.reload();
      return;
    }
    render();
  }
  function deleteProject(id){
    const lib=readLibrary();const p=lib.projects.find(x=>x.id===id);if(!p)return;
    if(!confirm(`Delete “${displayName(p)}” from this device?`))return;
    lib.projects=lib.projects.filter(x=>x.id!==id);writeLibrary(lib);
    if(activeId()===id){setActive('');localStorage.removeItem(CORE_KEY);location.reload();return;}
    render();
  }
  function startNew(){
    clearTimeout(timer);
    syncCurrent();

    // Enter a true blank new-project session without relying on reload/confirm.
    localStorage.setItem(NEW_PROJECT_KEY,'1');
    setActive('');
    localStorage.removeItem(CORE_KEY);

    const topic=document.getElementById('topic');
    const format=document.getElementById('format');
    const stages=document.getElementById('stages');
    const projectTitle=document.getElementById('projectTitle');
    const stageCount=document.getElementById('stageCount');
    const doneCount=document.getElementById('doneCount');
    const progressText=document.getElementById('progressText');
    const modeText=document.getElementById('modeText');
    const progressBar=document.getElementById('progressBar');
    const progressLabel=document.getElementById('progressLabel');
    const completeBanner=document.getElementById('completeBanner');
    const auditCard=document.getElementById('auditCard');
    const stageNav=document.getElementById('stageNav');

    if(topic){topic.value='';topic.focus();}
    if(format)format.value='shorts';
    if(stages)stages.innerHTML='';
    if(projectTitle)projectTitle.textContent='No production yet';
    if(stageCount)stageCount.textContent='0';
    if(doneCount)doneCount.textContent='0';
    if(progressText)progressText.textContent='0%';
    if(modeText)modeText.textContent='—';
    if(progressBar)progressBar.style.width='0%';
    if(progressLabel)progressLabel.textContent='No production yet';
    completeBanner?.classList.add('hidden');
    auditCard?.classList.add('hidden');
    stageNav?.classList.add('hidden');

    render();
  }
  function consumeNewProjectStart(){
    const fresh=localStorage.getItem(NEW_PROJECT_KEY)==='1';
    if(!fresh)return false;
    localStorage.removeItem(NEW_PROJECT_KEY);
    setActive('');
    localStorage.removeItem(CORE_KEY);
    return true;
  }

  let timer;
  function scheduleSync(){clearTimeout(timer);timer=setTimeout(()=>syncCurrent(),120);}
  document.addEventListener('input',e=>{if(e.target.matches('textarea,.done-toggle'))scheduleSync();});
  document.addEventListener('change',e=>{if(e.target.matches('textarea,.done-toggle'))scheduleSync();});
  document.addEventListener('click',e=>{if(e.target.closest('.done-toggle,.copy-btn,.collapse-btn,.next-stage-btn'))setTimeout(scheduleSync,0);});

  buildBtn?.addEventListener('click',()=>{
    const pendingNew=localStorage.getItem(NEW_PROJECT_KEY)==='1';
    if(pendingNew){
      localStorage.removeItem(NEW_PROJECT_KEY);
      setActive('');
      localStorage.removeItem(CORE_KEY);
    }else{
      const core=readCore();const current=activeId();const topic=document.getElementById('topic')?.value.trim();const format=document.getElementById('format')?.value;
      if(current&&core&&(core.topic!==topic||core.format!==format))setActive('');
    }
    setTimeout(()=>syncCurrent(),80);
  },true);
  window.addEventListener('ld:production-built',()=>{
    if(switchingProject)return;
    clearTimeout(timer);
    syncCurrent();
  });
  window.addEventListener('ld:api-usage-updated',()=>{if(!switchingProject)scheduleSync();});
  backupFileInput?.addEventListener('change',()=>{setActive('');setTimeout(()=>syncCurrent(true),700);},true);
  resetBtn?.addEventListener('click',()=>{syncCurrent();setActive('');setTimeout(render,50);},true);
  newBtn.addEventListener('click',startNew);

  const freshNewProject=consumeNewProjectStart();
  if(!freshNewProject)migrateLegacy();
  render();
  if(!freshNewProject)setTimeout(()=>syncCurrent(),200);
})();

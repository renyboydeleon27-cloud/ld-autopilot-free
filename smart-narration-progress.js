/* NER Studio — unified Smart Narration progress bridge v1.0.1 */
(()=>{'use strict';
  let timer=null;
  let startedAt=0;

  function narrationButton(){return document.getElementById('ldNarrationSmartBtn');}
  function narrationStatus(){return document.getElementById('ldNarrationSmartStatus');}
  function mainButtons(){
    return [document.getElementById('ldSmartContinueBtn'),document.getElementById('ldSmartStickyBtn')].filter(Boolean);
  }
  function mainStatuses(){
    return [document.getElementById('ldSmartContinueStatus'),document.getElementById('ldSmartStickyStatus')].filter(Boolean);
  }
  function narrationIsCurrentTarget(){
    return [...document.querySelectorAll('.ld-smart-target')].some(el=>/CURRENT TARGET:\s*NARRATION/i.test(el.textContent||''));
  }
  function setMainLabel(text){mainButtons().forEach(btn=>{btn.textContent=text;});}
  function setMainStatus(text,state=''){
    mainStatuses().forEach(el=>{el.textContent=text;el.dataset.state=state;});
  }
  function tick(){
    const seconds=Math.max(0,Math.floor((Date.now()-startedAt)/1000));
    setMainLabel('🎙️ BUILDING SMART NARRATION · '+seconds+'s');
    setMainStatus('SMART CONTINUE · Smart Narration is working… '+seconds+'s','working');
  }
  function start(){
    if(timer)return;
    startedAt=Date.now();
    tick();
    timer=setInterval(tick,1000);
  }
  function stop(){
    if(timer){clearInterval(timer);timer=null;}
    if(!narrationIsCurrentTarget())return;

    const btn=narrationButton();
    const status=narrationStatus();
    const message=String(status?.textContent||'').trim();
    const state=String(status?.dataset?.state||'');

    if(btn?.dataset?.mode==='approve'){
      setMainLabel('✅ REVIEW / APPROVE NARRATION');
      setMainStatus('Smart Narration is ready. Review it, then approve Narration before HOOK.','pass');
      return;
    }
    if(state==='error'||/stopped safely|blocked by research gate|NEEDS_REVIEW/i.test(message)){
      setMainLabel('⚠️ NARRATION NEEDS REVIEW · TAP RETRY');
      setMainStatus(message||'Narration needs review before production can continue.','error');
      return;
    }
    setMainLabel('🚀 SMART CONTINUE');
  }
  function sync(){
    const running=narrationIsCurrentTarget()&&!!narrationButton()?.disabled;
    if(running&&!timer)start();
    else if(!running&&timer)stop();
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))return;
    if(!narrationIsCurrentTarget())return;
    setTimeout(sync,0);
  },true);

  const observer=new MutationObserver(sync);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','data-mode','data-state']});
  window.addEventListener('ld:narration-smart-complete',()=>setTimeout(sync,0));
  window.addEventListener('ld:narration-approval-changed',()=>setTimeout(sync,0));
  setInterval(sync,500);
})();

/* NER Studio — approved narration reload recovery v1.0.1
   Approved narration is the source of truth after reload/project-open. This repairs
   the case where static/default HOOK or ENDING text caused the older all-or-nothing
   restore check to reject the saved P1–P14 snapshot. */
(()=>{'use strict';
  if(window.__LD_NARRATION_APPROVAL_RELOAD_RECOVERY__)return;
  window.__LD_NARRATION_APPROVAL_RELOAD_RECOVERY__='1.0.1';

  const STORE_KEY='ld-autopilot-free-v1';
  const LIBRARY_KEY='ld-autopilot-free-project-library-v1';
  const ACTIVE_KEY='ld-autopilot-free-active-project';
  const APPROVAL_PREFIX='ner-studio-narration-approval-v1:';
  const NAMES=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];

  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
  function topic(){return String(document.getElementById('topic')?.value||document.getElementById('projectTitle')?.textContent||'').trim();}
  function format(){return document.getElementById('format')?.value||'shorts';}
  function activeId(){return localStorage.getItem(ACTIVE_KEY)||'';}
  function approvalKey(){return APPROVAL_PREFIX+(activeId()||[topic(),format()].join('|'));}
  function hash(value){
    const s=String(value||'');let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(36);
  }
  function snapshotSignature(a){
    return hash([a.topic,a.format,'vo',...NAMES.map(stage=>stage+'\u241f'+String(a.narrations?.[stage]||'').trim())].join('\u241e'));
  }
  function validSnapshot(a){
    return !!a&&a.topic===topic()&&a.format===format()&&a.narrations&&
      NAMES.every(stage=>typeof a.narrations[stage]==='string'&&a.narrations[stage].trim())&&
      snapshotSignature(a)===a.signature;
  }
  function libraryProject(library){
    const id=activeId();
    return library?.projects?.find?.(p=>p.id===id)||null;
  }
  function findSnapshot(){
    const local=readJson(approvalKey());
    if(validSnapshot(local))return local;
    const memory=window.ldNarrationApprovalState;
    if(validSnapshot(memory))return memory;
    const core=readJson(STORE_KEY)?.narrationApproval;
    if(validSnapshot(core))return core;
    const library=readJson(LIBRARY_KEY);
    const saved=libraryProject(library)?.state?.narrationApproval;
    if(validSnapshot(saved))return saved;
    return null;
  }
  function mirrorSnapshot(a){
    try{localStorage.setItem(approvalKey(),JSON.stringify(a));}catch{}
    try{
      const core=readJson(STORE_KEY);
      if(core&&core.topic===topic()&&(core.format||format())===format()){
        core.narrationApproval=a;
        if(core.stages)for(const stage of NAMES)if(core.stages[stage])core.stages[stage].narration=a.narrations[stage];
        localStorage.setItem(STORE_KEY,JSON.stringify(core));
      }
    }catch{}
    try{
      const library=readJson(LIBRARY_KEY);
      const project=libraryProject(library);
      if(project?.state&&project.state.topic===topic()&&(project.state.format||format())===format()){
        project.state.narrationApproval=a;
        if(project.state.stages)for(const stage of NAMES)if(project.state.stages[stage])project.state.stages[stage].narration=a.narrations[stage];
        localStorage.setItem(LIBRARY_KEY,JSON.stringify(library));
      }
    }catch{}
  }
  function restoreApprovedSnapshot(){
    const a=findSnapshot();
    if(!a)return false;
    const stages=document.getElementById('stages');
    if(!stages)return false;
    for(const stage of NAMES){
      const field=stages.querySelector('.stage-card[data-stage="'+stage+'"] .narration');
      if(!field)return false;
    }
    for(const stage of NAMES){
      const field=stages.querySelector('.stage-card[data-stage="'+stage+'"] .narration');
      field.value=a.narrations[stage];
    }
    window.ldNarrationApprovalState=a;
    mirrorSnapshot(a);
    try{window.LDCore?.saveCurrent?.();}catch{}
    try{window.LDProjectLibrary?.flushCurrent?.();}catch{}
    window.dispatchEvent(new CustomEvent('ld:narration-approval-changed',{detail:{approved:true,signature:a.signature,recovered:true}}));
    return true;
  }
  function scheduleRestore(){[0,80,250,700].forEach(ms=>setTimeout(restoreApprovedSnapshot,ms));}
  window.addEventListener('ld:production-built',scheduleRestore);
  window.addEventListener('pageshow',scheduleRestore);
  scheduleRestore();
})();

/* NER Studio pipeline integrity guard
   Repairs a rare mobile/PWA partial render where only part of the production pipeline is mounted.
   Never overwrites approved prompts; it reloads the most complete saved copy of the same project. */
(()=>{'use strict';
  const CORE_KEY='ld-autopilot-free-v1';
  const LIB_KEY='ld-autopilot-free-project-library-v1';
  const ACTIVE_KEY='ld-autopilot-free-active-project';
  let recovering=false;
  let attempts=0;

  function readJson(key,fallback=null){
    try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}
  }
  function expected(state){
    if(!state||state.category&&state.category!=='disaster'||state.storyEpisode)return 0;
    return state.format==='longform'?31:17;
  }
  function countStages(state){
    return state?.stages&&typeof state.stages==='object'?Object.keys(state.stages).length:0;
  }
  function liveCount(){
    return document.querySelectorAll('#stages .stage-card').length;
  }
  function visibleCardCount(){
    return [...document.querySelectorAll('#stages .stage-card')].filter(card=>{
      const css=getComputedStyle(card);
      return !card.hidden&&!card.classList.contains('hidden')&&css.display!=='none'&&css.visibility!=='hidden';
    }).length;
  }
  function normalizePipelineLayout(){
    const root=document.getElementById('stages');
    if(!root)return 0;
    root.hidden=false;
    root.classList.remove('hidden');
    root.style.removeProperty('display');
    root.style.removeProperty('height');
    root.style.removeProperty('min-height');
    const cards=[...root.querySelectorAll('.stage-card')];
    cards.forEach(card=>{
      // Stage cards themselves must always remain in the document flow.
      // Only .stage-body is allowed to collapse.
      card.hidden=false;
      card.classList.remove('hidden');
      card.style.removeProperty('display');
      card.style.removeProperty('visibility');
      card.style.removeProperty('height');
      card.style.removeProperty('min-height');
      card.style.removeProperty('max-height');
      card.style.removeProperty('overflow');

      const body=card.querySelector('.stage-body');
      if(body){
        body.style.removeProperty('display');
        body.style.removeProperty('visibility');
        body.style.removeProperty('height');
        body.style.removeProperty('min-height');
        body.style.removeProperty('max-height');
        body.style.removeProperty('overflow');
      }

      // Full prompts default to collapsed on mobile and must never reserve viewport-height space.
      card.querySelectorAll('.text-prompt-details').forEach(details=>{
        details.open=false;
        details.style.removeProperty('height');
        details.style.removeProperty('min-height');
        details.style.removeProperty('max-height');
        const summary=details.querySelector('summary');
        if(summary)summary.textContent='View Full Prompt';
      });
      card.querySelectorAll('.text-video-prompt').forEach(field=>{
        field.style.removeProperty('height');
        field.style.removeProperty('min-height');
        field.style.removeProperty('max-height');
      });
    });
    return cards.length;
  }
  function sameIdentity(a,b){
    return !!a&&!!b&&String(a.topic||'').trim()===String(b.topic||'').trim()&&
      String(a.format||'shorts')===String(b.format||'shorts')&&
      String(a.category||'disaster')===String(b.category||'disaster');
  }
  function bestSavedState(){
    const core=readJson(CORE_KEY,null);
    const lib=readJson(LIB_KEY,{projects:[]});
    const active=localStorage.getItem(ACTIVE_KEY)||'';
    const activeProject=Array.isArray(lib?.projects)?lib.projects.find(p=>p.id===active):null;
    const candidates=[core,activeProject?.state].filter(Boolean);
    if(core&&Array.isArray(lib?.projects)){
      for(const p of lib.projects){
        if(sameIdentity(core,p?.state))candidates.push(p.state);
      }
    }
    candidates.sort((a,b)=>countStages(b)-countStages(a));
    return candidates[0]||core||null;
  }
  function collapseFullPrompts(){
    normalizePipelineLayout();
  }
  function notify(message){
    const toast=document.getElementById('toast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(notify.t);
    notify.t=setTimeout(()=>toast.classList.remove('show'),2600);
  }
  function check(){
    normalizePipelineLayout();
    if(recovering)return;
    const saved=bestSavedState();
    const need=expected(saved);
    if(!need)return;
    const live=liveCount();
    const visible=visibleCardCount();

    // If all cards exist but some were accidentally hidden or stretched by stale mobile UI state,
    // normalizePipelineLayout() fixes the layout without rebuilding or touching prompt data.
    if(live===need&&visibleCardCount()===need){
      return;
    }
    if(live===need&&visible<need){
      normalizePipelineLayout();
      if(visibleCardCount()===need){
        notify('✅ Production layout restored · '+need+'/'+need+' stages visible');
        return;
      }
    }
    if(live>need)return;
    if(attempts>=2){
      notify('Pipeline display is incomplete. Reload NER Studio once; saved project data is protected.');
      return;
    }
    if(countStages(saved)<need){
      notify('Pipeline display is incomplete. Open the saved project or import its backup to restore all stages.');
      return;
    }
    if(!window.LDCore?.loadProductionState)return;
    recovering=true;
    attempts++;
    try{
      window.LDCore.loadProductionState(JSON.parse(JSON.stringify(saved)));
      setTimeout(()=>{
        recovering=false;
        collapseFullPrompts();
        const after=liveCount();
        if(after===need)notify('✅ Production pipeline restored · '+after+'/'+need+' stages');
        else setTimeout(check,180);
      },120);
    }catch(error){
      recovering=false;
      console.error('NER Studio pipeline recovery failed',error);
      notify('Pipeline recovery needs one reload. Saved project data was not overwritten.');
    }
  }

  window.addEventListener('load',()=>setTimeout(check,450));
  window.addEventListener('pageshow',()=>setTimeout(check,180));
  window.addEventListener('ld:project-opened',()=>setTimeout(check,100));
  window.addEventListener('ld:pipeline-partial',()=>setTimeout(check,40));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,140);});
  window.addEventListener('ld:production-built',()=>setTimeout(()=>{collapseFullPrompts();},40));

  window.LDPipelineIntegrity=Object.freeze({check,liveCount,visibleCardCount,normalizePipelineLayout,bestSavedState});
})();
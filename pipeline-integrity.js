/* NER Studio pipeline integrity guard
   Restores the full disaster pipeline after Android/PWA resume/restart glitches.
   It never rewrites existing saved stage fields; missing stage shells are recreated
   by LDCore.loadProductionState using the best saved copy of the same project. */
(()=>{'use strict';
  const rescueStyle=document.createElement('style');
  rescueStyle.id='ldPipelineLayoutRescue';
  rescueStyle.textContent=`
    #pipelineSection{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;contain:none!important}
    #stages.stage-grid{display:flex!important;flex-direction:column!important;gap:10px!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;contain:none!important}
    #stages>.stage-card{display:block!important;position:relative!important;visibility:visible!important;opacity:1!important;transform:none!important;float:none!important;inset:auto!important;width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;margin:0!important}
    #stages>.stage-card>.stage-top{display:flex!important;position:relative!important;visibility:visible!important;opacity:1!important;transform:none!important;height:auto!important;min-height:0!important;max-height:none!important}
    #stages>.stage-card>.stage-body:not(.hidden){display:block!important;position:relative!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}
    #stages>.stage-card>.stage-body.hidden{display:none!important}
    #stages>.stage-card .text-prompt-details:not([open]) .text-video-prompt{display:none!important}
  `;
  document.head.appendChild(rescueStyle);
  const CORE_KEY='ld-autopilot-free-v1';
  const LIB_KEY='ld-autopilot-free-project-library-v1';
  const ACTIVE_KEY='ld-autopilot-free-active-project';
  let recovering=false;
  let attempts=0;

  function readJson(key,fallback=null){
    try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}
  }
  function isDisaster(state){
    return !!state&&(!state.category||state.category==='disaster');
  }
  function expected(state){
    if(!isDisaster(state))return 0;
    return state.format==='longform'?31:17;
  }
  function countStages(state){
    return state?.stages&&typeof state.stages==='object'?Object.keys(state.stages).length:0;
  }
  function liveCards(){
    return [...document.querySelectorAll('#stages .stage-card')];
  }
  function liveCount(){return liveCards().length;}
  function visibleCardCount(){
    return liveCards().filter(card=>{
      const css=getComputedStyle(card);
      const r=card.getBoundingClientRect();
      const head=card.querySelector('.stage-top')?.getBoundingClientRect();
      return !card.hidden&&!card.classList.contains('hidden')&&css.display!=='none'&&css.visibility!=='hidden'&&
        Number(css.opacity||1)>0&&r.width>20&&r.height>20&&(!head||head.height>12);
    }).length;
  }
  function normalizePipelineLayout(){
    const root=document.getElementById('stages');
    if(!root)return 0;
    root.hidden=false;
    root.classList.remove('hidden');
    for(const p of ['display','visibility','height','min-height','max-height','overflow','position','transform','opacity','contain']){
      root.style.removeProperty(p);
    }
    const cards=liveCards();
    cards.forEach(card=>{
      card.hidden=false;
      card.classList.remove('hidden');
      for(const p of ['display','visibility','height','min-height','max-height','overflow','position','top','bottom','left','right','transform','opacity','float']){
        card.style.removeProperty(p);
      }
      const top=card.querySelector('.stage-top');
      if(top){
        top.hidden=false;
        top.classList.remove('hidden');
        for(const p of ['display','visibility','height','min-height','max-height','position','top','bottom','left','right','transform','opacity']){
          top.style.removeProperty(p);
        }
      }
      const body=card.querySelector('.stage-body');
      if(body){
        for(const p of ['display','visibility','height','min-height','max-height','overflow']){
          body.style.removeProperty(p);
        }
      }
      card.querySelectorAll('.text-prompt-details').forEach(details=>{
        details.open=false;
        for(const p of ['height','min-height','max-height'])details.style.removeProperty(p);
        const summary=details.querySelector('summary');
        if(summary)summary.textContent='View Full Prompt';
      });
      card.querySelectorAll('.text-video-prompt').forEach(field=>{
        for(const p of ['height','min-height','max-height'])field.style.removeProperty(p);
      });
    });
    return cards.length;
  }
  function compactStageBodies(){
    liveCards().forEach(card=>{
      const body=card.querySelector('.stage-body');
      const btn=card.querySelector('.collapse-btn');
      if(body)body.classList.add('hidden');
      if(btn)btn.textContent='Open';
    });
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
    return candidates[0]||core||activeProject?.state||null;
  }
  function currentTopic(){
    return String(document.getElementById('projectTitle')?.textContent||
      document.getElementById('topic')?.value||'').trim();
  }
  function fallbackState(){
    const saved=bestSavedState();
    if(saved)return JSON.parse(JSON.stringify(saved));
    const topic=currentTopic();
    if(!topic||topic==='No production yet')return null;
    return {
      version:'2.5',
      category:'disaster',
      storyEpisode:null,
      topic,
      format:document.getElementById('format')?.value||'shorts',
      stages:{}
    };
  }
  function notify(message){
    const toast=document.getElementById('toast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(notify.t);
    notify.t=setTimeout(()=>toast.classList.remove('show'),3000);
  }
  function layoutLooksBroken(){
    const cards=liveCards();
    if(cards.length<2)return cards.length===1;
    const root=document.getElementById('stages')?.getBoundingClientRect();
    const first=cards[0].getBoundingClientRect();
    const second=cards[1].getBoundingClientRect();
    const hugeFirst=first.height>Math.max(620,(window.innerHeight||800)*0.7);
    const abnormalGap=second.top-first.bottom>120;
    const detached=!!root&&(first.top-root.top>100);
    const zeroish=first.height<20||second.height<20||first.width<20||second.width<20;
    return hugeFirst||abnormalGap||detached||zeroish;
  }
  function rebuildFullPipeline(state,need){
    if(recovering||!window.LDCore?.loadProductionState||!state)return false;
    recovering=true;
    attempts++;
    try{
      const rescue=JSON.parse(JSON.stringify(state));
      rescue.category='disaster';
      rescue.storyEpisode=null;
      rescue.format=rescue.format==='longform'?'longform':'shorts';
      window.ldStoryEpisode=null;
      window.LDCore.loadProductionState(rescue);
      setTimeout(()=>{
        recovering=false;
        normalizePipelineLayout();
        compactStageBodies();
        const after=liveCount();
        if(after===need){
          notify('✅ Full production restored · '+after+'/'+need+' stages');
        }else if(attempts<3){
          setTimeout(check,180);
        }else{
          notify('Production shell restored partially. Use your saved backup if any stage content is still missing.');
        }
      },140);
      return true;
    }catch(error){
      recovering=false;
      console.error('NER Studio pipeline recovery failed',error);
      notify('Pipeline recovery needs one reload. Saved project data was not overwritten.');
      return false;
    }
  }
  function check(){
    normalizePipelineLayout();
    if(recovering)return;

    const state=fallbackState();
    const need=expected(state);
    if(!need)return;

    const live=liveCount();
    const visible=visibleCardCount();

    // A restored disaster project must always expose the complete HOOK/PANEL/ENDING/THUMBNAIL shell.
    if(live<need){
      rebuildFullPipeline(state,need);
      return;
    }

    if(live===need){
      if(visible<need||layoutLooksBroken()){
        normalizePipelineLayout();
        compactStageBodies();
        requestAnimationFrame(()=>{
          normalizePipelineLayout();
          if(visibleCardCount()===need)notify('✅ Production layout restored · '+need+'/'+need+' stages visible');
        });
      }
      return;
    }
  }

  window.addEventListener('load',()=>{[80,220,500,1100,2200].forEach(ms=>setTimeout(check,ms));});
  window.addEventListener('pageshow',()=>{[60,180,450,900].forEach(ms=>setTimeout(check,ms));});
  window.addEventListener('ld:project-opened',()=>setTimeout(check,80));
  window.addEventListener('ld:pipeline-partial',()=>setTimeout(check,30));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,100);});
  window.addEventListener('ld:production-built',event=>{
    setTimeout(()=>{
      if(event?.detail?.fresh===false)compactStageBodies();
      check();
    },70);
  });

  window.LDPipelineIntegrity=Object.freeze({
    check,liveCount,visibleCardCount,normalizePipelineLayout,compactStageBodies,bestSavedState
  });
})();
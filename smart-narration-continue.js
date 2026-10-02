/* NER Studio — Final Narration Smart Continue v1.0.0 */
(()=>{'use strict';
  const stages=document.getElementById('stages');
  const master=document.getElementById('masterNarrationCard');
  if(!stages||!master)return;

  const ENDING_CTA='Thank you for watching. Like, share, and subscribe for more stories from the Living Disaster Book.';
  const BACKUP_PREFIX='ner-studio-final-narration-backup-v1:';

  function topic(){
    return (document.getElementById('topic')?.value||
      document.getElementById('projectTitle')?.textContent||'').trim();
  }
  function format(){return document.getElementById('format')?.value||'shorts';}
  function card(stage){return stages.querySelector('.stage-card[data-stage="'+stage+'"]');}
  function value(c,selector){return String(c?.querySelector(selector)?.value||'').trim();}
  function backupKey(){
    const active=localStorage.getItem('ld-autopilot-free-active-project')||'';
    return BACKUP_PREFIX+(active||[topic(),format()].join('|'));
  }
  function hookIsSilent(c){
    const corpus=[
      value(c,'.flow-prompt'),
      value(c,'.text-video-prompt'),
      c?.dataset?.textVideoPrompt||'',
      value(c,'.image-prompt'),
      c?.querySelector('.scene-role')?.textContent||'',
      c?.dataset?.videoScene||''
    ].join('\n');
    return /\bNO\s+(?:VOICE[- ]?OVER|VO|NARRATION)\b|\bSILENT\s+HOOK\b/i.test(corpus);
  }
  function secondsFor(c){
    const corpus=[
      value(c,'.text-video-prompt'),
      c?.dataset?.textVideoPrompt||'',
      value(c,'.flow-prompt'),
      c?.querySelector('.scene-role')?.textContent||''
    ].join('\n');
    for(const rx of [
      /EXACTLY\s+(\d+(?:\.\d+)?)\s*SECONDS?/i,
      /DURATION\s*[:—–-]?\s*(?:EXACTLY\s*)?(\d+(?:\.\d+)?)\s*(?:SECONDS?|S\b)/i,
      /\b(\d+(?:\.\d+)?)\s*[- ]SECOND\b/i
    ]){
      const m=rx.exec(corpus);
      if(m){
        const n=Number(m[1]);
        if(Number.isFinite(n)&&n>=1&&n<=15)return n;
      }
    }
    return 10;
  }
  function contextFor(c){
    const scene=String(c?.querySelector('.video-scene')?.value||c?.dataset?.videoScene||'').trim();
    const prompt=String(
      c?.querySelector('.text-video-prompt')?.value||
      c?.dataset?.textVideoPrompt||
      c?.querySelector('.flow-prompt')?.value||
      c?.querySelector('.image-prompt')?.value||''
    ).trim();
    return {
      role:String(c?.querySelector('.scene-role')?.textContent||'').trim().slice(0,500),
      scene:scene.slice(0,1800),
      prompt:prompt.slice(0,2200)
    };
  }
  function write(stage,text){
    const box=card(stage)?.querySelector('.narration');
    if(!box)return;
    box.value=String(text||'').trim();
    box.dispatchEvent(new Event('input',{bubbles:true}));
    box.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function saveBackup(){
    const data={topic:topic(),savedAt:new Date().toISOString(),stages:{}};
    ['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'].forEach(stage=>{
      const box=card(stage)?.querySelector('.narration');
      if(box)data.stages[stage]=box.value||'';
    });
    try{localStorage.setItem(backupKey(),JSON.stringify(data));}catch{}
  }
  function restoreBackup(){
    let data=null;
    try{data=JSON.parse(localStorage.getItem(backupKey())||'null');}catch{}
    if(!data?.stages)return false;
    Object.entries(data.stages).forEach(([stage,text])=>write(stage,text));
    return true;
  }
  function status(text,state=''){
    const el=document.getElementById('ldFinalNarrationStatus');
    if(el){el.textContent=text;el.dataset.state=state;}
  }
  function addUsage(usage){
    if(!usage||!Number(usage.calls||0))return;
    const root=(window.ldApiUsage&&typeof window.ldApiUsage==='object')?window.ldApiUsage:{
      version:'1.0',topic:topic(),format:format(),calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}
    };
    for(const k of ['calls','inputTokens','cachedInputTokens','outputTokens','totalTokens']){
      root[k]=(Number(root[k])||0)+(Number(usage[k])||0);
    }
    root.estimatedCostUsd=Math.round(((Number(root.estimatedCostUsd)||0)+(Number(usage.estimatedCostUsd)||0))*1e8)/1e8;
    root.priceSnapshot=usage.priceSnapshot||root.priceSnapshot||'';
    root.updatedAt=new Date().toISOString();
    window.ldApiUsage=root;
    window.dispatchEvent(new CustomEvent('ld:api-usage-updated',{detail:{...root}}));
  }

  const ui=document.createElement('div');
  ui.className='field-block';
  ui.style.marginTop='12px';
  ui.innerHTML=
    '<div class="field-head"><label>Final narration Smart Continue</label></div>'+
    '<p class="library-sub">Builds the final voice-over from the exact current HOOK and P1–P14 production stages. A HOOK locked to NO VO stays silent. ENDING uses the channel CTA.</p>'+
    '<button id="ldFinalNarrationBtn" class="primary" type="button" style="width:100%;margin-top:8px">🎙️ SMART CONTINUE NARRATION</button>'+
    '<button id="ldFinalNarrationUndoBtn" class="ghost small hidden" type="button" style="margin-top:8px">Undo narration polish</button>'+
    '<p id="ldFinalNarrationStatus" class="library-sub" role="status" style="margin-top:8px">Ready.</p>';

  const notice=document.getElementById('masterNarrationNotice');
  notice?.parentNode?.insertBefore(ui,notice.nextSibling);

  const btn=document.getElementById('ldFinalNarrationBtn');
  const undo=document.getElementById('ldFinalNarrationUndoBtn');

  btn?.addEventListener('click',async()=>{
    if(btn.disabled)return;
    const t=topic();
    if(!t){status('Add the disaster topic first.','error');return;}

    const panels=Array.from({length:14},(_,i)=>'P'+(i+1));
    const required=['HOOK',...panels];
    const missingCards=required.filter(stage=>!card(stage));
    if(missingCards.length){
      status('Missing production stages: '+missingCards.join(', ')+'.','error');
      return;
    }

    const productionStages={};
    const targetStageSeconds={};
    const missingContext=[];
    for(const stage of required){
      const c=card(stage);
      productionStages[stage]=contextFor(c);
      if(stage!=='HOOK'&&!productionStages[stage].scene&&!productionStages[stage].prompt)missingContext.push(stage);
      targetStageSeconds[stage]=secondsFor(c);
    }
    if(missingContext.length){
      status('Finish these production stages first: '+missingContext.join(', ')+'.','error');
      return;
    }

    const silentHook=hookIsSilent(card('HOOK'));
    if(silentHook)delete targetStageSeconds.HOOK;

    saveBackup();
    btn.disabled=true;
    btn.textContent='🎙️ BUILDING FINAL NARRATION…';
    status('Verifying facts and matching each line to the current HOOK and P1–P14 flow…','working');

    try{
      const r=await fetch('/api/ai-narration',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          topic:t,
          format:format(),
          narrativeFormat:window.ldNarrativeFormat||document.getElementById('narrativeFormat')?.value||'original',
          skipStages:silentHook?['HOOK']:[],
          targetStageSeconds,
          productionStages
        })
      });
      const raw=await r.text();
      let d;
      try{d=JSON.parse(raw);}catch{throw new Error('Narration service returned an invalid response.');}
      addUsage(d.apiUsage);
      if(!r.ok||!d.ok)throw new Error(d.error||('Narration HTTP '+r.status));

      const expected=silentHook?panels:['HOOK',...panels];
      const missing=expected.filter(stage=>!String(d.stages?.[stage]||'').trim());
      if(missing.length)throw new Error('Narration response is missing: '+missing.join(', ')+'.');

      if(silentHook)write('HOOK','');
      else write('HOOK',d.stages.HOOK);
      panels.forEach(stage=>write(stage,d.stages[stage]));
      write('ENDING',ENDING_CTA);

      undo?.classList.remove('hidden');
      status(
        '✅ Final narration ready · '+(silentHook?'HOOK stays silent · ':'HOOK narrated · ')+
        'P1–P14 matched to the current production · ENDING CTA added.',
        'pass'
      );
      window.dispatchEvent(new CustomEvent('ld:final-narration-ready',{detail:{silentHook,topic:t}}));
    }catch(err){
      restoreBackup();
      status('Narration not changed: '+String(err?.message||err),'error');
    }finally{
      btn.disabled=false;
      btn.textContent='🎙️ SMART CONTINUE NARRATION';
    }
  });

  undo?.addEventListener('click',()=>{
    if(!restoreBackup()){status('No narration backup is available.','error');return;}
    status('Previous narration restored.','pass');
    undo.classList.add('hidden');
  });
})();
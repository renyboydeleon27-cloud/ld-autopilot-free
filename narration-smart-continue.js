/* NER Studio — Smart Continue Narration v1.0.0
   Builds a final stage-aligned voice-over from the CURRENT approved production.
   HOOK respects explicit NO VO / silent-hook locks. P1–P14 are rebuilt from the
   verified narration API using the exact current visual/story context. ENDING
   uses the locked Living Disaster Book CTA. */
(()=>{'use strict';
  // Idempotent install: NER Studio/PWA refreshes must never create duplicate narration controls.
  document.querySelectorAll('[data-ld-narration-smart-controls="1"]').forEach((el,i)=>{if(i>0)el.remove();});
  if(window.__LD_NARRATION_SMART_CONTINUE_INSTALLED__)return;
  window.__LD_NARRATION_SMART_CONTINUE_INSTALLED__=true;

  const stages=document.getElementById('stages');
  const masterCard=document.getElementById('masterNarrationCard');
  if(!stages||!masterCard)return;

  const ENDING_CTA='Thank you for watching. Like, share, and subscribe for more stories from the Living Disaster Book.';
  const BACKUP_PREFIX='ner-studio-narration-backup-v1:';

  function topic(){
    return String(document.getElementById('topic')?.value||
      document.getElementById('projectTitle')?.textContent||'').trim();
  }
  function format(){return document.getElementById('format')?.value||'shorts';}
  function projectKey(){
    const active=localStorage.getItem('ld-autopilot-free-active-project')||'';
    return BACKUP_PREFIX+(active||[topic(),format()].join('|'));
  }
  const APPROVAL_PREFIX='ner-studio-narration-approval-v1:';
  function approvalKey(){
    const active=localStorage.getItem('ld-autopilot-free-active-project')||'';
    return APPROVAL_PREFIX+(active||[topic(),format()].join('|'));
  }
  function hash(value){
    const s=String(value||'');
    let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(36);
  }
  function narrationReady(){
    const hook=stageCard('HOOK');
    const required=[...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
    if(!hookIsSilent(hook))required.unshift('HOOK');
    return required.every(stage=>!!value(stageCard(stage),'.narration'));
  }
  function narrationSignature(){
    const parts=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'].map(stage=>{
      const card=stageCard(stage);
      return stage+'\u241f'+value(card,'.narration');
    });
    return hash([topic(),format(),hookIsSilent(stageCard('HOOK'))?'silent':'vo',...parts].join('\u241e'));
  }
  function approvalMatches(a){
    return !!a&&a.topic===topic()&&a.format===format()&&a.signature===narrationSignature()&&narrationReady();
  }
  function readApproval(){
    const projectState=window.ldNarrationApprovalState;
    if(approvalMatches(projectState))return projectState;
    try{
      const localState=JSON.parse(localStorage.getItem(approvalKey())||'null');
      if(approvalMatches(localState)){
        window.ldNarrationApprovalState=localState;
        return localState;
      }
      return projectState||localState;
    }catch{return projectState||null;}
  }
  function isApproved(){
    return approvalMatches(readApproval());
  }
  function emitApproval(){
    window.dispatchEvent(new CustomEvent('ld:narration-approval-changed',{detail:{approved:isApproved(),signature:narrationSignature()}}));
  }
  function clearApproval(){
    window.ldNarrationApprovalState=null;
    try{localStorage.removeItem(approvalKey());}catch{}
    try{window.LDCore?.saveCurrent?.();}catch{}
    emitApproval();
  }
  function approveNarration(){
    if(!narrationReady())return false;
    const a={version:'2.0',topic:topic(),format:format(),signature:narrationSignature(),approvedAt:new Date().toISOString()};
    window.ldNarrationApprovalState=a;
    try{localStorage.setItem(approvalKey(),JSON.stringify(a));}catch{}
    try{window.LDCore?.saveCurrent?.();}catch{}
    emitApproval();
    return isApproved();
  }
  function stageCard(stage){
    return stages.querySelector('.stage-card[data-stage="'+stage+'"]');
  }
  function value(card,selector){
    return String(card?.querySelector(selector)?.value||'').trim();
  }
  function hookIsSilent(card){
    if(!card)return false;
    const corpus=[
      value(card,'.flow-prompt'),
      value(card,'.text-video-prompt'),
      card.dataset.textVideoPrompt||'',
      value(card,'.image-prompt'),
      card.querySelector('.scene-role')?.textContent||'',
      card.dataset.videoScene||''
    ].join('\n');
    return /\bNO\s+(?:VOICE[- ]?OVER|VO|NARRATION)\b|\bSILENT\s+HOOK\b/i.test(corpus);
  }
  function detectSeconds(card){
    const corpus=[
      value(card,'.text-video-prompt'),
      card?.dataset?.textVideoPrompt||'',
      value(card,'.flow-prompt'),
      card?.querySelector('.scene-role')?.textContent||''
    ].join('\n');
    const patterns=[
      /EXACTLY\s+(\d+(?:\.\d+)?)\s*SECONDS?/i,
      /DURATION\s*[:—–-]?\s*(?:EXACTLY\s*)?(\d+(?:\.\d+)?)\s*(?:SECONDS?|S\b)/i,
      /\b(\d+(?:\.\d+)?)\s*[- ]SECOND\b/i
    ];
    for(const rx of patterns){
      const m=rx.exec(corpus);
      if(!m)continue;
      const sec=Number(m[1]);
      if(Number.isFinite(sec)&&sec>=1&&sec<=15)return sec;
    }
    return 10;
  }
  function stageContext(card){
    const scene=String(card?.querySelector('.video-scene')?.value||card?.dataset?.videoScene||'').trim();
    const t2v=String(card?.querySelector('.text-video-prompt')?.value||card?.dataset?.textVideoPrompt||'').trim();
    const flow=value(card,'.flow-prompt');
    const image=value(card,'.image-prompt');
    return {
      role:String(card?.querySelector('.scene-role')?.textContent||'').trim().slice(0,500),
      scene:scene.slice(0,1800),
      prompt:(t2v||flow||image).slice(0,2200)
    };
  }
  function setNarration(card,text){
    const field=card?.querySelector('.narration');
    if(!field)return false;
    field.value=String(text||'').trim();
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }
  function status(message,state=''){
    const el=document.getElementById('ldNarrationSmartStatus');
    if(!el)return;
    el.textContent=message;
    el.dataset.state=state;
  }
  function saveBackup(){
    const data={topic:topic(),format:format(),savedAt:new Date().toISOString(),stages:{}};
    ['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'].forEach(stage=>{
      const field=stageCard(stage)?.querySelector('.narration');
      if(field)data.stages[stage]=field.value||'';
    });
    try{localStorage.setItem(projectKey(),JSON.stringify(data));}catch{}
  }
  function restoreBackup(){
    let data=null;
    try{data=JSON.parse(localStorage.getItem(projectKey())||'null');}catch{}
    if(!data?.stages)return false;
    for(const [stage,text] of Object.entries(data.stages))setNarration(stageCard(stage),text);
    window.dispatchEvent(new CustomEvent('ld:narration-smart-restored'));
    return true;
  }
  function recordUsage(usage){
    if(!usage||typeof usage!=='object'||!Number(usage.calls||0))return;
    const root=window.ldApiUsage&&typeof window.ldApiUsage==='object'?window.ldApiUsage:{
      version:'1.0',topic:topic(),format:format(),calls:0,inputTokens:0,cachedInputTokens:0,
      outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}
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

  const controls=document.createElement('div');
  controls.className='field-block';
  controls.dataset.ldNarrationSmartControls='1';
  controls.style.marginTop='12px';
  controls.innerHTML=
    '<div class="field-head"><label>Final narration Smart Continue</label></div>'+
    '<p class="library-sub">Builds the final voice-over from the exact CURRENT HOOK and P1–P14 production flow. An explicit NO-VO HOOK stays silent. ENDING uses the locked channel CTA.</p>'+
    '<button id="ldNarrationSmartBtn" class="primary" type="button" style="width:100%;margin-top:8px">🎙️ SMART CONTINUE NARRATION</button>'+
    '<button id="ldNarrationCopyFullBtn" class="ghost small" type="button" style="width:100%;margin-top:8px">📋 COPY FULL NARRATION</button>'+
    '<button id="ldNarrationUndoBtn" class="ghost small hidden" type="button" style="margin-top:8px">Undo narration polish</button>'+
    '<p id="ldNarrationSmartStatus" class="library-sub" role="status" style="margin-top:8px">Ready.</p>';

  const notice=document.getElementById('masterNarrationNotice');

  function dedupeNarrationControls(){
    const buttons=[...masterCard.querySelectorAll('#ldNarrationSmartBtn')];
    if(buttons.length<=1)return;
    // Keep the newest mounted control and remove stale cached copies.
    buttons.slice(0,-1).forEach(oldBtn=>{
      const block=oldBtn.closest('.field-block');
      if(block)block.remove();
      else oldBtn.remove();
    });
  }

  // Clean any duplicate controls left by an older cached script before mounting the new one.
  [...masterCard.querySelectorAll('#ldNarrationSmartBtn')].forEach(btn=>{
    const block=btn.closest('.field-block');
    if(block&&block!==controls)block.remove();
  });
  notice?.parentNode?.insertBefore(controls,notice.nextSibling);

  // UNIFIED PIPELINE UI V1:
  // Present Smart Narration as Stage 0 directly before HOOK while preserving
  // the existing narration engine, approval state, backup and controls.
  function mountNarrationStageZero(){
    const firstStage=stages.querySelector('.stage-card');
    if(!firstStage)return;
    let stage=document.getElementById('ldNarrationStageZero');
    if(!stage){
      stage=document.createElement('section');
      stage.id='ldNarrationStageZero';
      stage.className='stage-card';
      stage.dataset.stage='NARRATION';
      stage.style.marginBottom='14px';
      stage.innerHTML=
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">'+
          '<div><span class="stage-name">NARRATION</span><h3 class="stage-title" style="margin:8px 0 4px">Smart Narration</h3>'+
          '<p class="scene-role" style="margin:0">Stage 0 · Build, review and approve the complete voice-over before HOOK production.</p></div>'+
          '<span id="ldNarrationStageBadge" style="white-space:nowrap;font-weight:800">NOT APPROVED</span>'+
        '</div>'+
        '<div id="ldNarrationStageBody" style="margin-top:12px"></div>';
      stages.insertBefore(stage,firstStage);
    }
    const body=stage.querySelector('#ldNarrationStageBody');
    if(body&&controls.parentNode!==body)body.appendChild(controls);
  }
  mountNarrationStageZero();
  dedupeNarrationControls();
  [80,250,700,1500].forEach(ms=>setTimeout(dedupeNarrationControls,ms));
  new MutationObserver(()=>dedupeNarrationControls()).observe(masterCard,{childList:true,subtree:true});

  const btn=document.getElementById('ldNarrationSmartBtn');
  const copyFull=document.getElementById('ldNarrationCopyFullBtn');
  const undo=document.getElementById('ldNarrationUndoBtn');

  function fullNarrationText(){
    const ordered=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
    return ordered.map(stage=>{
      if(stage==='HOOK'&&hookIsSilent(stageCard('HOOK')))return '';
      return value(stageCard(stage),'.narration');
    }).filter(Boolean).join('\n\n').trim();
  }

  copyFull?.addEventListener('click',async()=>{
    const text=fullNarrationText();
    if(!text){
      status('No narration is available to copy yet.','error');
      return;
    }
    try{
      await navigator.clipboard.writeText(text);
      const previous=copyFull.textContent;
      copyFull.textContent='✅ FULL NARRATION COPIED';
      status('Full narration copied as clean text — ready to paste into your voice lab.','pass');
      setTimeout(()=>{copyFull.textContent=previous;},1800);
    }catch{
      const area=document.createElement('textarea');
      area.value=text;
      area.style.position='fixed';
      area.style.opacity='0';
      document.body.appendChild(area);
      area.select();
      const ok=document.execCommand('copy');
      area.remove();
      if(ok){
        status('Full narration copied as clean text — ready to paste into your voice lab.','pass');
      }else{
        status('Copy failed. Please try again.','error');
      }
    }
  });

  function refreshApprovalUi(){
    if(!btn)return;
    const stageZero=document.getElementById('ldNarrationStageZero');
    const badge=document.getElementById('ldNarrationStageBadge');
    const approvedNow=isApproved();
    if(stageZero){
      stageZero.style.borderColor=approvedNow?'#2fa84f':'';
      stageZero.dataset.approved=approvedNow?'1':'0';
    }
    if(badge){
      badge.textContent=approvedNow?'✓ APPROVED':'NOT APPROVED';
      badge.style.color=approvedNow?'#7ee787':'';
    }
    if(approvedNow){
      btn.dataset.mode='rebuild';
      btn.textContent='🎙️ REBUILD NARRATION';
      status('✅ SMART NARRATION APPROVED · Final Audit is now unlocked.','pass');
      return;
    }
    if(narrationReady()&&btn.dataset.generated==='1'){
      btn.dataset.mode='approve';
      btn.textContent='✅ APPROVE SMART NARRATION';
      return;
    }
    btn.dataset.mode='generate';
    btn.textContent='🎙️ SMART CONTINUE NARRATION';
  }

  window.LDNarrationApproval={
    isApproved,
    approve:approveNarration,
    clear:clearApproval,
    signature:narrationSignature,
    ready:narrationReady
  };
  refreshApprovalUi();

  btn?.addEventListener('click',async()=>{
    if(btn.disabled)return;

    if(btn.dataset.mode==='approve'){
      if(!approveNarration()){
        status('Smart Narration cannot be approved yet because a required narration segment is missing.','error');
        return;
      }
      btn.dataset.generated='0';
      refreshApprovalUi();
      return;
    }

    // APPROVAL PROTECTION V2.4:
    // An approved narration is immutable until the user explicitly confirms a rebuild.
    // This prevents an accidental Smart Continue click from clearing a reviewed script.
    if(btn.dataset.mode==='rebuild'&&isApproved()){
      const confirmed=window.confirm(
        'This narration is APPROVED and protected. Rebuild it with Smart Narration? The current approved narration will be backed up first and approval will be cleared only after you confirm.'
      );
      if(!confirmed){
        status('✅ APPROVED NARRATION KEPT · No changes were made.','pass');
        refreshApprovalUi();
        return;
      }
    }

    // Save the currently reviewed script before any approved rebuild, then invalidate approval.
    if(isApproved())saveBackup();
    clearApproval();
    btn.dataset.generated='0';

    const currentTopic=topic();
    if(!currentTopic){
      status('Add the disaster topic first.','error');
      return;
    }

    const hook=stageCard('HOOK');
    const panels=Array.from({length:14},(_,i)=>'P'+(i+1));
    const missing=panels.filter(stage=>!stageCard(stage));
    if(missing.length){
      status('Missing production stages: '+missing.join(', ')+'.','error');
      return;
    }

    const silentHook=hookIsSilent(hook);
    const productionStages={};
    const targetStageSeconds={};

    ['HOOK',...panels].forEach(stage=>{
      const card=stageCard(stage);
      if(!card)return;
      productionStages[stage]=stageContext(card);
      if(!(stage==='HOOK'&&silentHook))targetStageSeconds[stage]=detectSeconds(card);
    });

    saveBackup();
    btn.disabled=true;
    btn.textContent='🎙️ BUILDING FINAL NARRATION…';
    status('Research-checking facts and matching every line to the current HOOK → P14 production flow…','working');

    try{
      const response=await fetch('/api/ai-narration',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          topic:currentTopic,
          format:format(),
          narrativeFormat:window.ldNarrativeFormat||'original',
          skipStages:silentHook?['HOOK']:[],
          targetStageSeconds,
          productionStages
        })
      });
      const raw=await response.text();
      let data;
      try{data=JSON.parse(raw);}
      catch{throw new Error('Narration service returned an invalid response.');}
      recordUsage(data.apiUsage);
      if(!response.ok||!data.ok)throw new Error(data.error||('Narration HTTP '+response.status));

      if(silentHook)setNarration(hook,'');
      else {
        if(!String(data.stages?.HOOK||'').trim())throw new Error('Final HOOK narration is missing.');
        setNarration(hook,data.stages.HOOK);
      }

      for(const stage of panels){
        const line=String(data.stages?.[stage]||'').trim();
        if(!line)throw new Error('Final narration is missing for '+stage+'.');
        setNarration(stageCard(stage),line);
      }

      const ending=stageCard('ENDING');
      if(ending)setNarration(ending,ENDING_CTA);

      undo?.classList.remove('hidden');
      btn.dataset.generated='1';
      window.dispatchEvent(new CustomEvent('ld:narration-smart-complete',{
        detail:{silentHook,topic:currentTopic,stages:silentHook?15:16}
      }));
      status(
        '✅ FINAL NARRATION READY FOR REVIEW · '+(silentHook?'HOOK kept silent · ':'HOOK narrated · ')+
        'P1–P14 aligned · ENDING CTA added. Review it, then press APPROVE SMART NARRATION to unlock Final Audit.',
        'pass'
      );
      refreshApprovalUi();
    }catch(error){
      restoreBackup();
      status('Narration polish stopped safely: '+String(error?.message||error)+' Previous narration was restored.','error');
    }finally{
      btn.disabled=false;
      refreshApprovalUi();
    }
  });

  undo?.addEventListener('click',()=>{
    if(!restoreBackup()){
      status('No narration backup is available for this project.','error');
      return;
    }
    clearApproval();
    btn.dataset.generated='0';
    undo.classList.add('hidden');
    status('Previous narration restored. Smart Narration approval was cleared.','pass');
    refreshApprovalUi();
  });

  // Any manual narration edit after approval requires a fresh narration approval.
  document.addEventListener('input',event=>{
    if(!event.target.closest?.('#stages .narration'))return;
    if(isApproved())return;
    const previous=readApproval();
    if(previous){
      try{localStorage.removeItem(approvalKey());}catch{}
      emitApproval();
      btn.dataset.generated='1';
      refreshApprovalUi();
      status('Narration changed after approval. Review the change and approve Smart Narration again.','working');
    }
  });

  emitApproval();
})();
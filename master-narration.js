(()=>{'use strict';
  const stages=document.getElementById('stages');
  if(!stages)return;

  // Trim appended production instructions only in the compiled export; preserve source fields.
  function spokenText(value){
    const text=String(value||'').trim();
    const marker=/(?:TEXT[- ]TO[- ]VIDEO HOOK\s*[—–-]|VIDEO PROMPT\s*[—–:-]|ABSOLUTE RENDERING MODE\s*[—–:-]|GLOBAL SCENE VARIETY LOCK:|LOCATION VARIETY LOCK:|DOCUMENTARY NARRATION POLISH LOCK:|(?:IMAGE|FLOW|ANIMATION) PROMPT\s*:|NARRATIVE CONTEXT\s*[—–-]|CREATE A CINEMATIC TEXT-TO-VIDEO HOOK)/i;
    const match=marker.exec(text);
    return (match?text.slice(0,match.index):text).trim();
  }

  function getNarration(){
    const rows=[];
    stages.querySelectorAll('.stage-card').forEach(card=>{
      const stage=(card.dataset.stage||card.querySelector('.stage-name')?.textContent||'').trim().toUpperCase();
      const narration=spokenText(card.querySelector('.narration')?.value);
      if(!narration)return;
      if(stage==='ENDING'||stage==='THUMBNAIL')return;
      rows.push({stage,narration});
    });
    return rows;
  }

  function compiled(withLabels=false){
    const rows=getNarration();
    const body=rows.map(x=>withLabels?`${x.stage}\n${x.narration}`:x.narration).join('\n\n');
    const outro="Please like share subscribe for more living disaster story";
    return body ? body+'\n\n'+(withLabels?'OUTRO\n':'')+outro : '';
  }

  function selectText(text){
    const ta=document.getElementById('masterNarrationText');
    ta.value=text;ta.focus();ta.select();ta.setSelectionRange(0,text.length);
    return ta;
  }

  async function copy(text){
    if(!text.trim())return toast('No narration available yet.');
    try{
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      toast('Master narration copied.');return;
    }catch{}
    selectText(text);
    try{
      if(document.execCommand('copy')){toast('Master narration copied.');return;}
    }catch{}
    toast('Automatic copy unavailable. Text selected — long-press and choose Copy.');
  }

  function toast(msg){
    const el=document.getElementById('toast');
    if(!el)return;
    el.textContent=msg;el.classList.add('show');
    clearTimeout(window.__ldNarrToast);window.__ldNarrToast=setTimeout(()=>el.classList.remove('show'),1800);
  }

  const section=document.createElement('section');
  section.id='masterNarrationCard';
  section.className='card';
  section.innerHTML=`<div class="audit-head"><div><span class="audit-label">MASTER NARRATION</span><strong>Compiled voice-over script</strong><p class="library-sub">HOOK through the final narrated panel, combined in production order for easy copy to your voice lab.</p></div><span id="masterNarrationCount" class="audit-pill">0 segments</span></div><p id="masterNarrationNotice" role="status" class="library-sub"></p><div class="field-block" style="margin-top:12px"><textarea id="masterNarrationText" rows="12" readonly placeholder="Generate or enter narration in the production stages first."></textarea></div><div class="audit-actions" style="margin-top:10px"><button id="copyMasterNarrationBtn" class="primary" type="button">Copy master narration</button><button id="copyLabeledNarrationBtn" class="ghost small" type="button">Copy with stage labels</button><button id="selectMasterNarrationBtn" class="ghost small" type="button">Select text manually</button></div>`;

  const pipeline=document.getElementById('pipelineSection');
  pipeline?.parentNode?.insertBefore(section,pipeline);

  // Legacy compiled Master Narration card is retired from the visible workspace.
  // Keep its DOM alive so Smart Narration Stage 0 can reuse the proven controls,
  // state and compiled narration without duplicating the engine.
  section.hidden=true;

  // Smart Narration is visually part of the production sequence, but it stays
  // outside app.js's normal .stage-card persistence contract because normal
  // stages require image/flow fields. Its Done state is tied directly to the
  // Smart Narration approval signature instead.
  function syncNarrationStageZero(){
    const stage=document.getElementById('ldNarrationStageZero');
    if(!stage)return;

    // Prevent the generic stage collector from treating NARRATION like a visual stage.
    stage.classList.remove('stage-card');
    stage.classList.add('card','narration-stage-zero-card');
    stage.dataset.stage='NARRATION';

    const header=stage.firstElementChild;
    if(!header)return;

    let right=document.getElementById('ldNarrationStageRight');
    if(!right){
      const badge=document.getElementById('ldNarrationStageBadge');
      right=document.createElement('div');
      right.id='ldNarrationStageRight';
      right.style.cssText='display:flex;flex-direction:column;align-items:flex-end;gap:8px;white-space:nowrap';
      if(badge){
        badge.parentNode?.insertBefore(right,badge);
        right.appendChild(badge);
      }else{
        header.appendChild(right);
      }
      const label=document.createElement('label');
      label.className='check';
      label.innerHTML='<input id="ldNarrationDoneToggle" type="checkbox"/> Done';
      right.appendChild(label);
    }

    const toggle=document.getElementById('ldNarrationDoneToggle');
    const approved=!!window.LDNarrationApproval?.isApproved?.();
    if(toggle){
      toggle.checked=approved;
      toggle.disabled=!approved;
      toggle.title=approved?'Smart Narration approved':'Approve Smart Narration first';
    }
    stage.dataset.done=approved?'1':'0';
  }

  function refresh(){
    const rows=getNarration();
    const ta=document.getElementById('masterNarrationText');
    const count=document.getElementById('masterNarrationCount');
    // Avoid resetting a manual selection while unrelated stage UI changes.
    if(ta&&document.activeElement!==ta&&ta.value!==compiled(false))ta.value=compiled(false);
    const affected=[],missing=[];
    stages.querySelectorAll('.stage-card').forEach(card=>{
      const stage=(card.dataset.stage||'').toUpperCase();
      if(stage==='ENDING'||stage==='THUMBNAIL')return;
      const raw=(card.querySelector('.narration')?.value||'').trim();
      if(raw!==spokenText(raw))affected.push(stage);
      if(!spokenText(raw))missing.push(stage);
    });
    const notice=document.getElementById('masterNarrationNotice');
    if(notice)notice.textContent=(affected.length?'Production instructions excluded from export: '+affected.join(', ')+'. Original fields unchanged. ':'')+(missing.length?'INCOMPLETE NARRATION — missing or prompt-only fields: '+missing.join(', ')+'. Restore spoken narration before voice generation.':'');
    if(count)count.textContent=`${rows.length} segment${rows.length===1?'':'s'}`;
    syncNarrationStageZero();
  }

  document.getElementById('copyMasterNarrationBtn')?.addEventListener('click',()=>copy(compiled(false)));
  document.getElementById('copyLabeledNarrationBtn')?.addEventListener('click',()=>copy(compiled(true)));

  document.getElementById('selectMasterNarrationBtn')?.addEventListener('click',()=>selectText(compiled(false)));
  document.getElementById('masterNarrationText')?.addEventListener('blur',refresh);
  window.addEventListener('ld:production-built',refresh);
  window.addEventListener('ld:narration-approval-changed',()=>setTimeout(syncNarrationStageZero,0));
  window.addEventListener('ld:narration-smart-complete',()=>setTimeout(syncNarrationStageZero,0));

  document.addEventListener('input',e=>{if(e.target.closest('.narration'))refresh();});
  document.addEventListener('click',e=>{if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))[80,220,500].forEach(ms=>setTimeout(refresh,ms));},true);
  new MutationObserver(()=>{setTimeout(refresh,80);setTimeout(syncNarrationStageZero,0);}).observe(stages,{childList:true,subtree:true});
  window.addEventListener('load',()=>{setTimeout(refresh,500);setTimeout(syncNarrationStageZero,520);});
  setTimeout(refresh,250);
  setTimeout(syncNarrationStageZero,320);
})();
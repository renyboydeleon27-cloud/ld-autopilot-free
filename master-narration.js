(()=>{'use strict';
  const stages=document.getElementById('stages');
  if(!stages)return;

  function getNarration(){
    const rows=[];
    stages.querySelectorAll('.stage-card').forEach(card=>{
      const stage=(card.dataset.stage||card.querySelector('.stage-name')?.textContent||'').trim().toUpperCase();
      const narration=(card.querySelector('.narration')?.value||'').trim();
      if(!narration)return;
      if(stage==='ENDING'||stage==='THUMBNAIL')return;
      rows.push({stage,narration});
    });
    return rows;
  }

  function compiled(withLabels=false){
    const rows=getNarration();
    const body=rows.map(x=>withLabels?`${x.stage}\n${x.narration}`:x.narration).join('\n\n');
    const outro="Which living disaster should we uncover next? Thank you for watching. Like, share, and subscribe for more stories from Living Disaster Book.";
    return body ? body+'\n\n'+(withLabels?'OUTRO\n':'')+outro : outro;
  }

  async function copy(text){
    if(!text.trim())return toast('No narration available yet.');
    try{await navigator.clipboard.writeText(text);toast('Master narration copied.');}
    catch{
      const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Master narration copied.');
    }
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
  section.innerHTML=`<div class="audit-head"><div><span class="audit-label">MASTER NARRATION</span><strong>Compiled voice-over script</strong><p class="library-sub">HOOK through the final narrated panel, combined in production order for easy copy to your voice lab.</p></div><span id="masterNarrationCount" class="audit-pill">0 segments</span></div><div class="field-block" style="margin-top:12px"><textarea id="masterNarrationText" rows="12" readonly placeholder="Generate or enter narration in the production stages first."></textarea></div><div class="audit-actions" style="margin-top:10px"><button id="copyMasterNarrationBtn" class="primary" type="button">Copy master narration</button><button id="copyLabeledNarrationBtn" class="ghost small" type="button">Copy with stage labels</button></div>`;

  const pipeline=document.getElementById('pipelineSection');
  pipeline?.parentNode?.insertBefore(section,pipeline);

  function refresh(){
    const rows=getNarration();
    const ta=document.getElementById('masterNarrationText');
    const count=document.getElementById('masterNarrationCount');
    if(ta)ta.value=compiled(false);
    if(count)count.textContent=`${rows.length} segment${rows.length===1?'':'s'}`;
  }

  document.getElementById('copyMasterNarrationBtn')?.addEventListener('click',()=>copy(compiled(false)));
  document.getElementById('copyLabeledNarrationBtn')?.addEventListener('click',()=>copy(compiled(true)));

  document.addEventListener('input',e=>{if(e.target.closest('.narration'))refresh();});
  document.addEventListener('click',e=>{if(e.target.closest('#buildBtn,#generateAllBtn,.generate-template-btn'))[80,220,500].forEach(ms=>setTimeout(refresh,ms));},true);
  new MutationObserver(()=>setTimeout(refresh,80)).observe(stages,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(refresh,500));
  setTimeout(refresh,250);
})();
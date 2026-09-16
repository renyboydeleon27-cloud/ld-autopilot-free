(()=>{
  const stagesEl=document.getElementById('stages');
  const generateAllBtn=document.getElementById('generateAllBtn');
  const toast=document.getElementById('toast');
  if(!stagesEl)return;

  function showToast(text){
    if(!toast)return;
    toast.textContent=text;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);
  }

  function fireInput(el){
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function syncCard(card){
    const stage=card?.dataset?.stage;
    if(!stage||stage==='ENDING'||stage==='THUMBNAIL')return false;
    const narration=card.querySelector('.narration');
    const imagePrompt=card.querySelector('.image-prompt');
    if(!narration||!imagePrompt)return false;

    const beat=narration.value.trim();
    if(!beat)return false;

    let next=imagePrompt.value;
    const beatPattern=/Visual beat:[\s\S]*?(?=\s+Show one historically)/i;
    if(beatPattern.test(next)){
      next=next.replace(beatPattern,`Visual beat: ${beat}`);
    }else if(!/Visual beat:/i.test(next)){
      const anchor=/Scene role:[^.]+\./i;
      if(anchor.test(next)) next=next.replace(anchor,m=>`${m} Visual beat: ${beat}.`);
    }

    if(next===imagePrompt.value)return false;
    imagePrompt.value=next;
    fireInput(imagePrompt);
    return true;
  }

  function syncAll(showMessage=false){
    let changed=0;
    stagesEl.querySelectorAll('.stage-card').forEach(card=>{if(syncCard(card))changed++;});
    if(showMessage&&changed)showToast(`Synced ${changed} image prompt${changed===1?'':'s'}`);
  }

  // Run after the existing template generators finish writing narration/prompts.
  generateAllBtn?.addEventListener('click',()=>setTimeout(()=>syncAll(true),50));

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(!btn)return;
    const card=btn.closest('.stage-card');
    setTimeout(()=>{
      if(syncCard(card))showToast('Image prompt synced to narration');
    },50);
  });

  // Also repair currently loaded projects without changing narration or Done state.
  setTimeout(()=>syncAll(false),150);
})();

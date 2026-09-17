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

  function syncEnding(card){
    const imagePrompt=card?.querySelector('.image-prompt');
    if(!imagePrompt)return false;
    let next=imagePrompt.value;
    const oldBlock=/Include Living Disaster Book branding, chapter title, disaster name\/year, THANK YOU FOR WATCHING, LIKE \/ SHARE \/ SUBSCRIBE, reflective cinematic mood\./i;
    if(!oldBlock.test(next))return false;
    next=next.replace(oldBlock,'Include clean Living Disaster Book branding and the exact closing text: “Thank you for watching. Like, share, and subscribe for more stories from the Living Disaster Book.” Use a reflective cinematic final mood and keep all text centered, highly legible, and mobile-safe.');
    if(next===imagePrompt.value)return false;
    imagePrompt.value=next;
    fireInput(imagePrompt);
    return true;
  }

  function syncCard(card){
    const stage=card?.dataset?.stage;
    if(!stage||stage==='THUMBNAIL')return false;
    if(stage==='ENDING')return syncEnding(card);
    const narration=card.querySelector('.narration');
    const imagePrompt=card.querySelector('.image-prompt');
    const sceneRole=card.querySelector('.scene-role')?.textContent?.trim();
    if(!narration||!imagePrompt)return false;

    const beat=narration.value.trim();
    let next=imagePrompt.value;

    if(sceneRole){
      const rolePattern=/Scene role:[^.]+\./i;
      if(rolePattern.test(next)) next=next.replace(rolePattern,`Scene role: ${sceneRole}.`);
    }

    if(beat){
      const beatPattern=/Visual beat:[\s\S]*?(?=\s+(?:Serious colored|Show one historically|HOOK SURVIVAL LOCK|Adult characters only|No embedded text))/i;
      if(beatPattern.test(next)){
        next=next.replace(beatPattern,`Visual beat: ${beat}.`);
      }else if(!/Visual beat:/i.test(next)){
        const anchor=/Scene role:[^.]+\./i;
        if(anchor.test(next)) next=next.replace(anchor,m=>`${m} Visual beat: ${beat}.`);
      }
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

  generateAllBtn?.addEventListener('click',()=>setTimeout(()=>syncAll(true),50));

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(!btn)return;
    const card=btn.closest('.stage-card');
    setTimeout(()=>{
      if(syncCard(card))showToast('Image prompt synced to stage role and narration');
    },50);
  });

  document.addEventListener('input',e=>{
    if(!e.target.matches('.narration'))return;
    const card=e.target.closest('.stage-card');
    if(card) setTimeout(()=>syncCard(card),0);
  });

  setTimeout(()=>syncAll(false),150);
})();

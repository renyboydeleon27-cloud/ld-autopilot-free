(()=>{
  const generateAllBtn=document.getElementById('generateAllBtn');
  const stagesEl=document.getElementById('stages');
  const topicEl=document.getElementById('topic');
  const formatEl=document.getElementById('format');
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
  function topic(){return topicEl?.value.trim()||'this disaster';}
  function isShorts(){return formatEl?.value!=='longform';}

  function narrationTemplate(stage){
    const t=topic();
    if(stage==='HOOK') return `At first, everything seemed normal. Then one warning sign revealed that ${t} was about to change everything.`;
    if(stage==='ENDING'||stage==='THUMBNAIL') return '';
    const n=Number(stage.slice(1));
    if(isShorts()){
      const map={
        1:`Before ${t}, [verified location/context] was living through an ordinary day, unaware of what was about to happen.`,
        2:`Beneath or around the region, [verified scientific/historical cause] had been building long before the disaster became visible.`,
        3:`On [verified date], [verified trigger event] began, setting the disaster in motion.`,
        4:`The first clear warning appeared as [verified warning sign or early event], but there was little time to react.`,
        5:`As the danger intensified, [verified environmental or infrastructure change] showed that the situation was becoming critical.`,
        6:`Then the disaster struck in full force, bringing [verified primary impact] across the affected area.`,
        7:`The situation escalated rapidly as [verified major impact] spread through communities and infrastructure.`,
        8:`Within [verified time span], the disaster affected [verified wider area or population], expanding far beyond the first impact zone.`,
        9:`When the immediate danger began to ease, survivors faced [verified aftermath condition] across devastated communities.`,
        10:`The human cost was severe: [verified casualty or impact figure], leaving families and communities permanently changed.`,
        11:`Thousands of survivors were displaced or cut off from basic needs as emergency response began.`,
        12:`The disaster also caused major damage to homes, roads, businesses, infrastructure, and local livelihoods.`,
        13:`In the months and years that followed, survivors and responders rebuilt communities while recovery continued.`,
        14:`The legacy of ${t} reshaped preparedness, response, and remembrance for the generations that followed.`
      };
      return map[n]||`Continue the verified story of ${t} with one clear historical fact and one strong visual beat.`;
    }
    if(n<=3) return `Before ${t}, [verified location and normal-life detail] established the world before the disaster.`;
    if(n<=6) return `Warning signs emerged through [verified scientific, environmental, or historical detail], increasing tension.`;
    if(n<=10) return `The disaster began when [verified trigger], creating the first major impact across the scene.`;
    if(n<=15) return `The crisis escalated as [verified impact] disrupted people, infrastructure, and the surrounding environment.`;
    if(n<=20) return `At the peak of ${t}, [verified high-impact event] created the strongest moment of the disaster.`;
    if(n<=24) return `The wider impact reached [verified region/population], showing how far the disaster had spread.`;
    if(n<=27) return `In the aftermath, survivors and responders faced [verified rescue or recovery challenge].`;
    if(n<=29) return `${t} changed how people understood preparedness, risk, and disaster response.`;
    return `Years later, the memory and lessons of ${t} remained part of the region's history.`;
  }

  function imageTemplate(stage,role){
    const t=topic();
    const ratio=isShorts()?'portrait 9:16':'landscape 16:9';
    if(stage==='ENDING') return `Create the Living Disaster Book ENDING illustration for ${t}, ${ratio}. Show a reflective post-disaster scene appropriate to the verified historical setting. Include Living Disaster Book branding, chapter title, disaster name/year, THANK YOU FOR WATCHING, LIKE / SHARE / SUBSCRIBE. Serious colored historical graphic-novel/anime style, hand-inked linework, cel-painted textures, cinematic depth, adult characters only if visible. No photorealism, no live action, no 3D CGI, no chibi, no gore. Illustration only.`;
    if(stage==='THUMBNAIL') return `Create a high-impact YouTube thumbnail for ${t}, ${ratio}. Show the disaster's most recognizable verified visual moment with one adult foreground subject for scale and emotion. Serious colored historical graphic-novel/anime style, hand-inked linework, cel-painted textures, strong contrast, cinematic atmosphere, bold readable headline, mobile-first composition. No photorealism, no live action, no 3D CGI, no chibi, no gore. Illustration only.`;
    return `Create ${stage} illustration for ${t}, ${ratio}. Scene role: ${role}. Depict one historically and scientifically believable moment using only verified scene details. Serious colored historical graphic-novel/anime style, detailed 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions, historically believable architecture, clothing, tools and terrain, cinematic foreground-midground-background depth, appropriate atmospheric conditions. Adult characters only. No embedded text. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore.`;
  }

  function flowTemplate(stage){
    const t=topic();
    const ratio=isShorts()?'portrait 9:16':'landscape 16:9';
    return `Animate the supplied ${stage} illustration for exactly 10 seconds, ${ratio}, as one continuous cinematic 2D shot for ${t}. Use the supplied illustration as the absolute visual reference. Preserve the exact historical graphic-novel/anime linework, cel-painted textures, anatomy, architecture, terrain, objects, perspective, palette and lighting. Begin clearly readable motion within the first 0.5 second and sustain meaningful motion through second 10. PRIMARY ACTION: animate the single most important event already visible in the image. Animate 3–7 supported environmental elements with believable physics. Animate visible adults only when pose and visibility safely support restrained natural movement; otherwise keep them static. CAMERA: use one restrained 2–4% push-in, slight track/tilt, controlled pull-back, or event-appropriate documentary vibration. Do not invent unsupported destruction. Preserve adult identity, count and anatomy. Natural SFX only; no music or voice-over. Negative lock: no cuts, transitions, morphing, time-lapse, new people, vehicles or buildings, duplication, anatomy changes, unnatural growth, photoreal drift, live-action transformation, 3D CGI, text, captions, logos or watermark.`;
  }

  function applyToCard(card,{overwrite=false}={}){
    const stage=card.dataset.stage;
    if(!stage)return false;
    const role=card.querySelector('.scene-role')?.textContent||'';
    const narration=card.querySelector('.narration');
    const image=card.querySelector('.image-prompt');
    const flow=card.querySelector('.flow-prompt');
    let changed=false;
    if(stage!=='ENDING'&&stage!=='THUMBNAIL'&&narration&&(overwrite||!narration.value.trim())){
      narration.value=narrationTemplate(stage);fireInput(narration);changed=true;
    }
    if(image&&(overwrite||!image.value.trim())){
      image.value=imageTemplate(stage,role);fireInput(image);changed=true;
    }
    if(stage!=='ENDING'&&stage!=='THUMBNAIL'&&flow&&(overwrite||!flow.value.trim())){
      flow.value=flowTemplate(stage);fireInput(flow);changed=true;
    }
    return changed;
  }

  function wireStageButtons(){
    stagesEl.querySelectorAll('.stage-card').forEach(card=>{
      const btn=card.querySelector('.generate-template-btn');
      if(!btn||btn.dataset.wired)return;
      btn.dataset.wired='1';
      btn.addEventListener('click',()=>{
        const hasContent=[card.querySelector('.narration')?.value,card.querySelector('.image-prompt')?.value,card.querySelector('.flow-prompt')?.value].some(v=>v&&v.trim());
        let overwrite=false;
        if(hasContent){
          overwrite=confirm(`Replace the existing template content for ${card.dataset.stage}?`);
          if(!overwrite){
            const changed=applyToCard(card,{overwrite:false});
            showToast(changed?'Filled missing fields':'No empty fields');
            return;
          }
        }
        applyToCard(card,{overwrite});
        showToast(`${card.dataset.stage} template generated`);
      });
    });
  }

  generateAllBtn?.addEventListener('click',()=>{
    const cards=[...stagesEl.querySelectorAll('.stage-card')];
    if(!cards.length)return showToast('No production yet');
    let changed=0;
    cards.forEach(card=>{if(applyToCard(card,{overwrite:false}))changed++;});
    showToast(changed?`Templates added to ${changed} stages`:'No empty fields to fill');
  });

  const observer=new MutationObserver(()=>wireStageButtons());
  observer.observe(stagesEl,{childList:true,subtree:true});
  wireStageButtons();
})();

(()=>{
  const MODE_KEY='ld-auto-visual-mode-v1';
  const stages=document.getElementById('stages');
  const setup=document.querySelector('.setup');
  const toast=document.getElementById('toast');
  if(!setup||!stages)return;

  const wrap=document.createElement('div');
  wrap.className='visual-mode-field';
  wrap.innerHTML='<label for="visualMode">Visual Mode</label><select id="visualMode"><option value="anime">Historical Anime</option><option value="real">Real Human</option></select><small id="visualModeHint">Historical graphic-novel/anime style</small>';
  const buildBtn=document.getElementById('buildBtn');
  setup.insertBefore(wrap,buildBtn||null);

  const select=wrap.querySelector('#visualMode');
  const hint=wrap.querySelector('#visualModeHint');
  const saved=localStorage.getItem(MODE_KEY);
  select.value=saved==='real'?'real':'anime';

  const REAL_IMAGE_STYLE='Cinematic historical live-action realism with real adult humans, natural skin texture, realistic hair and fabric, grounded anatomy, period-accurate clothing and environment, believable practical lighting, documentary composition, authentic 1980s archival/broadcast finish with subtle film grain, slightly faded colors, mild analog softness and restrained VHS-era texture';
  const REAL_NEG='No anime, no illustration, no cel shading, no 3D CGI, no glossy modern digital look, no beauty-filter skin, no hyper-sharp modern cinema finish, no duplicated people, no distorted anatomy, no extra fingers, no gore.';
  const ANIME_STYLE='Serious colored historical graphic-novel/anime style, detailed 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions';
  const ANIME_NEG='No embedded text. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore.';

  function showToast(text){if(!toast)return;toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);}
  function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}

  function toRealImage(text){
    let s=text||'';
    s=s.replace(/Create (the Living Disaster Book ENDING|a high-impact YouTube thumbnail|(?:HOOK|P\d+|S\d+)) illustration/gi,'Create $1 live-action historical frame');
    s=s.replace(/Serious colored historical graphic-novel\/anime style, detailed 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions/gi,REAL_IMAGE_STYLE);
    s=s.replace(/Serious colored historical graphic-novel\/anime, hand-inked linework, cel-painted textures, adult characters only, no photorealistic humans, no live action, no 3D CGI people\./gi,`${REAL_IMAGE_STYLE}. Adult characters only.`);
    s=s.replace(/Illustration only\./gi,'Live-action historical still only.');
    s=s.replace(/No embedded text\. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore\./gi,`No embedded text. ${REAL_NEG}`);
    if(!/1980s archival|VHS-era/i.test(s))s+=` ${REAL_IMAGE_STYLE}. ${REAL_NEG}`;
    return s.replace(/\s{2,}/g,' ').trim();
  }

  function toAnimeImage(text){
    let s=text||'';
    s=s.replace(/Create (the Living Disaster Book ENDING|a high-impact YouTube thumbnail|(?:HOOK|P\d+|S\d+)) live-action historical frame/gi,'Create $1 illustration');
    s=s.replace(new RegExp(REAL_IMAGE_STYLE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),ANIME_STYLE);
    s=s.replace(/Live-action historical still only\./gi,'Illustration only.');
    s=s.replace(new RegExp(REAL_NEG.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),ANIME_NEG);
    s=s.replace(/Cinematic historical live-action realism[^.]*1980s archival\/broadcast finish[^.]*\./gi,`${ANIME_STYLE}.`);
    s=s.replace(/No anime, no illustration, no cel shading,[^.]*no gore\./gi,ANIME_NEG);
    return s.replace(/\s{2,}/g,' ').trim();
  }

  function toRealFlow(text){
    let s=text||'';
    s=s.replace(/Animate the supplied ([A-Z0-9]+) illustration/gi,'Animate the supplied $1 live-action historical frame');
    s=s.replace(/as one continuous cinematic 2D shot/gi,'as one continuous historical live-action archival documentary shot');
    s=s.replace(/Use the supplied illustration as the absolute visual reference\./gi,'Use the supplied live-action historical frame as the absolute visual reference.');
    s=s.replace(/Preserve the exact historical graphic-novel\/anime linework, cel-painted textures, anatomy, architecture, terrain, objects, perspective, palette and lighting\./gi,'Preserve the exact adult identities, facial features, anatomy, period clothing, architecture, terrain, objects, perspective and lighting. Maintain an authentic 1980s archival documentary finish: subtle film grain, slightly faded color, mild analog softness, restrained broadcast/VHS texture and natural motion blur.');
    s=s.replace(/photoreal drift, live-action transformation, 3D CGI/gi,'anime or illustration drift, 3D CGI, plastic skin, modern glossy digital sharpening');
    if(!/archival documentary finish/i.test(s))s+=` Maintain an authentic 1980s archival documentary finish with subtle film grain, slightly faded colors, mild analog softness and restrained VHS/broadcast texture. No anime, illustration or 3D CGI transformation.`;
    return s.replace(/\s{2,}/g,' ').trim();
  }

  function toAnimeFlow(text){
    let s=text||'';
    s=s.replace(/Animate the supplied ([A-Z0-9]+) live-action historical frame/gi,'Animate the supplied $1 illustration');
    s=s.replace(/as one continuous historical live-action archival documentary shot/gi,'as one continuous cinematic 2D shot');
    s=s.replace(/Use the supplied live-action historical frame as the absolute visual reference\./gi,'Use the supplied illustration as the absolute visual reference.');
    s=s.replace(/Preserve the exact adult identities, facial features, anatomy, period clothing, architecture, terrain, objects, perspective and lighting\. Maintain an authentic 1980s archival documentary finish: subtle film grain, slightly faded color, mild analog softness, restrained broadcast\/VHS texture and natural motion blur\./gi,'Preserve the exact historical graphic-novel/anime linework, cel-painted textures, anatomy, architecture, terrain, objects, perspective, palette and lighting.');
    s=s.replace(/anime or illustration drift, 3D CGI, plastic skin, modern glossy digital sharpening/gi,'photoreal drift, live-action transformation, 3D CGI');
    s=s.replace(/Maintain an authentic 1980s archival documentary finish with subtle film grain, slightly faded colors, mild analog softness and restrained VHS\/broadcast texture\. No anime, illustration or 3D CGI transformation\./gi,'');
    return s.replace(/\s{2,}/g,' ').trim();
  }

  function applyCard(card,notify=false){
    const real=select.value==='real';
    const img=card.querySelector('.image-prompt');
    const flow=card.querySelector('.flow-prompt');
    let changed=false;
    if(img){const next=real?toRealImage(img.value):toAnimeImage(img.value);if(next!==img.value){img.value=next;fire(img);changed=true;}}
    if(flow&&card.dataset.stage!=='ENDING'&&card.dataset.stage!=='THUMBNAIL'){const next=real?toRealFlow(flow.value):toAnimeFlow(flow.value);if(next!==flow.value){flow.value=next;fire(flow);changed=true;}}
    if(notify&&changed)showToast(real?'Real Human mode applied':'Historical Anime mode applied');
  }

  function applyAll(notify=false){stages.querySelectorAll('.stage-card').forEach(c=>applyCard(c,false));hint.textContent=select.value==='real'?'Real human · 1980s archival documentary look':'Historical graphic-novel/anime style';document.body.dataset.visualMode=select.value;if(notify)showToast(select.value==='real'?'Visual Mode: Real Human':'Visual Mode: Historical Anime');}

  let guard=false;
  select.addEventListener('change',()=>{localStorage.setItem(MODE_KEY,select.value);guard=true;applyAll(true);setTimeout(()=>guard=false,30);});
  document.addEventListener('input',e=>{if(guard||!e.target.matches('.image-prompt,.flow-prompt'))return;const card=e.target.closest('.stage-card');if(!card)return;setTimeout(()=>{guard=true;applyCard(card,false);guard=false;},0);});
  document.addEventListener('click',e=>{if(!e.target.closest('.generate-template-btn,#generateAllBtn,#buildBtn'))return;setTimeout(()=>{guard=true;applyAll(false);guard=false;},120);});
  setTimeout(()=>applyAll(false),250);
})();

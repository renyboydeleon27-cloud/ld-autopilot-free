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
  const topicEl=document.getElementById('topic');
  const projectTitle=document.getElementById('projectTitle');
  const saved=localStorage.getItem(MODE_KEY);
  select.value=saved==='real'?'real':'anime';

  const BASE_REAL_STYLE='Cinematic historical live-action realism with real adult humans, natural skin texture, realistic hair and fabric, grounded anatomy, period-accurate clothing and environment, believable practical lighting and documentary composition';
  const LEGACY_REAL_STYLE='Cinematic historical live-action realism with real adult humans, natural skin texture, realistic hair and fabric, grounded anatomy, period-accurate clothing and environment, believable practical lighting, documentary composition, authentic 1980s archival/broadcast finish with subtle film grain, slightly faded colors, mild analog softness and restrained VHS-era texture';
  const REAL_NEG='No anime, no illustration, no cel shading, no 3D CGI, no glossy artificial render, no beauty-filter skin, no duplicated people, no distorted anatomy, no extra fingers, no gore.';
  const ANIME_STYLE='Serious colored historical graphic-novel/anime style, detailed 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions';
  const ANIME_NEG='No embedded text. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore.';

  function currentTopic(){return (topicEl?.value||projectTitle?.textContent||'').trim();}
  function detectYear(text){
    const years=[...String(text||'').matchAll(/\b(18\d{2}|19\d{2}|20\d{2}|2100)\b/g)].map(m=>Number(m[1]));
    return years.length?years[0]:null;
  }
  function eraForYear(year){
    if(!year)return {label:'Era-aware historical documentary look',look:'Use a historically plausible capture and documentary finish appropriate to the disaster year. Do not impose a generic vintage filter.'};
    if(year<=1929)return {label:`${year} · early-film/newsreel look`,look:'Use an early-20th-century restored film/newsreel character: predominantly black-and-white or very restrained period-appropriate tonality, soft optical detail, visible film grain, slight gate weave and restrained exposure flicker. Avoid VHS, modern HD sharpness and modern digital grading.'};
    if(year<=1959)return {label:`${year} · mid-century newsreel film`,look:'Use a mid-century newsreel/documentary film character with black-and-white or historically plausible limited color, organic 16mm/35mm grain, optical softness, restrained contrast and subtle film instability. Avoid VHS and modern digital sharpness.'};
    if(year<=1979)return {label:`${year} · film / early broadcast look`,look:'Use a 1960s-1970s documentary/news-film character with period-plausible color or monochrome, muted saturation, organic film grain, modest lens softness and restrained broadcast transfer texture. No VHS-era styling unless historically justified.'};
    if(year<=1999)return {label:`${year} · analog broadcast look`,look:'Use a late-20th-century analog news/documentary look with slightly faded color, mild broadcast softness, restrained tape noise, natural motion blur and subtle VHS/Betacam-era texture without exaggerated tracking damage.'};
    if(year<=2009)return {label:`${year} · early digital news look`,look:'Use an early-2000s digital news/camcorder documentary look with natural color, modest sensor sharpness, mild interlaced/broadcast softness, restrained compression texture and realistic handheld motion where appropriate. Avoid fake film/VHS aging.'};
    if(year<=2019)return {label:`${year} · HD broadcast documentary`,look:'Use a 2010s HD broadcast/documentary look with natural color, realistic digital detail, restrained broadcast compression, practical lighting and believable camera motion. Avoid retro VHS or old-film filters.'};
    return {label:`${year} · modern documentary look`,look:'Use a contemporary documentary/news-camera look with natural color, realistic digital sharpness, practical lighting, restrained dynamic range and believable camera motion. Do not add fake vintage film, VHS or archival aging.'};
  }
  function eraLock(){
    const year=detectYear(currentTopic());
    const era=eraForYear(year);
    const yearText=year?`The historical setting remains exactly ${year}. `:'';
    return {year,era,text:`ERA-AWARE CAPTURE LOCK: ${yearText}${era.look} The capture treatment affects only the camera/recording appearance; clothing, architecture, streets, vehicles, utilities, tools, signs, technology and infrastructure must remain accurate to the event year and location. END ERA LOCK.`};
  }
  function stripEra(text){return String(text||'').replace(/\s*ERA-AWARE CAPTURE LOCK:[\s\S]*?END ERA LOCK\.?/gi,'').replace(/\s{2,}/g,' ').trim();}
  function stripLegacy80s(text){
    return String(text||'')
      .replace(new RegExp(LEGACY_REAL_STYLE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),BASE_REAL_STYLE)
      .replace(/Maintain an authentic 1980s archival documentary finish:[^.]*\./gi,'')
      .replace(/Maintain an authentic 1980s archival documentary finish with[^.]*\./gi,'')
      .replace(/authentic 1980s archival\/broadcast finish with subtle film grain, slightly faded colors, mild analog softness and restrained VHS-era texture/gi,'period-appropriate documentary capture finish')
      .replace(/Real human · 1980s archival documentary look/gi,'Real human · era-aware documentary look')
      .replace(/\s{2,}/g,' ').trim();
  }
  function injectEraNearStart(text){
    const lock=eraLock().text;
    const s=stripEra(text);
    const first=/^([\s\S]*?\.)\s*/.exec(s);
    if(!first)return `${lock} ${s}`.trim();
    return `${first[1]} ${lock} ${s.slice(first[0].length)}`.replace(/\s{2,}/g,' ').trim();
  }

  function showToast(text){if(!toast)return;toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);}
  function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}

  function toRealImage(text){
    let s=stripLegacy80s(stripEra(text));
    s=s.replace(/Create (the Living Disaster Book ENDING|a high-impact YouTube thumbnail|(?:HOOK|P\d+|S\d+)) illustration/gi,'Create $1 live-action historical frame');
    s=s.replace(/Serious colored historical graphic-novel\/anime style, detailed 2D anime linework, hand-inked outlines, cel-painted textures and shadows, grounded adult proportions/gi,BASE_REAL_STYLE);
    s=s.replace(/Serious colored historical graphic-novel\/anime, hand-inked linework, cel-painted textures, adult characters only, no photorealistic humans, no live action, no 3D CGI people\./gi,`${BASE_REAL_STYLE}. Adult characters only.`);
    s=s.replace(/Illustration only\./gi,'Live-action historical still only.');
    s=s.replace(/No embedded text\. No photorealism, no live action, no 3D CGI, no glossy render, no chibi, no gore\./gi,`No embedded text. ${REAL_NEG}`);
    if(!/Cinematic historical live-action realism/i.test(s))s+=` ${BASE_REAL_STYLE}. ${REAL_NEG}`;
    s=injectEraNearStart(s);
    return s.replace(/\s{2,}/g,' ').trim();
  }

  function toAnimeImage(text){
    let s=stripLegacy80s(stripEra(text));
    s=s.replace(/Create (the Living Disaster Book ENDING|a high-impact YouTube thumbnail|(?:HOOK|P\d+|S\d+)) live-action historical frame/gi,'Create $1 illustration');
    s=s.replace(new RegExp(BASE_REAL_STYLE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),ANIME_STYLE);
    s=s.replace(/Live-action historical still only\./gi,'Illustration only.');
    s=s.replace(new RegExp(REAL_NEG.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),ANIME_NEG);
    s=s.replace(/Cinematic historical live-action realism[^.]*\./gi,`${ANIME_STYLE}.`);
    s=s.replace(/No anime, no illustration, no cel shading,[^.]*no gore\./gi,ANIME_NEG);
    return s.replace(/\s{2,}/g,' ').trim();
  }

  function toRealFlow(text){
    let s=stripLegacy80s(stripEra(text));
    s=s.replace(/Animate the supplied ([A-Z0-9]+) illustration/gi,'Animate the supplied $1 live-action historical frame');
    s=s.replace(/as one continuous cinematic 2D shot/gi,'as one continuous historical live-action documentary shot');
    s=s.replace(/as one continuous historical live-action archival documentary shot/gi,'as one continuous historical live-action documentary shot');
    s=s.replace(/Use the supplied illustration as the absolute visual reference\./gi,'Use the supplied live-action historical frame as the absolute visual reference.');
    s=s.replace(/Preserve the exact historical graphic-novel\/anime linework, cel-painted textures, anatomy, architecture, terrain, objects, perspective, palette and lighting\./gi,'Preserve the exact adult identities, facial features, anatomy, period clothing, architecture, terrain, objects, perspective and lighting.');
    s=s.replace(/supported by the supplied illustration/gi,'supported by the supplied live-action historical frame');
    s=s.replace(/supported by this illustration/gi,'supported by this live-action historical frame');
    s=s.replace(/the supplied illustration/gi,'the supplied live-action historical frame');
    s=s.replace(/supplied illustration/gi,'supplied live-action historical frame');
    s=s.replace(/photoreal drift, live-action transformation, 3D CGI/gi,'anime or illustration drift, 3D CGI, plastic skin, artificial glossy rendering');
    s=injectEraNearStart(s);
    return s.replace(/\s{2,}/g,' ').trim();
  }

  function toAnimeFlow(text){
    let s=stripLegacy80s(stripEra(text));
    s=s.replace(/Animate the supplied ([A-Z0-9]+) live-action historical frame/gi,'Animate the supplied $1 illustration');
    s=s.replace(/as one continuous historical live-action (?:archival )?documentary shot/gi,'as one continuous cinematic 2D shot');
    s=s.replace(/Use the supplied live-action historical frame as the absolute visual reference\./gi,'Use the supplied illustration as the absolute visual reference.');
    s=s.replace(/Preserve the exact adult identities, facial features, anatomy, period clothing, architecture, terrain, objects, perspective and lighting\./gi,'Preserve the exact historical graphic-novel/anime linework, cel-painted textures, anatomy, architecture, terrain, objects, perspective, palette and lighting.');
    s=s.replace(/supported by the supplied live-action historical frame/gi,'supported by the supplied illustration');
    s=s.replace(/supported by this live-action historical frame/gi,'supported by this illustration');
    s=s.replace(/the supplied live-action historical frame/gi,'the supplied illustration');
    s=s.replace(/supplied live-action historical frame/gi,'supplied illustration');
    s=s.replace(/anime or illustration drift, 3D CGI, plastic skin, artificial glossy rendering/gi,'photoreal drift, live-action transformation, 3D CGI');
    return s.replace(/\s{2,}/g,' ').trim();
  }

  function applyCard(card,notify=false){
    const real=select.value==='real';
    const img=card.querySelector('.image-prompt');
    const flow=card.querySelector('.flow-prompt');
    let changed=false;
    if(img){const next=real?toRealImage(img.value):toAnimeImage(img.value);if(next!==img.value){img.value=next;fire(img);changed=true;}}
    if(flow&&card.dataset.stage!=='ENDING'&&card.dataset.stage!=='THUMBNAIL'){const next=real?toRealFlow(flow.value):toAnimeFlow(flow.value);if(next!==flow.value){flow.value=next;fire(flow);changed=true;}}
    if(notify&&changed)showToast(real?'Real Human era lock fixed':'Historical Anime mode applied');
  }

  function updateHint(){
    if(select.value!=='real'){hint.textContent='Historical graphic-novel/anime style';return;}
    const {era}=eraLock();hint.textContent=`Real human · ${era.label}`;
  }
  function applyAll(notify=false){
    stages.querySelectorAll('.stage-card').forEach(c=>applyCard(c,false));
    updateHint();
    document.body.dataset.visualMode=select.value;
    if(notify)showToast(select.value==='real'?'Visual Mode: Real Human · Era-aware':'Visual Mode: Historical Anime');
  }

  let guard=false;
  select.addEventListener('change',()=>{localStorage.setItem(MODE_KEY,select.value);guard=true;applyAll(true);setTimeout(()=>guard=false,30);});
  topicEl?.addEventListener('input',()=>{updateHint();if(select.value==='real')setTimeout(()=>{guard=true;applyAll(false);guard=false;},80);});
  document.addEventListener('input',e=>{if(guard||!e.target.matches('.image-prompt,.flow-prompt'))return;const card=e.target.closest('.stage-card');if(!card)return;setTimeout(()=>{guard=true;applyCard(card,false);guard=false;},0);});
  document.addEventListener('click',e=>{if(!e.target.closest('.generate-template-btn,#generateAllBtn,#buildBtn'))return;setTimeout(()=>{guard=true;applyAll(false);guard=false;},120);});
  setTimeout(()=>applyAll(false),250);
})();

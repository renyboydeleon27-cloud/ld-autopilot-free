(()=>{'use strict';
function text(card,sel){return card.querySelector(sel)?.value?.trim()||''}
function stageNumber(s){const m=String(s).match(/\d+/);return m?Number(m[0]):0}
function check(card){
 const stage=card.dataset.stage||'';const img=text(card,'.image-prompt');const flow=text(card,'.flow-prompt');const topic=(document.getElementById('topic')?.value||'').trim();const issues=[];const passes=[];
 if(topic&&img.toLowerCase().includes(topic.toLowerCase().replace(/^the\s+/i,'')))passes.push('episode identity');else issues.push('episode identity/topic may be weak');
 if(/histor|period|19\d\d|18\d\d|20\d\d|architecture|clothing|transport|utilities|terrain/i.test(img))passes.push('historical/period context');else if(!['ENDING','THUMBNAIL'].includes(stage))issues.push('historical period lock not obvious');
 if(/adult/i.test(img)&&/no (photoreal|live action|3d cgi)/i.test(img))passes.push('adult + illustration style lock');else issues.push('adult/style negative lock incomplete');
 if(stage==='HOOK'){
  if(/active-disaster|surviv|struggl|escap|holding|protect|danger|catastroph/i.test(img))passes.push('active-disaster survival hook');else issues.push('HOOK must show active human survival');
  if(/calm before|approaching (storm|cyclone|disaster)|quiet aftermath/i.test(img))issues.push('HOOK contains prohibited calm/approach/aftermath wording');
 }
 if(!['ENDING','THUMBNAIL'].includes(stage)){
  if(/exactly 10 seconds|10-second|10 seconds/i.test(flow)&&/one continuous/i.test(flow))passes.push('10s continuous animation');else issues.push('10s continuous animation lock incomplete');
  if(/no cuts|no transitions/i.test(flow)&&/morph/i.test(flow))passes.push('anti-morph/cut lock');else issues.push('animation negative lock incomplete');
 }
 const n=stageNumber(stage);if(n>1){const prev=[...document.querySelectorAll('.stage-card')].find(c=>stageNumber(c.dataset.stage)===n-1);if(prev){const p=text(prev,'.image-prompt');const year=(topic.match(/\b(18|19|20)\d{2}\b/)||[])[0];if(year&&p.includes(year)&&img.includes(year))passes.push(`year continuity with P${n-1}`);else if(year)issues.push(`year continuity with previous panel not explicit`)}}
 return {issues,passes};
}
function add(){document.querySelectorAll('.stage-card').forEach(card=>{if(card.querySelector('.continuity-box'))return;const body=card.querySelector('.stage-body');if(!body)return;const box=document.createElement('div');box.className='continuity-box';box.innerHTML='<div class="continuity-head"><strong>MASTER CONTINUITY CHECK</strong><button type="button" class="ghost small continuity-btn">Run check</button></div><div class="continuity-output"><ul class="continuity-list"><li>Not checked yet.</li></ul></div>';const anchor=card.querySelector('.stage-package-actions');anchor?.before(box);box.querySelector('.continuity-btn').onclick=()=>{const r=check(card);const list=box.querySelector('.continuity-list');list.innerHTML='';r.passes.forEach(x=>{const li=document.createElement('li');li.textContent='PASS — '+x;list.append(li)});r.issues.forEach(x=>{const li=document.createElement('li');li.textContent='CHECK — '+x;list.append(li)});if(!r.issues.length){const li=document.createElement('li');li.textContent='READY — no continuity warning detected';list.append(li)}}})}
function hookLabel(){const c=document.querySelector('.stage-card[data-stage="HOOK"] .scene-role');if(c){c.textContent='ACTIVE DISASTER · HUMAN SURVIVAL · peak-danger opening';c.classList.add('hook-v4')}}
function refresh(){add();hookLabel()}
window.addEventListener('load',()=>{refresh();setTimeout(refresh,500)});document.addEventListener('click',()=>setTimeout(refresh,80));window.LDContinuityV4={refresh,check};})();
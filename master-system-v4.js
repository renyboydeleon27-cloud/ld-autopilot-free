(()=>{
'use strict';
const MASTER_VERSION='4.0';
const MASTER_KEY='ld-master-system-v4';
const FACT_KEY='ld-fact-pack-v4';
const defaults={
 version:MASTER_VERSION,
 visual:'Serious colored historical graphic-novel/anime; detailed hand-inked linework; cel-painted textures; cinematic depth; grounded adult proportions; adult characters only; historically accurate architecture, clothing, tools, vehicles, terrain and infrastructure. No photorealism, live action, 3D CGI, glossy render, chibi or gore.',
 hook:'The HOOK begins during the disaster at or near its most dangerous moment. Put the audience inside the catastrophe. Adult survivors actively struggle, escape, help one another, hold onto structures or protect themselves while the disaster is still affecting the scene. Environment damage and hazards must be historically and physically appropriate. The image should immediately create the question: “What happened here—and will they survive?”',
 animation:'Exactly 10 seconds; one continuous cinematic 2D shot; supplied illustration is absolute reference; readable motion within 0.5 second; one dominant primary action; 3–7 supported environmental motions; restrained camera movement; preserve identity, anatomy, count, architecture, perspective, palette and lighting; natural SFX only; no VO/music; no cuts, transitions, morphing, time-lapse, invented people/vehicles/buildings or unsupported destruction.',
 workflow:'Shorts: MASTER NARRATION → HOOK → P01–P14 → ENDING → THUMBNAIL. HOOK/P01–P14 require narration, image prompt and 10-second animation prompt. ENDING and THUMBNAIL are image-only.'
};
function load(key,fallback){try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return {...fallback}}}
function save(key,value){localStorage.setItem(key,JSON.stringify(value))}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function currentTopic(){return (document.getElementById('topic')?.value||document.getElementById('projectTitle')?.textContent||'').trim()}
function buildUI(){
 const pipeline=document.getElementById('pipelineSection'); if(!pipeline||document.getElementById('masterSystemCard'))return;
 const card=el('section','card master-system-card');card.id='masterSystemCard';
 const head=el('div','master-head');const hwrap=el('div');hwrap.append(el('span','audit-label','MASTER SYSTEM'),el('strong','',`Living Disaster Master v${MASTER_VERSION}`),el('p','master-sub','Future episodes inherit these locks. Existing panel text stays untouched until you apply a lock.'));
 const toggle=el('button','ghost small','Open Master');toggle.type='button';head.append(hwrap,toggle);card.append(head);
 const body=el('div','master-body hidden');
 const data=load(MASTER_KEY,defaults);
 [['visual','MASTER ILLUSTRATION LOCK'],['hook','HOOK SURVIVAL LOCK'],['animation','MASTER ANIMATION LOCK'],['workflow','WORKFLOW LOCK']].forEach(([key,label])=>{const block=el('div','field-block');const lab=el('label','',label);const ta=el('textarea','master-field');ta.dataset.key=key;ta.rows=key==='hook'?7:5;ta.value=data[key];block.append(lab,ta);body.append(block)});
 const actions=el('div','master-actions');const saveBtn=el('button','primary','Save Master');const reset=el('button','ghost','Restore Locked Defaults');actions.append(saveBtn,reset);body.append(actions);card.append(body);
 pipeline.parentNode.insertBefore(card,pipeline);
 toggle.onclick=()=>{body.classList.toggle('hidden');toggle.textContent=body.classList.contains('hidden')?'Open Master':'Close Master'};
 saveBtn.onclick=()=>{const next={version:MASTER_VERSION};body.querySelectorAll('.master-field').forEach(x=>next[x.dataset.key]=x.value.trim());save(MASTER_KEY,next);window.dispatchEvent(new CustomEvent('ld-master-updated',{detail:next}));toast('Master v4 saved')};
 reset.onclick=()=>{body.querySelectorAll('.master-field').forEach(x=>x.value=defaults[x.dataset.key]);save(MASTER_KEY,defaults);toast('Locked defaults restored')};
}
function buildFactPack(){
 const master=document.getElementById('masterSystemCard');if(!master||document.getElementById('factPackCard'))return;
 const card=el('section','card fact-pack-card');card.id='factPackCard';
 const head=el('div','master-head');const hw=el('div');hw.append(el('span','audit-label','HISTORICAL FACT PACK'),el('strong','','Episode truth lock'),el('p','master-sub','Fill verified facts before final generation. This stays local and never spends API credits.'));const t=el('button','ghost small','Open Fact Pack');head.append(hw,t);card.append(head);
 const body=el('div','master-body hidden');const saved=load(FACT_KEY,{topic:'',date:'',location:'',eventFacts:'',periodLock:'',forbidden:'',sources:''});
 const fields=[['date','DATE / TIME'],['location','LOCATION'],['eventFacts','KEY VERIFIED EVENT FACTS'],['periodLock','PERIOD VISUAL LOCK — architecture, clothing, transport, utilities, terrain'],['forbidden','DO NOT SHOW — anachronisms / unsupported hazards'],['sources','SOURCE NOTES / REFERENCES']];
 fields.forEach(([k,l])=>{const b=el('div','field-block');b.append(el('label','',l));const ta=el('textarea','fact-field');ta.dataset.key=k;ta.rows=k==='eventFacts'||k==='periodLock'?4:2;ta.value=saved[k]||'';b.append(ta);body.append(b)});
 const saveBtn=el('button','primary','Save Fact Pack');body.append(saveBtn);card.append(body);master.after(card);
 t.onclick=()=>{body.classList.toggle('hidden');t.textContent=body.classList.contains('hidden')?'Open Fact Pack':'Close Fact Pack'};
 saveBtn.onclick=()=>{const out={topic:currentTopic(),updatedAt:new Date().toISOString()};body.querySelectorAll('.fact-field').forEach(x=>out[x.dataset.key]=x.value.trim());save(FACT_KEY,out);toast('Fact Pack saved')};
}
function addChecks(){
 document.querySelectorAll('.stage-card').forEach(card=>{if(card.querySelector('.v4-checks'))return;const stage=card.dataset.stage;const box=el('div','v4-checks');const btn=el('button','ghost small','Validate prompt');const result=el('span','validation-result','Not checked');box.append(btn,result);const target=card.querySelector('.stage-package-actions')||card.querySelector('.stage-footer');target?.prepend(box);btn.onclick=()=>validate(card,result,stage)});
}
function validate(card,result,stage){
 const img=card.querySelector('.image-prompt')?.value||'';const flow=card.querySelector('.flow-prompt')?.value||'';const issues=[];
 if(!img.trim())issues.push('missing image prompt');
 if(stage==='HOOK'&&!/(surviv|struggl|escap|danger|catastroph|disaster)/i.test(img))issues.push('HOOK survival action weak');
 if(stage!=='ENDING'&&stage!=='THUMBNAIL'){
   if(!/10 seconds|10-second|exactly 10/i.test(flow))issues.push('10s animation lock missing');
   if(!/one continuous|continuous cinematic/i.test(flow))issues.push('continuous-shot lock missing');
 }
 if(/child|children|kid|boy|girl/i.test(img))issues.push('minor wording detected');
 if(/photoreal|live action|3D CGI/i.test(img)&&!/no photoreal|no live action|no 3D CGI/i.test(img))issues.push('style drift risk');
 result.textContent=issues.length?`Check: ${issues.join(' · ')}`:'PASS — master checks clear';result.classList.toggle('pass',!issues.length);result.classList.toggle('warn',!!issues.length);
}
function dashboard(){
 const cards=[...document.querySelectorAll('.stage-card')];if(!cards.length)return;let bar=document.getElementById('v4Dashboard');if(!bar){bar=el('section','card v4-dashboard');bar.id='v4Dashboard';document.getElementById('masterSystemCard')?.before(bar)}
 const ready=cards.filter(c=>{const s=c.querySelector('.stage-status')?.textContent||'';return /Ready|Complete/i.test(s)}).length;const done=cards.filter(c=>c.querySelector('.done-toggle')?.checked).length;bar.innerHTML=`<span class="audit-label">EPISODE DASHBOARD</span><div class="dash-grid"><div><b>${cards.length}</b><small>Total stages</small></div><div><b>${ready}</b><small>Content ready</small></div><div><b>${done}</b><small>Done</small></div><div><b>${cards.length-done}</b><small>Remaining</small></div></div>`;
}
function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function refresh(){buildUI();buildFactPack();addChecks();dashboard()}
window.LDMasterV4={defaults,refresh,version:MASTER_VERSION};
window.addEventListener('load',()=>{refresh();setTimeout(refresh,400)});document.addEventListener('click',()=>setTimeout(refresh,50));
})();
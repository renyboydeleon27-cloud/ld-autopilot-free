/* LD AUTO v3.38.0 — One-click Final Package export. */
(()=>{'use strict';

const stages=document.getElementById('stages');
if(!stages)return;

function clean(v){return String(v||'').trim();}
function topic(){
  const title=clean(document.getElementById('projectTitle')?.textContent);
  if(title&&title!=='No production yet')return title;
  return clean(document.getElementById('topic')?.value);
}
function format(){return document.getElementById('format')?.value||'shorts';}
function card(stage){return stages.querySelector('.stage-card[data-stage="'+stage+'"]');}
function safeName(value){
  return clean(value||'living-disaster').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'living-disaster';
}
function stageOrder(){
  return ['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING','THUMBNAIL'];
}
function selectedTitle(){
  return clean(document.getElementById('selectedYoutubeTitle')?.value||window.ldYoutubeTitle||topic());
}
function defaultDescription(){
  const t=topic();
  if(!t)return '';
  return 'A Living Disaster Book historical disaster short about '+t+'.\n\nThank you for watching. Like, share, and subscribe for more stories from the Living Disaster Book.';
}
function meta(){
  if(!window.ldFinalPackageMeta||typeof window.ldFinalPackageMeta!=='object'||Array.isArray(window.ldFinalPackageMeta)){
    window.ldFinalPackageMeta={description:'',musicCredit:'',uploadNotes:''};
  }
  return window.ldFinalPackageMeta;
}
function saveMeta(){
  const root=document.getElementById('ldFinalPackage');
  const m=meta();
  if(root){
    m.description=clean(root.querySelector('.final-description')?.value);
    m.musicCredit=clean(root.querySelector('.final-music')?.value);
    m.uploadNotes=clean(root.querySelector('.final-notes')?.value);
  }
  window.ldFinalPackageMeta=m;
  try{
    const state=window.LDCore?.collectState?.();
    if(state)localStorage.setItem('ld-autopilot-free-v1',JSON.stringify(state));
  }catch(e){}
  const field=stages.querySelector('textarea');
  if(field)field.dispatchEvent(new Event('input',{bubbles:true}));
}
function stageData(stage){
  const c=card(stage);
  if(!c)return null;
  const mode=c.dataset.videoMode||'image';
  const narration=clean(c.querySelector('.narration')?.value);
  const imagePrompt=clean(c.querySelector('.image-prompt')?.value);
  const flowPrompt=clean(c.querySelector('.flow-prompt')?.value);
  const textPrompt=clean(c.querySelector('.text-video-prompt')?.value||c.dataset.textVideoPrompt);
  const scene=clean(c.querySelector('.video-scene')?.value||c.dataset.videoScene);
  const approved=window.ldApprovedMemory?.stages?.[stage]?.latest||null;
  return {
    stage,
    done:!!c.querySelector('.done-toggle')?.checked,
    videoMode:mode,
    narration,
    scene,
    imagePrompt,
    videoPrompt:mode==='text'?textPrompt:flowPrompt,
    approvedAt:approved?.approvedAt||'',
    auditSignature:approved?.auditSignature||''
  };
}
function gate(){
  const result=window.LDProductionDNA?.evaluateFinalProduction?.();
  return result&&typeof result==='object'?result:{ok:false,failed:[{detail:'Final Production Check is not available.'}]};
}
function dnaSavedForCurrent(){
  const p=window.LDProductionDNA?.activeProfile?.();
  return !!p&&clean(p.sourceTopic)===topic();
}
function buildObject(){
  const m=meta();
  const state=window.LDCore?.collectState?.()||{};
  const dna=window.LDProductionDNA?.activeProfile?.()||null;
  const progression=window.LDDisasterProgression?.summary?.(topic())||null;
  const g=gate();
  return {
    packageVersion:'1.0',
    generatedAt:new Date().toISOString(),
    topic:topic(),
    format:format(),
    youtube:{
      title:selectedTitle(),
      description:m.description||defaultDescription(),
      musicCredit:m.musicCredit||'',
      uploadNotes:m.uploadNotes||''
    },
    continuity:state.videoContinuity||window.ldVideoContinuity||{},
    projectLocks:state.projectLocks||window.ldProjectLocks||null,
    finalProductionCheck:{
      verified:!!g.ok,
      checks:Array.isArray(g.checks)?g.checks.map(x=>({label:x.label,ok:!!x.ok,detail:x.detail||''})):[]
    },
    productionDna:dna?{
      sourceTopic:dna.sourceTopic||'',
      sourceFamily:dna.sourceFamily||'',
      createdAt:dna.createdAt||'',
      approvedStages:dna.approvedStages||0
    }:null,
    progression:progression?{
      version:progression.version||'',
      family:progression.family||'',
      familyLabel:progression.familyLabel||''
    }:null,
    apiUsage:state.apiUsage||window.ldApiUsage||null,
    stages:stageOrder().map(stageData).filter(Boolean)
  };
}
function stageText(s){
  const lines=['===== '+s.stage+' ====='];
  if(s.narration)lines.push('NARRATION:\n'+s.narration);
  if(s.scene)lines.push('SCENE:\n'+s.scene);
  if(s.imagePrompt)lines.push('IMAGE PROMPT:\n'+s.imagePrompt);
  if(s.videoPrompt)lines.push((s.videoMode==='text'?'TEXT-TO-VIDEO PROMPT':'IMAGE-TO-VIDEO PROMPT')+':\n'+s.videoPrompt);
  if(s.approvedAt)lines.push('APPROVED: '+s.approvedAt);
  return lines.join('\n\n');
}
function buildText(){
  const p=buildObject();
  const title='LIVING DISASTER BOOK — FINAL PRODUCTION PACKAGE';
  const parts=[
    title,
    'TOPIC: '+p.topic,
    'FORMAT: '+p.format,
    'YOUTUBE TITLE:\n'+(p.youtube.title||'[not set]'),
    'DESCRIPTION:\n'+(p.youtube.description||'[not set]'),
    'MUSIC CREDIT:\n'+(p.youtube.musicCredit||'[not set]'),
    'UPLOAD NOTES:\n'+(p.youtube.uploadNotes||'[none]'),
    'PROJECT LOCKS:\n'+(p.projectLocks?JSON.stringify(p.projectLocks,null,2):'[not set]'),
    'CONTINUITY:\n'+JSON.stringify(p.continuity||{},null,2),
    'PRODUCTION DNA:\n'+(p.productionDna?JSON.stringify(p.productionDna,null,2):'[not saved]'),
    'API USAGE:\n'+(p.apiUsage?JSON.stringify(p.apiUsage,null,2):'[none]'),
    ...p.stages.map(stageText)
  ];
  return parts.join('\n\n----------------------------------------\n\n');
}
async function copyAll(){
  const g=gate();
  if(!g.ok)return setStatus('Final Production Check must pass first.','warn');
  if(!dnaSavedForCurrent())return setStatus('Save Finished Production DNA first.','warn');
  try{
    await navigator.clipboard.writeText(buildText());
    setStatus('Final package copied.','pass');
  }catch(e){
    setStatus('Copy failed. Use Download TXT instead.','warn');
  }
}
function download(content,name,type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}
function downloadTxt(){
  const g=gate();
  if(!g.ok)return setStatus('Final Production Check must pass first.','warn');
  if(!dnaSavedForCurrent())return setStatus('Save Finished Production DNA first.','warn');
  download(buildText(),safeName(topic())+'-final-package.txt','text/plain;charset=utf-8');
  setStatus('Final TXT package downloaded.','pass');
}
function downloadJson(){
  const g=gate();
  if(!g.ok)return setStatus('Final Production Check must pass first.','warn');
  if(!dnaSavedForCurrent())return setStatus('Save Finished Production DNA first.','warn');
  download(JSON.stringify(buildObject(),null,2),safeName(topic())+'-final-package.json','application/json;charset=utf-8');
  setStatus('Final JSON package downloaded.','pass');
}
function setStatus(text,state=''){
  const el=document.querySelector('#ldFinalPackage .final-package-status');
  if(el){el.textContent=text;el.dataset.state=state;}
}
function readyState(){
  const g=gate();
  return {verified:!!g.ok,dnaSaved:dnaSavedForCurrent(),ready:!!g.ok&&dnaSavedForCurrent(),gate:g};
}
function refresh(){
  const root=document.getElementById('ldFinalPackage');
  if(!root)return;
  const r=readyState();
  const badge=root.querySelector('.final-package-badge');
  const buttons=root.querySelectorAll('.final-package-action');
  buttons.forEach(b=>b.disabled=!r.ready);
  if(badge){
    if(r.ready){badge.textContent='✅ READY TO EXPORT';badge.dataset.state='pass';}
    else if(!r.verified){badge.textContent='⚠️ FINAL CHECK NOT VERIFIED';badge.dataset.state='warn';}
    else{badge.textContent='🧬 SAVE PRODUCTION DNA FIRST';badge.dataset.state='warn';}
  }
}
function place(root){
  const dna=document.getElementById('productionDnaEngine');
  if(dna){dna.after(root);return;}
  document.querySelector('main')?.appendChild(root);
}
function mount(){
  let root=document.getElementById('ldFinalPackage');
  if(!root){
    root=document.createElement('section');
    root.id='ldFinalPackage';
    root.className='card';
  }
  place(root);
  const m=meta();
  root.innerHTML=`
    <div class="final-package-head">
      <div>
        <span class="audit-label">ONE-CLICK FINAL PACKAGE</span>
        <strong>Archive-ready production export</strong>
      </div>
      <strong class="final-package-badge">Checking…</strong>
    </div>
    <p class="final-package-help">Available after Final Production Check passes and Finished Production DNA is saved. Includes final title, description, music credit, prompts, narration, locks, audit summary, DNA summary and API usage.</p>
    <label>Description<textarea class="final-description" rows="4" placeholder="YouTube description"></textarea></label>
    <label>Music credit<textarea class="final-music" rows="2" placeholder="Example: Music: War — Astronic (from Audiio)"></textarea></label>
    <label>Upload notes<textarea class="final-notes" rows="3" placeholder="Optional upload notes, hashtags, scheduling notes, etc."></textarea></label>
    <div class="final-package-actions">
      <button type="button" class="primary final-package-action final-copy">📋 Copy Final Package</button>
      <button type="button" class="ghost final-package-action final-txt">⬇ Download TXT</button>
      <button type="button" class="ghost final-package-action final-json">⬇ Download JSON</button>
    </div>
    <p class="final-package-status"></p>
  `;
  root.querySelector('.final-description').value=m.description||defaultDescription();
  root.querySelector('.final-music').value=m.musicCredit||'';
  root.querySelector('.final-notes').value=m.uploadNotes||'';
  root.querySelectorAll('textarea').forEach(x=>x.addEventListener('input',()=>{saveMeta();}));
  root.querySelector('.final-copy').addEventListener('click',copyAll);
  root.querySelector('.final-txt').addEventListener('click',downloadTxt);
  root.querySelector('.final-json').addEventListener('click',downloadJson);
  refresh();

  if(!document.getElementById('ldFinalPackageStyles')){
    const style=document.createElement('style');
    style.id='ldFinalPackageStyles';
    style.textContent=`
      #ldFinalPackage{padding:14px;margin:14px 0;border:1px solid #476582}
      .final-package-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}
      .final-package-head strong{display:block}
      .final-package-badge{font-size:12px}
      .final-package-badge[data-state="pass"]{color:#65c28d}
      .final-package-badge[data-state="warn"]{color:#f0b35f}
      .final-package-help{font-size:12px;opacity:.8}
      #ldFinalPackage label{display:block;margin:10px 0;font-size:12px;font-weight:700}
      #ldFinalPackage textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px}
      .final-package-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .final-package-actions button{flex:1;min-width:150px}
      .final-package-action:disabled{opacity:.45;cursor:not-allowed}
      .final-package-status{font-size:12px;margin:10px 0 0}
      .final-package-status[data-state="pass"]{color:#65c28d}
      .final-package-status[data-state="warn"]{color:#f0b35f}
    `;
    document.head.appendChild(style);
  }
}
function delayedMount(){setTimeout(()=>{mount();refresh();},120);}

window.LDFinalPackage=Object.freeze({buildObject,buildText,refresh,readyState,downloadTxt,downloadJson});

window.addEventListener('ld:production-built',delayedMount);
window.addEventListener('ld:production-dna-saved',()=>setTimeout(refresh,60));
window.addEventListener('ld:approved-memory-saved',()=>setTimeout(refresh,60));
window.addEventListener('ld:project-locks-changed',()=>setTimeout(refresh,60));
document.addEventListener('change',e=>{if(e.target.closest?.('#stages,#ldFinalPackage'))setTimeout(refresh,60);});
document.addEventListener('input',e=>{if(e.target.closest?.('#stages'))setTimeout(refresh,60);});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',delayedMount);else delayedMount();
})();
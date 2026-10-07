/* NER Studio Core 4 Final Audit v4.0.0 — deterministic/local, zero API calls. */
(function(){'use strict';
if(window.NERFinalAudit4)return;
const core=window.NERCore4;if(!core)return;
const VERSION='4.0.0';
const REQUIRED=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING','THUMBNAIL'];
function card(stage){return document.querySelector('.stage-card[data-stage="'+stage+'"]');}
function done(c){return c?.querySelector('.done-toggle')?.checked===true;}
function visual(){return window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle||'';}
function color(){return window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode||'';}
function run(options={}){
 const issues=[],warnings=[],rows=[];
 for(const stage of REQUIRED){
  const c=card(stage);if(!c){issues.push(stage+': stage card missing.');continue;}
  if(!done(c))issues.push(stage+': not approved/Done.');
  if(/^P\d+$/.test(stage)){
   const p=core.currentPrompt(c),v=core.validateCard(c);
   if(!p)issues.push(stage+': final Text-to-Video prompt missing.');
   if(/No approved P\d+ handoff is available/i.test(p))issues.push(stage+': stale missing-handoff text remains.');
   (v.issues||[]).forEach(x=>issues.push(stage+': '+x));
   (v.warnings||[]).forEach(x=>warnings.push(stage+': '+x));
   if(done(c)&&p&&!core.frozen(c))core.freeze(c,p,c.dataset.smartReadySignature||'approved');
   if(visual()==='anime'&&color()==='bw'&&p&&!(/black-and-white|grayscale/i.test(p)&&/2D/i.test(p)))warnings.push(stage+': monochrome anime lock is not explicit in the final prompt text.');
   rows.push({stage,done:done(c),promptHash:p?core.hash(p):'',fingerprint:core.fingerprint(c),local:v.ok});
  }else rows.push({stage,done:done(c)});
 }
 const story=window.NERSourceStory4?.validate?.();
 if(story){story.issues.forEach(x=>issues.push('Story map: '+x));story.warnings.forEach(x=>warnings.push('Story map: '+x));}
 if(window.LDProjectLocks?.isLocked?.()===false)issues.push('Project Locks are not locked.');
 const result={version:VERSION,ok:issues.length===0,topic:core.topic(),required:REQUIRED.length,verified:REQUIRED.length-REQUIRED.filter(s=>!done(card(s))).length,issues:[...new Set(issues)],warnings:[...new Set(warnings)],rows,story,generatedAt:new Date().toISOString(),apiCalls:0};
 if(options.render!==false)render(result);
 window.nerFinalAudit4=result;window.dispatchEvent(new CustomEvent('ner:final-audit',{detail:result}));return result;
}
function render(r){
 const status=document.getElementById('auditStatus'),pill=document.getElementById('requiredStatus'),remain=document.getElementById('remainingStages'),banner=document.getElementById('completeBanner');
 if(status)status.textContent=r.ok?'Core 4 audit passed':'Core 4 audit needs review';
 if(pill)pill.textContent=r.verified+'/'+r.required+' verified';
 if(remain)remain.textContent=r.ok?'NER Core 4: 0 blockers · structured continuity, source-story map and final prompt hashes verified locally · API calls 0.':r.issues.slice(0,4).join(' · ')+(r.issues.length>4?' · +'+(r.issues.length-4)+' more':'');
 if(banner&&r.ok){banner.classList.remove('hidden');const strong=banner.querySelector('strong'),span=banner.querySelector('span');if(strong)strong.textContent='Production complete — Core 4 audit passed';if(span)span.textContent='All required stages are approved and local continuity/prompt integrity checks passed.';}
}
function allDone(){return REQUIRED.every(s=>done(card(s)));}
document.addEventListener('click',e=>{
 if(e.target.closest?.('#auditNextBtn,#nextIncompleteBtn')&&allDone()){setTimeout(()=>run({render:true}),0);}
},true);
window.addEventListener('load',()=>setTimeout(()=>{if(allDone())run({render:true});},700));
window.addEventListener('ld:approved-memory-saved',()=>setTimeout(()=>{if(allDone())run({render:true});},100));
window.NERFinalAudit4=Object.freeze({version:VERSION,run,allDone});
})();
/* Optional local review form; Smart Continue and the existing card layout remain intact. */
(function(){'use strict';
const C=window.NERCore5,R=window.NERCore5Runtime;
function attach(card){
 if(!R.manages(card)||R.protectedPanel(card)||card.querySelector('.core5-review'))return;
 if(card.dataset.core5Spec){try{const label=card.querySelector('.scene-role');if(label)label.textContent=R.spec(card).role;}catch{}}
 const details=document.createElement('details');details.className='core5-review';
 const summary=document.createElement('summary');summary.textContent='Review Core 5 scene';details.append(summary);
 const note=document.createElement('p');note.textContent='Review the staging against your narration and historical sources. Applying this scene preserves the previous draft and clears its audit readiness. This local review uses no AI credits.';details.append(note);
 const old=document.createElement('pre');old.style.whiteSpace='pre-wrap';details.append(old);
 const controls={};
 function field(key,label,options){const wrap=document.createElement('label');wrap.textContent=label;const el=document.createElement(options?'select':'textarea');el.dataset.core5Field=key;if(options)for(const value of options){const opt=document.createElement('option');opt.value=value;opt.textContent=value;el.append(opt);}else el.rows=2;wrap.append(el);details.append(wrap);controls[key]=el;}
 field('region','Historical event location — city / region');field('eventYear','Historical event year');field('setting','Scene setting');field('cast','Cast — one id | description per line');field('actor','Acting cast ID');field('action','One primary action');field('movement','Camera movement',['locked','slow-push-in','slow-pull-back','lateral-track']);field('framing','Camera framing');field('relation','Scene time relative to the historical event',['event','before','after','later']);field('sceneYear','Scene year — leave blank when unspecified');field('period','Scene period');field('audio','Scene sound');
 const apply=document.createElement('button');apply.type='button';apply.className='core5-apply-scene';apply.textContent='Apply reviewed scene';details.append(apply);
 const retry=document.createElement('button');retry.type='button';retry.textContent='Allow one retry of incomplete audit';retry.hidden=true;details.append(retry);
 const status=document.createElement('p');status.setAttribute('role','status');details.append(status);
 let base;
 function refresh(){try{base=C.clone(R.spec(card));if(base.compilerVersion!==C.VERSION||base.role!==C.role(base.narration,base.stage)||base.narration!==card.querySelector('.narration')?.value||!R.reviewIdentity(card,base))base=C.clone(R.reviewSpec(card));old.textContent='Saved scene for comparison:\n'+(card.dataset.core5LegacyScene||card.dataset.videoScene||'(none)');const vals={region:base.location.region,eventYear:base.eventYear||'',setting:base.location.setting,cast:base.cast.map(x=>x.id+' | '+x.description).join('\n'),actor:base.action.actor,action:base.action.description,movement:base.camera.movement,framing:base.camera.framing,relation:base.chronology.relation,sceneYear:base.chronology.sceneYear??'',period:base.chronology.period,audio:base.audio};for(const [k,v] of Object.entries(vals))controls[k].value=v;status.textContent='';const record=card.dataset.core5Record?JSON.parse(card.dataset.core5Record):null;retry.hidden=!(record?.status==='REVIEW_REQUIRED'&&record.result?.ok===false);}catch(e){status.textContent=e.message;}}
 // Populate synchronously on open; a delayed toggle event must not erase typing.
 summary.addEventListener('click',()=>{if(!details.open)refresh();});
 refresh();
 retry.addEventListener('click',async()=>{try{await R.allowRetry(card);retry.hidden=true;status.textContent='One new audit is allowed on your next Smart Continue. It may use API credits.';}catch(e){status.textContent=e.message;}});
 apply.addEventListener('click',()=>{try{if(R.protectedPanel(card))throw Error('Approved panels are immutable.');const s=C.clone(base),v=k=>controls[k].value.trim();s.location.region=v('region');s.eventYear=Number(v('eventYear'));s.location.setting=v('setting');s.cast=v('cast').split('\n').map(line=>{const at=line.indexOf('|');if(at<1)throw Error('Each cast line needs id | description.');return {id:line.slice(0,at).trim(),description:line.slice(at+1).trim()};});s.action={actor:v('actor'),description:v('action')};s.camera={movement:v('movement'),framing:v('framing')};s.chronology={...s.chronology,relation:v('relation'),sceneYear:v('sceneYear')?Number(v('sceneYear')):null,period:v('period')};s.audio=v('audio');R.applyReview(card,s);R.build(card);window.LDCore?.saveCurrent?.();status.textContent='Reviewed scene saved. Smart Continue can now run local preflight and audit.';}catch(e){status.textContent=e.message;}});
 (card.querySelector('.stage-body')||card).append(details);
}
function attachAll(){
 document.querySelectorAll('.stage-card').forEach(attach);
 const host=document.getElementById('chapterVideoContext');if(!host||host.querySelector('.core5-plan-episode')||!Array.from(document.querySelectorAll('.stage-card')).some(c=>R.manages(c)&&!R.protectedPanel(c)))return;
 const button=document.createElement('button');button.type='button';button.className='core5-plan-episode';button.textContent='Prepare episode scenes · FREE';
 const note=document.createElement('p');note.textContent='Prepare missing or invalid scenes from narration in one step. Valid reviewed scenes and approved panels are preserved. Previous scene drafts are kept for comparison. No AI request is made.';
 const status=document.createElement('p');status.className='core5-episode-status';status.setAttribute('role','status');
 button.addEventListener('click',()=>{try{const count=R.prepareEpisode();status.textContent=count+' scenes prepared locally. Review the scenes, then use Smart Continue.';}catch(e){status.textContent=e.message;}});
 host.prepend(button,note,status);
}
window.addEventListener('ld:production-built',()=>queueMicrotask(attachAll));
document.addEventListener('DOMContentLoaded',attachAll);
window.addEventListener('ld:video-mode-changed',attachAll);
window.addEventListener('ld:visual-mode-hard-reset',attachAll);
})();

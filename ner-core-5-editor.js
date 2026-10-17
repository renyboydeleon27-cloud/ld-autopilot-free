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
 const refine=document.createElement('button');refine.type='button';refine.className='core5-refine-action';refine.textContent='Refine action details · FREE';details.append(refine);
 const refineNote=document.createElement('p');refineNote.textContent='For supported scenes, add explicit starting state, prop movement and final pose. Saves the old draft. A changed prompt needs a new audit on Smart Continue; approved panels stay locked.';details.append(refineNote);
 const diagnose=document.createElement('button');diagnose.type='button';diagnose.className='core5-check-audit';diagnose.textContent='Check audit status · FREE';details.append(diagnose);
 const nextAction=document.createElement('div');nextAction.className='core5-next-action';nextAction.setAttribute('role','status');nextAction.style.margin='12px 0';nextAction.style.padding='14px 12px';nextAction.style.borderRadius='10px';nextAction.style.fontSize='16px';nextAction.style.fontWeight='800';nextAction.style.lineHeight='1.35';nextAction.style.textAlign='center';details.append(nextAction);
 function showNextAction(kind,stage){
  const s=String(stage||card.dataset.stage||'THIS STAGE').toUpperCase();
  const messages={
   idle:'CHECK AUDIT STATUS · FREE TO SEE NEXT ACTION',
   checking:'CHECKING STATUS · FREE…',
   ready:'✅ READY FOR SMART CONTINUE',
   archiveStale:'⚠️ ARCHIVE OLD '+s+' JOURNAL · FREE FIRST',
   archiveIncomplete:'⚠️ ARCHIVE INCOMPLETE '+s+' JOURNAL FIRST',
   recover:'♻️ RECOVER SAVED AUDIT · FREE FIRST',
   busy:'⏳ AUDIT IN PROGRESS — DO NOT TAP SMART CONTINUE',
   conflict:'⛔ STORAGE CONFLICT — DO NOT SMART CONTINUE',
   failed:'⛔ STATUS CHECK FAILED — DO NOT SMART CONTINUE',
   blocked:'⛔ FIX / REVIEW FIRST — DO NOT SMART CONTINUE',
   recovered:'✅ AUDIT RECOVERED — REVIEW RESULT BEFORE CONTINUING'
  };
  const palette={ready:['#15351f','#b9f6ca'],recovered:['#15351f','#b9f6ca'],archiveStale:['#3a2f0c','#ffe082'],archiveIncomplete:['#3a2f0c','#ffe082'],recover:['#113346','#b3e5fc'],busy:['#3a2f0c','#ffe082'],conflict:['#421b1b','#ffcdd2'],failed:['#421b1b','#ffcdd2'],blocked:['#421b1b','#ffcdd2'],idle:['#1b2330','#dce8ff'],checking:['#1b2330','#dce8ff']};
  const [bg,fg]=palette[kind]||palette.blocked;nextAction.textContent=messages[kind]||messages.blocked;nextAction.dataset.state=kind;nextAction.style.background=bg;nextAction.style.color=fg;nextAction.style.border='2px solid '+fg;
 }
 function nextActionFor(d,j){
  if(d?.status==='JOURNAL_INSPECTION_FAILED')return 'failed';
  if(j?.busy)return 'busy';
  if(j?.conflict)return 'conflict';
  if(j?.recoverable)return 'recover';
  if(j?.found&&j.identityMatch===false&&!j.conflict&&!j.busy&&j.status==='DONE')return 'archiveStale';
  if(j?.found&&j.identityMatch&&!j.conflict&&!j.busy&&['STARTED','UNCERTAIN'].includes(j.status))return 'archiveIncomplete';
  if(['LOCAL_PREFLIGHT_BLOCKED','AUDIT_REVIEW_REQUIRED','INVALID_SAVED_AUDIT','JOURNAL_REVIEW_REQUIRED'].includes(d?.status))return 'blocked';
  if(j?.found)return 'blocked';
  if(d?.issues?.length&&!['AUDIT_READY','NOT_AUDITED'].includes(d.status))return 'blocked';
  return 'ready';
 }
 showNextAction('idle');
 const diagnosis=document.createElement('pre');diagnosis.className='core5-audit-diagnosis';diagnosis.style.whiteSpace='pre-wrap';diagnosis.setAttribute('role','status');details.append(diagnosis);
 let reviewedJournal=null;
 const archive=document.createElement('button');archive.type='button';archive.className='core5-archive-journal';archive.textContent='Archive incomplete journal · allow one new audit';archive.hidden=true;details.append(archive);
 archive.addEventListener('click',async()=>{if(!window.confirm('Archive this incomplete audit journal? Its saved copy will be preserved. The earlier request may already have cost credits. This action sends no audit; your next Smart Continue may send one new paid audit.'))return;archive.disabled=true;try{diagnosis.textContent=await R.archiveIncompleteJournal(card,reviewedJournal);archive.hidden=true;retry.hidden=true;showNextAction('ready',reviewedJournal?.stage);}catch(e){diagnosis.textContent=e.message;showNextAction('blocked');}finally{archive.disabled=false;}});
 const archiveStale=document.createElement('button');archiveStale.type='button';archiveStale.className='core5-archive-stale-journal';archiveStale.textContent='Archive old mismatched journal · FREE';archiveStale.hidden=true;details.append(archiveStale);
 archiveStale.addEventListener('click',async()=>{
  const j=reviewedJournal,stage=j?.stage||card.dataset.stage||'current stage';
  if(!j?.found||j.identityMatch!==false||j.conflict||j.busy||j.status!=='DONE'){diagnosis.textContent='Run Check audit status · FREE again. The stale journal is no longer eligible for this reset.';archiveStale.hidden=true;showNextAction('blocked',stage);return;}
  if(!window.confirm('Archive only the old mismatched '+stage+' DONE audit journal? The saved archive will be preserved. This FREE action sends no audit and does not clear site storage or other stage approvals. Your next Smart Continue may send one new paid audit.'))return;
  archiveStale.disabled=true;
  try{
   const p=R.payload(card),project=R.scope(),signature=R.signature(card);
   const valid=()=>R.scope()===project&&R.signature(card)===signature&&card.isConnected&&!R.protectedPanel(card);
   const archived=await window.NERCore5AuditCoordinator.archiveMismatchedDone(project,p,j.reviewToken,valid);
   if(!valid())throw Error('Old journal was archived, but the panel changed. Reopen this project and inspect the stage before auditing. No audit was sent.');
   // A failed Smart Continue may have left only a local REVIEW_REQUIRED marker for
   // this current payload. Clear it through the existing guarded retry path now
   // that the mismatched stage journal is gone; never touch approved stage data.
   let local=null;try{local=card.dataset.core5Record?JSON.parse(card.dataset.core5Record):null;}catch{}
   if(local?.status==='REVIEW_REQUIRED'&&local.result?.ok===false)await R.allowRetry(card);
   delete card.dataset.smartReady;delete card.dataset.smartReadySignature;
   if(window.LDCore?.saveCurrent?.()===false)throw Error('Old journal archived, but project save failed. Export a backup before continuing. No audit was sent.');
   await window.NERProjectStorage?.flush();
   reviewedJournal=null;archiveStale.hidden=true;archive.hidden=true;recover.hidden=true;retry.hidden=true;
   diagnosis.textContent='Old mismatched '+stage+' journal archived safely.\nArchive retained: '+archived+'\nNo audit request was sent.\nOther stages and approvals were not reset.\n'+stage+' is ready for one user-triggered fresh audit on your next Smart Continue.';showNextAction('ready',stage);
  }catch(e){diagnosis.textContent=e.message;showNextAction('blocked',stage);}
  finally{archiveStale.disabled=false;}
 });
 const recover=document.createElement('button');recover.type='button';recover.className='core5-recover-journal';recover.textContent='Recover saved audit · FREE';recover.hidden=true;details.append(recover);
 diagnose.addEventListener('click',async()=>{
  diagnose.disabled=true;recover.hidden=true;archive.hidden=true;archiveStale.hidden=true;diagnosis.textContent='Inspecting local audit journal…';showNextAction('checking');
  try{
   const d=await R.journalDiagnostic(card),j=d.journal,yn=x=>x===null?'UNKNOWN':x?'YES':'NO';
   diagnosis.textContent=['Local audit status: '+d.status,'Saved panel record: '+d.journalStatus,
    ...(j?['Journal found: '+yn(j.found),'Storage source: '+j.source,'Stage: '+j.stage,'Status: '+j.status,'Payload identity match: '+yn(j.identityMatch),'Recoverable result: '+yn(j.recoverable),'Storage conflict: '+yn(j.conflict)]:[]),
    d.issues.length?'Reasons:\n'+d.issues.map(x=>'• '+x).join('\n'):'No local blockers found.',
    'No audit request or retry was sent.'].join('\n');
   reviewedJournal=j;archive.hidden=!(j?.identityMatch&&!j.conflict&&!j.busy&&['STARTED','UNCERTAIN'].includes(j.status));
   archiveStale.hidden=!(j?.found&&j.identityMatch===false&&!j.conflict&&!j.busy&&j.status==='DONE');
   if(!archiveStale.hidden)archiveStale.textContent='Archive old '+j.stage+' journal · FREE';
   recover.hidden=!j?.recoverable;const record=(()=>{try{return JSON.parse(card.dataset.core5Record||'null');}catch{return null;}})();
   retry.hidden=!!j?.found||!!j?.busy||d.status==='JOURNAL_INSPECTION_FAILED'||!(record?.status==='REVIEW_REQUIRED'&&record?.result?.ok===false);
   showNextAction(nextActionFor(d,j),j?.stage||d.panel);
  }catch(e){diagnosis.textContent='Diagnostic failed locally: '+e.message;showNextAction('failed');}finally{diagnose.disabled=false;}
 });
 recover.addEventListener('click',async()=>{recover.disabled=true;try{diagnosis.textContent=await R.recoverJournal(card);recover.hidden=true;showNextAction('recovered',reviewedJournal?.stage);}catch(e){diagnosis.textContent=e.message;showNextAction('blocked');}finally{recover.disabled=false;}});

 const retry=document.createElement('button');retry.type='button';retry.textContent='Allow one retry of incomplete audit';retry.hidden=true;details.append(retry);
 const status=document.createElement('p');status.setAttribute('role','status');details.append(status);
 let base;
 function refresh(){try{base=C.clone(R.spec(card));if(base.compilerVersion!==C.VERSION||base.role!==C.role(base.narration,base.stage)||base.narration!==card.querySelector('.narration')?.value||!R.reviewIdentity(card,base)||C.misroutedEvacuation?.(base))base=C.clone(R.reviewSpec(card));old.textContent='Saved scene for comparison:\n'+(card.dataset.core5LegacyScene||card.dataset.videoScene||'(none)');if(base.choreography)old.textContent+='\n\nCurrent action details:\n'+JSON.stringify(base.choreography,null,2);const vals={region:base.location.region,eventYear:base.eventYear||'',setting:base.location.setting,cast:base.cast.map(x=>x.id+' | '+x.description).join('\n'),actor:base.action.actor,action:base.action.description,movement:base.camera.movement,framing:base.camera.framing,relation:base.chronology.relation,sceneYear:base.chronology.sceneYear??'',period:base.chronology.period,audio:base.audio};for(const [k,v] of Object.entries(vals))controls[k].value=v;status.textContent='';const record=card.dataset.core5Record?JSON.parse(card.dataset.core5Record):null;retry.hidden=!(record?.status==='REVIEW_REQUIRED'&&record.result?.ok===false);}catch(e){status.textContent=e.message;}}
 // Populate synchronously on open; a delayed toggle event must not erase typing.
 summary.addEventListener('click',()=>{if(!details.open)refresh();});
 refresh();
 refine.addEventListener('click',()=>{try{const changed=R.refineScene(card);refresh();status.textContent=changed?'Action details refined locally. Review this revised scene, then Smart Continue for a new audit. No AI call was made.':'No supported refinement needed. Existing scene and audit are unchanged.';if(changed)showNextAction('idle');}catch(e){status.textContent=e.message;showNextAction('blocked');}});
 retry.addEventListener('click',async()=>{try{await R.allowRetry(card);retry.hidden=true;status.textContent='One new audit is allowed on your next Smart Continue. It may use API credits.';showNextAction('ready');}catch(e){status.textContent=e.message;showNextAction('blocked');}});
 apply.addEventListener('click',()=>{try{if(R.protectedPanel(card))throw Error('Approved panels are immutable.');const s=C.clone(base),v=k=>controls[k].value.trim();s.location.region=v('region');s.eventYear=Number(v('eventYear'));s.location.setting=v('setting');s.cast=v('cast').split('\n').map(line=>{const at=line.indexOf('|');if(at<1)throw Error('Each cast line needs id | description.');return {id:line.slice(0,at).trim(),description:line.slice(at+1).trim()};});s.action={actor:v('actor'),description:v('action')};s.camera={movement:v('movement'),framing:v('framing')};s.chronology={...s.chronology,relation:v('relation'),sceneYear:v('sceneYear')?Number(v('sceneYear')):null,period:v('period')};s.audio=v('audio');if(s.choreography&&(s.choreography.forAction!==s.action.description||s.choreography.forSetting!==s.location.setting||s.choreography.forCast!==C.stable(s.cast)))delete s.choreography;R.applyReview(card,s);R.build(card);window.LDCore?.saveCurrent?.();status.textContent='Reviewed scene saved. Smart Continue can now run local preflight and audit.';showNextAction('idle');}catch(e){status.textContent=e.message;showNextAction('blocked');}});
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachAll);else attachAll();
window.addEventListener('ld:video-mode-changed',attachAll);
window.addEventListener('ld:visual-mode-hard-reset',attachAll);
})();
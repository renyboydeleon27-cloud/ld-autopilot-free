/* Core 5 browser adapter. Explicit entrypoints; no prompt wrappers or polling. */
(function(){'use strict';
const C=window.NERCore5;if(!C)return;
const records=new WeakMap(),inflight=new Map();
const field=(c,s)=>String(c?.querySelector(s)?.value||'');
function manages(c){return !!c&&C.STAGES.includes(c.dataset.stage)&&!window.LDStoryModes?.enabled?.()&&document.getElementById('format')?.value==='shorts'&&(window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode||'bw')==='bw'&&(window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle||document.getElementById('visualMode')?.value||'anime')==='anime'&&(window.LDProjectLocks?.videoMode?.()||window.ldProjectLocks?.videoMode||c.dataset.videoMode)==='text';}
function protectedPanel(c){return !!(c?.querySelector('.done-toggle')?.checked||c?.dataset.approvalCommitted==='1'||window.LDCore?.isApprovalCommitted?.(c?.dataset.stage));}
function scope(){return JSON.stringify([localStorage.getItem('ld-autopilot-free-active-project')||'',document.getElementById('topic')?.value||'',document.getElementById('format')?.value||'',window.ldNarrativeFormat||'original']);}
function metadata(){return C.metadata(document.getElementById('topic')?.value||'',window.ldVideoContinuity||{});}
function inputs(c){const meta=metadata();return {scope:scope(),topic:document.getElementById('topic')?.value||'',stage:c.dataset.stage,narration:field(c,'.narration'),eventYear:meta.year,location:meta.location,legacyScene:field(c,'.video-scene')||c.dataset.videoScene||'',spec:c.dataset.core5Spec?JSON.parse(c.dataset.core5Spec):null};}
function key(c){return C.stable(inputs(c));}
function stored(c){let r=records.get(c);if(!r&&c.dataset.core5Record){try{r=JSON.parse(c.dataset.core5Record);if(protectedPanel(c)&&r.status==='APPROVED'&&r.prompt===r.payload?.currentPrompt&&r.result?.ok===true&&r.result?.result==='PASS'&&Array.isArray(r.result.issues)&&!r.result.issues.length){r=C.deepFreeze(r);records.set(c,r);return r;}if(r.version!==C.VERSION||!C.validatePayload(r.payload).ok||r.prompt!==r.payload.currentPrompt||!['AUDITED','APPROVED','REVIEW_REQUIRED'].includes(r.status))return null;if(r.status!=='REVIEW_REQUIRED')C.transaction(r.payload,r.result);r=C.deepFreeze(r);records.set(c,r);}catch{return null;}}return r||null;}
function current(c){if(c?.dataset.stage==='ENDING')return field(c,'.image-prompt');return field(c,'.text-video-prompt')||c?.dataset.textVideoPrompt||'';}
function preserve(c){const r=stored(c);if(r?.status==='APPROVED')return r.prompt;return current(c)||field(c,['ENDING','THUMBNAIL'].includes(c?.dataset.stage)?'.image-prompt':'.flow-prompt');}
function spec(c){const i=inputs(c),r=stored(c);if(r&&r.inputKey===key(c))return r.payload.stageSpec;return C.plan(i);}
function write(c,p){if(protectedPanel(c))return preserve(c);if(c.dataset.stage==='ENDING'){const image=c.querySelector('.image-prompt');if(image)image.value=p;return p;}c.dataset.textVideoPrompt=p;const f=c.querySelector('.text-video-prompt');if(f)f.value=p;if(c.dataset.stage==='HOOK'){const h=c.querySelector('.flow-prompt');if(h)h.value=p;}return p;}
function sceneText(s){return [s.location.setting,...s.cast.map(x=>x.id+': '+x.description),'Action: '+s.action.description,'Camera: '+s.camera.movement+'; '+s.camera.framing,'Scene period: '+s.chronology.period].join('\n');}
function syncScene(c,s){const label=c.querySelector('.scene-role');if(label)label.textContent=s.role;const old=field(c,'.video-scene')||c.dataset.videoScene||'';if(old&&!c.dataset.core5LegacyScene&&!c.dataset.core5Spec)c.dataset.core5LegacyScene=old;const text=sceneText(s);c.dataset.videoScene=text;const f=c.querySelector('.video-scene');if(f)f.value=text;}
function originalV1Issues(c,s){
 const guard=window.LDNarrationImport?.storyLock;
 const t=document.getElementById('topic')?.value||'',fmt=document.getElementById('format')?.value||'';
 if(!guard||window.ldNarrativeFormat!=='original'||!guard.active(t,fmt))return [];
 const narrations={};
 for(const st of guard.STAGES){
  const node=document.querySelector('.stage-card[data-stage="'+st+'"]');
  narrations[st]=String(node?.querySelector('.narration')?.value||'');
 }
 const review=guard.review(narrations);
 const scene=[s?.location?.setting||'',s?.action?.description||''].join(' ');
 return [...review.issues,...guard.sceneIssues(c.dataset.stage,field(c,'.narration'),scene)];
}
// A past automatically generated Tōhoku P5 scene says to walk calmly to a
// generic shelter. Flag ONLY the exact untouched legacy recipe; customized,
// audited and approved prompts must never be silently replaced.
function staleTohokuP5(s){
 return !!s&&s.stage==='P5'&&s.family==='tsunami'&&Number(s.eventYear)===2011&&
  /(?:t[oō]hoku|japan)/i.test(String(s.topic||''))&&
  /\b(?:tsunami warnings?|warnings? issued|authorities issued)\b/i.test(String(s.narration||''))&&
  /\b(?:fled|flee|evacuat(?:e|ion|ed|ing)|higher ground|uphill)\b/i.test(String(s.narration||''))&&
  s.location?.setting==='visible local route toward shelter'&&
  s.action?.actor==='adult-1'&&s.action?.description==='adult-1 walks steadily to a visible sheltered threshold'&&
  s.cast?.length===1&&s.cast[0]?.id==='adult-1'&&s.cast[0]?.description==='unnamed adult observer'&&
  s.camera?.framing==='human-height medium-wide'&&s.camera?.movement==='slow-push-in'&&
  s.audio==='quiet local ambience'&&!s.choreography;
}
function preflight(c){if(protectedPanel(c))return {ok:true,issues:[],preserved:true};try{const s=spec(c),v=C.validate(s),i=inputs(c);if(staleTohokuP5(s))v.issues.push('Saved P5 is the old generic shelter-walking recipe. Use Review Core 5 scene → Fix this stage · FREE to rebuild uphill evacuation; approved and audited panels are untouched.');v.issues.push(...originalV1Issues(c,s));if(s.stage!==i.stage||s.topic!==i.topic||s.narration!==i.narration||s.eventYear!==Number(i.eventYear)||s.location?.region!==i.location)v.issues.push('StageSpec source identity does not match this panel and project.');if(!c.dataset.core5Spec&&i.legacyScene.trim())v.issues.push('KEEP CURRENT SCENE: review the saved scene in Review Core 5 scene before using Smart Continue.');if(c.dataset.core5Spec&&i.legacyScene!==sceneText(s))v.issues.push('Scene editor differs from the reviewed scene. Open Review Core 5 scene and apply your changes before audit.');const prior=[];for(const card of (document.querySelectorAll?.('.stage-card')||[])){if(card===c)break;if(card.dataset.core5Spec){try{const previous=JSON.parse(card.dataset.core5Spec);if(!protectedPanel(card)||previous.compilerVersion===C.VERSION)prior.push(previous);}catch{}}}if(prior.length)v.issues.push(...C.validateSequence([...prior,s]).issues);return {...v,ok:v.issues.length===0,spec:s};}catch(e){return {ok:false,issues:[e.message]};}}
function build(c){if(protectedPanel(c))return preserve(c);const v=preflight(c);if(!v.ok)throw Error('Local preflight — no audit credits used: '+v.issues.join(' '));const r=stored(c);if(r&&r.inputKey===key(c))return write(c,r.prompt);if(!c.dataset.core5Spec)setSpec(c,v.spec);return write(c,C.compile(v.spec));}
function payload(c){if(protectedPanel(c)){const r=stored(c);if(r)return r.payload;throw Error('Legacy approved panel has no Core 5 audit payload.');}const v=preflight(c);if(!v.ok)throw Error('Local preflight — no audit credits used: '+v.issues.join(' '));if(!c.dataset.core5Spec)setSpec(c,v.spec);return C.payload(v.spec);}
function ready(c){const r=stored(c);return !!r&&['AUDITED','APPROVED'].includes(r.status)&&r.inputKey===key(c)&&current(c)===r.prompt&&C.validatePayload(r.payload).ok;}
function diagnostic(c){
 // Read-only, local-only. Never call payload/build/prepare, which can write drafts.
 if(!c||!manages(c))return {status:'NOT_CORE5',issues:['Not a Core 5 panel.']};
 if(protectedPanel(c))return {status:'PROTECTED',issues:[],safeToRetry:false};
 const issues=[],record=stored(c),raw=c.dataset.core5Record||'';
 let journalStatus='NONE';
 if(raw){try{const parsed=JSON.parse(raw);journalStatus=parsed.status||'UNKNOWN';}catch{journalStatus='INVALID_JSON';issues.push('Saved panel audit record is not readable.');}}
 const check=preflight(c);
 if(!check.ok)issues.push(...check.issues);
 if(record?.status==='REVIEW_REQUIRED')issues.push(...(record.result?.issues||['Previous audit requires review.']));
 if(raw&&!record)issues.push('Saved audit record cannot be validated against the current compiler or prompt.');
 if(record&&record.inputKey!==key(c))issues.push('Saved audit record does not match current panel inputs.');
 if(record&&current(c)!==record.prompt)issues.push('Current video prompt differs from the saved audit prompt.');
 const status=ready(c)?'AUDIT_READY':record?.status==='REVIEW_REQUIRED'?'AUDIT_REVIEW_REQUIRED':!check.ok?'LOCAL_PREFLIGHT_BLOCKED':raw&&!record?'INVALID_SAVED_AUDIT':'NOT_AUDITED';
 return {status,journalStatus,issues,safeToRetry:false,requiresPaidAudit:status!=='AUDIT_READY',panel:c.dataset.stage};
}
async function journalDiagnostic(c){
 const d=diagnostic(c);if(!manages(c)||protectedPanel(c))return d;
 // A missing location/scene is a local preflight blocker, not a journal failure.
 // Never attempt a journal payload inspection until its canonical StageSpec is valid.
 if(d.status==='LOCAL_PREFLIGHT_BLOCKED'){
  d.issues.push('Fix the scene using Review Core 5 scene → Fix this stage · FREE, then check again. No audit was sent.');
  return d;
 }
 const project=scope(),inputKey=key(c);
 try{
  const p=C.payload(spec(c));
  const journal=await window.NERCore5AuditCoordinator.inspect(project,p);
  if(scope()!==project||key(c)!==inputKey||!c.isConnected)throw Error('Panel changed during inspection. Check again.');
  d.journal=journal;
  if(journal.busy)d.issues.push('Audit journal is locked by another tab. No request was sent.');
  else if(journal.conflict)d.issues.push('Legacy and IndexedDB journals conflict. Both records are retained; manual review required.');
  else if(journal.found&&!journal.identityMatch)d.issues.push('Existing stage journal belongs to a different payload. Explicit review is required before any reset.');
  else if(journal.found&&!journal.recoverable)d.issues.push('Existing journal is incomplete, uncertain, or invalid. No automatic reset or paid retry is allowed.');
  if(journal.found||journal.busy)d.status=journal.recoverable?'SAVED_RESULT_RECOVERABLE':'JOURNAL_REVIEW_REQUIRED';
 }catch(e){d.status='JOURNAL_INSPECTION_FAILED';d.issues.push(e.message);}
 return d;
}
async function saveRecovered(c,record){
 persist(c,record);
 if(window.LDCore?.saveCurrent?.()===false)throw Error('Recovered audit remains in its journal, but project storage could not save. Keep this page open and export a backup. No paid request was sent.');
 await window.NERProjectStorage?.flush();
}
async function recoverJournal(c){
 if(protectedPanel(c))throw Error('Approved panels are immutable.');
 const v=preflight(c);if(!v.ok)throw Error(v.issues.join(' '));
 const p=C.payload(v.spec),project=scope(),inputKey=key(c);
 const result=await window.NERCore5AuditCoordinator.recover(project,p);
 if(scope()!==project||key(c)!==inputKey||!c.isConnected||protectedPanel(c))throw Error('Panel changed during recovery. Journal retained.');
 if(result.ok===true&&result.result==='NEEDS FIX'){
  await saveRecovered(c,{version:C.VERSION,status:'REVIEW_REQUIRED',payload:p,prompt:p.currentPrompt,result,inputKey,scope:project});
  return 'Saved audit recovered: needs scene review. No paid request was sent.';
 }
 const tx=C.transaction(p,result);write(c,tx.prompt);await saveRecovered(c,{...tx,inputKey,scope:project});
 return 'Saved audit recovered. Exact audited prompt restored; no paid request was sent.';
}
async function archiveIncompleteJournal(c,review){
 if(protectedPanel(c))throw Error('Approved panels are immutable.');
 const v=preflight(c);if(!v.ok)throw Error(v.issues.join(' '));
 const project=scope(),inputKey=key(c),p=C.payload(v.spec);
 const valid=()=>scope()===project&&key(c)===inputKey&&c.isConnected&&!protectedPanel(c);
 if(!review?.identityMatch||review.conflict||!['STARTED','UNCERTAIN'].includes(review.status))throw Error('Inspect the incomplete journal first.');
 const archived=await window.NERCore5AuditCoordinator.archiveIncomplete(project,p,review.reviewToken,valid);
 if(!valid())throw Error('Journal archived, but panel changed. Inspect the original project again. No audit sent.');
 records.delete(c);delete c.dataset.core5Record;
 if(window.LDCore?.saveCurrent?.()===false)throw Error('Journal archived, but project save failed. Export a backup before continuing. No audit sent.');
 await window.NERProjectStorage?.flush();
 return 'Incomplete journal archived safely. One new audit may run on your next Smart Continue and may use API credits. No audit was sent now. Archive: '+archived;
}
function signature(c){return C.stable(payload(c));}
function persist(c,r){const frozen=C.deepFreeze(r);records.set(c,frozen);c.dataset.core5Record=JSON.stringify(frozen);window.LDVideoModes?.refreshStatus?.(c);window.LDCore?.saveCurrent?.();return frozen;}
async function prepare(c,audit){
 if(protectedPanel(c))return preserve(c);
 if(window.NERProjectStorage)await window.NERProjectStorage.ensureSaved();
 const p=payload(c),inputKey=key(c),project=scope(),cacheKey=project+'|'+C.stable(p);
 const r=stored(c);if(r&&r.inputKey===inputKey){if(r.status==='REVIEW_REQUIRED')throw Error('Audit needs review: '+(r.result.issues||[]).join(' ')+' Edit the StageSpec before another audit.');write(c,r.prompt);return r.prompt;}
 write(c,p.currentPrompt);
 if(!inflight.has(cacheKey))inflight.set(cacheKey,Promise.resolve().then(()=>window.NERCore5AuditCoordinator?window.NERCore5AuditCoordinator.run(project,p,async data=>{if(scope()!==project||key(c)!==inputKey||!c.isConnected)throw Error('Panel changed while waiting for audit access.');return audit(data);}):audit(p)));
 let result;try{result=await inflight.get(cacheKey);}catch(e){if(scope()===project&&key(c)===inputKey&&c.isConnected)persist(c,{version:C.VERSION,status:'REVIEW_REQUIRED',payload:p,prompt:p.currentPrompt,result:{ok:false,issues:['Audit request did not complete: '+e.message]},inputKey,scope:project});throw e;}finally{inflight.delete(cacheKey);}
 if(scope()!==project||key(c)!==inputKey||!c.isConnected)throw Error('Project or panel changed during audit; result discarded.');
 if(current(c)!==p.currentPrompt)throw Error('Prompt changed during audit; result discarded locally.');
 if(result?.ok===true&&result.result==='NEEDS FIX'){persist(c,{version:C.VERSION,status:'REVIEW_REQUIRED',payload:p,prompt:p.currentPrompt,result,inputKey,scope:project});throw Error('Audit needs review: '+(result.issues||[]).join(' ')+' No automatic paid fix or retry.');}
 let tx;try{tx=C.transaction(p,result);}catch(e){persist(c,{version:C.VERSION,status:'REVIEW_REQUIRED',payload:p,prompt:p.currentPrompt,result:{ok:false,issues:['Invalid audit verdict: '+e.message]},inputKey,scope:project});throw e;}
 persist(c,{...tx,inputKey,scope:project});
 if(window.NERProjectStorage)await window.NERProjectStorage.ensureSaved();
 return tx.prompt;
}
async function allowRetry(c){if(protectedPanel(c))throw Error('Approved panels are immutable.');const r=stored(c);if(r?.status!=='REVIEW_REQUIRED'||r.result?.ok!==false)throw Error('Only an incomplete audit request can be explicitly retried; review scene issues first.');const coordinator=window.NERCore5AuditCoordinator;if(coordinator?.inspect){const j=await coordinator.inspect(r.scope,r.payload);if(j.busy||j.conflict||(j.found&&(!j.identityMatch||j.source.includes('legacy')||j.status==='DONE')))throw Error('Journal requires free inspection or recovery first. No reset or audit was sent.');}await coordinator?.reset(r.scope,r.payload);records.delete(c);delete c.dataset.core5Record;window.LDCore?.saveCurrent?.();}
function approve(c){if(!ready(c))throw Error('Core 5 approval blocked: exact audited prompt is no longer current.');const r=stored(c);persist(c,{...r,status:'APPROVED'});return r.prompt;}
function reviewSpec(c){const i=inputs(c);return C.plan({...i,spec:null});}
// Explicit, free, single-stage repair for unaudited drafts. Never overwrite an
// approved stage, an audited record or another panel. Preserve the old draft.
function prepareStage(c){
 if(!manages(c))throw Error('This stage is not in Core 5 Text-to-Video mode.');
 if(protectedPanel(c))throw Error('Approved panels are immutable.');
 if(c.dataset.core5Record)throw Error('This stage has a saved audit record. Inspect its journal before changing the scene. No change was made.');
 // Repeat taps must not replace a valid reviewed scene or duplicate backups.
 if(c.dataset.core5Spec){const existing=preflight(c);if(existing.ok)return existing.spec;}
 const next=reviewSpec(c),valid=C.validate(next);
 if(!valid.ok)throw Error('Free scene repair blocked by local scene validation: '+valid.issues.join(' '));
 const i=inputs(c),before={scene:i.legacyScene,spec:c.dataset.core5Spec||'',record:c.dataset.core5Record||''};
 if(before.scene||before.spec){
  let history=[];try{history=JSON.parse(c.dataset.core5SceneHistory||'[]');if(!Array.isArray(history))history=[];}catch{}
  history.push(before);c.dataset.core5SceneHistory=JSON.stringify(history);
  if(before.scene&&!c.dataset.core5LegacyScene)c.dataset.core5LegacyScene=before.scene;
 }
 setSpec(c,next);write(c,C.compile(next));
 window.LDCore?.saveCurrent?.();
 return next;
}
// Explicit revision is allowed ONLY for the untouched, old, locally AUDITED
// Tōhoku P5 default. Never broaden this to custom, DONE, committed or approved.
function revisableAuditedP5(c){
 if(!manages(c)||protectedPanel(c))return null;
 const r=stored(c);
 if(!r||r.status!=='AUDITED'||r.scope!==scope()||r.inputKey!==key(c)||current(c)!==r.prompt)return null;
 const old=r.payload?.stageSpec;
 if(!staleTohokuP5(old)||!c.dataset.core5Spec||C.stable(inputs(c).spec)!==C.stable(old))return null;
 if(!C.validatePayload(r.payload).ok||r.payload.currentPrompt!==r.prompt)return null;
 return r;
}
function canReviseAuditedP5(c){return !!revisableAuditedP5(c);}
async function reviseAuditedP5(c,review){
 const old=revisableAuditedP5(c);
 if(!old)throw Error('Only the unchanged, unapproved, audited Tōhoku P5 legacy scene can be revised. Nothing changed.');
 if(!review?.found||!review.identityMatch||!review.recoverable||review.conflict||review.busy||review.status!=='DONE'||!review.reviewToken)
  throw Error('Run Check audit status · FREE and confirm the matched DONE P5 journal before revision.');
 const project=scope(),inputKey=key(c),originalRecord=c.dataset.core5Record,oldScene=inputs(c).legacyScene;
 const next=reviewSpec(c),validation=C.validate(next);
 if(!validation.ok)throw Error('Revised P5 fails FREE local validation: '+validation.issues.join(' '));
 const prompt=C.compile(next);
 if(!/uphill evacuation lane/i.test(next.location.setting)||!/hurries forward up/i.test(next.action.description))
  throw Error('New P5 does not contain the intended uphill evacuation. Nothing changed.');
 let history=[];try{history=JSON.parse(c.dataset.core5SceneHistory||'[]');if(!Array.isArray(history))throw Error('Not an array');}
 catch{throw Error('P5 scene history cannot be safely read. Export a project backup; nothing changed.');}
 history.push({scene:oldScene,spec:c.dataset.core5Spec||'',record:originalRecord,prompt:old.prompt,reason:'explicit-obsolete-p5-audit-revision'});
 const nextHistory=JSON.stringify(history);
 if(window.NERProjectStorage)await window.NERProjectStorage.ensureSaved();
 const stillCurrent=()=>scope()===project&&key(c)===inputKey&&
   c.dataset.core5Record===originalRecord&&c.isConnected&&!protectedPanel(c)&&!!revisableAuditedP5(c);
 const archived=await window.NERCore5AuditCoordinator.archiveMatchingDone(project,old.payload,review.reviewToken,stillCurrent);
 if(!stillCurrent())throw Error('Original P5 audit archived, but panel changed before revision. Inspect P5 before further edits; no paid audit sent.');
 // The audited bytes are retained twice: the durable journal archive and the
 // explicit stage history. No existing Master DNA or other panel is touched.
 c.dataset.core5SceneHistory=nextHistory;
 records.delete(c);delete c.dataset.core5Record;
 delete c.dataset.smartReady;delete c.dataset.smartReadySignature;
 setSpec(c,next);write(c,prompt);
 if(window.LDCore?.saveCurrent?.()===false)throw Error('Old audit archived but P5 project save failed. Keep this window open and export a backup; no audit was sent.');
 await window.NERProjectStorage?.flush();
 return 'Old P5 DONE audit archived (FREE): '+archived+'\\nNew concrete uphill-evacuation scene prepared. Old prompt preserved in P5 history; no API call sent. Run Check audit status · FREE before Smart Continue.';
}
function reviewIdentity(c,s){const i=inputs(c);return s.stage===i.stage&&s.topic===i.topic&&s.narration===i.narration&&s.eventYear===Number(i.eventYear)&&s.location?.region===i.location;}
function applyReview(c,s){
 if(protectedPanel(c))throw Error('Approved panels are immutable.');
 const i=inputs(c);if(s.stage!==i.stage||s.topic!==i.topic||s.narration!==i.narration)throw Error('Panel changed during review. Reopen Review Core 5 scene.');
 const v=C.validate(s);if(!v.ok)throw Error(v.issues.join(' '));
 window.ldVideoContinuity={...window.ldVideoContinuity,year:String(s.eventYear),location:s.location.region};
 return setSpec(c,s);
}
function setSpec(c,s){if(protectedPanel(c))throw Error('Approved panels are immutable.');const v=C.validate(s);if(!v.ok)throw Error(v.issues.join(' '));if(c.dataset.core5Spec&&C.stable(JSON.parse(c.dataset.core5Spec))===C.stable(s)&&inputs(c).legacyScene===sceneText(s))return s;syncScene(c,s);c.dataset.core5Spec=JSON.stringify(s);window.LDVideoModes?.updateSceneChoiceStatus?.(c);records.delete(c);delete c.dataset.core5Record;delete c.dataset.smartReady;delete c.dataset.smartReadySignature;window.LDVideoModes?.refreshStatus?.(c);window.LDCore?.saveCurrent?.();return s;}
function planEpisode(){
 const cards=Array.from(document.querySelectorAll('.stage-card')).filter(manages),drafts=[],sequence=[],issues=[];
 for(const card of cards){
  if(protectedPanel(card)){try{const old=JSON.parse(card.dataset.core5Spec);if(C.validate(old).ok)sequence.push(old);}catch{}continue;}
  // Keep valid reviewed scenes and their exact audit records, including conclusive failures.
  const existing=card.dataset.core5Spec&&preflight(card);
  if(existing?.ok){sequence.push(existing.spec);continue;}
  const s=reviewSpec(card),v=C.validate(s);if(!v.ok)issues.push(...v.issues.map(x=>s.stage+': '+x));drafts.push({card,spec:s});sequence.push(s);
 }
 issues.push(...C.validateSequence(sequence).issues);return {drafts,issues};
}
function prepareEpisode(){
 const plan=planEpisode();if(plan.issues.length)throw Error('Local episode review: '+plan.issues.join(' '));
 for(const {card,spec:s} of plan.drafts){if(protectedPanel(card))continue;const previous={scene:inputs(card).legacyScene,spec:card.dataset.core5Spec||'',record:card.dataset.core5Record||''};if(previous.scene||previous.spec||previous.record){const history=JSON.parse(card.dataset.core5SceneHistory||'[]');history.push(previous);card.dataset.core5SceneHistory=JSON.stringify(history);}if(!card.dataset.core5LegacyScene)card.dataset.core5LegacyScene=previous.scene;applyReview(card,s);write(card,C.compile(s));}
 window.LDCore?.saveCurrent?.();return plan.drafts.length;
}
function refineScene(c){
 if(protectedPanel(c))throw Error('Approved panels are immutable.');
 const v=preflight(c);if(!v.ok)throw Error(v.issues.join(' '));const next=C.refine(v.spec);
 if(C.stable(next)===C.stable(v.spec))return false;
 const history=JSON.parse(c.dataset.core5SceneHistory||'[]');history.push({scene:inputs(c).legacyScene,spec:c.dataset.core5Spec||'',record:c.dataset.core5Record||''});c.dataset.core5SceneHistory=JSON.stringify(history);
 setSpec(c,next);write(c,C.compile(next));window.LDCore?.saveCurrent?.();return true;
}
// Dispatch before the legacy extension chain. Legacy setters only affect legacy panels.
function attachVideoModes(api){
 for(const name of ['prompt','build']){
  let legacy=api[name];
  Object.defineProperty(api,name,{enumerable:true,configurable:false,
   get(){const previous=legacy;return function(card,...args){if(protectedPanel(card))return preserve(card);if(manages(card))return build(card);return previous.call(this,card,...args);};},
   set(value){if(typeof value==='function')legacy=value;}
  });
 }
 return api;
}
function owns(c){return protectedPanel(c)||manages(c);}
window.NERCore5Runtime=Object.freeze({attachVideoModes,owns,manages,protectedPanel,scope,spec,diagnostic,journalDiagnostic,recoverJournal,archiveIncompleteJournal,canReviseAuditedP5,reviseAuditedP5,planEpisode,prepareEpisode,refineScene,reviewSpec,prepareStage,reviewIdentity,applyReview,sceneText,preflight,build,payload,ready,signature,prepare,allowRetry,approve,setSpec,preserve});
})();

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
function preflight(c){if(protectedPanel(c))return {ok:true,issues:[],preserved:true};try{const s=spec(c),v=C.validate(s),i=inputs(c);if(s.stage!==i.stage||s.topic!==i.topic||s.narration!==i.narration||s.eventYear!==Number(i.eventYear)||s.location?.region!==i.location)v.issues.push('StageSpec source identity does not match this panel and project.');if(!c.dataset.core5Spec&&i.legacyScene.trim())v.issues.push('KEEP CURRENT SCENE: review the saved scene in Review Core 5 scene before using Smart Continue.');if(c.dataset.core5Spec&&i.legacyScene!==sceneText(s))v.issues.push('Scene editor differs from the reviewed scene. Open Review Core 5 scene and apply your changes before audit.');const prior=[];for(const card of (document.querySelectorAll?.('.stage-card')||[])){if(card===c)break;if(card.dataset.core5Spec){try{const previous=JSON.parse(card.dataset.core5Spec);if(!protectedPanel(card)||previous.compilerVersion===C.VERSION)prior.push(previous);}catch{}}}if(prior.length)v.issues.push(...C.validateSequence([...prior,s]).issues);return {...v,ok:v.issues.length===0,spec:s};}catch(e){return {ok:false,issues:[e.message]};}}
function build(c){if(protectedPanel(c))return preserve(c);const r=stored(c);if(r&&r.inputKey===key(c))return write(c,r.prompt);const v=preflight(c);if(!v.ok)throw Error('Local preflight — no audit credits used: '+v.issues.join(' '));if(!c.dataset.core5Spec)setSpec(c,v.spec);return write(c,C.compile(v.spec));}
function payload(c){if(protectedPanel(c)){const r=stored(c);if(r)return r.payload;throw Error('Legacy approved panel has no Core 5 audit payload.');}const v=preflight(c);if(!v.ok)throw Error('Local preflight — no audit credits used: '+v.issues.join(' '));if(!c.dataset.core5Spec)setSpec(c,v.spec);return C.payload(v.spec);}
function ready(c){const r=stored(c);return !!r&&['AUDITED','APPROVED'].includes(r.status)&&r.inputKey===key(c)&&current(c)===r.prompt&&C.validatePayload(r.payload).ok;}
function signature(c){return C.stable(payload(c));}
function persist(c,r){const frozen=C.deepFreeze(r);records.set(c,frozen);c.dataset.core5Record=JSON.stringify(frozen);window.LDCore?.saveCurrent?.();return frozen;}
async function prepare(c,audit){
 if(protectedPanel(c))return preserve(c);
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
 return tx.prompt;
}
async function allowRetry(c){if(protectedPanel(c))throw Error('Approved panels are immutable.');const r=stored(c);if(r?.status!=='REVIEW_REQUIRED'||r.result?.ok!==false)throw Error('Only an incomplete audit request can be explicitly retried; review scene issues first.');await window.NERCore5AuditCoordinator?.reset(r.scope,r.payload);records.delete(c);delete c.dataset.core5Record;window.LDCore?.saveCurrent?.();}
function approve(c){if(!ready(c))throw Error('Core 5 approval blocked: exact audited prompt is no longer current.');const r=stored(c);persist(c,{...r,status:'APPROVED'});return r.prompt;}
function reviewSpec(c){const i=inputs(c);return C.plan({...i,spec:null});}
function reviewIdentity(c,s){const i=inputs(c);return s.stage===i.stage&&s.topic===i.topic&&s.narration===i.narration&&s.eventYear===Number(i.eventYear)&&s.location?.region===i.location;}
function applyReview(c,s){
 if(protectedPanel(c))throw Error('Approved panels are immutable.');
 const i=inputs(c);if(s.stage!==i.stage||s.topic!==i.topic||s.narration!==i.narration)throw Error('Panel changed during review. Reopen Review Core 5 scene.');
 const v=C.validate(s);if(!v.ok)throw Error(v.issues.join(' '));
 window.ldVideoContinuity={...window.ldVideoContinuity,year:String(s.eventYear),location:s.location.region};
 return setSpec(c,s);
}
function setSpec(c,s){if(protectedPanel(c))throw Error('Approved panels are immutable.');const v=C.validate(s);if(!v.ok)throw Error(v.issues.join(' '));if(c.dataset.core5Spec&&C.stable(JSON.parse(c.dataset.core5Spec))===C.stable(s)&&inputs(c).legacyScene===sceneText(s))return s;syncScene(c,s);c.dataset.core5Spec=JSON.stringify(s);window.LDVideoModes?.updateSceneChoiceStatus?.(c);records.delete(c);delete c.dataset.core5Record;delete c.dataset.smartReady;delete c.dataset.smartReadySignature;window.LDCore?.saveCurrent?.();return s;}
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
window.NERCore5Runtime=Object.freeze({attachVideoModes,owns,manages,protectedPanel,scope,spec,planEpisode,prepareEpisode,reviewSpec,reviewIdentity,applyReview,sceneText,preflight,build,payload,ready,signature,prepare,allowRetry,approve,setSpec,preserve});
})();

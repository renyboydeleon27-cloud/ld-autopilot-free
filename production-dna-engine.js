/* LD AUTO v3.40.3 — Final Production Check with Approved Memory recovery for completed legacy projects. */
(function(){
'use strict';

const LIB_KEY='ld-autopilot-free-project-library-v1';
const CORE_KEY='ld-autopilot-free-v1';
const DNA_KEY='ld-auto-production-dna-v1';
const CORE_STAGES=['HOOK','P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14'];

function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback;}catch(e){return fallback;}}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value));}
function clean(s){return String(s||'').trim();}
function currentTopic(){
  const title=clean(document.getElementById('projectTitle')?.textContent);
  if(title&&title!=='No production yet')return title;
  return clean(document.getElementById('topic')?.value);
}
function familyOf(topic){
  const t=String(topic||'').toLowerCase();
  if(/tsunami|mega-tsunami|megatsunami/.test(t))return 'tsunami';
  if(/earthquake|quake|seismic/.test(t))return 'earthquake';
  if(/cyclone|hurricane|typhoon/.test(t))return 'cyclone';
  if(/tornado/.test(t))return 'tornado';
  if(/flood|dam failure/.test(t))return 'flood';
  if(/landslide|avalanche|lahar/.test(t))return 'landslide';
  if(/volcano|eruption/.test(t))return 'volcano';
  if(/wildfire|fire/.test(t))return 'wildfire';
  if(/locust|insect/.test(t))return 'insect';
  if(/nuclear|chemical|industrial|gas/.test(t))return 'industrial';
  if(/virus|epidemic|pandemic|plague/.test(t))return 'epidemic';
  return 'general';
}
function stagePrompt(stage){
  if(!stage)return '';
  return clean(stage.textVideoPrompt||stage.flowPrompt||stage.imagePrompt||'');
}
function approvedCore(state){
  return !!(state&&state.format==='shorts'&&CORE_STAGES.every(function(k){return !!state.stages?.[k]?.done;}));
}
function latestApprovedProject(){
  const lib=readJson(LIB_KEY,{projects:[]});
  return (lib.projects||[])
    .filter(function(p){return approvedCore(p.state);})
    .sort(function(a,b){return new Date(b.updatedAt||0)-new Date(a.updatedAt||0);})[0]||null;
}
function ratio(prompts,re){
  if(!prompts.length)return 0;
  return prompts.filter(function(p){return re.test(p);}).length/prompts.length;
}
function flagsFor(prompt){
  const p=String(prompt||'');
  return {
    continuous:/one continuous shot|continuous observational shot|single continuous shot/i.test(p),
    immediate:/0\.2 second|frame 1|immediately|almost instantly|within the first half-second/i.test(p),
    noCuts:/no cuts|no scene cuts/i.test(p),
    noTransitions:/no transitions|no montage|no angle switching/i.test(p),
    noText:/absolute no-text|no on-screen text|no captions|no typography/i.test(p),
    grounded:/physically plausible|believable|historically grounded|grounded and realistic/i.test(p),
    progressive:/progressive|continues? (?:rising|growing|building)|keeps? (?:rising|growing|building)|build(?:ing)? power/i.test(p),
    avoidRepeat:/do not repeat|no repeated|do not restart/i.test(p),
    scale:/scale reference|preserve scale|for scale|against the scale|wide.*scale/i.test(p),
    reserveNext:/next panel|do not show.*yet|stop before|just before/i.test(p)
  };
}
function extractProfile(project){
  const state=project.state;
  const prompts=CORE_STAGES.map(function(k){return stagePrompt(state.stages?.[k]);}).filter(Boolean);
  const stage={};
  CORE_STAGES.forEach(function(k){stage[k]=flagsFor(stagePrompt(state.stages?.[k]));});
  const joined=prompts.join('\n');
  const sourceFamily=familyOf(state.topic);
  return {
    version:'1.0',
    sourceProjectId:project.id,
    sourceTopic:state.topic,
    sourceFamily:sourceFamily,
    sourceUpdatedAt:project.updatedAt||state.updatedAt||new Date().toISOString(),
    createdAt:new Date().toISOString(),
    approvedStages:CORE_STAGES.length,
    universal:{
      continuousShot:ratio(prompts,/one continuous shot|continuous observational shot|single continuous shot/i)>=0.35,
      noCuts:ratio(prompts,/no cuts|no scene cuts/i)>=0.35,
      noTransitions:ratio(prompts,/no transitions|no montage|no angle switching/i)>=0.35,
      noText:ratio(prompts,/absolute no-text|no on-screen text|no captions|no typography/i)>=0.35,
      groundedPhysics:ratio(prompts,/physically plausible|believable|historically grounded|grounded and realistic/i)>=0.35,
      immediateReadability:ratio(prompts,/0\.2 second|frame 1|immediately|almost instantly|within the first half-second/i)>=0.2,
      progressiveContinuity:ratio(prompts,/progressive|continues? (?:rising|growing|building)|keeps? (?:rising|growing|building)|build(?:ing)? power/i)>=0.15,
      avoidRepetition:ratio(prompts,/do not repeat|no repeated|do not restart/i)>=0.2,
      strictBW:/strict true black-and-white grayscale|black-and-white priority/i.test(joined),
      archivalLiveAction:/photorealistic historical live-action|archival documentary \/ newsreel|archival documentary|newsreel capture/i.test(joined)
    },
    familyLessons:{
      tsunami:sourceFamily==='tsunami'&&/normal beach wave|curling surf|surfing wave|wave train|waterfall from mountain/i.test(joined),
      earthquake:sourceFamily==='earthquake'&&/fantasy.*crack|glowing.*crack|physically plausible/i.test(joined),
      landslide:sourceFamily==='landslide'&&/gravity|downslope|slope/i.test(joined)
    },
    stage:stage
  };
}
function activeProfile(){return readJson(DNA_KEY,null);}
function signature(){
  const p=activeProfile();
  if(!p)return '';
  return [p.version,p.sourceProjectId,p.createdAt].join('|');
}
function visualStyle(){const locked=window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle;if(locked==='real'||locked==='anime')return locked;return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?'real':'anime';}
function colorMode(){const locked=window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode;if(locked==='bw'||locked==='color')return locked;return visualStyle()==='real'?'bw':'color';}
function realMode(){return visualStyle()==='real';}
function stageName(cardOrStage){
  if(typeof cardOrStage==='string')return cardOrStage;
  return cardOrStage?.dataset?.stage||'';
}
function stripOldLock(prompt){
  return String(prompt||'').replace(/\n*PRODUCTION DNA OPTIMIZER LOCK:[\s\S]*?END PRODUCTION DNA OPTIMIZER LOCK\.?/gi,'').trim();
}
function dnaLines(profile,stage){
  const lines=[];
  const u=profile.universal||{};
  const sf=profile.stage?.[stage]||{};
  lines.push('PRODUCTION DNA OPTIMIZER LOCK:');
  lines.push('Reuse only proven cinematic technique from the approved source production. NEVER inherit its event name, year, location, measurements, people, geography, causes, sequence-specific facts, or disaster-specific claims. Current-production historical facts always have priority.');
  if(colorMode()==='bw'&&u.strictBW)lines.push(visualStyle()==='anime'?'VISUAL DISCIPLINE: preserve the current strict monochrome historical-anime treatment; true black-and-white grayscale only, with no color, sepia, tint, selective color or colored accents.':'VISUAL DISCIPLINE: preserve the current Real Human strict monochrome archival treatment; never allow color, sepia, tint, or selective color to return.');
  if(realMode()&&u.archivalLiveAction)lines.push('CAPTURE DISCIPLINE: photorealistic historical live-action with restrained archival/newsreel character; preserve the current episode era and location rather than the source episode.');
  if(u.continuousShot||sf.continuous)lines.push('SHOT DISCIPLINE: prefer one coherent continuous shot when the current scene supports it.');
  if(u.noCuts||sf.noCuts)lines.push('Do not introduce unnecessary cuts that break cause-and-effect readability.');
  if(u.noTransitions||sf.noTransitions)lines.push('Do not add unnecessary transitions, montage resets, or angle switching.');
  if(u.noText||sf.noText)lines.push('NO-TEXT DISCIPLINE: no invented labels, dates, captions, titles, typography, logos, or watermark.');
  if(u.groundedPhysics||sf.grounded)lines.push('PHYSICS DISCIPLINE: keep motion grounded, coherent, physically believable, and specific to the current disaster mechanism.');
  if(u.immediateReadability||sf.immediate)lines.push('READABILITY DISCIPLINE: make the panel’s main visual idea readable immediately; avoid wasting the opening seconds on a generic establishing shot.');
  if(sf.progressive)lines.push('PROGRESSION DISCIPLINE: preserve continuous escalation/build-up through the shot instead of resetting the action.');
  if(sf.avoidRepeat||u.avoidRepetition)lines.push('CONTINUITY DISCIPLINE: do not repeat the previous panel’s main action; advance the story by one clear beat.');
  if(sf.reserveNext)lines.push('STAGE DISCIPLINE: stop at this panel’s intended endpoint; reserve the next major beat for the next panel.');
  if(sf.scale)lines.push('SCALE DISCIPLINE: keep a readable environmental or human scale reference when it improves the current scene.');
  const sameFamily=familyOf(currentTopic())===profile.sourceFamily;
  if(sameFamily&&profile.sourceFamily==='tsunami'&&profile.familyLessons?.tsunami){
    lines.push('TSUNAMI FAMILY LESSON: avoid ordinary beach-surf behavior, neat curling breakers, repeated small wave trains, waterfall-from-mountain artifacts, and unrelated water sources unless the current verified event specifically requires them.');
  }
  if(sameFamily&&profile.sourceFamily==='earthquake'&&profile.familyLessons?.earthquake){
    lines.push('EARTHQUAKE FAMILY LESSON: avoid fantasy glowing cracks or impossible ground behavior; keep visible seismic effects grounded in the current event.');
  }
  if(sameFamily&&profile.sourceFamily==='landslide'&&profile.familyLessons?.landslide){
    lines.push('LANDSLIDE FAMILY LESSON: preserve believable gravity, downslope momentum, material weight, and terrain-specific cause-and-effect.');
  }
  lines.push('END PRODUCTION DNA OPTIMIZER LOCK.');
  return lines;
}
function polishPrompt(cardOrStage,prompt){
  const profile=activeProfile();
  const base=stripOldLock(prompt);
  if(!profile||!base)return base;
  // A finished production is the SOURCE of its DNA; never feed its extracted DNA back into itself.
  if(clean(profile.sourceTopic)===currentTopic())return base;
  const stage=stageName(cardOrStage);
  return base+'\n\n'+dnaLines(profile,stage).join('\n');
}
function polishHookPrompt(prompt){return polishPrompt('HOOK',prompt);}
function summarize(profile){
  if(!profile)return 'No Production DNA captured yet.';
  const u=profile.universal||{};
  const tags=[];
  if(u.continuousShot)tags.push('continuous-shot');
  if(u.immediateReadability)tags.push('fast readability');
  if(u.groundedPhysics)tags.push('grounded physics');
  if(u.noText)tags.push('no-text');
  if(u.avoidRepetition)tags.push('anti-repeat');
  if(u.strictBW)tags.push('B&W visual DNA');
  return 'Source: '+profile.sourceTopic+' · HOOK + P1–P14 approved · '+(tags.join(' · ')||'core technique captured');
}
function cardFor(stage){
  return document.querySelector('.stage-card[data-stage="'+stage+'"]');
}
function currentStageReady(card){
  if(!card)return false;
  const stage=card.dataset.stage||'';
  if(/^P(?:[1-9]|1[0-4])$/.test(stage)){
    if((card.dataset.videoMode||'image')==='text'){
      return !!card.querySelector('.narration')?.value.trim()&&!!window.LDVideoModes?.valid?.(card);
    }
    return !!card.querySelector('.narration')?.value.trim()
      &&!!card.querySelector('.image-prompt')?.value.trim()
      &&!!card.querySelector('.flow-prompt')?.value.trim();
  }
  if(stage==='HOOK')return !!card.querySelector('.flow-prompt')?.value.trim();
  if(stage==='ENDING'||stage==='THUMBNAIL')return !!card.querySelector('.image-prompt')?.value.trim();
  return false;
}
function obviousDuplicateScenes(){
  const seen=new Map(),pairs=[];
  for(let i=1;i<=14;i++){
    const card=cardFor('P'+i); if(!card)continue;
    const raw=(card.dataset.videoMode==='text')
      ? (card.querySelector('.video-scene')?.value||card.dataset.videoScene||'')
      : (card.querySelector('.flow-prompt')?.value||'');
    const key=String(raw||'').toLowerCase().replace(/\s+/g,' ').replace(/[^a-z0-9 ]/g,'').trim();
    if(key.length<90)continue;
    if(seen.has(key))pairs.push(seen.get(key)+' / P'+i);
    else seen.set(key,'P'+i);
  }
  return pairs;
}
function currentApprovedSource(){
  const state=window.LDCore?.collectState?.();
  if(!approvedCore(state))return null;
  return {
    id:'current-'+clean(state.topic).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
    name:state.topic,
    state,
    updatedAt:state.updatedAt||new Date().toISOString()
  };
}
function evaluateFinalProduction(){
  const checks=[];
  const push=(key,label,ok,detail)=>checks.push({key,label,ok:!!ok,detail:detail||''});
  const current=currentTopic();
  const format=document.getElementById('format')?.value||'shorts';
  const locks=window.LDProjectLocks?.get?.()||window.ldProjectLocks;
  push('locks','Project Locks',!!locks?.locked&&['image','text'].includes(locks.videoMode)&&['anime','real'].includes(locks.visualStyle)&&['bw','color'].includes(locks.colorMode),
    locks?.locked&&['bw','color'].includes(locks.colorMode)?'Video + visual style + color treatment locked.':'Lock Video Mode, Visual Style and Color Treatment.');

  const continuity=window.ldVideoContinuity||{};
  const contextOk=/^\d{4}$/.test(String(continuity.year||''))&&!!String(continuity.location||'').trim();
  push('context','Year + location',contextOk,contextOk?(continuity.year+' · '+continuity.location):'Event year and main location are required.');

  const coreCards=CORE_STAGES.map(cardFor);
  const missingCards=CORE_STAGES.filter((stage,i)=>!coreCards[i]);
  const notDone=CORE_STAGES.filter((stage,i)=>coreCards[i]&&!coreCards[i].querySelector('.done-toggle')?.checked);
  push('coreDone','HOOK + P1–P14 approved/DONE',format==='shorts'&&!missingCards.length&&!notDone.length,
    format!=='shorts'?'Final DNA gate is for Shorts productions.':missingCards.length?'Missing: '+missingCards.join(', '):(notDone.length?'Not Done: '+notDone.join(', '):'All core stages are Done.'));

  const memory=window.ldApprovedMemory?.stages||{};
  const missingMemory=CORE_STAGES.filter(stage=>!memory[stage]?.latest);
  push('memory','Approved Memory',!missingMemory.length,
    missingMemory.length?'Missing approved snapshots: '+missingMemory.join(', '):'Approved snapshots saved for HOOK + P1–P14.');

  const stale=[];
  const signatureFn=window.LDSmartContinue?.readinessSignature;
  if(typeof signatureFn==='function'){
    CORE_STAGES.forEach(stage=>{
      const card=cardFor(stage),snap=memory[stage]?.latest;
      if(!card||!snap?.auditSignature)return;
      if(snap.auditSignature!==signatureFn(card))stale.push(stage);
    });
  }
  const missingAudit=CORE_STAGES.filter(stage=>memory[stage]?.latest&&!memory[stage].latest.auditSignature);
  const signaturesOk=typeof signatureFn==='function'&&!missingMemory.length&&!stale.length&&!missingAudit.length;
  push('audit','Audit signatures current',signaturesOk,
    missingMemory.length?'Approved Memory must be recovered before signatures can be verified.':(stale.length?'Changed after approval: '+stale.join(', '):(missingAudit.length?'Missing audit signature: '+missingAudit.join(', '):'Approved content still matches its approved version.')));

  const incompleteCore=CORE_STAGES.filter(stage=>!currentStageReady(cardFor(stage)));
  push('content','Narration + production prompts',!incompleteCore.length,
    incompleteCore.length?'Incomplete or stale: '+incompleteCore.join(', '):'Core narration and prompts are complete.');

  const duplicates=obviousDuplicateScenes();
  push('duplicates','No obvious duplicate panel scenes',!duplicates.length,
    duplicates.length?'Duplicate scene pairs: '+duplicates.join(', '):'No exact repeated P1–P14 scene detected.');

  const ending=cardFor('ENDING');
  push('ending','Ending ready',currentStageReady(ending),
    currentStageReady(ending)?'Ending prompt ready.':'Ending image prompt is not ready.');

  const thumb=cardFor('THUMBNAIL');
  const thumbReady=currentStageReady(thumb);
  const thumbCheck=window.LDThumbnailFormatLock?.checkCurrent?.()||{ok:thumbReady,issue:thumbReady?'':'Thumbnail prompt is not ready.'};
  push('thumbnail','Thumbnail + casualty rule',thumbReady&&thumbCheck.ok,
    !thumbReady?'Thumbnail image prompt is not ready.':(thumbCheck.ok?(thumbCheck.hasVerifiedDeaths?'Verified-death badge rule is consistent.':'No unverified death badge will be used.'):thumbCheck.issue));

  const ok=!!current&&checks.every(x=>x.ok);
  return {ok,topic:current,checks,failed:checks.filter(x=>!x.ok)};
}
function recoveryEligible(gate){
  const failed=Array.isArray(gate?.failed)?gate.failed:[];
  const missingMemory=failed.some(x=>x.key==='memory');
  const otherFailures=failed.filter(x=>x.key!=='memory'&&x.key!=='audit');
  return missingMemory&&otherFailures.length===0;
}
function recoverApprovedMemory(){
  const gateBefore=evaluateFinalProduction();
  if(!recoveryEligible(gateBefore))return {ok:false,message:'Approved Memory recovery is only available when the production is otherwise fully complete and valid.'};
  const saver=window.LDSmartContinue?.saveApprovedMemory;
  if(typeof saver!=='function')return {ok:false,message:'Approved Memory recovery tool is not loaded yet. Refresh LD AUTO and try again.'};
  let recovered=0;
  CORE_STAGES.forEach(stage=>{
    const card=cardFor(stage);
    if(!card||!card.querySelector('.done-toggle')?.checked||!currentStageReady(card))return;
    if(window.ldApprovedMemory?.stages?.[stage]?.latest)return;
    if(saver(card,{method:'final-audit-recovery'}))recovered++;
  });
  const field=document.querySelector('#stages textarea');
  if(field)field.dispatchEvent(new Event('input',{bubbles:true}));
  window.dispatchEvent(new CustomEvent('ld:approved-memory-recovered',{detail:{count:recovered,topic:currentTopic()}}));
  const after=evaluateFinalProduction();
  return {
    ok:after.checks?.find(x=>x.key==='memory')?.ok===true,
    count:recovered,
    message:recovered
      ? 'Recovered Approved Memory for '+recovered+' completed core stage'+(recovered===1?'':'s')+'. Final Production Check refreshed.'
      : (after.ok?'Approved Memory is already complete.':'No recoverable Approved Memory snapshots were created.')
  };
}
function refreshFinalCheck(root){
  root=root||document.getElementById('productionDnaEngine');
  if(!root)return evaluateFinalProduction();
  const gate=evaluateFinalProduction();
  const badge=root.querySelector('.dna-final-badge');
  const list=root.querySelector('.dna-final-list');
  const btn=root.querySelector('.dna-optimize');
  const recover=root.querySelector('.dna-recover');
  if(badge){
    badge.textContent=gate.ok?'✅ PRODUCTION VERIFIED — READY TO SAVE DNA':'⚠️ '+gate.failed.length+' CHECK'+(gate.failed.length===1?'':'S')+' NEED ATTENTION';
    badge.dataset.state=gate.ok?'pass':'warn';
  }
  if(list){
    list.innerHTML=gate.checks.map(x=>'<div class="dna-check-row '+(x.ok?'pass':'warn')+'"><span>'+(x.ok?'✅':'⚠️')+' '+x.label+'</span><small>'+x.detail+'</small></div>').join('');
  }
  if(btn){
    btn.disabled=!gate.ok;
    btn.title=gate.ok?'Save the verified finished production DNA.':(gate.failed[0]?.detail||'Complete the final production check first.');
  }
  if(recover){
    const canRecover=recoveryEligible(gate);
    recover.hidden=!canRecover;
    recover.disabled=!canRecover;
    recover.title=canRecover?'Recover Approved Memory snapshots from this already-completed 100% production.':'Recovery is available only when Approved Memory is the remaining blocker.';
  }
  return gate;
}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
function applyCurrent(){
  let rebuilt=0;
  if(window.LDVideoModes?.rebuildAll)rebuilt=window.LDVideoModes.rebuildAll(true)||0;
  const hook=document.querySelector('.stage-card[data-stage="HOOK"]');
  const flow=hook?.querySelector('.flow-prompt');
  if(flow&&flow.value.trim()){
    const next=polishHookPrompt(flow.value);
    if(next!==flow.value){flow.value=next;fire(flow);}
  }
  window.LDHookChoiceSystem?.render?.();
  return rebuilt;
}
function optimizeFromLastApproved(){
  const gate=evaluateFinalProduction();
  if(!gate.ok)return {ok:false,message:'Final Production Check is not complete: '+(gate.failed[0]?.detail||'finish the required checks first.')};
  const source=currentApprovedSource()||latestApprovedProject();
  if(!source)return {ok:false,message:'Finish and approve HOOK + P1–P14 first, then press Save Finished Production DNA.'};
  const profile=extractProfile(source);
  writeJson(DNA_KEY,profile);
  const current=currentTopic();
  const same=current&&current===profile.sourceTopic;
  const resigned=same?(window.LDVideoModes?.resignAll?.()||0):0;
  const rebuilt=same?0:applyCurrent();
  window.dispatchEvent(new CustomEvent('ld:production-dna-saved',{detail:{profile,sameTopic:same}}));
  return {
    ok:true,
    profile:profile,
    message:same
      ? 'Finished Production DNA saved. Approved prompts and DONE checks were preserved'+(resigned?' · '+resigned+' T2V signatures kept current':'')+'. Ready for the next disaster.'
      : 'DNA captured and applied to the current production'+(rebuilt?' · '+rebuilt+' Text-to-Video prompts refreshed':'')+'.'
  };
}
function placeRoot(root){
  const thumbnail=document.querySelector('.stage-card[data-stage="THUMBNAIL"]');
  if(thumbnail){
    thumbnail.after(root);
    return;
  }
  const pipeline=document.getElementById('pipelineSection');
  if(pipeline){
    pipeline.after(root);
    return;
  }
  document.querySelector('main')?.appendChild(root);
}
function render(){
  let root=document.getElementById('productionDnaEngine');
  if(!root){
    root=document.createElement('section');
    root.id='productionDnaEngine';
    root.className='card';
    root.style.cssText='padding:14px;margin:18px 0 14px;border:1px solid #7c3aed;';
  }
  placeRoot(root);
  const profile=activeProfile();
  root.innerHTML='<div style="display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap"><div><span class="audit-label">LD PRODUCTION DNA ENGINE</span><strong style="display:block;font-size:17px;margin-top:3px">Extract → Recreate → Polish → Validate</strong><p class="dna-summary" style="margin:6px 0 0;color:#9aa7b6;font-size:12px"></p></div><div class="dna-actions"><button type="button" class="ghost dna-recover" hidden>♻️ Recover Approved Memory</button><button type="button" class="primary dna-optimize" disabled>🧬 Save Finished Production DNA</button></div></div><div class="dna-final-check"><div class="dna-final-head"><span class="audit-label">FINAL PRODUCTION CHECK</span><strong class="dna-final-badge">Checking…</strong></div><div class="dna-final-list"></div></div><p class="dna-status" style="margin:10px 0 0;font-size:12px;color:#b8c4d1"></p><p style="margin:7px 0 0;font-size:11px;color:#8fa0b2">Save DNA only after the production is verified. The check protects Approved Memory, audit signatures, project locks, progression, Ending and Thumbnail rules before the finished cinematic DNA is captured for future episodes.</p>';
  root.querySelector('.dna-summary').textContent=summarize(profile);
  const status=root.querySelector('.dna-status');
  status.textContent=profile?'DNA profile active. New prompts can inherit the approved technique safely.':'No finished production DNA saved yet.';
  const recover=root.querySelector('.dna-recover');
  recover.addEventListener('click',function(){
    const result=recoverApprovedMemory();
    status.textContent=result.message;
    refreshFinalCheck(root);
    window.LDFinalPackage?.refresh?.();
  });
  const button=root.querySelector('.dna-optimize');
  button.addEventListener('click',function(){
    const gate=refreshFinalCheck(root);
    if(!gate.ok){status.textContent='Final Production Check must pass before DNA can be saved.';return;}
    const result=optimizeFromLastApproved();
    status.textContent=result.message;
    if(result.ok)root.querySelector('.dna-summary').textContent=summarize(result.profile);
    refreshFinalCheck(root);
  });
  refreshFinalCheck(root);

  if(!document.getElementById('ldDnaGateStyles')){
    const style=document.createElement('style');
    style.id='ldDnaGateStyles';
    style.textContent='.dna-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.dna-actions button{min-width:210px}.dna-final-check{margin:12px 0 8px;padding:11px;border:1px solid rgba(124,92,255,.45);border-radius:12px;background:rgba(124,92,255,.06)}.dna-final-head{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap}.dna-final-badge{font-size:12px}.dna-final-badge[data-state="pass"]{color:#65c28d}.dna-final-badge[data-state="warn"]{color:#f0b35f}.dna-final-list{display:grid;gap:5px;margin-top:9px}.dna-check-row{display:flex;gap:8px;justify-content:space-between;align-items:flex-start;font-size:11px}.dna-check-row span{font-weight:700}.dna-check-row small{max-width:58%;text-align:right;opacity:.78}.dna-optimize:disabled{opacity:.45;cursor:not-allowed}@media(max-width:560px){.dna-check-row{display:block}.dna-check-row small{display:block;max-width:none;text-align:left;margin:2px 0 0 22px}}';
    document.head.appendChild(style);
  }
}
window.LDProductionDNA={
  latestApprovedProject:latestApprovedProject,
  extractProfile:extractProfile,
  activeProfile:activeProfile,
  signature:signature,
  polishPrompt:polishPrompt,
  polishHookPrompt:polishHookPrompt,
  optimizeFromLastApproved:optimizeFromLastApproved,
  evaluateFinalProduction:evaluateFinalProduction,
  refreshFinalCheck:refreshFinalCheck,
  applyCurrent:applyCurrent,
  render:render,
  recoverApprovedMemory:recoverApprovedMemory
};
render();
function queueFinalCheck(){setTimeout(function(){refreshFinalCheck();},80);}
window.addEventListener('ld:production-built',function(){setTimeout(render,80);});
window.addEventListener('ld:approved-memory-saved',queueFinalCheck);
window.addEventListener('ld:project-locks-changed',queueFinalCheck);
window.addEventListener('ld:video-mode-changed',queueFinalCheck);
document.addEventListener('input',function(e){if(e.target.closest?.('#stages,#chapterVideoContext,#ldProjectLocks'))queueFinalCheck();});
document.addEventListener('change',function(e){if(e.target.closest?.('#stages,#chapterVideoContext,#ldProjectLocks'))queueFinalCheck();});
const stageRoot=document.getElementById('stages');
if(stageRoot)new MutationObserver(function(){setTimeout(render,40);}).observe(stageRoot,{childList:true});
})();

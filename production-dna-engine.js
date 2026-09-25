/* LD AUTO v3.36.4 — clearer finished-production DNA save action. */
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
function realMode(){return localStorage.getItem('ld-auto-visual-mode-v1')==='real';}
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
  if(realMode()&&u.strictBW)lines.push('VISUAL DISCIPLINE: preserve the current Real Human strict monochrome archival treatment; never allow color, sepia, tint, or selective color to return.');
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
  const source=latestApprovedProject();
  if(!source)return {ok:false,message:'Finish and approve HOOK + P1–P14 first, then press Save Finished Production DNA.'};
  const profile=extractProfile(source);
  writeJson(DNA_KEY,profile);
  const current=currentTopic();
  const same=current&&current===profile.sourceTopic;
  const rebuilt=same?0:applyCurrent();
  return {
    ok:true,
    profile:profile,
    message:same
      ? 'DNA captured from this approved production without changing its locked prompts. It is ready for the next disaster.'
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
  root.innerHTML='<div style="display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap"><div><span class="audit-label">LD PRODUCTION DNA ENGINE</span><strong style="display:block;font-size:17px;margin-top:3px">Extract → Recreate → Polish → Validate</strong><p class="dna-summary" style="margin:6px 0 0;color:#9aa7b6;font-size:12px"></p></div><button type="button" class="primary dna-optimize">🧬 Save Finished Production DNA</button></div><p class="dna-status" style="margin:10px 0 0;font-size:12px;color:#b8c4d1"></p><p style="margin:7px 0 0;font-size:11px;color:#8fa0b2">After HOOK + P1–P14 are approved, save this production’s cinematic DNA for future episodes. Only reusable cinematic technique is saved; the event name, history, location, year, causes and measurements are never copied into another disaster.</p>';
  root.querySelector('.dna-summary').textContent=summarize(profile);
  const status=root.querySelector('.dna-status');
  status.textContent=profile?'DNA profile active. New prompts can inherit the approved technique safely.':'No finished production DNA saved yet.';
  root.querySelector('.dna-optimize').addEventListener('click',function(){
    const result=optimizeFromLastApproved();
    status.textContent=result.message;
    if(result.ok)root.querySelector('.dna-summary').textContent=summarize(result.profile);
  });
}
window.LDProductionDNA={
  latestApprovedProject:latestApprovedProject,
  extractProfile:extractProfile,
  activeProfile:activeProfile,
  signature:signature,
  polishPrompt:polishPrompt,
  polishHookPrompt:polishHookPrompt,
  optimizeFromLastApproved:optimizeFromLastApproved,
  applyCurrent:applyCurrent,
  render:render
};
render();
window.addEventListener('ld:production-built',function(){setTimeout(render,80);});
const stageRoot=document.getElementById('stages');
if(stageRoot)new MutationObserver(function(){setTimeout(render,40);}).observe(stageRoot,{childList:true});
})();

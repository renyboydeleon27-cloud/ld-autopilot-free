/* NER Studio Core 4.0.1 — structured stage contracts, semantic scene fingerprints,
   prompt lifecycle freeze, family-aware planning, and project diagnostics.
   v4.0.1 fixes narration-led structural-impact classification and avoids treating
   ordinary classroom "lessons" as a historical legacy cue. */
(function(){'use strict';
if(window.NERCore4)return;
const VERSION='4.0.1';
const RESTORE_SHA='e879300bfbf5137279b4375621c05ad39255292d';
const PANEL_RE=/^P(?:[1-9]|1[0-4])$/;
const freezes=new WeakMap();
const packs=[];

function topic(){
 const typed=document.getElementById('topic')?.value?.trim();
 if(typed)return typed;
 const title=document.getElementById('projectTitle')?.textContent?.trim();
 return title&&title!=='No production yet'?title:'';
}
function stageOf(cardOrStage){return typeof cardOrStage==='string'?cardOrStage.toUpperCase():String(cardOrStage?.dataset?.stage||'').toUpperCase();}
function cardFor(stage){return document.querySelector('.stage-card[data-stage="'+stageOf(stage)+'"]');}
function narration(cardOrStage){const c=typeof cardOrStage==='string'?cardFor(cardOrStage):cardOrStage;return String(c?.querySelector?.('.narration')?.value||'').trim();}
function stageNumber(stage){const n=parseInt(stageOf(stage).replace(/\D/g,''),10);return Number.isFinite(n)?n:0;}
function hash(value){const s=String(value||'');let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}
function clone(x){try{return JSON.parse(JSON.stringify(x));}catch{return x;}}

function family(t){
 t=String(t||topic()).toLowerCase();
 try{const f=window.LDDisasterProgression?.family?.(t);if(f&&f!=='generic')return f;}catch{}
 if(/chemical attack|chemical weapon|poison gas|nerve agent|mustard gas|sarin|wmd|weapon of mass destruction/.test(t))return 'chemical-wmd';
 if(/xylazine|opioid|fentanyl|overdose|drug crisis|epidemic|pandemic|outbreak|disease/.test(t))return 'public-health';
 if(/industrial|factory|plant explosion|chemical spill|toxic leak|mine disaster|oil spill|refinery/.test(t))return 'industrial-technological';
 if(/locust|crop failure|famine|agricultural|pest outbreak/.test(t))return 'biological-agricultural';
 if(/earthquake|quake|seismic/.test(t))return 'earthquake';
 if(/tsunami|megatsunami/.test(t))return 'tsunami';
 if(/avalanche|snowslide/.test(t))return 'avalanche';
 if(/aberfan|coal[- ]?tip|coal[- ]?waste|spoil tip|landslide|mudslide|rockslide|debris flow/.test(t))return 'landslide';
 if(/cyclone|hurricane|typhoon/.test(t))return 'cyclone';
 if(/tornado|twister/.test(t))return 'tornado';
 if(/flood|dam failure|levee/.test(t))return 'flood';
 if(/volcan|eruption|lahar/.test(t))return 'volcano';
 if(/wildfire|firestorm|forest fire|urban fire/.test(t))return 'wildfire';
 return 'generic-evidence';
}

function structuralImpactNarration(text){
 const s=String(text||'').toLowerCase();
 const impact=/(?:struck|hit|smashed|crush(?:ed|ing)?|bury(?:ing|ied)?|destroy(?:ed|ing)?|structural impact|wall failure)/.test(s);
 const target=/(?:school|classroom|building|home|house|structure|wall)/.test(s);
 return impact&&target;
}
function semanticRole(text,stage,fam){
 const s=String(text||'').toLowerCase();
 const n=stageNumber(stage);
 if(/evidence|identified|investigat|document|record|archive|photograph|eyewitness|report|study|analysis/.test(s))return 'evidence';
 if(/doctor|medical|hospital|clinic|aid worker|treat|care|responder|rescue|emergency/.test(s))return 'response';
 if(/fled|escape|evacuat|displaced|homeless|shelter|refuge/.test(s))return 'displacement';
 if(structuralImpactNarration(s))return 'human-impact';
 if(/survivor|injur|wound|symptom|breath|blind|vomit|convulsion|illness|exposure/.test(s))return 'human-impact';
 if(/killed|dead|death|fatal|mortality|victim|toll/.test(s))return 'human-toll';
 if(/decades|legacy|memory|remember|memorial|warning|lessons?\s+learned|historical\s+lesson/.test(s))return 'legacy';
 if(/began|struck|released|collapsed|erupted|landfall|touchdown|breach|attack changed|first/.test(s))return 'onset';
 if(/cause|trigger|forces|entered|buildup|pressure|weather|fault|source|context/.test(s))return 'cause-context';
 if(n===1)return 'normal-world';
 if(n<=3)return 'cause-context';
 if(n<=6)return fam==='public-health'?'human-impact':'onset';
 if(n<=9)return 'human-impact';
 if(n<=12)return 'response';
 if(n<=13)return 'recovery';
 return 'legacy';
}

const LOCATION_BY_ROLE={
 'normal-world':'ordinary-local-setting',
 'cause-context':'context-setting',
 'onset':'hazard-onset-setting',
 'human-impact':'human-impact-setting',
 'human-toll':'aftermath-setting',
 'displacement':'evacuation-or-refuge-setting',
 'response':'response-or-aid-setting',
 'evidence':'evidence-review-setting',
 'recovery':'recovery-setting',
 'legacy':'legacy-setting'
};
const ACTION_BY_ROLE={
 'normal-world':'ordinary-activity','cause-context':'observe-context','onset':'react-to-onset','human-impact':'survive-or-support','human-toll':'witness-aftermath','displacement':'move-toward-safety','response':'assist-or-assess','evidence':'review-evidence','recovery':'repair-or-adapt','legacy':'reflect-or-remember'
};
const CAMERA_CYCLE=['wide-observational','lateral-human-height','three-quarter-depth','restrained-forward','side-tracking','elevated-overview','over-shoulder','locked-reflective'];
function genericSpec(cardOrStage){
 const stage=stageOf(cardOrStage),fam=family(),nar=narration(cardOrStage),role=semanticRole(nar,stage,fam),n=stageNumber(stage),structural=structuralImpactNarration(nar);
 return {
  source:'core4-generic',stage,family:fam,role,
  key:[fam,stage,role,structural?'structural-impact':''].filter(Boolean).join(':'),
  label:role,
  locationType:structural?'structural-impact-setting':LOCATION_BY_ROLE[role]||'event-appropriate-setting',
  actionType:structural?'structural-impact':ACTION_BY_ROLE[role]||'documented-action',
  cameraType:structural?'stable-impact-side-depth':CAMERA_CYCLE[(Math.max(1,n)-1)%CAMERA_CYCLE.length],
  hazardPhase:n<=2?'context':n<=5?'onset':n<=8?'impact':n<=10?'aftermath':n<=12?'response':'legacy',
  handoff:''
 };
}

function registerPack(pack){
 if(!pack||typeof pack!=='object'||typeof pack.matches!=='function'||typeof pack.spec!=='function')throw new Error('Invalid NER Core 4 event pack.');
 if(!packs.includes(pack))packs.push(pack);return pack;
}
function discoverBuiltinPack(){
 const h=window.LDHalabjaEventPanelEngine;
 if(h&&typeof h.matches==='function'&&typeof h.spec==='function'&&!packs.some(p=>p===h))packs.unshift(h);
}
function eventPack(t,stage){discoverBuiltinPack();return packs.find(p=>{try{return p.matches(t)&&(!p.manages||p.manages(t,stage));}catch{return false;}})||null;}
function inferStructuredFromEvent(sp,stage,fam){
 const key=clean(sp?.key||sp?.label||stage).toLowerCase();
 const role=clean(sp?.label||semanticRole(narration(stage),stage,fam)).toLowerCase().replace(/\s+/g,'-');
 let locationType='event-specific-setting';
 if(/courtyard/.test(key))locationType='courtyard';else if(/basement|shelter corridor/.test(key))locationType='shelter-interior';else if(/evidence|document|photo|archive/.test(key))locationType='evidence-room';else if(/street|lane|road/.test(key))locationType='street-or-road';else if(/medical|clinic|aid room/.test(key))locationType='medical-room';else if(/refuge/.test(key))locationType='refuge-interior';else if(/memorial|legacy/.test(key))locationType='legacy-site';
 return {...clone(sp),source:'event-pack',stage,family:fam,role,key:sp?.key||stage,locationType,actionType:ACTION_BY_ROLE[semanticRole(narration(stage),stage,fam)]||role,cameraType:clean(sp?.camera||'event-camera'),hazardPhase:genericSpec(stage).hazardPhase};
}
function spec(cardOrStage){
 const st=stageOf(cardOrStage);if(!PANEL_RE.test(st))return null;
 const t=topic(),fam=family(t),p=eventPack(t,st);
 if(p){try{const s=p.spec(st);if(s)return inferStructuredFromEvent(s,st,fam);}catch(e){console.warn('NER Core event pack spec failed',e);}}
 return genericSpec(cardOrStage);
}

function stripNegative(text){
 return String(text||'').split(/(?<=[.!?])\s+|\n+/).filter(x=>{
  const s=x.trim().toLowerCase();
  return s&&!/^(no\b|never\b|do not\b|don't\b|without\b|avoid\b|negative\b|absolute style negative\b|evidence guard\b|stage guard\b)/.test(s);
 }).join(' ').slice(0,1400);
}
function textFingerprint(scene){
 const s=stripNegative(scene).toLowerCase();
 const loc=[['courtyard',/courtyard|yard/],['shelter-interior',/basement|shelter|corridor/],['evidence-room',/evidence|review workroom|archive|dossier|photo desk/],['medical-room',/clinic|medical|hospital|aid room|cot/],['refuge-interior',/refuge|temporary rest|blanket|bench/],['street-or-road',/street|lane|road|market|square/],['waterfront',/pier|dock|harbor|waterfront/],['field',/field|farm|crop/],['coast',/coast|shore|beach|seawall/],['industrial',/factory|plant|refinery|mine/]];
 const act=[['review-evidence',/review|compare|document|photograph|evidence/],['move-toward-safety',/flee|evacuat|walk away|move away|escape/],['assist-or-assess',/assist|care|medical|check|rescue|support/],['survive-or-support',/breath|injur|symptom|support.*adult|unsteady/],['react-to-onset',/react|retreat|turn.*hazard|first impact|onset/],['ordinary-activity',/ordinary|normal|market basket|work routine/],['witness-aftermath',/aftermath|covered|silent|damage/]];
 const camera=[['tracking',/tracking|track alongside|follow/],['lateral',/lateral/],['forward',/forward|push/],['elevated',/elevated|high-angle|overview/],['locked',/locked|hold|nearly fixed/],['three-quarter',/three-quarter|depth/]];
 const pick=a=>(a.find(x=>x[1].test(s))||[])[0]||'';
 return {locationType:pick(loc),actionType:pick(act),cameraType:pick(camera)};
}
function fingerprint(cardOrStage){
 const c=typeof cardOrStage==='string'?cardFor(cardOrStage):cardOrStage,sp=spec(cardOrStage)||{};
 const scene=String(c?.querySelector?.('.video-scene')?.value||c?.dataset?.videoScene||sp.scene||'');
 const tf=textFingerprint(scene);
 return {
  stage:stageOf(cardOrStage),family:sp.family||family(),role:sp.role||'',
  locationType:tf.locationType||sp.locationType||'',
  actionType:tf.actionType||sp.actionType||'',
  cameraType:tf.cameraType||sp.cameraType||'',
  hazardPhase:sp.hazardPhase||'',key:String(sp.key||'')
 };
}
function sceneVarietyIssue(card){
 const st=stageOf(card),n=stageNumber(st);if(n<2)return '';
 const cur=fingerprint(card),prev=fingerprint('P'+(n-1));
 if(cur.source==='event-pack'||eventPack(topic(),st)){
  if(cur.key&&prev.key&&cur.key===prev.key)return st+' event pack repeats the exact structured scene key from P'+(n-1)+'.';
  return '';
 }
 const fields=['locationType','actionType','cameraType','role'];
 const matches=fields.filter(k=>cur[k]&&prev[k]&&cur[k]===prev[k]);
 if(matches.length>=3)return st+' structured scene fingerprint is too similar to P'+(n-1)+' ('+matches.join(', ')+').';
 return '';
}

function approved(stage){
 const c=cardFor(stage);if(c?.querySelector('.done-toggle')?.checked!==true)return null;
 return window.ldApprovedMemory?.stages?.[stage]?.latest||{stage,videoScene:String(c?.dataset?.videoScene||'')};
}
function handoff(stage){
 const st=stageOf(stage),n=stageNumber(st),sp=spec(st);if(n<=1)return 'PANEL HANDOFF MEMORY: P1 establishes the starting physical world. No earlier panel is invented as visual history.';
 if(sp?.handoff)return 'PANEL HANDOFF MEMORY: '+String(sp.handoff).replace(/^PANEL HANDOFF MEMORY:\s*/i,'');
 const prev='P'+(n-1),snap=approved(prev),pf=fingerprint(prev),cf=fingerprint(st);
 if(snap){
  const prevScene=clean(snap.continuityCanon?.scene||snap.videoScene||'').slice(0,280);
  return 'PANEL HANDOFF MEMORY: Carry forward only established facts from APPROVED '+prev+'. Previous structured scene: '+(prevScene||pf.locationType+' / '+pf.actionType)+'. '+st+' intentionally advances to '+cf.locationType+' / '+cf.actionType+'. Preserve only compatible environment, damage, lighting and recurring-object canon; do not copy the previous foreground action when the story changes sublocation or time.';
 }
 return 'PANEL HANDOFF MEMORY — CORE 4 PLANNED CONTINUITY: '+prev+' is planned as '+pf.locationType+' / '+pf.actionType+' and '+st+' advances to '+cf.locationType+' / '+cf.actionType+'. Preserve chapter-level year, location, style and compatible environment canon only. Do not invent unsupported continuity; if the previous rendered panel establishes something different, its approved canon takes priority.';
}

function currentPrompt(card){return String(card?.querySelector('.text-video-prompt')?.value||card?.dataset?.textVideoPrompt||'');}
function writePrompt(card,text){if(!card)return String(text||'');const out=String(text||'');card.dataset.textVideoPrompt=out;const f=card.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;return out;}
function freeze(card,prompt,signature){
 if(!card)return null;const text=String(prompt==null?currentPrompt(card):prompt);const rec={prompt:text,hash:hash(text),signature:String(signature||card.dataset.smartReadySignature||''),at:new Date().toISOString()};freezes.set(card,rec);card.dataset.nerCoreFrozen='1';card.dataset.nerCorePromptHash=rec.hash;return rec;
}
function unfreeze(card){if(!card)return;freezes.delete(card);delete card.dataset.nerCoreFrozen;delete card.dataset.nerCorePromptHash;}
function frozen(card){return freezes.get(card)||null;}
function enforceFrozen(card){const f=frozen(card);if(!f)return null;if(currentPrompt(card)!==f.prompt)writePrompt(card,f.prompt);return f.prompt;}

function stageContract(card){const s=spec(card);if(!s)return '';return 'NER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:\nFamily: '+s.family+'.\nRole: '+s.role+'.\nLocation type: '+s.locationType+'.\nAction type: '+s.actionType+'.\nCamera type: '+s.cameraType+'.\nHazard phase: '+s.hazardPhase+'.\nThis contract organizes continuity and local validation; it is NOT a factual source and may not invent facts beyond the approved narration/research.';}
function applyContract(card,text){
 let s=String(text||'');if(!PANEL_RE.test(stageOf(card))||!s)return s;
 const h=handoff(stageOf(card));
 if(/PANEL HANDOFF MEMORY:[^\n]*/i.test(s))s=s.replace(/PANEL HANDOFF MEMORY:[^\n]*/i,h);else if(/EPISODE CANON — CONTINUITY ENGINE:/i.test(s))s=s.replace(/EPISODE CANON — CONTINUITY ENGINE:/i,'EPISODE CANON — CONTINUITY ENGINE:\n\n'+h);
 s=s.replace(/\n\nNER CORE 4 STAGE CONTRACT[\s\S]*$/i,'');
 return s+'\n\n'+stageContract(card);
}
function validateCard(card){
 const issues=[],warnings=[];if(!card)return {ok:false,issues:['Missing stage card.'],warnings};
 const st=stageOf(card);if(!PANEL_RE.test(st))return {ok:true,issues,warnings};
 if(!narration(card))issues.push('Missing narration.');
 const sp=spec(card);if(!sp)issues.push('No StageSpec available.');
 const variety=sceneVarietyIssue(card);if(variety)issues.push(variety);
 const p=currentPrompt(card);if(p&&/No approved P\d+ handoff is available/i.test(p))warnings.push('Legacy missing-handoff sentence remains and should be replaced by Core 4 planned/approved continuity.');
 const f=frozen(card);if(f&&p!==f.prompt)issues.push('Frozen audited prompt was mutated after readiness.');
 return {ok:issues.length===0,stage:st,spec:sp,fingerprint:fingerprint(card),issues,warnings,frozen:!!f,promptHash:p?hash(p):''};
}
function diagnoseProject(){
 const cards=[...document.querySelectorAll('.stage-card')].filter(c=>PANEL_RE.test(stageOf(c)));
 const stages=cards.map(validateCard);return {version:VERSION,restoreSha:RESTORE_SHA,topic:topic(),family:family(),ok:stages.every(x=>x.ok),stages,generatedAt:new Date().toISOString()};
}

window.NERCore4=Object.freeze({
 version:VERSION,restoreSha:RESTORE_SHA,topic,family,stageOf,cardFor,registerPack,eventPack,spec,fingerprint,sceneVarietyIssue,handoff,stageContract,applyContract,validateCard,diagnoseProject,hash,freeze,unfreeze,frozen,enforceFrozen,currentPrompt,writePrompt
});
window.dispatchEvent(new CustomEvent('ner:core4-loaded',{detail:{version:VERSION,restoreSha:RESTORE_SHA}}));
})();
/* NER Studio Core 4 Stage Semantics v4.0.1
   Canonicalizes event-pack labels/family aliases into the universal Core roles
   before planners, validators, Human Life, Smart Continue and Final Audit run.
   Narration evidence may override stale generic stage labels when the current beat
   clearly advances into structural/human impact. Local only; zero API calls. */
(function(){'use strict';
if(window.NERStageSemantics4)return;
const base=window.NERCore4;if(!base)return;
const VERSION='4.0.1';
const ROLE_PHASE={
 'normal-world':'context','cause-context':'context',onset:'onset','human-impact':'impact',
 'human-toll':'aftermath',displacement:'aftermath-response',response:'response',
 evidence:'retrospective-evidence',recovery:'recovery',legacy:'legacy'
};
const ROLE_ACTION={
 'normal-world':'ordinary-activity','cause-context':'observe-context',onset:'react-to-onset',
 'human-impact':'survive-or-support','human-toll':'witness-aftermath',displacement:'move-toward-safety',
 response:'assist-or-assess',evidence:'review-evidence',recovery:'repair-or-adapt',legacy:'reflect-or-remember'
};
function clean(v){return String(v||'').replace(/\s+/g,' ').trim();}
function stageOf(x){return base.stageOf(x);}
function stageNum(x){return parseInt(String(stageOf(x)||'').replace(/\D/g,''),10)||0;}
function narration(x){const c=typeof x==='string'?base.cardFor(x):x;return String(c?.querySelector?.('.narration')?.value||'').trim();}
function canonicalFamily(value){
 const f=clean(value).toLowerCase();
 if(!f||f==='generic')return 'generic-evidence';
 if(f==='chemical'||f==='chemical-weapons'||f==='chemical/wmd'||f==='wmd')return 'chemical-wmd';
 if(f==='epidemic'||f==='public health'||f==='public_health')return 'public-health';
 if(f==='industrial'||f==='technological'||f==='industrial/technological')return 'industrial-technological';
 if(f==='insect'||f==='agricultural'||f==='biological'||f==='biological/agricultural')return 'biological-agricultural';
 return f;
}
function inferFamilyFromText(value){
 const s=String(value||'').toLowerCase();
 if(/chemical attack|chemical weapon|nerve agent|mustard gas|sarin|wmd/.test(s))return 'chemical-wmd';
 if(/xylazine|opioid|fentanyl|overdose|epidemic|pandemic|outbreak|disease/.test(s))return 'public-health';
 if(/industrial|factory|reactor|refinery|oil spill|toxic leak/.test(s))return 'industrial-technological';
 if(/locust|grasshopper|crop failure|famine|pest/.test(s))return 'biological-agricultural';
 if(/earthquake|quake|seismic/.test(s))return 'earthquake';
 if(/tsunami|megatsunami/.test(s))return 'tsunami';
 if(/avalanche|snowslide/.test(s))return 'avalanche';
 if(/aberfan|coal[- ]?waste|coal[- ]?tip|spoil tip|tip number seven|tip no\.?\s*7|landslide|mudslide|rockslide|debris flow|slope failure/.test(s))return 'landslide';
 if(/cyclone|hurricane|typhoon/.test(s))return 'cyclone';
 if(/tornado|twister/.test(s))return 'tornado';
 if(/flood|dam failure|levee breach/.test(s))return 'flood';
 if(/volcan|eruption|lahar/.test(s))return 'volcano';
 if(/wildfire|forest fire|firestorm/.test(s))return 'wildfire';
 return '';
}
function family(t){
 const text=String(t||base.topic?.()||'');
 const raw=canonicalFamily(base.family(text));
 if(raw&&raw!=='generic-evidence')return raw;
 return inferFamilyFromText(text)||raw||'generic-evidence';
}
function structuralImpactText(text,stage){
 const s=String(text||'').toLowerCase(),n=parseInt(String(stage||'').replace(/\D/g,''),10)||0;
 if(n>8)return false;
 if(/tribunal|investigat|report|evidence|record|archive|memorial|legacy/.test(s))return false;
 return /smash(?:ed|es|ing)?\s+through\s+(?:the\s+)?buildings?|struck\s+(?:the\s+)?buildings?|hit\s+(?:the\s+)?buildings?|building(?:s)?\s+(?:were\s+)?(?:crush|collapse|destroy|damage)|structures?\s+(?:were\s+)?(?:crush|collapse|destroy|damage)|gather(?:ed|ing)?\s+debris|bur(?:y|ied|ying)\s+(?:homes?|buildings?|streets?)/.test(s);
}
function inferFromText(text,stage,fam){
 const s=String(text||'').toLowerCase();
 const n=parseInt(String(stage||'').replace(/\D/g,''),10)||0;
 if(/evidence|identified|investigat|document|record|archive|photograph|eyewitness|report|study|analysis/.test(s))return 'evidence';
 if(/killed|dead|death|fatal|mortality|victim|toll/.test(s))return 'human-toll';
 if(/fled|escape|evacuat|displaced|homeless|refuge|movement toward help/.test(s))return 'displacement';
 if(/doctor|medical|hospital|clinic|aid worker|treat|care|responder|rescue|emergency/.test(s))return 'response';
 if(structuralImpactText(s,stage))return 'human-impact';
 if(/survivor|injur|wound|symptom|breath|blind|vomit|convulsion|illness|exposure|loss of consciousness/.test(s))return 'human-impact';
 if(/decades|legacy|memory|remember|memorial|warning|lesson|historical/.test(s))return 'legacy';
 if(/began|begins|struck|released|collapsed|erupted|landfall|touchdown|breach|attack changed|bombardment|first impact/.test(s))return 'onset';
 if(/cause|trigger|forces|entered|buildup|pressure|weather|fault|source|context|wartime/.test(s))return 'cause-context';
 if(n===1)return 'normal-world';
 if(n<=3)return 'cause-context';
 if(n<=6)return fam==='public-health'?'human-impact':'onset';
 if(n<=9)return 'human-impact';
 if(n<=12)return 'response';
 if(n===13)return 'recovery';
 return 'legacy';
}
function canonicalRole(raw,text,stage,fam){
 const r=clean(raw).toLowerCase().replace(/[_]+/g,'-');
 const narrative=String(text||'');
 // Narration outranks a stale generic onset label when the beat explicitly shows
 // first structural contact/damage. This prevents P5-style impact beats from being
 // forced back into the same onset fingerprint as P3/P4.
 if(structuralImpactText(narrative,stage))return 'human-impact';
 if(/normal|civilian life|ordinary|before attack|pre-disaster/.test(r))return 'normal-world';
 if(/evidence|identification|identified|eyewitness|document|investigat|photo|archive|record/.test(r))return 'evidence';
 if(/death toll|mortality|fatal|human toll|civilian death/.test(r))return 'human-toll';
 if(/escape|evacuat|displacement|movement toward help|movement-to-safety/.test(r))return 'displacement';
 if(/medical|humanitarian response|aid|care|rescue|response/.test(r))return 'response';
 if(/legacy|memory|remembrance|historical significance|warning/.test(r))return 'legacy';
 if(/recovery|cleanup|rebuild|reconstruction/.test(r))return 'recovery';
 if(/acute human|human effects|human impact|survivor|continuing harm|injur|symptom|exposure/.test(r))return 'human-impact';
 if(/onset|begins|bombardment|first impact|attack begins|chemical attack/.test(r))return 'onset';
 if(/context|wartime|cause|pre-event|background/.test(r))return 'cause-context';
 if(['normal-world','cause-context','onset','human-impact','human-toll','displacement','response','evidence','recovery','legacy'].includes(r))return r;
 return inferFromText(narrative,stage,fam);
}
function spec(x){
 const s=base.spec(x);if(!s)return s;
 const st=stageOf(x),nar=narration(x),fam=family([base.topic?.()||'',nar].join(' ')),eventRole=clean(s.eventRole||s.label||s.role||'');
 const role=canonicalRole(s.role||s.label,nar,st,fam);
 return {...s,family:fam,eventRole,role,actionType:ROLE_ACTION[role]||s.actionType,hazardPhase:ROLE_PHASE[role]||s.hazardPhase};
}
function fingerprint(x){
 const fp=base.fingerprint(x)||{},sp=spec(x)||{};
 return {...fp,source:sp.source||fp.source||'',family:sp.family||fp.family||'',role:sp.role||fp.role||'',actionType:sp.actionType||fp.actionType||'',hazardPhase:sp.hazardPhase||fp.hazardPhase||'',key:String(sp.key||fp.key||'')};
}
function sceneVarietyIssue(card){
 const st=stageOf(card),n=stageNum(card);if(n<2)return '';
 const cur=fingerprint(card),prev=fingerprint('P'+(n-1));
 if(base.eventPack(base.topic(),st))return cur.key&&prev.key&&cur.key===prev.key?st+' event pack repeats the exact structured scene key from P'+(n-1)+'.':'';
 const fields=['locationType','actionType','cameraType','role'];
 const matches=fields.filter(k=>cur[k]&&prev[k]&&cur[k]===prev[k]);
 return matches.length>=3?st+' structured scene fingerprint is too similar to P'+(n-1)+' ('+matches.join(', ')+').':'';
}
function stageContract(card){const s=spec(card);if(!s)return '';return 'NER CORE 4 STAGE CONTRACT — LOCAL STRUCTURED METADATA ONLY:\nFamily: '+s.family+'.\nRole: '+s.role+'.\nEvent beat: '+(s.eventRole||s.label||s.role)+'.\nLocation type: '+s.locationType+'.\nAction type: '+s.actionType+'.\nCamera type: '+s.cameraType+'.\nHazard phase: '+s.hazardPhase+'.\nThis contract organizes continuity and local validation; it is NOT a factual source and may not invent facts beyond the approved narration/research.';}
function stripLegacyContinuity(text){
 return String(text||'')
  .replace(/(?:^|\n)PREVIOUS APPROVED PANEL CONTINUITY REFERENCE:[^\n]*(?=\n|$)/gi,'')
  .replace(/(?:^|\n)PREVIOUS PANEL CONTINUITY REFERENCE:[^\n]*(?=\n|$)/gi,'')
  .replace(/\n{3,}/g,'\n\n');
}
function applyContract(card,text){
 let s=base.applyContract(card,text);s=stripLegacyContinuity(s);
 s=s.replace(/\n\nNER CORE 4 STAGE CONTRACT[\s\S]*$/i,'');
 return s.trim()+'\n\n'+stageContract(card);
}
function validateCard(card){
 const v=base.validateCard(card),issues=(v.issues||[]).filter(x=>!/structured scene fingerprint|event pack repeats the exact structured scene key/i.test(x));
 const variety=sceneVarietyIssue(card);if(variety)issues.push(variety);
 const p=base.currentPrompt(card),warnings=(v.warnings||[]).slice();
 if(/PREVIOUS APPROVED PANEL CONTINUITY REFERENCE:/i.test(p))warnings.push('Stale legacy previous-panel continuity reference remains; Core 4 must strip it before Flow readiness.');
 return {...v,ok:issues.length===0,spec:spec(card),fingerprint:fingerprint(card),issues,warnings};
}
function diagnoseProject(){
 const cards=[...document.querySelectorAll('.stage-card')].filter(c=>/^P(?:[1-9]|1[0-4])$/.test(stageOf(c)));
 const stages=cards.map(validateCard);return {version:VERSION,restoreSha:base.restoreSha,topic:base.topic(),family:family(base.topic()),ok:stages.every(x=>x.ok),stages,generatedAt:new Date().toISOString()};
}
const core=Object.freeze({...base,version:'4.0.5',family,spec,fingerprint,sceneVarietyIssue,stageContract,applyContract,validateCard,diagnoseProject,canonicalFamily,canonicalRole,phaseForRole:r=>ROLE_PHASE[canonicalRole(r,'','',family(base.topic()))]||''});
window.NERCore4=core;
window.NERStageSemantics4=Object.freeze({version:VERSION,canonicalFamily,canonicalRole,spec,stripLegacyContinuity,structuralImpactText,inferFamilyFromText});
window.dispatchEvent(new CustomEvent('ner:stage-semantics-ready',{detail:{version:VERSION}}));
})();
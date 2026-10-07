/* NER Studio Core 4 Semantic Guard v4.0.0
   Removes generic stage-number assumptions that conflict with the narration-derived
   semantic role. Works for every P1-P14 topic; no panel-specific rules. */
(function(){'use strict';
if(window.NERSemanticGuard4)return;
const core=window.NERCore4;if(!core)return;
const VERSION='4.0.0';
const PROFILE={
 'normal-world':{phase:'context',intensity:'1/10 · calm baseline',cast:'ordinary adults in normal life',damage:'intact baseline; no disaster damage unless explicitly established',motion:'ONE ordinary primary action plus 1–2 restrained secondary motions',physics:'ordinary human/object motion only; no disaster mechanism is visible yet'},
 'cause-context':{phase:'context',intensity:'2/10 · restrained explanatory context',cast:'small adult cast observing or establishing context',damage:'preserve only damage explicitly established by narration or approved canon',motion:'ONE contextual primary action plus 1–2 restrained secondary motions',physics:'show only the supported causal/contextual mechanism; no later-stage impact'},
 onset:{phase:'onset',intensity:'5/10 · first clear hazard onset',cast:'small number of adults recognizing the first danger',damage:'initial local change only; no unsupported peak destruction',motion:'ONE onset action plus 2–4 restrained secondary motions',physics:'show the first supported hazard change with visible cause and effect'},
 'human-impact':{phase:'impact',intensity:'7/10 · human-centered crisis',cast:'small adult cast experiencing or supporting human impact',damage:'carry forward only supported damage; human effects are primary',motion:'ONE human-centered primary action plus 2–4 restrained secondary motions',physics:'human reaction and support remain physically grounded; do not invent a new hazard mechanism'},
 'human-toll':{phase:'aftermath',intensity:'4/10 · respectful aftermath',cast:'small adult survivor/observer cast; victims remain non-graphic',damage:'aftermath state only at the level supported by narration and canon',motion:'ONE slow observational primary action plus 1–3 restrained secondary motions',physics:'aftermath is mostly settled; no renewed peak impact without evidence'},
 displacement:{phase:'aftermath-response',intensity:'5/10 · movement toward safety',cast:'small adult survivor group moving toward safety or refuge',damage:'preserve supported damage in the departure environment; do not invent new destruction',motion:'ONE evacuation/refuge action plus 2–4 restrained secondary motions',physics:'walking, carrying and support actions obey normal human motion; hazard effects remain only as established'},
 response:{phase:'response',intensity:'4/10 · focused aid/response',cast:'small adult responder/caregiver and survivor cast',damage:'response setting inherits only compatible established damage; no generic destruction requirement',motion:'ONE aid/assessment primary action plus 1–3 restrained secondary motions',physics:'period-appropriate support actions only; no unsupported procedure or renewed hazard'},
 evidence:{phase:'retrospective-evidence',intensity:'2/10 · calm retrospective evidence review',cast:'two restrained adult reviewers/observers unless the StageSpec says otherwise',damage:'NO generic disaster-damage requirement in the evidence-review sublocation; do not import attack-scene debris or remnants unless the narration explicitly establishes them',motion:'ONE non-procedural review action plus 1–2 restrained secondary motions',physics:'sealed documents/evidence and ordinary desk objects remain stable; no active hazard, impact force or disaster physics'},
 recovery:{phase:'recovery',intensity:'3/10 · restrained recovery',cast:'small adult recovery/cleanup cast',damage:'earlier supported damage persists; only deliberate cleanup or repair may change it',motion:'ONE recovery action plus 1–3 restrained secondary motions',physics:'repair/cleanup changes require visible human action; no spontaneous restoration'},
 legacy:{phase:'legacy',intensity:'1/10 · calm reflective close',cast:'one adult or small reflective group when appropriate',damage:'legacy setting follows narration and approved canon; do not force disaster remnants into a later reflective location',motion:'ONE restrained reflective movement plus 0–2 secondary motions',physics:'no active disaster mechanism; stable reflective environment'}
};
function panel(card){return !!card&&/^P(?:[1-9]|1[0-4])$/.test(String(card.dataset.stage||''));}
function profile(card){const sp=core.spec(card)||{};return PROFILE[sp.role]||PROFILE['cause-context'];}
function replaceLine(text,label,value){const re=new RegExp('(^|\\n)'+label.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'[^\\n]*','i');return re.test(text)?text.replace(re,(m,p)=>p+label+' '+value):text;}
function replaceBlockLine(text,label,value){return replaceLine(text,label,value);}
function normalize(card,text){
 if(!panel(card)||core.frozen(card))return core.frozen(card)?core.enforceFrozen(card):String(text||'');
 let s=String(text||'');if(!s)return s;
 const sp=core.spec(card)||{},p=profile(card),role=String(sp.role||'');
 s=replaceBlockLine(s,'INTENSITY:',p.intensity+'. Intensity must follow the semantic role, not the numeric panel position.');
 s=replaceBlockLine(s,'Cast profile:',p.cast+'.');
 s=replaceBlockLine(s,'Crowd level:','small cast unless the StageSpec explicitly requires otherwise.');
 s=replaceBlockLine(s,'DAMAGE MEMORY / NO-RESET RULE:',p.damage+'. Location/time changes may intentionally leave earlier damage off-screen; never add damage merely to satisfy a generic stage template.');
 s=replaceBlockLine(s,'CINEMATIC INTENSITY CURVE:','Semantic target: '+p.intensity+'. Do not escalate beyond the narration-derived role.');
 s=replaceBlockLine(s,'MOTION BUDGET:',p.motion+'. Background motion supports the primary action only.');
 s=replaceBlockLine(s,'PHYSICS AND TIME:',p.physics+'. Preserve plausible time, identity, object count and scale.');
 s=replaceBlockLine(s,'AUDIO:','Generate natural scene-specific ambience/SFX only; no generated voiceover or music. APPROVED NARRATION IS ADDED LATER IN EDITING and is not part of this T2V render.');
 s=s.replace(/PROFESSIONAL CINEMATIC AUDIO MIX:[^\n]*/gi,'PROFESSIONAL CINEMATIC AUDIO MIX: Match the semantic role "'+role+'". Use only quiet, physically motivated ambience/SFX visible or plausible in the scene. No generic rising pressure, forced peak, cinematic boom, unsupported impact, alarm, siren, dialogue, music or generated voiceover. Approved narration is post-production editorial audio.');
 s=s.replace(/DEBRIS \+ DAMAGE PHYSICS LOCK:[^\n]*/gi,role==='evidence'?'OBJECT PHYSICS LOCK: Evidence/documents and furniture remain stable and count-consistent. No disaster debris, impact force, collapse, vibration or damage is required in a retrospective evidence scene unless explicitly established by narration.':'DEBRIS + DAMAGE PHYSICS LOCK: Preserve only debris/damage behavior actually supported by this semantic role and approved canon. Never add destruction because of a generic panel-number template.');
 s=s.replace(/FIRST-FRAME \/ LAST-FRAME LOCK:[^\n]*/gi,'FIRST-FRAME / LAST-FRAME LOCK: FIRST FRAME establishes the StageSpec location, cast/object count and semantic role "'+role+'". LAST FRAME preserves those identities and geometry, showing only changes physically caused by this shot. Do not require damage, anchors or hazard effects that the StageSpec does not establish.');
 s=s.replace(/Hazard phase:\s*[^.\n]+\./i,'Hazard phase: '+p.phase+'.');
 const editorial='EDITORIAL NARRATION CONTRACT — CORE 4: The approved narration is added during final editing and is NOT generated as voiceover inside this 10-second T2V clip. Therefore "no voiceover" in AUDIO is intentional and does not conflict with narration carrying factual names, dates, statistics or conclusions.';
 s=s.replace(/\n\nEDITORIAL NARRATION CONTRACT — CORE 4:[\s\S]*?(?=\n\nNER CORE 4 STAGE CONTRACT|$)/i,'');
 if(/NER CORE 4 STAGE CONTRACT/i.test(s))s=s.replace(/\n\nNER CORE 4 STAGE CONTRACT/i,'\n\n'+editorial+'\n\nNER CORE 4 STAGE CONTRACT');else s+='\n\n'+editorial;
 card.dataset.nerCoreSemanticRole=role;card.dataset.nerCoreSemanticPhase=p.phase;
 return s;
}
function write(card,text){const out=normalize(card,text);if(!core.frozen(card))core.writePrompt(card,out);return out;}
function patch(){
 const vm=window.LDVideoModes;if(!vm||vm.__nerSemanticGuardV400)return false;
 const bp=typeof vm.prompt==='function'?vm.prompt.bind(vm):null,bb=typeof vm.build==='function'?vm.build.bind(vm):null;if(!bp||!bb)return false;
 vm.prompt=function(card){const out=bp(card);return panel(card)?write(card,out):out;};
 vm.build=function(card){const out=bb(card);return panel(card)?write(card,out):out;};
 vm.__nerSemanticGuardV400=true;return true;
}
function repair(card){if(!panel(card)||core.frozen(card))return false;patch();const out=window.LDVideoModes?.prompt?.(card)||core.currentPrompt(card);write(card,out);return true;}
window.addEventListener('ld:production-built',()=>setTimeout(patch,0));
window.addEventListener('load',()=>setTimeout(patch,0));
document.addEventListener('pointerdown',e=>{if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn')){patch();const c=window.NERCore4Bridge?.targetCard?.();if(c)repair(c);}},true);
[0,40,120,300,700].forEach(ms=>setTimeout(patch,ms));
window.NERSemanticGuard4=Object.freeze({version:VERSION,normalize,patch,repair,profile});
})();
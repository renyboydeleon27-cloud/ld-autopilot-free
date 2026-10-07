/* NER Studio Core 4 Semantic Guard v4.0.3
   Removes generic stage-number assumptions that conflict with the canonical
   narration/event semantic role. Works for every P1-P14 topic; no panel-specific rules. */
(function(){'use strict';
if(window.NERSemanticGuard4)return;
const core=window.NERCore4;if(!core)return;
const VERSION='4.0.3';
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
function esc(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function replaceLine(text,label,value){const re=new RegExp('(^|\\n)'+esc(label)+'[^\\n]*','i');return re.test(text)?text.replace(re,(m,p)=>p+label+' '+value):text;}
function syncRoleUI(card,role,phase){const el=card?.querySelector?.('.scene-role');if(el)el.textContent='Core 4 · '+role+' · '+phase;}
function audioMix(role){
 if(role==='evidence')return 'PROFESSIONAL CINEMATIC AUDIO MIX: Calm retrospective room tone only. Allow quiet cloth, paper, chair, footstep, or sealed-object contact sounds only when the specified visible action causes them. No impact events, rising pressure, tension-to-peak arc, cinematic boom, hazard sound, alarm, siren, dialogue, music, or generated voiceover. Approved narration is added later in editing.';
 if(role==='legacy')return 'PROFESSIONAL CINEMATIC AUDIO MIX: Calm reflective natural ambience only, with subtle physically motivated sounds from visible actions. No rising-pressure arc, forced peak, cinematic boom, unsupported impact, alarm, siren, dialogue, music, or generated voiceover. Approved narration is added later in editing.';
 if(role==='response')return 'PROFESSIONAL CINEMATIC AUDIO MIX: Focused period-appropriate room/environment ambience and quiet physically motivated care sounds only. No generic danger crescendo, forced peak, unsupported impact, cinematic boom, alarm, siren, dialogue, music, or generated voiceover. Approved narration is added later in editing.';
 return 'PROFESSIONAL CINEMATIC AUDIO MIX: Match the semantic role "'+role+'" and the visible scene. Use only physically motivated ambience/SFX that the shot supports. Do not impose a generic tension-to-peak arc, unsupported impact, cinematic boom, alarm, siren, dialogue, music, or generated voiceover. Approved narration is added later in editing.';
}
function replaceAudioMixBlocks(text,role){
 const replacement=audioMix(role);let s=String(text||'');
 s=s.replace(/PROFESSIONAL CINEMATIC AUDIO MIX:\s*[\s\S]*?(?=\nERA \+ ACCURACY:|\nFRAME QUALITY TEST:|\n\nEPISODE CANON — CONTINUITY ENGINE:|\n\nAUDIO:|\n\nNEGATIVE:|$)/gi,replacement+'\n');
 if(role==='evidence')s=s.replace(/rising environmental pressure with selective impacts/gi,'calm retrospective room tone').replace(/occasional physically motivated impacts/gi,'subtle specified object contact sounds').replace(/quieter tension\s*→\s*rising pressure\s*→\s*peak\s*→\s*natural decay(?: when appropriate)?/gi,'steady quiet ambience with natural decay').replace(/tension-to-peak/gi,'steady retrospective');
 return s;
}
function objectPhysics(role){
 if(role==='evidence')return 'OBJECT PHYSICS LOCK: Evidence/documents, furniture and sealed items remain stable and count-consistent. No disaster debris, impact force, collapse, vibration or damage is required unless explicitly established by narration.';
 if(['human-impact','response','displacement','human-toll','legacy'].includes(role))return 'OBJECT / ENVIRONMENT PHYSICS LOCK: Preserve only damage, debris and object motion explicitly supported by the StageSpec, narration or approved canon. Human action is primary; do not inject generic shingles, boards, collapse, flying debris or renewed impact merely because this is a disaster production.';
 return 'DEBRIS + DAMAGE PHYSICS LOCK: Preserve only debris/damage behavior actually supported by this semantic role and approved canon. Never add destruction because of a generic panel-number template.';
}
function replaceDebrisBlocks(text,role){
 const replacement=objectPhysics(role);let s=String(text||'');
 s=s.replace(/DEBRIS \+ DAMAGE PHYSICS LOCK:\s*[\s\S]*?(?=\nCINEMATIC CAMERA DIRECTOR:|\nPROFESSIONAL CINEMATIC AUDIO MIX:|\nERA \+ ACCURACY:|\nFRAME QUALITY TEST:|\n\nEPISODE CANON — CONTINUITY ENGINE:|\n\nCAMERA:|\n\nAUDIO:|\n\nNEGATIVE:|$)/gi,replacement+'\n');
 return s;
}
function normalizeEditorial(text,role){
 let s=String(text||'');
 s=s.replace(/NEW LD FORMAT — TRIAL V1:[^\n]*/i,'NEW LD FORMAT — TRIAL V1: Follow the semantic role "'+role+'" and advance one documented beat without forcing generic escalation, damage, recovery or response. Preserve event chronology, duration, style/color locks and the approved narration boundary. END NEW LD FORMAT.');
 s=replaceLine(s,'PROGRESSION DISCIPLINE:','Follow the semantic role "'+role+'" and the StageSpec chronology. Do not force continuous escalation when this beat is evidence, aftermath, response, recovery or legacy.');
 return s;
}
function normalize(card,text){
 if(!panel(card)||core.frozen(card))return core.frozen(card)?core.enforceFrozen(card):String(text||'');
 let s=String(text||'');if(!s)return s;
 const sp=core.spec(card)||{},p=profile(card),role=String(sp.role||'');
 s=window.NERStageSemantics4?.stripLegacyContinuity?.(s)||s;
 s=replaceLine(s,'Story role:',role+' · canonical narration/event semantic stage.');
 s=replaceLine(s,'Stage guard:','Follow the approved narration and StageSpec for the semantic role "'+role+'". Do not force escalation, damage, recovery, symptoms or response merely because of the numeric panel position.');
 s=replaceLine(s,'INTENSITY:',p.intensity+'. Intensity must follow the semantic role, not the numeric panel position.');
 s=replaceLine(s,'Cast profile:',p.cast+'.');
 s=replaceLine(s,'Crowd level:','small cast unless the StageSpec explicitly requires otherwise.');
 s=replaceLine(s,'DAMAGE MEMORY / NO-RESET RULE:',p.damage+'. Location/time changes may intentionally leave earlier damage off-screen; never add damage merely to satisfy a generic stage template.');
 s=replaceLine(s,'CINEMATIC INTENSITY CURVE:','Semantic target: '+p.intensity+'. Do not escalate beyond the narration/event role.');
 s=replaceLine(s,'MOTION BUDGET:',p.motion+'. Background motion supports the primary action only.');
 s=replaceLine(s,'PHYSICS AND TIME:',p.physics+'. Preserve plausible time, identity, object count and scale.');
 s=replaceLine(s,'AUDIO:','Generate natural scene-specific ambience/SFX only; no generated voiceover or music. APPROVED NARRATION IS ADDED LATER IN EDITING and is not part of this T2V render.');
 s=replaceAudioMixBlocks(s,role);
 s=replaceDebrisBlocks(s,role);
 s=normalizeEditorial(s,role);
 s=s.replace(/FIRST-FRAME \/ LAST-FRAME LOCK:[^\n]*/gi,'FIRST-FRAME / LAST-FRAME LOCK: FIRST FRAME establishes the StageSpec location, cast/object count and semantic role "'+role+'". LAST FRAME preserves those identities and geometry, showing only changes physically caused by this shot. Do not require damage, anchors or hazard effects that the StageSpec does not establish.');
 s=s.replace(/Hazard phase:\s*[^.\n]+\./i,'Hazard phase: '+p.phase+'.');
 const editorial='EDITORIAL NARRATION CONTRACT — CORE 4: The approved narration is added during final editing and is NOT generated as voiceover inside this 10-second T2V clip. Therefore "no voiceover" in AUDIO is intentional and does not conflict with narration carrying factual names, dates, statistics or conclusions.';
 s=s.replace(/\n\nEDITORIAL NARRATION CONTRACT — CORE 4:[\s\S]*?(?=\n\nNER CORE 4 STAGE CONTRACT|$)/i,'');
 if(/NER CORE 4 STAGE CONTRACT/i.test(s))s=s.replace(/\n\nNER CORE 4 STAGE CONTRACT/i,'\n\n'+editorial+'\n\nNER CORE 4 STAGE CONTRACT');else s+='\n\n'+editorial;
 card.dataset.nerCoreSemanticRole=role;card.dataset.nerCoreSemanticPhase=p.phase;syncRoleUI(card,role,p.phase);
 return s;
}
function write(card,text){const out=normalize(card,text);if(!core.frozen(card))core.writePrompt(card,out);return out;}
function patch(){
 const vm=window.LDVideoModes;if(!vm||vm.__nerSemanticGuardV403)return false;
 const bp=typeof vm.prompt==='function'?vm.prompt.bind(vm):null,bb=typeof vm.build==='function'?vm.build.bind(vm):null;if(!bp||!bb)return false;
 vm.prompt=function(card){const out=bp(card);return panel(card)?write(card,out):out;};
 vm.build=function(card){const out=bb(card);return panel(card)?write(card,out):out;};
 vm.__nerSemanticGuardV403=true;return true;
}
function repair(card){if(!panel(card)||core.frozen(card))return false;patch();const out=window.LDVideoModes?.prompt?.(card)||core.currentPrompt(card);write(card,out);return true;}
window.addEventListener('ld:production-built',()=>setTimeout(patch,0));
window.addEventListener('load',()=>setTimeout(patch,0));
document.addEventListener('pointerdown',e=>{if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn')){patch();const c=window.NERCore4Bridge?.targetCard?.();if(c)repair(c);}},true);
[0,40,120,300,700].forEach(ms=>setTimeout(patch,ms));
window.NERSemanticGuard4=Object.freeze({version:VERSION,normalize,patch,repair,profile,replaceAudioMixBlocks,replaceDebrisBlocks});
})();
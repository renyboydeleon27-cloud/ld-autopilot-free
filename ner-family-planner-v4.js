/* NER Studio Core 4 Family Planner v4.0.0
   Creates source-conservative, family-aware P1-P14 scene plans for topics that
   do not have a dedicated event pack. It uses approved narration as the factual
   boundary and never invents named places, measurements, procedures or agencies. */
(function(){'use strict';
if(window.NERFamilyPlanner4)return;
const core=window.NERCore4;if(!core)return;
const VERSION='4.0.0';
function panel(card){return !!card&&/^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage||'');}
function done(card){return card?.querySelector('.done-toggle')?.checked===true;}
function keep(card){return /^KEEP CURRENT SCENE\s*—/i.test(String(card?.dataset?.videoScene||card?.querySelector('.video-scene')?.value||''));}
function continuity(){return window.ldVideoContinuity||{};}
function setting(){const c=continuity();return [String(c.location||'the confirmed event location').trim(),String(c.year||'the confirmed event year').trim()].filter(Boolean).join(', ');}
function narration(card){return String(card?.querySelector('.narration')?.value||'').trim();}
function role(card){return core.spec(card)?.role||'documented-event-beat';}
function family(card){return core.spec(card)?.family||core.family();}
function stage(card){return String(card.dataset.stage||'');}
function modePrefix(){
 const style=window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle||'anime';
 const color=window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode||'bw';
 if(style==='anime'&&color==='bw')return 'EXACTLY 10 SECONDS, portrait 9:16, one continuous shot in strict true black-and-white grayscale 2D historical anime / graphic-novel animation. ';
 if(style==='anime')return 'EXACTLY 10 SECONDS, portrait 9:16, one continuous shot in serious 2D historical anime / graphic-novel animation. ';
 if(color==='bw')return 'EXACTLY 10 SECONDS, portrait 9:16, one continuous photorealistic historical documentary shot in strict black-and-white grayscale. ';
 return 'EXACTLY 10 SECONDS, portrait 9:16, one continuous photorealistic historical documentary shot. ';
}
const FAMILY_HAZARD={
 earthquake:'ground and structure shaking',tsunami:'abnormal coastal water movement',avalanche:'gravity-driven snow movement',landslide:'gravity-driven earth or rock movement',cyclone:'storm wind, rain and water effects',tornado:'rotating wind and debris movement',flood:'rising or flowing floodwater',volcano:'the documented volcanic process',wildfire:'fire, smoke and ember behavior','chemical-wmd':'chemical-exposure danger without operational weapon detail','public-health':'public-health harm represented through human, clinical or community evidence','industrial-technological':'the documented industrial or technological failure','biological-agricultural':'the documented biological or agricultural disruption','generic-evidence':'the documented event mechanism'
};
const LOCATION_HINT={
 'normal-world':'an ordinary historically plausible local setting before visible disaster effects',
 'cause-context':'a distinct context setting that explains the documented cause or pre-event condition without inventing unsupported mechanisms',
 onset:'a distinct event-appropriate setting where the first documented change becomes readable',
 'human-impact':'a human-centered setting where the approved narration’s immediate effect can be shown non-graphically',
 'human-toll':'a respectful aftermath setting that conveys scale without graphic imagery or invented victim counts',
 displacement:'an evacuation route, temporary refuge or movement-toward-safety setting only when supported by the narration',
 response:'a period-appropriate response, rescue, aid or care setting only at the level supported by the narration',
 evidence:'a generic evidence-review, documentation or archival context with no readable invented records or procedural reconstruction',
 recovery:'a restrained recovery or cleanup setting only when the narration establishes recovery',
 legacy:'a calm reflective legacy setting that does not introduce a new disaster beat'
};
const ACTION_HINT={
 'normal-world':'one adult performs one ordinary era-appropriate activity',
 'cause-context':'one adult observes or interacts with a non-sensitive contextual element while the wider cause remains explanatory rather than spectacular',
 onset:'one adult recognizes and reacts to the first documented hazard change',
 'human-impact':'one adult supports, steadies, shelters or responds to another adult in a restrained non-graphic way',
 'human-toll':'one survivor or observer moves slowly through the aftermath while the narration carries the factual toll',
 displacement:'a small adult group moves steadily toward safety or settles into temporary refuge',
 response:'one or two responders perform one restrained period-appropriate support or assessment action',
 evidence:'one reviewer organizes or compares sealed/non-readable evidence or documents without reconstructing technical procedure',
 recovery:'one or two adults perform one modest cleanup, repair or adaptation action',
 legacy:'one adult or small group pauses in a reflective composition while the environment carries the historical memory'
};
function familyGuard(fam,rl){
 const hazard=FAMILY_HAZARD[fam]||FAMILY_HAZARD['generic-evidence'];
 if(rl==='evidence')return 'Let narration carry technical identification and conclusions. Do not show formulas, hidden mechanisms, operational procedures, labels or invented records.';
 if(fam==='chemical-wmd')return 'No operational weapon-delivery detail, targeting, release mechanism, synthesis, mixing, formulas or tactical demonstration. Human impact and historical evidence take priority.';
 if(fam==='public-health')return 'No fantasy contagion, instant transformation, sensationalized symptoms, unsupported treatment procedure or readable patient records.';
 return 'Show only '+hazard+' at the intensity and chronology supported by this panel. Do not import a later disaster stage early.';
}
function timingFor(rl){
 if(rl==='evidence')return '0.0–2.0s establish the evidence context and one clear object/hand action; 2.0–7.0s continue one non-procedural review action; 7.0–10.0s settle and hold while narration carries the factual conclusion.';
 if(rl==='legacy')return '0.0–2.0s establish the reflective setting; 2.0–7.0s complete one restrained human or environmental movement; 7.0–10.0s hold a calm final composition.';
 return '0.0–2.0s establish the distinct setting and begin one purposeful action within the first half-second; 2.0–7.0s continue the same action with coherent cause and effect; 7.0–10.0s settle and hold before the next story beat.';
}
function plan(card){
 if(!panel(card))return null;
 const sp=core.spec(card),fam=family(card),rl=role(card),nar=narration(card);
 const loc=LOCATION_HINT[rl]||'a distinct historically plausible event-appropriate setting';
 const action=ACTION_HINT[rl]||'one adult performs one restrained action tied directly to the approved narration';
 const camera=sp?.cameraType||'restrained-human-height';
 const text=modePrefix()+setting()+'. CORE 4 FAMILY-PLANNED SCENE for '+stage(card)+'. Use '+loc+'. Primary action: '+action+'. Camera grammar: '+camera+' with stable perspective and readable foreground-midground-background depth. '+familyGuard(fam,rl)+' '+timingFor(rl)+' Factual boundary: visualize only what is supported by this panel’s approved narration and project canon; narration text is context, not spoken dialogue or on-screen text. No invented named landmark, agency, person, measurement, readable sign, technical procedure, modern object outside the era, gore, teleportation, duplication or morphing. Preserve identity, object count and geometry throughout.';
 return {version:VERSION,source:'family-planner',stage:stage(card),family:fam,role:rl,key:sp?.key||[fam,stage(card),rl].join(':'),scene:text,narrationBoundary:nar,cameraType:camera,locationType:sp?.locationType,actionType:sp?.actionType,hazardPhase:sp?.hazardPhase};
}
function apply(card,options={}){
 if(!panel(card)||done(card)||keep(card))return false;
 if(core.eventPack(core.topic(),stage(card)))return false;
 const p=plan(card);if(!p)return false;
 const raw=String(card.querySelector('.video-scene')?.value||card.dataset.videoScene||'');
 const owned=card.dataset.nerCoreSceneOwned==='1'||!raw||/^SMART RANDOM CHOICE\s*—/i.test(raw)||options.force===true;
 if(!owned)return false;
 const value='CORE 4 PLANNED SCENE — '+p.scene;
 card.dataset.videoScene=value;card.dataset.sceneChoice='';card.dataset.nerCoreSceneOwned='1';card.dataset.nerCoreSceneKey=p.key;
 const f=card.querySelector('.video-scene');if(f&&f.value!==value)f.value=value;
 return true;
}
function planAll(){let n=0;document.querySelectorAll('.stage-card').forEach(c=>{if(apply(c))n++;});return n;}
window.addEventListener('ld:production-built',()=>setTimeout(planAll,0));
window.NERFamilyPlanner4=Object.freeze({version:VERSION,plan,apply,planAll});
})();
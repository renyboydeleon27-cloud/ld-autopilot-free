/* NER HUMAN LIFE ENGINE v1.1.1
   Universal anti-doll micro-performance + life-state awareness.
   Local prompt enhancer + validator only. No API calls.
   v1.1.1 mobile performance: wrapper-only Smart Continue integration; no duplicate
   pointerdown repair and no startup timer fan-out. */
(function(){'use strict';
if(window.NERHumanLifeEngine)return;
const VERSION='1.1.1';

const ROLE_PROFILE={
 'normal-world':'soft natural blinking, calm breathing, mild gaze shifts, tiny posture settling',
 'cause-context':'subtle blinking, attentive eye movement, light brow focus, restrained breathing',
 onset:'alert eye focus, slight brow tension, brief head reaction, subtle breathing change',
 'human-impact':'restrained facial strain, cautious blinking, visible breathing, small posture adjustments',
 'human-toll':'for clearly living survivors only: slow blinking, subdued facial strain, softened shoulders and minimal tired movement',
 displacement:'natural breathing while moving, brief gaze checks, realistic weight shifts and hand settling',
 response:'focused eye tracking, calm purposeful breathing, small hand and head adjustments',
 evidence:'thoughtful expression, quiet blinking, small eye tracking, subtle breathing and hand settling',
 recovery:'measured breathing, restrained facial effort, small posture and gaze changes',
 legacy:'slow natural blinking, calm breathing, restrained reflective facial movement'
};

const BASE='HUMAN MICRO-LIFE LOCK — HIGH PRIORITY: Keep every CLEARLY LIVING visible human naturally alive through subtle realistic blinking, small eye-focus shifts, slight breathing, tiny head or posture settling, and restrained facial-expression changes appropriate to the scene. After completing the main action, clearly living characters must not freeze like dolls, statues, mannequins, or cutouts. Supporting living adults may move less but must retain minimal human life. This anti-doll rule NEVER applies to explicitly deceased people, human remains, or fully covered still casualty forms. Keep movements subtle and identity-safe: no exaggerated expressions, mechanical blinking, random twitching, head bobbing, rubbery face motion, lip movement without speech, morphing, or identity drift.';

const AFTERMATH='LIFE-STATE / AFTERMATH STILLNESS LOCK — HIGH PRIORITY: Apply HUMAN MICRO-LIFE only to clearly living survivors and helpers. Explicitly deceased people, fully covered still casualty forms, bodies, or human remains remain completely motionless for the full shot: no breathing, blinking, eye movement, twitching, blanket rise, facial motion, or posture adjustment. Never animate a covered casualty form as if alive. This life-state rule outranks the general anti-doll rule.';

const HUMAN_TOLL_MOTION='HUMAN-TOLL MOTION CLARITY: Give each clearly living foreground survivor ONE unambiguous dominant action. If the camera follows or tracks a survivor, use one continuous slow walking action until any explicitly timed final stop/hold. Do not branch between standing and walking. Covered/deceased casualty forms remain completely still.';

function isPanel(card){return !!card&&/^(HOOK|P(?:[1-9]|1[0-4])|ENDING)$/.test(String(card.dataset.stage||''));}
function hasHumans(text){return /\b(adult|adults|person|people|civilian|civilians|survivor|survivors|worker|doctor|responder|reviewer|observer|man|woman|character|characters|crowd|caregiver|helper|witness|victim|victims|casualty|casualties|bodies|body|human remains|covered forms?)\b/i.test(String(text||''));}
function rawRole(card){try{return String(window.NERCore4?.spec?.(card)?.role||card?.dataset?.nerCoreSemanticRole||'').toLowerCase();}catch{return String(card?.dataset?.nerCoreSemanticRole||'').toLowerCase();}}
function roleClass(card){
 const r=rawRole(card);
 if(/evidence|document|investigat|archive|photo|record|identif/.test(r))return 'evidence';
 if(/response|medical|aid|care|rescue/.test(r))return 'response';
 if(/displacement|evac|escape|refuge/.test(r))return 'displacement';
 if(/human.?toll|death|mortality|fatal/.test(r))return 'human-toll';
 if(/human.?impact|exposure|injur|symptom|surviv/.test(r))return 'human-impact';
 if(/legacy|memory|memorial|reflect|historical/.test(r))return 'legacy';
 if(/recovery|cleanup|repair|rebuild/.test(r))return 'recovery';
 if(/onset|attack|impact|begins|first.?danger/.test(r))return 'onset';
 if(/normal|ordinary|baseline/.test(r))return 'normal-world';
 return 'cause-context';
}
function profile(card){return ROLE_PROFILE[roleClass(card)]||ROLE_PROFILE['cause-context'];}
function normalizeHumanTollMotion(card,text){
 let s=String(text||'');
 if(roleClass(card)!=='human-toll')return s;
 s=s.replace(/\b(one\s+(?:adult\s+)?survivor)\s+stands?\s+or\s+walks?\s+slowly\b/gi,'$1 walks slowly in one continuous direction');
 s=s.replace(/\b(the\s+survivor)\s+stands?\s+or\s+walks?\s+slowly\b/gi,'$1 walks slowly in one continuous direction');
 return s;
}
function block(card){
 const role=roleClass(card);
 let out=BASE+'\nMICRO-LIFE MOOD PROFILE: '+profile(card)+'. Main action remains primary; micro-movement must never distract from it. Shot-scale rule: close/medium views prioritize blink, gaze, breath and facial tension; wide views use only subtle posture, weight and head life that can realistically read at that scale.';
 if(role==='human-toll')out+='\n'+AFTERMATH+'\n'+HUMAN_TOLL_MOTION;
 return out;
}
function stripExisting(text){return String(text||'').replace(/\n\nHUMAN MICRO-LIFE LOCK — HIGH PRIORITY:[\s\S]*?(?=\n\n(?:EDITORIAL NARRATION CONTRACT|NER CORE 4 STAGE CONTRACT|[A-Z][A-Z0-9 +/&—-]{4,}:)|$)/i,'');}
function enhance(card,prompt){
 let text=String(prompt||'');
 if(!isPanel(card)||!hasHumans(text))return text;
 text=normalizeHumanTollMotion(card,stripExisting(text).trim());
 const life='\n\n'+block(card);
 if(/\n\nEDITORIAL NARRATION CONTRACT — CORE 4:/i.test(text))return text.replace(/\n\nEDITORIAL NARRATION CONTRACT — CORE 4:/i,life+'\n\nEDITORIAL NARRATION CONTRACT — CORE 4:');
 if(/\n\nNER CORE 4 STAGE CONTRACT/i.test(text))return text.replace(/\n\nNER CORE 4 STAGE CONTRACT/i,life+'\n\nNER CORE 4 STAGE CONTRACT');
 return text+life;
}
function audit(card,prompt){
 const text=String(prompt||'');
 if(!isPanel(card)||!hasHumans(text))return {ok:true,issues:[]};
 const issues=[];
 const role=roleClass(card);
 if(!/HUMAN MICRO-LIFE LOCK/i.test(text))issues.push('Visible living humans have no Micro-Life lock.');
 if(role==='human-toll'&&/fully covered|covered still|deceased|bodies|human remains/i.test(text)&&!/LIFE-STATE \/ AFTERMATH STILLNESS LOCK/i.test(text))issues.push('Human-toll scene needs a life-state exception so deceased/covered casualty forms remain fully still.');
 if(role==='human-toll'&&/\bstands?\s+or\s+walks?\s+slowly\b/i.test(text))issues.push('Human-toll survivor action is ambiguous; choose one continuous action before camera tracking.');
 if(/\bhold\b.{0,160}\b(?:still|pose|position|composition|remain)\b/i.test(text)&&!/\b(blink|breath|breathing|gaze|eye-focus|posture settling|micro-life|deceased|covered casualty|fully still)\b/i.test(text))issues.push('Held human pose risks mannequin-style freezing or undefined life-state.');
 return {ok:issues.length===0,issues};
}
function write(card,text){
 const out=enhance(card,text);
 if(window.NERCore4?.frozen?.(card))return window.NERCore4.enforceFrozen(card)||out;
 if(window.NERCore4?.writePrompt)window.NERCore4.writePrompt(card,out);
 else {card.dataset.textVideoPrompt=out;const f=card.querySelector('.text-video-prompt');if(f)f.value=out;}
 return out;
}
function patchVideoModes(){
 const vm=window.LDVideoModes;if(!vm||vm.__nerHumanLifeV111)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){const out=nativePrompt(card);return isPanel(card)?write(card,out):out;};
 vm.build=function(card){const out=nativeBuild(card);return isPanel(card)?write(card,out):out;};
 vm.__nerHumanLifeV111=true;return true;
}
function targetCard(){return window.NERCore4Bridge?.targetCard?.()||[...document.querySelectorAll('.stage-card')].find(c=>isPanel(c)&&!c.querySelector('.done-toggle')?.checked)||null;}
function repair(card){if(!isPanel(card)||window.NERCore4?.frozen?.(card))return false;patchVideoModes();const p=window.LDVideoModes?.prompt?.(card)||window.NERCore4?.currentPrompt?.(card)||'';if(!p)return false;write(card,p);return true;}
// Smart Continue preflight is centralized in NERCore4Bridge. Human Life only wraps
// LDVideoModes once, avoiding a second full prompt rebuild on the same tap.
window.addEventListener('load',()=>queueMicrotask(patchVideoModes));
window.addEventListener('ld:production-built',()=>queueMicrotask(patchVideoModes));
window.addEventListener('ld:project-opened',()=>queueMicrotask(patchVideoModes));
patchVideoModes();
window.NERHumanLifeEngine=Object.freeze({version:VERSION,enhance,audit,block,profile,roleClass,normalizeHumanTollMotion,patchVideoModes,repair,targetCard});
window.dispatchEvent(new CustomEvent('ner:human-life-ready',{detail:{version:VERSION}}));
})();
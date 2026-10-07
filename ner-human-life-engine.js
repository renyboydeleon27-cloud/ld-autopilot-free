/* NER HUMAN LIFE ENGINE v1.0.0
   Universal anti-doll micro-performance layer for visible human characters.
   Local prompt enhancer + validator only. No API calls. */
(function(){'use strict';
if(window.NERHumanLifeEngine)return;
const VERSION='1.0.0';

const ROLE_PROFILE={
 'normal-world':'soft natural blinking, calm breathing, mild gaze shifts, tiny posture settling',
 'cause-context':'subtle blinking, attentive eye movement, light brow focus, restrained breathing',
 onset:'alert eye focus, slight brow tension, brief head reaction, subtle breathing change',
 'human-impact':'restrained facial strain, cautious blinking, visible breathing, small posture adjustments',
 'human-toll':'slow blinking, subdued facial strain, softened shoulders, minimal tired movement',
 displacement:'natural breathing while moving, brief gaze checks, realistic weight shifts and hand settling',
 response:'focused eye tracking, calm purposeful breathing, small hand and head adjustments',
 evidence:'thoughtful expression, quiet blinking, small eye tracking, subtle breathing and hand settling',
 recovery:'measured breathing, restrained facial effort, small posture and gaze changes',
 legacy:'slow natural blinking, calm breathing, restrained reflective facial movement'
};

const BASE='HUMAN MICRO-LIFE LOCK — HIGH PRIORITY: Keep every visible human naturally alive through subtle realistic blinking, small eye-focus shifts, slight breathing, tiny head or posture settling, and restrained facial-expression changes appropriate to the scene. After completing the main action, characters must not freeze like dolls, statues, mannequins, or cutouts. Supporting adults may move less but must retain minimal human life. Keep movements subtle and identity-safe: no exaggerated expressions, mechanical blinking, random twitching, head bobbing, rubbery face motion, lip movement without speech, morphing, or identity drift.';

function isPanel(card){return !!card&&/^(HOOK|P(?:[1-9]|1[0-4])|ENDING)$/.test(String(card.dataset.stage||''));}
function hasHumans(text){return /\b(adult|adults|person|people|civilian|civilians|survivor|survivors|worker|doctor|responder|reviewer|observer|man|woman|character|characters|crowd|caregiver|helper|witness)\b/i.test(String(text||''));}
function rawRole(card){
 try{return String(window.NERCore4?.spec?.(card)?.role||card?.dataset?.nerCoreSemanticRole||'').toLowerCase();}
 catch{return String(card?.dataset?.nerCoreSemanticRole||'').toLowerCase();}
}
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
function block(card){return BASE+'\nMICRO-LIFE MOOD PROFILE: '+profile(card)+'. Main action remains primary; micro-movement must never distract from it. Shot-scale rule: close/medium views prioritize blink, gaze, breath and facial tension; wide views use only subtle posture, weight and head life that can realistically read at that scale.';}
function stripExisting(text){
 return String(text||'').replace(/\n\nHUMAN MICRO-LIFE LOCK — HIGH PRIORITY:[\s\S]*?(?=\n\n(?:EDITORIAL NARRATION CONTRACT|NER CORE 4 STAGE CONTRACT|[A-Z][A-Z0-9 +/&—-]{4,}:)|$)/i,'');
}
function enhance(card,prompt){
 let text=String(prompt||'');
 if(!isPanel(card)||!hasHumans(text))return text;
 text=stripExisting(text).trim();
 const life='\n\n'+block(card);
 if(/\n\nEDITORIAL NARRATION CONTRACT — CORE 4:/i.test(text))return text.replace(/\n\nEDITORIAL NARRATION CONTRACT — CORE 4:/i,life+'\n\nEDITORIAL NARRATION CONTRACT — CORE 4:');
 if(/\n\nNER CORE 4 STAGE CONTRACT/i.test(text))return text.replace(/\n\nNER CORE 4 STAGE CONTRACT/i,life+'\n\nNER CORE 4 STAGE CONTRACT');
 return text+life;
}
function audit(card,prompt){
 const text=String(prompt||'');
 if(!isPanel(card)||!hasHumans(text))return {ok:true,issues:[]};
 const issues=[];
 if(!/HUMAN MICRO-LIFE LOCK/i.test(text))issues.push('Visible humans have no Micro-Life lock.');
 if(/\bhold\b.{0,160}\b(?:still|pose|position|composition|remain)\b/i.test(text)&&!/\b(blink|breath|breathing|gaze|eye-focus|posture settling|micro-life)\b/i.test(text))issues.push('Held human pose risks mannequin-style freezing.');
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
 const vm=window.LDVideoModes;if(!vm||vm.__nerHumanLifeV100)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){const out=nativePrompt(card);return isPanel(card)?write(card,out):out;};
 vm.build=function(card){const out=nativeBuild(card);return isPanel(card)?write(card,out):out;};
 vm.__nerHumanLifeV100=true;return true;
}
function targetCard(){return window.NERCore4Bridge?.targetCard?.()||[...document.querySelectorAll('.stage-card')].find(c=>isPanel(c)&&!c.querySelector('.done-toggle')?.checked)||null;}
function repair(card){
 if(!isPanel(card)||window.NERCore4?.frozen?.(card))return false;
 patchVideoModes();
 const p=window.LDVideoModes?.prompt?.(card)||window.NERCore4?.currentPrompt?.(card)||'';
 if(!p)return false;write(card,p);return true;
}
window.addEventListener('load',()=>setTimeout(patchVideoModes,0));
window.addEventListener('ld:production-built',()=>setTimeout(patchVideoModes,0));
document.addEventListener('pointerdown',e=>{if(e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn')){patchVideoModes();const c=targetCard();if(c)repair(c);}},true);
[0,40,120,300,700,1400].forEach(ms=>setTimeout(patchVideoModes,ms));
window.NERHumanLifeEngine=Object.freeze({version:VERSION,enhance,audit,block,profile,roleClass,patchVideoModes,repair});
window.dispatchEvent(new CustomEvent('ner:human-life-ready',{detail:{version:VERSION}}));
})();
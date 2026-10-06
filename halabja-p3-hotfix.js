/* NER Studio — Halabja P3 compatibility hotfix v1.1
   The hard preloader v2.1 is now the single source of truth. This file no
   longer runs its own repeated rebuild loop, preventing prompt mutation after
   the final audit. */
(function(){'use strict';
var VERSION='1.1';
var TOPIC_RE=/^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i;
function topic(){var typed=document.getElementById('topic')?.value?.trim();if(typed)return typed;var title=document.getElementById('projectTitle')?.textContent?.trim();return title&&title!=='No production yet'?title:'';}
function matches(){return TOPIC_RE.test(topic());}
function pre(){return window.LDHalabjaP3Preloader;}
function card(){return document.querySelector('.stage-card[data-stage="P3"]');}
function installPatch(){var p=pre();if(!p||!matches()||!window.LDVideoModes)return false;try{p.patch?.(window.LDVideoModes);return true;}catch(e){console.warn('Halabja P3 compatibility patch deferred',e);return false;}}
function repair(){var p=pre();if(!p||!matches())return false;try{return !!p.repair?.();}catch(e){console.warn('Halabja P3 compatibility repair deferred',e);return false;}}
function sanitize(text){var p=pre();return p?.sanitize?p.sanitize(text):String(text||'');}
function localValid(text){var p=pre();return p?.validPrompt?!!p.validPrompt(text):false;}
function schedule(){[0,50,150,400,900].forEach(function(ms){setTimeout(function(){installPatch();var c=card();var current=String(c?.querySelector('.text-video-prompt')?.value||c?.dataset?.textVideoPrompt||'');if(c&&!localValid(current))repair();},ms);});}
window.addEventListener('ld:production-built',schedule);window.addEventListener('load',schedule);
/* No independent click-time rebuild: preloader owns that path and is idempotent. */
if(document.readyState!=='loading')schedule();
window.LDHalabjaP3Hotfix={version:VERSION,repair:repair,sanitize:sanitize,scene:function(){return pre()?.scene||'';},localValid:localValid,installPatch:installPatch};
})();
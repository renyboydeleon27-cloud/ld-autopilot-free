/* NER Studio Core 4 Project Store v4.0.0
   Maintains one canonical Core 4 snapshot alongside legacy storage during migration.
   Legacy storage remains readable; this layer is atomic and diagnostics-first. */
(function(){'use strict';
if(window.NERProjectStore4)return;
const KEY='ner-studio-core4-db-v1';
const TMP='ner-studio-core4-db-v1:tmp';
const CORE='ld-autopilot-free-v1';
const ACTIVE='ld-autopilot-free-active-project';
const VERSION='4.0.0';
let timer=null;
function safeParse(v,fallback){try{return JSON.parse(v);}catch{return fallback;}}
function activeId(){return localStorage.getItem(ACTIVE)||'';}
function topic(){return window.NERCore4?.topic?.()||document.getElementById('topic')?.value?.trim()||'';}
function stageRows(){
 return [...document.querySelectorAll('.stage-card')].map(card=>{
  const stage=String(card.dataset.stage||'');
  const done=card.querySelector('.done-toggle')?.checked===true;
  const prompt=String(card.querySelector('.text-video-prompt')?.value||card.dataset.textVideoPrompt||'');
  return [stage,{
   status:done?'APPROVED':card.dataset.smartReady==='1'?'FLOW_READY':prompt?'COMPILED':'DRAFT',
   done,smartReady:card.dataset.smartReady==='1',
   promptHash:prompt&&window.NERCore4?.hash?.(prompt)||'',
   sceneFingerprint:window.NERCore4?.fingerprint?.(card)||null,
   approvedAt:window.ldApprovedMemory?.stages?.[stage]?.latest?.approvedAt||'',
   narration:String(card.querySelector('.narration')?.value||''),
   scene:String(card.querySelector('.video-scene')?.value||card.dataset.videoScene||'')
  }];
 });
}
function snapshot(){
 const legacy=safeParse(localStorage.getItem(CORE)||'null',null);
 return {
  schema:1,version:VERSION,activeProjectId:activeId(),topic:topic(),
  format:document.getElementById('format')?.value||legacy?.format||'shorts',
  narrativeFormat:window.ldNarrativeFormat||legacy?.narrativeFormat||'original',
  projectLocks:window.LDProjectLocks?.get?.()||window.ldProjectLocks||legacy?.projectLocks||null,
  stages:Object.fromEntries(stageRows()),
  legacyStateVersion:legacy?.version||'',updatedAt:new Date().toISOString()
 };
}
function writeAtomic(data){
 const text=JSON.stringify(data);localStorage.setItem(TMP,text);const verify=safeParse(localStorage.getItem(TMP)||'',null);
 if(!verify||verify.topic!==data.topic||verify.updatedAt!==data.updatedAt)throw new Error('Core 4 atomic snapshot verification failed.');
 localStorage.setItem(KEY,text);localStorage.removeItem(TMP);return data;
}
function syncNow(){
 if(!document.querySelector('.stage-card'))return null;
 try{const data=snapshot();writeAtomic(data);window.dispatchEvent(new CustomEvent('ner:project-store-synced',{detail:{version:VERSION,updatedAt:data.updatedAt}}));return data;}
 catch(e){console.warn('NER Core 4 project snapshot skipped',e);return null;}
}
function schedule(){clearTimeout(timer);timer=setTimeout(syncNow,180);}
function read(){return safeParse(localStorage.getItem(KEY)||'null',null);}
function clear(){localStorage.removeItem(KEY);localStorage.removeItem(TMP);}
['input','change'].forEach(type=>document.addEventListener(type,e=>{if(e.target.closest?.('#stages,.setup'))schedule();},true));
['ld:approved-memory-saved','ld:smart-ready-changed','ld:production-built','ner:core4-preflight'].forEach(name=>window.addEventListener(name,schedule));
window.addEventListener('pagehide',()=>{try{syncNow();}catch{}});
window.addEventListener('load',()=>setTimeout(syncNow,500));
window.NERProjectStore4=Object.freeze({version:VERSION,key:KEY,read,snapshot,syncNow,clear});
})();
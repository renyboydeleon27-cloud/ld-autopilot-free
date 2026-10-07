/* NER Studio Core 4 bootstrap — compatibility path formerly used by Halabja P4 hotfix.
   This file remains at the old URL so existing cached/index loaders keep working,
   but it no longer owns P4 logic. It synchronously boots the Core 4 architecture,
   canonical stage semantics, universal family planner, event packs, runtime bridge,
   semantic role guard, human micro-life performance engine, source-story map,
   canonical project store, diagnostics, and deterministic final audit. */
(function(){'use strict';
if(window.__nerCore4BootstrapFromP4)return;
window.__nerCore4BootstrapFromP4=true;
function load(src){
 if(document.readyState==='loading'){
  document.write('<script src="'+src+'"><\/script>');
  return;
 }
 var s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s);
}
if(!window.NERCore4)load('ner-core-4.js?v=4.0.0');
if(!window.NERStageSemantics4)load('ner-stage-semantics-v4.js?v=4.0.0');
if(!window.NERFamilyPlanner4)load('ner-family-planner-v4.js?v=4.0.0');
if(!window.LDHalabjaEventPanelEngine)load('halabja-event-panel-engine.js?v=1.0');
if(!window.NERCore4Bridge)load('ner-core-bridge.js?v=4.0.1');
if(!window.NERSemanticGuard4)load('ner-semantic-guard-v4.js?v=4.0.4');
if(!window.NERHumanLifeEngine)load('ner-human-life-engine.js?v=1.0.0');
if(!window.NERSourceStory4)load('ner-source-story-v4.js?v=4.0.0');
if(!window.NERProjectStore4)load('ner-project-store-v4.js?v=4.0.0');
if(!window.NERCoreDiagnostics4)load('ner-core-diagnostics.js?v=4.0.0');
if(!window.NERFinalAudit4)load('ner-final-audit-v4.js?v=4.0.0');
var version=document.querySelector('.topbar .version');if(version)version.textContent='v4.0.5';
window.LDHalabjaP4Hotfix={
 version:'core4-compat',
 repair:function(){var c=document.querySelector('.stage-card[data-stage="P4"]');return window.LDHalabjaEventPanelEngine?.repair?.(c)??false;},
 sanitize:function(text){return String(text||'');},
 validPrompt:function(){var c=document.querySelector('.stage-card[data-stage="P4"]');return c?window.LDHalabjaEventPanelEngine?.validPrompt?.(c)??true:true;},
 patch:function(){return window.LDVideoModes;},
 get scene(){return window.LDHalabjaEventPanelEngine?.spec?.('P4')?.scene||'';}
};
})();
/* NER Studio Core 4 diagnostics v4.0.0 — local only, zero API calls. */
(function(){'use strict';
if(window.NERCoreDiagnostics4)return;
const core=window.NERCore4;if(!core)return;
let root=null;
function mount(){
 if(root||document.getElementById('nerCore4Diagnostics'))return;
 const audit=document.getElementById('auditCard')||document.getElementById('pipelineSection');if(!audit)return;
 root=document.createElement('details');root.id='nerCore4Diagnostics';root.className='card compact-card';
 root.innerHTML='<summary>NER Studio Core 4 · Self Diagnostics</summary><div class="ner-core4-diag-body"><p class="ner-core4-diag-summary">Waiting for production.</p><p class="ner-core4-diag-detail"></p></div>';
 audit.parentNode.insertBefore(root,audit.nextSibling);
}
function run(){
 mount();const d=core.diagnoseProject();if(!root)return d;
 const sum=root.querySelector('.ner-core4-diag-summary'),detail=root.querySelector('.ner-core4-diag-detail');
 const bad=d.stages.filter(x=>!x.ok),warn=d.stages.flatMap(x=>x.warnings||[]),frozen=d.stages.filter(x=>x.frozen).length;
 if(!d.stages.length){sum.textContent='Core 4 active · no P1–P14 production loaded.';detail.textContent='Version '+d.version+' · restore '+d.restoreSha.slice(0,8);return d;}
 sum.textContent=(bad.length?'⚠️':'✅')+' Core 4 '+d.version+' · '+d.family+' · '+(d.stages.length-bad.length)+'/'+d.stages.length+' local stage contracts pass';
 detail.textContent='Frozen/Flow-ready prompts: '+frozen+' · Local blockers: '+bad.length+' · Warnings: '+warn.length+' · API calls used by this diagnostic: 0';
 root.dataset.state=bad.length?'warn':'pass';
 return d;
}
function schedule(){clearTimeout(schedule.t);schedule.t=setTimeout(run,120);}
['load','ld:production-built','ld:approved-memory-saved','ld:smart-ready-changed','ner:core4-preflight','ner:project-store-synced'].forEach(name=>window.addEventListener(name,schedule));
document.addEventListener('change',e=>{if(e.target.closest?.('.done-toggle,#topic,#format,#narrativeFormat'))schedule();},true);
document.addEventListener('input',e=>{if(e.target.closest?.('.narration,.video-scene,.text-video-prompt'))schedule();},true);
mount();setTimeout(run,350);
window.NERCoreDiagnostics4=Object.freeze({version:'4.0.0',run});
})();
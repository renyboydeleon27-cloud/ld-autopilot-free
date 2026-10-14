/* Core 5 mobile shared settings: presentation-only, no production-state writes. */
(function(){
'use strict';
function enhance(){
 const host=document.getElementById('chapterVideoContext');
 if(!host||host.dataset.compactReady==='1')return;
 const heading=host.querySelector('h3');
 if(!heading)return;
 host.dataset.compactReady='1';
 const details=document.createElement('details');
 details.className='core5-shared-details';
 const summary=document.createElement('summary');
 summary.textContent='Shared settings · Edit / Expand';
 summary.setAttribute('aria-label','Expand HOOK through P14 shared settings');
 const content=document.createElement('div');
 content.className='core5-shared-content';
 while(host.firstChild)content.appendChild(host.firstChild);
 details.append(summary,content);
 host.append(details);
}
function start(){
 enhance();
 const target=document.getElementById('stages')?.parentElement||document.body;
 if(!target||!window.MutationObserver)return;
 const observer=new MutationObserver(()=>{if(document.getElementById('chapterVideoContext')?.dataset.compactReady!=='1')enhance();});
 observer.observe(target,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
const style=document.createElement('style');
style.textContent='#chapterVideoContext{border:1px solid #455365!important;box-shadow:none!important;padding:10px 14px!important}#chapterVideoContext .core5-shared-details>summary{cursor:pointer;font-weight:700;padding:8px 2px;list-style:disclosure-closed}#chapterVideoContext .core5-shared-details[open]>summary{list-style:disclosure-open;margin-bottom:12px}#chapterVideoContext .core5-shared-content{min-width:0}';
document.head.appendChild(style);
})();
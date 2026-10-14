/* User-controlled PWA updates: never clear production storage or reload edits silently. */
(function(){'use strict';
function mount(){
 if(document.getElementById('appUpdateStatus'))return;
 const host=document.querySelector('.topbar');if(!host)return;
 const box=document.createElement('div'),button=document.createElement('button'),status=document.createElement('p');
 button.type='button';button.id='appUpdateButton';button.textContent='Check app update';status.id='appUpdateStatus';status.setAttribute('role','status');status.textContent='Core 5 · workflow build 5.1.1';box.append(button,status);host.append(box);
 if(!('serviceWorker' in navigator)){button.disabled=true;return;}
 let reloadReady=false,checking=false;
 function available(){reloadReady=true;button.textContent='Load available update';status.textContent='Update ready. Save and reload using this button.';}
 navigator.serviceWorker.addEventListener('controllerchange',available);
 function watch(reg){if(reg.waiting)available();reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)available();if(worker.state==='redundant')status.textContent='Update could not finish. Your current app and saved projects are retained. Check again when online.';});});}
 async function registration(){const reg=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});watch(reg);return reg;}
 button.addEventListener('click',async()=>{if(checking)return;if(reloadReady){try{window.LDCore?.saveCurrent?.();location.reload();}catch(e){status.textContent='Save failed: '+e.message;}return;}checking=true;button.disabled=true;status.textContent='Checking for an app update…';try{const reg=await registration();await reg.update();if(!reloadReady)status.textContent=reg.installing?'Downloading update. Keep this page open.':'Core 5 · workflow build 5.1.1 · update check complete.';}catch(e){status.textContent='Update check failed. Saved projects are unchanged. '+e.message;}finally{checking=false;button.disabled=false;}});
 registration().catch(()=>{});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

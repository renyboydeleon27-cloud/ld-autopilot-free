/* User-controlled PWA updates. No project reset, worker unregister, or silent reload. */
(function(){'use strict';
const BUILD='5.1.7';
function mount(){
 if(document.getElementById('appUpdateStatus'))return;
 const host=document.querySelector('.topbar');if(!host)return;
 const box=document.createElement('div'),button=document.createElement('button'),status=document.createElement('p');
 button.type='button';button.id='appUpdateButton';button.textContent='Check app update';status.id='appUpdateStatus';status.setAttribute('role','status');status.textContent='Core 5 · workflow build '+BUILD;box.append(button,status);host.append(box);
 if(!('serviceWorker' in navigator)){button.disabled=true;status.textContent+=' · updates unavailable in this browser';return;}
 let reloadReady=false,checking=false,lastCheck=0;
 const watched=new WeakSet();
 function available(){reloadReady=true;button.textContent='Load available update';status.textContent='Update ready. Save and reload using this button.';}
 function inspectController(){
  const controller=navigator.serviceWorker.controller;if(!controller)return;
  const channel=new MessageChannel(),timer=setTimeout(()=>channel.port1.close(),3000);
  channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();if(event.data?.build&&event.data.build!==BUILD)available();};
  controller.postMessage({type:'NER_GET_RELEASE'},[channel.port2]);
 }
 let hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)available();else inspectController();hadController=true;});
 function watch(reg){
  if(watched.has(reg))return;watched.add(reg);
  function installing(){const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{
   if(worker.state==='activated')inspectController();
   if(worker.state==='redundant')status.textContent='Update could not finish. Your current app and saved projects are retained. Check again when online.';
  });}
  reg.addEventListener('updatefound',installing);installing();
 }
 let registrationPromise;
 function registration(){
  if(!registrationPromise)registrationPromise=navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(reg=>{watch(reg);inspectController();return reg;}).catch(error=>{registrationPromise=null;throw error;});
  return registrationPromise;
 }
 async function check(){
  if(checking||reloadReady)return;checking=true;lastCheck=Date.now();button.disabled=true;status.textContent='Checking for an app update…';
  try{const reg=await registration();await reg.update();inspectController();if(!reloadReady)status.textContent=reg.installing?'Downloading update. Keep this page open.':'Core 5 · workflow build '+BUILD+' · update check complete.';}
  catch(e){status.textContent='Update check failed. Saved projects are unchanged. '+e.message;}
  finally{checking=false;button.disabled=false;}
 }
 button.addEventListener('click',async()=>{
  if(checking)return;
  if(reloadReady){try{
   if(document.querySelector('.stage-card')&&(!window.LDCore?.saveCurrent||window.LDCore.saveCurrent()!==true))throw Error('Project could not be saved. Keep this app open and export a backup.');
   location.reload();
  }catch(e){status.textContent='Save failed: '+e.message;}return;}
  await check();
 });
 // Installed PWAs may remain open for days. Check on return, at most once per minute.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastCheck>60000)check();});
 window.addEventListener('online',()=>{if(Date.now()-lastCheck>60000)check();});
 registration().catch(()=>{status.textContent='Update check unavailable. Saved projects are unchanged.';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

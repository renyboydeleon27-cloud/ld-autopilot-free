/* Load project storage before any application module reads saved productions. */
(async()=>{
 // Legacy modules register native ready handlers. Loading after IndexedDB must
 // still deliver those handlers once, after every module has been installed.
 const queued=[];const restore=[];
 for(const [target,event] of [[document,'DOMContentLoaded'],[window,'load']]){
  const add=target.addEventListener,remove=target.removeEventListener;
  target.addEventListener=function(type,listener,options){if(type===event){if(!queued.some(x=>x.target===target&&x.listener===listener))queued.push({target,event,listener,options});return;}return add.call(this,type,listener,options);};
  target.removeEventListener=function(type,listener,options){if(type===event){const x=queued.find(x=>x.target===target&&x.listener===listener);if(x)x.cancelled=true;return;}return remove.call(this,type,listener,options);};
  restore.push(()=>{target.addEventListener=add;target.removeEventListener=remove;});
 }
 const shell=document.querySelector('main');if(shell)shell.inert=true;
 try{
  await window.NERProjectStorage.initialize();
  for(const original of document.querySelectorAll('script[type="application/x-ner-module"]')){
   const script=document.createElement('script');for(const attr of original.attributes)if(attr.name!=='type')script.setAttribute(attr.name,attr.value);
   if(original.src){await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(Error('App file could not load: '+original.getAttribute('src')));original.replaceWith(script);});}
   else{script.textContent=original.textContent;original.replaceWith(script);}
  }
  restore.forEach(f=>f());
  for(const event of ['DOMContentLoaded','load'])for(const x of queued){if(x.event!==event||x.cancelled||x.options?.signal?.aborted)continue;const e=new Event(event);if(typeof x.listener==='function')x.listener.call(x.target,e);else x.listener?.handleEvent(e);}
  window.NERProjectStorage.mount();if(shell)shell.inert=false;
 }catch(e){restore.forEach(f=>f());const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='NER Studio paused safely: '+e.message+' No project data was cleared.';document.body.prepend(p);}
})();

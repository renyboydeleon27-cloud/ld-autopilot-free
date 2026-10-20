/* NER Studio scroll-focus preference. User controlled, off by default.
   Does not change project state, inputs, audit records or manual scrolling. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NERAutoFocus=api;
})(typeof window!=='undefined'?window:globalThis,function(root){'use strict';
 const VERSION='1.0.0',KEY='ner-studio-auto-focus-v1';
 let fallback=false,lastSaved=true;
 function enabled(){
   try{const raw=root.localStorage?.getItem(KEY);return raw==='on'?true:raw==='off'?false:fallback;}
   catch{return fallback;}
 }
 function setEnabled(next){
   fallback=!!next;lastSaved=false;
   try{root.localStorage?.setItem(KEY,fallback?'on':'off');lastSaved=!!root.localStorage;}
   catch{}
   update();
   return fallback;
 }
 function scrollTo(element,options){
   if(!enabled()||typeof element?.scrollIntoView!=='function')return false;
   element.scrollIntoView(options);return true;
 }
 function update(){
   const btn=root.document?.getElementById('nerAutoFocusToggle');
   if(!btn)return;
   const active=enabled();
   btn.textContent='AUTO SCREEN FOCUS: '+(active?'ON':'OFF');
   btn.setAttribute('aria-pressed',String(active));
   btn.setAttribute('aria-label','Automatic screen focus '+(active?'on':'off')+'. Tap to toggle.');
   btn.title=active?'Automatic panel jumps are enabled. Tap to disable.':'Screen stays where you scroll. Tap to enable automatic panel jumps.';
   btn.style.borderColor=active?'#4b9d74':'#53596a';
   const note=root.document?.getElementById('nerAutoFocusNote');
   if(note)note.textContent=active?'ON: NER may scroll to the active panel.':'OFF: no automatic jump on return, reload or Smart Continue. Manual navigation still works.'+(lastSaved?'':' (Temporary: preference could not be saved.)');
 }
 function mount(){
   const doc=root.document,panel=doc?.getElementById('ldSmartContinuePanel');
   if(!panel||doc.getElementById('nerAutoFocusToggle'))return;
   const wrapper=doc.createElement('div');wrapper.style.margin='10px 0 4px';
   const btn=doc.createElement('button');btn.type='button';btn.id='nerAutoFocusToggle';btn.className='ghost small';
   btn.style.border='1px solid #53596a';btn.style.borderRadius='9px';
   btn.style.padding='7px 11px';btn.style.fontSize='12px';
   btn.addEventListener('click',()=>setEnabled(!enabled()));
   const note=doc.createElement('div');note.id='nerAutoFocusNote';
   note.style.fontSize='11px';note.style.opacity='.78';note.style.marginTop='4px';
   wrapper.append(btn,note);
   const anchor=panel.querySelector('.ld-smart-target');
   if(anchor)anchor.after(wrapper);else panel.append(wrapper);
   update();
 }
 return Object.freeze({VERSION,KEY,enabled,setEnabled,scrollTo,mount});
});

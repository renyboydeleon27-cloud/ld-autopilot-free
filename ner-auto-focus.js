/* Removed NER Studio magnetic screen focus.
   Inert compatibility API for older cached scripts. No scroll, toggle, storage writes or project mutation. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NERAutoFocus=api;
})(typeof window!=='undefined'?window:globalThis,function(root){'use strict';
 const VERSION='2.0.0',KEY='ner-studio-auto-focus-v1';
 function disabled(){return false;}
 function mount(){
  // Remove any stale toggle left in the same DOM by earlier script versions.
  const toggle=root.document?.getElementById('nerAutoFocusToggle');
  const wrapper=toggle?.parentNode;
  if(wrapper&&wrapper.id!=='ldSmartContinuePanel')wrapper.remove();
  else toggle?.remove();
  root.document?.getElementById('nerAutoFocusNote')?.remove();
  return false;
 }
 return Object.freeze({VERSION,KEY,enabled:disabled,setEnabled:disabled,scrollTo:disabled,mount});
});

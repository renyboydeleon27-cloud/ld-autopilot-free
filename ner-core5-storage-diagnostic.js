/* Read-only storage diagnostics for Core 5 audit recovery. No deletion, writes or API calls. */
(function(){
'use strict';
const PREFIX='ner-core5-audit-v1:';
function bytes(value){return new Blob([value]).size;}
function inspectLocalStorage(){
 let total=0,auditBytes=0,auditCount=0,largest=[];
 try{
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i),value=localStorage.getItem(key)||'';
   const size=bytes(key)+bytes(value);
   total+=size;
   if(key.startsWith(PREFIX)){auditBytes+=size;auditCount++;}
   largest.push({key:key.startsWith(PREFIX)?'Core 5 audit journal': 'Other application data',bytes:size});
  }
  largest.sort((a,b)=>b.bytes-a.bytes);
  return {ok:true,totalBytes:total,auditBytes,auditCount,largest:largest.slice(0,5)};
 }catch(e){return {ok:false,error:e?.name||'Storage access failed'};}
}
async function snapshot(){
 const local=inspectLocalStorage();
 let estimate=null;
 try{if(navigator.storage?.estimate){const e=await navigator.storage.estimate();estimate={usageBytes:e.usage??null,quotaBytes:e.quota??null};}}catch{}
 let indexedDBAvailable=typeof indexedDB!=='undefined';
 return Object.freeze({local,estimate,indexedDBAvailable,readOnly:true,paidRequests:0});
}
window.NERCore5StorageDiagnostic=Object.freeze({snapshot});
})();
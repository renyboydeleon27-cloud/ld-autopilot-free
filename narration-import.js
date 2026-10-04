/* Local-only narration parsing. No network or AI calls. */
(function(root){
 'use strict';
 const ENDING='Thank you for watching. Like, share, and subscribe for more stories from the Living Disaster Book.';
 function parse(text,{silentHook=false}={}){
  const source=String(text||'').trim().replace(/^```[^\n]*\n/,'').replace(/\n```$/,'');
  if(source.length>30000)throw Error('Narration is too long. Paste only the labeled script.');
  const parts={};let current=null;
  for(const raw of source.split(/\r?\n/)){
   const line=raw.trim();if(!line)continue;
   const header=/^(HOOK|P\d+|ENDING)\s*(?::\s*(.*))?$/i.exec(line);
   if(header){
    current=header[1].toUpperCase();
    if(!/^(HOOK|P(?:[1-9]|1[0-4])|ENDING)$/.test(current))throw Error('Unsupported panel: '+current);
    if(Object.hasOwn(parts,current))throw Error('Duplicate panel: '+current);
    parts[current]=header[2]||'';
   }else{
    if(!current)throw Error('Start with a panel label, such as P1: or HOOK:.');
    parts[current]+=(parts[current]?' ':'')+line;
   }
  }
  const result={};
  if(silentHook){
   if(parts.HOOK&&!/^\[?SILENT\]?$/i.test(parts.HOOK))throw Error('This project has a silent HOOK. Remove its spoken narration or use HOOK: [SILENT].');
   result.HOOK='';
  }else{
   if(!parts.HOOK||/^\[?SILENT\]?$/i.test(parts.HOOK))throw Error('This project requires HOOK narration. Follow its current hook settings.');
   result.HOOK=parts.HOOK;
  }
  for(let i=1;i<=14;i++){
   const k='P'+i;if(!parts[k]?.trim())throw Error('Missing narration: '+k);
   if(parts[k].length>1800)throw Error(k+' is too long for a Shorts panel.');
   result[k]=parts[k].trim();
  }
  // Normalize pasted ending wording to the channel CTA; never block a complete script.
  // This also keeps production notes such as NO NARRATION out of the spoken text.
  result.ENDING=ENDING;
  return result;
 }
 const api={parse,ENDING};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LDNarrationImport=api;
})(typeof window!=='undefined'?window:globalThis);

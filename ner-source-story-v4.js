/* NER Studio Core 4 Source-to-Story layer v4.0.0
   Treats approved narration as the factual boundary for local planning. It does
   not invent missing facts and uses zero API calls. Research/narration systems
   remain responsible for sourcing; this layer turns those facts into a stable
   semantic story map for P1-P14. */
(function(){'use strict';
if(window.NERSourceStory4)return;
const core=window.NERCore4;if(!core)return;
const VERSION='4.0.0';
function cards(){return [...document.querySelectorAll('.stage-card')].filter(c=>/^P(?:[1-9]|1[0-4])$/.test(c.dataset.stage||''));}
function words(text){return new Set(String(text||'').toLowerCase().match(/[a-z0-9]+/g)||[]);}
function similarity(a,b){const A=words(a),B=words(b);if(!A.size||!B.size)return 0;let i=0;A.forEach(x=>{if(B.has(x))i++;});return i/(A.size+B.size-i);}
function map(){
 const rows=cards().map(card=>{
  const stage=card.dataset.stage||'',nar=String(card.querySelector('.narration')?.value||'').trim(),sp=core.spec(card);
  return {stage,narration:nar,role:sp?.role||'',family:sp?.family||core.family(),locationType:sp?.locationType||'',actionType:sp?.actionType||'',hazardPhase:sp?.hazardPhase||'',hasSourceBoundary:!!nar};
 });
 rows.forEach((row,i)=>{row.similarityToPrevious=i?similarity(rows[i-1].narration,row.narration):0;});
 return rows;
}
function validate(){
 const rows=map(),issues=[],warnings=[];
 rows.forEach((r,i)=>{
  if(!r.narration)issues.push(r.stage+': narration/source boundary is missing; Core 4 will not invent this beat.');
  if(r.similarityToPrevious>0.78)warnings.push(r.stage+': narration is highly similar to '+rows[i-1].stage+'; review for repetition.');
 });
 const roles=rows.map(x=>x.role);
 const legacyIndex=roles.findIndex(x=>x==='legacy'),onsetIndex=roles.findIndex(x=>x==='onset');
 if(legacyIndex>=0&&onsetIndex>=0&&legacyIndex<onsetIndex)issues.push('Chronology conflict: a legacy beat appears before the first onset beat.');
 const evidenceCount=roles.filter(x=>x==='evidence').length;
 if(evidenceCount>4)warnings.push('Many evidence/meta panels detected; consider returning more beats to direct event/human chronology if sources support it.');
 return {version:VERSION,ok:issues.length===0,topic:core.topic(),family:core.family(),coverage:rows.length?rows.filter(x=>x.hasSourceBoundary).length/rows.length:0,rows,issues,warnings};
}
function stamp(){const result=validate();result.rows.forEach(r=>{const c=core.cardFor(r.stage);if(c){c.dataset.nerStoryRole=r.role;c.dataset.nerStoryPhase=r.hazardPhase;}});window.nerStoryMap=result;window.dispatchEvent(new CustomEvent('ner:source-story-updated',{detail:result}));return result;}
let t=null;function schedule(){clearTimeout(t);t=setTimeout(stamp,160);}
window.addEventListener('ld:production-built',schedule);window.addEventListener('ld:approved-memory-saved',schedule);document.addEventListener('input',e=>{if(e.target.closest?.('.narration'))schedule();},true);setTimeout(stamp,450);
window.NERSourceStory4=Object.freeze({version:VERSION,map,validate,stamp});
})();
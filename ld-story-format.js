/* Opt-in storytelling policy. Legacy projects always resolve to Original LD. */
(()=>{'use strict';
const normalize=value=>value==='causal-v1'?'causal-v1':'original';
const label=value=>normalize(value)==='causal-v1'?'New LD Format · Trial v1':'Original LD';
const enabled=()=>window.ldNarrativeFormat==='causal-v1'&&(window.ldProductionCategory||'disaster')==='disaster';
const beats=[
'Introduce an evidence-supported human activity or place that gives the viewer something to care about; preserve the calm opening.',
'Explain the supported source of danger; add information rather than repeating the establishing scene.',
'Show the next documented change or trigger, connecting cause to its immediate effect.',
'Make the hazard’s arrival or development legible in space; preserve the event-specific chronology.',
'Show one new consequence of the preceding escalation, not the same failure from another angle.',
'Make the assigned major impact readable through one dominant action, with plausible scale.',
'Expand the consequences to a distinct affected place or supported secondary hazard.',
'Advance to the next documented stage of danger; do not reset damaged objects or replay peak impact.',
'Reveal a specific consequence of the impact as the story enters its assigned aftermath beat.',
'Use an evidence-supported survival or response action with a clear goal and obstacle.',
'Show a distinct documented displacement or relief consequence without repeating rescue.',
'Connect the physical damage to a supported lasting disruption.',
'Show a specific supported recovery step, avoiding an invented instant recovery.',
'Close on a supported legacy or lesson tied to what the viewer has seen.'
];
function guidance(stage,format='shorts'){
 if(!enabled()||['HOOK','ENDING','THUMBNAIL'].includes(stage))return '';
 const n=Number(stage.slice(1));
 const publicHealth=window.LDPublicHealthPolicy?.matches?.(document.getElementById('topic')?.value||'')===true;
 const publicHealthBeat='Advance the approved narration with one distinct, evidence-supported public-health context or consequence. Do not impose a natural-disaster danger, impact, damage, aftermath, relief, or recovery stage.';
 const beat=publicHealth?publicHealthBeat:(format==='shorts'?beats[n-1]:'Advance the assigned longform scene role with one new evidence-supported action or consequence; avoid repeating adjacent scenes.');
 if(!beat)return '';
 return 'NEW LD FORMAT — TRIAL V1: '+beat+' CAUSAL FLOW: Make the connection to the preceding beat understandable without inventing a cause. Every panel adds a new development, consequence, or meaningful piece of context. Vary framing to serve the action. '+(publicHealth?'Public-health intensity follows the approved narration; do not manufacture disaster escalation.':'Build intensity across the assigned timeline; calm stays calm, peak impact is not repeated in every panel.')+' Event-specific facts and approved stage chronology override this editorial guidance. Preserve duration, visual/color locks, one-shot rules, and selected hook. Narration explains supported causes and stakes in natural language; no generic repeated filler. END NEW LD FORMAT.';
}
function decorate(text,stage,format){const g=guidance(stage,format);return g?text+'\n\n'+g:text;}
function reset(){window.ldNarrativeFormat='original';window.ldApprovedMemory=null;const el=document.getElementById('narrativeFormat');if(el){el.value='original';el.disabled=false;}document.getElementById('ldFlowReview')?.remove();}
function review(){
 document.getElementById('ldFlowReview')?.remove();if(!enabled())return;
 const box=document.createElement('details');box.id='ldFlowReview';box.className='card';
 const summary=document.createElement('summary');summary.textContent='New LD Format · Review flow before generation';box.appendChild(summary);
 const help=document.createElement('p');help.textContent='Review each beat before spending credits: What changed? Why does it follow the previous scene? Is it supported by the event evidence? Keep duration and visual settings comparable across trials.';box.appendChild(help);
 const refresh=document.createElement('button');refresh.type='button';refresh.className='ghost small';refresh.textContent='Refresh flow review';box.appendChild(refresh);
 const list=document.createElement('div');box.appendChild(list);
 function fill(){list.replaceChildren();for(const card of document.querySelectorAll('.stage-card')){const stage=card.dataset.stage;if(!/^[PS]\d+$/.test(stage))continue;const row=document.createElement('p');const heading=document.createElement('strong');heading.textContent=stage+' — '+(card.querySelector('.scene-role')?.textContent||'');row.appendChild(heading);row.appendChild(document.createElement('br'));row.appendChild(document.createTextNode(card.querySelector('.narration')?.value.trim()||'Narration pending — review this beat before generation.'));list.appendChild(row);}}
 refresh.onclick=fill;fill();document.getElementById('pipelineSection')?.before(box);
}
window.LDStoryFormat=Object.freeze({normalize,label,enabled,guidance,decorate,reset,review});
window.addEventListener('ld:production-built',review);
})();

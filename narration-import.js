/* Local-only narration parsing. No network or AI calls. */
(function(root){
 'use strict';
 const ENDING='Please like, share, and subscribe for more Living Disaster stories.';
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

 // Original LD V1 is opt-in per imported project. Existing approved/legacy projects
 // never gain this guard merely because their narrative format defaults to "original".
 const STORY_VERSION='original-ld-v1-story-lock-1.0';
 const STORY_PREFIX='ner-original-v1-story-lock:';
 const STAGES=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
 const BEATS=Object.freeze({
  HOOK:'What if? · viewer-centered survival teaser',
  P1:'Peaceful life before disaster',
  P2:'First warning / disturbance',
  P3:'Main disaster onset',
  P4:'Escalation',P5:'Escalation',P6:'Peak impact',
  P7:'Human consequences',P8:'Survival',P9:'Human impact',
  P10:'Wider consequences',P11:'Wider consequences',
  P12:'Aftermath / response',P13:'Recovery / aftermath',
  P14:'Historical legacy',ENDING:'Approved CTA'
 });
 const CALM=/\b(?:calm|peaceful(?:ly)?|quiet|ordinary|everyday|daily|normal|famil(?:y|ies)|children|school|market|routine|worked|working|residents|villagers|fishermen|commuters|life continued|life moved)\b/i;
 const EARLY_DAMAGE=/\b(?:earthquakes? (?:had )?struck|shaking (?:began|hit)|already[- ]damaged|(?:homes?|buildings?|communities|streets?|towns?) (?:were|had been) (?:damaged|destroyed|flattened)|aftershocks?|aftermath|rubble|ruins|collapsed (?:houses|homes|buildings)|disaster (?:struck|hit|began))\b/i;
 const WARNING=/\b(?:first|warning|unusual|disturb|tremor|foreshock|quake|earthquakes?|shak(?:e|ing)|rumbl\w*|fault|seismic|crack|storm|darken|smoke|wind|rain|water|danger|threat|pressure|ash|fire|waves?|surge|approach|collapse|outbreak|began)\b/i;
 const ONSET=/\b(?:struck|hit|began|begins|ruptur\w*|unleash\w*|collaps\w*|erupt\w*|explod\w*|explosion|surg\w*|swept|reached|broke|landfall|released|flooded|touched down|made landfall|tore through|slammed)\b/i;
 function reviewOriginalV1(parts){
  const p=parts||{},issues=[],warnings=[];
  const hook=String(p.HOOK||''),p1=String(p.P1||''),p2=String(p.P2||''),p3=String(p.P3||'');
  if(!/\b(?:you|your|what if|imagine)\b/i.test(hook)||!hook.includes('?'))issues.push('HOOK: ask a direct viewer-centered "What if ... you?" survival question.');
  if(!CALM.test(p1))issues.push('P1: describe peaceful everyday life before the first disaster disturbance.');
  // Ignore explicitly hypothetical foreshadowing ("before the earthquake struck").
  const actualP1=p1.replace(/\b(?:before|unaware (?:that|of)|without knowing)\b[^.!?]{0,75}\b(?:struck|began|collapsed)\b/gi,'');
  if(EARLY_DAMAGE.test(actualP1))issues.push('P1: narration already shows earthquake damage, shaking, or aftermath. Move this beat to P2 or later.');
  if(!WARNING.test(p2))issues.push('P2: describe a sourced first warning, disturbance, or danger buildup (do not invent an actual warning).');
  if(!ONSET.test(p3))issues.push('P3: narrate the documented main disaster onset rather than another calm/context-only beat.');
  for(const stage of STAGES)if(!String(p[stage]||'').trim()&&stage!=='ENDING')issues.push(stage+': narration is missing.');
  if(String(p.P14||'').trim().length<25)warnings.push('P14: review whether the final narration gives a meaningful historical conclusion.');
  return {version:STORY_VERSION,ok:issues.length===0,issues,warnings,beats:BEATS};
 }
 // Negative render constraints such as "no shaking, floodwater, rubble or panic"
 // describe what the model MUST NOT show. A prohibition is not scene evidence.
 // Stop at a sentence or contrast ("but", "however") so real positive damage
 // later in the scene remains blocked by the exact same safety rule.
 function positiveSceneClaims(scene){
  return String(scene||'').replace(/\b(?:no|without|free of|absence of|avoid(?:ing)?|never show|do not (?:show|include|depict|generate|add))\s+(?:(?!(?:but|yet|however|although)\b)[^.;:\n]){0,130}/gi,' ');
 }
 function sceneIssues(stage,narration,scene){
  const issues=[],s=String(scene||''),positive=positiveSceneClaims(s);
  if(stage==='P1'&&/\b(?:already[- ]damaged|ruins?|rubble|wreckage|settled debris|collapsed (?:buildings|houses|homes|walls)|shattered buildings|destroyed buildings|falling masonry|active shaking)\b/i.test(positive)){
   issues.push('P1: the scene shows disaster damage or shaking, but Original LD V1 requires a peaceful intact setting.');
  }
  if(stage==='P3'&&/\b(?:peaceful (?:life|street|village)|quiet everyday|intact ordinary street with no shaking)\b/i.test(s)&&!/\b(?:ruptur|struck|surge|eruption|collapse)\b/i.test(s)){
   issues.push('P3: main-onset narration must not produce a purely peaceful scene.');
  }
  return issues;
 }
 function storage(){try{return root.localStorage||(typeof localStorage!=='undefined'?localStorage:null);}catch{return null;}}
 function scope(topic,format){
  return (storage()?.getItem('ld-autopilot-free-active-project')||'')||[String(topic||''),String(format||'shorts')].join('|');
 }
 function storyKey(topic,format){return STORY_PREFIX+JSON.stringify([scope(topic,format),String(topic||''),String(format||'shorts')]);}
 function activateStoryLock(topic,format){
  const s=storage();if(!s)throw Error('Story Lock requires available project storage. Previous narration was preserved.');
  const key=storyKey(topic,format),record={version:STORY_VERSION,topic:String(topic||''),format:String(format||''),scope:scope(topic,format)};
  s.setItem(key,JSON.stringify(record));
  if(s.getItem(key)!==JSON.stringify(record))throw Error('Story Lock could not be verified in project storage.');
  return record;
 }
 function storyLockActive(topic,format){
  const s=storage();if(!s)return false;
  try{const r=JSON.parse(s.getItem(storyKey(topic,format))||'null');return !!r&&r.version===STORY_VERSION&&r.topic===topic&&r.format===format&&r.scope===scope(topic,format);}catch{return false;}
 }
 function clearStoryLock(topic,format){storage()?.removeItem(storyKey(topic,format));}
 const storyLock=Object.freeze({VERSION:STORY_VERSION,STAGES,BEATS,review:reviewOriginalV1,sceneIssues,activate:activateStoryLock,active:storyLockActive,clear:clearStoryLock});

 const api={parse,ENDING,storyLock};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LDNarrationImport=api;
})(typeof window!=='undefined'?window:globalThis);

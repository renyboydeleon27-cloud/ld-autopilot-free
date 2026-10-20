/* NER Studio Video DNA Memory V1 — local-only, opt-in. Never alters a saved stage. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NERVideoDNA=api;
})(typeof window!=='undefined'?window:globalThis,function(root){'use strict';
 const VERSION='1.0.0', KEY='ner-video-dna-library-v1', MAX=200;
 const FAILURES=Object.freeze({
  'quake-not-visible':'Earthquake looks like wind / sound only',
  'static-poles':'Utility poles/wires not reacting',
  'floating-leaves':'Floating leaves dominate the earthquake',
  'early-dust':'Dust/smoke visible at the first frame',
  'smoke-cloud':'Dust too thick; resembles fire/smoke',
  'frozen-actor':'Character stops reacting during shaking',
  'camera-reset':'Wrong scene order, cut or repeated subjects',
  'other':'Other observed render failure'
 });
 const LESSONS=Object.freeze([
  'Earthquake: show ground-driven character imbalance and nearby structural responses; sound alone is insufficient.',
  'Earthquake: utility poles and cables should react physically when visible; avoid rubber-like building deformation.',
  'Earthquake: keep any falling fragments local and proportional to historical setting.',
  'Dust: appear only after falling material or crumbling, rise locally and dissipate; avoid dense smoke at time zero.',
  'Earthquake: do not substitute drifting leaves or wind effects for ground vibration.',
  'One-shot progression: starting reference image must be the first beat, not the ending beat; no scene resets.'
 ]);
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 function signature(s){let x=2166136261;for(const c of clean(s)){x^=c.charCodeAt(0);x=Math.imul(x,16777619);}return(x>>>0).toString(36);}
 function empty(){return {version:VERSION,records:[]};}
 function valid(r){return r&&typeof r==='object'&&['master','failure'].includes(r.kind)&&typeof r.prompt==='string'&&r.prompt.trim().length>12&&r.prompt.length<40000&&typeof r.topic==='string'&&typeof r.stage==='string'&&typeof r.family==='string'&&typeof r.hash==='string'&&Number.isFinite(r.grade)&&r.grade>=0&&r.grade<=10&&(r.kind==='master'?r.grade>=9:r.grade<9)&&(!r.reason||Object.hasOwn(FAILURES,r.reason));}
 function parse(raw){if(!raw)return empty();const obj=JSON.parse(raw);if(obj?.version!==VERSION||!Array.isArray(obj.records)||obj.records.length>MAX||obj.records.some(r=>!valid(r)))throw Error('Unrecognized Video DNA library. Existing records were not changed.');return obj;}
 function storage(){return root.localStorage;}
 function list(){return parse(storage().getItem(KEY)).records.slice();}
 function save({kind,topic,stage,family,prompt,grade,reason='',notes='' }){
  const data=parse(storage().getItem(KEY)); const text=String(prompt||'').trim(),g=Number(grade);
  const entry={kind,topic:String(topic||''),stage:String(stage||''),family:String(family||''),prompt:text,hash:signature(text),grade:g,reason:kind==='failure'?reason:'',notes:String(notes||'').slice(0,1000),createdAt:new Date().toISOString()};
  if(!valid(entry))throw Error('Invalid DNA: choose an exact prompt and a grade (master 9.0+, failure below 9.0), plus a failure reason.');
  if(kind==='failure'&&!Object.hasOwn(FAILURES,reason))throw Error('Select a known failure reason.');
  const existing=data.records.find(r=>r.kind===entry.kind&&r.stage===entry.stage&&r.topic===entry.topic&&r.hash===entry.hash&&(kind==='master'||r.reason===entry.reason));
  if(existing)return {record:existing,existing:true};
  if(data.records.length>=MAX)throw Error('DNA library is full. Export a backup before expanding capacity; no records were deleted.');
  entry.id='dna-'+signature([entry.createdAt,entry.topic,entry.stage,entry.hash,data.records.length].join('|'));
  data.records.push(entry);
  storage().setItem(KEY,JSON.stringify(data));
  // Verify the durable write. Never say "saved" on quota errors.
  if(!parse(storage().getItem(KEY)).records.some(r=>r.id===entry.id))throw Error('DNA save could not be verified. No approval status was changed.');
  return {record:entry,existing:false};
 }
 function importRecords(raw){
  const incoming=parse(raw),current=parse(storage().getItem(KEY)),byId=new Set(current.records.map(r=>r.id));
  const added=incoming.records.filter(r=>!byId.has(r.id));
  if(current.records.length+added.length>MAX)throw Error('Import exceeds DNA memory capacity. No changes made.');
  const newData={version:VERSION,records:current.records.concat(added)};
  storage().setItem(KEY,JSON.stringify(newData));
  if(parse(storage().getItem(KEY)).records.length!==newData.records.length)throw Error('Import verification failed.');
  return added.length;
 }
 function exportText(){return JSON.stringify({version:VERSION,records:list()},null,2);}
 function hasVisibleCue(p){return /(?:ground|pavement|feet|knees|stance|railing|utility pole|cable|wire|roof|wall|structure|building|fixture|furniture)[^.\n]{0,100}(?:shak|vibrat|trembl|rattl|oscillat|sway|brac|jolt|crack|crumbl)|(?:shak|vibrat|trembl|rattl|oscillat|sway|brac|jolt)[^.\n]{0,90}(?:ground|pavement|feet|knees|stance|railing|utility pole|cable|wire|roof|wall|building)/i.test(p);}
 function isNegated(s){return /(?:^|[\s:;,])(?:no|without|never|avoid|do not|must not|not)\s+(?:visible\s+|any\s+|thick\s+|dense\s+|floating\s+){0,3}$/i.test(s.slice(-85));}
 function openingDust(prompt){
  const lines=String(prompt||'').split(/\n/);
  return lines.some(line=>{
   const opening=/(?:starting[- ]frame|first frame|opening frame|0\s*[–-]\s*2s|at\s+(?:second\s+)?zero|at\s+the\s+start)/i.exec(line);
   if(!opening)return false;
   const rest=line.slice(opening.index);
   const thick=/\b(?:thick|dense|heavy|opaque)\s+(?:dust|smoke)\b/i.exec(rest);
   return !!thick&&!isNegated(rest.slice(0,thick.index))&&!/\b(?:absent|none|minimal|only after|must not|should not|no)\b/i.test(rest.slice(Math.max(0,thick.index-35),thick.index))&&!/\b(?:is|are|remains?|stays?)\s+(?:absent|not visible|missing|minimal)\b/i.test(rest.slice(thick.index+thick[0].length,thick.index+thick[0].length+55));
  });
 }
 function check({topic='',stage='',family='',prompt=''}={}){
  const p=String(prompt||''), problems=[],warnings=[],matches=[];
  const context=clean([topic,stage,p.slice(0,500)].join(' '));
  let records=[];
  try{records=list();}catch(e){return {status:'warning',problems:[],warnings:['DNA storage unavailable or invalid: '+e.message],matches:[],lessons:LESSONS};}
  const hash=signature(p);
  const same=records.filter(r=>r.hash===hash&&r.kind==='failure');
  for(const r of same)problems.push('This exact prompt was previously rejected ('+(FAILURES[r.reason]||'observed render failure')+'). Review the failure DNA before any paid audit.');
  // Explicit damage at second zero is a reliable text-only blocker; missing video motion is not.
  if(openingDust(p))problems.push('Opening frame requests dense dust/smoke. Start clear and make localized dust appear after damage.');
  const earthquake=/(?:earthquake|mainshock|quake|strong shaking)/i.test(context)&&/^P(?:2|3|4)$/.test(stage);
  if(earthquake&&!hasVisibleCue(p))warnings.push('No clear foreground ground-driven motion cue. Add body imbalance and synchronized visible environmental response.');
  if(earthquake&&/leaves?|foliage/i.test(p)&&!/ground|pavement|railing|pole|cable|wire/i.test(p))warnings.push('Foliage is the main visible motion cue; the scene may read as wind rather than shaking.');
  if(earthquake&&/\bdust\b/i.test(p)&&!/gradual|dispers|dissipat|thin|fade|after|crumbl|fall|damage|later/i.test(p))warnings.push('Dust timing is unspecified: rise from actual debris and disperse, not continuous smoke.');
  for(const r of records){if(r.kind!=='master')continue;if(r.family&&family&&r.family!==family)continue;if(r.stage===stage||r.family===family)matches.push({id:r.id,topic:r.topic,stage:r.stage,grade:r.grade});}
  return {status:problems.length?'block':warnings.length?'warning':'pass',problems,warnings,matches:matches.slice(-5),lessons:LESSONS};
 }
 function assertReady(context){
  const r=check(context);
  if(r.status==='block')throw Error('FREE VIDEO DNA BLOCK: '+r.problems.join(' ')+' No paid audit was sent.');
  return r;
 }
 function fromCard(card){
  const topic=root.document?.getElementById('topic')?.value||'',stage=card?.dataset?.stage||'';
  const prompt=card?.querySelector('.text-video-prompt')?.value||card?.dataset?.textVideoPrompt||card?.querySelector('.flow-prompt')?.value||'';
  const family=root.NERCore5?.family?.(topic)||'unknown';
  return {topic,stage,family,prompt};
 }
 function mount(){
  const doc=root.document,smart=doc?.getElementById('ldSmartContinuePanel');
  if(!smart||doc.getElementById('nerVideoDnaPanel'))return;
  const section=doc.createElement('details');section.id='nerVideoDnaPanel';section.className='card';section.style.marginTop='12px';
  const title=doc.createElement('summary');title.textContent='🧬 VIDEO DNA · Approved + Failure Memory';section.append(title);
  const hint=doc.createElement('p');hint.textContent='LOCAL / FREE. Use after watching the rendered video. Saves exact text prompts and review notes, not MP4 files. No automatic project edits or approvals.';section.append(hint);
  const line=doc.createElement('div');line.style.display='flex';line.style.flexWrap='wrap';line.style.gap='8px';line.style.margin='8px 0';section.append(line);
  const elt=(tag,label,appendTo=line)=>{const e=doc.createElement(tag);e.textContent=label;appendTo.append(e);return e;};
  const grade=elt('input','');grade.type='number';grade.min='0';grade.max='10';grade.step='0.1';grade.value='9.0';grade.style.width='78px';grade.setAttribute('aria-label','Rendered video grade');
  const reason=elt('select','');reason.setAttribute('aria-label','Rejected video failure reason');
  for(const [value,name] of Object.entries(FAILURES)){const opt=doc.createElement('option');opt.value=value;opt.textContent=name;reason.append(opt);}
  const notes=elt('textarea','',section);notes.rows=2;notes.placeholder='Optional notes, video filename, or reviewer observations (no video upload)';notes.style.width='100%';
  const buttons=elt('div','',section);buttons.style.display='flex';buttons.style.flexWrap='wrap';buttons.style.gap='6px';
  const addButton=(name,fn)=>{const b=elt('button',name,buttons);b.type='button';b.className='ghost small';b.addEventListener('click',fn);return b;};
  const result=elt('pre','',section);result.style.whiteSpace='pre-wrap';result.setAttribute('role','status');
  function current(){const card=root.LDSmartContinue?.currentCard?.()||doc.querySelector('.stage-card:not(.hidden)');if(!card)throw Error('Open a production stage first.');return fromCard(card);}
  function showCheck(){const data=current();if(!data.prompt)throw Error('Build or paste this stage prompt before DNA checking.');const r=check(data);result.textContent='FREE DNA '+r.status.toUpperCase()+'\n'+[...r.problems,...r.warnings].join('\n')+'\nMatching approved references: '+r.matches.length+'\nNo API credits used.';return r;}
  addButton('CHECK VIDEO DNA · FREE',()=>{try{showCheck();}catch(e){result.textContent=e.message;}});
  addButton('SAVE MASTER DNA',()=>{try{const d=current(),g=Number(grade.value);if(!(g>=9))throw Error('Master requires a reviewed video grade of 9.0+.');const out=save({...d,grade:g,kind:'master',notes:notes.value});result.textContent=out.existing?'Already saved. No duplicate added.':'MASTER DNA saved locally for future projects. Export to back up.';}catch(e){result.textContent=e.message;}});
  addButton('SAVE FAILURE DNA',()=>{try{const d=current(),g=Number(grade.value);if(!(g<9))throw Error('Failure requires a reviewed grade below 9.0.');const out=save({...d,grade:g,kind:'failure',reason:reason.value,notes:notes.value});result.textContent=out.existing?'Already saved. No duplicate added.':'FAILURE DNA saved. Matching exact prompts will be blocked before paid audit.';}catch(e){result.textContent=e.message;}});
  addButton('EXPORT DNA JSON',()=>{try{const blob=new Blob([exportText()],{type:'application/json'}),url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='ner-video-dna-v1.json';a.click();URL.revokeObjectURL(url);result.textContent='Video DNA backup exported.';}catch(e){result.textContent=e.message;}});
  const file=elt('input','',section);file.type='file';file.accept='.json,application/json';file.hidden=true;
  addButton('IMPORT DNA JSON',()=>file.click());
  file.addEventListener('change',async()=>{try{const f=file.files?.[0];if(!f)return;if(f.size>2e6)throw Error('DNA JSON exceeds 2 MB.');const count=importRecords(await f.text());result.textContent=count+' new DNA records imported. Existing entries preserved.';}catch(e){result.textContent=e.message;}finally{file.value='';}});
  smart.after(section);
 }
 if(root.document){root.addEventListener('ld:production-built',()=>root.queueMicrotask?root.queueMicrotask(mount):mount());if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount);else mount();}
 return Object.freeze({VERSION,KEY,FAILURES,LESSONS,signature,list,save,check,assertReady,exportText,importRecords,fromCard,mount});
});

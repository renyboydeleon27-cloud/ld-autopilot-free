/* NER STUDIO DIRECTOR'S STORY BOOK V1 — additive, local-only; native stages never mutated. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NERStoryBook=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const VERSION='1.0.0', SCHEMA='ner.storybook.v1', DB='ner-director-storybook-v1', STORE='projects';
 const STAGES=Array.from({length:14},(_,i)=>'P'+(i+1));
 const MANUAL=['HOOK','ENDING','THUMBNAIL'];
 const bytes=x=>new TextEncoder().encode(x).length;
 const trim=x=>typeof x==='string'?x.trim():'';
 const normalized=x=>String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 const canonical=x=>JSON.stringify(x);
 const hasKeys=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&k.every(s=>Object.prototype.hasOwnProperty.call(o,s));
 const exactlyKeys=(o,k)=>hasKeys(o,k)&&Object.keys(o).every(s=>k.includes(s));
 const text=(v,min,max=40000)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
 function context(){
  const doc=root.document, title=trim(doc?.getElementById('projectTitle')?.textContent);
  const topic=title&&title!=='No production yet'?title:trim(doc?.getElementById('topic')?.value);
  const format=doc?.getElementById('format')?.value||'';
  const cards=[...(doc?.querySelectorAll('.stage-card[data-stage]')||[])];
  let projectId='';try{projectId=root.localStorage?.getItem('ld-autopilot-free-active-project')||'';}catch{}
  const yearMatch=topic.match(/\b(?:18|19|20)\d{2}\b/);
  const metadata=root.NERCore5?.metadata?.(topic,{})||{};
  const year=Number(metadata.year)||Number(yearMatch?.[0])||null;
  return {topic,format,projectId,year,cards,identity:canonical([projectId,normalized(topic),format])};
 }
 function scope(ctx){if(!ctx?.topic||ctx.format!=='shorts')throw Error('Open an existing Shorts production first.');return ctx.identity;}
 function parse(raw){
  if(typeof raw!=='string'||bytes(raw)>1000000)throw Error('Story Book JSON must be at most 1 MB.');
  let value;try{value=JSON.parse(raw);}catch{throw Error('Invalid Story Book JSON.');}
  return value;
 }
 function validate(book,ctx){
  const errors=[],warnings=[];
  const error=s=>errors.push(s),warning=s=>warnings.push(s);
  const top=['schemaVersion','bookId','revision','createdAt','project','globalDirection','panels'];
  if(!exactlyKeys(book,top))return {ok:false,errors:['File must contain only the complete Story Book v1 fields.'],warnings,panels:[]};
  if(book.schemaVersion!==SCHEMA)error('Unsupported Story Book schema.');
  if(typeof book.bookId!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{5,99}$/.test(book.bookId))error('Invalid bookId.');
  if(!Number.isInteger(book.revision)||book.revision<1||book.revision>999999)error('Invalid revision.');
  if(typeof book.createdAt!=='string'||!Number.isFinite(Date.parse(book.createdAt))||!/\dT\d/.test(book.createdAt))error('Invalid createdAt ISO datetime.');
  const projectKeys=['topic','eventYear','location','format','videoMode','visualStyle','colorMode','aspectRatio'];
  if(!exactlyKeys(book.project,projectKeys))error('Incomplete or unexpected project metadata.');
  else{
   const p=book.project;
   if(!text(p.topic,8,400)||!text(p.location,3,300)||!Number.isInteger(p.eventYear)||p.eventYear<1||p.eventYear>2100)error('Invalid historical project identity.');
   if(p.format!=='shorts'||p.videoMode!=='text'||p.visualStyle!=='anime'||p.colorMode!=='bw'||p.aspectRatio!=='9:16')error('V1 supports only Shorts · Text-to-Video · 2D Anime · B&W · 9:16.');
   if(ctx){
    if(!ctx.topic||ctx.format!=='shorts'||ctx.cards.filter(c=>STAGES.includes(c.dataset.stage)).length!==14)error('Create or open the complete P1–P14 Shorts production first.');
    if(normalized(p.topic)!==normalized(ctx.topic))error('Imported topic does not match the open project.');
    if(ctx.year!==null&&p.eventYear!==ctx.year)error('Imported event year does not match the open project.');
    const meta=root.NERCore5?.metadata?.(ctx.topic,{})?.location||'';
    if(meta){
     const a=normalized(p.location).split(' ').filter(w=>w.length>=4), b=normalized(meta).split(' ').filter(w=>w.length>=4);
     if(a.length&&b.length&&!a.some(w=>b.includes(w)))warning('Verify the Story Book location against the saved historical project metadata.');
    }
    const style=root.LDProjectLocks?.visualStyle?.()||root.ldProjectLocks?.visualStyle||root.document?.getElementById('visualMode')?.value;
    const color=root.LDProjectLocks?.colorMode?.()||root.ldProjectLocks?.colorMode;
    if(style&&style!=='anime')error('Current production visual lock is not 2D anime.');
    if(color&&color!=='bw')error('Current production color lock is not true B&W.');
   }
  }
  const gKeys=['panelDurationSeconds','narrationTargetSeconds','transitionHandleSeconds','manualStages'];
  if(!exactlyKeys(book.globalDirection,gKeys)||book.globalDirection.panelDurationSeconds!==10||book.globalDirection.narrationTargetSeconds!==8||book.globalDirection.transitionHandleSeconds!==2||canonical(book.globalDirection.manualStages)!==canonical(MANUAL))error('Timing must be 10s video, 8s narration, 2s transition; HOOK/ENDING/THUMBNAIL manual.');
  const panelKeys=['stage','narration','videoPrompt','direction','promptReview'];
  const directionKeys=['historicalBeat','location','cast','action','camera','emotion','timeline','transitionOut','continuityAndFailures'];
  const timeKeys=['s0to2','s2to8','s8to10'];
  if(!Array.isArray(book.panels)||book.panels.length!==14)error('Exactly 14 panels are required (P1–P14).');
  const seen=new Set(), rows=[], locations=[];
  if(Array.isArray(book.panels))for(const [i,p] of book.panels.entries()){
   const name=p?.stage||'Panel '+(i+1);
   if(!exactlyKeys(p,panelKeys)){error(name+': missing or unexpected panel fields.');continue;}
   if(p.stage!==STAGES[i])error(name+': panels must appear exactly once in P1–P14 order.');
   if(seen.has(p.stage))error(name+': duplicate stage.');seen.add(p.stage);
   if(!text(p.narration,12,1200))error(name+': incomplete narration.');
   if(!text(p.videoPrompt,200,40000))error(name+': incomplete exact video prompt.');
   else{
    if(!/(?:exactly\s+10\s+seconds|10[\s-]*second)/i.test(p.videoPrompt))error(name+': video prompt must explicitly request 10 seconds.');
    if(!/2D|hand.drawn/i.test(p.videoPrompt)||!/anime/i.test(p.videoPrompt))error(name+': missing hand-drawn 2D anime lock.');
    if(!/(?:black.and.white|grayscale|B\/W)/i.test(p.videoPrompt))error(name+': missing true B&W lock.');
    if(!/9:16/.test(p.videoPrompt))error(name+': missing vertical 9:16 lock.');
    if(!/(?:one continuous shot|single continuous shot|uninterrupted shot)/i.test(p.videoPrompt))error(name+': missing one-shot camera lock.');
   }
   if(!exactlyKeys(p.direction,directionKeys))error(name+': director notes missing or unexpected.');
   else{
    for(const [k,min] of [['historicalBeat',12],['location',8],['cast',8],['action',12],['camera',8],['emotion',3],['transitionOut',8],['continuityAndFailures',12]])
     if(!text(p.direction[k],min,2000))error(name+': invalid direction.'+k);
    if(!exactlyKeys(p.direction.timeline,timeKeys)||timeKeys.some(k=>!text(p.direction.timeline[k],8,1000)))error(name+': incomplete 0–2 / 2–8 / 8–10 motion timeline.');
    locations.push(normalized(p.direction.location));
   }
   if(!exactlyKeys(p.promptReview,['grade','note','directorReviewed'])||typeof p.promptReview.grade!=='number'||p.promptReview.grade<9||p.promptReview.grade>10||!text(p.promptReview.note,12,2000)||p.promptReview.directorReviewed!==true)error(name+': director prompt review must be completed and graded 9.0+.');
   const words=trim(p.narration).split(/\s+/).filter(Boolean).length;
   if(words<12||words>24)warning(name+': '+words+' narration words; verify actual TTS timing near 8 seconds.');
   const card=ctx?.cards?.find(c=>c.dataset.stage===p.stage);
   const protectedNative=!!(card?.querySelector('.done-toggle')?.checked||card?.dataset.approvalCommitted==='1'||root.NERCore5Runtime?.protectedPanel?.(card));
   const nativeNarration=card?.querySelector('.narration')?.value||'';
   const nativePrompt=card&&root.NERCore5Runtime?.preserve?.(card)||card?.dataset?.textVideoPrompt||'';
   const difference=protectedNative&&((!!nativeNarration&&nativeNarration!==p.narration)|| (!!nativePrompt&&nativePrompt!==p.videoPrompt));
   if(difference)warning(name+': APPROVED PANEL DIFFERENCE — original approval preserved; imported copy is a separate alternative.');
   rows.push({stage:p.stage,protectedNative,difference,words,grade:p.promptReview?.grade||0,location:p.direction?.location||''});
  }
  for(let i=2;i<locations.length;i++)if(locations[i]&&locations[i]===locations[i-1]&&locations[i]===locations[i-2])warning('P'+(i-1)+'–P'+(i+1)+': three repeated settings; director should confirm visual variety.');
  if(Array.isArray(book.panels)&&seen.size!==14)error('Missing one or more unique panel IDs.');
  return {ok:errors.length===0,errors,warnings,panels:rows};
 }
 function openDb(){
  if(!root.indexedDB)return Promise.reject(Error('IndexedDB unavailable; no Story Book changes made.'));
  return new Promise((resolve,reject)=>{
   const req=root.indexedDB.open(DB,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'scope'});};
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Story Book database unavailable.'));
  });
 }
 async function read(ctx=context()){
  const key=scope(ctx),db=await openDb();
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(key);
   r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error||Error('Story Book read failed.'));
  });}finally{db.close();}
 }
 function hashBook(book){return canonical(book);}
  function backupFromFile(value){
   if(value?.exportFormat!=='ner.storybook.workspace.v1')return null;
   if(!exactlyKeys(value,['exportFormat','exportedAt','book','reviews','history']))throw Error('Workspace backup fields are incomplete or unexpected.');
   if(typeof value.exportedAt!=='string'||!Number.isFinite(Date.parse(value.exportedAt)))throw Error('Invalid workspace export timestamp.');
   if(!value.reviews||typeof value.reviews!=='object'||Array.isArray(value.reviews))throw Error('Invalid Story Book review backup.');
   if(!Array.isArray(value.history)||value.history.length>50)throw Error('Invalid Story Book revision history.');
   for(const [stage,r] of Object.entries(value.reviews)){
    if(!STAGES.includes(stage)||!r||typeof r!=='object'||!['pending','rendered','approved','rejected'].includes(r.status)||typeof r.prompt!=='string'||r.prompt.length>40000||!Number.isInteger(r.promptRevision)||typeof r.note!=='string'||typeof r.filename!=='string'||typeof r.reason!=='string'||!(r.grade===null||Number.isFinite(r.grade)&&r.grade>=0&&r.grade<=10))throw Error('Invalid review backup for '+stage+'.');
    const p=value.book?.panels?.find(x=>x.stage===stage);
    if(!p||r.prompt!==p.videoPrompt||r.promptRevision!==value.book.revision)throw Error('Review backup does not match current panel version: '+stage);
   }
   for(const h of value.history){
    if(!h||typeof h!=='object'||!h.book||!h.reviews||typeof h.reviews!=='object'||typeof h.savedAt!=='string'||!validate(h.book).ok)throw Error('Invalid saved previous Book revision.');
   }
   return value;
  }
 async function commit(book,ctx=context(),backup=null){
  const checked=validate(book,ctx);if(!checked.ok)throw Error(checked.errors.join(' '));
  if(backup&&backup.book!==book)throw Error('Workspace backup does not match selected Book.');
   const key=scope(ctx),data=hashBook(book),db=await openDb();
  try{return await new Promise((resolve,reject)=>{
   let answer,problem=null;
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   store.get(key).onsuccess=e=>{
    try{
     if(context().identity!==ctx.identity)throw Error('Active project changed. Nothing imported.');
     const current=e.target.result;
     if(current?.book){
      const old=current.book, same=hashBook(old)===data;
      if(same){answer={status:'unchanged',record:current};return;}
      if(old.bookId===book.bookId&&book.revision<=old.revision)throw Error('Story Book revision conflict: use a higher revision for edited content.');
      if(old.bookId!==book.bookId&&book.revision<=old.revision)throw Error('Different Book ID. Use a higher revision to explicitly replace this Story Book.');
      const history=[...(current.history||[]),{book:old,reviews:current.reviews||{},savedAt:current.savedAt}];
      if(history.length>50)throw Error('Revision history reached 50 entries; export before importing another revision.');
      answer={status:'updated'};
      store.put({scope:key,book,reviews:{},history,savedAt:new Date().toISOString()});
     }else{
      answer={status:'imported'};
      store.put({scope:key,book,reviews:backup?.reviews||{},history:backup?.history||[],savedAt:new Date().toISOString()});
     }
    }catch(err){problem=err;tx.abort();}
   };
   tx.oncomplete=()=>resolve(answer);
   tx.onerror=()=>reject(problem||tx.error||Error('Story Book import failed.'));
   tx.onabort=()=>reject(problem||tx.error||Error('Story Book import rolled back safely.'));
  });}finally{db.close();}
 }
 async function review(stage,details,ctx=context()){
  if(!STAGES.includes(stage))throw Error('Only P1–P14 have Story Book reviews.');
  const key=scope(ctx),db=await openDb();
  try{return await new Promise((resolve,reject)=>{
   let problem=null,out=null;
   const tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);
   s.get(key).onsuccess=e=>{
    try{
     if(context().identity!==ctx.identity)throw Error('Active project changed. Review not saved.');
     const record=e.target.result;if(!record?.book)throw Error('Import a Story Book first.');
     const status=details?.status||'pending',grade=(details?.grade===''||details?.grade==null)?null:Number(details?.grade),note=trim(details?.note),filename=trim(details?.filename),reason=trim(details?.reason);
     if(!['pending','rendered','approved','rejected'].includes(status))throw Error('Invalid render status.');
     if(!Number.isFinite(grade)&&grade!==null)throw Error('Invalid render grade.');
     if(grade!==null&&(grade<0||grade>10))throw Error('Render grade must be 0–10.');
     if(status==='approved'&&(grade===null||grade<9||note.length<5))throw Error('Approved render needs actual grade >=9 and review notes.');
     if(status==='rejected'&&(grade===null||grade>=9||note.length<5||!reason))throw Error('Rejected render needs grade below 9, notes and failure reason.');
     if(status==='approved'||status==='rejected'){if(!filename)throw Error('Enter the reviewed clip filename before approval/rejection.');}
     const item={status,grade,note,filename,reason,promptRevision:record.book.revision,prompt:record.book.panels.find(p=>p.stage===stage)?.videoPrompt,reviewedAt:new Date().toISOString()};
     record.reviews={...record.reviews,[stage]:item};s.put(record);out=item;
    }catch(err){problem=err;tx.abort();}
   };
   tx.oncomplete=()=>resolve(out);
   tx.onabort=()=>reject(problem||tx.error||Error('Review could not be saved.'));
   tx.onerror=()=>reject(problem||tx.error||Error('Review could not be saved.'));
  });}finally{db.close();}
 }
 function exportWorkspace(record){if(!record?.book)throw Error('No imported Story Book for current project.');return JSON.stringify({exportFormat:'ner.storybook.workspace.v1',exportedAt:new Date().toISOString(),book:record.book,reviews:record.reviews||{},history:record.history||[]},null,2);}
 function el(tag,props={},children=[]){
  const node=root.document.createElement(tag);
  for(const [k,v] of Object.entries(props))if(k==='text')node.textContent=v;else if(k==='class')node.className=v;else if(k==='style')node.setAttribute('style',v);else if(k==='type')node.type=v;else node.setAttribute(k,v);
  for(const child of children)node.append(child);return node;
 }
 function button(label){return el('button',{type:'button',class:'ghost small',text:label});}
 function status(msg,isError=false){const n=root.document.getElementById('nerBookStatus');if(n){n.textContent=msg;n.style.color=isError?'#fca5a5':'#a5d6b4';}}
 async function copy(s){
  try{await root.navigator.clipboard.writeText(s);status('Exact Story Book text copied.');}
  catch{status('Clipboard unavailable. Select and copy the read-only text below.',true);}
 }
 function download(content,filename){
  const u=root.URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'})),a=el('a',{href:u,download:filename});
  root.document.body.append(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(u),1000);
 }
 function renderPanel(card,record){
  card.querySelector('.ner-storybook-stage')?.remove();
  const stage=card.dataset.stage, p=record?.book?.panels?.find(x=>x.stage===stage);
  if(!p)return;
  const holder=el('details',{class:'ner-storybook-stage',style:'margin:10px 0;padding:12px;border:1px solid #36546a;border-radius:12px;background:#111d2b;'});
  const originalProtected=!!(card.querySelector('.done-toggle')?.checked||card.dataset.approvalCommitted==='1'||root.NERCore5Runtime?.protectedPanel?.(card));
  holder.append(el('summary',{text:'📖 Director’s Book · '+stage+' · '+(originalProtected?'Original approved panel protected':'Imported overlay ready')}));
  holder.append(el('p',{text:'READ-ONLY OVERLAY · Native prompts, Core 5, Smart Continue, audit journals and Done flags are unchanged.',style:'font-size:12px;color:#a3b8c9;'}));
  const label=(t,v)=>{
   holder.append(el('p',{text:t,style:'font-size:12px;font-weight:700;color:#a3b8c9;margin:10px 0 4px;'}));
   const ta=el('textarea',{readonly:'',rows:t==='Complete video prompt'?'8':'3',style:'width:100%;max-width:100%;box-sizing:border-box;'});ta.value=v;holder.append(ta);
   const b=button('Copy exact '+t.toLowerCase());b.addEventListener('click',()=>copy(v));holder.append(b);
  };
  holder.append(el('p',{text:'Scene: '+p.direction.location+' · Cast: '+p.direction.cast+' · Camera: '+p.direction.camera+' · Prompt review: '+p.promptReview.grade+'/10',style:'font-size:13px;'}));
  holder.append(el('p',{text:'Action: '+p.direction.action+' · Transition: '+p.direction.transitionOut,style:'font-size:13px;'}));
  label('Narration',p.narration);label('Complete video prompt',p.videoPrompt);
  const old=record.reviews?.[stage]||{};
  holder.append(el('p',{text:'Actual render review (separate from prompt grade)',style:'font-weight:700;margin:12px 0 5px;'}));
  const statusChoice=el('select',{style:'width:100%;margin-bottom:6px;'});
  for(const [v,t] of [['pending','Pending'],['rendered','Rendered — for review'],['approved','Approved actual video'],['rejected','Rejected actual video']]){const o=el('option',{value:v,text:t});statusChoice.append(o);}statusChoice.value=old.status||'pending';
  const name=el('input',{type:'text',placeholder:'Reviewed MP4 filename',style:'width:100%;margin-bottom:6px;'});name.value=old.filename||'';
  const grade=el('input',{type:'number',min:'0',max:'10',step:'0.1',placeholder:'Actual VIDEO grade (0–10)',style:'width:100%;margin-bottom:6px;'});grade.value=old.grade??'';
  const notes=el('textarea',{rows:'2',placeholder:'Observed render details — not predicted issues',style:'width:100%;margin-bottom:6px;'});notes.value=old.note||'';
  const failure=el('select',{style:'width:100%;margin-bottom:6px;'});
  const reasons=root.NERVideoDNA?.FAILURES||{other:'Other observed render failure'};
  failure.append(el('option',{value:'',text:'Failure reason (rejected only)'}));
  for(const [v,t] of Object.entries(reasons))failure.append(el('option',{value:v,text:t}));
  failure.value=old.reason||'';
  holder.append(statusChoice,name,grade,notes,failure);
  const save=button('Save actual video review · FREE');
  save.addEventListener('click',async()=>{
   save.disabled=true;try{
    await review(stage,{status:statusChoice.value,filename:name.value,grade:grade.value,note:notes.value,reason:failure.value});
    status('Saved '+stage+' actual video review locally. Story Book and native panel were not changed.');
   }catch(e){status(e.message,true);}finally{save.disabled=false;}
  });
  const dna=button('Save confirmed result to Video DNA');
  dna.addEventListener('click',async()=>{
   try{
    const current=await read(),r=current?.reviews?.[stage];
    if(!r||!['approved','rejected'].includes(r.status)||r.prompt!==p.videoPrompt||r.promptRevision!==current.book.revision)throw Error('Save the current actual-video review first.');
    const kind=r.status==='approved'?'master':'failure';
    if(!root.confirm('Save this actual '+r.status+' render ('+r.grade+'/10) as '+kind+' Video DNA for '+stage+'?'))return;
    if(!root.NERVideoDNA?.save)throw Error('Video DNA library unavailable.');
    const outcome=root.NERVideoDNA.save({kind,topic:current.book.project.topic,stage,family:'',prompt:r.prompt,grade:r.grade,reason:kind==='failure'?r.reason:'',notes:r.filename+' — '+r.note});
    status(outcome.existing?'This exact result already exists in Video DNA.':'Saved exact '+kind+' prompt and verified video review to Video DNA.');
   }catch(e){status(e.message,true);}
  });
  holder.append(save,dna);
  card.querySelector('.stage-body')?.prepend(holder);
 }
 let pending=null,loaded=null,loadSequence=0;
 async function hydrate(){
  if(!root.document)return;
  const ctx=context();
  if(!ctx.topic||ctx.cards.filter(c=>STAGES.includes(c.dataset.stage)).length!==14){loaded=null;root.document?.querySelectorAll('.ner-storybook-stage')?.forEach(n=>n.remove());return;}
  const sequence=++loadSequence;
  try{
   const record=await read(ctx);if(sequence!==loadSequence||context().identity!==ctx.identity)return;
   loaded=record;
   for(const card of ctx.cards)if(STAGES.includes(card.dataset.stage))renderPanel(card,record);
   const info=root.document.getElementById('nerBookInfo');if(info)info.textContent=record?.book?'Imported: '+record.book.bookId+' · revision '+record.book.revision+' · 14 panels':'No Story Book imported for this project.';
  }catch(e){status('Story Book storage: '+e.message,true);}
 }
 function showPreview(){
  const place=root.document.getElementById('nerBookPreview');if(!place)return;
  place.replaceChildren();
  if(!pending){place.append(el('p',{text:'Choose a complete JSON file first.'}));root.document.getElementById('nerBookDistribute').disabled=true;return;}
  const result=validate(pending.book,context());
  try{if(pending.backup)backupFromFile(pending.backup);}catch(e){result.ok=false;result.errors.push(e.message);}
  place.append(el('p',{text:result.ok?'✅ All 14 panels validated. No original panel will be overwritten.':'❌ Import blocked until all errors are fixed.'}));
  for(const e of result.errors)place.append(el('p',{text:'ERROR: '+e,style:'color:#fca5a5;font-size:12px;'}));
  for(const w of result.warnings)place.append(el('p',{text:'REVIEW: '+w,style:'color:#facc15;font-size:12px;'}));
  for(const row of result.panels)place.append(el('p',{text:row.stage+' · '+row.location+' · prompt '+row.grade+'/10 · '+row.words+' narration words · '+(row.protectedNative?'original approved/Done preserved':'original stage preserved')+(row.difference?' · DIFFERS FROM APPROVED ORIGINAL':''),style:'font-size:12px;margin:5px 0;'}));
  root.document.getElementById('nerBookDistribute').disabled=!result.ok;
  return result;
 }
 function mount(){
  if(!root.document||root.document.getElementById('nerBookBox'))return;
  const target=root.document.getElementById('pipelineSection');if(!target)return;
  const panel=el('details',{id:'nerBookBox',class:'card',style:'margin:14px 0;padding:14px;'});
  panel.append(el('summary',{text:'📖 DIRECTOR’S STORY BOOK · IMPORT / EXPORT'}));
  panel.append(el('p',{text:'Optional, free, read-only layer for complete P1–P14 story direction. HOOK, ENDING and THUMBNAIL stay manual; existing prompts, approvals, Core 5 and Smart Continue stay untouched.',style:'font-size:12px;color:#b7c7d6;'}));
  const input=el('input',{id:'nerBookFile',type:'file',accept:'.json,application/json',style:'display:none;'});
  const upload=button('UPLOAD STORY BOOK'),preview=button('PREVIEW 14 PANELS'),apply=button('CONFIRM & DISTRIBUTE'),exp=button('EXPORT STORY BOOK');
  apply.id='nerBookDistribute';apply.disabled=true;
  upload.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
   pending=null;apply.disabled=true;
   try{
    const file=input.files?.[0];if(!file)return;
    if(file.size>1000000)throw Error('File is larger than 1 MB.');
    const fileData=parse(await file.text());
     pending={book:fileData?.exportFormat==='ner.storybook.workspace.v1'?fileData.book:fileData,backup:backupFromFile(fileData),name:file.name};
    status('Loaded '+file.name+' for preview. No project changes have been made.');
    showPreview();
   }catch(e){status(e.message,true);}
   input.value='';
  });
  preview.addEventListener('click',showPreview);
  apply.addEventListener('click',async()=>{
   const c=context(),valid=pending&&showPreview();
   if(!valid?.ok){showPreview();status('Import preview is invalid. Nothing changed.',true);return;}
   if(!root.confirm('Distribute all 14 Story Book panels as a SEPARATE, read-only overlay for '+c.topic+'? Original stages, approved prompts and journals will not be changed.'))return;
   apply.disabled=true;
   try{
    const result=await commit(pending.book,c,pending.backup);
    const verify=await read(c);
    if(!verify?.book||hashBook(verify.book)!==hashBook(pending.book))throw Error('Story Book readback verification failed. Export a backup and retry.');
    status('Story Book '+result.status+': all P1–P14 overlays ready. No API call or paid audit.');
    pending=null;await hydrate();showPreview();
   }catch(e){status(e.message,true);}
   finally{apply.disabled=true;if(pending)showPreview();}
  });
  exp.addEventListener('click',async()=>{
   try{
    const record=await read();if(!record?.book)throw Error('There is no imported Story Book in this project.');
    const safe=record.book.bookId.replace(/[^a-z0-9_-]/gi,'_');
    download(exportWorkspace(record),safe+'-rev'+record.book.revision+'-workspace.json');
    status('Exported Story Book with review notes, version history and unchanged original prompt text.');
   }catch(e){status(e.message,true);}
  });
  const actions=el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;'});
  actions.append(upload,preview,apply,exp,input);
  panel.append(actions,el('p',{id:'nerBookStatus',role:'status',text:'Ready for local Story Book import. No API credits.'}),el('p',{id:'nerBookInfo',text:'No Story Book imported for this project.',style:'font-size:12px;color:#a3b8c9;'}),el('div',{id:'nerBookPreview',style:'margin-top:8px;max-height:300px;overflow:auto;'}));
  target.parentNode.insertBefore(panel,target);
  root.addEventListener('ld:production-built',()=>{root.setTimeout(hydrate,0);});
  const stages=root.document.getElementById('stages');
  if(stages&&root.MutationObserver)new root.MutationObserver(()=>{root.setTimeout(hydrate,0);}).observe(stages,{childList:true});
  hydrate();
 }
 if(root.document){
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount);
  else mount();
 }
 return Object.freeze({VERSION,SCHEMA,STAGES,parse,validate,backupFromFile,context,read,commit,review,exportWorkspace,hydrate,mount});
});

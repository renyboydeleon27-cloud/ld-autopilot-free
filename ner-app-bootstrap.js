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
 function installCore5CrossTopicGuard(){
  const base=window.NERCore5;if(!base||base.crossTopicGuardVersion)return;
  const VERSION='1.0.1';
  const placeholder=/supported (?:warning|hazard|contextual feature)|narrated (?:cause|onset|warning|non-graphic impact)/i;
  const staleFamilyText=/\b(?:public-health crisis|xylazine|zombie drug|atmospheric-pollution|great smog|coal smoke)\b/i;
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  function metadata(topic,saved={}){
   const canonical=base.metadata(topic,{}),fallback=base.metadata(topic,saved);
   // A structured project title is the current project identity. Do not let the
   // preceding project's continuity year/location override a newly selected topic.
   return {year:canonical.year||fallback.year,location:canonical.location||fallback.location};
  }
  function identityMatches(spec,input,fam){
   return !!spec&&spec.schema===5&&spec.stage===input.stage&&spec.topic===input.topic&&spec.family===fam&&spec.narration===String(input.narration||'')&&Number(spec.eventYear)===Number(input.eventYear)&&String(spec.location?.region||'')===String(input.location||'');
  }
  function earthquakeScene(narration,role,stage){
   const n=String(narration||'').toLowerCase();
   const cast=[{id:'adult-1',description:'unnamed adult resident in clothing appropriate to the scene period'}];
   const make=(location,action,audio='subdued scene-supported ambience',movement='slow-push-in',framing='eye-level medium-wide')=>({location,cast,action,camera:{framing,movement},audio});
   if(stage==='ENDING')return make('quiet reflective local setting after the historical event','adult-1 stands at rest','quiet reflective ambience','locked');
   if(/false rumors|rumou?rs|killings of koreans|chinese.*japanese|discrimination|misinformation/.test(n))return make('quiet non-graphic street aftermath representing fear and social violence, with no attack, bodies, ethnic caricature or invented ceremony','adult-1 comes to a stop beside a closed doorway and lowers their gaze','quiet street ambience');
   if(/disaster prevention day|1960|lessons? for generations|preserving.*lessons?/.test(n))return make('representative later-period community preparedness setting with no readable signs or text','adult-1 pauses beside a plain emergency-supply cabinet and looks toward it','quiet indoor ambience','locked','eye-level medium view');
   if(/reconstruct|rebuild safer|(?:new|rebuilt|repaired) (?:roads|bridges|parks|schools)/.test(n))return make('representative reconstruction work area with one partly rebuilt street edge and period-appropriate materials','adult-1 places one small paving stone into an unfinished street edge','restrained work-site ambience','lateral-track');
   if(/relief|volunteers|outside aid|rail links.*return|electricity.*return/.test(n))return make('organized non-graphic relief area among settled earthquake damage','adult-1 carries one closed plain supply box to a nearby stable table','subdued relief-area ambience','lateral-track');
   if(/105[, ]?000|killed or left missing|deadliest|most of the deaths|fire caused most/.test(n))return make('settled burned urban aftermath with damaged period buildings and no visible bodies','adult-1 slowly lowers their head while standing at a safe street edge','quiet aftermath ambience');
   if(/landslide|debris flow|nebukawa|odawara|massive collapse buried homes/.test(n))return make('safe viewpoint toward a settled landslide debris zone with damaged homes in the distance and no active renewed collapse','adult-1 stops at the safe edge of the debris zone and looks toward the blocked route','quiet settled debris ambience');
   if(/tsunami|sagami bay|shoreline/.test(n))return make('coastal road above the shoreline with abnormal tsunami inundation moving inland below, only at the level stated by the narration','adult-1 takes one controlled step away from the waterfront edge','water movement and restrained coastal ambience','slow-pull-back');
   if(/yokohama.*destruction|fires swept|streets were reduced to ruins|catastrophic destruction/.test(n))return make('damaged urban street with settled rubble and active fire confined to already-damaged structures','adult-1 takes one careful step along a clear edge of the ruined street','distant fire crackle and subdued street ambience','lateral-track');
   if(/fled|whatever they could carry|parks|open grounds|temporary refuges|flames advanced/.test(n))return make('visible route from a damaged neighborhood toward an open refuge ground, with distant supported fire behind','adult-1 walks steadily toward the visible open refuge carrying one small plain bundle','quick restrained footsteps and distant fire ambience','lateral-track');
   if(/broken water systems|blocked streets|firefighting|urban blazes|emergency crews/.test(n))return make('blocked street beside a damaged water connection with a supported urban fire visible farther down the same street','adult-1 stops beside the blocked route and turns toward the inaccessible fire area','distant fire crackle and subdued street ambience');
   if(/cooking fires|flames erupted|strong winds|spread rapidly/.test(n))return make('damaged residential lane where one small fire has begun spreading through nearby period-appropriate combustible material as narrated','adult-1 takes one controlled step away from the growing fire','fire crackle and restrained wind ambience','slow-pull-back');
   if(/buildings collapsed|wooden homes|brick structures|roads.*bridges failed|structur.*failed/.test(n))return make('urban street during strong shaking with one limited period-building facade failure and nearby roadway damage','adult-1 takes one controlled backward step away from the failing facade','rattling structures and falling masonry limited to the visible failure','slow-pull-back');
   if(/water, electricity|railways|roads|bridges|communications|basic systems.*failed/.test(n))return make('damaged local street beside a blocked period transport route with broken infrastructure visible but settled','adult-1 stops at the blocked route and looks across the obstruction','quiet damaged-street ambience');
   if(/ground began moving|violently shaking|earthquake struck|powerful shaking|shattered/.test(n)||role==='onset'||stage==='HOOK')return make('representative 1923 urban interior with a low table and period-appropriate household objects visibly shaking while the main structure remains intact','adult-1 braces one hand against the low table as the room shakes','rattling household objects and low structural creaking','slow-push-in');
   if(role==='normal-world')return make('intact representative 1923 urban street before visible earthquake effects','adult-1 walks steadily past one intact doorway','soft footsteps and ordinary street ambience','lateral-track');
   return null;
  }
  function plan(input){
   const fam=base.family(input.topic),incoming=input.spec,keep=identityMatches(incoming,input,fam);
   const s=base.clone(base.plan({...input,spec:null}));
   if(keep){
    if(incoming.chronology)s.chronology=base.clone(incoming.chronology);
    if(incoming.location)s.location={region:String(input.location||''),setting:String(incoming.location.setting||s.location.setting)};
    if(Array.isArray(incoming.cast))s.cast=base.clone(incoming.cast);
    if(incoming.action)s.action=base.clone(incoming.action);
    if(incoming.camera)s.camera=base.clone(incoming.camera);
    if(typeof incoming.audio==='string')s.audio=incoming.audio;
    if(Array.isArray(incoming.facts))s.facts=base.clone(incoming.facts);
    if(incoming.choreography){s.choreography=base.clone(incoming.choreography);if(Array.isArray(incoming.timing))s.timing=base.clone(incoming.timing);}
   }
   const needsConcrete=placeholder.test([s.location?.setting,s.action?.description].join(' '));
   if(fam==='earthquake'&&(!keep||needsConcrete)){
    const scene=earthquakeScene(input.narration,s.role,input.stage);
    if(scene){s.location={region:String(input.location||''),setting:scene.location};s.cast=scene.cast;s.action={actor:'adult-1',description:scene.action};s.camera=scene.camera;s.audio=scene.audio;delete s.choreography;}
   }
   // Current project identity always wins over a saved StageSpec. Reviewed scene
   // fields may survive only when they already belong to this exact project/panel.
   s.schema=5;s.compilerVersion=base.VERSION;s.stage=input.stage;s.topic=input.topic;s.family=fam;s.narration=String(input.narration||'');s.eventYear=Number(input.eventYear);s.location={...(s.location||{}),region:String(input.location||'')};s.source={kind:'narration-derived-representative-staging',narration:String(input.narration||'')};
   return base.deepFreeze(s);
  }
  const patched=base.deepFreeze({...base,metadata,plan,crossTopicGuardVersion:VERSION});
  window.NERCore5=patched;
  function repairStaleScene(card){
   const R=window.NERCore5Runtime;if(!R?.manages?.(card)||R.protectedPanel(card))return false;
   const topic=document.getElementById('topic')?.value||'',fam=patched.family(topic);if(fam!=='earthquake')return false;
   let oldSpec=null;try{oldSpec=card.dataset.core5Spec?JSON.parse(card.dataset.core5Spec):null;}catch{}
   const legacy=String(card.querySelector('.video-scene')?.value||card.dataset.videoScene||'');
   const narration=String(card.querySelector('.narration')?.value||'');
   const staleSpec=!!oldSpec&&!identityMatches(oldSpec,{stage:card.dataset.stage,topic,narration,eventYear:metadata(topic,{}).year,location:metadata(topic,{}).location},fam);
   // The earlier broad 'bridges/parks/schools' matcher incorrectly selected
   // reconstruction for active collapse, displacement and utility-failure beats.
   // Repair only a recognizable *unreviewed* generated reconstruction scene.
   const mistakenReconstruction=!oldSpec&&/representative reconstruction work area|restrained work-site ambience/i.test(legacy)&&/collapsed|failed|disrupt|fled|refuge|open grounds/i.test(narration);
   if(!staleSpec&&!staleFamilyText.test(legacy)&&!mistakenReconstruction)return false;
   const fresh=R.reviewSpec(card),v=patched.validate(fresh);if(!v.ok)return false;
   R.applyReview(card,fresh);R.build(card);return true;
  }
  window.addEventListener('ld:production-built',()=>queueMicrotask(()=>{
   let changed=0;for(const card of document.querySelectorAll('.stage-card')){try{if(repairStaleScene(card))changed++;}catch(e){console.warn('Core 5 cross-topic repair skipped',card?.dataset?.stage,e);}}
   if(changed)try{window.LDCore?.saveCurrent?.();}catch{}
  }));
 }
 try{
  await window.NERProjectStorage.initialize();
  for(const original of document.querySelectorAll('script[type="application/x-ner-module"]')){
   const script=document.createElement('script');for(const attr of original.attributes)if(attr.name!=='type')script.setAttribute(attr.name,attr.value);
   if(original.src){await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(Error('App file could not load: '+original.getAttribute('src')));original.replaceWith(script);});}
   else{script.textContent=original.textContent;original.replaceWith(script);}
   if((original.getAttribute('src')||'').split('?')[0].endsWith('ner-core-5.js'))installCore5CrossTopicGuard();
  }
  restore.forEach(f=>f());
  for(const event of ['DOMContentLoaded','load'])for(const x of queued){if(x.event!==event||x.cancelled||x.options?.signal?.aborted)continue;const e=new Event(event);if(typeof x.listener==='function')x.listener.call(x.target,e);else x.listener?.handleEvent(e);}
  window.NERProjectStorage.mount();if(shell)shell.inert=false;
 }catch(e){restore.forEach(f=>f());const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='NER Studio paused safely: '+e.message+' No project data was cleared.';document.body.prepend(p);}
})();
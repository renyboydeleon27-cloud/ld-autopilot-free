/* Core 5: pure StageSpec -> preflight -> compiler. No DOM, storage, or network. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NERCore5=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const VERSION='5.0.2';
const STAGES=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
const ROLES=['hook','normal-world','cause-context','onset','human-impact','human-toll','displacement','response','evidence','accountability','recovery','aftermath','legacy','ending'];
const FAMILIES={
 'atmospheric-pollution':/smog|air pollution|coal smoke/i,
 'chemical-wmd':/chemical attack|chemical weapon|sarin|halabja/i,
 'public-health':/xylazine|opioid|fentanyl|epidemic|pandemic|outbreak|disease/i,
 'industrial-technological':/reactor|chernobyl|industrial|factory|refinery|toxic leak/i,
 'biological-agricultural':/locust|famine|crop failure/i,
 tsunami:/tsunami/i,avalanche:/avalanche|snowslide/i,landslide:/aberfan|landslide|mudslide|rockslide|coal.tip/i,
 cyclone:/cyclone|hurricane|typhoon/i,tornado:/tornado/i,earthquake:/earthquake|quake/i,
 flood:/flood|dam|levee/i,volcano:/volcan|tambora|eruption/i,wildfire:/wildfire|firestorm|fire/i
};
const GUARDS={
 'atmospheric-pollution':'Pollution and visibility follow the narrated phase. No explosions, collapsing buildings, disaster debris, invented treatment or instant citywide clean-up. Indoor coal fires stay contained in the fireplace. Render haze only in true grayscale.',
 'public-health':'Human-centered support only; no forced disaster escalation, invented treatment, diagnosis, or recovery outcome.',
 'chemical-wmd':'Show only sourced exposure effects; never invent a visible gas color or unsupported munition.',
 'industrial-technological':'Only sourced machinery and mechanisms; no invented explosion or technical procedure.',
 'biological-agricultural':'Preserve individual organism scale and crop state; insects remain separate insects, never smoke.',
 tsunami:'Water obeys gravity, terrain and mass; no unsupported wave height.',
 avalanche:'Dense snow follows the slope with gravity and mass; no smoke substitute.',
 landslide:'Slope material obeys gravity and terrain; no renewed collapse in a retrospective scene.',
 cyclone:'Wind, water and debris directions remain coherent; no unsupported sub-hazard.',
 tornado:'Preserve funnel geography and sourced damage extent; no unsupported intensity.',
 earthquake:'Supported shaking precedes structural failure; no unrelated tsunami or fire.',
 flood:'Water follows terrain; no unsupported breach or water level.',
 volcano:'Only sourced eruption mechanisms and deposits; no invented lava flow.',
 wildfire:'Fire spread follows fuel and wind; no unsupported explosion.',
 'generic-evidence':'Only mechanisms explicitly supported by the narration and supplied facts.'
};
function deepFreeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(deepFreeze);Object.freeze(x);}return x;}
function clone(x){return JSON.parse(JSON.stringify(x));}
function stable(x){if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x);}
function metadata(topic,saved={}){
 const raw=String(topic||''),parts=raw.split(/\s+[—–-]\s+/),named=raw.match(/\b(?:smog|fire|flood|earthquake|tsunami|eruption|disaster)\s+(?:of|in)\s+([^():]+?)\s*\((1\d{3}|20\d{2})\)/i);
 let inferred=parts.length>=3?(/^\d{4}$/.test(parts.at(-1).trim())?parts.at(-2):parts[1]):named?.[1]||'';
 inferred=inferred.replace(/\b(?:1\d{3}|20\d{2}|2100)\b/g,'').replace(/^[\s,;:\-]+|[\s,;:\-]+$/g,'').trim();
 if(/\bSan Francisco Earthquake\b/i.test(raw)&&/^California,\s*USA$/i.test(inferred))inferred='San Francisco, California, USA';
 return {year:String(saved.year||'').trim()||(raw.match(/\b(?:1\d{3}|20\d{2}|2100)\b/)||[])[0]||'',location:String(saved.location||'').trim()||inferred};
}
function family(topic){return Object.keys(FAMILIES).find(k=>FAMILIES[k].test(topic))||'generic-evidence';}
function role(n,stage){
 if(stage==='HOOK')return 'hook';if(stage==='ENDING')return 'ending';
 if(/parliament.*passed|passed.*(?:act|law)|clean air act/i.test(n))return 'accountability';
 const rules=[['legacy',/decades later|years later|years to achieve|lasting warning|remembrance|memorial|legacy|remember/i],['accountability',/clean air act|passed.*(?:act|law)|responsibility|accountability|preventab|tribunal.*found|negligence/i],['evidence',/tribunal|investigat|evidence|inquiry|report|identified/i],['human-toll',/killed|death toll|fatalities|died/i],['response',/\b(?:aid|relief|outreach|workers|volunteers)\b[^.!?;]{0,45}\b(?:supported|assisted|helped|provided|delivered)\b|\b(?:provided|delivered|received)\b[^.!?;]{0,30}\b(?:aid|relief|support)\b/i],['displacement',/evacuat|fled|displaced|refuge/i],['response',/rescue|aid|medical|outreach|support|care/i],['recovery',/rebuild|recovery|reconstruct/i],['human-impact',/breathing became|difficult to breathe|visibility.*collapsed|buses stopped|polluted air slipped|struck.*school|buried|injur|survivor|symptom|wound/i],['onset',/fog settled|fog thickened|collapsed|erupted|struck|landfall|released|began/i],['aftermath',/cleared the smog|aftermath|mourning|grief/i]];
 return rules.find(([,r])=>r.test(n))?.[0]||(stage==='P1'?'normal-world':'cause-context');
}
function chronology(n,eventYear){
 const later=/decades (?:later|after)|years later|generations later|long after|years to achieve|lasting warning/i.test(n),before=/years (?:earlier|before)|before the disaster|flashback/i.test(n),after=/tribunal|inquiry|aftermath|after the disaster|following the disaster|years that followed|deaths afterward/i.test(n);
 const years=[...String(n).matchAll(/\b(?:1\d{3}|20\d{2})\b/g)].map(x=>Number(x[0]));
 const explicit=years.length===1?years[0]:null;
 const relation=explicit!==null?(explicit<eventYear?'before':explicit>eventYear?'later':later?'later':before?'before':after?'after':'event'):later?'later':before?'before':after?'after':'event';
 const sceneYear=explicit!==null&&!(explicit===eventYear&&relation!=='event')?explicit:relation==='event'?eventYear:null;
 return {relation,sceneYear,period:sceneYear!==null?String(sceneYear):relation==='later'?'unspecified later period':relation==='before'?'unspecified earlier period':'unspecified post-event period',basis:n||'Project event year'};
}
// Narrative motifs select representative staging, independent of panel number or event name.
function pollutionRecipe(r,n){
 const base={cast:[{id:'adult-1',description:'unnamed adult resident in clothing appropriate to the scene period'}],camera:{framing:'eye-level medium-wide',movement:'slow-push-in'},audio:'quiet scene-supported ambience'};
 const make=(location,action,audio=base.audio)=>({...base,location,action,audio});
 if(r==='ending')return make('quiet reflective local setting','adult-1 stands at rest');
 // The narrated phase wins over background words such as "trapped pollution".
 if(r==='onset'&&/fog|haze|smog/i.test(n))return {...make('street-level view along a local street with period-appropriate buildings and pavement; thin grayscale fog already softens distant facades and gradually obscures them further, while the nearby doorway and resident remain visible; little air movement, no sudden wall of smoke or rapid day-to-night change','adult-1 comes to a gentle stop beside a doorway, keeping their gaze directed down the increasingly obscured street','soft footsteps cease as the resident stops; subdued distant urban ambience'),camera:{framing:'eye-level medium-wide rear three-quarter view, with the resident in the foreground and the street visible ahead',movement:'slow-push-in'}};
 if(/coal fires|coal-burning fireplace|fed.*fires/i.test(n))return {...make('interior of a modest local home with a contained coal-burning fireplace','adult-1 adds one small shovelful of coal to the fireplace','quiet indoor room tone, soft fire crackling and coal settling on the grate during the action'),choreography:{
  actor:'adult-1',prop:'one short rigid metal coal shovel',
  start:'adult-1 kneels securely beside the hearth, holding an already-loaded shovel level in the right hand, close to the grate; the left hand rests on the bent knee',
  motion:'keeping the same grip, move the blade just above the grate, tip the coal onto the fire once, then return the empty blade to a level position just outside the fireplace opening',
  end:'the adult remains balanced; the right hand holds the empty shovel steady outside the opening and the left hand stays on the knee; coal remains on the grate, with no second scoop or refilling',
  setting:'plain plaster walls, a simple wooden chair and a metal coal scuttle beside the hearth; intact room with no indoor smog or modern appliances; these are representative furnishings, not a documented individual household',
  continuity:'keep the blade, handle and grip unchanged; coal falls under gravity and stays on the grate; fire remains small and contained, with no flare-up; use a plain wool cardigan, collared shirt, straight trousers and practical shoes appropriate to the scene period; preserve the same clothing, face and hands',
  visibility:'keep the working hand, shovel blade and fireplace opening visible throughout the action',
  sound:'one soft coal rattle synchronized with coal contacting the grate; gentle fire crackling and quiet room tone; no scraping without visible contact'
 }};
 if(/passed.*(?:act|law)|parliament|clean air act/i.test(n))return {...make('representative legislative office in the stated later period, with a plain desk and no readable writing','adult-1 places one closed blank document folder on the desk','quiet indoor room tone'),camera:{framing:'eye-level medium view of the desk',movement:'locked'}};
 if(/demanded cleaner air|accountability/i.test(n))return make('representative local meeting room after the pollution episode','adult-1 raises one hand toward the front of the room','subdued room ambience without speech');
 if(r==='legacy')return make('local street in an unspecified later period, with buildings visible and no suggestion of an overnight transformation','adult-1 walks slowly toward a visible doorway','soft footsteps and quiet street ambience');
 if(/cleared the smog|buildings emerged/i.test(n))return make('local street as the pollution haze disperses, with buildings visible again','adult-1 slowly raises their gaze toward the newly visible buildings','quiet street ambience');
 if(/death|died|toll/i.test(n))return make('quiet interior representing the human loss caused by the pollution episode, without bodies or invented ceremony','adult-1 slowly lowers their head','quiet room tone');
 if(/lung disease|breathing|breathe/i.test(n))return make('modest local home during the pollution episode','adult-1 rests seated and takes one slow breath, without treatment or an asserted recovery','quiet room tone and restrained natural breathing');
 if(/under doors|inside.*homes|cracks/i.test(n))return make('interior beside a closed exterior door, with a thin pollution haze near the threshold','adult-1 slowly turns toward the door','muted indoor ambience');
 if(/buses|drivers|cars/i.test(n))return make('local road in dense pollution haze, beside a stationary period-appropriate bus','adult-1 stops walking beside the stationary bus','soft footsteps that stop with the person');
 if(/visibility|pavement|familiar streets/i.test(n))return make('local pavement in dense pollution haze, with only nearby railings clearly visible','adult-1 takes one cautious step along the visible railing','one soft footstep and subdued street ambience');
 if(/chimneys|factories|power stations/i.test(n)&&!/warmer air|trapped|disperse/i.test(n))return make('local street with period-appropriate household and industrial chimneys releasing coal smoke in the background','adult-1 pauses beside a plain gate','footsteps settling into distant urban ambience');
 if(/warmer air|trapped|disperse/i.test(n))return make('local viewpoint overlooking period-appropriate rooftops and chimneys, with a low lingering layer of coal smoke','adult-1 slowly raises their gaze toward the smoke above the rooftops','subdued distant urban ambience');
 if(r==='hook'||/fog|haze|smog/i.test(n))return make('local street during the onset of a pollution episode, with nearby buildings gradually obscured by grayscale haze','adult-1 pauses beside a doorway and turns their head toward the obscured street','soft footsteps followed by quiet street ambience');
 return null;
}
// Recipes are reusable semantic staging, not new historical claims or panel overrides.
function recipe(r,f,narration=''){
 if(f==='atmospheric-pollution'){const p=pollutionRecipe(r,narration);if(p)return p;}
 const quiet={location:'quiet representative local setting',cast:[{id:'adult-1',description:'unnamed adult observer'}],action:'adult-1 slowly lowers their head',camera:{framing:'human-height medium-wide',movement:'slow-push-in'},audio:'quiet local ambience'};
 const recipes={
 evidence:{location:'representative inquiry room',cast:[{id:'adult-1',description:'unnamed adult investigator'},{id:'adult-2',description:'distinct adult observer'},{id:'adult-3',description:'distinct adult observer'}],action:'adult-1 traces one finger along a single unlabelled evidence sketch, stopping at its edge',camera:{framing:'human-height close-medium evidence table',movement:'slow-push-in'},audio:'quiet indoor room tone'},
 accountability:{location:'representative inquiry findings room',cast:[{id:'adult-1',description:'unnamed standing adult representative'},{id:'adult-2',description:'distinct seated adult listener'},{id:'adult-3',description:'distinct seated adult listener'}],action:'adult-1 lowers one closed blank findings folder to rest against the front of a plain desk',camera:{framing:'human-height frontal medium',movement:'locked'},audio:'quiet indoor room tone'},
 legacy:{...quiet,location:'unmarked representative outdoor remembrance setting',cast:[{id:'adult-1',description:'unnamed adult visitor'},{id:'adult-2',description:'distinct adult visitor'}]},
 response:{...quiet,location:'representative local support setting',cast:[{id:'adult-1',description:'fully clothed seated adult visitor'},{id:'adult-2',description:'distinct nearby adult support worker, physically separate'}],action:'adult-1 slowly raises their head and eye-line toward adult-2',audio:'quiet setting ambience'},
 displacement:{...quiet,location:'visible local route toward shelter',action:'adult-1 walks steadily to a visible sheltered threshold'},
 recovery:{...quiet,location:'representative settled recovery area',action:'adult-1 lifts one small loose debris piece and places it on a nearby pile'},
 'normal-world':{...quiet,location:'ordinary local street before the event',action:'adult-1 walks to the edge of a plain doorway'},
 aftermath:{...quiet,location:'settled representative local aftermath',action:'adult-1 slowly lowers their head'},
 'human-toll':{...quiet,location:'settled non-graphic local aftermath'},
 ending:{...quiet,location:'quiet reflective local setting'},
 hook:{...quiet,location:'local setting at the narrated warning or onset',action:'adult-1 turns once toward the supported warning'},
 onset:{...quiet,location:'local setting at the narrated onset',action:'adult-1 turns once toward the supported hazard'},
 'human-impact':{...quiet,location:'local setting showing only narrated non-graphic impact',action:'adult-1 takes one supported step toward stable footing'},
 'cause-context':{...quiet,location:'local viewpoint of the narrated cause',action:'adult-1 turns once toward the supported contextual feature'}
 };
 const p=recipes[r]||quiet;
 if(r==='evidence'&&f==='landslide'&&/water beneath|water.*coal.tip/i.test(narration))return {...p,action:'adult-1 traces one finger along the water layer in one unlabelled coal-tip cross-section sketch'};
 if(f==='public-health'&&['legacy','human-impact','onset'].includes(r))return recipes.response;
 return p;
}
function plan(input){
 const f=family(input.topic),r=role(input.narration,input.stage),p=recipe(r,f,input.narration),eventYear=Number(input.eventYear);
 const time=chronology(input.narration,eventYear);
 if(input.stage==='ENDING'&&time.relation==='event'){time.relation='after';time.sceneYear=null;time.period='unspecified reflective post-event period';time.basis='Representative ending illustration; exact date not asserted';}
 return deepFreeze({schema:5,compilerVersion:VERSION,stage:input.stage,topic:input.topic,family:f,role:r,
 narration:String(input.narration||''),facts:clone(input.facts||[]),eventYear,chronology:time,
 location:{region:String(input.location||''),setting:p.location},cast:p.cast,
 action:{actor:'adult-1',description:p.action},camera:input.stage==='ENDING'?{...p.camera,movement:'locked'}:p.camera,
 timing:input.stage==='ENDING'?[]:[{start:0,end:2,phase:'establish'},{start:2,end:6,phase:'action'},{start:6,end:10,phase:'hold'}],
 locks:{style:'2d-historical-anime',color:'bw',aspect:'9:16',duration:input.stage==='ENDING'?null:10,shots:1,text:'none'},
 audio:p.audio,source:{kind:'narration-derived-representative-staging',narration:String(input.narration||'')},
 ...(!input.spec&&p.choreography?{choreography:{...clone(p.choreography),forAction:p.action,forSetting:p.location,forCast:stable(p.cast)},timing:[{start:0,end:2,phase:'establish'},{start:2,end:7,phase:'action'},{start:7,end:10,phase:'hold'}]}:{}),
 ...(input.spec?clone(input.spec):{})});
}
// Explicit enrichment only: never replace a custom scene or silently mutate an audited spec.
function refine(s){
 const v=validate(s);if(!v.ok)throw Error(v.issues.join(' '));if(s.choreography)return s;
 const p=recipe(s.role,s.family,s.narration);
 if(!p.choreography||s.stage==='ENDING'||s.action.actor!==p.choreography.actor||s.action.description!==p.action||s.location.setting!==p.location||stable(s.cast)!==stable(p.cast))return s;
 return deepFreeze({...clone(s),choreography:{...clone(p.choreography),forAction:p.action,forSetting:p.location,forCast:stable(p.cast)},timing:[{start:0,end:2,phase:'establish'},{start:2,end:7,phase:'action'},{start:7,end:10,phase:'hold'}]});
}
function validate(s){
 const issues=[];if(!s||typeof s!=='object')return {ok:false,issues:['Missing StageSpec.']};
 if(s.schema!==5||s.compilerVersion!==VERSION)issues.push('Unsupported StageSpec version.');
 if(!STAGES.includes(s.stage))issues.push('Unknown stage.');
 if(!ROLES.includes(s.role))issues.push('Unknown semantic role.');
 if(s.source?.kind==='narration-derived-representative-staging'&&s.role!==role(s.narration,s.stage))issues.push('Stage role contradicts the narration-derived source role.');
 if(s.source?.kind!=='narration-derived-representative-staging')issues.push('Unsupported scene source.');
 if(s.family!==family(s.topic))issues.push('Disaster family differs from project topic.');
 if(!GUARDS[s.family])issues.push('Unknown disaster family.');
 if(typeof s.topic!=='string'||typeof s.narration!=='string'||(s.stage!=='ENDING'&&!s.narration.trim()))issues.push('Narration/source boundary is missing.');
 if(s.source?.narration!==s.narration)issues.push('Narration changed since the StageSpec was planned.');
 if(!Number.isInteger(s.eventYear)||s.eventYear<1)issues.push('Event year must be explicit.');
 const c=s.chronology||{};
 if(c.sceneYear!==null&&/^\d{4}$/.test(String(c.period))&&Number(c.period)!==c.sceneYear)issues.push('Scene period label contradicts scene year.');
 if(!['event','before','after','later'].includes(c.relation)||!c.period||!c.basis)issues.push('Scene chronology needs a relation, period and source basis.');
 if(c.sceneYear!==null&&(!Number.isInteger(c.sceneYear)||(c.relation==='event'?c.sceneYear!==s.eventYear:c.relation==='before'?c.sceneYear>s.eventYear:c.relation==='after'?c.sceneYear<s.eventYear:c.sceneYear<=s.eventYear)))issues.push('Scene year contradicts its relation to the event year.');
 const narrativeTime=chronology(s.narration,s.eventYear),implied=narrativeTime.relation;
 if(narrativeTime.sceneYear!==null&&narrativeTime.sceneYear!==s.eventYear&&c.sceneYear!==narrativeTime.sceneYear)issues.push('Scene year differs from the explicit narrated year.');
 if(implied!=='event'&&implied!==c.relation&&!(implied==='after'&&c.relation==='later'))issues.push('Scene chronology contradicts narration.');
 if(/supported (?:warning|hazard|contextual feature)|narrated (?:cause|onset|warning|non-graphic impact)/i.test([s.location?.setting,s.action?.description].join(' ')))issues.push('Scene needs concrete setting and action: replace placeholder hazard/context wording in Review Core 5 scene before audit.');
 if(!s.location?.region||!s.location?.setting)issues.push('Scene location is missing.');
 if(s.family==='atmospheric-pollution'&&s.role==='onset'&&/fog|haze|smog/i.test(s.narration)&&s.location?.setting==='local viewpoint overlooking period-appropriate rooftops and chimneys, with a low lingering layer of coal smoke'&&s.action?.description==='adult-1 slowly raises their gaze toward the smoke above the rooftops')issues.push('Onset scene repeats the old rooftop cause-context recipe. Use Prepare episode scenes · FREE or review this scene to show the narrated loss of street visibility before audit.');
 if(!Array.isArray(s.cast)||!s.cast.length||new Set(s.cast.map(x=>x?.id)).size!==s.cast.length||s.cast.some(x=>!x?.id||!x?.description))issues.push('Cast identities must be explicit and unique.');
 if(!s.action?.description||!(Array.isArray(s.cast)&&s.cast.some(x=>x?.id===s.action?.actor)))issues.push('Primary action must name a cast actor.');
 if(!['locked','slow-push-in','slow-pull-back','lateral-track'].includes(s.camera?.movement)||!s.camera?.framing)issues.push('Choose exactly one supported camera movement and framing.');
 if(stable(s.locks)!==stable({style:'2d-historical-anime',color:'bw',aspect:'9:16',duration:s.stage==='ENDING'?null:10,shots:1,text:'none'}))issues.push('Project rendering/timing/text locks conflict.');
 const t=s.timing;
 if(s.stage==='ENDING'){if(!Array.isArray(t)||t.length||s.camera?.movement!=='locked')issues.push('Illustration ending requires a static composition and no video timing.');}
 else if(!Array.isArray(t)||t.length!==3||t[0]?.start!==0||t[2]?.end!==10||t.some((x,i)=>!x||!Number.isFinite(x.start)||!Number.isFinite(x.end)||x.end<=x.start||(i&&x.start!==t[i-1]?.end)||x.phase!==['establish','action','hold'][i]))issues.push('Timing must cover exactly 0–10 seconds with contiguous establish/action/hold phases.');
 if(s.choreography!==undefined){
  const d=s.choreography,keys=['forAction','forSetting','forCast','actor','prop','start','motion','end','setting','continuity','visibility','sound'];
  if(!d||typeof d!=='object'||Array.isArray(d)||keys.some(k=>typeof d[k]!=='string'||!d[k].trim())||Object.keys(d).some(k=>!keys.includes(k)))issues.push('Action detail contract is incomplete or contains unknown fields.');
  if(d?.forAction!==s.action?.description||d?.forSetting!==s.location?.setting||d?.forCast!==stable(s.cast))issues.push('Action details no longer match the scene, action or cast. Review the choreography.');
  if(d?.actor!==s.action?.actor)issues.push('Action details must use the primary actor.');
  if(s.stage==='ENDING')issues.push('Static ending cannot include motion choreography.');
 }
 // Instruction-bearing fields are typed data, never entire legacy prompts. Fail closed.
 const prose=[s.location?.region,s.chronology?.period,s.location?.setting,s.action?.description,s.camera?.framing,...(Array.isArray(s.cast)?s.cast:[]).map(x=>x?.description),s.audio,...Object.values(s.choreography||{})].join(' ');
 if(/\b(?:OVERRIDE|TIMING:|CAMERA:|STAGE CONTRACT|PANEL SCENE:|\d+\s*(?:seconds|–\d+s))|\b(?:push.in|pull.back|orbit|cutaway|cut to|photoreal|live.action|full.colou?r)\b/i.test(prose))issues.push('Embedded prompt/camera/style instructions must be resolved into structured fields.');
 if(!Array.isArray(s.facts)||s.facts.some(f=>!f?.claim||!f?.source))issues.push('Every supplied historical fact needs source attribution.');
 return {ok:issues.length===0,issues};
}
// Validate only available canonical scenes. Legacy approved records remain opaque.
function validateSequence(specs){
 const issues=[];let previous=null;const seen=new Set();
 for(const s of specs){const v=validate(s);if(!v.ok){issues.push(...v.issues.map(x=>(s?.stage||'?')+': '+x));continue;}
  if(seen.has(s.stage))issues.push('More than one canonical definition for '+s.stage+'.');seen.add(s.stage);
  if(previous){
   if(s.topic!==previous.topic||s.eventYear!==previous.eventYear||s.family!==previous.family)issues.push(s.stage+': project historical identity differs from the preceding scene.');
   if(previous.role==='cause-context'&&s.role==='onset'&&s.location.setting===previous.location.setting&&s.action.description===previous.action.description)issues.push(s.stage+': onset repeats the preceding cause-context setting and action; review the scene progression before audit.');
   const a=previous.chronology,b=s.chronology;
   if(a.sceneYear!==null&&b.sceneYear!==null&&b.sceneYear<a.sceneYear&&b.relation!=='before')issues.push(s.stage+': chronology moves backward without an explicit flashback.');
  }previous=s;
 }return {ok:!issues.length,issues};
}
function compile(s){
 const v=validate(s);if(!v.ok)throw new Error('Local preflight — no audit credits used: '+v.issues.join(' '));
 const c=s.chronology,still=s.stage==='ENDING';
 const scene=[s.location.setting+' in '+s.location.region+'.',...s.cast.map(x=>x.id+': '+x.description+'.'),'Exactly '+s.cast.length+' distinct people.'].join(' ');
 return [
 still?'ILLUSTRATION PROMPT — STATIC ENDING':'VIDEO PROMPT — EXACTLY 10 SECONDS',s.topic+' · '+s.stage,
 'RENDER: Hand-drawn 2D historical anime only. Strict true black-and-white grayscale, portrait 9:16. No color, sepia, tint, selective color, live action, photorealism or 3D CGI.',
 'STAGE ROLE: '+s.role+'; family: '+s.family+'.',
 'CHRONOLOGY: Historical event year '+s.eventYear+'. Scene period: '+c.period+'; relation: '+c.relation+(c.sceneYear===null?'; exact scene year unspecified.':'; scene year '+c.sceneYear+'.')+' Clothing, objects and surroundings follow the SCENE period.',
 'FACTUAL BOUNDARY: Narration and supplied facts are context, not additional scene actions. Representative unnamed staging is not a claim about a specific historical person or ceremony.',
 'NARRATION CONTEXT (editorial only, never generated speech): '+JSON.stringify(s.narration),
 'SOURCED FACTS (context only): '+JSON.stringify(s.facts),
 'PANEL SCENE:\n'+scene,
 (still?'DEPICT THE COMPLETED STATE OF: ':'PRIMARY ACTION: ')+s.action.description+'.',
 s.choreography?'ACTION DETAIL CONTRACT:\nProp: '+s.choreography.prop+'.\nStarting state: '+s.choreography.start+'.\nMotion: '+s.choreography.motion+'.\nCompleted state: '+s.choreography.end+'.\nRepresentative setting detail: '+s.choreography.setting+'.\nContinuity: '+s.choreography.continuity+'.\nVisibility: '+s.choreography.visibility+'.':'',
 'CAMERA: '+s.camera.framing+'; '+s.camera.movement+(still?'. Static composition.':'. One continuous shot; maintain this single camera behavior for the entire shot.'),
 still?'':'TIMING:\n'+s.timing.map(t=>t.start+'–'+t.end+'s: '+({establish:'Establish the stated cast and setting; primary action has not yet completed.',action:'Perform the single PRIMARY ACTION, completing by '+t.end+'s.',hold:'Hold its completed state; only natural breathing, blinking and residual motion.'}[t.phase])).join('\n'),
 'PHYSICS AND TIME: Preserve identities, cast count, object geometry, mass, gravity and irreversible changes. No teleportation, duplication, morphing, object respawn or spontaneous repair.',
 'FAMILY BOUNDARY: '+GUARDS[s.family],
 'WEATHER: Preserve scene-supported weather, lighting and wind direction; no unexplained reset.',
 'CHARACTER DIVERSITY: Keep each person distinct in face, build, hair and clothing, and consistent throughout the shot.',
 still?'':'AUDIO: '+(s.choreography?.sound||s.audio)+'. Only sounds caused by the stated scene. No generated narration, dialogue, music, unsupported alarm or cinematic boom.',
 'NEGATIVE: No generated text, inscriptions, lettering, numbers, symbols, subtitles, logos or watermarks. No cuts, extra purposeful action, unsupported historical detail or invented ceremony.'
 ].filter(Boolean).join('\n\n');
}
function payload(s){return deepFreeze({core5:true,core5Version:VERSION,stageSpec:s,topic:s.topic,stage:s.stage,format:'shorts',visualMode:'anime',colorMode:'bw',year:String(s.eventYear),sceneYear:s.chronology.sceneYear,scenePeriod:s.chronology.period,location:s.location.region,narration:s.narration,currentScene:s.location.setting+'; '+s.action.description,currentPrompt:compile(s),eventSpecificOverride:true,progressionFamily:s.family,progressionRole:s.role,progressionRule:'Use only the supplied canonical StageSpec. No numeric-stage defaults.'});}
function validatePayload(p){const v=validate(p?.stageSpec);if(!v.ok)return v;const expected=payload(p.stageSpec);return stable(expected)===stable(p)?{ok:true,issues:[]}:{ok:false,issues:['Audit payload differs from the canonical StageSpec/compiler output.']};}
function transaction(p,result){const v=validatePayload(p);if(!v.ok)throw Error(v.issues.join(' '));if(result?.result!=='PASS'||result?.ok!==true||!Array.isArray(result.issues)||result.issues.length)throw Error('Audit did not pass.');return deepFreeze({version:VERSION,status:'AUDITED',payload:clone(p),prompt:p.currentPrompt,result:clone(result)});}
return deepFreeze({VERSION,STAGES,ROLES,GUARDS,stable,clone,deepFreeze,metadata,family,role,chronology,plan,refine,validate,validateSequence,compile,payload,validatePayload,transaction});
});

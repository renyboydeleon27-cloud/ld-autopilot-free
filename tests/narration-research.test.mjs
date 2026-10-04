import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyTopic} from '../api/ai-research.js';
import {validateResearch,readEvidencePool,assessEvidencePool,expandResearch,classifyEvidence,researchRequest,POOL_QUOTAS} from '../api/narration-research.js';
const topic='Test Tornado — Example — 1989';
const urls=['https://www.noaa.gov/test-event','https://wmo.int/test-event'];
function fact(claim,evidenceType,phase,factKey){return {claim,evidenceType,phase,factKey,support:'Synthetic fixture support for '+factKey,sourceUrl:urls[0],disputed:false};}
// Synthetic facts exercise the allocator; these are not historical assertions.
const facts=[
 fact('The test tornado struck Example on 26 April 1989.','event_identity','identity','event_identity'),
 fact('A storm formed over the western plain.','precursor_onset','precursor','storm_formation'),
 fact('The funnel first touched down beside the river.','precursor_onset','onset','funnel_touchdown'),
 fact('The tornado destroyed houses across the town.','physical_impact','impact','house_destruction'),
 fact('A bridge collapsed into the channel.','physical_impact','impact','bridge_collapse'),
 fact('Falling debris damaged the electric substation.','physical_impact','impact','power_damage'),
 fact('Orchard trees were uprooted across farmland.','physical_impact','impact','orchard_destruction'),
 fact('The storm flooded crop fields farther east.','physical_impact','impact','fields_flooded'),
 fact('Residents suffered injuries from flying fragments.','human_impact','human_impact','residents_injuries'),
 fact('Hundreds of survivors slept outdoors for several nights.','human_impact','human_impact','survivors_outdoors'),
 fact('Several people died in the affected settlement.','human_impact','human_impact','event_deaths'),
 fact('An army convoy delivered emergency supplies.','aftermath_response','response','army_supplies'),
 fact('Volunteers rescued trapped residents from rubble.','aftermath_response','response','volunteer_rescue'),
 fact('Doctors treated the injured in a temporary hospital.','aftermath_response','response','medical_response'),
 fact('New building codes were introduced following the event.','legacy','legacy','building_code_reform')
];
function fixture(claims=facts){return {status:'completed',usage:{input_tokens:100,output_tokens:100},output:[{type:'web_search_call',action:{type:'search',sources:urls.map(url=>({url}))}}],output_text:JSON.stringify({eventMatch:true,year:1989,location:'Example',identitySources:urls,claims:structuredClone(claims)})};}
const base={validation:{status:'NEEDS_REVIEW'},narrationGate:{allowed:false}};
function stub(responses,requests,usage=[]){return {apiKey:'test',fetchImpl:async(_,args)=>{requests.push(JSON.parse(args.body));return {ok:true,json:async()=>responses.shift()}},onUsage:u=>usage.push(u)};}
test('major hazard routing stays independent',()=>{for(const [t,k] of [['Tambora Eruption','volcano'],['Cyclone Nargis','cyclone'],['China Floods','flood'],['Haiti Earthquake','earthquake'],['Sanriku Tsunami','tsunami'],['Tri-State Tornado','tornado'],['Wellington Avalanche','avalanche']])assert.equal(classifyTopic(t),k);});
test('15 slots have physical HOOK, one identity, ordered event phases, at most one legacy',()=>{
 const r=validateResearch(fixture(),topic);assert.equal(r.storyPlan.length,15);assert.equal(r.storyPlan[0].evidenceType,'physical_impact');assert.equal(r.storyPlan[1].evidenceType,'event_identity');assert.equal(r.storyPlan.at(-1).evidenceType,'legacy');assert(r.evidencePoolQuality.passed);
 const rank={precursor:0,onset:1,impact:2,human_impact:3,response:4,recovery:5,legacy:6};const phases=r.storyPlan.slice(2).map(x=>rank[x.phase]);assert.deepEqual(phases,[...phases].sort((a,b)=>a-b));assert.equal(r.storyPlan.filter(x=>x.evidenceType==='event_identity').length,1);
});
test('morphology accepts destroyed, survivors, injuries and collapsed',()=>{for(const f of facts.filter(x=>['physical_impact','human_impact'].includes(x.evidenceType)))assert.equal(classifyEvidence(f),f.evidenceType);});
test('Bangladesh regression: archive/process/coordinates never fill slots, even falsely tagged physical',()=>{
 const bad=['The NOAA archival document includes first-hand-cited reportage language.','WMO records of weather and climate extremes cover the period from the nineteenth century.','The NOAA PDF appears as part of a technical evaluation of mortality reports.','Both WMO and NOAA materials have documented and discussed the tornado.','A historian describes newspaper sourcing for this disaster.','The event coordinates are latitude and longitude in the database.','Retrospective summaries contain accounts of damage.'];
 for(const claim of bad)assert.equal(classifyEvidence(fact(claim,'physical_impact','impact','bad')),'source_metadata',claim);
 const thin=facts.slice(0,5).concat(bad.map((x,i)=>fact(x,'physical_impact','impact','bad_'+i)));
 assert.throws(()=>validateResearch(fixture(thin),topic),e=>e.code==='EVIDENCE_POOL_INSUFFICIENT'&&e.quality.rejected.source_metadata===bad.length);
});
test('ranking is legacy only; actual sourced relief remains a direct fact',()=>{
 const ranking=fact('This was the world’s highest mortality associated with a tornado.','human_impact','human_impact','ranking');assert.equal(classifyEvidence(ranking),'legacy');
 const relief=fact('An army convoy delivered supplies to prevent starvation and disease.','aftermath_response','response','relief');relief.support='NOAA archival document quotes contemporary reporting.';assert.equal(classifyEvidence(relief),'aftermath_response');
});
test('identity fragments, duplicates and metadata cannot inflate quotas',()=>{
 const p=readEvidencePool(fixture([...facts,...facts.map(x=>({...x,claim:x.claim+' ' })),...Array.from({length:12},(_,i)=>fact('The event is located in Example '+i+'.','event_identity','identity','identity_'+i))]),topic);
 assert(p.rejected.duplicate>=15);assert.equal(assessEvidencePool(p).counts.directTotal,14);
 const removed=facts.filter(x=>x.evidenceType!=='human_impact');assert.throws(()=>validateResearch(fixture(removed),topic),e=>e.quality.missing.human_impact===POOL_QUOTAS.human_impact);
});
test('unretrieved sources, disputed facts, wrong year and invalid identity are rejected',()=>{
 for(const mutate of [p=>p.year=1990,p=>p.identitySources=['https://evil.test','https://fake.test']]){const d=fixture(),p=JSON.parse(d.output_text);mutate(p);d.output_text=JSON.stringify(p);assert.throws(()=>validateResearch(d,topic));}
 const d=fixture(facts.map((x,i)=>i===3?{...x,sourceUrl:'https://www.noaa.gov/invented'}:x));assert.throws(()=>validateResearch(d,topic),e=>e.quality.rejected.source===1);
 assert.throws(()=>validateResearch(fixture(facts.map((x,i)=>i===8?{...x,disputed:true}:x)),topic),e=>e.quality.rejected.disputed===1);
});
test('only missing category is expanded; accepted facts and identity are reused',async()=>{
 const t='Expansion Tornado — Example — 1989',requests=[],usage=[];
 // There are enough direct facts overall; only response lacks its quota.
 const extra=[fact('The flood damaged the grain depot.','physical_impact','impact','depot_damage'),fact('A water pipe burst and flooded the market.','physical_impact','impact','market_flood')];
 const initial=facts.filter(x=>x.factKey!=='volunteer_rescue'&&x.factKey!=='medical_response').concat(extra);
 const opts=stub([fixture(initial),fixture(facts.filter(x=>['volunteer_rescue','medical_response'].includes(x.factKey)))],requests,usage);
 const r=await expandResearch(t,base,opts);assert(r.narrationGate.allowed);assert.equal(requests.length,2);const follow=JSON.parse(requests[1].input);assert.equal(follow.mode,'targeted_expansion');assert.deepEqual(follow.missingCategories,['aftermath_response']);assert.equal(follow.shortfalls.aftermath_response,2);assert(follow.acceptedFacts.some(x=>x.factKey==='house_destruction'));assert.equal(usage.length,2);assert(usage.every(x=>x.estimatedCostUsd>=.01));
 const again=await expandResearch(t,base,opts);assert.equal(again.researchExpansion,'cached');assert.equal(requests.length,2);
});
test('insufficient expansion stops before planning; next call expands saved pool, no full cycle',async()=>{
 const t='Sparse Tornado — Example — 1989',requests=[];
 const initial=facts.filter(x=>x.evidenceType!=='aftermath_response');
 const r=await expandResearch(t,base,stub([fixture(initial),fixture([])],requests));assert.equal(r.narrationGate.allowed,false);assert.equal(r.evidencePoolQuality.missing.aftermath_response,3);assert.equal(requests.length,2);assert.equal(r.stageMap,undefined);
 const next=[];await expandResearch(t,base,stub([fixture([])],next));assert.equal(next.length,1);assert.equal(JSON.parse(next[0].input).mode,'targeted_expansion');
});
test('no additional research on healthy pool; conflict and network errors do not trigger full retry',async()=>{
 const req=[];const r=await expandResearch('Healthy Tornado — Example — 1989',base,stub([fixture()],req));assert(r.narrationGate.allowed);assert.equal(req.length,1);
 let calls=0;const opts={apiKey:'test',fetchImpl:async()=>{calls++;throw new Error('network down')}};const conflict={validation:{status:'CONFLICT'},narrationGate:{allowed:false}};assert.equal(await expandResearch('Conflict 1989',conflict,opts),conflict);assert.equal(calls,0);const fail=await expandResearch('Offline 1989',base,opts);assert.equal(fail.narrationGate.allowed,false);assert.equal(calls,1);
});
test('incomplete identity uses targeted confirmation while retaining verified facts',async()=>{
 const initial=fixture();const p=JSON.parse(initial.output_text);p.identitySources=[urls[0],'https://wmo.int/not-retrieved'];initial.output_text=JSON.stringify(p);
 const partial=readEvidencePool(initial,topic);assert.equal(assessEvidencePool(partial).missing.identity_sources,1);assert.equal(partial.pool.length,15);
 const requests=[];const r=await expandResearch('Identity repair Tornado — Example — 1989',base,stub([initial,fixture([])],requests));assert(r.narrationGate.allowed);assert.equal(requests.length,2);assert.deepEqual(JSON.parse(requests[1].input).missingCategories,['identity_sources']);assert.equal(r.evidencePoolQuality.counts.identityAuthorities,2);
});
test('progressive expansion fills remaining deficits across two targeted passes',async()=>{
 const requests=[],usage=[];
 const initial=facts.filter(x=>x.evidenceType!=='aftermath_response');
 const response=facts.filter(x=>x.evidenceType==='aftermath_response');
 const r=await expandResearch('Progressive Tornado — Example — 1989',base,stub([fixture(initial),fixture(response.slice(0,1)),fixture(response.slice(1))],requests,usage));
 assert(r.narrationGate.allowed);assert.equal(requests.length,3);assert.equal(usage.length,3);
 const last=JSON.parse(requests[2].input);
 assert.equal(last.mode,'targeted_expansion');assert.equal(last.shortfalls.aftermath_response,2);
 assert(last.acceptedFacts.some(x=>x.factKey==='army_supplies'));
 assert(last.searchObjectives.some(x=>x.category==='aftermath_response'&&/rescue/.test(x.objective)));
 assert.equal(r.researchProgress.stopReason,'complete');assert.equal(r.researchProgress.rounds.length,3);
});
test('irrelevant new facts and duplicates cannot earn another paid search',async()=>{
 const requests=[];
 const extras=[fact('Flooding damaged the grain depot.','physical_impact','impact','depot'),fact('Landslides buried the rail line.','physical_impact','impact','rail'),fact('Fires burned market stalls.','physical_impact','impact','market')];
 const initial=facts.filter(x=>x.evidenceType!=='aftermath_response').concat(extras);
 const irrelevant=fact('Debris destroyed the school roof.','physical_impact','impact','school');
 const r=await expandResearch('No useful progress Tornado — Example — 1989',base,stub([fixture(initial),fixture([...initial,irrelevant])],requests));
 assert.equal(requests.length,2);assert.equal(r.narrationGate.allowed,false);assert.equal(r.researchProgress.stopReason,'no-progress');
 assert.equal(r.evidencePoolQuality.missing.aftermath_response,3);
});
test('bounded attempts stop safely and cached pool resumes with only missing facts',async()=>{
 const t='Bounded Tornado — Example — 1989',requests=[];
 const initial=facts.filter(x=>x.evidenceType!=='aftermath_response');
 const response=facts.filter(x=>x.evidenceType==='aftermath_response');
 const r=await expandResearch(t,base,{...stub([fixture(initial),fixture(response.slice(0,1)),fixture(response.slice(1,2))],requests),maxAttempts:99});
 assert.equal(requests.length,3);assert.equal(r.narrationGate.allowed,false);assert.equal(r.stageMap,undefined);
 assert.equal(r.researchProgress.stopReason,'attempt-limit');
 const resumed=[];const done=await expandResearch(t,base,stub([fixture(response.slice(2))],resumed));
 assert(done.narrationGate.allowed);assert.equal(resumed.length,1);
 assert.equal(JSON.parse(resumed[0].input).mode,'targeted_expansion');
 assert.equal(JSON.parse(resumed[0].input).shortfalls.aftermath_response,1);
});
test('research time budget prevents starting another request after the deadline',async()=>{
 const realNow=Date.now;let now=realNow();Date.now=()=>now;
 try{
  const requests=[];const opts=stub([fixture(facts.filter(x=>x.evidenceType!=='aftermath_response'))],requests);
  const originalFetch=opts.fetchImpl;opts.fetchImpl=async(...args)=>{const result=await originalFetch(...args);now+=150001;return result;};
  const r=await expandResearch('Deadline Tornado — Example — 1989',base,opts);
  assert.equal(requests.length,1);assert.equal(r.narrationGate.allowed,false);assert.equal(r.researchProgress.stopReason,'time-limit');
 }finally{Date.now=realNow;}
});
test('natural displacement and relief wording passes classification but keeps source and dispute checks',()=>{
 const variants=[fact('The tornado left families without homes.','human_impact','human_impact','lost_homes'),fact('The army brought tents and blankets to the affected town.','aftermath_response','response','tents_brought')];
 for(const f of variants)assert.equal(classifyEvidence(f),f.evidenceType);
 assert.equal(readEvidencePool(fixture(variants),topic).pool.length,2);
 assert.equal(readEvidencePool(fixture(variants.map(x=>({...x,disputed:true}))),topic).pool.length,0);
 assert.equal(readEvidencePool(fixture(variants.map(x=>({...x,sourceUrl:'https://www.noaa.gov/not-retrieved'}))),topic).pool.length,0);
 assert.equal(classifyEvidence(fact('The archive contains reports of tents and blankets brought to town.','aftermath_response','response','metadata')),'source_metadata');
 assert.equal(classifyEvidence(fact('The town manufactured tents and blankets.','aftermath_response','response','unrelated')),'unclassified');
});
test('failed research report includes accepted facts, rejected samples, sources and stop reason',async()=>{
 const bad=fact('The NOAA archive contains a historical evaluation.','physical_impact','impact','metadata');
 const r=await expandResearch('Diagnostic Tornado — Example — 1989',base,stub([fixture([...facts.slice(0,4),bad]),fixture([])],[]));
 assert.equal(r.narrationGate.allowed,false);
 assert.equal(r.researchReport.acceptedFacts.length,4);
 assert.equal(r.researchReport.rejectedFacts[0].reason,'source_metadata');
 assert.equal(r.researchReport.rejectedFacts[0].claim,bad.claim);
 assert.deepEqual(r.researchReport.sources,urls);
 assert.equal(r.researchReport.progress.stopReason,'no-progress');
 assert.equal(r.researchReport.quality.passed,false);
 assert(!JSON.stringify(r.researchReport).includes('Bearer'));
});
test('rejected report samples are bounded while aggregate counts remain accurate',()=>{
 const bad=Array.from({length:100},(_,i)=>fact('An archive contains a report '+i,'physical_impact','impact','bad_'+i));
 const p=readEvidencePool(fixture(bad),topic);
 assert.equal(p.rejected.source_metadata,100);assert.equal(p.rejectedFacts.length,80);
 assert.equal(p.rejectedFacts[0].factKey,'bad_20');
 const next=readEvidencePool(fixture([bad[0]]),topic,p);
 assert.equal(next.rejected.source_metadata,101);assert.equal(next.rejectedFacts.length,80);
});
test('successful and cached research both expose reports without new paid calls',async()=>{
 const requests=[],opts=stub([fixture()],requests),t='Healthy diagnostic Tornado — Example — 1989';
 const r=await expandResearch(t,base,opts);assert.equal(r.researchReport.progress.stopReason,'complete');
 const cached=await expandResearch(t,base,opts);assert.equal(cached.researchReport.progress.stopReason,'cached');
 assert.equal(cached.researchReport.acceptedFacts.length,15);assert.equal(requests.length,1);
});

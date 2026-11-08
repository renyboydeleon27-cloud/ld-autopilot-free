import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {hookCloudTest,assertV5PreviewScope,assertV5InferenceGate,assertLiveV5ProviderPreflight} from '../scripts/ldb-hook-cloud-test.mjs';
import {makeTestPng} from './helpers/make-test-png.mjs';
const TODAY=new Date().toISOString().slice(0,10);
const env={CLOUDFLARE_ACCOUNT_ID:'a437dda5f38ba6b10991684b8388760b',CLOUDFLARE_API_TOKEN:'private-test-token-diagnostic-only-1234',LDB_FREE_PLAN_VERIFIED_DATE:TODAY,LDB_FREE_USAGE_VERIFIED_DATE:TODAY,VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance',LDB_WORKERS_PLAN:'free',FREE_PLAN_CONFIRMED:'true'};
const NOW=Date.now();
const USAGE_REPORT={checkedAt:new Date(NOW).toISOString(),inferenceCalled:false,workerListStatus:200,v5:[],graphqlStatus:200,errors:[],usage:{metric:'totalNeurons',limit:100,httpStatus:200,errors:[],data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:[{sum:{totalNeurons:0}}]}]}}}};
async function harness(failRender=false,{liveUsage=0,liveWorker=false,billingPaid=false,liveHttpFailure=false}={}){
 const bundle=JSON.parse(await readFile(new URL('../ldb-submissions/lake-nyos-1986-test/approved_bundle.json',import.meta.url),'utf8'));
 bundle.schema='ldb-approved-render-job-v1';bundle.render_scenes=Object.entries(JSON.parse(bundle.storyboard_utf8).scenes).map(([id,s])=>({id,image_prompt:s.visual,narration:'Separate narration.',flow_prompt:'EXACTLY 10 SECONDS 0–2s: Start; 2–6s: move; 6–10s: stop'}));
 let stage='EMPTY',submits=0;const removed=[];const bytes=makeTestPng(),sha=createHash('sha256').update(bytes).digest('hex');
 const fetcher=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(url.startsWith('https://api.cloudflare.com')){
   if(path.endsWith('/subscriptions'))return Response.json(billingPaid?
    {success:true,result_info:{total_count:1},result:[{rate_plan:{public_name:'Workers Paid'},state:'Paid'}]}:
    {success:false,errors:[{code:9109}]},{status:billingPaid?200:403});
   if(path.endsWith('/graphql')){
    if(liveHttpFailure)return Response.json({errors:[{message:'no access'}]},{status:403});
    const query=JSON.parse(opts.body).query;
    if(query.includes('__schema'))return Response.json({data:{__schema:{
     types:[{name:'AiInferenceAdaptiveGroupsSum',fields:[{name:'totalNeurons'}]}]
    }}});
    return Response.json({data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:[
     {sum:{totalNeurons:liveUsage}}
    ]}]}}});
   }
   let result={};if(path.endsWith('/scripts')&&(!opts.method||opts.method==='GET'))
    result=liveWorker?[{id:'ner-ldb-runner-quality-v5'}]:[];
   if(path.endsWith('/subdomain')&&!opts.method)result={subdomain:'test'};
   if(opts.method==='DELETE')removed.push(path.split('/').at(-1));
   if(opts.method==='PUT'){const meta=JSON.parse(await opts.body.get('metadata').text());assert.equal(meta.bindings.find(x=>x.name==='HOOK_ONLY_TEST').text,'true');}
   return Response.json({success:true,result});
  }
  if(!opts.headers?.Authorization)return new Response('',{status:401});
  if(path==='/jobs'){submits++;stage='QUEUED';return Response.json({});}
  if(path==='/stop'){stage='STOPPED';return Response.json({});}
  if(path==='/resume'){stage=failRender?'NEEDS_REVIEW':'TEST_PAUSED';return Response.json({});}
  if(path==='/images/HOOK')return new Response(bytes,{headers:{'X-LDB-SHA256':sha}});
  return Response.json({job:{id:bundle.approval.storyboard_id,status:stage,completedScenes:stage==='TEST_PAUSED'?1:0,outputs:[{scene:'HOOK',sha256:sha,mimeType:'image/png',bytes:bytes.length}]}});
 };
 return {options:{env,freePlanConfirmed:true,fetcher,sleep:async()=>{},usageReport:structuredClone(USAGE_REPORT),now:NOW,read:async p=>p.endsWith('render_job.json')?JSON.stringify(bundle):'module'},removed,getSubmits:()=>submits};
}
test('one job only, authenticated STOP/resume, checksum and credential cleanup',async()=>{const h=await harness();const r=await hookCloudTest(h.options);assert.equal(r.report.completedScenes,1);assert.equal(h.getSubmits(),1);assert.deepEqual(h.removed,['RUNNER_SECRET']);assert.ok(!JSON.stringify(r.report).includes(env.CLOUDFLARE_API_TOKEN));});
test('render failure still removes credentials without resubmission',async()=>{const h=await harness(true);await assert.rejects(hookCloudTest(h.options),/RENDER_NEEDS_REVIEW/);assert.equal(h.getSubmits(),1);assert.equal(h.removed.length,1);});
test('missing configuration never calls provider',async()=>{await assert.rejects(hookCloudTest({env:{},fetcher:()=>assert.fail('network')}),/CONFIGURATION_REQUIRED/);});


test("unknown or paid plan never calls provider",async()=>{await assert.rejects(hookCloudTest({env,fetcher:()=>assert.fail("network")}),/FREE_PLAN_CONFIRMATION_REQUIRED/);});

test('V5 refuses unprepared bundle before any Cloudflare API call',async()=>{
 const h=await harness();
 await assert.rejects(hookCloudTest({...h.options,workerName:'ner-ldb-runner-quality-v5',fetcher:()=>assert.fail('unexpected network')}),/HOOK_V5_PROMPT_REQUIRED/);
 assert.equal(h.getSubmits(),0);
});
test('V5 uses a new isolated Worker and preserves original V4 evidence',async()=>{
 const h=await harness();
 const originalRead=h.options.read,originalFetch=h.options.fetcher;
 let puts=0;
 const read=async path=>{
  const data=await originalRead(path);
  if(path.endsWith('render_job.json')){
   const {prepareHookV5}=await import('../scripts/ldb-prepare-hook-v5.mjs');
   return JSON.stringify(prepareHookV5(JSON.parse(data)));
  }
  return data;
 };
 const fetcher=async(url,opts)=>{
  if(opts?.method==='PUT'){
   puts++;
   assert.ok(url.endsWith('/scripts/ner-ldb-runner-quality-v5'));
  }
  return originalFetch(url,opts);
 };
 const result=await hookCloudTest({...h.options,read,fetcher,workerName:'ner-ldb-runner-quality-v5'});
 assert.equal(puts,1);
 assert.equal(result.report.worker,'ner-ldb-runner-quality-v5');
 assert.equal(result.report.completedScenes,1);
 assert.equal(result.report.output.mimeType,'image/png');
 assert.deepEqual(h.removed,['RUNNER_SECRET','ner-ldb-runner-quality-v5']);
 assert.equal(result.report.isolatedWorkerRemoved,true);
 assert.equal(h.getSubmits(),1);
});
test('worker names outside explicit V4/V5 allowlist never reach Cloudflare',async()=>{
 const h=await harness();
 for(const workerName of ['ner-ldb-runner-quality','ner-ldb-runner-quality-v6','../../quality',''])
  await assert.rejects(hookCloudTest({...h.options,workerName,fetcher:()=>assert.fail('unexpected network')}),/UNAPPROVED_TEST_WORKER/);
});

test('V5 CLI refuses local or Production execution before any Cloudflare call',()=>{
 const args=['node','scripts/ldb-hook-cloud-test.mjs','--one-approved-hook-free-only','--hook-v5'];
 for(const env of [
  {},{VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance'},
  {VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'main'},
  {VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/other-branch'}
 ])assert.throws(()=>assertV5PreviewScope({args,env}),/V5_PREVIEW_ONLY|V5_APPROVED_BRANCH_REQUIRED/);
 assert.equal(assertV5PreviewScope({args,env:{VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance'}}),true);
 assert.equal(assertV5PreviewScope({args:args.filter(a=>a!=='--hook-v5'),env:{VERCEL_ENV:'production'}}),true);
});

test('V5 render failure cleans secret and isolated Worker without another AI request',async()=>{
 const h=await harness(true);
 const originalRead=h.options.read;
 const read=async path=>{
  const raw=await originalRead(path);
  if(path.endsWith('render_job.json')){
   const {prepareHookV5}=await import('../scripts/ldb-prepare-hook-v5.mjs');
   return JSON.stringify(prepareHookV5(JSON.parse(raw)));
  }
  return raw;
 };
 await assert.rejects(hookCloudTest({...h.options,read,workerName:'ner-ldb-runner-quality-v5'}),/RENDER_NEEDS_REVIEW/);
 assert.deepEqual(h.removed,['RUNNER_SECRET','ner-ldb-runner-quality-v5']);
 assert.equal(h.getSubmits(),1);
});
test('V5 cleanup deletion failure never returns a success report',async()=>{
 const h=await harness();
 const originalRead=h.options.read,originalFetch=h.options.fetcher,removed=[];
 const read=async path=>{
  const raw=await originalRead(path);
  if(path.endsWith('render_job.json')){
   const {prepareHookV5}=await import('../scripts/ldb-prepare-hook-v5.mjs');
   return JSON.stringify(prepareHookV5(JSON.parse(raw)));
  }
  return raw;
 };
 const fetcher=async(url,opts={})=>{
  if(url.endsWith('/scripts/ner-ldb-runner-quality-v5')&&opts.method==='DELETE'){
   removed.push('DELETE_V5_ATTEMPTED');
   return Response.json({success:false,errors:[]},{status:503});
  }
  return originalFetch(url,opts);
 };
 await assert.rejects(hookCloudTest({...h.options,read,fetcher,workerName:'ner-ldb-runner-quality-v5'}),/TEST_RUNTIME_CLEANUP_FAILED/);
 assert.deepEqual(removed,['DELETE_V5_ATTEMPTED']);
 assert.ok(h.removed.includes('RUNNER_SECRET'),'secret must be removed even when delete fails');
 assert.equal(h.getSubmits(),1,'deletion failure must not trigger another render');
});

test('hook diagnostic refuses stale or absent date before Cloudflare calls',async()=>{
 const h=await harness();
 for(const patch of [{LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-07'},{LDB_FREE_USAGE_VERIFIED_DATE:''}]){
  await assert.rejects(hookCloudTest({...h.options,env:{...env,...patch},fetcher:()=>assert.fail('NO_CLOUDFLARE_CALL')}),/FREE_PLAN_CONFIRMATION_REQUIRED/);
 }
});

test('exported V5 runtime API rejects production, wrong branch and no Free operator evidence before network',async()=>{
 const h=await harness(),bad=[
  [{...env,VERCEL_ENV:'production'},/V5_PREVIEW_ONLY/],
  [{...env,VERCEL_GIT_COMMIT_REF:'main'},/V5_APPROVED_BRANCH_REQUIRED/],
  [{...env,LDB_WORKERS_PLAN:'paid'},/V5_FREE_PLAN_ATTESTATION_REQUIRED/],
  [{...env,FREE_PLAN_CONFIRMED:'false'},/V5_FREE_PLAN_ATTESTATION_REQUIRED/],
  [{...env,LDB_FREE_PLAN_VERIFIED_DATE:'2000-01-01'},/V5_FREE_PLAN_ATTESTATION_REQUIRED/],
  [{...env,LDB_FREE_USAGE_VERIFIED_DATE:'2000-01-01'},/V5_FREE_PLAN_ATTESTATION_REQUIRED/]
 ];
 for(const [settings,error] of bad){
  await assert.rejects(hookCloudTest({...h.options,env:settings,workerName:'ner-ldb-runner-quality-v5',
   fetcher:()=>assert.fail('PROVIDER_NETWORK_FORBIDDEN')}),error);
 }
 assert.equal(h.getSubmits(),0);
});
test('V5 direct call blocks stale, missing, truncated and worker-contaminated quota reports',async()=>{
 const h=await harness();
 const cases=[
  [undefined,/READ_ONLY_USAGE_REPORT_REQUIRED/],
  [{...USAGE_REPORT,checkedAt:'2026-10-01T00:00:00.000Z'},/FRESH_USAGE_REPORT_REQUIRED/],
  [{...USAGE_REPORT,v5:[{id:'ner-ldb-runner-quality-v5'}]},/EXISTING_V5_WORKER_REQUIRES_REVIEW/],
  [{...USAGE_REPORT,usage:{...USAGE_REPORT.usage,limit:1}},/FREE_USAGE_QUERY_SCOPE_NOT_VERIFIED/]
 ];
 for(const [usageReport,error] of cases)
  await assert.rejects(hookCloudTest({...h.options,workerName:'ner-ldb-runner-quality-v5',
   usageReport,fetcher:()=>assert.fail('PROVIDER_NETWORK_FORBIDDEN')}),error);
 assert.equal(h.getSubmits(),0);
});
test('same-day environment labels alone never count as actual provider telemetry',()=>{
 assert.throws(()=>assertV5InferenceGate({env,now:NOW}),/READ_ONLY_USAGE_REPORT_REQUIRED/);
 const result=assertV5InferenceGate({env,usageReport:USAGE_REPORT,now:NOW});
 assert.equal(result.reportedNeuronsUsed,0);
 assert.equal(result.readyForOperatorTest,true);
 assert.ok(result.note.includes('not independent billing verification'));
});

test('forged zero-usage file cannot under-report higher live account usage',async()=>{
 const h=await harness(false,{liveUsage:9001});
 let writes=0;
 const real=h.options.fetcher;
 const fetcher=async(url,opts)=>{
  if(['PUT','DELETE'].includes(opts?.method)||url.endsWith('/jobs'))writes++;
  return real(url,opts);
 };
 await assert.rejects(hookCloudTest({...h.options,
  read:async p=>{
   const raw=await h.options.read(p);
   if(p.endsWith('render_job.json')){
    const {prepareHookV5}=await import('../scripts/ldb-prepare-hook-v5.mjs');
    return JSON.stringify(prepareHookV5(JSON.parse(raw)));
   }
   return raw;
  },
  fetcher,workerName:'ner-ldb-runner-quality-v5'
 }),/V5_LIVE_PROVIDER_PREFLIGHT_FAILED/);
 assert.equal(writes,0);
 assert.equal(h.getSubmits(),0);
});
test('live V5 Worker detected after saved quota snapshot prevents duplicate deploy',async()=>{
 const h=await harness(false,{liveWorker:true});
 const read=async p=>{
  const data=await h.options.read(p);
  if(p.endsWith('render_job.json')){
   const {prepareHookV5}=await import('../scripts/ldb-prepare-hook-v5.mjs');
   return JSON.stringify(prepareHookV5(JSON.parse(data)));
  }
  return data;
 };
 await assert.rejects(hookCloudTest({...h.options,read,
  workerName:'ner-ldb-runner-quality-v5'}),/V5_LIVE_PROVIDER_PREFLIGHT_FAILED/);
 assert.equal(h.getSubmits(),0);
 assert.deepEqual(h.removed,[]);
});
test('actual live Workers Paid evidence blocks V5 before any Worker deployment',async()=>{
 const h=await harness(false,{billingPaid:true});
 await assert.rejects(assertLiveV5ProviderPreflight({
  env,usageReport:structuredClone(USAGE_REPORT),fetcher:h.options.fetcher,now:NOW
 }),/V5_PAID_WORKERS_PLAN_DETECTED/);
 assert.equal(h.getSubmits(),0);
 assert.deepEqual(h.removed,[]);
});
test('live GraphQL permission error does not default to a zero neuron balance',async()=>{
 const h=await harness(false,{liveHttpFailure:true});
 await assert.rejects(assertLiveV5ProviderPreflight({
  env,usageReport:structuredClone(USAGE_REPORT),fetcher:h.options.fetcher,now:NOW
 }),/V5_LIVE_PROVIDER_PREFLIGHT_FAILED/);
 assert.equal(h.getSubmits(),0);
 assert.deepEqual(h.removed,[]);
});
test('latest live usage may exceed file snapshot but must remain inside conservative ceiling',async()=>{
 const h=await harness(false,{liveUsage:25});
 const result=await assertLiveV5ProviderPreflight({env,
  usageReport:structuredClone(USAGE_REPORT),fetcher:h.options.fetcher,now:NOW});
 assert.equal(result.reportedNeuronsUsed,25);
 assert.equal(result.requiresOwnerBillingVerification,true);
});

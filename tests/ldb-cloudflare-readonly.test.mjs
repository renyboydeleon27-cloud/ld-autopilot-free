import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudflareReadOnlyDiagnostic,previewDiagnosticScope,classifyWorkersBillingRead} from '../lib/ldb/cloudflare-read-only-diagnostic.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const NOW=Date.parse('2026-11-08T18:00:00.000Z');
const token='test-only-cloudflare-token-that-will-never-be-sent';
function transport({neuronField=true,used=3,withWorker=false,billingStatus=403,billingBody=null}={}){
 const calls=[];
 const fetcher=async(url,options)=>{
  calls.push({url,options});
  assert.equal(options.redirect,'error');
  assert.equal(options.headers.Authorization,'Bearer '+token);
  if(url.endsWith('/subscriptions')){
   assert.equal(options.method,'GET');
   return Response.json(billingBody??{success:false,errors:[{code:9109}]},{status:billingStatus});
  }
  if(url.endsWith('/workers/scripts')){
   assert.equal(options.method,'GET');
   return Response.json({success:true,result:withWorker?[{id:'ner-ldb-runner-quality-v5'}]:[]});
  }
  assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');
  assert.equal(options.method,'POST');
  const q=JSON.parse(options.body).query;
  assert.ok(q.startsWith('{ '));
  assert.ok(!/mutation|workersAi|ai\.run|inference\(/i.test(q));
  if(q.includes('__schema'))return Response.json({data:{__schema:{
   types:[{name:'AiInferenceAdaptiveGroupsSum',fields:neuronField?[{name:'totalNeurons'}]:[{name:'totalInputTokens'}]}]
  }}});
  assert.ok(q.includes('aiInferenceAdaptiveGroups('));
  assert.ok(q.includes(ACCOUNT));assert.ok(q.includes('limit: 100'));
  return Response.json({data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:[{sum:{totalNeurons:used}}]}]}}});
 };
 return {calls,fetcher};
}
test('real-provider shape produces a sanitized read-only diagnostic, never inference permission',async()=>{
 const t=transport();
 const r=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher:t.fetcher,now:NOW});
 assert.equal(r.status,'READ_ONLY_TELEMETRY_CHECKED');
 assert.equal(r.reportedNeuronsUsed,3);
 assert.equal(r.hookV5EstimatedNeurons,104.2);
 assert.equal(r.hookV5ReservedNeurons,400);
 assert.equal(r.hookV5BudgetStatus,'BUDGET_SPACE_ESTIMATED');
 assert.equal(r.inferenceAuthorized,false);
 assert.equal(r.freePlanIndependentlyVerified,false);
 assert.equal(r.existingV5Worker,false);
 assert.equal(r.isolatedRunnerProbePresent,false);
 assert.equal(r.isolatedVaultProbePresent,false);
 assert.equal(t.calls.length,4);
 assert.equal(r.billingReadStatus,'BILLING_READ_PERMISSION_REQUIRED');
 assert.equal(r.workersSubscription,'UNVERIFIED');
 assert.ok(!JSON.stringify(r).includes(token)&&!JSON.stringify(r).includes(ACCOUNT));
});
test('unknown neuron metric cannot claim live quota verification',async()=>{
 const t=transport({neuronField:false});
 const r=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher:t.fetcher,now:NOW});
 assert.equal(r.status,'READ_ONLY_NO_GO');
 assert.equal(r.blocker,'FREE_USAGE_METRIC_NOT_VERIFIED');
 assert.equal(t.calls.length,3);
});
test('existing V5 Worker is a blocker while all calls stay read-only',async()=>{
 const t=transport({withWorker:true});
 const r=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher:t.fetcher,now:NOW});
 assert.equal(r.existingV5Worker,true);
 assert.equal(r.inferenceAuthorized,false);
 assert.equal(r.status,'READ_ONLY_TELEMETRY_CHECKED');
 assert.equal(r.blocker,undefined);
});
test('wrong account/short token are rejected before network',async()=>{
 const forbidden=()=>{throw Error('NETWORK_CALL_FORBIDDEN')};
 for(const params of [
  {accountId:'wrong',token},{accountId:ACCOUNT,token:'short'},
  {accountId:ACCOUNT,token:null}
 ])await assert.rejects(cloudflareReadOnlyDiagnostic({...params,fetcher:forbidden,now:NOW}),/CONFIGURATION_REQUIRED/);
});
test('preview restriction requires exact branch and preview environment',()=>{
 assert.equal(previewDiagnosticScope({VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance'}),true);
 assert.equal(previewDiagnosticScope({VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance'}),false);
 assert.equal(previewDiagnosticScope({VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'main'}),false);
});

test('billing permission denied is explicit, sanitized and read-only',async()=>{
 const mock=transport({billingStatus:403,billingBody:{success:false,errors:[{message:'private billing error'}]}});
 const result=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher:mock.fetcher,now:NOW});
 assert.equal(result.billingReadStatus,'BILLING_READ_PERMISSION_REQUIRED');
 assert.equal(result.billingHttpStatus,403);
 assert.equal(result.freePlanIndependentlyVerified,false);
 assert.equal(result.inferenceAuthorized,false);
 assert.ok(!JSON.stringify(result).includes('private billing error'));
 assert.equal(mock.calls.filter(c=>c.url.endsWith('/subscriptions')).length,1);
});
test('a complete list including Workers Paid still never authorizes generation',async()=>{
 const billingBody={success:true,result_info:{total_count:2},result:[
  {rate_plan:{public_name:'Workers Paid'},state:'Paid'},
  {rate_plan:{public_name:'Free Plan'},state:'Paid'}
 ]};
 const m=transport({billingStatus:200,billingBody});
 const result=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher:m.fetcher,now:NOW});
 assert.equal(result.billingReadStatus,'PAID_WORKERS_SUBSCRIPTION_DETECTED');
 assert.equal(result.workersSubscription,'PAID_LISTED');
 assert.equal(result.freePlanIndependentlyVerified,false);
 assert.equal(result.inferenceAuthorized,false);
});
test('empty, generic and incomplete subscription records cannot falsely prove Workers Free',()=>{
 const examples=[
  {httpStatus:200,body:{success:true,result_info:{total_count:0},result:[]},wanted:'WORKERS_PLAN_REQUIRES_DASHBOARD_CHECK'},
  {httpStatus:200,body:{success:true,result_info:{total_count:2},result:[{rate_plan:{public_name:'Workers Paid'},state:'Paid'}]},wanted:'BILLING_SUBSCRIPTIONS_NOT_VERIFIED'},
  {httpStatus:200,body:{success:true,result_info:{total_count:1},result:[{rate_plan:{public_name:'Workers Free'},state:'Paid'}]},wanted:'WORKERS_PLAN_REQUIRES_DASHBOARD_CHECK'},
  {httpStatus:200,body:{success:true,result_info:{total_count:1},result:[{rate_plan:{public_name:'Free'},state:'Paid'}]},wanted:'WORKERS_PLAN_REQUIRES_DASHBOARD_CHECK'}
 ];
 for(const x of examples){const got=classifyWorkersBillingRead(x);assert.equal(got.status,x.wanted);assert.equal(got.freePlanVerified,false)}
 assert.equal(classifyWorkersBillingRead({httpStatus:500}).status,'BILLING_SUBSCRIPTIONS_NOT_VERIFIED');
});

test('provider daily usage close to local fence reports NO V5 buffer even if under free allocation',async()=>{
 const t=transport({used:8990});
 const r=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher:t.fetcher,now:NOW});
 assert.equal(r.status,'READ_ONLY_TELEMETRY_CHECKED');
 assert.equal(r.hookV5BudgetStatus,'INSUFFICIENT_LOCAL_BUFFER');
 assert.equal(r.inferenceAuthorized,false);
});

test('probe Worker inventory reuses the one existing Cloudflare scripts listing',async()=>{
 const t=transport();
 const original=t.fetcher;
 const fetcher=async(url,opts)=>{
  if(url.endsWith('/workers/scripts')){
   t.calls.push({url,options:opts});
   return Response.json({success:true,result:[
    {id:'ner-ldb-runner-binding-probe'},
    {id:'ner-ldb-vault-binding-probe'}
   ]});
  }
  return original(url,opts);
 };
 const result=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher,now:NOW});
 assert.equal(result.isolatedRunnerProbePresent,true);
 assert.equal(result.isolatedVaultProbePresent,true);
 assert.equal(result.inferenceAuthorized,false);
 assert.equal(result.productionAccepted,false);
 assert.equal(t.calls.length,4);
});
test('inaccessible scripts listing does not fabricate no existing probes',async()=>{
 const t=transport();
 const original=t.fetcher;
 const fetcher=(url,opts)=>url.endsWith('/workers/scripts')?
  Response.json({success:false},{status:403}):original(url,opts);
 const result=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher,now:NOW});
 assert.equal(result.isolatedRunnerProbePresent,null);
 assert.equal(result.isolatedVaultProbePresent,null);
 assert.equal(result.status,'READ_ONLY_NO_GO');
});

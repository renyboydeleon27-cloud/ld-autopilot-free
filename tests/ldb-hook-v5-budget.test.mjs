import test from 'node:test';
import assert from 'node:assert/strict';
import {assessOneHookBudget,ONE_HOOK_RESERVED_NEURONS,
 V5_LOCAL_USAGE_FENCE,DAILY_FREE_ALLOCATION} from '../lib/ldb/hook-v5-budget.mjs';
import {assertV5InferenceGate,assertLiveV5ProviderPreflight} from '../scripts/ldb-hook-cloud-test.mjs';
const now=Date.parse('2026-11-08T18:00:00.000Z'),day='2026-11-08';
const env={VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance',
 LDB_WORKERS_PLAN:'free',FREE_PLAN_CONFIRMED:'true',
 LDB_FREE_PLAN_VERIFIED_DATE:day,LDB_FREE_USAGE_VERIFIED_DATE:day,
 CLOUDFLARE_ACCOUNT_ID:'a437dda5f38ba6b10991684b8388760b',
 CLOUDFLARE_API_TOKEN:'mock-cloudflare-token-safely-long-enough'};
function report(used){
 return {checkedAt:'2026-11-08T17:59:00.000Z',inferenceCalled:false,
  workerListStatus:200,v5:[],graphqlStatus:200,errors:[],
  usage:{metric:'totalNeurons',limit:100,httpStatus:200,errors:[],
   data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:[{sum:{totalNeurons:used}}]}]}}}};
}
test('published pricing snapshot yields 4 output tiles and conservative reserve, not approval',()=>{
 const b=assessOneHookBudget({used:0});
 assert.equal(b.outputTiles,4);
 assert.equal(b.estimatedNeurons,104.2);
 assert.equal(b.reservedNeurons,400);
 assert.equal(b.internalUsageFence,9000);
 assert.equal(ONE_HOOK_RESERVED_NEURONS,400);
 assert.equal(DAILY_FREE_ALLOCATION,10000);
 assert.equal(b.inferenceAuthorized,false);
 assert.equal(b.freePlanVerified,false);
 assert.match(b.warning,/not a billing guarantee/);
});
test('single-HOOK reservation fails closed before reaching local 9000 neuron fence',()=>{
 assert.equal(assessOneHookBudget({used:8600}).withinLocalFence,true);
 assert.equal(assessOneHookBudget({used:8600.01}).withinLocalFence,false);
 assert.equal(assessOneHookBudget({used:8999}).status,'INSUFFICIENT_LOCAL_BUFFER');
 assert.throws(()=>assertV5InferenceGate({env,usageReport:report(8999),now}),
  /V5_HOOK_BUDGET_BUFFER_REQUIRED/);
 assert.equal(assertV5InferenceGate({env,usageReport:report(8600),now}).conservativeHookReserve,400);
});
test('unexpected model, dimensions and invalid neuron values cannot reuse stale estimate',()=>{
 for(const patch of [
  {used:0,model:'@cf/another-model'},
  {used:0,width:1024},
  {used:0,height:512}
 ])assert.throws(()=>assessOneHookBudget(patch),/V5_MODEL_PRICE_UNVERIFIED/);
 for(const used of [NaN,Infinity,undefined,'0',-1,10001])
  assert.throws(()=>assessOneHookBudget({used}),/V5_QUOTA_USAGE_UNVERIFIED/);
});
test('live budget near fence halts V5 before any Worker write',async()=>{
 const calls=[];
 const fetcher=async(url,opts={})=>{
  calls.push({url,method:opts.method});
  if(url.endsWith('/workers/scripts'))return Response.json({success:true,result:[]});
  if(url.endsWith('/subscriptions'))return Response.json({success:false},{status:403});
  if(url.endsWith('/graphql')){
   const query=JSON.parse(opts.body).query;
   if(query.includes('__schema'))return Response.json({data:{__schema:{types:[
    {name:'AiInferenceAdaptiveGroupsSum',fields:[{name:'totalNeurons'}]}]}}});
   return Response.json({data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:[
    {sum:{totalNeurons:8999}}]}]}}});
  }
  assert.fail('unexpected mutating/paid endpoint');
 };
 await assert.rejects(assertLiveV5ProviderPreflight({
  env,usageReport:report(0),fetcher,now
 }),/V5_HOOK_BUDGET_BUFFER_REQUIRED/);
 assert.ok(calls.every(c=>['GET','POST'].includes(c.method)));
 assert.ok(calls.every(c=>c.method==='GET'||c.url.endsWith('/graphql')));
});

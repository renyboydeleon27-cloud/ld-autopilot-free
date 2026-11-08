import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudflareReadOnlyDiagnostic,previewDiagnosticScope} from '../lib/ldb/cloudflare-read-only-diagnostic.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const NOW=Date.parse('2026-11-08T18:00:00.000Z');
const token='test-only-cloudflare-token-that-will-never-be-sent';
function transport({neuronField=true,used=3,withWorker=false}={}){
 const calls=[];
 const fetcher=async(url,options)=>{
  calls.push({url,options});
  assert.equal(options.redirect,'error');
  assert.equal(options.headers.Authorization,'Bearer '+token);
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
 assert.equal(r.inferenceAuthorized,false);
 assert.equal(r.freePlanIndependentlyVerified,false);
 assert.equal(r.existingV5Worker,false);
 assert.equal(t.calls.length,3);
 assert.ok(!JSON.stringify(r).includes(token)&&!JSON.stringify(r).includes(ACCOUNT));
});
test('unknown neuron metric cannot claim live quota verification',async()=>{
 const t=transport({neuronField:false});
 const r=await cloudflareReadOnlyDiagnostic({accountId:ACCOUNT,token,fetcher:t.fetcher,now:NOW});
 assert.equal(r.status,'READ_ONLY_NO_GO');
 assert.equal(r.blocker,'FREE_USAGE_METRIC_NOT_VERIFIED');
 assert.equal(t.calls.length,2);
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

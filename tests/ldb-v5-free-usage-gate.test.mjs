import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyOneHookUsageReport,MAX_USAGE_GROUPS} from '../lib/ldb/v5-free-usage-gate.mjs';

const NOW=Date.parse('2026-11-08T11:00:00.000Z');
const report=(counts=[7],metric='totalNeurons')=>({
 checkedAt:'2026-11-08T10:59:00.000Z',
 inferenceCalled:false,workerListStatus:200,v5:[],
 graphqlStatus:200,errors:[],
 usage:{metric,limit:MAX_USAGE_GROUPS,httpStatus:200,errors:[],
  data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:counts.map(n=>({sum:{[metric]:n}}))}]}}}
});
const check=r=>verifyOneHookUsageReport(r,{now:NOW});

test('accepts a truly zero-use account only with valid successful account-scoped telemetry',()=>{
 assert.deepEqual(check(report([])),{used:0,metric:'totalNeurons',groups:0});
 assert.deepEqual(check(report([0])),{used:0,metric:'totalNeurons',groups:1});
 const bad=report([]);bad.usage.data.viewer.accounts=[];
 assert.throws(()=>check(bad),/NOT_VERIFIED/);
});
test('sums every nontruncated group, never just the first one',()=>{
 assert.deepEqual(check(report([7,8,9])),{used:24,metric:'totalNeurons',groups:3});
 assert.deepEqual(check(report([8],'neuronTotal')),{used:8,metric:'neuronTotal',groups:1});
 assert.deepEqual(check(report(Array(99).fill(1))).used,99);
});
test('rejects truncated groups and unverifiable query bounds',()=>{
 assert.throws(()=>check(report(Array(100).fill(1))),/ROWS_TRUNCATED/);
 for(const limit of [undefined,1,1000]){
  const r=report([1]);r.usage.limit=limit;
  assert.throws(()=>check(r),/QUERY_SCOPE_NOT_VERIFIED/);
 }
});
test('rejects stale, future, malformed and absent telemetry timestamps',()=>{
 for(const stamp of [undefined,null,'','2026-11-08','2026-11-08T10:50:00.000Z',
  '2026-11-08T11:02:00.000Z','2026-11-08T10:59:00+00:00']){
  const r=report();r.checkedAt=stamp;
  assert.throws(()=>check(r),/FRESH_USAGE_REPORT_REQUIRED/);
 }
 const fresh=report();fresh.checkedAt='2026-11-08T11:00:15.000Z';
 assert.doesNotThrow(()=>check(fresh));
});
test('rejects ambiguous, partial or wrong metric fields',()=>{
 for(const name of ['calls','inputNeurons','outputNeurons','totalInputNeurons','']){
  assert.throws(()=>check(report([7],name)),/METRIC/);
 }
 const r=report();r.usage.data.viewer.accounts[0].aiInferenceAdaptiveGroups=[{sum:{other:7}}];
 assert.throws(()=>check(r),/NOT_VERIFIED/);
});
test('rejects invalid sums, over-quota total, and missing server evidence',()=>{
 for(const n of [null,-1,Infinity,NaN,'12'])assert.throws(()=>check(report([n])),/NOT_VERIFIED/);
 assert.throws(()=>check(report([8999,2])),/NOT_VERIFIED/);
 const changes=[
  r=>{r.inferenceCalled=true},
  r=>{r.workerListStatus=403},
  r=>{r.graphqlStatus=403},
  r=>{r.errors=['no permission']},
  r=>{r.usage.httpStatus=403},
  r=>{r.usage.errors=['no telemetry']},
  r=>{r.usage.data.viewer.accounts=[]},
  r=>{r.usage.data.viewer.accounts.push(r.usage.data.viewer.accounts[0])},
  r=>{delete r.usage.data.viewer.accounts[0].aiInferenceAdaptiveGroups},
  r=>{r.v5=[{id:'production-runner'}]},
  r=>{r.v5=[{id:'ner-ldb-runner-quality-v5'},{id:'ner-ldb-runner-quality-v5'}]}
 ];
 for(const change of changes){const r=report();change(r);assert.throws(()=>check(r));}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyOneHookUsageReport} from '../lib/ldb/v5-free-usage-gate.mjs';

const NOW=Date.parse('2026-11-08T11:00:00.000Z');
const report=(used=7,metric='totalNeurons')=>({
 checkedAt:'2026-11-08T10:59:00.000Z',
 inferenceCalled:false,workerListStatus:200,v5:[],
 graphqlStatus:200,errors:[],
 usage:{metric,httpStatus:200,errors:[],
  data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:[{sum:{[metric]:used}}]}]}}}
});
const check=r=>verifyOneHookUsageReport(r,{now:NOW});

test('accepts fresh, independently reported numeric neuron usage',()=>{
 assert.deepEqual(check(report()),{used:7,metric:'totalNeurons'});
 assert.deepEqual(check(report(8,'neuronTotal')),{used:8,metric:'neuronTotal'});
});

test('rejects stale, future, malformed and absent telemetry timestamps',()=>{
 for(const stamp of [undefined,null,'', '2026-11-08',
  '2026-11-08T10:50:00.000Z','2026-11-08T11:02:00.000Z',
  '2026-11-08T10:59:00+00:00']) {
  const r=report();r.checkedAt=stamp;
  assert.throws(()=>check(r),/FRESH_USAGE_REPORT_REQUIRED/);
 }
 const fresh=report();fresh.checkedAt='2026-11-08T11:00:15.000Z';
 assert.doesNotThrow(()=>check(fresh));
});

test('rejects absent or arbitrary metrics',()=>{
 assert.throws(()=>check(report(7,'calls')),/METRIC/);
 const r=report();r.usage.data.viewer.accounts[0].aiInferenceAdaptiveGroups[0].sum={other:7};
 assert.throws(()=>check(r),/NOT_VERIFIED/);
});

test('rejects invalid quota and missing server evidence',()=>{
 for(const unsafe of [null,-1,9001,Infinity,'12'])assert.throws(()=>check(report(unsafe)),/NOT_VERIFIED/);
 const cases=[
  r=>{r.inferenceCalled=true},
  r=>{r.workerListStatus=403},
  r=>{r.graphqlStatus=403},
  r=>{r.errors=['no permission']},
  r=>{r.usage.errors=['no telemetry']},
  r=>{r.usage.data.viewer.accounts=[]},
  r=>{r.usage.data.viewer.accounts.push(r.usage.data.viewer.accounts[0])},
  r=>{r.usage.data.viewer.accounts[0].aiInferenceAdaptiveGroups=[]},
  r=>{r.v5=[{id:'production-runner'}]},
  r=>{r.v5=[{id:'ner-ldb-runner-quality-v5'},{id:'ner-ldb-runner-quality-v5'}]}
 ];
 for(const change of cases){const r=report();change(r);assert.throws(()=>check(r));}
});

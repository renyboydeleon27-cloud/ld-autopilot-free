import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyOneHookUsageReport} from '../lib/ldb/v5-free-usage-gate.mjs';

const report = (used = 7, metric = 'totalNeurons') => ({
  inferenceCalled:false,
  workerListStatus:200,
  v5:[],
  usage:{metric,httpStatus:200,errors:[],data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:[{sum:{[metric]:used}}]}]}}}
});

test('accepts safely measured neuron usage with dynamic field name', () => {
  assert.deepEqual(verifyOneHookUsageReport(report()),{used:7,metric:'totalNeurons'});
  assert.deepEqual(verifyOneHookUsageReport(report(8,'neuronTotal')),{used:8,metric:'neuronTotal'});
});
test('rejects absent or mismatched usage metrics', () => {
  assert.throws(()=>verifyOneHookUsageReport(report(7,'calls')),/METRIC/);
  const absent = report(); absent.usage.data.viewer.accounts[0].aiInferenceAdaptiveGroups[0].sum = {other:7};
  assert.throws(()=>verifyOneHookUsageReport(absent),/NOT_VERIFIED/);
});
test('rejects insufficient or unsafe quota evidence', () => {
  for(const unsafe of [null,-1,9001,Infinity,'12']) assert.throws(()=>verifyOneHookUsageReport(report(unsafe)),/NOT_VERIFIED/);
  const infer = report(); infer.inferenceCalled = true;
  assert.throws(()=>verifyOneHookUsageReport(infer),/READ_ONLY/);
  const worker = report(); worker.workerListStatus = 403;
  assert.throws(()=>verifyOneHookUsageReport(worker),/WORKER_LIST/);
  const err = report(); err.usage.errors = ['token cannot access telemetry'];
  assert.throws(()=>verifyOneHookUsageReport(err),/NOT_VERIFIED/);
  const accounts = report(); accounts.usage.data.viewer.accounts.push(accounts.usage.data.viewer.accounts[0]);
  assert.throws(()=>verifyOneHookUsageReport(accounts),/NOT_VERIFIED/);
  const empty = report(); empty.usage.data.viewer.accounts[0].aiInferenceAdaptiveGroups = [];
  assert.throws(()=>verifyOneHookUsageReport(empty),/NOT_VERIFIED/);
});

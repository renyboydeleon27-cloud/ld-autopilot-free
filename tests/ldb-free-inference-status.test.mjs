import test from 'node:test';
import assert from 'node:assert/strict';
import {freeInferenceStatus,freeInferenceAllowed} from '../lib/ldb/free-inference-gate.mjs';

const DAY=Date.parse('2026-11-08T17:00:00.000Z');
const current={
 RUNNER_ENABLED:'true',FREE_PLAN_CONFIRMED:'true',
 LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-08',LDB_FREE_USAGE_VERIFIED_DATE:'2026-11-08',
 RUNNER_SECRET:'never-expose-this-private-owner-secret',
 CLOUDFLARE_API_TOKEN:'never-expose-this-token'
};
test('owner-safe inference gate snapshot distinguishes disabled and stale reasons',()=>{
 for(const [change,reason] of [
  [{RUNNER_ENABLED:'false'},'RUNNER_DISABLED'],
  [{FREE_PLAN_CONFIRMED:'false'},'FREE_PLAN_NOT_CONFIRMED'],
  [{LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-07'},'FREE_PLAN_DATE_STALE'],
  [{LDB_FREE_USAGE_VERIFIED_DATE:'2026-11-07'},'FREE_USAGE_DATE_STALE']]){
  const state=freeInferenceStatus({...current,...change},DAY);
  assert.equal(state.enabled,false);assert.equal(state.reason,reason);
  // The dated Free check is independent from the Runner master switch.
  // The owner snapshot combines both gates and must remain disabled.
  if(change.RUNNER_ENABLED===undefined)
   assert.equal(freeInferenceAllowed({...current,...change},DAY),false);
 }
});
test('eligible-to-attempt state is explicitly not evidence of live account verification',()=>{
 const state=freeInferenceStatus(current,DAY);
 assert.equal(state.enabled,true);
 assert.equal(state.accountTelemetryVerified,false);
 assert.match(state.note,/attestations/);
 assert.equal(state.utcDay,'2026-11-08');
 for(const word of ['never-expose-this','CLOUDFLARE_API_TOKEN','RUNNER_SECRET'])
  assert.ok(!JSON.stringify(state).includes(word));
});
test('UTC rollover and invalid clocks fail closed',()=>{
 assert.equal(freeInferenceStatus(current,Date.parse('2026-11-09T00:00:00.000Z')).enabled,false);
 assert.equal(freeInferenceStatus(current,NaN).reason,'CLOCK_NOT_VERIFIED');
 assert.equal(freeInferenceStatus(current,Infinity).enabled,false);
});

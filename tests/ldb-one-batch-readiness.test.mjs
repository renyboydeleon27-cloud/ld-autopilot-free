import test from 'node:test';
import assert from 'node:assert/strict';
import {oneBatchReadiness} from '../lib/ldb/one-batch-readiness.mjs';
const now=Date.parse('2026-11-08T17:00:00.000Z');
const env={VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance',LDB_WORKERS_PLAN:'free',LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-08',CLOUDFLARE_API_TOKEN:'private-token'};
const report={checkedAt:'2026-11-08T16:59:00.000Z',inferenceCalled:false,workerListStatus:200,v5:[],graphqlStatus:200,errors:[],usage:{metric:'totalNeurons',limit:100,httpStatus:200,errors:[],data:{viewer:{accounts:[{aiInferenceAdaptiveGroups:[{sum:{totalNeurons:9}}]}]}}}};
const assess=(e=env,r=report,n=now)=>oneBatchReadiness({env:e,report:r,now:n});
test('passing a read-only diagnostic never authorizes inference or production',()=>{
 const value=assess();
 assert.equal(value.status,'READ_ONLY_PREFLIGHT_PASSED');
 assert.equal(value.reportedNeuronsUsed,9);
 assert.equal(value.inferenceAuthorized,false);
 assert.equal(value.billingEligibilityIndependentlyVerified,false);
 assert.equal(value.gmailInboxVerified,false);
 assert.ok(!JSON.stringify(value).includes('private-token'));
});
test('missing report or stale plan, wrong branch, or stale day are explicit blockers',()=>{
 assert.ok(assess(env,null).blockers.includes('READ_ONLY_USAGE_REPORT_REQUIRED'));
 assert.ok(assess({...env,LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-07'}).blockers.includes('CURRENT_FREE_PLAN_VERIFICATION_REQUIRED'));
 assert.ok(assess({...env,VERCEL_ENV:'production'}).blockers.includes('ISOLATED_PREVIEW_REQUIRED'));
 assert.equal(assess(env,report,Date.parse('2026-11-09T00:00:00.000Z')).status,'NO_GO');
});
test('previous disposable diagnostic Worker requires manual review rather than deletion',()=>{
 const r={...report,v5:[{id:'ner-ldb-runner-quality-v5'}]};
 assert.ok(assess(env,r).blockers.includes('EXISTING_V5_WORKER_REQUIRES_SEPARATE_REVIEW'));
});

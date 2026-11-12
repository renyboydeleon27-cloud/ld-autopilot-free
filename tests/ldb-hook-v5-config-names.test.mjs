import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkExecutorConfiguration} from '../scripts/ldb-hook-v5-executor-request.mjs';

const TIME=Date.parse('2026-11-12T09:00:00Z');
const NAMES=[
 'LDB_HOOK_V5_CLOUDFLARE_ACCOUNT_ID',
 'LDB_WORKERS_PLAN',
 'LDB_FREE_PLAN_VERIFIED_DATE',
 'LDB_HOOK_V5_ENV_REVIEW_APPROVED',
 'LDB_HOOK_V5_CLOUDFLARE_API_TOKEN'
];
const VALID={
 LDB_HOOK_V5_CLOUDFLARE_ACCOUNT_ID:'a437dda5f38ba6b10991684b8388760b',
 LDB_WORKERS_PLAN:'free',
 LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-12',
 LDB_HOOK_V5_ENV_REVIEW_APPROVED:'true',
 LDB_TOKEN_PRESENT:'true'
};
test('offline configuration missing list uses exact GitHub Environment names only',()=>{
 const empty=checkExecutorConfiguration({},TIME);
 assert.equal(empty.status,'CONFIGURATION_INCOMPLETE');
 assert.deepEqual(empty.missing,NAMES);
 assert.equal(empty.credentialScopeVerified,false);
 assert.equal(empty.cloudflareChecked,false);
 assert.equal(empty.inferenceCalled,false);
 assert.equal(empty.readyToGenerate,false);
 for(const [key,value] of Object.entries(VALID)){
  const invalid={...VALID,[key]:'SIMULATED_INVALID_SECRET_VALUE'};
  const result=checkExecutorConfiguration(invalid,TIME);
  assert.equal(result.status,'CONFIGURATION_INCOMPLETE');
  assert.deepEqual(result.missing,[key==='LDB_TOKEN_PRESENT'?NAMES[4]:key]);
  assert.ok(!JSON.stringify(result).includes('SIMULATED_INVALID_SECRET_VALUE'));
 }
 const present=checkExecutorConfiguration(VALID,TIME);
 assert.deepEqual(present.missing,[]);
 assert.equal(present.status,'CONFIGURATION_PRESENT');
 assert.equal(present.credentialScopeVerified,false);
 assert.equal(present.readyToGenerate,false);
});
test('date and plan attestation fail closed and do not expose values',()=>{
 for(const [key,bad] of [['LDB_FREE_PLAN_VERIFIED_DATE','2026-11-11'],['LDB_WORKERS_PLAN','paid'],['LDB_HOOK_V5_ENV_REVIEW_APPROVED','false']]){
  const r=checkExecutorConfiguration({...VALID,[key]:bad},TIME);
  assert.equal(r.status,'CONFIGURATION_INCOMPLETE');
  assert.deepEqual(r.missing,[key]);
 }
 assert.deepEqual(checkExecutorConfiguration(VALID,NaN).missing,['LDB_FREE_PLAN_VERIFIED_DATE']);
});
test('protected configuration-only job is read-only and directly connected to registered dispatch',()=>{
 const workflow=readFileSync('.github/workflows/ldb-hook-v5-one-shot.yml','utf8');
 const caller=readFileSync('.github/workflows/ldb-free-production.yml','utf8');
 const start=workflow.indexOf('  configuration-only:');
 const end=workflow.indexOf('  one-hook-v5:',start);
 assert.ok(start>0&&end>start);
 const config=workflow.slice(start,end);
 assert.match(config,/environment: ldb-hook-v5-free/);
 assert.match(config,/inputs.mode == 'configuration_only'/);
 assert.match(config,/refs\/heads\/feature\/ldb-image-acceptance/);
 for(const name of NAMES)assert.match(config,new RegExp(name));
 assert.doesNotMatch(config,/cloudflare\.com|workers\.dev|ldb-retry-reviewed-hook-v5|wrangler|upload-artifact/);
 assert.match(caller,/uses: \.\/.github\/workflows\/ldb-hook-v5-one-shot.yml/);
 assert.match(caller,/github.ref == 'refs\/heads\/feature\/ldb-image-acceptance'/);
 assert.match(caller,/hook-v5-executor-/);
 assert.doesNotMatch(caller,/^\s+secrets:\s*inherit\s*$/m);
});

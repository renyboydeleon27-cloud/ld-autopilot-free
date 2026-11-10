import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectOneShotEnvironment,oneShotGate} from '../scripts/ldb-hook-v5-one-shot-gate.mjs';

const DATE='2026-11-10',NOW=Date.parse(DATE+'T20:00:00Z');
const env=()=>({
 GITHUB_REPOSITORY:'renyboydeleon27-cloud/ld-autopilot-free',
 GITHUB_REF:'refs/heads/feature/ldb-image-acceptance',
 GITHUB_ACTOR:'renyboydeleon27-cloud',
 GITHUB_EVENT_NAME:'workflow_dispatch',
 VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance',
 GITHUB_RUN_ATTEMPT:'1',GITHUB_RUN_ID:'107',
 LDB_HOOK_REQUEST_UTC_DATE:DATE,LDB_FREE_PLAN_VERIFIED_DATE:DATE,
 LDB_HOOK_V5_ENV_REVIEW_APPROVED:'true',
 LDB_WORKERS_PLAN:'free',FREE_PLAN_CONFIRMED:'true',
 CLOUDFLARE_ACCOUNT_ID:'a437dda5f38ba6b10991684b8388760b',
 GITHUB_TOKEN:'g'.repeat(40)
});
const rows=(other=[])=>({total_count:other.length+1,workflow_runs:[
 {id:107,head_branch:'feature/ldb-image-acceptance',created_at:DATE+'T19:00:00Z'},
 ...other
]});
const okResult=data=>({status:200,json:async()=>data});

test('valid owner, same-day Free attestation and first run allow ONLY entering V5 preflight',async()=>{
 let calls=0,actualUrl='';
 const result=await oneShotGate({env:env(),now:NOW,fetcher:async(url,init)=>{
  calls++;actualUrl=url;
  assert.equal(init.method,'GET');
  assert.equal(init.redirect,'error');
  return okResult(rows());
 }});
 assert.equal(calls,1);
 assert.match(actualUrl,/event=workflow_dispatch&created=2026-11-10&per_page=100/);
 assert.deepEqual(result,{status:'ONE_SHOT_GATE_PASSED',day:DATE,runId:107,
  inferenceCalled:false,productionReleased:false});
});
test('untrusted owner, branch, rerun, stale date, plan or missing credential always fails before network',async()=>{
 const bad=[
  {GITHUB_ACTOR:'other'}, {GITHUB_REF:'refs/heads/main'},
  {GITHUB_REPOSITORY:'other/repo'}, {GITHUB_EVENT_NAME:'push'},
  {VERCEL_ENV:'production'}, {VERCEL_GIT_COMMIT_REF:'main'},
  {GITHUB_RUN_ATTEMPT:'2'}, {GITHUB_RUN_ID:'0'},
  {LDB_HOOK_REQUEST_UTC_DATE:'2026-11-09'},
  {LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-09'},
  {LDB_HOOK_V5_ENV_REVIEW_APPROVED:'false'},
  {LDB_WORKERS_PLAN:'paid'}, {FREE_PLAN_CONFIRMED:'false'},
  {CLOUDFLARE_ACCOUNT_ID:'wrong'},
  {GITHUB_TOKEN:''}
 ];
 for(const patch of bad){
  const e={...env(),...patch};
  assert.throws(()=>inspectOneShotEnvironment(e,NOW),/HOOK_V5_GATE_/,
   'bad variation '+JSON.stringify(patch));
  await assert.rejects(oneShotGate({env:e,now:NOW,
   fetcher:async()=>assert.fail('no network before owner gate')}),/HOOK_V5_GATE_/);
 }
});
test('untrusted or incomplete GitHub workflow inventory fails closed',async()=>{
 const cases=[
  {status:403,json:async()=>rows()},
  okResult({total_count:0,workflow_runs:[]}),
  okResult({total_count:101,workflow_runs:rows().workflow_runs}),
  okResult({total_count:2,workflow_runs:rows().workflow_runs}),
  okResult({total_count:1,workflow_runs:[{id:106,head_branch:'feature/ldb-image-acceptance',created_at:DATE+'T19:00:00Z'}]}),
  okResult({total_count:1,workflow_runs:[{id:107,head_branch:'main',created_at:DATE+'T19:00:00Z'}]}),
  okResult({total_count:1,workflow_runs:[{id:107,head_branch:'feature/ldb-image-acceptance',created_at:'2026-11-09T19:00:00Z'}]})
 ];
 for(const result of cases)
  await assert.rejects(oneShotGate({env:env(),now:NOW,
   fetcher:async()=>result}),/HOOK_V5_GATE_/);
});
test('prior same-day V5 run blocks duplicate generation even if previous run failed',async()=>{
 for(const conclusion of ['success','failure',null]){
  const previous={id:106,head_branch:'feature/ldb-image-acceptance',
   created_at:DATE+'T18:00:00Z',conclusion};
  await assert.rejects(oneShotGate({env:env(),now:NOW,
   fetcher:async()=>okResult(rows([previous]))}),/HOOK_V5_GATE_EARLIER_ONE_SHOT_ALREADY_REQUESTED/);
 }
});
test('unrelated or older workflow run is not mistaken for same-day V5 duplicate',async()=>{
 const unrelated={id:106,head_branch:'feature/another-branch',created_at:DATE+'T18:00:00Z'};
 const result=await oneShotGate({env:env(),now:NOW,
  fetcher:async()=>okResult(rows([unrelated]))});
 assert.equal(result.status,'ONE_SHOT_GATE_PASSED');
});
test('workflow is manual, owner branch locked, free only, and requires public artifact consent',()=>{
 const workflow=readFileSync('.github/workflows/ldb-hook-v5-one-shot.yml','utf8');
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/\n\s+push:|\n\s+schedule:|\n\s+pull_request:/);
 assert.match(workflow,/github\.actor == 'renyboydeleon27-cloud'/);
 assert.match(workflow,/refs\/heads\/feature\/ldb-image-acceptance/);
 assert.match(workflow,/environment: ldb-hook-v5-free/);
 assert.match(workflow,/cancel-in-progress: false/);
 assert.match(workflow,/inputs\.public_review_artifact == true/);
 assert.match(workflow,/LDB_FREE_PLAN_VERIFIED_DATE/);
 assert.match(workflow,/LDB_HOOK_V5_ENV_REVIEW_APPROVED/);
 assert.match(workflow,/scripts\/ldb-hook-v5-one-shot-gate\.mjs/);
 assert.match(workflow,/scripts\/ldb-retry-reviewed-hook-v5\.mjs --one-reviewed-hook-free-only/);
 assert.doesNotMatch(workflow,/\n\s+VERCEL_ENV: production|\/api\/ai\/run|GMAIL_MILESTONES_ENABLED: true/);
 // Secrets may NOT be declared at job scope or passed to pip/install steps.
 assert.doesNotMatch(workflow,/^      CLOUDFLARE_API_TOKEN:/m);
 assert.doesNotMatch(workflow,/^      GITHUB_TOKEN:/m);
 assert.match(workflow,/^          GITHUB_TOKEN: \$\{\{ github.token \}\}/m);
 assert.match(workflow,/^          CLOUDFLARE_API_TOKEN: \$\{\{ secrets.LDB_HOOK_V5_CLOUDFLARE_API_TOKEN \}\}/m);
 // Pinned actions constrain what third-party code receives during setup.
 assert.match(workflow,/actions\/checkout@[a-f0-9]{40}/);
 assert.match(workflow,/actions\/setup-node@[a-f0-9]{40}/);
 assert.match(workflow,/actions\/setup-python@[a-f0-9]{40}/);
 assert.match(workflow,/actions\/upload-artifact@[a-f0-9]{40}/);

});

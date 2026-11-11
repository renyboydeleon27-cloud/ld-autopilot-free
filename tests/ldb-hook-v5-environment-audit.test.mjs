import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditHookV5Environment} from '../scripts/ldb-hook-v5-environment-audit.mjs';

const env=()=>({
 GITHUB_REPOSITORY:'renyboydeleon27-cloud/ld-autopilot-free',
 GITHUB_REF:'refs/heads/feature/ldb-hook-v5-cloud-executor',
 GITHUB_ACTOR:'renyboydeleon27-cloud',
 GITHUB_EVENT_NAME:'workflow_dispatch',
 LDB_AUDIT_REQUEST:'hook-v5-environment-audit',
 GITHUB_TOKEN:'g'.repeat(40)
});
const configured=()=>({
 name:'ldb-hook-v5-free',
 deployment_branch_policy:{protected_branches:false,custom_branch_policies:true},
 protection_rules:[{type:'required_reviewers',prevent_self_review:false,
  reviewers:[{type:'User',reviewer:{login:'renyboydeleon27-cloud'}}]}]
});
const branch=()=>({total_count:1,branch_policies:[{name:'feature/ldb-image-acceptance',type:'branch'}]});
const ok=data=>({status:200,json:async()=>data});

test('verified environment requires reviewer gate and exact branch; no Cloudflare or rendering',async()=>{
 const requested=[];
 const r=await auditHookV5Environment({env:env(),fetcher:async(url,opts)=>{
  requested.push({url,opts});
  assert.equal(opts.method,'GET');
  assert.equal(opts.redirect,'error');
  return ok(requested.length===1?configured():branch());
 }});
 assert.equal(r.status,'GITHUB_ENV_REVIEW_CONFIGURED');
 assert.equal(r.ownerCanTriggerRender,false);
 assert.equal(r.inferenceCalled,false);
 assert.equal(r.cloudflareChecked,false);
 assert.equal(requested.length,2);
 assert.ok(requested.every(x=>x.url.startsWith(
  'https://api.github.com/repos/renyboydeleon27-cloud/ld-autopilot-free/environments/ldb-hook-v5-free')));
});

test('unexpected actors, branches, non-manual events and missing access token fail before requests',async()=>{
 const bad=[
  {GITHUB_REPOSITORY:'other/repo'}, {GITHUB_REF:'refs/heads/main'},
  {GITHUB_ACTOR:'untrusted'}, {GITHUB_EVENT_NAME:'push'},
  {LDB_AUDIT_REQUEST:'hook-v5-offline-readiness'},
  {GITHUB_TOKEN:''}
 ];
 for(const variation of bad){
  await assert.rejects(auditHookV5Environment({
   env:{...env(),...variation},
   fetcher:async()=>assert.fail('No network on invalid identity')
  }),/HOOK_V5_ENV_OWNER_BRANCH_OR_MODE_REQUIRED|HOOK_V5_ENV_READ_ONLY_TOKEN_UNAVAILABLE/);
 }
});

test('inaccessible metadata cannot be misconstrued as a safe environment',async()=>{
 for(const status of [401,403,404,500]){
  await assert.rejects(auditHookV5Environment({
   env:env(),fetcher:async()=>({status,json:async()=>({error:'secret'})})
  }),/HOOK_V5_ENV_METADATA_UNVERIFIED/);
 }
});

test('missing reviewers, wildcard branches and wrong environment are rejected',async()=>{
 const variations=[
  {first:{...configured(),name:'production'}},
  {first:{...configured(),protection_rules:[]}},
  {first:{...configured(),protection_rules:[{type:'required_reviewers',reviewers:[]}]}},
  {first:{...configured(),deployment_branch_policy:{protected_branches:true,custom_branch_policies:false}}},
  {second:{total_count:2,branch_policies:[{name:'feature/ldb-image-acceptance'},{name:'main'}]}},
  {second:{total_count:1,branch_policies:[{name:'feature/*'}]}},
  {second:{total_count:1,branch_policies:[{name:'main'}]}}
 ];
 for(const v of variations){
  let i=0;
  await assert.rejects(auditHookV5Environment({
   env:env(),fetcher:async()=>ok(++i===1?(v.first||configured()):(v.second||branch()))
  }),/HOOK_V5_ENV_/);
 }
});

test('sole owner reviewer and prevent-self-review creates deadlock, not clearance',async()=>{
 const details=configured();
 details.protection_rules[0].prevent_self_review=true;
 await assert.rejects(auditHookV5Environment({
  env:env(),fetcher:async()=>ok(details)
 }),/HOOK_V5_ENV_SELF_REVIEW_DEADLOCK/);
});

test('registered manual audit cannot access Cloudflare secrets or trigger prompt packager',()=>{
 const workflow=readFileSync('.github/workflows/ldb-free-production.yml','utf8');
 const start=workflow.indexOf('  hook-v5-environment-audit:');
 const end=workflow.indexOf('  verified-storyboard-package:',start);
 assert.ok(start>0&&end>start);
 const job=workflow.slice(start,end);
 assert.match(job,/inputs\.episode_folder == 'hook-v5-environment-audit'/);
 assert.match(job,/github\.actor == 'renyboydeleon27-cloud'/);
 assert.match(job,/github\.ref == 'refs\/heads\/feature\/ldb-hook-v5-cloud-executor'/);
 assert.match(job,/node scripts\/ldb-hook-v5-environment-audit\.mjs/);
 assert.match(job,/GITHUB_TOKEN: \$\{\{ github.token \}\}/);
 assert.match(job,/permissions:\s+contents: read\s+actions: read/);
 assert.doesNotMatch(job,/^\s+environment:|secrets\.|CLOUDFLARE_API_TOKEN|wrangler|ldb-retry-reviewed-hook-v5|upload-artifact/m);
 const pack=workflow.slice(end);
 assert.match(pack,/inputs\.episode_folder != 'hook-v5-environment-audit'/);
 const script=readFileSync('scripts/ldb-hook-v5-environment-audit.mjs','utf8');
 assert.doesNotMatch(script,/CLOUDFLARE_API_TOKEN|https:\/\/api\.cloudflare\.com|POST\b|PUT\b|DELETE\b/);
});

test('top-level self-review flag cannot override the actual reviewer rule',async()=>{
 const details={...configured(),prevent_self_review:false};
 details.protection_rules[0].prevent_self_review=true;
 await assert.rejects(auditHookV5Environment({env:env(),fetcher:async()=>ok(details)}),
  /HOOK_V5_ENV_SELF_REVIEW_DEADLOCK/);
 delete details.protection_rules[0].prevent_self_review;
 await assert.rejects(auditHookV5Environment({env:env(),fetcher:async()=>ok(details)}),
  /HOOK_V5_ENV_SELF_REVIEW_POLICY_UNVERIFIED/);
});

test('same-name tag or untyped policy cannot authorize the acceptance branch',async()=>{
 for(const type of ['tag',undefined]){
  let i=0;
  const policy=branch();policy.branch_policies[0].type=type;
  await assert.rejects(auditHookV5Environment({env:env(),
   fetcher:async()=>ok(++i===1?configured():policy)}),/HOOK_V5_ENV_EXACT_BRANCH_POLICY_REQUIRED/);
 }
});

test('independent reviewer permits self-review protection without a deadlock',async()=>{
 const details=configured();
 details.protection_rules[0].prevent_self_review=true;
 details.protection_rules[0].reviewers.push({type:'User',reviewer:{login:'independent-reviewer'}});
 let i=0;
 const result=await auditHookV5Environment({env:env(),fetcher:async()=>ok(++i===1?details:branch())});
 assert.equal(result.reviewerCount,2);
 assert.equal(result.inferenceCalled,false);
});

test('registered acceptance entry can audit before attaching the protected Environment',async()=>{
 let calls=0;
 const result=await auditHookV5Environment({env:{...env(),GITHUB_REF:'refs/heads/feature/ldb-image-acceptance'},fetcher:async()=>ok(++calls===1?configured():branch())});
 assert.equal(calls,2);assert.equal(result.inferenceCalled,false);
});

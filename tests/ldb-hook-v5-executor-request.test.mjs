import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseExecutorRequest,checkExecutorConfiguration} from '../scripts/ldb-hook-v5-executor-request.mjs';
const now=Date.parse('2026-11-12T10:00:00Z');
test('configuration-only request cannot authorize rendering or public evidence',()=>{
 assert.deepEqual(parseExecutorRequest('hook-v5-executor-check',now),{mode:'configuration_only',utc_day:'',public_review_artifact:'false'});
});
test('render requires exact explicit public review request and current UTC day',()=>{
 assert.equal(parseExecutorRequest('hook-v5-executor-render-public-review-2026-11-12',now).mode,'render_one_hook');
 for(const value of ['',null,'hook-v5-executor-render','hook-v5-executor-render-public-review-2026-11-11','hook-v5-executor-render-public-review-2026-11-13','hook-v5-executor-render-public-review-2026-11-12\nmode=render_one_hook'])assert.throws(()=>parseExecutorRequest(value,now));
});
test('configuration reports missing names only and never proves provider or render readiness',()=>{
 const empty=checkExecutorConfiguration({},now);assert.equal(empty.missing.length,5);
 const valid={LDB_HOOK_V5_CLOUDFLARE_ACCOUNT_ID:'a437dda5f38ba6b10991684b8388760b',LDB_WORKERS_PLAN:'free',LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-12',LDB_HOOK_V5_ENV_REVIEW_APPROVED:'true',LDB_TOKEN_PRESENT:'true'};
 const result=checkExecutorConfiguration(valid,now);assert.equal(result.status,'CONFIGURATION_PRESENT');assert.equal(result.readyToGenerate,false);assert.equal(result.credentialScopeVerified,false);
 for(const key of Object.keys(valid))assert.ok(checkExecutorConfiguration({...valid,[key]:'DO_NOT_PRINT_THIS'},now).missing.length);
 assert.ok(!JSON.stringify(checkExecutorConfiguration({...valid,LDB_WORKERS_PLAN:'DO_NOT_PRINT_THIS'},now)).includes('DO_NOT_PRINT_THIS'));
});
test('registered entry uses same-commit reusable workflow after metadata audit; no secret inheritance',()=>{
 const caller=readFileSync('.github/workflows/ldb-free-production.yml','utf8');
 const callee=readFileSync('.github/workflows/ldb-hook-v5-one-shot.yml','utf8');
 assert.match(caller,/uses: \.\/.github\/workflows\/ldb-hook-v5-one-shot.yml/);
 assert.match(caller,/needs: hook-v5-executor-request/);
 assert.match(caller,/!startsWith\(inputs.episode_folder, 'hook-v5-executor-'\)/);
 assert.match(callee,/workflow_call:/);
 const config=callee.slice(callee.indexOf('  configuration-only:'),callee.indexOf('  one-hook-v5:'));
 assert.match(config,/environment: ldb-hook-v5-free/);
 assert.match(config,/secrets.LDB_HOOK_V5_CLOUDFLARE_API_TOKEN != ''/);
 assert.doesNotMatch(config,/CLOUDFLARE_API_TOKEN:|ldb-retry-reviewed|curl |fetch\(/);
 assert.doesNotMatch(caller,/^\s+secrets: inherit/m);
});

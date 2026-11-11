import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOfflineHookV5} from '../scripts/ldb-hook-v5-offline-readiness.mjs';

test('real Lake Nyos approved packager and V5 composition pass without any provider calls',async()=>{
 const result=await verifyOfflineHookV5();
 assert.equal(result.status,'HOOK_V5_OFFLINE_PACKAGE_READY');
 assert.equal(result.scenesChecked,17);
 assert.equal(result.onlyHookImageChanged,true);
 assert.equal(result.approvedStoryboard,'75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05');
 assert.ok(result.promptLength>0&&result.promptLength<=2048);
 for(const key of ['inferenceCalled','cloudflareCalled','googleDriveCalled','gmailCalled','visualApproved','productionAccepted'])
  assert.equal(result[key],false,'offline test must not claim '+key);
});
test('packager failure fails closed without cloud fallback',async()=>{
 await assert.rejects(
  verifyOfflineHookV5({runner:()=>({status:1,stderr:'do-not-leak'})}),
  /OFFLINE_PACKAGER_FAILED/
 );
});
test('registered workflow isolates package preflight by owner branch and explicit sentinel',()=>{
 const yaml=readFileSync('.github/workflows/ldb-free-production.yml','utf8');
 const a=yaml.indexOf('  hook-v5-package-readiness:');
 const b=yaml.indexOf('  verified-storyboard-package:',a);
 assert.ok(a>0&&b>a,'dedicated V5 package dry run must be separate');
 const job=yaml.slice(a,b);
 assert.match(job,/github\.actor == 'renyboydeleon27-cloud'/);
 assert.match(job,/github\.ref == 'refs\/heads\/feature\/ldb-hook-v5-cloud-executor'/);
 assert.match(job,/inputs\.episode_folder == 'hook-v5-offline-readiness'/);
 assert.match(job,/node scripts\/ldb-hook-v5-offline-readiness\.mjs/);
 assert.doesNotMatch(job,/secrets\.|CLOUDFLARE_API_TOKEN|\bwrangler\b|\bfetch\b|\/api\/|upload-artifact|GMAIL|GOOGLE_CLIENT/);
 assert.match(job,/persist-credentials: false/);
 const packaging=yaml.slice(b);
 assert.match(packaging,/inputs\.episode_folder != 'hook-v5-offline-readiness'/);
 assert.match(packaging,/inputs\.episode_folder != 'hook-v5-free-preflight'/);
});
test('offline package command contains no network, provider or environment secret access',()=>{
 const script=readFileSync('scripts/ldb-hook-v5-offline-readiness.mjs','utf8');
 assert.doesNotMatch(script,/\bfetch\s*\(|https?:\/\/|process\.env|import\s*\(.+https?:|\bwrangler\b/);
 assert.match(script,/prepareHookV5\(original\)/);
 assert.match(script,/validateRenderJob\(prepared\)/);
 assert.match(script,/NON_HOOK_SCENES_CHANGED/);
});

// Offline-only owner handoff for the TWO isolated authentication probes.
// No Cloudflare API access, secrets, git writes, deploys or paid services.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertProbeSafety} from './ldb-cloudflare-isolated-probe-gate.mjs';

const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const config=path=>JSON.parse(get(path));
export const loadOwnerProbeInputs=()=>({
 runner:config('cloudflare/ldb-runner/wrangler.probe.jsonc'),
 vault:config('cloudflare/ldb-google-vault/wrangler.probe.jsonc'),
 liveRunner:config('cloudflare/ldb-runner/wrangler.jsonc'),
 liveVault:config('cloudflare/ldb-google-vault/wrangler.jsonc'),
 ownerCli:get('scripts/ldb-live-binding-probe.mjs'),
 runnerBridge:get('cloudflare/ldb-runner/bridge-probe.mjs'),
 vaultBridge:get('cloudflare/ldb-google-vault/bridge-probe.mjs'),
 runnerWorker:get('cloudflare/ldb-runner/worker.mjs')
});

const requireAll=(source,phrases,label)=>{
 assert.equal(typeof source,'string',label+' source must be readable');
 for(const phrase of phrases){
  assert.ok(source.includes(phrase),
   label+' is not the reviewed nonce-bound probe protocol');
 }
};
// This is an inventory/contract check, not a proof that deployed Workers
// are running these bytes. CI and the owner both recheck before deployment.
export function ownerIsolatedProbeHandoff(inputs){
 const {runner,vault,liveRunner,liveVault,ownerCli,runnerBridge,
  vaultBridge,runnerWorker}=inputs;
 assertProbeSafety({runner,vault,liveRunner,liveVault});
 requireAll(ownerCli,[
  "randomBytes(16).toString('hex')",
  "'X-LDB-Probe-Nonce':nonce",
  'body.nonce!==nonce',
  "'--owner-approved-readonly-preflight'",
  "'--owner-approved-readonly-probe'"
 ],'Owner CLI');
 requireAll(runnerBridge,[
  'probeGoogleVaultBinding(env,nonce)',
  "'X-LDB-Probe-Nonce':nonce",
  'data.nonce!==nonce',
  'BRIDGE_PROBE_UNAVAILABLE',
  'AbortSignal.timeout(8000)'
 ],'Runner bridge');
 requireAll(vaultBridge,[
  "request.headers.get('X-LDB-Probe-Nonce')",
  'if(!validNonce(nonce))',
  "return json({status:'BRIDGE_AUTHENTICATED',nonce})",
  'Cache-Control'
 ],'Vault bridge');
 requireAll(runnerWorker,[
  "probeGoogleVaultBinding(env,",
  "request.headers.get('X-LDB-Probe-Nonce')",
  'ownerAccessGate(request,env)'
 ],'Runner Worker');
 assert.equal(runner.name,'ner-ldb-runner-binding-probe');
 assert.equal(vault.name,'ner-ldb-vault-binding-probe');
 assert.equal(runner.workers_dev,true);
 assert.equal(vault.workers_dev,false);
 return Object.freeze({
  status:'ISOLATED_PROBE_OWNER_HANDOFF_SAFE_TO_REVIEW',
  deploymentPerformed:false,authenticationVerified:false,productionReady:false,
  runner:runner.name,vault:vault.name,
  order:['vault','runner','readonly-preflight','authenticated-probe']
 });
}
export function ownerIsolatedProbeCommands(inputs){
 ownerIsolatedProbeHandoff(inputs);
 // These are merely suggested operator commands, not executable callbacks.
 // No tokens, runner secrets or environment values are printed.
 return [
  'OFFLINE REVIEW PASSED. NO DEPLOYMENT PERFORMED.',
  '1. Operator: inspect the exact two isolated configs and currently deployed settings.',
  '2. Dry-run ONLY (no Cloudflare write):',
  'npx --yes wrangler@4 deploy --dry-run --config cloudflare/ldb-google-vault/wrangler.probe.jsonc --outdir /tmp/ldb-vault-probe-check',
  'npx --yes wrangler@4 deploy --dry-run --config cloudflare/ldb-runner/wrangler.probe.jsonc --outdir /tmp/ldb-runner-probe-check',
  '3. OWNER APPROVAL REQUIRED. If both isolated Workers are approved for update, run manually in order:',
  'npx --yes wrangler@4 deploy --config cloudflare/ldb-google-vault/wrangler.probe.jsonc',
  'npx --yes wrangler@4 deploy --config cloudflare/ldb-runner/wrangler.probe.jsonc',
  '4. Reconfirm deployed bindings and exact owned workers.dev host before ANY Runner secret is sent:',
  'node scripts/ldb-live-binding-probe.mjs --owner-approved-readonly-preflight',
  '5. Only after preflight PASS, and only in trusted owner terminal:',
  'node scripts/ldb-live-binding-probe.mjs --owner-approved-readonly-probe',
  'Keep CLOUDFLARE_API_TOKEN and LDB_RUNNER_SECRET in private environment storage, never command arguments, GitHub or ChatGPT.',
  'Do not deploy quality/production Workers. Do not enable inference, OAuth, Drive, Gmail or production.',
  'The two Workers must have independently configured probe credentials. CLI cannot verify their presence or equality.',
  'Real auth, Drive 69/69, Gmail 4/4 and production readiness remain UNVERIFIED.'
 ].join('\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3||process.argv[2]!=='--print-owner-steps'){
  console.error('OWNER_HANDOFF_FLAG_REQUIRED: no commands run; only --print-owner-steps is supported.');
  process.exitCode=1;
 }else{
  try{console.log(ownerIsolatedProbeCommands(loadOwnerProbeInputs()));}
  catch{console.error('ISOLATED_HANDOFF_CHECK_FAILED: no commands run; review source and probe flags.');process.exitCode=1;}
 }
}

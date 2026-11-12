import test from 'node:test';
import assert from 'node:assert/strict';
import {loadOwnerProbeInputs,ownerIsolatedProbeHandoff,
 ownerIsolatedProbeCommands} from '../scripts/ldb-isolated-owner-handoff.mjs';

test('owner handoff checks exact inactive isolated targets and prints only manual steps',()=>{
 const inputs=loadOwnerProbeInputs();
 const result=ownerIsolatedProbeHandoff(inputs);
 assert.deepEqual(result,{
  status:'ISOLATED_PROBE_OWNER_HANDOFF_SAFE_TO_REVIEW',
  deploymentPerformed:false,authenticationVerified:false,productionReady:false,
  runner:'ner-ldb-runner-binding-probe',
  vault:'ner-ldb-vault-binding-probe',
  order:['vault','runner','readonly-preflight','authenticated-probe']
 });
 const text=ownerIsolatedProbeCommands(inputs);
 assert.match(text,/NO DEPLOYMENT PERFORMED/);
 assert.match(text,/wrangler@4 deploy --config cloudflare\/ldb-google-vault\/wrangler.probe.jsonc/);
 assert.match(text,/wrangler@4 deploy --config cloudflare\/ldb-runner\/wrangler.probe.jsonc/);
 assert.ok(text.indexOf('vault/wrangler.probe.jsonc')<text.indexOf('runner/wrangler.probe.jsonc'));
 assert.match(text,/--owner-approved-readonly-preflight/);
 assert.match(text,/--owner-approved-readonly-probe/);
 assert.doesNotMatch(text,/a437dda5f38ba6b10991684b8388760b|Bearer |sk-[A-Za-z0-9]+/);
 assert.equal(text.includes('wrangler.jsonc --config'),false);
});

test('unsafe or swapped target configs cannot produce an owner deployment handoff',()=>{
 const base=loadOwnerProbeInputs();
 for(const changed of [
  {runner:{...base.runner,name:base.liveRunner.name}},
  {vault:{...base.vault,name:base.liveVault.name}},
  {vault:{...base.vault,workers_dev:true}},
  {runner:{...base.runner,vars:{...base.runner.vars,RUNNER_ENABLED:'true'}}},
  {runner:{...base.runner,services:[{binding:'GOOGLE_VAULT',service:base.liveVault.name}]}},
  {vault:{...base.vault,vars:{...base.vault,DELIVERY_BRIDGE_ENABLED:'true'}}}
 ]){
  assert.throws(()=>ownerIsolatedProbeCommands({...base,...changed}));
 }
});

test('nonce protocol changes on any actor stop owner handoff BEFORE commands are printed',()=>{
 const base=loadOwnerProbeInputs();
 const mutations=[
  {ownerCli:base.ownerCli.replace("randomBytes(16).toString('hex')","'STATIC'")},
  {runnerBridge:base.runnerBridge.replace('data.nonce!==nonce','false')},
  {vaultBridge:base.vaultBridge.replace(
   "return json({status:'BRIDGE_AUTHENTICATED',nonce})",
   "return json({status:'BRIDGE_AUTHENTICATED'})")},
  {runnerWorker:base.runnerWorker.replace(
   "request.headers.get('X-LDB-Probe-Nonce')","null")}
 ];
 for(const change of mutations){
  assert.throws(()=>ownerIsolatedProbeCommands({...base,...change}));
 }
});

test('handoff is side-effect free even if Cloudflare network calls would fail',()=>{
 const base=loadOwnerProbeInputs();
 const oldFetch=globalThis.fetch;
 try{
  globalThis.fetch=()=>{throw Error('no remote network allowed');};
  assert.match(ownerIsolatedProbeCommands(base),/NO DEPLOYMENT PERFORMED/);
 }finally{globalThis.fetch=oldFetch;}
});

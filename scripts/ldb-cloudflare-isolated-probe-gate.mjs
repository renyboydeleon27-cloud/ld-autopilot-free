// Offline safety contract for TWO ISOLATED read-only Cloudflare Workers.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const RUNNER_FIELDS=['name','main','account_id','compatibility_date',
 'compatibility_flags','vars','services','durable_objects','migrations','workers_dev'];
const VAULT_FIELDS=RUNNER_FIELDS.filter(k=>k!=='services');
const exactly=(object,keys)=>assert.deepEqual(
 Object.keys(object).sort(),[...keys].sort(),
 'Isolated probe must contain ONLY reviewed configuration fields');
const exactRunnerVars=Object.freeze({
 CLOUDFLARE_ACCOUNT_ID:ACCOUNT,RUNNER_ENABLED:'false',
 FREE_PLAN_CONFIRMED:'false',DELIVERY_BRIDGE_ENABLED:'false',
 BRIDGE_PROBE_ENABLED:'true'
});
const exactVaultVars=Object.freeze({
 VAULT_ENABLED:'false',DELIVERY_BRIDGE_ENABLED:'false',BRIDGE_PROBE_ENABLED:'true'
});
function assertExactProbeConfig(config,kind){
 exactly(config,kind==='runner'?RUNNER_FIELDS:VAULT_FIELDS);
 assert.equal(config.account_id,ACCOUNT,'Unapproved Cloudflare account');
 assert.equal(config.compatibility_date,'2026-10-28');
 assert.deepEqual(config.compatibility_flags,['nodejs_compat']);
 assert.deepEqual(config.vars,kind==='runner'?exactRunnerVars:exactVaultVars);
 const cls=kind==='runner'?'LdbCoordinator':'LdbGoogleVault';
 const binding=kind==='runner'?'LDB_COORDINATOR':'GOOGLE_VAULT';
 assert.deepEqual(config.durable_objects,{bindings:[{name:binding,class_name:cls}]});
 assert.deepEqual(config.migrations,[{tag:'v1',new_sqlite_classes:[cls]}]);
 // Excludes unreviewed AI/R2/KV, routes, triggers, privileged variables,
 // extra services, credential copies and configuration drift.
 if(kind==='vault')assert.equal(config.workers_dev,false);
 else assert.equal(config.workers_dev,true);
}

export function assertProbeSafety({runner,vault,liveRunner,liveVault}){
 assertExactProbeConfig(runner,'runner');
 assertExactProbeConfig(vault,'vault');
 for(const c of [runner,vault]){
  assert.match(c.account_id,/^[a-f0-9]{32}$/);
  assert.equal(c.main,'worker.mjs');
  assert.ok(c.compatibility_flags.includes('nodejs_compat'));
  assert.ok(c.durable_objects.bindings.length>0);
  assert.ok(c.migrations.length>0);
  assert.ok(!c.route&&!c.routes);
  assert.equal(c.vars.BRIDGE_PROBE_ENABLED,'true');
  for(const [k,v] of Object.entries(c.vars)){
   assert.doesNotMatch(k,/(SECRET|PASSWORD|TOKEN|API_KEY)/i);
   if(k.endsWith('_ENABLED')&&k!=='BRIDGE_PROBE_ENABLED'||k==='FREE_PLAN_CONFIRMED')assert.equal(v,'false');
  }
 }
 assert.equal(runner.name,'ner-ldb-runner-binding-probe');
 assert.equal(vault.name,'ner-ldb-vault-binding-probe');
 assert.notEqual(runner.name,liveRunner.name);
 assert.notEqual(vault.name,liveVault.name);
 assert.equal(runner.account_id,vault.account_id);
 assert.equal(runner.account_id,liveRunner.account_id);
 assert.equal(vault.account_id,liveVault.account_id);
 assert.equal(runner.workers_dev,true);
 assert.equal(vault.workers_dev,false);
 assert.deepEqual(runner.services,[{binding:'GOOGLE_VAULT',service:vault.name}]);
 assert.deepEqual(runner.durable_objects,liveRunner.durable_objects);
 assert.deepEqual(vault.durable_objects,liveVault.durable_objects);
 for(const k of ['RUNNER_ENABLED','FREE_PLAN_CONFIRMED','DELIVERY_BRIDGE_ENABLED'])assert.equal(runner.vars[k],'false');
 for(const k of ['VAULT_ENABLED','DELIVERY_BRIDGE_ENABLED'])assert.equal(vault.vars[k],'false');
 return true;
}
export function checkFromDisk(){return assertProbeSafety({
 runner:load('cloudflare/ldb-runner/wrangler.probe.jsonc'),
 vault:load('cloudflare/ldb-google-vault/wrangler.probe.jsonc'),
 liveRunner:load('cloudflare/ldb-runner/wrangler.jsonc'),
 liveVault:load('cloudflare/ldb-google-vault/wrangler.jsonc')});}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 checkFromDisk();console.log('PASS: isolated binding probe configs only; generation, OAuth, Drive and paid features OFF.');
}

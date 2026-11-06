// Compile-only Cloudflare preflight, no secrets or API access.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
const paths=['cloudflare/ldb-runner/wrangler.jsonc','cloudflare/ldb-google-vault/wrangler.jsonc'];
function read(path) {
 const c=JSON.parse(readFileSync(path,'utf8'));
 assert.ok(existsSync(join(dirname(path),c.main)),path+' missing worker entrypoint');
 assert.ok(c.compatibility_flags.includes('nodejs_compat'),path+' requires nodejs_compat');
 for(const [k,value] of Object.entries(c.vars||{})){
  assert.doesNotMatch(k,/(SECRET|PASSWORD|ACCESS_TOKEN|REFRESH_TOKEN|API_KEY)/i,path+' must not expose secrets');
  if(k.endsWith('_ENABLED')||k==='FREE_PLAN_CONFIRMED')assert.equal(value,'false',path+' '+k+' must remain OFF');
 }
 assert.ok(c.durable_objects?.bindings?.length,path+' must bind a Durable Object');
 assert.ok(c.migrations?.length,path+' must define Durable Object migrations');
 return c;
}
const [runner,vault]=paths.map(read);
assert.equal(runner.name,'ner-ldb-runner-quality');
assert.equal(vault.name,'ner-ldb-google-vault-quality');
assert.equal(runner.vars.QUALITY_IMPORT_ENABLED,'false');
assert.match(runner.account_id,/^[a-f0-9]{32}$/);
assert.equal(vault.account_id,runner.account_id,'both Workers must be in the same account');
assert.deepEqual(runner.services,[{binding:'GOOGLE_VAULT',service:vault.name}]);
for(const k of ['RUNNER_ENABLED','FREE_PLAN_CONFIRMED','DELIVERY_BRIDGE_ENABLED','BRIDGE_PROBE_ENABLED','GMAIL_MILESTONES_ENABLED'])assert.equal(runner.vars[k],'false');
for(const k of ['VAULT_ENABLED','DELIVERY_BRIDGE_ENABLED','BRIDGE_PROBE_ENABLED','GMAIL_MILESTONES_ENABLED'])assert.equal(vault.vars[k],'false');
console.log('PASS: Both Worker configs target one account; migrations and binding valid; all production flags OFF.');

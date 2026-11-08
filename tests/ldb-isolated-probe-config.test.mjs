import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertProbeSafety} from '../scripts/ldb-cloudflare-isolated-probe-gate.mjs';
import {verifyLiveBindingProbe} from '../scripts/ldb-live-binding-probe.mjs';
const get=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
function all(){return {
 runner:get('../cloudflare/ldb-runner/wrangler.probe.jsonc'),
 vault:get('../cloudflare/ldb-google-vault/wrangler.probe.jsonc'),
 liveRunner:get('../cloudflare/ldb-runner/wrangler.jsonc'),
 liveVault:get('../cloudflare/ldb-google-vault/wrangler.jsonc')
};}
test('isolated Workers never replace quality Workers or enable Google or inference',()=>{
 assert.equal(assertProbeSafety(all()),true);
});
test('safety contract rejects unsafe config mutations',()=>{
 for(const change of [
  x=>x.runner.name=x.liveRunner.name,
  x=>x.runner.vars.RUNNER_ENABLED='true',
  x=>x.runner.vars.FREE_PLAN_CONFIRMED='true',
  x=>x.runner.vars.DELIVERY_BRIDGE_ENABLED='true',
  x=>x.vault.vars.VAULT_ENABLED='true',
  x=>x.vault.vars.DELIVERY_BRIDGE_ENABLED='true',
  x=>x.runner.services[0].service=x.liveVault.name,
  x=>x.vault.workers_dev=true,
  x=>x.vault.vars.GOOGLE_SECRET='leaked',
  x=>x.vault.account_id='b'.repeat(32),
  x=>x.runner.vars.AI='true',
  x=>x.runner.vars.GOOGLE_CLIENT_SECRET='forbidden',
  x=>x.vault.vars.VAULT_KEY='no-plain-credentials',
  x=>x.runner.ai={binding:'AI'},
  x=>x.runner.unsafe={bindings:[{type:'ai',name:'AI'}]},
  x=>x.runner.kv_namespaces=[{binding:'PRIVATE'}],
  x=>x.vault.r2_buckets=[{binding:'R2'}],
  x=>x.runner.triggers={crons:['* * * * *']},
  x=>x.runner.routes=['example.com/*'],
  x=>x.vault.services=[{binding:'GOOGLE_VAULT',service:'ner-ldb-google-vault-quality'}],
  x=>x.runner.vars.BRIDGE_PROBE_ENABLED='false',
  x=>x.runner.compatibility_flags.push('unsafe_eval'),
  x=>x.vault.durable_objects.bindings.push({name:'EXTRA',class_name:'Other'}),
  x=>x.runner.migrations.push({tag:'v2',new_classes:['Unreviewed']}),
  x=>x.runner.account_id='b'.repeat(32),
  x=>x.runner.compatibility_date='2027-01-01'
 ]){const c=all();change(c);assert.throws(()=>assertProbeSafety(c));}
});
const url='https://ner-ldb-runner-binding-probe.account.workers.dev/delivery-bridge-probe';
const secret='isolated-fixture-owner-secret-long-enough';
test('authenticated read-only response never reports production ready',async()=>{
 let calls=0;
 const out=await verifyLiveBindingProbe({url,secret,fetcher:async(u,opts)=>{
  calls++;assert.equal(u,url);assert.equal(opts.redirect,'manual');
  assert.equal(opts.method,'GET');assert.equal(opts.body,undefined);
  assert.equal(opts.headers.Authorization,'Bearer '+secret);
  return Response.json({status:'BRIDGE_AUTHENTICATED',productionReady:false});
 }});
 assert.deepEqual(out,{status:'BRIDGE_AUTHENTICATED',productionReady:false});
 assert.equal(calls,1);assert.ok(!JSON.stringify(out).includes(secret));
});
test('unsafe URLs refuse to send bearer secrets',async()=>{
 let called=0;const fetcher=async()=>{called++;throw Error('unwanted network')};
 for(const bad of ['http://owner.workers.dev/delivery-bridge-probe',
  'https://attacker.example/delivery-bridge-probe',
  'https://attacker.account.workers.dev/delivery-bridge-probe',
  'https://ner-ldb-runner-binding-probe.other.account.workers.dev/delivery-bridge-probe',
  'https://owner.workers.dev/stop',
  url+'?token=oops',
  'https://user:pass@owner.workers.dev/delivery-bridge-probe',
  'https://owner.workers.dev:444/delivery-bridge-probe']){
   await assert.rejects(verifyLiveBindingProbe({url:bad,secret,fetcher}),/UNSAFE_PROBE_URL/);
 }
 assert.equal(called,0);
});
test('redirect, missing, and forged ready responses fail',async()=>{
 for(const fake of [new Response('',{status:302,headers:{Location:'https://evil.example/'}}),
  Response.json({status:'SETUP_REQUIRED'},{status:503}),
  Response.json({status:'BRIDGE_AUTHENTICATED',productionReady:true}),
  Response.json({status:'BRIDGE_AUTHENTICATED',productionReady:false,token:'extra'}),
  Response.json({status:'BRIDGE_AUTHENTICATED'}),
  new Response('bad-json',{status:200})]){
   await assert.rejects(verifyLiveBindingProbe({url,secret,fetcher:async()=>fake}),/PROBE_(NOT_AUTHENTICATED|RESPONSE_INVALID)/);
 }
});

test('isolated probe config disallows undocumented vars, copied credentials and paid bindings',()=>{
 const base=all();
 for(const kind of ['runner','vault']){
  const extra=structuredClone(base);
  extra[kind].vars.EXTRA_VALUE='x';
  assert.throws(()=>assertProbeSafety(extra));
  const secret=structuredClone(base);
  secret[kind].vars.API_TOKEN='do-not-publish';
  assert.throws(()=>assertProbeSafety(secret));
 }
 assert.equal(assertProbeSafety(base),true);
});

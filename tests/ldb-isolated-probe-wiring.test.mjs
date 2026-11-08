import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLdbIsolatedProbeWiring} from '../lib/ldb/cloudflare-vault-wiring.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const TOKEN='mock-cloudflare-account-read-only-token-1234';
const vaultName='ner-ldb-vault-binding-probe';
const text=(name,text)=>({name,type:'plain_text',text});
const runner=[
 {name:'GOOGLE_VAULT',type:'service',service:vaultName,environment:'production'},
 {name:'LDB_COORDINATOR',type:'durable_object_namespace',class_name:'LdbCoordinator'},
 text('CLOUDFLARE_ACCOUNT_ID',ACCOUNT),text('RUNNER_ENABLED','false'),
 text('FREE_PLAN_CONFIRMED','false'),text('DELIVERY_BRIDGE_ENABLED','false'),
 text('BRIDGE_PROBE_ENABLED','true')
];
const vault=[
 {name:'GOOGLE_VAULT',type:'durable_object_namespace',class_name:'LdbGoogleVault'},
 text('VAULT_ENABLED','false'),text('DELIVERY_BRIDGE_ENABLED','false'),
 text('BRIDGE_PROBE_ENABLED','true')
];
function fixture({rb=runner,vb=vault,runnerStatus=200,vaultStatus=200}={}){
 const calls=[];
 const fetcher=async(url,opts)=>{
  calls.push({url,method:opts.method,redirect:opts.redirect});
  assert.equal(opts.method,'GET');
  assert.equal(opts.redirect,'error');
  assert.equal(opts.headers.Authorization,'Bearer '+TOKEN);
  assert.ok(url.endsWith('/settings'));
  assert.ok(url.includes('ner-ldb-runner-binding-probe')||
    url.includes('ner-ldb-vault-binding-probe'));
  const r=url.includes('/ner-ldb-runner-binding-probe/');
  const status=r?runnerStatus:vaultStatus;
  if(status!==200)return Response.json({success:false},{status});
  return Response.json({success:true,result:{bindings:r?rb:vb,
   private:'NEVER_ECHO_SECRET',token:'UNTRUSTED_EXTRA'}});
 };
 return {fetcher,calls};
}
async function inspect(f){
 return inspectLdbIsolatedProbeWiring({
  accountId:ACCOUNT,token:TOKEN,fetcher:f.fetcher
 });
}
test('deployed isolated settings must match expected offline probe flags, not authenticate transport',async()=>{
 const f=fixture(),out=await inspect(f);
 assert.equal(out.status,'ISOLATED_PROBE_METADATA_MATCHES_SAFE');
 assert.equal(out.runnerSettingsHttpStatus,200);
 assert.equal(out.vaultSettingsHttpStatus,200);
 assert.equal(out.serviceBindingState,'TARGET_MATCH');
 assert.equal(out.serviceEnvironmentState,'PRODUCTION');
 assert.equal(out.runnerNamespace,'EXPECTED_CLASS');
 assert.equal(out.vaultNamespace,'EXPECTED_CLASS');
 assert.equal(out.unexpectedRunnerBindings,false);
 assert.equal(out.unexpectedVaultBindings,false);
 assert.equal(out.runnerChecks.BRIDGE_PROBE_ENABLED,'EXPLICIT_TRUE');
 assert.equal(out.vaultChecks.VAULT_ENABLED,'EXPLICIT_FALSE');
 for(const key of ['authenticationVerified','authenticationProbeCalled',
  'googleApiCalled','gmailApiCalled','workerModified','inferenceCalled','productionReady'])
  assert.equal(out[key],false);
 assert.equal(f.calls.length,2);
 assert.ok(!JSON.stringify(out).includes('NEVER_ECHO_SECRET'));
 assert.ok(!JSON.stringify(out).includes(TOKEN));
});
test('wrong service target, disabled probe flag, or an active Vault cannot pass',async()=>{
 const cases=[
  fixture({rb:runner.map(b=>b.name==='GOOGLE_VAULT'?{...b,service:'wrong'}:b)}),
  fixture({rb:runner.map(b=>b.name==='GOOGLE_VAULT'?{...b,environment:'staging'}:b)}),
  fixture({rb:runner.map(b=>b.name==='GOOGLE_VAULT'?{...b,entrypoint:'sensitive'}:b)}),
  fixture({rb:runner.map(b=>b.name==='BRIDGE_PROBE_ENABLED'?{...b,text:'false'}:b)}),
  fixture({vb:vault.map(b=>b.name==='VAULT_ENABLED'?{...b,text:'true'}:b)}),
  fixture({rb:runner.filter(b=>b.name!=='FREE_PLAN_CONFIRMED')}),
  fixture({vb:vault.filter(b=>b.name!=='GOOGLE_VAULT')}),
  fixture({rb:[...runner,{name:'AI',type:'ai'}]}),
  fixture({vb:[...vault,{name:'GOOGLE_CLIENT_SECRET',type:'secret_text'}]}),
  fixture({runnerStatus:403}),
  fixture({vaultStatus:404})
 ];
 for(const f of cases){
  const out=await inspect(f);
  assert.equal(out.status,'ISOLATED_PROBE_METADATA_NOT_VERIFIED');
  assert.equal(out.authenticationVerified,false);
  assert.equal(out.productionReady,false);
  assert.equal(f.calls.length,2);
 }
});
test('unreadable or oversized provider responses never masquerade as matching metadata',async()=>{
 const f=fixture(),original=f.fetcher;
 f.fetcher=async(url,opts)=>{
  if(url.includes('/ner-ldb-vault-binding-probe/'))
   return Response.json({success:true,result:{bindings:vault,
    padding:'private'.repeat(24000)}});
  return original(url,opts);
 };
 const out=await inspect(f);
 assert.equal(out.status,'ISOLATED_PROBE_METADATA_NOT_VERIFIED');
 assert.equal(out.vaultWorkerMetadataFound,false);
 assert.ok(!JSON.stringify(out).includes('private'));
});
test('wrong account or short token fails before even reading Worker metadata',async()=>{
 let calls=0;const fetcher=()=>{calls++;throw Error('NETWORK_FORBIDDEN')};
 await assert.rejects(inspectLdbIsolatedProbeWiring({accountId:'wrong',
  token:TOKEN,fetcher}),/VAULT_METADATA_READ_UNAVAILABLE/);
 await assert.rejects(inspectLdbIsolatedProbeWiring({accountId:ACCOUNT,
  token:'short',fetcher}),/VAULT_METADATA_READ_UNAVAILABLE/);
 assert.equal(calls,0);
});

test('optional absent environment remains compatible, but other named environments fail',async()=>{
 const noScope=fixture({rb:runner.map(x=>x.name==='GOOGLE_VAULT'?
  {name:x.name,type:x.type,service:x.service}:x)});
 const out=await inspect(noScope);
 assert.equal(out.serviceBindingState,'TARGET_MATCH');
 assert.equal(out.serviceEnvironmentState,'UNSPECIFIED');
 assert.equal(out.status,'ISOLATED_PROBE_METADATA_MATCHES_SAFE');
});

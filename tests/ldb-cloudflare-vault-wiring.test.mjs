import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLdbCloudflareVaultWiring,classifyVaultFlag,classifyVaultServiceBinding} from '../lib/ldb/cloudflare-vault-wiring.mjs';
const account='a437dda5f38ba6b10991684b8388760b';
const token='mock-read-only-cloudflare-token-12345';
const vault='ner-ldb-google-vault-quality';
const mock=(settings={},statuses={})=>{
 const calls=[];
 const fetcher=async(url,opts={})=>{
  calls.push({url,opts});
  assert.equal(opts.method,'GET');
  assert.equal(opts.redirect,'error');
  assert.equal(opts.headers.Authorization,'Bearer '+token);
  assert.ok(url.endsWith('/settings'));
  assert.ok(!url.includes('/ai/run')&&!url.includes('/secrets')&&!url.includes('/deployments'));
  const name=url.includes('/ner-ldb-runner-quality/')?'runner':'vault';
  const status=statuses[name]??200;
  if(status!==200)return Response.json({success:false},{status});
  const defaults=name==='runner'?
   [{name:'GOOGLE_VAULT',type:'service',service:vault},
    {name:'DELIVERY_BRIDGE_ENABLED',type:'plain_text',text:'false'}]:
   [{name:'DELIVERY_BRIDGE_ENABLED',type:'plain_text',text:'false'},
    {name:'VAULT_ENABLED',type:'plain_text',text:'false'}];
  return Response.json({success:true,result:{bindings:settings[name]??defaults,
   confidentialValue:'must-never-be-visible',other:'secret-to-be-discarded'}});
 };
 return {fetcher,calls};
};
test('actual quality Worker metadata may match while all production operations stay OFF',async()=>{
 const m=mock();
 const result=await inspectLdbCloudflareVaultWiring({accountId:account,token,fetcher:m.fetcher});
 assert.equal(result.status,'CLOUDFLARE_WIRING_METADATA_MATCHES_OFF');
 assert.equal(result.runnerSettingsHttpStatus,200);
 assert.equal(result.vaultSettingsHttpStatus,200);
 assert.equal(result.serviceBindingMetadataMatches,true);
 assert.equal(result.serviceBindingState,'TARGET_MATCH');
 assert.equal(result.runnerDeliveryState,'EXPLICIT_FALSE');
 assert.equal(result.vaultDeliveryState,'EXPLICIT_FALSE');
 assert.equal(result.vaultOAuthState,'EXPLICIT_FALSE');
 assert.equal(result.runnerDeliveryDisabled,true);
 assert.equal(result.vaultDeliveryDisabled,true);
 assert.equal(result.vaultOAuthDisabled,true);
 assert.equal(result.vaultUpdateEligibleForReviewedUpdate,false);
 assert.equal(result.vaultUpdateSafetyStatus,'VAULT_FLAGS_NOT_SAFELY_DISABLED');
 assert.equal(result.liveServiceBindingProbed,false);
 assert.equal(result.productionReady,false);
 assert.equal(result.googleApiCalled,false);
 assert.equal(result.gmailApiCalled,false);
 assert.equal(m.calls.length,2);
 assert.ok(!JSON.stringify(result).includes('must-never-be-visible'));
 assert.ok(!JSON.stringify(result).includes(token));
 assert.ok(!JSON.stringify(result).includes(account));
});
test('missing, inaccessible or wrong-target Workers cannot report matching wiring',async()=>{
 const cases=[
  mock({}, {runner:404}),
  mock({}, {vault:403}),
  mock({runner:[{name:'GOOGLE_VAULT',type:'service',service:'wrong-worker'},
   {name:'DELIVERY_BRIDGE_ENABLED',type:'plain_text',text:'false'}]}),
  mock({runner:[{name:'GOOGLE_VAULT',type:'service',service:vault},
   {name:'DELIVERY_BRIDGE_ENABLED',type:'plain_text',text:'true'}]}),
  mock({vault:[{name:'VAULT_ENABLED',type:'plain_text',text:'true'},
   {name:'DELIVERY_BRIDGE_ENABLED',type:'plain_text',text:'false'}]})
 ];
 for(const m of cases){
  const out=await inspectLdbCloudflareVaultWiring({accountId:account,token,fetcher:m.fetcher});
  assert.equal(out.status,'CLOUDFLARE_WIRING_NOT_VERIFIED');
  assert.equal(out.productionReady,false);
  assert.equal(m.calls.length,2);
 }
});
test('refuses arbitrary account and short credentials before network',async()=>{
 const network=()=>assert.fail('NO_PROVIDER_CALLS_ALLOWED');
 await assert.rejects(inspectLdbCloudflareVaultWiring({accountId:'wrong',token,fetcher:network}),/VAULT_METADATA_READ_UNAVAILABLE/);
 await assert.rejects(inspectLdbCloudflareVaultWiring({accountId:account,token:'short',fetcher:network}),/VAULT_METADATA_READ_UNAVAILABLE/);
});
test('huge Cloudflare metadata responses fail closed without leaking raw values',async()=>{
 let count=0;
 const fetcher=async()=>{count++;return Response.json({success:true,result:{
  bindings:[],padding:'secretstuff'.repeat(18000)
 }})};
 const out=await inspectLdbCloudflareVaultWiring({accountId:account,token,fetcher});
 assert.equal(out.status,'CLOUDFLARE_WIRING_NOT_VERIFIED');
 assert.equal(out.runnerWorkerFound,false);
 assert.equal(count,2);
 assert.ok(!JSON.stringify(out).includes('secretstuff'));
});

test('safe reason codes distinguish a missing Vault binding from a wrong Worker target',()=>{
 assert.equal(classifyVaultServiceBinding(undefined),'METADATA_UNAVAILABLE');
 assert.equal(classifyVaultServiceBinding([]),'MISSING');
 assert.equal(classifyVaultServiceBinding([{name:'GOOGLE_VAULT',type:'service',service:'other-worker'}]),'WRONG_TARGET');
 assert.equal(classifyVaultServiceBinding([{name:'GOOGLE_VAULT',type:'secret_text',text:'private'}]),'WRONG_TYPE');
 assert.equal(classifyVaultServiceBinding([{name:'GOOGLE_VAULT',type:'service',service:vault,environment:'staging'}]),'ENVIRONMENT_SCOPED');
 assert.equal(classifyVaultServiceBinding([{name:'GOOGLE_VAULT',type:'service',service:vault,environment:'production'}]),'ENVIRONMENT_SCOPED');
 assert.equal(classifyVaultServiceBinding([{name:'GOOGLE_VAULT',type:'service',service:vault,entrypoint:'Other'}]),'NONDEFAULT_ENTRYPOINT');
 assert.equal(classifyVaultServiceBinding([{name:'GOOGLE_VAULT',type:'service',service:vault}]),'TARGET_MATCH');
 assert.equal(classifyVaultServiceBinding([
  {name:'GOOGLE_VAULT',type:'service',service:vault},
  {name:'GOOGLE_VAULT',type:'service',service:'other'}]),'DUPLICATE');
});
test('flag classifier never equates arbitrary non-false values with an enabled flag',()=>{
 const name='VAULT_ENABLED';
 assert.equal(classifyVaultFlag(undefined,name),'METADATA_UNAVAILABLE');
 assert.equal(classifyVaultFlag([],name),'MISSING');
 assert.equal(classifyVaultFlag([{name,type:'plain_text',text:'false'}],name),'EXPLICIT_FALSE');
 assert.equal(classifyVaultFlag([{name,type:'plain_text',text:'true'}],name),'EXPLICIT_TRUE');
 assert.equal(classifyVaultFlag([{name,type:'plain_text',text:'INVALID-DO-NOT-ECHO'}],name),'UNEXPECTED_VALUE');
 assert.equal(classifyVaultFlag([{name,type:'secret_text',text:'CONFIDENTIAL'}],name),'WRONG_TYPE');
 assert.equal(classifyVaultFlag([{name,type:'plain_text',text:'false'},{name,type:'plain_text',text:'true'}],name),'DUPLICATE');
});
test('live sanitized status identifies unsafe Vault flag without leaking value or target',async()=>{
 const secret='PROVIDER_PRIVATE_DO_NOT_ECHO';
 const m=mock({
  runner:[{name:'GOOGLE_VAULT',type:'service',service:secret},
   {name:'DELIVERY_BRIDGE_ENABLED',type:'plain_text',text:'false'}],
  vault:[{name:'DELIVERY_BRIDGE_ENABLED',type:'plain_text',text:'invalid-secret-like-value'},
   {name:'VAULT_ENABLED',type:'plain_text',text:'true'}]
 });
 const out=await inspectLdbCloudflareVaultWiring({accountId:account,token,fetcher:m.fetcher});
 assert.equal(out.serviceBindingState,'WRONG_TARGET');
 assert.equal(out.vaultDeliveryState,'UNEXPECTED_VALUE');
 assert.equal(out.vaultDeliveryDisabled,null);
 assert.equal(out.vaultOAuthState,'EXPLICIT_TRUE');
 assert.equal(out.vaultOAuthDisabled,false);
 assert.equal(out.status,'CLOUDFLARE_WIRING_NOT_VERIFIED');
 assert.equal(out.productionReady,false);
 assert.ok(!JSON.stringify(out).includes(secret));
 assert.ok(!JSON.stringify(out).includes('invalid-secret-like-value'));
});

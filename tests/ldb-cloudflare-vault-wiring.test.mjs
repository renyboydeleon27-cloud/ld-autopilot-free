import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLdbCloudflareVaultWiring} from '../lib/ldb/cloudflare-vault-wiring.mjs';
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
 assert.equal(result.runnerDeliveryDisabled,true);
 assert.equal(result.vaultDeliveryDisabled,true);
 assert.equal(result.vaultOAuthDisabled,true);
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

import test from 'node:test';
import assert from 'node:assert/strict';
import {runOwnerVerifiedBindingProbe} from '../scripts/ldb-live-binding-probe.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const TOKEN='cloudflare-readonly-token-with-ample-test-length';
const SECRET='long-operator-runner-secret-not-for-production';
const PROBE='ner-ldb-runner-binding-probe';
const VAULT='ner-ldb-vault-binding-probe';
const URL='https://'+PROBE+'.ownerzone.workers.dev/delivery-bridge-probe';
const plain=(name,text)=>({name,type:'plain_text',text});
const runner=[
 {name:'GOOGLE_VAULT',type:'service',service:VAULT,environment:'production'},
 {name:'LDB_COORDINATOR',type:'durable_object_namespace',class_name:'LdbCoordinator'},
 plain('CLOUDFLARE_ACCOUNT_ID',ACCOUNT),plain('RUNNER_ENABLED','false'),
 plain('FREE_PLAN_CONFIRMED','false'),plain('DELIVERY_BRIDGE_ENABLED','false'),
 plain('BRIDGE_PROBE_ENABLED','true')
];
const vault=[
 {name:'GOOGLE_VAULT',type:'durable_object_namespace',class_name:'LdbGoogleVault'},
 plain('VAULT_ENABLED','false'),plain('DELIVERY_BRIDGE_ENABLED','false'),
 plain('BRIDGE_PROBE_ENABLED','true')
];
const baseEnv={CLOUDFLARE_ACCOUNT_ID:ACCOUNT,CLOUDFLARE_API_TOKEN:TOKEN,
 LDB_PROBE_URL:URL,LDB_RUNNER_SECRET:SECRET};
function mock({subdomain='ownerzone',scriptEnabled=true,
  runnerBindings=runner,vaultBindings=vault,
  accountStatus=200,runnerStatus=200,
  healthStatus=200,healthBody={status:'BRIDGE_AUTHENTICATED',productionReady:false}}={}){
 const calls=[];
 const fetcher=async(url,opts={})=>{
  calls.push({url,opts});
  if(url===URL){
   assert.equal(opts.method,'GET');
   assert.equal(opts.headers.Authorization,'Bearer '+SECRET);
   assert.equal(opts.redirect,'manual');
   return Response.json(healthBody,{status:healthStatus});
  }
  assert.equal(opts.method,'GET');
  assert.equal(opts.redirect,'error');
  assert.equal(opts.headers.Authorization,'Bearer '+TOKEN);
  if(url.endsWith('/workers/subdomain'))
   return Response.json({success:true,result:{subdomain}},{status:accountStatus});
  if(url.endsWith('/scripts/'+PROBE+'/subdomain'))
   return Response.json({success:true,result:{enabled:scriptEnabled}});
  if(url.endsWith('/scripts/'+PROBE+'/settings'))
   return Response.json({success:true,result:{bindings:runnerBindings}},{status:runnerStatus});
  if(url.endsWith('/scripts/'+VAULT+'/settings'))
   return Response.json({success:true,result:{bindings:vaultBindings}});
  assert.fail('Unexpected endpoint '+url);
 };
 return {fetcher,calls,secretCalls:()=>calls.filter(c=>c.opts.headers.Authorization==='Bearer '+SECRET)};
}
test('4 account-verified Cloudflare GET preflights then exactly one authenticated Worker GET',async()=>{
 const f=mock();
 const result=await runOwnerVerifiedBindingProbe({env:baseEnv,fetcher:f.fetcher});
 assert.deepEqual(result,{
  status:'BRIDGE_AUTHENTICATED',productionReady:false,
  hostOwnershipVerified:true,workerMetadataVerified:true,
  googleConnectionVerified:false,gmailConnectionVerified:false,
  inferenceCalled:false,workerModified:false
 });
 assert.equal(f.calls.length,5);
 assert.equal(f.secretCalls().length,1);
 assert.equal(f.calls[4].url,URL);
 assert.ok(f.calls.slice(0,4).every(c=>c.opts.method==='GET'));
 assert.ok(!JSON.stringify(result).includes(TOKEN));
 assert.ok(!JSON.stringify(result).includes(SECRET));
});
test('wrong verified Cloudflare account subdomain blocks owner-secret transmission',async()=>{
 const f=mock({subdomain:'another-account'});
 await assert.rejects(runOwnerVerifiedBindingProbe({env:baseEnv,fetcher:f.fetcher}),
  /UNVERIFIED_PROBE_ACCOUNT_HOST/);
 assert.equal(f.secretCalls().length,0);
});
test('wrong account/token, malformed URLs and missing owner secret fail before network',async()=>{
 for(const env of [
  {...baseEnv,CLOUDFLARE_ACCOUNT_ID:'wrong'},
  {...baseEnv,CLOUDFLARE_API_TOKEN:'short'},
  {...baseEnv,LDB_PROBE_URL:'https://'+PROBE+'.attacker.workers.dev/delivery-bridge-probe?secret=bad'},
  {...baseEnv,LDB_PROBE_URL:'https://evil.example/delivery-bridge-probe'},
  {...baseEnv,LDB_RUNNER_SECRET:'short'}
 ]){
  const f=mock();
  await assert.rejects(runOwnerVerifiedBindingProbe({env,fetcher:f.fetcher}));
  assert.equal(f.calls.length,0);
 }
});
test('unsafe deployed Worker flags, account subdomain response and API permission failures block',async()=>{
 for(const f of [
  mock({runnerBindings:runner.map(b=>b.name==='DELIVERY_BRIDGE_ENABLED'?{...b,text:'true'}:b)}),
  mock({runnerStatus:403}),
  mock({accountStatus:403}),
  mock({scriptEnabled:false}),
  mock({subdomain:'not.valid'})
 ]){
  await assert.rejects(runOwnerVerifiedBindingProbe({env:baseEnv,fetcher:f.fetcher}));
  assert.equal(f.secretCalls().length,0);
 }
});
test('invalid authenticated response fails; never infers Google or production readiness',async()=>{
 for(const f of [
  mock({healthStatus:401}),
  mock({healthBody:{status:'BRIDGE_AUTHENTICATED',productionReady:true}}),
  mock({healthBody:{status:'BRIDGE_AUTHENTICATED',productionReady:false,secret:'hidden'}}),
  mock({healthStatus:302})
 ]){
  await assert.rejects(runOwnerVerifiedBindingProbe({env:baseEnv,fetcher:f.fetcher}));
  assert.equal(f.secretCalls().length,1);
 }
});

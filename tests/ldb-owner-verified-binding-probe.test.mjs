import test from 'node:test';
import assert from 'node:assert/strict';
import {runOwnerVerifiedBindingProbe,runOwnerReadOnlyBindingPreflight} from '../scripts/ldb-live-binding-probe.mjs';
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
  healthStatus=200,healthBody={status:'BRIDGE_AUTHENTICATED',productionReady:false},
  healthHeaders={'Cache-Control':'no-store'}}={}){
 const calls=[];
 const fetcher=async(url,opts={})=>{
  calls.push({url,opts});
  if(url===URL){
   assert.equal(opts.method,'GET');
   assert.equal(opts.headers.Authorization,'Bearer '+SECRET);
   assert.equal(opts.redirect,'manual');
   assert.equal(opts.cache,'no-store');
   assert.equal(opts.headers['Cache-Control'],'no-store');
   return Response.json(healthBody,{status:healthStatus,headers:healthHeaders});
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
  mock({healthStatus:302}),
  mock({healthHeaders:{}}),
  mock({healthHeaders:{'Cache-Control':'public, max-age=3600'}}),
  mock({healthHeaders:{'Cache-Control':'no-store','Content-Type':'text/html'}}),
  mock({healthHeaders:{'Cache-Control':'no-store','Content-Type':'text/plain'}})
 ]){
  await assert.rejects(runOwnerVerifiedBindingProbe({env:baseEnv,fetcher:f.fetcher}));
  assert.equal(f.secretCalls().length,1);
 }
});


test('owner preflight verifies isolated metadata with NO Runner secret and only four Cloudflare GETs',async()=>{
 const f=mock(),env={...baseEnv};
 delete env.LDB_RUNNER_SECRET;
 const result=await runOwnerReadOnlyBindingPreflight({env,fetcher:f.fetcher});
 assert.deepEqual(result,{
  status:'OWNER_PREFLIGHT_VERIFIED',
  verifiedHost:PROBE+'.ownerzone.workers.dev',
  hostOwnershipVerified:true,workerMetadataVerified:true,
  ownerSecretSent:false,authenticationVerified:false,
  googleConnectionVerified:false,gmailConnectionVerified:false,
  inferenceCalled:false,workerModified:false,productionReady:false
 });
 assert.equal(f.calls.length,4);
 assert.equal(f.secretCalls().length,0);
 assert.ok(f.calls.every(x=>x.opts.method==='GET'&&x.opts.redirect==='error'));
 assert.doesNotMatch(JSON.stringify(result),/cloudflare-readonly-token|operator-runner-secret/);
});
test('metadata-only preflight rejects wrong account host without sending owner secret',async()=>{
 for(const options of [{subdomain:'attackerzone'},
  {runnerStatus:403},{scriptEnabled:false},
  {runnerBindings:runner.map(x=>x.name==='RUNNER_ENABLED'?{...x,text:'true'}:x)}]){
  const f=mock(options),env={...baseEnv};
  delete env.LDB_RUNNER_SECRET;
  await assert.rejects(runOwnerReadOnlyBindingPreflight({env,fetcher:f.fetcher}));
  assert.equal(f.secretCalls().length,0);
 }
});
test('preflight requires read-only Cloudflare token, valid fixed host and HTTPS',async()=>{
 for(const env of [
  {...baseEnv,CLOUDFLARE_API_TOKEN:undefined},
  {...baseEnv,CLOUDFLARE_ACCOUNT_ID:'another-account'},
  {...baseEnv,LDB_PROBE_URL:'http://'+PROBE+'.ownerzone.workers.dev/delivery-bridge-probe'},
  {...baseEnv,LDB_PROBE_URL:'https://'+PROBE+'.ownerzone.workers.dev/delivery-bridge-probe?redirect=1'}
 ]){
  const f=mock();
  await assert.rejects(runOwnerReadOnlyBindingPreflight({env,fetcher:f.fetcher}));
  assert.equal(f.calls.length,0);
 }
});

test('Cloudflare API token accidentally reused as Runner secret fails before any network',async()=>{
 const f=mock(),env={...baseEnv,LDB_RUNNER_SECRET:TOKEN};
 await assert.rejects(runOwnerVerifiedBindingProbe({env,fetcher:f.fetcher}),
  /PROBE_SECRET_REUSE_FORBIDDEN/);
 assert.equal(f.calls.length,0);
 assert.equal(f.secretCalls().length,0);
});
test('strict workers.dev account label rejects invalid and unsafe labels before owner-secret GET',async()=>{
 const invalid=['-ownerzone','ownerzone-','ab--.cd','a'.repeat(64)];
 for(const subdomain of invalid){
  const env={...baseEnv,LDB_PROBE_URL:
   'https://'+PROBE+'.'+subdomain+'.workers.dev/delivery-bridge-probe'};
  const f=mock({subdomain});
  await assert.rejects(runOwnerReadOnlyBindingPreflight({env,fetcher:f.fetcher}));
  assert.equal(f.secretCalls().length,0);
  await assert.rejects(runOwnerVerifiedBindingProbe({env,fetcher:f.fetcher}));
  assert.equal(f.secretCalls().length,0);
 }
});
test('Cloudflare account metadata with invalid DNS label fails even when candidate host is valid',async()=>{
 for(const subdomain of ['-ownerzone','ownerzone-','a'.repeat(64)]){
  const f=mock({subdomain});
  await assert.rejects(runOwnerReadOnlyBindingPreflight({env:baseEnv,fetcher:f.fetcher}),
   /PROBE_ACCOUNT_HOST_NOT_VERIFIED/);
  assert.equal(f.secretCalls().length,0);
 }
});

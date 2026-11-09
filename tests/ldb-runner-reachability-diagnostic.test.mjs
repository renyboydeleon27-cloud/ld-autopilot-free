import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectIsolatedRunnerAnonymousGate as inspect} from '../lib/ldb/runner-reachability-diagnostic.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const TOKEN='safe-cloudflare-api-token-11111111111111';
const API='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT;
const RUNNER='ner-ldb-runner-binding-probe';
const VAULT='ner-ldb-vault-binding-probe';
const URL='https://'+RUNNER+'.test-owner.workers.dev/delivery-bridge-probe';
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
function mock(status=401){
 const calls=[];
 const fetcher=async(url,opts={})=>{
  calls.push({url,opts});
  if(url===URL){
   assert.equal(opts.method,'GET');
   assert.equal(opts.headers.Authorization,undefined);
   return Response.json({status:'none'}, {status});
  }
  assert.equal(opts.headers.Authorization,'Bearer '+TOKEN);
  if(url===API+'/workers/subdomain')
   return Response.json({success:true,result:{subdomain:'test-owner'}});
  if(url===API+'/workers/scripts/'+RUNNER+'/subdomain')
   return Response.json({success:true,result:{enabled:true}});
  if(url===API+'/workers/scripts/'+VAULT+'/subdomain')
   return Response.json({success:true,result:{enabled:false,previews_enabled:false}});
  if(url===API+'/workers/domains?service='+VAULT)
   return Response.json({success:true,result:[],result_info:{
    page:1,count:0,total_count:99,total_pages:4
   }});
  if(url===API+'/workers/scripts/'+RUNNER+'/settings')
   return Response.json({success:true,result:{bindings:runner}});
  if(url===API+'/workers/scripts/'+VAULT+'/settings')
   return Response.json({success:true,result:{bindings:vault}});
  assert.fail('Unexpected URL '+url);
 };
 return {fetcher,calls};
}
test('valid private Vault and reachable owner gate report only anonymous HTTP 401',async()=>{
 const m=mock();
 const out=await inspect({accountId:ACCOUNT,token:TOKEN,fetcher:m.fetcher});
 assert.equal(out.status,'ANONYMOUS_GATE_EXPECTED_401');
 assert.equal(out.runnerHttpStatus,401);
 assert.equal(out.ownerSecretSent,false);
 assert.equal(out.authVerified,false);
 assert.equal(out.productionReady,false);
 assert.equal(m.calls.filter(x=>x.url===URL).length,1);
 assert.ok(!JSON.stringify(out).includes(TOKEN));
 assert.ok(!JSON.stringify(out).includes('test-owner'));
});
test('403, 404, 503 and unexpected anonymous acceptance are never success',async()=>{
 for(const [status,expected] of [
  [403,'RUNNER_ACCESS_FORBIDDEN'],
  [404,'RUNNER_ROUTE_NOT_FOUND'],
  [503,'RUNNER_SETUP_UNAVAILABLE'],
  [200,'UNAUTHENTICATED_ACCESS_UNEXPECTED']
 ]){
  const m=mock(status);
  const out=await inspect({accountId:ACCOUNT,token:TOKEN,fetcher:m.fetcher});
  assert.equal(out.status,expected);
  assert.equal(out.authVerified,false);
 }
});
test('missing Cloudflare credentials refuse network',async()=>{
 let calls=0;
 const out=await inspect({accountId:ACCOUNT,token:'short',fetcher:()=>{calls++;}});
 assert.equal(out.status,'METADATA_NOT_CONFIGURED');
 assert.equal(calls,0);
});

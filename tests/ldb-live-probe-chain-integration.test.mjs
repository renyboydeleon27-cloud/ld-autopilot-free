// End-to-end code-path integration with ONLY fake Cloudflare GET metadata
// and an in-memory service binding. No live auth, network, credentials or Google.
import test from 'node:test';
import assert from 'node:assert/strict';
import {runOwnerReadOnlyBindingPreflight,runOwnerVerifiedBindingProbe,
 safeOwnerBindingEvidence} from '../scripts/ldb-live-binding-probe.mjs';
import {ownerAccessGate} from '../cloudflare/ldb-runner/owner-access.mjs';
import {probeGoogleVaultBinding} from '../cloudflare/ldb-runner/bridge-probe.mjs';
import {routeVaultHealthProbe} from '../cloudflare/ldb-google-vault/bridge-probe.mjs';

const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const API='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT;
const RUNNER='ner-ldb-runner-binding-probe';
const VAULT='ner-ldb-vault-binding-probe';
const URL='https://'+RUNNER+'.ownerzone.workers.dev/delivery-bridge-probe';
const OWNER_SECRET='integration-only-owner-secret-1234567890';
const BRIDGE_SECRET='integration-only-vault-secret-1234567890';
const TOKEN='integration-only-cloudflare-token-123456';
const plain=(name,text)=>({name,type:'plain_text',text});
const runnerBindings=[
 {name:'GOOGLE_VAULT',type:'service',service:VAULT,environment:'production'},
 {name:'LDB_COORDINATOR',type:'durable_object_namespace',class_name:'LdbCoordinator'},
 plain('CLOUDFLARE_ACCOUNT_ID',ACCOUNT),plain('RUNNER_ENABLED','false'),
 plain('FREE_PLAN_CONFIRMED','false'),plain('DELIVERY_BRIDGE_ENABLED','false'),
 plain('BRIDGE_PROBE_ENABLED','true')
];
const vaultBindings=[
 {name:'GOOGLE_VAULT',type:'durable_object_namespace',class_name:'LdbGoogleVault'},
 plain('VAULT_ENABLED','false'),plain('DELIVERY_BRIDGE_ENABLED','false'),
 plain('BRIDGE_PROBE_ENABLED','true')
];
function setup({metadataRunner=runnerBindings,ownerSecret=OWNER_SECRET,
 runnerSecret=OWNER_SECRET,runnerProbeFlag='true',
 runnerBridgeSecret=BRIDGE_SECRET,vaultBridgeSecret=BRIDGE_SECRET,
 vaultProbeFlag='true'}={}){
 const calls={metadata:[],external:[],vault:[],do:0,google:0};
 const ownerEnv={CLOUDFLARE_ACCOUNT_ID:ACCOUNT,CLOUDFLARE_API_TOKEN:TOKEN,
  LDB_PROBE_URL:URL,LDB_RUNNER_SECRET:ownerSecret};
 const vaultEnv={BRIDGE_PROBE_ENABLED:vaultProbeFlag,
  GOOGLE_BRIDGE_PROBE_SECRET:vaultBridgeSecret,
  VAULT_ENABLED:'false',DELIVERY_BRIDGE_ENABLED:'false',
  GOOGLE_VAULT:{getByName(){calls.do++;throw Error('DO access forbidden');}}};
 const runnerEnv={RUNNER_ENABLED:'false',FREE_PLAN_CONFIRMED:'false',
  DELIVERY_BRIDGE_ENABLED:'false',BRIDGE_PROBE_ENABLED:runnerProbeFlag,
  RUNNER_SECRET:runnerSecret,GOOGLE_BRIDGE_PROBE_SECRET:runnerBridgeSecret,
  GOOGLE_VAULT:{fetch(url,options){
   calls.vault.push({url,options});
   return routeVaultHealthProbe(new Request(url,options),vaultEnv);
  }},
  LDB_COORDINATOR:{getByName(){calls.do++;throw Error('DO access forbidden');}}};
 const fetcher=async(url,options={})=>{
  if(url===URL){
   calls.external.push({url,options});
   const request=new Request(url,options);
   const denied=ownerAccessGate(request,runnerEnv);
   if(denied)return denied;
   if(request.method!=='GET')throw Error('Unexpected method');
   try{
    const result=await probeGoogleVaultBinding(runnerEnv,
     request.headers.get('X-LDB-Probe-Nonce'));
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
   }catch{
    return Response.json({status:'BRIDGE_PROBE_UNAVAILABLE',
     productionReady:false},{status:503,headers:{'Cache-Control':'no-store'}});
   }
  }
  calls.metadata.push({url,options});
  assert.equal(options.method,'GET');
  assert.equal(options.redirect,'error');
  assert.equal(options.headers.Authorization,'Bearer '+TOKEN);
  if(url===API+'/workers/subdomain')
   return Response.json({success:true,result:{subdomain:'ownerzone'}});
  if(url===API+'/workers/scripts/'+RUNNER+'/subdomain')
   return Response.json({success:true,result:{enabled:true}});
  if(url===API+'/workers/scripts/'+RUNNER+'/settings')
   return Response.json({success:true,result:{bindings:metadataRunner}});
  if(url===API+'/workers/scripts/'+VAULT+'/settings')
   return Response.json({success:true,result:{bindings:vaultBindings}});
  throw Error('Unexpected Cloudflare API endpoint');
 };
 return {calls,ownerEnv,fetcher};
}

test('full owner → Runner → Vault nonce echo passes only isolated read-only path',async()=>{
 const harness=setup();
 const {calls,ownerEnv,fetcher}=harness;
 const result=await runOwnerVerifiedBindingProbe({env:ownerEnv,fetcher});
 assert.equal(result.status,'BRIDGE_AUTHENTICATED');
 assert.equal(result.productionReady,false);
 assert.equal(calls.metadata.length,4);
 assert.equal(calls.external.length,1);
 assert.equal(calls.vault.length,1);
 assert.equal(calls.vault[0].url,'https://ldb-vault.internal/internal/bridge/health');
 const outerNonce=calls.external[0].options.headers['X-LDB-Probe-Nonce'];
 const innerNonce=calls.vault[0].options.headers['X-LDB-Probe-Nonce'];
 assert.match(outerNonce,/^[a-f0-9]{32}$/);
 assert.equal(innerNonce,outerNonce);
 assert.equal(calls.vault[0].options.method,'GET');
 assert.equal(calls.vault[0].options.redirect,'manual');
 assert.equal(calls.do,0);
 assert.equal(calls.google,0);
 const evidence=safeOwnerBindingEvidence({mode:'authenticated',result});
 assert.equal(evidence.bindingAuthenticationVerified,true);
 assert.equal(evidence.productionReady,false);
 assert.equal(evidence.googleConnectionVerified,false);
 for(const confidential of [OWNER_SECRET,BRIDGE_SECRET,TOKEN,outerNonce,URL])
  assert.ok(!JSON.stringify(evidence).includes(confidential));
});

test('metadata-only preflight cannot execute the Runner or Vault path',async()=>{
 const {calls,ownerEnv,fetcher}=setup();
 const result=await runOwnerReadOnlyBindingPreflight({env:ownerEnv,fetcher});
 assert.equal(result.authenticationVerified,false);
 assert.equal(calls.metadata.length,4);
 assert.equal(calls.external.length,0);
 assert.equal(calls.vault.length,0);
 assert.equal(calls.do,0);
 assert.equal(safeOwnerBindingEvidence({mode:'preflight',result})
  .bindingAuthenticationVerified,false);
});

test('wrong Vault shared secret, disabled Vault, and mismatched Runner secret fail closed',async()=>{
 for(const options of [
  {vaultBridgeSecret:'integration-only-wrong-secret-123456789'},
  {vaultProbeFlag:'false'},
  {runnerBridgeSecret:'integration-only-wrong-secret-987654321'},
  {runnerSecret:'integration-only-wrong-owner-secret-12345'},
  {runnerProbeFlag:'false'}
 ]){
  const {calls,ownerEnv,fetcher}=setup(options);
  await assert.rejects(runOwnerVerifiedBindingProbe({env:ownerEnv,fetcher}));
  assert.equal(calls.metadata.length,4);
  assert.equal(calls.external.length,1);
  assert.equal(calls.do,0);
  assert.equal(calls.google,0);
  if(options.runnerProbeFlag==='false'||options.runnerSecret)
   assert.equal(calls.vault.length,0);
  else assert.equal(calls.vault.length,1);
 }
});

test('wrong metadata service binding fails before sending any owner secret to Worker',async()=>{
 const metadataRunner=runnerBindings.map(x=>x.name==='GOOGLE_VAULT'?
  {...x,service:'ner-ldb-google-vault-quality'}:x);
 const {calls,ownerEnv,fetcher}=setup({metadataRunner});
 await assert.rejects(runOwnerVerifiedBindingProbe({env:ownerEnv,fetcher}),
  /PROBE_DEPLOYED_SETTINGS_NOT_SAFE/);
 assert.equal(calls.metadata.length,2);
 assert.equal(calls.external.length,0);
 assert.equal(calls.vault.length,0);
});

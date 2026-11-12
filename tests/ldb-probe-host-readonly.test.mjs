import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLdbProbeHost} from '../lib/ldb/probe-host-readonly.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const TOKEN='mock-account-api-token-long-enough-for-testing';
const base='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT;
function fixture({domain='owner-zone',enabled=true,accountStatus=200,
 scriptStatus=200,extra='private_DO_NOT_LEAK'}={}){
 const calls=[];
 const fetcher=async(url,opts)=>{
  calls.push({url,opts});
  assert.equal(opts.method,'GET');
  assert.equal(opts.redirect,'error');
  assert.equal(opts.headers.Authorization,'Bearer '+TOKEN);
  assert.ok([base+'/workers/subdomain',
   base+'/workers/scripts/ner-ldb-runner-binding-probe/subdomain'].includes(url));
  if(url===base+'/workers/subdomain')
   return Response.json({success:true,result:{subdomain:domain,extra}},
    {status:accountStatus});
  return Response.json({success:true,result:{enabled,secretText:extra}},
   {status:scriptStatus});
 };
 return {fetcher,calls};
}
test('two fixed Cloudflare GETs verify account domain and isolated Worker publishing, not authentication',async()=>{
 const f=fixture();
 const result=await inspectLdbProbeHost({accountId:ACCOUNT,token:TOKEN,fetcher:f.fetcher});
 assert.equal(result.status,'PROBE_HOST_METADATA_READY');
 assert.equal(result.accountReadHttpStatus,200);
 assert.equal(result.scriptReadHttpStatus,200);
 assert.equal(result.accountSubdomainValid,true);
 assert.equal(result.runnerWorkersDevEnabled,true);
 assert.equal(result.accountHostMetadataVerified,true);
 for(const key of ['authenticatedProbeCalled','ownerSecretSent',
  'productionReady','workerModified','googleApiCalled','gmailApiCalled','inferenceCalled'])
  assert.equal(result[key],false);
 assert.equal(f.calls.length,2);
 assert.ok(!JSON.stringify(result).includes(TOKEN));
 assert.ok(!JSON.stringify(result).includes('owner-zone'));
 assert.ok(!JSON.stringify(result).includes('private_DO_NOT_LEAK'));
});
test('disabled, inaccessible, malformed or oversized account metadata fails closed',async()=>{
 for(const f of [
  fixture({enabled:false}),
  fixture({accountStatus:403}),
  fixture({scriptStatus:404}),
  fixture({domain:'attacker.example'}),
  fixture({domain:'bad'.repeat(30)})
 ]){
  const result=await inspectLdbProbeHost({accountId:ACCOUNT,token:TOKEN,fetcher:f.fetcher});
  assert.equal(result.status,'PROBE_HOST_METADATA_NOT_VERIFIED');
  assert.equal(result.accountHostMetadataVerified,false);
  assert.equal(result.ownerSecretSent,false);
  assert.equal(f.calls.length,2);
 }
 const f=fixture();
 const original=f.fetcher;
 f.fetcher=(url,opts)=>url===base+'/workers/subdomain'?
  Response.json({success:true,result:{subdomain:'owner-zone',
   filler:'SECRET'.repeat(2000)}}):original(url,opts);
 const result=await inspectLdbProbeHost({accountId:ACCOUNT,token:TOKEN,fetcher:f.fetcher});
 assert.equal(result.accountHostMetadataVerified,false);
 assert.ok(!JSON.stringify(result).includes('SECRET'));
});
test('invalid account/token refuse network entirely',async()=>{
 let called=0;const fetcher=()=>{called++;throw Error('unexpected network')};
 await assert.rejects(inspectLdbProbeHost({accountId:'attacker',token:TOKEN,fetcher}),
  /PROBE_HOST_METADATA_CONFIGURATION_REQUIRED/);
 await assert.rejects(inspectLdbProbeHost({accountId:ACCOUNT,token:'short',fetcher}),
  /PROBE_HOST_METADATA_CONFIGURATION_REQUIRED/);
 assert.equal(called,0);
});

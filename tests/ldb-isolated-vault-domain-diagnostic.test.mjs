import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectIsolatedVaultDomainDiagnostic as inspect} from
 '../lib/ldb/isolated-vault-domain-diagnostic.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const TOKEN='test-only-readonly-cloudflare-token-xyz';
function fixture({status=200,result=[],info={
 page:1,total_pages:1,total_count:0,count:0
 },success=true}={}){
 const calls=[];
 return {calls,fetcher:async(url,opts)=>{
  calls.push({url,opts});
  return Response.json({success,result,result_info:info,
   token:'never-expose-this',hostname:'never-expose-host'},
   {status});
 }};
}
test('read-only isolated Vault domain diagnostic never calls Workers or exposes secrets',async()=>{
 const f=fixture(),out=await inspect({accountId:ACCOUNT,token:TOKEN,fetcher:f.fetcher});
 assert.equal(out.status,'ISOLATED_VAULT_CUSTOM_DOMAIN_CHECK_PASSED');
 assert.equal(out.httpStatus,200);
 assert.equal(out.secretRead,false);
 assert.equal(out.runnerInvoked,false);
 assert.equal(out.workerModified,false);
 assert.equal(f.calls.length,1);
 assert.match(f.calls[0].url,/\/workers\/domains\?service=ner-ldb-vault-binding-probe$/);
 assert.equal(f.calls[0].opts.method,'GET');
 assert.equal(f.calls[0].opts.redirect,'error');
 assert.ok(!JSON.stringify(out).includes(TOKEN));
 assert.ok(!JSON.stringify(out).includes('never-expose'));
});
test('read permission and unsafe domain row return sanitized blockers',async()=>{
 for(const status of [401,403]){
  const f=fixture({status});
  const out=await inspect({accountId:ACCOUNT,token:TOKEN,fetcher:f.fetcher});
  assert.equal(out.status,'DOMAIN_READ_PERMISSION_DENIED');
  assert.equal(out.httpStatus,status);
 }
 const f=fixture({result:[{hostname:'secret.example.test'}],info:{
 page:1,total_pages:1,total_count:1,count:1
 }});
 const out=await inspect({accountId:ACCOUNT,token:TOKEN,fetcher:f.fetcher});
 assert.equal(out.status,'CUSTOM_DOMAIN_ROW_RETURNED');
 assert.ok(!JSON.stringify(out).includes('example.test'));
});
test('empty row with missing pagination or count is not claimed safe',async()=>{
 for(const info of [{}, {page:1,total_pages:0},{page:1,total_pages:2,total_count:0,count:0},
  {page:2,total_pages:1,total_count:0,count:0},
  {page:1,total_pages:1,total_count:0,count:1}]){
  const f=fixture({info});
  const out=await inspect({accountId:ACCOUNT,token:TOKEN,fetcher:f.fetcher});
  assert.equal(out.status,'EMPTY_RESULT_PAGINATION_NOT_VERIFIED');
 }
});
test('reject wrong account/token before network',async()=>{
 let called=0;
 const fetcher=()=>{called++;throw Error('unexpected')};
 const out=await inspect({accountId:'not-owner',token:TOKEN,fetcher});
 assert.equal(out.status,'NOT_CONFIGURED');assert.equal(called,0);
});

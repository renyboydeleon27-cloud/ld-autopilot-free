import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/ldb-delivery-readiness.js';
async function request({method='GET',url='/api/ldb-delivery-readiness',mode='preview',branch='feature/ldb-hook-v5-cloud-executor'}={}){
 const before={...process.env},originalFetch=globalThis.fetch;
 try{
  Object.assign(process.env,{VERCEL_ENV:mode,VERCEL_GIT_COMMIT_REF:branch,
   CLOUDFLARE_ACCOUNT_ID:'present-account',CLOUDFLARE_API_TOKEN:'never-return-this-token',
   LDB_GOOGLE_CLIENT_SECRET:'never-return-google-secret'});
  globalThis.fetch=async()=>assert.fail('No provider call is allowed on executor preview');
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;}};
  await handler({method,url,headers:{'x-ldb-owner-test':'1'}},res);return res;
 }finally{
  for(const k of Object.keys(process.env))if(!(k in before))delete process.env[k];
  Object.assign(process.env,before);globalThis.fetch=originalFetch;
 }
}
test('executor preview returns local config only even with provider credentials configured',async()=>{
 const r=await request();assert.equal(r.code,200);
 assert.equal(r.body.diagnosticMode,'LOCAL_CONFIGURATION_ONLY');assert.equal(r.body.cloudflareApiCalled,false);
 assert.equal(r.body.productionReady,false);assert.equal(r.body.driveFilesVerified,0);assert.equal(r.body.gmailMilestonesVerified,0);
 assert.equal(r.body.cloudflareExecutionStatus,'OWNER AUTHENTICATION / TOKEN VALIDATION REQUIRED');
 assert.doesNotMatch(JSON.stringify(r.body),/never-return|present-account/);
 assert.match(r.headers['Cache-Control'],/no-store/);
});
test('executor preview rejects owner probe and other mutation methods before provider access',async()=>{
 for(const method of ['POST','PUT','DELETE','PATCH'])assert.equal((await request({method})).code,405);
});
test('configuration-only route rejects query strings, production and unrelated branches',async()=>{
 assert.equal((await request({url:'/api/ldb-delivery-readiness?token=private'})).code,400);
 assert.equal((await request({mode:'production'})).code,404);
 assert.equal((await request({branch:'main'})).code,404);
});

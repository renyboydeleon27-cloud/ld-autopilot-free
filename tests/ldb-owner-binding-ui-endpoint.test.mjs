import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const handler=require('../lib/ldb/owner-binding-probe.cjs');
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const BASE='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT;
const PROBE='ner-ldb-runner-binding-probe';
const VAULT='ner-ldb-vault-binding-probe';
const URL='https://'+PROBE+'.ownerzone.workers.dev/delivery-bridge-probe';
const SECRET='phone-owner-password-0123456789ABCDEFG';
const TOKEN='cloudflare-readonly-token-for-fixture-123';
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
function request({method='POST',secret=SECRET,origin='https://my-preview.vercel.app',
 host='my-preview.vercel.app',url='/api/ldb-delivery-readiness',extra={}}={}){
 return {method,url,headers:{host,origin,'sec-fetch-site':'same-origin',
  'content-type':'application/json',...extra},body:{secret}};
}
function responder(){
 const headers={};
 return {headers,setHeader(k,v){headers[k]=v;},
  status(k){this.code=k;return this;},
  json(x){this.body=x;return this;}};
}
function mock({wrongSecret=false,unsafeVault=false,wrongTarget=false}={}){
 const calls=[];
 const fetcher=async(url,opts={})=>{
  calls.push({url,opts});
  if(url===URL){
   assert.equal(opts.method,'GET');
   assert.equal(opts.headers.Authorization,'Bearer '+SECRET);
   assert.match(opts.headers['X-LDB-Probe-Nonce'],/^[a-f0-9]{32}$/);
   if(wrongSecret)return Response.json({status:'UNAUTHORIZED'},{status:401});
   return Response.json({status:'BRIDGE_AUTHENTICATED',productionReady:false,
    nonce:opts.headers['X-LDB-Probe-Nonce']},
    {headers:{'Cache-Control':'no-store'}});
  }
  assert.equal(opts.method,'GET');
  assert.equal(opts.redirect,'error');
  assert.equal(opts.headers.Authorization,'Bearer '+TOKEN);
  if(url===BASE+'/workers/subdomain')
   return Response.json({success:true,result:{subdomain:'ownerzone'}});
  if(url===BASE+'/workers/scripts/'+PROBE+'/subdomain')
   return Response.json({success:true,result:{enabled:true}});
  if(url===BASE+'/workers/scripts/'+VAULT+'/subdomain')
   return Response.json({success:true,result:{enabled:false,previews_enabled:false}});
  if(url===BASE+'/workers/domains?service='+VAULT)
   return Response.json({success:true,result:unsafeVault?[{service:VAULT}]:[],
    result_info:{page:1,total_pages:1,count:unsafeVault?1:0,total_count:unsafeVault?1:0}});
  if(url===BASE+'/workers/scripts/'+PROBE+'/settings')
   return Response.json({success:true,result:{bindings:wrongTarget?
    runner.map(x=>x.name==='GOOGLE_VAULT'?{...x,service:'other'}:x):runner}});
  if(url===BASE+'/workers/scripts/'+VAULT+'/settings')
   return Response.json({success:true,result:{bindings:vault}});
  assert.fail('unexpected URL '+url);
 };
 return {fetcher,calls};
}
async function withEnv(run,{fetcher}={}){
 const old={...process.env};
 const saved=globalThis.fetch;
 process.env.VERCEL_ENV='preview';
 process.env.VERCEL_GIT_COMMIT_REF='feature/ldb-image-acceptance';
 process.env.CLOUDFLARE_ACCOUNT_ID=ACCOUNT;
 process.env.CLOUDFLARE_API_TOKEN=TOKEN;
 globalThis.fetch=fetcher||(()=>assert.fail('unexpected network'));
 try{return await run();}
 finally{
  process.env=old;
  globalThis.fetch=saved;
 }
}
test('one-tap protected preview authenticates only the owned Runner and never claims production',async()=>{
 const f=mock();
 await withEnv(async()=>{
  const res=responder();
  await handler(request(),res);
  assert.equal(res.code,200);
  assert.deepEqual(res.body,{status:'BRIDGE_AUTHENTICATED',authenticationVerified:true,
   productionReady:false,googleApiCalled:false,gmailApiCalled:false,inferenceCalled:false});
  assert.equal(res.headers['Cache-Control'],'private, no-store, max-age=0');
  const sent=f.calls.filter(x=>x.url===URL);
  assert.equal(sent.length,1);
  assert.equal(f.calls.filter(x=>x.url.includes('googleapis')).length,0);
  assert.equal(JSON.stringify(res.body).includes(SECRET),false);
  assert.equal(JSON.stringify(res.body).includes(TOKEN),false);
  assert.equal(JSON.stringify(res.body).includes('ownerzone'),false);
 },{fetcher:f.fetcher});
});
test('wrong Runner secret fails without claiming verified',async()=>{
 const f=mock({wrongSecret:true});
 await withEnv(async()=>{
  const res=responder();await handler(request(),res);
  assert.equal(res.code,401);
  assert.equal(res.body.status,'RUNNER_AUTH_NOT_VERIFIED');
  assert.equal(res.body.authenticationVerified,false);
  assert.equal(f.calls.filter(x=>x.url===URL).length,1);
 },{fetcher:f.fetcher});
});
test('unsafe Vault or wrong service target blocks before sending owner secret',async()=>{
 for(const options of [{unsafeVault:true},{wrongTarget:true}]){
  const f=mock(options);
  await withEnv(async()=>{
   const res=responder();await handler(request(),res);
   assert.equal(res.code,503);
   assert.equal(res.body.authenticationVerified,false);
   assert.equal(f.calls.filter(x=>x.url===URL).length,0);
  },{fetcher:f.fetcher});
 }
});
test('production, GET, cross-site, query params and bad inputs refuse requests without network',async()=>{
 const cases=[
  {method:'GET'},{origin:'https://evil.example'},
  {host:'hostile.example',origin:'https://hostile.example'},
  {url:'/api/ldb-delivery-readiness?url=evil.example'},
  {secret:'short'},
  {extra:{'content-type':'text/plain'}},
  {extra:{'sec-fetch-site':'cross-site'}}
 ];
 for(const c of cases)await withEnv(async()=>{
  const res=responder();await handler(request(c),res);
  assert.notEqual(res.code,200);
  assert.equal(res.body.authenticationVerified,false);
 });
 await withEnv(async()=>{
  process.env.VERCEL_ENV='production';
  const res=responder();await handler(request(),res);
  assert.equal(res.code,404);
  assert.equal(res.body.status,'PREVIEW_ONLY');
 });
});

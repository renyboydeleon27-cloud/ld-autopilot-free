import test from 'node:test';
import assert from 'node:assert/strict';
import {probeGoogleVaultBinding} from '../cloudflare/ldb-runner/bridge-probe.mjs';
import {handleVaultBridgeHealth} from '../cloudflare/ldb-google-vault/bridge-probe.mjs';

// Isolated test-only credentials and challenges; no API or OAuth credentials.
const SECRET='isolated-test-only-shared-secret-1234567890';
const NONCE='0123456789abcdef0123456789abcdef';
const VAULT_URL='https://ldb-vault.internal/internal/bridge/health';
const mkRequest=(nonce,secret=SECRET,method='GET')=>new Request(VAULT_URL,{
 method,headers:{Authorization:'Bearer '+secret,
  ...(nonce===undefined?{}:{'X-LDB-Probe-Nonce':nonce})}
});
const vault=(nonce,secret=SECRET)=>handleVaultBridgeHealth(
 mkRequest(nonce,secret),{enabled:true,secret:SECRET}
);

test('isolated Vault health echoes only authenticated 128-bit nonce without Google calls',async()=>{
 const response=vault(NONCE);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.deepEqual(await response.json(),{status:'BRIDGE_AUTHENTICATED',nonce:NONCE});
});

test('isolated Vault refuses missing, malformed, or unauthenticated challenge',async()=>{
 for(const bad of [undefined,'','123','G'.repeat(32),'f'.repeat(31),'f'.repeat(33)]){
  const response=vault(bad);
  assert.equal(response.status,400);
  assert.deepEqual(await response.json(),{status:'INVALID_PROBE_NONCE'});
 }
 for(const secret of ['wrong','']){
  const response=vault(NONCE,secret);
  assert.equal(response.status,401);
 }
 const post=handleVaultBridgeHealth(mkRequest(NONCE,SECRET,'POST'),
  {enabled:true,secret:SECRET});
 assert.equal(post.status,405);
 const disabled=handleVaultBridgeHealth(mkRequest(NONCE),
  {enabled:false,secret:SECRET});
 assert.equal(disabled.status,503);
});

test('Runner accepts fresh Vault echo through only the isolated service binding',async()=>{
 let calls=0;
 const env={BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:SECRET,
  GOOGLE_VAULT:{fetch:(url,init)=>{
   calls++;
   assert.equal(url,VAULT_URL);
   assert.equal(init.method,'GET');
   assert.equal(init.redirect,'manual');
   assert.equal(init.headers['X-LDB-Probe-Nonce'],NONCE);
   assert.equal(init.headers.Authorization,'Bearer '+SECRET);
   assert.equal(init.headers.Accept,'application/json');
   assert.ok(init.signal instanceof AbortSignal);
   assert.equal(init.signal.aborted,false);
   return handleVaultBridgeHealth(new Request(url,init),
    {enabled:true,secret:SECRET});
  }}};
 assert.deepEqual(await probeGoogleVaultBinding(env,NONCE),
  {status:'BRIDGE_AUTHENTICATED',productionReady:false,nonce:NONCE});
 assert.equal(calls,1);
 await assert.rejects(probeGoogleVaultBinding(env,undefined),/BRIDGE_PROBE_UNAVAILABLE/);
 assert.equal(calls,1,'invalid challenge must never invoke Vault');
});

test('Runner rejects replayed, missing or modified Vault evidence',async()=>{
 for(const body of [
  {status:'BRIDGE_AUTHENTICATED'},
  {status:'BRIDGE_AUTHENTICATED',nonce:'f'.repeat(32)},
  {status:'BRIDGE_AUTHENTICATED',nonce:NONCE,secret:'hidden'},
  {status:'BRIDGE_AUTHENTICATED',nonce:NONCE,productionReady:true},
  {status:'NOT_AUTHENTICATED',nonce:NONCE}
 ]){
  const env={BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:SECRET,
   GOOGLE_VAULT:{fetch:async()=>Response.json(body)}};
  await assert.rejects(probeGoogleVaultBinding(env,NONCE),/BRIDGE_PROBE_UNAVAILABLE/);
 }
});

test('Runner accepts only bounded non-cacheable JSON from the Vault health service',async()=>{
 const confirmed={status:'BRIDGE_AUTHENTICATED',nonce:NONCE};
 const cases=[
  Response.json(confirmed), // no Cache-Control: no-store
  Response.json(confirmed,{headers:{'Cache-Control':'public, max-age=3600'}}),
  new Response(JSON.stringify(confirmed),{headers:{
   'Content-Type':'text/html','Cache-Control':'no-store'}}),
  Response.json({...confirmed,padding:'X'.repeat(2048)},
   {headers:{'Cache-Control':'no-store'}}),
  new Response('not-json',{headers:{
   'Content-Type':'application/json','Cache-Control':'no-store'}}),
  Response.json({...confirmed,token:'private-should-not-appear'},
   {headers:{'Cache-Control':'no-store'}}),
  Response.json({...confirmed,nonce:'f'.repeat(32)},
   {headers:{'Cache-Control':'no-store'}})
 ];
 let requests=0;
 for(const response of cases){
  const env={BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:SECRET,
   GOOGLE_VAULT:{fetch:async()=>{requests++;return response;}}};
  await assert.rejects(probeGoogleVaultBinding(env,NONCE),/BRIDGE_PROBE_UNAVAILABLE/);
 }
 assert.equal(requests,cases.length);
});

test('Runner accepts a properly labeled no-store JSON acknowledgment within the byte limit',async()=>{
 const env={BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:SECRET,
  GOOGLE_VAULT:{fetch:async()=>Response.json(
   {status:'BRIDGE_AUTHENTICATED',nonce:NONCE},
   {headers:{'Cache-Control':'no-store, private',
    'Content-Type':'application/json; charset=utf-8'}})}};
 const result=await probeGoogleVaultBinding(env,NONCE);
 assert.deepEqual(result,{status:'BRIDGE_AUTHENTICATED',productionReady:false,nonce:NONCE});
 assert.equal(Object.keys(result).length,3);
});

test('Runner health diagnostic fails closed when internal service transport rejects or aborts',async()=>{
 const reasons=[new Error('SERVICE_BINDING_UNAVAILABLE'),
  Object.assign(new Error('request interrupted'),{name:'AbortError'}),
  Object.assign(new Error('request expired'),{name:'TimeoutError'})];
 let attempts=0;
 for(const reason of reasons){
  const env={BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:SECRET,
   GOOGLE_VAULT:{fetch:async(_url,init)=>{
    attempts++;
    assert.equal(init.method,'GET');
    assert.equal(init.redirect,'manual');
    assert.equal(init.headers.Accept,'application/json');
    assert.ok(init.signal instanceof AbortSignal);
    throw reason;
   }}};
  await assert.rejects(probeGoogleVaultBinding(env,NONCE),
   error=>error.message==='BRIDGE_PROBE_UNAVAILABLE');
 }
 assert.equal(attempts,reasons.length);
});

test('Runner health diagnostic rejects redirect or unavailable response without reading a body',async()=>{
 for(const status of [301,302,401,403,429,500,503]){
  let read=false;
  const env={BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:SECRET,
   GOOGLE_VAULT:{fetch:async()=>({
    status,headers:new Headers({'Content-Type':'application/json',
     'Cache-Control':'no-store'}),
    body:{getReader(){read=true;throw Error('should not read');}}
   })}};
  await assert.rejects(probeGoogleVaultBinding(env,NONCE),/BRIDGE_PROBE_UNAVAILABLE/);
  assert.equal(read,false);
 }
});

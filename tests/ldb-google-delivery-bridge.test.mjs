import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createGoogleDeliveryBridge} from '../cloudflare/ldb-runner/google-delivery-bridge.mjs';
import {handleVaultDeliveryBridge,isDeliveryBridgePath} from '../cloudflare/ldb-google-vault/delivery-bridge.mjs';
const SECRET='test-separate-bridge-secret-long-enough-12345';
const sha=b=>createHash('sha256').update(b).digest('hex');
const base={key:'a'.repeat(64),name:'HOOK.txt',mimeType:'text/plain',parentId:'folder-123',bytes:Buffer.from('sample recovered text')};
function setup(){
 const uploaded=new Map();let calls=0;
 const createBackend=()=>({capacity:async()=>({unlimited:false,remaining:'10000000'}),drive:{put:async a=>{
  calls++;
  const previous=uploaded.get(a.key);
  if(previous){assert.equal(sha(a.bytes),previous.sha);return {id:previous.id,status:'VERIFIED',sha256:previous.sha};}
  const saved={id:'googlefile'+calls,sha:a.bytes?sha(a.bytes):null};uploaded.set(a.key,saved);
  return {id:saved.id,status:'VERIFIED',sha256:saved.sha};
 }}});
 const service={fetch:async(url,options)=>handleVaultDeliveryBridge(new Request(url,options),{enabled:true,secret:SECRET,createBackend})};
 const env={DELIVERY_BRIDGE_ENABLED:'true',GOOGLE_DELIVERY_BRIDGE_SECRET:SECRET,GOOGLE_VAULT:service};
 return {env,service,uploaded,get calls(){return calls;}};
}
test('client is fail closed until dedicated service binding, enable flag and secret are configured',async()=>{
 const f=setup();
 for(const env of [{...f.env,DELIVERY_BRIDGE_ENABLED:'false'},{...f.env,GOOGLE_VAULT:null},{...f.env,GOOGLE_DELIVERY_BRIDGE_SECRET:'short'}])
  assert.throws(()=>createGoogleDeliveryBridge(env),/DELIVERY_BRIDGE_UNAVAILABLE/);
 assert.equal(isDeliveryBridgePath('/internal/drive/put'),true);
 assert.equal(isDeliveryBridgePath('/internal/credentials'),false);
});
test('authenticated service-bound request delivers hashed bytes and capacity without tokens',async()=>{
 const f=setup(),bridge=createGoogleDeliveryBridge(f.env);
 assert.deepEqual(await bridge.capacity(),{unlimited:false,remaining:'10000000'});
 const result=await bridge.drive.put(base);
 assert.deepEqual(result,{status:'VERIFIED',id:'googlefile1',sha256:sha(base.bytes),bytes:base.bytes.length});
 const again=await bridge.drive.put(base);
 assert.deepEqual(again,result);
 assert.equal(f.uploaded.size,1);
 const folder=await bridge.drive.put({key:'b'.repeat(64),name:'Living Disaster Book',mimeType:'application/vnd.google-apps.folder'});
 assert.equal(folder.status,'VERIFIED');assert.equal(folder.sha256,null);
 assert.equal(f.uploaded.size,2);
 assert.ok(!JSON.stringify(result).includes(SECRET));
});
test('bridge never accepts unauthenticated or mismatched service secret',async()=>{
 const f=setup();
 const r=await f.service.fetch('https://ldb-vault.internal/internal/drive/capacity',{method:'GET'});
 assert.equal(r.status,401);assert.equal(f.calls,0);
 const disabled=await handleVaultDeliveryBridge(new Request('https://vault/internal/drive/capacity',{headers:{Authorization:'Bearer '+SECRET}}),{enabled:false,secret:SECRET,createBackend:()=>{throw Error('must not create')}});
 assert.equal(disabled.status,503);
 const forged=createGoogleDeliveryBridge({...f.env,GOOGLE_DELIVERY_BRIDGE_SECRET:'wrong-bridge-secret-but-long-enough-000'});
 await assert.rejects(forged.drive.put(base),/DELIVERY_BRIDGE_UNAVAILABLE/);
 assert.equal(f.calls,0);
});
test('bad digest, missing payload, wrong MIME and unknown metadata fail before Drive',async()=>{
 const f=setup();const header='Bearer '+SECRET;
 const meta=(props={})=>Buffer.from(JSON.stringify({key:base.key,name:base.name,parentId:base.parentId,mimeType:base.mimeType,bytes:base.bytes.length,sha256:sha(base.bytes),...props})).toString('base64url');
 const url='https://vault/internal/drive/put';
 for(const options of [
  {method:'POST',headers:{Authorization:header,'X-LDB-Asset-Info':meta({sha256:'b'.repeat(64)}),'Content-Type':'application/octet-stream'},body:base.bytes},
  {method:'POST',headers:{Authorization:header,'X-LDB-Asset-Info':meta(),'Content-Type':'application/octet-stream'}},
  {method:'POST',headers:{Authorization:header,'X-LDB-Asset-Info':meta(),'Content-Type':'text/plain'},body:base.bytes},
  {method:'POST',headers:{Authorization:header,'X-LDB-Asset-Info':meta({approvalVerified:true}),'Content-Type':'application/octet-stream'},body:base.bytes}
 ]){
  const res=await f.service.fetch(url,options);assert.ok([422,415,502].includes(res.status));
 }
 assert.equal(f.calls,0);
});
test('never provides extra endpoints, browser flags or overlarge asset bytes',async()=>{
 const f=setup(),bridge=createGoogleDeliveryBridge(f.env);
 for(const bad of [{...base,mimeType:'application/javascript'},{...base,key:'wrong'},{...base,bytes:Buffer.alloc(8_000_001)},{...base,name:'../bad.txt'}])
  await assert.rejects(bridge.drive.put(bad),/DELIVERY_BRIDGE_UNAVAILABLE/);
 const res=await f.service.fetch('https://vault/internal/drive/gmail',{method:'POST',headers:{Authorization:'Bearer '+SECRET}});
 assert.equal(res.status,404);assert.equal(f.calls,0);
});
import {probeGoogleVaultBinding} from '../cloudflare/ldb-runner/bridge-probe.mjs';
import {handleVaultBridgeHealth,isBridgeHealthPath,routeVaultHealthProbe} from '../cloudflare/ldb-google-vault/bridge-probe.mjs';
const PSECRET='independent-test-probe-secret-very-long-2026';
function diagnosticFixture(){
 let requests=0;
 const backend={fetch:async(url,options)=>{requests++;return handleVaultBridgeHealth(new Request(url,options),{enabled:true,secret:PSECRET});}};
 const env={BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:PSECRET,GOOGLE_VAULT:backend,DELIVERY_BRIDGE_ENABLED:'false'};
 return {env,get requests(){return requests;}};
}
test('read-only binding probe succeeds while real delivery remains OFF',async()=>{
 const f=diagnosticFixture();
 assert.deepEqual(await probeGoogleVaultBinding(f.env),{status:'BRIDGE_AUTHENTICATED',productionReady:false});
 assert.equal(f.requests,1);
 assert.equal(f.env.DELIVERY_BRIDGE_ENABLED,'false');
 assert.equal(isBridgeHealthPath('/internal/bridge/health'),true);
 assert.equal(isDeliveryBridgePath('/internal/bridge/health'),false);
});
test('probe requires its own flag, secret and service binding',async()=>{
 const f=diagnosticFixture();
 for(const env of [{...f.env,BRIDGE_PROBE_ENABLED:'false'},{...f.env,GOOGLE_BRIDGE_PROBE_SECRET:'too-short'},{...f.env,GOOGLE_VAULT:null}]){
  await assert.rejects(probeGoogleVaultBinding(env),/BRIDGE_PROBE_UNAVAILABLE/);
 }
 assert.equal(f.requests,0);
});
test('probe rejects wrong secret, POST and unrelated routes with no Google operations',async()=>{
 const f=diagnosticFixture();
 await assert.rejects(probeGoogleVaultBinding({...f.env,GOOGLE_BRIDGE_PROBE_SECRET:'wrong-separate-probe-secret-very-long'}),/BRIDGE_PROBE_UNAVAILABLE/);
 const url='https://internal/internal/bridge/health',header={Authorization:'Bearer '+PSECRET};
 assert.equal((await handleVaultBridgeHealth(new Request(url,{method:'POST',headers:header}),{enabled:true,secret:PSECRET})).status,405);
 assert.equal((await handleVaultBridgeHealth(new Request(url,{method:'GET',headers:header}),{enabled:false,secret:PSECRET})).status,503);
 assert.equal((await handleVaultBridgeHealth(new Request('https://internal/internal/drive/put',{headers:header}),{enabled:true,secret:PSECRET})).status,404);
 assert.equal(f.requests,1);
});
test('probe refuses invalid vault response and never returns a secret',async()=>{
 const f=diagnosticFixture();
 for(const response of [new Response(JSON.stringify({status:'BRIDGE_AUTHENTICATED',refreshToken:'SHOULD_NOT_LEAK'}),{status:200}),new Response('{}',{status:200}),new Response('bad',{status:500})]){
  await assert.rejects(probeGoogleVaultBinding({...f.env,GOOGLE_VAULT:{fetch:async()=>response}}),/BRIDGE_PROBE_UNAVAILABLE/);
 }
 assert.ok(!JSON.stringify(await probeGoogleVaultBinding(f.env)).includes(PSECRET));
});

test('live-style Vault edge health route works with ALL production and OAuth credential gates OFF',async()=>{
 let durableObjectCalls=0,driveCalls=0;
 const env={
  VAULT_ENABLED:'false',DELIVERY_BRIDGE_ENABLED:'false',RUNNER_ENABLED:'false',
  BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:PSECRET,
  GOOGLE_VAULT:{getByName:()=>{durableObjectCalls++;throw Error('DO MUST STAY OFF');}},
  GOOGLE_CLIENT_ID:undefined,GOOGLE_CLIENT_SECRET:undefined,VAULT_KEY:undefined,
  VAULT_SECRET:undefined
 };
 const endpoint='https://ldb-vault.internal/internal/bridge/health';
 const serve=async(url,options)=>routeVaultHealthProbe(new Request(url,options),env);
 const result=await probeGoogleVaultBinding({
  BRIDGE_PROBE_ENABLED:'true',GOOGLE_BRIDGE_PROBE_SECRET:PSECRET,
  DELIVERY_BRIDGE_ENABLED:'false',GOOGLE_VAULT:{fetch:serve}
 });
 assert.deepEqual(result,{status:'BRIDGE_AUTHENTICATED',productionReady:false});
 assert.equal(durableObjectCalls,0);
 assert.equal(driveCalls,0);
 assert.equal((await serve(endpoint,{method:'POST',headers:{Authorization:'Bearer '+PSECRET}})).status,405);
 assert.equal((await serve(endpoint,{headers:{Authorization:'Bearer not-the-secret'}})).status,401);
 assert.equal(routeVaultHealthProbe(new Request('https://ldb-vault.internal/capacity'),env),null);
 assert.equal((await routeVaultHealthProbe(new Request(endpoint,{headers:{Authorization:'Bearer '+PSECRET}}),{...env,BRIDGE_PROBE_ENABLED:'false'})).status,503);
 assert.equal((await routeVaultHealthProbe(new Request(endpoint,{headers:{Authorization:'Bearer '+PSECRET}}),{...env,GOOGLE_BRIDGE_PROBE_SECRET:undefined})).status,503);
});
test('Vault edge source routes read-only probe ahead of disabled production credential gate',async()=>{
 const {readFile}=await import('node:fs/promises');
 const worker=await readFile(new URL('../cloudflare/ldb-google-vault/worker.mjs',import.meta.url),'utf8');
 const probe=worker.indexOf('const probe=routeVaultHealthProbe(req,env);');
 const vault=worker.indexOf("if(env.VAULT_ENABLED!=='true'");
 assert.ok(probe>0&&vault>probe,'read-only health check must not require OAuth setup');
 assert.ok(worker.includes('if(probe)return probe;'));
});

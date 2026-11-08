import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {qualityImportGate,handleQualityImport} from '../cloudflare/ldb-runner/quality-import.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const STAGE='stage-test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REVIEW='review-test-secret-bbbbbbbbbbbbbbbbbbbbbbbbbbb';
const RUNNER='runner-test-secret-ccccccccccccccccccccccccbb';
const jobId='d'.repeat(64);
const env=Object.freeze({
 RUNNER_ENABLED:'true',QUALITY_IMPORT_ENABLED:'true',QUALITY_REVIEW_ENABLED:'true',
 DELIVERY_BRIDGE_ENABLED:'true',QUALITY_IMPORT_SECRET:STAGE,QUALITY_REVIEW_SECRET:REVIEW,
 RUNNER_SECRET:RUNNER
});
const req=(route,secret=STAGE,method='POST',data={})=>new Request(
 'https://private-worker.invalid/internal/quality/'+route,
 {method,headers:{Authorization:'Bearer '+secret,...data.headers},...('body'in data?{body:data.body}:{})}
);
async function check(req,settings=env){
 const response=qualityImportGate(req,settings);
 return response?{status:response.status,code:(await response.json()).status}:{status:200};
}
function storageFixture(){
 const map=new Map();
 const originals=ALL_SCENES.map((scene,i)=>{
  const source=Buffer.from('original provider render '+scene);
  return {scene,sha256:sha(source),mimeType:'image/jpeg',bytes:source.length,chunks:1};
 });
 map.set('job',{id:jobId,index:17,status:'IMAGES_READY',stop:false,outputs:originals});
 const tx={
  get:async key=>map.get(key),
  put:async(key,value)=>{map.set(key,structuredClone(value))},
  setAlarm:async()=>{},deleteAlarm:async()=>{}
 };
 return {map,outputs:originals,storage:{get:tx.get,put:tx.put,transaction:async fn=>fn(tx)}};
}
test('image staging secret cannot authorize final review, even with forged PASS body',async()=>{
 assert.deepEqual(await check(req('image',STAGE)),{status:200});
 assert.deepEqual(await check(req('review',STAGE)),{status:401,code:'UNAUTHORIZED'});
 assert.deepEqual(await check(req('review',REVIEW)),{status:200});
 assert.deepEqual(await check(req('image',REVIEW)),{status:401,code:'UNAUTHORIZED'});
});
test('review requires independent reviewer flag, delivery flag, and a distinct credential',async()=>{
 for(const settings of [
  {...env,QUALITY_REVIEW_ENABLED:'false'},
  {...env,DELIVERY_BRIDGE_ENABLED:'false'},
  {...env,QUALITY_REVIEW_SECRET:STAGE},
  {...env,QUALITY_REVIEW_SECRET:RUNNER},
  {...env,QUALITY_REVIEW_SECRET:'short'},
  {...env,QUALITY_REVIEW_SECRET:undefined},
  {...env,QUALITY_IMPORT_ENABLED:'false'},
  {...env,RUNNER_ENABLED:'false'},
  {...env,QUALITY_IMPORT_SECRET:RUNNER}
 ]){
  const denied=await check(req('review',REVIEW),settings);
  assert.deepEqual(denied,{status:503,code:'SETUP_REQUIRED'});
 }
 for(const settings of [
  {...env,QUALITY_REVIEW_ENABLED:'false'},
  {...env,DELIVERY_BRIDGE_ENABLED:'false'},
  {...env,QUALITY_REVIEW_SECRET:undefined}
 ])assert.deepEqual(await check(req('image',STAGE),settings),{status:200},
  'safe staging stays possible while review and delivery are OFF');
});
test('both routes enforce method restriction, no browser route aliases',async()=>{
 assert.deepEqual(await check(req('review',REVIEW,'GET')),{status:405,code:'METHOD_NOT_ALLOWED'});
 assert.deepEqual(await check(req('image',STAGE,'GET')),{status:405,code:'METHOD_NOT_ALLOWED'});
 assert.deepEqual(await check(req('other',REVIEW)),{status:404,code:'NOT_FOUND'});
});
test('one real staged image stays queued for review; staging-only credential cannot initiate Drive',async()=>{
 const f=storageFixture();
 let creates=0;
 const createBackend=()=>{creates++;throw Error('backend must never be used')};
 const original=Buffer.from('original provider render HOOK');
 const normalized=Buffer.from('synthetic normalized image for byte-integrity test');
 const audit={scene:'HOOK',bytes:normalized.length,sha256:sha(normalized),
  source_sha256:sha(original),structural_check:'PASS'};
 const header=Buffer.from(JSON.stringify({jobId,audit})).toString('base64url');
 const stageReq=req('image',STAGE,'POST',{headers:{
  'Content-Type':'application/octet-stream','X-LDB-Image-Audit':header
 },body:normalized});
 const stage=await handleQualityImport(stageReq,{storage:f.storage,env,createBackend});
 assert.equal(stage.status,200);
 assert.equal((await stage.json()).status,'STAGED');
 assert.equal(creates,0);
 assert.equal(f.map.has('delivery'),false);
 assert.equal(f.map.get('prepared-audit:'+jobId+':HOOK').sha256,sha(normalized));
 for(const attempted of [
  req('review',STAGE,'POST',{headers:{'Content-Type':'application/json'},body:JSON.stringify({approvedAudit:{jobId,status:'PASS',reviewerVerified:true}})}),
  req('review',REVIEW,'POST',{headers:{'Content-Type':'application/json'},body:JSON.stringify({approvedAudit:{jobId,status:'PASS',reviewerVerified:true}})})
 ]){
  const result=await handleQualityImport(attempted,{storage:f.storage,env,createBackend});
  assert.equal(result.status,attempted.headers.get('Authorization')==='Bearer '+STAGE?401:409);
 }
 assert.equal(creates,0,'a partial 1/17 set never invokes Google backend');
 assert.equal(f.map.has('delivery'),false);
});

test('review-only batch status requires reviewer secret but no Google delivery permission',async()=>{
 const off={...env,DELIVERY_BRIDGE_ENABLED:'false'};
 assert.deepEqual(await check(req('status',REVIEW,'GET'),off),{status:200});
 assert.deepEqual(await check(req('status',STAGE,'GET'),off),{status:401,code:'UNAUTHORIZED'});
 assert.deepEqual(await check(req('status',REVIEW,'POST'),off),{status:405,code:'METHOD_NOT_ALLOWED'});
 assert.deepEqual(await check(req('status',REVIEW,'GET'),{...off,QUALITY_REVIEW_ENABLED:'false'}),{status:503,code:'SETUP_REQUIRED'});
});
test('17-stage status is a single non-approving overview; missing scenes do not contact Google',async()=>{
 const f=storageFixture(),off={...env,DELIVERY_BRIDGE_ENABLED:'false'};
 let googleCalls=0;
 const backend=()=>{googleCalls++;throw Error('GOOGLE_MUST_NOT_BE_CALLED')};
 const statusReq=()=>req('status',REVIEW,'GET');
 const empty=await handleQualityImport(statusReq(),{storage:f.storage,env:off,createBackend:backend});
 assert.equal(empty.status,200);
 const e=await empty.json();
 assert.equal(e.stagedVerified,0);assert.equal(e.missingScenes,17);
 assert.equal(e.reviewReady,false);assert.equal(e.deliveryReady,false);
 for(const [i,scene] of ALL_SCENES.entries()){
  const raw=Buffer.from('original provider render '+scene);
  const corrected=Buffer.from('corrected candidate for '+scene);
  const audit={scene,bytes:corrected.length,sha256:sha(corrected),source_sha256:sha(raw)};
  const body=Buffer.from(JSON.stringify({jobId,audit})).toString('base64url');
  const staged=await handleQualityImport(req('image',STAGE,'POST',{
   headers:{'Content-Type':'application/octet-stream','X-LDB-Image-Audit':body},
   body:corrected
  }),{storage:f.storage,env:off,createBackend:backend});
  assert.equal(staged.status,200,'stage '+scene);
  if(i===0){
   const partial=await (await handleQualityImport(statusReq(),{storage:f.storage,env:off,createBackend:backend})).json();
   assert.equal(partial.stagedVerified,1);
   assert.equal(partial.reviewReady,false);
   assert.equal(partial.scenes[0].sha256,sha(corrected));
   assert.equal(partial.scenes[1].status,'MISSING');
  }
 }
 const response=await handleQualityImport(statusReq(),{storage:f.storage,env:off,createBackend:backend});
 assert.equal(response.status,200);
 const result=await response.json();
 assert.equal(result.status,'REVIEW_CANDIDATES_READY');
 assert.equal(result.stagedVerified,17);assert.equal(result.missingScenes,0);
 assert.equal(result.scenes.length,17);
 assert.equal(result.visualAudit,'PENDING');
 assert.equal(result.deliveryReady,false);
 assert.equal(result.googleUploadsStarted,false);
 assert.equal(f.map.has('delivery'),false);
 assert.equal(googleCalls,0);
});
test('STOP and tampered prepared bytes never claim review candidates ready',async()=>{
 const f=storageFixture(),off={...env,DELIVERY_BRIDGE_ENABLED:'false'};
 const corrected=Buffer.from('HOOK corrected candidate');
 const original=Buffer.from('original provider render HOOK');
 const audit={scene:'HOOK',bytes:corrected.length,sha256:sha(corrected),source_sha256:sha(original)};
 const staged=await handleQualityImport(req('image',STAGE,'POST',{
  headers:{'Content-Type':'application/octet-stream',
   'X-LDB-Image-Audit':Buffer.from(JSON.stringify({jobId,audit})).toString('base64url')},
  body:corrected
 }),{storage:f.storage,env:off,createBackend:()=>{throw Error('should not call')}});
 assert.equal(staged.status,200);
 f.map.set('job',{...f.map.get('job'),stop:true});
 const stopped=await (await handleQualityImport(req('status',REVIEW,'GET'),{
  storage:f.storage,env:off,createBackend:()=>{throw Error('should not call')}})).json();
 assert.equal(stopped.status,'IMAGES_NOT_READY');
 assert.equal(stopped.reviewReady,false);
 f.map.set('job',{...f.map.get('job'),stop:false});
 const key=sha('ldb-delivery-image-v1:'+jobId+':HOOK');
 f.map.set('prepared:'+jobId+':'+key+':0',new Uint8Array(Buffer.from('tampered')));
 const bad=await handleQualityImport(req('status',REVIEW,'GET'),{
  storage:f.storage,env:off,createBackend:()=>{throw Error('should not call')}});
 assert.equal(bad.status,409,'corrupt candidate blocks status, not quietly counted');
});

test('review-only candidate route is exact, isolated from stage secret and available with Drive OFF',async()=>{
 const off={...env,DELIVERY_BRIDGE_ENABLED:'false'};
 assert.deepEqual(await check(req('candidate/HOOK',REVIEW,'GET'),off),{status:200});
 assert.deepEqual(await check(req('candidate/P14',REVIEW,'GET'),off),{status:200});
 assert.deepEqual(await check(req('candidate/ENDING',REVIEW,'GET'),off),{status:200});
 assert.deepEqual(await check(req('candidate/THUMBNAIL',REVIEW,'GET'),off),{status:200});
 for(const invalid of ['candidate/P0','candidate/P15','candidate/P01',
  'candidate/Hook','candidate/HOOK/','candidate/P1/extra','candidate/P1%2Fstatus']){
  assert.deepEqual(await check(req(invalid,REVIEW,'GET'),off),
   {status:404,code:'NOT_FOUND'},invalid);
 }
 assert.deepEqual(await check(req('candidate/HOOK',STAGE,'GET'),off),
  {status:401,code:'UNAUTHORIZED'});
 assert.deepEqual(await check(req('candidate/HOOK',RUNNER,'GET'),off),
  {status:401,code:'UNAUTHORIZED'});
 assert.deepEqual(await check(req('candidate/HOOK',REVIEW,'POST'),off),
  {status:405,code:'METHOD_NOT_ALLOWED'});
 assert.deepEqual(await check(req('candidate/HOOK',REVIEW,'GET',
  { })),{status:200});
 assert.deepEqual(await check(req('candidate/HOOK',REVIEW,'GET'),
  {...off,QUALITY_REVIEW_ENABLED:'false'}),{status:503,code:'SETUP_REQUIRED'});
});
test('reviewer reads verified staged candidate bytes without creating delivery or granting visual approval',async()=>{
 const f=storageFixture(),off={...env,DELIVERY_BRIDGE_ENABLED:'false'};
 let backendCalls=0;
 const createBackend=()=>{backendCalls++;throw Error('GOOGLE_MUST_NOT_BE_CALLED')};
 const before=await handleQualityImport(req('candidate/HOOK',REVIEW,'GET'),{
  storage:f.storage,env:off,createBackend});
 assert.equal(before.status,404);
 assert.equal((await before.json()).status,'CANDIDATE_NOT_STAGED');
 const image=Buffer.from('immutable candidate bytes for HOOK');
 const original=Buffer.from('original provider render HOOK');
 const audit={scene:'HOOK',bytes:image.length,sha256:sha(image),
  source_sha256:sha(original),structural_check:'PASS'};
 const staged=await handleQualityImport(req('image',STAGE,'POST',{
  headers:{'Content-Type':'application/octet-stream',
   'X-LDB-Image-Audit':Buffer.from(JSON.stringify({jobId,audit})).toString('base64url')},
  body:image
 }),{storage:f.storage,env:off,createBackend});
 assert.equal(staged.status,200);
 const result=await handleQualityImport(req('candidate/HOOK',REVIEW,'GET'),{
  storage:f.storage,env:off,createBackend});
 assert.equal(result.status,200);
 assert.equal(result.headers.get('content-type'),'image/png');
 assert.equal(result.headers.get('x-content-type-options'),'nosniff');
 assert.equal(result.headers.get('x-ldb-sha256'),sha(image));
 assert.equal(result.headers.get('x-ldb-visual-audit'),'PENDING');
 assert.equal(result.headers.get('cache-control'),'private, no-store');
 assert.equal(result.headers.get('access-control-allow-origin'),null);
 assert.deepEqual(Buffer.from(await result.arrayBuffer()),image);
 assert.equal(backendCalls,0);
 assert.equal(f.map.has('delivery'),false);
 assert.equal(f.map.has('milestone-result:'+jobId+':30'),false);
});
test('candidate inspection fails closed on STOP, source drift, or tampered prepared bytes',async()=>{
 const f=storageFixture(),off={...env,DELIVERY_BRIDGE_ENABLED:'false'};
 const original=Buffer.from('original provider render HOOK');
 const image=Buffer.from('review candidate');
 const audit={scene:'HOOK',bytes:image.length,sha256:sha(image),source_sha256:sha(original)};
 await handleQualityImport(req('image',STAGE,'POST',{
  headers:{'Content-Type':'application/octet-stream',
   'X-LDB-Image-Audit':Buffer.from(JSON.stringify({jobId,audit})).toString('base64url')},
  body:image}),{storage:f.storage,env:off,createBackend:()=>{throw Error('network')}});
 const get=()=>handleQualityImport(req('candidate/HOOK',REVIEW,'GET'),{
  storage:f.storage,env:off,createBackend:()=>{throw Error('network')}});
 f.map.get('job').stop=true;
 assert.equal((await get()).status,409);
 f.map.get('job').stop=false;
 f.map.get('job').outputs[0].sha256=sha('drift');
 assert.equal((await get()).status,409);
 f.map.get('job').outputs[0].sha256=sha(original);
 const key=sha('ldb-delivery-image-v1:'+jobId+':HOOK');
 f.map.set('prepared:'+jobId+':'+key+':0',new Uint8Array(Buffer.from('tampered bytes')));
 assert.equal((await get()).status,409);
});

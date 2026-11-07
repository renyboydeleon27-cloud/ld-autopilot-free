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

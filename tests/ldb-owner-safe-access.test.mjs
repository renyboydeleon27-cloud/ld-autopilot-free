import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerAccessGate,isOwnerSafeRoute} from '../cloudflare/ldb-runner/owner-access.mjs';
const SECRET='separate-owner-runner-secret-1234567890';
const disabled={RUNNER_SECRET:SECRET,RUNNER_ENABLED:'false',FREE_PLAN_CONFIRMED:'false',BRIDGE_PROBE_ENABLED:'false'};
const enabled={...disabled,RUNNER_ENABLED:'true',FREE_PLAN_CONFIRMED:'true'};
const request=(path,method='GET',token=SECRET)=>new Request('https://runner.invalid'+path,{
 method,headers:{Authorization:token===null?'':'Bearer '+token}
});
const code=async response=>({http:response?.status??200,code:response?(await response.json()).status:'AUTHORIZED'});
test('safety status and STOP stay owner-authenticated with Free inference disabled',async()=>{
 for(const [method,path] of [
  ['GET','/status'],['GET','/delivery-readiness'],
  ['GET','/delivery-next-action'],['GET','/images/HOOK'],
  ['GET','/images/P1'],['GET','/images/P14'],
  ['GET','/images/ENDING'],['GET','/images/THUMBNAIL'],
  ['POST','/stop']
 ]){
  const req=request(path,method);
  assert.equal(isOwnerSafeRoute(req),true,path);
  assert.equal(ownerAccessGate(req,disabled),null,'owner retains safety control: '+path);
  assert.deepEqual(await code(ownerAccessGate(request(path,method,null),disabled)),
    {http:401,code:'UNAUTHORIZED'});
  assert.deepEqual(await code(ownerAccessGate(request(path,method,'wrong'),disabled)),
    {http:401,code:'UNAUTHORIZED'});
 }
});
test('unauthorized start, resume, render or data writes are blocked if Free flag is OFF',async()=>{
 for(const [method,path] of [
  ['POST','/jobs'],['POST','/resume'],['POST','/images/HOOK'],
  ['GET','/jobs'],['GET','/stop'],['POST','/status'],
  ['GET','/images/P15'],['GET','/images/../../status'],
  ['GET','/delivery-progress'],['POST','/delivery-readiness'],
  ['POST','/delivery-next-action']
 ]){
  const r=request(path,method);
  assert.equal(isOwnerSafeRoute(r),false,method+' '+path);
  assert.deepEqual(await code(ownerAccessGate(r,disabled)),{http:503,code:'SETUP_REQUIRED'});
 }
});
test('Free-plan flag and runner enablement remain mandatory for new jobs/resume',async()=>{
 for(const env of [
  {...enabled,RUNNER_ENABLED:'false'},
  {...enabled,FREE_PLAN_CONFIRMED:'false'},
  {...enabled,RUNNER_ENABLED:'false',FREE_PLAN_CONFIRMED:'false'}
 ]){
  assert.deepEqual(await code(ownerAccessGate(request('/jobs','POST'),env)),{http:503,code:'SETUP_REQUIRED'});
  assert.deepEqual(await code(ownerAccessGate(request('/resume','POST'),env)),{http:503,code:'SETUP_REQUIRED'});
 }
 assert.equal(ownerAccessGate(request('/jobs','POST'),enabled),null);
 assert.equal(ownerAccessGate(request('/resume','POST'),enabled),null);
});
test('missing owner credential never exposes STOP or status, even when disabled',async()=>{
 for(const env of [
  {...disabled,RUNNER_SECRET:undefined},
  {...disabled,RUNNER_SECRET:''},
  {...disabled,RUNNER_SECRET:'short'}
 ]){
  assert.deepEqual(await code(ownerAccessGate(request('/status'),env)),{http:503,code:'SETUP_REQUIRED'});
  assert.deepEqual(await code(ownerAccessGate(request('/stop','POST'),env)),{http:503,code:'SETUP_REQUIRED'});
 }
});
test('read-only binding probe retains its separate flag and owner secret',async()=>{
 assert.deepEqual(await code(ownerAccessGate(request('/delivery-bridge-probe'),disabled)),{http:503,code:'SETUP_REQUIRED'});
 const probe={...disabled,BRIDGE_PROBE_ENABLED:'true'};
 assert.equal(ownerAccessGate(request('/delivery-bridge-probe'),probe),null);
 assert.deepEqual(await code(ownerAccessGate(request('/delivery-bridge-probe','GET','wrong'),probe)),{http:401,code:'UNAUTHORIZED'});
});
test('safe routes with extra path segments cannot bypass Free-plan gate',async()=>{
 for(const path of ['/status/','/status/details','/images/P01','/images/P0',
  '/images/P15','/images/Hook','/images/P1/','/stop/']){
  assert.equal(isOwnerSafeRoute(request(path)),false);
  assert.deepEqual(await code(ownerAccessGate(request(path),disabled)),{http:503,code:'SETUP_REQUIRED'});
 }
});

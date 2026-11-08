import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerAccessGate,isOwnerSafeRoute} from '../cloudflare/ldb-runner/owner-access.mjs';
const SECRET='separate-owner-runner-secret-1234567890';
const disabled={RUNNER_SECRET:SECRET,RUNNER_ENABLED:'false',FREE_PLAN_CONFIRMED:'false',BRIDGE_PROBE_ENABLED:'false'};
const TODAY=new Date().toISOString().slice(0,10);
const enabled={...disabled,RUNNER_ENABLED:'true',FREE_PLAN_CONFIRMED:'true',LDB_FREE_PLAN_VERIFIED_DATE:TODAY,LDB_FREE_USAGE_VERIFIED_DATE:TODAY};
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
  ['GET','/images/P15'],['GET','/images/P1%2Fstatus'],
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


test('delivery-only Resume is owner-authenticated while Free inference is OFF',async()=>{
 const settings={...disabled,RUNNER_ENABLED:'true',DELIVERY_BRIDGE_ENABLED:'true'};
 assert.equal(isOwnerSafeRoute(request('/resume-delivery','POST')),false,
  'delivery resume is NOT a generic safety path');
 assert.equal(ownerAccessGate(request('/resume-delivery','POST'),settings),null);
 assert.deepEqual(await code(ownerAccessGate(request('/resume-delivery','POST',null),settings)),
  {http:401,code:'UNAUTHORIZED'});
 assert.deepEqual(await code(ownerAccessGate(request('/resume-delivery','POST','wrong'),settings)),
  {http:401,code:'UNAUTHORIZED'});
 // The existing /resume remains blocked to prevent image inference.
 assert.deepEqual(await code(ownerAccessGate(request('/resume','POST'),settings)),
  {http:503,code:'SETUP_REQUIRED'});
});
test('delivery Resume requires both master RUNNER switch and private bridge',async()=>{
 for(const settings of [
  {...disabled,DELIVERY_BRIDGE_ENABLED:'true'},
  {...disabled,RUNNER_ENABLED:'true',DELIVERY_BRIDGE_ENABLED:'false'},
  {...disabled,RUNNER_ENABLED:'true',DELIVERY_BRIDGE_ENABLED:undefined},
  {...disabled,RUNNER_ENABLED:'true',DELIVERY_BRIDGE_ENABLED:'true',RUNNER_SECRET:'short'}
 ]){
  assert.deepEqual(await code(ownerAccessGate(request('/resume-delivery','POST'),settings)),
   {http:503,code:'SETUP_REQUIRED'});
 }
 const settings={...disabled,RUNNER_ENABLED:'true',DELIVERY_BRIDGE_ENABLED:'true'};
 for(const [method,path] of [
  ['GET','/resume-delivery'],['POST','/resume-delivery/'],
  ['POST','/resume-delivery/reset'],['POST','/resume-delivery%2Fretry'],
  ['PUT','/resume-delivery']
 ]){
  assert.deepEqual(await code(ownerAccessGate(request(path,method),settings)),
   {http:503,code:'SETUP_REQUIRED'},method+' '+path);
 }
});

test('UTC midnight revokes image generation but not STOP, status or delivery-only resume',async()=>{
 const origin=Date.parse('2026-11-08T23:59:59.000Z'),next=Date.parse('2026-11-09T00:00:00.000Z');
 const settings={...enabled,LDB_FREE_PLAN_VERIFIED_DATE:'2026-11-08',LDB_FREE_USAGE_VERIFIED_DATE:'2026-11-08',DELIVERY_BRIDGE_ENABLED:'true'};
 assert.equal(ownerAccessGate(request('/jobs','POST'),settings,origin),null);
 for(const path of ['/jobs','/resume']){
  const denied=ownerAccessGate(request(path,'POST'),settings,next);
  assert.deepEqual(await code(denied),{http:503,code:'SETUP_REQUIRED'});
 }
 for(const [path,method] of [['/status','GET'],['/stop','POST'],['/resume-delivery','POST']])
  assert.equal(ownerAccessGate(request(path,method),settings,next),null);
 for(const key of ['LDB_FREE_PLAN_VERIFIED_DATE','LDB_FREE_USAGE_VERIFIED_DATE']){
  const denied=ownerAccessGate(request('/jobs','POST'),{...settings,[key]:''},origin);
  assert.deepEqual(await code(denied),{http:503,code:'SETUP_REQUIRED'});
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {safeOwnerBindingEvidence} from '../scripts/ldb-live-binding-probe.mjs';

const SECRET='TEST_ONLY_PRIVATE_NEVER_OUTPUT_123456789';
const TOKEN='TEST_ONLY_CLOUDFLARE_TOKEN_NEVER_OUTPUT';
const base={
 hostOwnershipVerified:true,
 workerMetadataVerified:true,
 workerModified:false,productionReady:false,
 googleConnectionVerified:false,gmailConnectionVerified:false,
 inferenceCalled:false
};
const preflight={...base,status:'OWNER_PREFLIGHT_VERIFIED',
 ownerSecretSent:false,verifiedHost:'ner-ldb-runner-binding-probe.test.workers.dev',
 privateData:SECRET};
const authenticated={...base,status:'BRIDGE_AUTHENTICATED',
 providerToken:TOKEN,nonce:'0'.repeat(32),privateData:SECRET};

test('metadata-only evidence never claims a Runner authentication and never echoes provider fields',()=>{
 const out=safeOwnerBindingEvidence({mode:'preflight',result:preflight});
 assert.equal(out.schema,'LDB_OWNER_PROBE_SAFE_EVIDENCE_V1');
 assert.equal(out.mode,'preflight');
 assert.equal(out.runnerSecretSent,false);
 assert.equal(out.bindingAuthenticationVerified,false);
 assert.equal(out.productionReady,false);
 assert.match(out.observedAtUtc,/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
 for(const str of [SECRET,TOKEN,'ner-ldb-runner-binding-probe.test.workers.dev','00000000000000000000000000000000']){
  assert.ok(!JSON.stringify(out).includes(str));
 }
 assert.equal(Object.isFrozen(out),true);
});

test('successful owner-authenticated evidence distinguishes binding test from Google readiness',()=>{
 const out=safeOwnerBindingEvidence({mode:'authenticated',result:authenticated});
 assert.equal(out.runnerSecretSent,true);
 assert.equal(out.bindingAuthenticationVerified,true);
 assert.equal(out.googleConnectionVerified,false);
 assert.equal(out.gmailConnectionVerified,false);
 assert.equal(out.inferenceCalled,false);
 assert.equal(out.workerModified,false);
 assert.equal(out.productionReady,false);
 assert.ok(!JSON.stringify(out).includes(TOKEN));
 assert.ok(!JSON.stringify(out).includes(SECRET));
});

test('forged success, ambiguous modes, unsafe flags and failed preflight evidence fail closed',()=>{
 for(const input of [
  {mode:'preflight',result:authenticated},
  {mode:'authenticated',result:preflight},
  {mode:'unknown',result:authenticated},
  {mode:'preflight',result:{...preflight,ownerSecretSent:true}},
  {mode:'preflight',result:{...preflight,hostOwnershipVerified:false}},
  {mode:'preflight',result:{...preflight,workerMetadataVerified:false}},
  {mode:'authenticated',result:{...authenticated,productionReady:true}},
  {mode:'authenticated',result:{...authenticated,googleConnectionVerified:true}},
  {mode:'authenticated',result:{...authenticated,workerModified:true}},
  {mode:'authenticated',result:{...authenticated,status:'ERROR'}},
  {mode:'authenticated',result:{}}
 ]){
  assert.throws(()=>safeOwnerBindingEvidence(input),/PROBE_RESPONSE_INVALID/);
 }
});

test('invalid CLI option combinations refuse execution before any network call',()=>{
 const file=new URL('../scripts/ldb-live-binding-probe.mjs',import.meta.url);
 for(const args of [
  [],['--safe-evidence-json'],
  ['--owner-approved-readonly-probe','--owner-approved-readonly-preflight'],
  ['--owner-approved-readonly-probe','--owner-approved-readonly-probe'],
  ['--owner-approved-readonly-probe','--unsafe-unknown-flag'],
  ['--owner-approved-readonly-preflight','--safe-evidence-json','--safe-evidence-json']
 ]){
  const run=spawnSync(process.execPath,[fileURLToPath(file),...args],{
   env:{},encoding:'utf8',timeout:5000
  });
  assert.notEqual(run.status,0);
  assert.equal(run.stdout,'');
  assert.match(run.stderr,/OWNER_APPROVAL_FLAG_REQUIRED/);
 }
});

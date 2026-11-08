import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyCompiledIsolatedProbeBundles} from '../scripts/ldb-verify-compiled-probe.mjs';

const RUNNER=[
 '/delivery-bridge-probe','/internal/bridge/health',
 'X-LDB-Probe-Nonce','BRIDGE_AUTHENTICATED',
 'BRIDGE_PROBE_UNAVAILABLE'
].join(' ');
const VAULT=[
 '/internal/bridge/health','X-LDB-Probe-Nonce',
 'BRIDGE_AUTHENTICATED','INVALID_PROBE_NONCE'
].join(' ');
test('compiled isolated probe contract requires Runner and Vault route markers',()=>{
 assert.deepEqual(verifyCompiledIsolatedProbeBundles({runner:RUNNER,vault:VAULT}),{
  status:'ISOLATED_PROBE_COMPILED_ROUTES_PRESENT',
  authenticationVerified:false,productionReady:false,deployed:false
 });
});
test('missing route, nonce, authentication or failure marker fails closed',()=>{
 for(const [key,markers] of [
  ['runner',['/delivery-bridge-probe','/internal/bridge/health','X-LDB-Probe-Nonce',
   'BRIDGE_AUTHENTICATED','BRIDGE_PROBE_UNAVAILABLE']],
  ['vault',['/internal/bridge/health','X-LDB-Probe-Nonce',
   'BRIDGE_AUTHENTICATED','INVALID_PROBE_NONCE']]
 ]){
  for(const marker of markers){
   const input={runner:RUNNER,vault:VAULT};
   input[key]=input[key].replace(marker,'REMOVED');
   assert.throws(()=>verifyCompiledIsolatedProbeBundles(input),/compiled JS missing/);
  }
 }
 for(const malformed of [
  {},{runner:RUNNER},{runner:RUNNER,vault:''},
  {runner:123,vault:VAULT},{runner:[],vault:VAULT}
 ]){
  assert.throws(()=>verifyCompiledIsolatedProbeBundles(malformed));
 }
});

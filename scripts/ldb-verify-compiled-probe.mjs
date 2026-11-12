// Post-Wrangler dry-run verification: ensure the deployable JS bundles
// actually contain both isolated nonce-authentication routes.
// No Cloudflare API, token, upload, inference, deployment or secret access.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const REQUIRED=Object.freeze({
 runner:Object.freeze([
  '/delivery-bridge-probe',
  '/internal/bridge/health',
  'X-LDB-Probe-Nonce',
  'BRIDGE_AUTHENTICATED',
  'BRIDGE_PROBE_UNAVAILABLE'
 ]),
 vault:Object.freeze([
  '/internal/bridge/health',
  'X-LDB-Probe-Nonce',
  'BRIDGE_AUTHENTICATED',
  'INVALID_PROBE_NONCE'
 ])
});

// Exported for unit testing only. String-presence is a static bundle
// regression check, NOT authentication proof and NOT a live release audit.
export function verifyCompiledIsolatedProbeBundles({runner,vault}={}){
 for(const [kind,source] of Object.entries({runner,vault})){
  assert.equal(typeof source,'string',kind+' compiled JS missing');
  assert.ok(source.length>0,kind+' compiled JS empty');
  for(const phrase of REQUIRED[kind]){
   assert.ok(source.includes(phrase),kind+' compiled JS missing reviewed probe route');
  }
 }
 return Object.freeze({
  status:'ISOLATED_PROBE_COMPILED_ROUTES_PRESENT',
  authenticationVerified:false,
  productionReady:false,
  deployed:false
 });
}

function readJsBundles(directory){
 const names=readdirSync(directory,{recursive:true}).filter(
  x=>typeof x==='string'&&x.endsWith('.js')
 );
 assert.ok(names.length>0,'No JavaScript bundle from dry-run');
 // Keep CI bounded; never print a Worker bundle or any environment data.
 const chunks=[];
 let size=0;
 for(const name of names){
  const bytes=readFileSync(join(directory,name));
  size+=bytes.length;
  assert.ok(size<=25_000_000,'Unexpectedly large compile output');
  chunks.push(bytes.toString('utf8'));
 }
 return chunks.join('\n');
}
export function verifyCompiledBundlesFromDisk({
 runnerDir='/tmp/ldb-runner-probe-build',
 vaultDir='/tmp/ldb-vault-probe-build'
}={}){
 return verifyCompiledIsolatedProbeBundles({
  runner:readJsBundles(runnerDir),
  vault:readJsBundles(vaultDir)
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3||process.argv[2]!=='--check-dry-run-only'){
  console.error('OFFLINE_BUNDLE_CHECK_FLAG_REQUIRED');
  process.exitCode=1;
 }else{
  try{
   verifyCompiledBundlesFromDisk();
   console.log('PASS: isolated Runner/Vault compiled JS contains nonce-bound routes. No deployment or live authentication.');
  }catch{
   console.error('FAIL: isolated compiled probe routes not verified. No deployment performed.');
   process.exitCode=1;
  }
 }
}

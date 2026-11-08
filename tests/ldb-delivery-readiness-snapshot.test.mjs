import test from 'node:test';
import assert from 'node:assert/strict';
import {collectLdbReadOnlyDeliverySnapshot} from '../lib/ldb/delivery-readiness-snapshot.mjs';
const inventory=()=>({status:'PREVIEW_DELIVERY_CONFIG_INCOMPLETE',
 configuredEntries:0,expectedConfigurationEntries:6,missingKeys:['LDB_GOOGLE_VAULT_URL'],
 productionReady:false,googleApiCalled:false,gmailApiCalled:false,
 driveFilesVerified:0,driveFilesExpected:69,
 gmailMilestonesVerified:0,gmailMilestonesExpected:4});
const quality=()=>({status:'CLOUDFLARE_WIRING_NOT_VERIFIED',productionReady:false,
 workerModified:false,inferenceCalled:false,googleApiCalled:false,gmailApiCalled:false,
 liveServiceBindingProbed:false,runnerSettingsHttpStatus:200});
const isolated=()=>({status:'ISOLATED_PROBE_METADATA_MATCHES_SAFE',productionReady:false,
 workerModified:false,inferenceCalled:false,googleApiCalled:false,gmailApiCalled:false,
 authenticationProbeCalled:false,authenticationVerified:false,runnerSettingsHttpStatus:200});
const host=()=>({status:'PROBE_HOST_METADATA_READY',productionReady:false,
 workerModified:false,inferenceCalled:false,googleApiCalled:false,gmailApiCalled:false,
 authenticatedProbeCalled:false,ownerSecretSent:false,accountReadHttpStatus:200});
test('three independent sanitized read-only checks return without claiming any production progress',async()=>{
 const out=await collectLdbReadOnlyDeliverySnapshot({
  inventory:inventory(),credentialsConfigured:true,
  inspectQuality:async()=>quality(),inspectIsolated:async()=>isolated(),
  inspectHost:async()=>host()
 });
 assert.equal(out.cloudflareDiagnosticCoverage.status,'ALL_RETURNED');
 assert.deepEqual(out.cloudflareDiagnosticCoverage.checks,{
  quality:'RETURNED',isolated:'RETURNED',host:'RETURNED'
 });
 assert.equal(out.cloudflareDiagnosticCoverage.returned,3);
 assert.equal(out.isolatedProbe.status,'ISOLATED_PROBE_METADATA_MATCHES_SAFE');
 assert.equal(out.probeHost.status,'PROBE_HOST_METADATA_READY');
 assert.equal(out.driveFilesVerified,0);
 assert.equal(out.gmailMilestonesVerified,0);
 assert.equal(out.productionReady,false);
});
test('one Cloudflare failure does NOT erase independent successful findings or echo secrets',async()=>{
 const secret='LIVE_PROVIDER_SECRET_MUST_NOT_ECHO';
 const out=await collectLdbReadOnlyDeliverySnapshot({
  inventory:inventory(),credentialsConfigured:true,
  inspectQuality:async()=>quality(),
  inspectIsolated:async()=>{throw Error(secret)},
  inspectHost:async()=>host()
 });
 assert.equal(out.cloudflareDiagnosticCoverage.status,'PARTIAL');
 assert.equal(out.cloudflareDiagnosticCoverage.returned,2);
 assert.equal(out.cloudflareDiagnosticCoverage.checks.isolated,'UNAVAILABLE');
 assert.equal(out.cloudflareVault.runnerSettingsHttpStatus,200);
 assert.equal(out.probeHost.accountReadHttpStatus,200);
 assert.equal(out.isolatedProbe.status,'ISOLATED_PROBE_METADATA_NOT_VERIFIED');
 assert.equal(out.isolatedProbe.authenticationVerified,false);
 assert.ok(!JSON.stringify(out).includes(secret));
});
test('absence of token creates zero provider requests and no invented success',async()=>{
 let called=0;
 const inspect=async()=>{called++;return quality()};
 const out=await collectLdbReadOnlyDeliverySnapshot({
  inventory:inventory(),credentialsConfigured:false,
  inspectQuality:inspect,inspectIsolated:inspect,inspectHost:inspect
 });
 assert.equal(called,0);
 assert.equal(out.cloudflareDiagnosticCoverage.status,'NOT_CONFIGURED');
 assert.equal(out.cloudflareDiagnosticCoverage.returned,0);
 assert.equal(out.probeHost.ownerSecretSent,false);
});
test('malformed or unsafe responses fail closed and do not falsely report success',async()=>{
 const out=await collectLdbReadOnlyDeliverySnapshot({
  inventory:inventory(),credentialsConfigured:true,
  inspectQuality:async()=>({...quality(),productionReady:true}),
  inspectIsolated:async()=>({...isolated(),authenticationVerified:true}),
  inspectHost:async()=>({...host(),ownerSecretSent:true})
 });
 assert.equal(out.cloudflareDiagnosticCoverage.status,'UNAVAILABLE');
 assert.equal(out.cloudflareDiagnosticCoverage.returned,0);
 assert.equal(out.productionReady,false);
 assert.equal(out.isolatedProbe.authenticationVerified,false);
 assert.equal(out.probeHost.ownerSecretSent,false);
});
test('invalid inventory fails before any provider access',async()=>{
 let called=0;
 await assert.rejects(collectLdbReadOnlyDeliverySnapshot({
  inventory:{productionReady:true},
  credentialsConfigured:true,
  inspectQuality:async()=>{called++;return quality()}
 }),/DELIVERY_INVENTORY_INVALID/);
 assert.equal(called,0);
});

test('output cannot disclose arbitrary inspector fields, raw bindings, or nested secret text',async()=>{
 const S='SENSITIVE_VALUE_MUST_NOT_APPEAR_IN_RESPONSE';
 const response=await collectLdbReadOnlyDeliverySnapshot({
  inventory:inventory(),credentialsConfigured:true,
  inspectQuality:async()=>({...quality(),untrustedText:S,token:S,
   bindings:[{name:'VAULT_KEY',text:S}],note:S,
   vaultUpdateSafetyStatus:S,runnerSettingsHttpStatus:99999}),
  inspectIsolated:async()=>({...isolated(),runnerChecks:{
   BRIDGE_PROBE_ENABLED:'EXPLICIT_TRUE',AI:S,VAULT_ENABLED:S
  },secretStates:{runnerOwnerSecret:S,extra:S},
   providerPayload:{secrets:[S]},note:S,runnerSettingsHttpStatus:S}),
  inspectHost:async()=>({...host(),accountSubdomain:S,
   unexpectedField:S,note:S,accountReadHttpStatus:9999})
 });
 assert.equal(response.cloudflareDiagnosticCoverage.status,'ALL_RETURNED');
 assert.equal(response.cloudflareDiagnosticCoverage.returned,3);
 assert.equal(response.cloudflareVault.runnerSettingsHttpStatus,null);
 assert.equal(response.isolatedProbe.runnerSettingsHttpStatus,null);
 assert.equal(response.probeHost.accountReadHttpStatus,null);
 assert.equal(response.isolatedProbe.runnerChecks.BRIDGE_PROBE_ENABLED,'EXPLICIT_TRUE');
 assert.equal(response.isolatedProbe.runnerChecks.AI,undefined);
 assert.equal(response.isolatedProbe.secretStates.runnerOwnerSecret,null);
 assert.equal(response.cloudflareVault.bindings,undefined);
 assert.equal(response.probeHost.accountSubdomain,undefined);
 assert.ok(!JSON.stringify(response).includes(S));
 assert.equal(response.productionReady,false);
});
test('invalid diagnostic type and unknown status remain unavailable, not leaked',async()=>{
 const result=await collectLdbReadOnlyDeliverySnapshot({
  inventory:inventory(),credentialsConfigured:true,
  inspectQuality:async()=>({...quality(),status:'UNTRUSTED'}),
  inspectIsolated:async()=>['not a diagnostic'],
  inspectHost:async()=>host()
 });
 assert.equal(result.cloudflareDiagnosticCoverage.status,'PARTIAL');
 assert.equal(result.cloudflareDiagnosticCoverage.returned,1);
 assert.equal(result.cloudflareDiagnosticCoverage.checks.quality,'UNAVAILABLE');
 assert.equal(result.cloudflareDiagnosticCoverage.checks.isolated,'UNAVAILABLE');
 assert.equal(result.cloudflareDiagnosticCoverage.checks.host,'RETURNED');
});

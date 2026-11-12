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
 authenticationProbeCalled:false,authenticationVerified:false,
 runnerSettingsHttpStatus:200,vaultSettingsHttpStatus:200,
 runnerWorkerMetadataFound:true,vaultWorkerMetadataFound:true,
 serviceBindingState:'TARGET_MATCH',serviceEnvironmentState:'PRODUCTION',
 runnerNamespace:'EXPECTED_CLASS',vaultNamespace:'EXPECTED_CLASS',
 accountFlagMatches:true,unexpectedRunnerBindings:false,unexpectedVaultBindings:false,
 runnerChecks:{RUNNER_ENABLED:'EXPLICIT_FALSE',FREE_PLAN_CONFIRMED:'EXPLICIT_FALSE',
  DELIVERY_BRIDGE_ENABLED:'EXPLICIT_FALSE',BRIDGE_PROBE_ENABLED:'EXPLICIT_TRUE'},
 vaultChecks:{VAULT_ENABLED:'EXPLICIT_FALSE',DELIVERY_BRIDGE_ENABLED:'EXPLICIT_FALSE',
  BRIDGE_PROBE_ENABLED:'EXPLICIT_TRUE'},
 authSetupStatus:'SECRET_BINDINGS_NOT_LISTED_IN_SETTINGS',
 authSetupMetadataListed:false,
 secretStates:{runnerOwnerSecret:'NOT_LISTED_IN_SETTINGS',
  runnerSharedSecret:'NOT_LISTED_IN_SETTINGS',vaultSharedSecret:'NOT_LISTED_IN_SETTINGS'}});
const host=()=>({status:'PROBE_HOST_METADATA_READY',productionReady:false,
 workerModified:false,inferenceCalled:false,googleApiCalled:false,gmailApiCalled:false,
 authenticatedProbeCalled:false,ownerSecretSent:false,
 accountReadHttpStatus:200,scriptReadHttpStatus:200,
 accountSubdomainValid:true,runnerWorkersDevEnabled:true,
 accountHostMetadataVerified:true});
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
   ...isolated().runnerChecks,AI:S,UNKNOWN_FLAG:S
  },secretStates:{...isolated().secretStates,extra:S},
   providerPayload:{secrets:[S]},note:S}),
  inspectHost:async()=>({...host(),status:'PROBE_HOST_METADATA_NOT_VERIFIED',
   accountHostMetadataVerified:false,accountSubdomain:S,
   unexpectedField:S,note:S,accountReadHttpStatus:9999})
 });
 assert.equal(response.cloudflareDiagnosticCoverage.status,'ALL_RETURNED');
 assert.equal(response.cloudflareDiagnosticCoverage.returned,3);
 assert.equal(response.cloudflareVault.runnerSettingsHttpStatus,null);
 assert.equal(response.isolatedProbe.runnerSettingsHttpStatus,200);
 assert.equal(response.probeHost.accountReadHttpStatus,null);
 assert.equal(response.isolatedProbe.runnerChecks.BRIDGE_PROBE_ENABLED,'EXPLICIT_TRUE');
 assert.equal(response.isolatedProbe.runnerChecks.AI,undefined);
 assert.equal(response.isolatedProbe.secretStates.runnerOwnerSecret,'NOT_LISTED_IN_SETTINGS');
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

test('contradictory safe statuses never survive output projection',async()=>{
 const validQuality={...quality(),
  status:'CLOUDFLARE_WIRING_METADATA_MATCHES_OFF',
  runnerSettingsHttpStatus:200,vaultSettingsHttpStatus:200,
  runnerWorkerFound:true,vaultWorkerFound:true,
  serviceBindingMetadataMatches:true,serviceBindingState:'TARGET_MATCH',
  runnerDeliveryState:'EXPLICIT_FALSE',vaultDeliveryState:'EXPLICIT_FALSE',
  vaultOAuthState:'EXPLICIT_FALSE',runnerDeliveryDisabled:true,
  vaultDeliveryDisabled:true,vaultOAuthDisabled:true};
 const validIso=isolated(),validHost=host();
 const cases=[
  ['quality',{...validQuality,vaultOAuthState:'EXPLICIT_TRUE'}],
  ['quality',{...validQuality,serviceBindingState:'WRONG_TARGET'}],
  ['quality',{...validQuality,runnerSettingsHttpStatus:403}],
  ['quality',{...validQuality,vaultDeliveryDisabled:null}],
  ['isolated',{...validIso,runnerChecks:{...validIso.runnerChecks,FREE_PLAN_CONFIRMED:'EXPLICIT_TRUE'}}],
  ['isolated',{...validIso,vaultChecks:{...validIso.vaultChecks,VAULT_ENABLED:'EXPLICIT_TRUE'}}],
  ['isolated',{...validIso,serviceEnvironmentState:'OTHER'}],
  ['isolated',{...validIso,runnerNamespace:'MISSING'}],
  ['isolated',{...validIso,authSetupStatus:'INVALID_PROBE_SECRET_BINDINGS'}],
  ['isolated',{...validIso,authSetupMetadataListed:true}],
  ['isolated',{...validIso,unexpectedRunnerBindings:true}],
  ['host',{...validHost,runnerWorkersDevEnabled:false}],
  ['host',{...validHost,accountReadHttpStatus:403}],
  ['host',{...validHost,accountHostMetadataVerified:false}]
 ];
 for(const [kind,diagnostic] of cases){
  const snapshot=await collectLdbReadOnlyDeliverySnapshot({
   inventory:inventory(),credentialsConfigured:true,
   inspectQuality:async()=>kind==='quality'?diagnostic:validQuality,
   inspectIsolated:async()=>kind==='isolated'?diagnostic:validIso,
   inspectHost:async()=>kind==='host'?diagnostic:validHost
  });
  assert.equal(snapshot.cloudflareDiagnosticCoverage.status,'PARTIAL');
  assert.equal(snapshot.cloudflareDiagnosticCoverage.returned,2);
  assert.equal(snapshot.cloudflareDiagnosticCoverage.checks[kind],'UNAVAILABLE');
  assert.equal(snapshot.productionReady,false);
  assert.equal(snapshot.isolatedProbe.authenticationVerified,false);
  assert.equal(snapshot.probeHost.ownerSecretSent,false);
 }
});
test('fully supported safe statuses remain metadata-only, never operational approval',async()=>{
 const good=await collectLdbReadOnlyDeliverySnapshot({
  inventory:inventory(),credentialsConfigured:true,
  inspectQuality:async()=>({
   ...quality(),status:'CLOUDFLARE_WIRING_METADATA_MATCHES_OFF',
   runnerSettingsHttpStatus:200,vaultSettingsHttpStatus:200,
   runnerWorkerFound:true,vaultWorkerFound:true,
   serviceBindingMetadataMatches:true,serviceBindingState:'TARGET_MATCH',
   runnerDeliveryState:'EXPLICIT_FALSE',vaultDeliveryState:'EXPLICIT_FALSE',
   vaultOAuthState:'EXPLICIT_FALSE',
   runnerDeliveryDisabled:true,vaultDeliveryDisabled:true,vaultOAuthDisabled:true
  }),
  inspectIsolated:async()=>isolated(),inspectHost:async()=>host()
 });
 assert.equal(good.cloudflareDiagnosticCoverage.status,'ALL_RETURNED');
 assert.equal(good.cloudflareVault.status,'CLOUDFLARE_WIRING_METADATA_MATCHES_OFF');
 assert.equal(good.isolatedProbe.status,'ISOLATED_PROBE_METADATA_MATCHES_SAFE');
 assert.equal(good.probeHost.status,'PROBE_HOST_METADATA_READY');
 assert.equal(good.productionReady,false);
 assert.equal(good.isolatedProbe.authenticationVerified,false);
});

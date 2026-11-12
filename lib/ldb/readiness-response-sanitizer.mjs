// Defense-in-depth response projection for LDB diagnostic results.
// NEVER spread inspector/provider objects into JSON responses. Only exact
// enums, bounded numeric HTTP statuses, booleans and fixed static notes pass.
const ENUMS=Object.freeze({
  statusQuality:['CLOUDFLARE_WIRING_NOT_VERIFIED','CLOUDFLARE_WIRING_METADATA_MATCHES_OFF'],
  statusIsolated:['ISOLATED_PROBE_METADATA_NOT_VERIFIED','ISOLATED_PROBE_METADATA_MATCHES_SAFE'],
  statusHost:['PROBE_HOST_METADATA_NOT_VERIFIED','PROBE_HOST_METADATA_READY'],
  binding:['METADATA_UNAVAILABLE','MISSING','DUPLICATE','WRONG_TYPE',
    'WRONG_TARGET','ENVIRONMENT_SCOPED','NONDEFAULT_ENTRYPOINT','TARGET_MATCH'],
  flag:['METADATA_UNAVAILABLE','MISSING','DUPLICATE','WRONG_TYPE',
    'EXPLICIT_FALSE','EXPLICIT_TRUE','UNEXPECTED_VALUE'],
  namespace:['METADATA_UNAVAILABLE','MISSING','DUPLICATE',
    'WRONG_TYPE_OR_CLASS','EXPECTED_CLASS'],
  environment:['UNVERIFIED','PRODUCTION','UNSPECIFIED','OTHER'],
  secret:['SETTINGS_UNAVAILABLE','NOT_LISTED_IN_SETTINGS','DUPLICATE_BINDING',
    'SECRET_BINDING_LISTED','UNEXPECTED_BINDING_TYPE'],
  auth:['SECRET_BINDINGS_LISTED_UNVERIFIED',
    'INVALID_PROBE_SECRET_BINDINGS','SECRET_BINDING_METADATA_UNAVAILABLE',
    'SECRET_BINDINGS_NOT_LISTED_IN_SETTINGS'],
  vaultUpdate:['VAULT_METADATA_NOT_VERIFIED','ACTIVE_VAULT_REQUIRES_OWNER_REVIEW',
    'VAULT_FLAGS_NOT_SAFELY_DISABLED','VAULT_DURABLE_NAMESPACE_UNVERIFIED',
    'VAULT_EXISTING_SECRETS_UNVERIFIED','REVIEWED_VAULT_UPDATE_PRECHECK_PASSED']
});
const choose=(value,key)=>ENUMS[key].includes(value)?value:null;
const http=value=>Number.isInteger(value)&&value>=100&&value<=599?value:null;
const bool=value=>typeof value==='boolean'?value:null;
const record=(keys,src,kind)=>Object.freeze(Object.fromEntries(
 keys.map(key=>[key,choose(src?.[key],kind)])
));
// Status words are evidence claims, not decorations. If a future inspector
// returns a "safe" status with missing, inconsistent, or unsafe underlying
// fields, reject the entire inspector result (snapshot fails closed).
const requireSafeEvidence=(kind,out)=>{
 if(kind==='quality'&&out.status==='CLOUDFLARE_WIRING_METADATA_MATCHES_OFF'){
  if(out.runnerSettingsHttpStatus!==200||out.vaultSettingsHttpStatus!==200||
     out.runnerWorkerFound!==true||out.vaultWorkerFound!==true||
     out.serviceBindingMetadataMatches!==true||
     out.serviceBindingState!=='TARGET_MATCH'||
     out.runnerDeliveryState!=='EXPLICIT_FALSE'||
     out.vaultDeliveryState!=='EXPLICIT_FALSE'||
     out.vaultOAuthState!=='EXPLICIT_FALSE'||
     out.runnerDeliveryDisabled!==true||
     out.vaultDeliveryDisabled!==true||
     out.vaultOAuthDisabled!==true)
   throw Error('INCONSISTENT_SAFE_DIAGNOSTIC');
 }
 if(kind==='isolated'&&out.status==='ISOLATED_PROBE_METADATA_MATCHES_SAFE'){
  const r=out.runnerChecks,v=out.vaultChecks;
  if(out.runnerSettingsHttpStatus!==200||out.vaultSettingsHttpStatus!==200||
     out.runnerWorkerMetadataFound!==true||out.vaultWorkerMetadataFound!==true||
     out.serviceBindingState!=='TARGET_MATCH'||
     !['PRODUCTION','UNSPECIFIED'].includes(out.serviceEnvironmentState)||
     out.runnerNamespace!=='EXPECTED_CLASS'||out.vaultNamespace!=='EXPECTED_CLASS'||
     out.accountFlagMatches!==true||
     out.unexpectedRunnerBindings!==false||out.unexpectedVaultBindings!==false||
     r.RUNNER_ENABLED!=='EXPLICIT_FALSE'||
     r.FREE_PLAN_CONFIRMED!=='EXPLICIT_FALSE'||
     r.DELIVERY_BRIDGE_ENABLED!=='EXPLICIT_FALSE'||
     r.BRIDGE_PROBE_ENABLED!=='EXPLICIT_TRUE'||
     v.VAULT_ENABLED!=='EXPLICIT_FALSE'||
     v.DELIVERY_BRIDGE_ENABLED!=='EXPLICIT_FALSE'||
     v.BRIDGE_PROBE_ENABLED!=='EXPLICIT_TRUE'||
     !['SECRET_BINDINGS_LISTED_UNVERIFIED',
       'SECRET_BINDING_METADATA_UNAVAILABLE',
       'SECRET_BINDINGS_NOT_LISTED_IN_SETTINGS'].includes(out.authSetupStatus)||
     out.authSetupMetadataListed!==
      (out.authSetupStatus==='SECRET_BINDINGS_LISTED_UNVERIFIED'))
   throw Error('INCONSISTENT_SAFE_DIAGNOSTIC');
 }
 if(kind==='host'&&out.status==='PROBE_HOST_METADATA_READY'){
  if(out.accountReadHttpStatus!==200||out.scriptReadHttpStatus!==200||
     out.accountSubdomainValid!==true||
     out.runnerWorkersDevEnabled!==true||
     out.accountHostMetadataVerified!==true)
   throw Error('INCONSISTENT_SAFE_DIAGNOSTIC');
 }
 return out;
};
const base=value=>({
 productionReady:false,workerModified:false,inferenceCalled:false,
 googleApiCalled:false,gmailApiCalled:false,
 // These flags are *always* false for a preview-only metadata check.
});
export function sanitizeLdbInspector(kind,value){
 if(!value||typeof value!=='object'||Array.isArray(value))
  throw Error('INVALID_INSPECTOR_RESULT');
 if(kind==='quality'){
  const out={
   ...base(value),status:choose(value.status,'statusQuality'),
   runnerSettingsHttpStatus:http(value.runnerSettingsHttpStatus),
   vaultSettingsHttpStatus:http(value.vaultSettingsHttpStatus),
   runnerWorkerFound:bool(value.runnerWorkerFound),
   vaultWorkerFound:bool(value.vaultWorkerFound),
   serviceBindingMetadataMatches:bool(value.serviceBindingMetadataMatches),
   serviceBindingState:choose(value.serviceBindingState,'binding'),
   runnerDeliveryState:choose(value.runnerDeliveryState,'flag'),
   vaultDeliveryState:choose(value.vaultDeliveryState,'flag'),
   vaultOAuthState:choose(value.vaultOAuthState,'flag'),
   runnerDeliveryDisabled:bool(value.runnerDeliveryDisabled),
   vaultDeliveryDisabled:bool(value.vaultDeliveryDisabled),
   vaultOAuthDisabled:bool(value.vaultOAuthDisabled),
   vaultUpdateSafetyStatus:choose(value.vaultUpdateSafetyStatus,'vaultUpdate'),
   vaultUpdateEligibleForReviewedUpdate:bool(value.vaultUpdateEligibleForReviewedUpdate),
   liveServiceBindingProbed:false,
   driveConnectionVerified:false,gmailConnectionVerified:false,
   driveFilesVerified:0,gmailMilestonesVerified:0,
   note:'Read-only Cloudflare metadata; not a live Vault, Google or production check.'
  };
  if(!out.status)throw Error('INVALID_INSPECTOR_RESULT');
  return Object.freeze(requireSafeEvidence(kind,out));
 }
 if(kind==='isolated'){
  const out={
   ...base(value),status:choose(value.status,'statusIsolated'),
   runnerSettingsHttpStatus:http(value.runnerSettingsHttpStatus),
   vaultSettingsHttpStatus:http(value.vaultSettingsHttpStatus),
   runnerWorkerMetadataFound:bool(value.runnerWorkerMetadataFound),
   vaultWorkerMetadataFound:bool(value.vaultWorkerMetadataFound),
   serviceBindingState:choose(value.serviceBindingState,'binding'),
   serviceEnvironmentState:choose(value.serviceEnvironmentState,'environment'),
   runnerNamespace:choose(value.runnerNamespace,'namespace'),
   vaultNamespace:choose(value.vaultNamespace,'namespace'),
   accountFlagMatches:bool(value.accountFlagMatches),
   unexpectedRunnerBindings:bool(value.unexpectedRunnerBindings),
   unexpectedVaultBindings:bool(value.unexpectedVaultBindings),
   runnerChecks:record([
    'RUNNER_ENABLED','FREE_PLAN_CONFIRMED','DELIVERY_BRIDGE_ENABLED','BRIDGE_PROBE_ENABLED'
   ],value.runnerChecks,'flag'),
   vaultChecks:record([
    'VAULT_ENABLED','DELIVERY_BRIDGE_ENABLED','BRIDGE_PROBE_ENABLED'
   ],value.vaultChecks,'flag'),
   authSetupStatus:choose(value.authSetupStatus,'auth'),
   secretStates:record([
    'runnerOwnerSecret','runnerSharedSecret','vaultSharedSecret'
   ],value.secretStates,'secret'),
   authSetupMetadataListed:bool(value.authSetupMetadataListed),
   authenticationProbeCalled:false,authenticationVerified:false,
   note:'Read-only isolated Worker metadata; authentication and Google delivery unverified.'
  };
  if(!out.status)throw Error('INVALID_INSPECTOR_RESULT');
  return Object.freeze(requireSafeEvidence(kind,out));
 }
 if(kind==='host'){
  const out={
   ...base(value),status:choose(value.status,'statusHost'),
   accountReadHttpStatus:http(value.accountReadHttpStatus),
   scriptReadHttpStatus:http(value.scriptReadHttpStatus),
   accountSubdomainValid:bool(value.accountSubdomainValid),
   runnerWorkersDevEnabled:bool(value.runnerWorkersDevEnabled),
   accountHostMetadataVerified:bool(value.accountHostMetadataVerified),
   authenticatedProbeCalled:false,ownerSecretSent:false,
   note:'Workers.dev ownership metadata only; no owner credential sent.'
  };
  if(!out.status)throw Error('INVALID_INSPECTOR_RESULT');
  return Object.freeze(requireSafeEvidence(kind,out));
 }
 throw Error('UNKNOWN_INSPECTOR_KIND');
}

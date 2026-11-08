// Inspect the *metadata* of two fixed Cloudflare quality Workers.
// Never read secrets, fetch Worker source code, invoke Vault OAuth, call
// Google/Gmail, or change deployed settings. Never return provider payloads.
import {assessVaultUpdateSafety} from './vault-update-safety.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const ROOT='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts/';
const RUNNER='ner-ldb-runner-quality', VAULT='ner-ldb-google-vault-quality';
const PROBE_RUNNER='ner-ldb-runner-binding-probe', PROBE_VAULT='ner-ldb-vault-binding-probe';
const MAX_JSON_BYTES=131072;
const fail=()=>{throw Error('VAULT_METADATA_READ_UNAVAILABLE');};
async function getMetadata(fetcher,token,name){
 const url=ROOT+name+'/settings';
 let response;
 try{response=await fetcher(url,{
  method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
  redirect:'error',signal:AbortSignal.timeout(15000)
 });}catch{return {httpStatus:null,settings:null};}
 if(!response||response.status!==200)return {
  httpStatus:Number.isInteger(response?.status)?response.status:null,settings:null
 };
 try{
  if(!response.body||typeof response.body.getReader!=='function')fail();
  const reader=response.body.getReader(),chunks=[];let bytes=0;
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   bytes+=value.length;
   if(bytes>MAX_JSON_BYTES){await reader.cancel();fail();}
   chunks.push(Buffer.from(value));
  }
  const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(data?.success!==true||!Array.isArray(data?.result?.bindings))
   return {httpStatus:200,settings:null};
  return {httpStatus:200,settings:data.result};
 }catch{return {httpStatus:200,settings:null};}
}
// Only fixed safe classifications are returned to the browser. Never
// return a binding payload, unknown text value, target, or secret.
export function classifyVaultFlag(bindings,name){
 if(!Array.isArray(bindings))return 'METADATA_UNAVAILABLE';
 const hits=bindings.filter(b=>b?.name===name);
 if(hits.length===0)return 'MISSING';
 if(hits.length!==1)return 'DUPLICATE';
 if(hits[0].type!=='plain_text')return 'WRONG_TYPE';
 if(hits[0].text==='false')return 'EXPLICIT_FALSE';
 if(hits[0].text==='true')return 'EXPLICIT_TRUE';
 return 'UNEXPECTED_VALUE';
}
export function classifyVaultServiceBinding(bindings,expectedTarget=VAULT,{allowProductionEnvironment=false}={}){
 if(!Array.isArray(bindings))return 'METADATA_UNAVAILABLE';
 const hits=bindings.filter(b=>b?.name==='GOOGLE_VAULT');
 if(hits.length===0)return 'MISSING';
 if(hits.length!==1)return 'DUPLICATE';
 if(hits[0].type!=='service')return 'WRONG_TYPE';
 if(hits[0].service!==expectedTarget)return 'WRONG_TARGET';
 // The API can report an explicit "production" target environment for
 // a default-deployed Worker. Accept it ONLY for the fixed isolated Vault
 // target; all other scoped environments and custom entrypoints stay blocked.
 if(hits[0].entrypoint!==undefined&&hits[0].entrypoint!=='')
  return 'NONDEFAULT_ENTRYPOINT';
 if(hits[0].environment!==undefined&&hits[0].environment!==''){
  if(!(allowProductionEnvironment===true&&hits[0].environment==='production'))
   return 'ENVIRONMENT_SCOPED';
 }
 return 'TARGET_MATCH';
}
const stateBoolean=state=>state==='EXPLICIT_FALSE'?true:
 state==='EXPLICIT_TRUE'?false:null;

// Only inspect existing Worker settings metadata. In particular DO NOT
// call Cloudflare's separate /secrets endpoint: its documented schema may
// contain secret text. Never copy a binding object into the response.
export function classifyProbeSecretMetadata(bindings,name){
 if(!Array.isArray(bindings))return 'SETTINGS_UNAVAILABLE';
 const hits=bindings.filter(b=>b?.name===name);
 if(hits.length===0)return 'NOT_LISTED_IN_SETTINGS';
 if(hits.length!==1)return 'DUPLICATE_BINDING';
 return hits[0].type==='secret_text'?
  'SECRET_BINDING_LISTED':'UNEXPECTED_BINDING_TYPE';
}
const probeSecretSummary=states=>{
 const values=Object.values(states);
 if(values.every(v=>v==='SECRET_BINDING_LISTED'))
  return 'SECRET_BINDINGS_LISTED_UNVERIFIED';
 if(values.includes('DUPLICATE_BINDING')||
    values.includes('UNEXPECTED_BINDING_TYPE'))
  return 'INVALID_PROBE_SECRET_BINDINGS';
 if(values.includes('SETTINGS_UNAVAILABLE'))
  return 'SECRET_BINDING_METADATA_UNAVAILABLE';
 return 'SECRET_BINDINGS_NOT_LISTED_IN_SETTINGS';
};

export async function inspectLdbCloudflareVaultWiring({
 accountId,token,fetcher=fetch
}={}){
 if(accountId!==ACCOUNT||typeof token!=='string'||token.length<20||/\s/.test(token))
  fail();
 if(typeof fetcher!=='function')fail();
 const [runner,vault]=await Promise.all([
  getMetadata(fetcher,token,RUNNER),getMetadata(fetcher,token,VAULT)
 ]);
 const bindings=runner.settings?.bindings, vaultBindings=vault.settings?.bindings;
 const serviceBindingState=classifyVaultServiceBinding(bindings);
 const runnerDeliveryState=classifyVaultFlag(bindings,'DELIVERY_BRIDGE_ENABLED');
 const vaultDeliveryState=classifyVaultFlag(vaultBindings,'DELIVERY_BRIDGE_ENABLED');
 const vaultOAuthState=classifyVaultFlag(vaultBindings,'VAULT_ENABLED');
 const serviceBindingVerified=serviceBindingState==='TARGET_MATCH';
 const runnerDeliveryDisabled=stateBoolean(runnerDeliveryState);
 const vaultDeliveryDisabled=stateBoolean(vaultDeliveryState);
 const vaultOAuthDisabled=stateBoolean(vaultOAuthState);
 const updateSafety=assessVaultUpdateSafety(vaultBindings);
 const ready=runner.settings!==null&&vault.settings!==null&&serviceBindingVerified&&
  runnerDeliveryDisabled===true&&vaultDeliveryDisabled===true&&vaultOAuthDisabled===true;
 return Object.freeze({
  status:ready?'CLOUDFLARE_WIRING_METADATA_MATCHES_OFF':'CLOUDFLARE_WIRING_NOT_VERIFIED',
  runnerSettingsHttpStatus:runner.httpStatus,vaultSettingsHttpStatus:vault.httpStatus,
  runnerWorkerFound:runner.settings!==null,vaultWorkerFound:vault.settings!==null,
  serviceBindingMetadataMatches:serviceBindingVerified,
  serviceBindingState,runnerDeliveryState,vaultDeliveryState,vaultOAuthState,
  runnerDeliveryDisabled,vaultDeliveryDisabled,vaultOAuthDisabled,
  vaultUpdateSafetyStatus:updateSafety.status,
  vaultUpdateEligibleForReviewedUpdate:updateSafety.eligibleForReviewedUpdate,
  liveServiceBindingProbed:false,
  driveConnectionVerified:false,gmailConnectionVerified:false,
  driveFilesVerified:0,gmailMilestonesVerified:0,
  productionReady:false,googleApiCalled:false,gmailApiCalled:false,
  inferenceCalled:false,workerModified:false,
  note:'Read-only Cloudflare settings inspection only. Matching metadata is not a working service-binding probe, Vault connection, OAuth authentication or real Google delivery.'
 });
}

// Independent metadata audit of the two already-listed isolated test
// Workers. Exactly two additional Cloudflare GET requests; no live test,
// Worker mutation, AI binding execution, OAuth call or secret inspection.
export async function inspectLdbIsolatedProbeWiring({
 accountId,token,fetcher=fetch
}={}){
 if(accountId!==ACCOUNT||typeof token!=='string'||token.length<20||
    /\s/.test(token)||typeof fetcher!=='function')fail();
 const [runner,vault]=await Promise.all([
  getMetadata(fetcher,token,PROBE_RUNNER),
  getMetadata(fetcher,token,PROBE_VAULT)
 ]);
 const rb=runner.settings?.bindings, vb=vault.settings?.bindings;
 const runnerChecks=Object.freeze({
  RUNNER_ENABLED:classifyVaultFlag(rb,'RUNNER_ENABLED'),
  FREE_PLAN_CONFIRMED:classifyVaultFlag(rb,'FREE_PLAN_CONFIRMED'),
  DELIVERY_BRIDGE_ENABLED:classifyVaultFlag(rb,'DELIVERY_BRIDGE_ENABLED'),
  BRIDGE_PROBE_ENABLED:classifyVaultFlag(rb,'BRIDGE_PROBE_ENABLED')
 });
 const vaultChecks=Object.freeze({
  VAULT_ENABLED:classifyVaultFlag(vb,'VAULT_ENABLED'),
  DELIVERY_BRIDGE_ENABLED:classifyVaultFlag(vb,'DELIVERY_BRIDGE_ENABLED'),
  BRIDGE_PROBE_ENABLED:classifyVaultFlag(vb,'BRIDGE_PROBE_ENABLED')
 });
 const serviceBindingState=classifyVaultServiceBinding(rb,PROBE_VAULT,{
  allowProductionEnvironment:true
 });
 const serviceEnvironment=Array.isArray(rb)?rb.filter(b=>b?.name==='GOOGLE_VAULT'):
  [];
 const serviceEnvironmentState=serviceEnvironment.length!==1?'UNVERIFIED':
  serviceEnvironment[0].environment==='production'?'PRODUCTION':
  serviceEnvironment[0].environment===undefined||serviceEnvironment[0].environment===''?
   'UNSPECIFIED':'OTHER';
 const secretStates=Object.freeze({
  runnerOwnerSecret:classifyProbeSecretMetadata(rb,'RUNNER_SECRET'),
  runnerSharedSecret:classifyProbeSecretMetadata(rb,'GOOGLE_BRIDGE_PROBE_SECRET'),
  vaultSharedSecret:classifyProbeSecretMetadata(vb,'GOOGLE_BRIDGE_PROBE_SECRET')
 });
 const authSetupStatus=probeSecretSummary(secretStates);
 const allowedRunner=new Set([
  'GOOGLE_VAULT','LDB_COORDINATOR','CLOUDFLARE_ACCOUNT_ID',
  'RUNNER_SECRET','GOOGLE_BRIDGE_PROBE_SECRET',...Object.keys(runnerChecks)
 ]);
 const allowedVault=new Set([
  'GOOGLE_VAULT','GOOGLE_BRIDGE_PROBE_SECRET',...Object.keys(vaultChecks)
 ]);
 const extras= (bindings,allowed)=>!Array.isArray(bindings)?null:
  bindings.some(b=>typeof b?.name!=='string'||!allowed.has(b.name));
 const unexpectedRunnerBindings=extras(rb,allowedRunner);
 const unexpectedVaultBindings=extras(vb,allowedVault);
 const namespace=(bindings,name,cls)=>{
  if(!Array.isArray(bindings))return 'METADATA_UNAVAILABLE';
  const rows=bindings.filter(b=>b?.name===name);
  if(rows.length===0)return 'MISSING';
  if(rows.length!==1)return 'DUPLICATE';
  if(rows[0].type!=='durable_object_namespace'||rows[0].class_name!==cls)
   return 'WRONG_TYPE_OR_CLASS';
  return 'EXPECTED_CLASS';
 };
 const runnerNamespace=namespace(rb,'LDB_COORDINATOR','LdbCoordinator');
 const vaultNamespace=namespace(vb,'GOOGLE_VAULT','LdbGoogleVault');
 const account=Array.isArray(rb)?rb.filter(b=>b?.name==='CLOUDFLARE_ACCOUNT_ID'):[];
 const accountFlagMatches=account.length===1&&account[0].type==='plain_text'&&
  account[0].text===ACCOUNT;
 const flagsMatch=runnerChecks.RUNNER_ENABLED==='EXPLICIT_FALSE'&&
  runnerChecks.FREE_PLAN_CONFIRMED==='EXPLICIT_FALSE'&&
  runnerChecks.DELIVERY_BRIDGE_ENABLED==='EXPLICIT_FALSE'&&
  runnerChecks.BRIDGE_PROBE_ENABLED==='EXPLICIT_TRUE'&&
  vaultChecks.VAULT_ENABLED==='EXPLICIT_FALSE'&&
  vaultChecks.DELIVERY_BRIDGE_ENABLED==='EXPLICIT_FALSE'&&
  vaultChecks.BRIDGE_PROBE_ENABLED==='EXPLICIT_TRUE';
 const matches=runner.settings!==null&&vault.settings!==null&&
  serviceBindingState==='TARGET_MATCH'&&
  runnerNamespace==='EXPECTED_CLASS'&&vaultNamespace==='EXPECTED_CLASS'&&
  accountFlagMatches&&flagsMatch&&
  authSetupStatus!=='INVALID_PROBE_SECRET_BINDINGS'&&
  unexpectedRunnerBindings===false&&unexpectedVaultBindings===false;
 return Object.freeze({
  status:matches?'ISOLATED_PROBE_METADATA_MATCHES_SAFE':'ISOLATED_PROBE_METADATA_NOT_VERIFIED',
  runnerSettingsHttpStatus:runner.httpStatus,
  vaultSettingsHttpStatus:vault.httpStatus,
  runnerWorkerMetadataFound:runner.settings!==null,
  vaultWorkerMetadataFound:vault.settings!==null,
  serviceBindingState,serviceEnvironmentState,runnerNamespace,vaultNamespace,
  runnerChecks,vaultChecks,accountFlagMatches,
  unexpectedRunnerBindings,unexpectedVaultBindings,
  authSetupStatus,secretStates,
  authSetupMetadataListed:matches&&authSetupStatus==='SECRET_BINDINGS_LISTED_UNVERIFIED',
  authenticationProbeCalled:false,authenticationVerified:false,
  googleApiCalled:false,gmailApiCalled:false,inferenceCalled:false,
  workerModified:false,productionReady:false,
  note:'Worker settings metadata only. A correct binding definition does NOT prove authenticated service-to-service transport.'
 });
}

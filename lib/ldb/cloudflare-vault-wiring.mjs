// Inspect the *metadata* of two fixed Cloudflare quality Workers.
// Never read secrets, fetch Worker source code, invoke Vault OAuth, call
// Google/Gmail, or change deployed settings. Never return provider payloads.
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const ROOT='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts/';
const RUNNER='ner-ldb-runner-quality', VAULT='ner-ldb-google-vault-quality';
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
export function classifyVaultServiceBinding(bindings){
 if(!Array.isArray(bindings))return 'METADATA_UNAVAILABLE';
 const hits=bindings.filter(b=>b?.name==='GOOGLE_VAULT');
 if(hits.length===0)return 'MISSING';
 if(hits.length!==1)return 'DUPLICATE';
 if(hits[0].type!=='service')return 'WRONG_TYPE';
 if(hits[0].service!==VAULT)return 'WRONG_TARGET';
 if(hits[0].environment!==undefined&&hits[0].environment!=='')return 'ENVIRONMENT_SCOPED';
 return 'TARGET_MATCH';
}
const stateBoolean=state=>state==='EXPLICIT_FALSE'?true:
 state==='EXPLICIT_TRUE'?false:null;

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
 const ready=runner.settings!==null&&vault.settings!==null&&serviceBindingVerified&&
  runnerDeliveryDisabled===true&&vaultDeliveryDisabled===true&&vaultOAuthDisabled===true;
 return Object.freeze({
  status:ready?'CLOUDFLARE_WIRING_METADATA_MATCHES_OFF':'CLOUDFLARE_WIRING_NOT_VERIFIED',
  runnerSettingsHttpStatus:runner.httpStatus,vaultSettingsHttpStatus:vault.httpStatus,
  runnerWorkerFound:runner.settings!==null,vaultWorkerFound:vault.settings!==null,
  serviceBindingMetadataMatches:serviceBindingVerified,
  serviceBindingState,runnerDeliveryState,vaultDeliveryState,vaultOAuthState,
  runnerDeliveryDisabled,vaultDeliveryDisabled,vaultOAuthDisabled,
  liveServiceBindingProbed:false,
  driveConnectionVerified:false,gmailConnectionVerified:false,
  driveFilesVerified:0,gmailMilestonesVerified:0,
  productionReady:false,googleApiCalled:false,gmailApiCalled:false,
  inferenceCalled:false,workerModified:false,
  note:'Read-only Cloudflare settings inspection only. Matching metadata is not a working service-binding probe, Vault connection, OAuth authentication or real Google delivery.'
 });
}

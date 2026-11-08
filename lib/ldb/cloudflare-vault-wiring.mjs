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
const plain=(bindings,name)=>{
 const candidates=bindings.filter(b=>b?.name===name);
 return candidates.length===1&&candidates[0].type==='plain_text'?
  candidates[0].text=== 'false'?true:false:null;
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
 const rb=runner.settings?.bindings, vb=vault.settings?.bindings;
 const bindings=Array.isArray(rb)?rb:[], vaultBindings=Array.isArray(vb)?vb:[];
 const service=bindings.filter(b=>b?.name==='GOOGLE_VAULT');
 const serviceBindingVerified=runner.settings!==null&&service.length===1&&
  service[0].type==='service'&&service[0].service===VAULT;
 const runnerDeliveryDisabled=runner.settings?plain(bindings,'DELIVERY_BRIDGE_ENABLED'):null;
 const vaultDeliveryDisabled=vault.settings?plain(vaultBindings,'DELIVERY_BRIDGE_ENABLED'):null;
 const vaultOAuthDisabled=vault.settings?plain(vaultBindings,'VAULT_ENABLED'):null;
 const ready=runner.settings!==null&&vault.settings!==null&&serviceBindingVerified&&
  runnerDeliveryDisabled===true&&vaultDeliveryDisabled===true&&vaultOAuthDisabled===true;
 return Object.freeze({
  status:ready?'CLOUDFLARE_WIRING_METADATA_MATCHES_OFF':'CLOUDFLARE_WIRING_NOT_VERIFIED',
  runnerSettingsHttpStatus:runner.httpStatus,vaultSettingsHttpStatus:vault.httpStatus,
  runnerWorkerFound:runner.settings!==null,vaultWorkerFound:vault.settings!==null,
  serviceBindingMetadataMatches:serviceBindingVerified,
  runnerDeliveryDisabled,vaultDeliveryDisabled,vaultOAuthDisabled,
  liveServiceBindingProbed:false,
  driveConnectionVerified:false,gmailConnectionVerified:false,
  driveFilesVerified:0,gmailMilestonesVerified:0,
  productionReady:false,googleApiCalled:false,gmailApiCalled:false,
  inferenceCalled:false,workerModified:false,
  note:'Read-only Cloudflare settings inspection only. Matching metadata is not a working service-binding probe, Vault connection, OAuth authentication or real Google delivery.'
 });
}

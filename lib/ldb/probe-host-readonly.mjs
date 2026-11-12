// Fixed-target Cloudflare workers.dev host ownership preflight.
// Used by the preview UI only: two GETs, no Worker invocation or secret read.
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const RUNNER='ner-ldb-runner-binding-probe';
const ROOT='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT;
const MAX_JSON_BYTES=8192;
const validSubdomain=x=>typeof x==='string'&&
 /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(x);
async function read(fetcher,token,url){
 let response;
 try{response=await fetcher(url,{
  method:'GET',redirect:'error',
  headers:{Authorization:'Bearer '+token,Accept:'application/json'},
  signal:AbortSignal.timeout(12000)
 });}catch{return {status:null,data:null};}
 if(!response||response.status!==200)return {
  status:Number.isInteger(response?.status)?response.status:null,data:null
 };
 try{
  const reader=response.body?.getReader?.();
  if(!reader)return {status:200,data:null};
  let total=0;const chunks=[];
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>MAX_JSON_BYTES){await reader.cancel();return {status:200,data:null};}
   chunks.push(Buffer.from(value));
  }
  const envelope=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(envelope?.success!==true||!envelope.result||
     typeof envelope.result!=='object'||Array.isArray(envelope.result))
   return {status:200,data:null};
  return {status:200,data:envelope.result};
 }catch{return {status:200,data:null};}
}
export async function inspectLdbProbeHost({
 accountId,token,fetcher=fetch
}={}){
 if(accountId!==ACCOUNT||typeof token!=='string'||token.length<20||
    /\s/.test(token)||typeof fetcher!=='function')
  throw Error('PROBE_HOST_METADATA_CONFIGURATION_REQUIRED');
 const [account,script]=await Promise.all([
  read(fetcher,token,ROOT+'/workers/subdomain'),
  read(fetcher,token,ROOT+'/workers/scripts/'+RUNNER+'/subdomain')
 ]);
 const accountSubdomainValid=account.data?validSubdomain(account.data.subdomain):null;
 const runnerWorkersDevEnabled=script.data&&typeof script.data.enabled==='boolean'?
  script.data.enabled:null;
 const verified=accountSubdomainValid===true&&runnerWorkersDevEnabled===true;
 return Object.freeze({
  status:verified?'PROBE_HOST_METADATA_READY':'PROBE_HOST_METADATA_NOT_VERIFIED',
  accountReadHttpStatus:account.status,
  scriptReadHttpStatus:script.status,
  accountSubdomainValid,runnerWorkersDevEnabled,
  accountHostMetadataVerified:verified,
  authenticatedProbeCalled:false,ownerSecretSent:false,
  productionReady:false,workerModified:false,
  inferenceCalled:false,googleApiCalled:false,gmailApiCalled:false,
  note:'Account-level workers.dev subdomain and isolated Worker publishing metadata only. No authenticated Worker GET or Google delivery.'
 });
}

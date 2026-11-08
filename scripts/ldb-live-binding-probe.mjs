// Operator-only authenticated GET. Before ANY runner Bearer secret is sent,
// prove the workers.dev host belongs to the fixed Cloudflare account, and
// check isolated Runner/Vault deployment safety using GET-only metadata.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectLdbIsolatedProbeWiring} from '../lib/ldb/cloudflare-vault-wiring.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const API='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT;
const RUNNER='ner-ldb-runner-binding-probe';
const fail=code=>{throw Error(code)};
const MAX_RESPONSE=8192;
function parseProbeUrl(url){
 let u;
 try{u=new URL(url);}catch{fail('INVALID_PROBE_URL')}
 if(u.protocol!=='https:'||
    !/^ner-ldb-runner-binding-probe\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||
    u.pathname!=='/delivery-bridge-probe'||
    u.search||u.hash||u.port||u.username||u.password)fail('UNSAFE_PROBE_URL');
 return u;
}
async function parseBoundedJson(response){
 if(!response?.body||typeof response.body.getReader!=='function')fail('PROBE_RESPONSE_INVALID');
 const reader=response.body.getReader(),parts=[];
 let size=0;
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;
   if(size>MAX_RESPONSE){await reader.cancel();fail('PROBE_RESPONSE_INVALID')}
   parts.push(Buffer.from(value));
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
 }catch{fail('PROBE_RESPONSE_INVALID')}
}
async function readCloudflare({url,token,fetcher}){
 if(url!==API+'/workers/subdomain'&&
    url!==API+'/workers/scripts/'+RUNNER+'/subdomain')
  fail('UNAPPROVED_CLOUDFLARE_URL');
 let response;
 try{response=await fetcher(url,{
  method:'GET',redirect:'error',headers:{
   Authorization:'Bearer '+token,Accept:'application/json'
  },signal:AbortSignal.timeout(12000)
 });}catch{fail('PROBE_PROVIDER_PRECHECK_UNAVAILABLE')}
 if(response?.status!==200)fail('PROBE_PROVIDER_PRECHECK_UNAVAILABLE');
 const data=await parseBoundedJson(response);
 if(data?.success!==true||!data.result||
    typeof data.result!=='object'||Array.isArray(data.result))
  fail('PROBE_PROVIDER_PRECHECK_UNAVAILABLE');
 return data.result;
}
export async function verifyLiveBindingProbe({
 url,secret,verifiedHost,fetcher=globalThis.fetch
}={}){
 const u=parseProbeUrl(url);
 // A correctly named Worker under an ATTACKER'S workers.dev subdomain
 // MUST NOT receive the owner Bearer secret.
 if(typeof verifiedHost!=='string'||u.hostname!==verifiedHost)
  fail('UNVERIFIED_PROBE_ACCOUNT_HOST');
 if(typeof secret!=='string'||secret.length<32||/\r|\n/.test(secret))
  fail('PROBE_SECRET_REQUIRED');
 let response,body;
 try{response=await fetcher(u.toString(),{
  method:'GET',redirect:'manual',
  headers:{Authorization:'Bearer '+secret,Accept:'application/json'},
  signal:AbortSignal.timeout(12000)
 });}catch{fail('PROBE_TRANSPORT_UNAVAILABLE')}
 if(response?.status!==200)fail('PROBE_NOT_AUTHENTICATED');
 body=await parseBoundedJson(response);
 if(!body||body.status!=='BRIDGE_AUTHENTICATED'||
    body.productionReady!==false||
    Object.keys(body).sort().join(',')!=='productionReady,status')
  fail('PROBE_RESPONSE_INVALID');
 return Object.freeze({status:'BRIDGE_AUTHENTICATED',productionReady:false});
}
export async function runOwnerVerifiedBindingProbe({
 env=process.env,fetcher=globalThis.fetch
}={}){
 // This CLI does not run in Vercel, public Studio, GitHub CI or any
 // job without independently provisioned, trusted local credentials.
 if(env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||
    typeof env.CLOUDFLARE_API_TOKEN!=='string'||
    env.CLOUDFLARE_API_TOKEN.length<20||
    /\s/.test(env.CLOUDFLARE_API_TOKEN)||typeof fetcher!=='function')
  fail('PROBE_CLOUDFLARE_READ_TOKEN_REQUIRED');
 const u=parseProbeUrl(env.LDB_PROBE_URL);
 const ownerSecret=env.LDB_RUNNER_SECRET;
 if(typeof ownerSecret!=='string'||ownerSecret.length<32||
    /\r|\n/.test(ownerSecret))fail('PROBE_SECRET_REQUIRED');
 // Metadata is verified BEFORE a secret-bearing request to the Worker.
 const safety=await inspectLdbIsolatedProbeWiring({
  accountId:ACCOUNT,token:env.CLOUDFLARE_API_TOKEN,fetcher
 });
 if(safety.status!=='ISOLATED_PROBE_METADATA_MATCHES_SAFE'||
    safety.authenticationVerified!==false||
    safety.workerModified!==false||
    safety.productionReady!==false)
  fail('PROBE_DEPLOYED_SETTINGS_NOT_SAFE');
 const [account,script]=await Promise.all([
  readCloudflare({url:API+'/workers/subdomain',
   token:env.CLOUDFLARE_API_TOKEN,fetcher}),
  readCloudflare({url:API+'/workers/scripts/'+RUNNER+'/subdomain',
   token:env.CLOUDFLARE_API_TOKEN,fetcher})
 ]);
 if(typeof account.subdomain!=='string'||
    !/^[a-z0-9-]+$/.test(account.subdomain)||
    script.enabled!==true)
  fail('PROBE_ACCOUNT_HOST_NOT_VERIFIED');
 const expectedHost=RUNNER+'.'+account.subdomain+'.workers.dev';
 if(u.hostname!==expectedHost)fail('UNVERIFIED_PROBE_ACCOUNT_HOST');
 const verified=await verifyLiveBindingProbe({
  url:u.toString(),secret:ownerSecret,verifiedHost:expectedHost,fetcher
 });
 return Object.freeze({
  ...verified,hostOwnershipVerified:true,workerMetadataVerified:true,
  googleConnectionVerified:false,gmailConnectionVerified:false,
  inferenceCalled:false,workerModified:false
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 // Deliberate opt-in: CI, preinstall hooks and unattended terminals cannot
 // trigger a secret-bearing live request merely by importing this module.
 if(!process.argv.includes('--owner-approved-readonly-probe')){
  console.error('OWNER_APPROVAL_FLAG_REQUIRED: no network request made.');
  process.exitCode=1;
 }else try{
  await runOwnerVerifiedBindingProbe();
  console.log('PASS: isolated Worker-to-Worker authentication verified. Google, AI and production remain OFF.');
 }catch(e){
  const code=typeof e?.message==='string'&&/^[A-Z_]+$/.test(e.message)?
   e.message:'PROBE_VERIFICATION_FAILED';
  console.error('FAIL: '+code+'. No production readiness claim.');
  process.exitCode=1;
 }
}

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
// Match the strict Cloudflare host inspector: one DNS label, 1–63 chars,
// alphanumeric ends; no empty, leading/trailing hyphen or multi-label input.
const validSubdomain=x=>typeof x==='string'&&
 /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(x);
function parseProbeUrl(url){
 let u;
 try{u=new URL(url);}catch{fail('INVALID_PROBE_URL')}
 const suffix='.workers.dev',prefix=RUNNER+'.';
 const subdomain=u.hostname.startsWith(prefix)&&u.hostname.endsWith(suffix)?
  u.hostname.slice(prefix.length,-suffix.length):null;
 if(u.protocol!=='https:'||!validSubdomain(subdomain)||
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
  headers:{Authorization:'Bearer '+secret,Accept:'application/json',
   'Cache-Control':'no-store'},cache:'no-store',
  signal:AbortSignal.timeout(12000)
 });}catch{fail('PROBE_TRANSPORT_UNAVAILABLE')}
 if(response?.status!==200)fail('PROBE_NOT_AUTHENTICATED');
 // A reused/cached JSON acknowledgement is not acceptable as a fresh
 // owner-authorized service-binding check. The isolated Worker returns
 // Response.json with Cache-Control: no-store by contract.
 const headers=response.headers;
 if(!headers||typeof headers.get!=='function'||
    !/^application\/json(?:\s*;.*)?$/i.test(headers.get('content-type')||'')||
    !/(?:^|,)\s*no-store(?:\s*,|$)/i.test(headers.get('cache-control')||''))
  fail('PROBE_RESPONSE_INVALID');
 body=await parseBoundedJson(response);
 if(!body||body.status!=='BRIDGE_AUTHENTICATED'||
    body.productionReady!==false||
    Object.keys(body).sort().join(',')!=='productionReady,status')
  fail('PROBE_RESPONSE_INVALID');
 return Object.freeze({status:'BRIDGE_AUTHENTICATED',productionReady:false});
}
// Metadata-only opt-in step. Does NOT read LDB_RUNNER_SECRET, issue an
// authenticated Runner request, use Google OAuth or activate any Worker.
// Keep the exact account/hostname preflight shared with the full owner probe.
export async function runOwnerReadOnlyBindingPreflight({
 env=process.env,fetcher=globalThis.fetch
}={}){
 if(env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||
    typeof env.CLOUDFLARE_API_TOKEN!=='string'||
    env.CLOUDFLARE_API_TOKEN.length<20||
    /\s/.test(env.CLOUDFLARE_API_TOKEN)||typeof fetcher!=='function')
  fail('PROBE_CLOUDFLARE_READ_TOKEN_REQUIRED');
 const u=parseProbeUrl(env.LDB_PROBE_URL);
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
 if(!validSubdomain(account.subdomain)||script.enabled!==true)
  fail('PROBE_ACCOUNT_HOST_NOT_VERIFIED');
 const verifiedHost=RUNNER+'.'+account.subdomain+'.workers.dev';
 if(u.hostname!==verifiedHost)fail('UNVERIFIED_PROBE_ACCOUNT_HOST');
 return Object.freeze({
  status:'OWNER_PREFLIGHT_VERIFIED',
  verifiedHost,hostOwnershipVerified:true,workerMetadataVerified:true,
  ownerSecretSent:false,authenticationVerified:false,
  googleConnectionVerified:false,gmailConnectionVerified:false,
  inferenceCalled:false,workerModified:false,productionReady:false
 });
}
export async function runOwnerVerifiedBindingProbe({
 env=process.env,fetcher=globalThis.fetch
}={}){
 // A missing owner secret must not result in any authenticated request.
 const ownerSecret=env?.LDB_RUNNER_SECRET;
 if(typeof ownerSecret!=='string'||ownerSecret.length<32||
    /\r|\n/.test(ownerSecret))fail('PROBE_SECRET_REQUIRED');
 // The Cloudflare control-plane token must NEVER be passed to a Worker host
 // as an application-level Bearer credential, even on a verified account.
 // Fail before the metadata preflight or any owner-secret transmission.
 if(ownerSecret===env?.CLOUDFLARE_API_TOKEN)
  fail('PROBE_SECRET_REUSE_FORBIDDEN');
 const preflight=await runOwnerReadOnlyBindingPreflight({env,fetcher});
 const verified=await verifyLiveBindingProbe({
  url:env.LDB_PROBE_URL,secret:ownerSecret,
  verifiedHost:preflight.verifiedHost,fetcher
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
 const full=process.argv.includes('--owner-approved-readonly-probe');
 const metadata=process.argv.includes('--owner-approved-readonly-preflight');
 if(full===metadata){
  console.error('OWNER_APPROVAL_FLAG_REQUIRED: select exactly one read-only mode; no network request made.');
  process.exitCode=1;
 }else try{
  if(metadata){
   await runOwnerReadOnlyBindingPreflight();
   console.log('PASS: isolated Cloudflare account/Worker/host metadata verified. Owner authentication NOT tested. No Runner secret sent.');
  }else{
   await runOwnerVerifiedBindingProbe();
   console.log('PASS: isolated Worker-to-Worker authentication verified. Google, AI and production remain OFF.');
  }
 }catch(e){
  const code=typeof e?.message==='string'&&/^[A-Z_]+$/.test(e.message)?
   e.message:'PROBE_VERIFICATION_FAILED';
  console.error('FAIL: '+code+'. No production readiness claim.');
  process.exitCode=1;
 }
}

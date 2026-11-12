// Owner-auth-free diagnostic of the fixed isolated Runner. No secrets sent
// to the Worker. Never read Worker source, Vault or provider responses.
import {runOwnerReadOnlyBindingPreflight} from '../../scripts/ldb-live-binding-probe.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const BASE='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT;
const RUNNER='ner-ldb-runner-binding-probe';
const valid=s=>typeof s==='string'&&/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s);
const output=(status,fields={})=>Object.freeze({
 status,ownerSecretSent:false,authVerified:false,productionReady:false,
 inferenceCalled:false,workerModified:false,googleApiCalled:false,
 gmailApiCalled:false,...fields
});
export async function inspectIsolatedRunnerAnonymousGate({
 accountId,token,fetcher=globalThis.fetch
}={}){
 if(accountId!==ACCOUNT||typeof token!=='string'||token.length<20||
    /\s/.test(token)||typeof fetcher!=='function')
  return output('METADATA_NOT_CONFIGURED');
 let url;
 try{
  const r=await fetcher(BASE+'/workers/subdomain',{
   method:'GET',redirect:'error',signal:AbortSignal.timeout(12000),
   headers:{Authorization:'Bearer '+token,Accept:'application/json'}
  });
  if(r.status!==200)return output('CLOUDFLARE_ACCOUNT_UNAVAILABLE');
  const d=await r.json();
  if(d?.success!==true||!valid(d?.result?.subdomain))
   return output('CLOUDFLARE_ACCOUNT_UNVERIFIED');
  url='https://'+RUNNER+'.'+d.result.subdomain+'.workers.dev/delivery-bridge-probe';
 }catch{return output('CLOUDFLARE_ACCOUNT_UNAVAILABLE');}
 try{
  const preflight=await runOwnerReadOnlyBindingPreflight({
   env:{CLOUDFLARE_ACCOUNT_ID:ACCOUNT,CLOUDFLARE_API_TOKEN:token,
    LDB_PROBE_URL:url},
   fetcher
  });
  if(preflight.status!=='OWNER_PREFLIGHT_VERIFIED')
   return output('SAFETY_PREFLIGHT_UNVERIFIED');
 }catch(e){
  const reason=e?.message;
  const safe=new Set([
   'PROBE_DEPLOYED_SETTINGS_NOT_SAFE',
   'PROBE_PROVIDER_PRECHECK_UNAVAILABLE',
   'PROBE_VAULT_PUBLIC_ENDPOINT_UNSAFE',
   'PROBE_VAULT_CUSTOM_DOMAIN_UNSAFE',
   'PROBE_VAULT_DOMAINS_UNVERIFIED',
   'PROBE_ACCOUNT_HOST_NOT_VERIFIED',
   'UNVERIFIED_PROBE_ACCOUNT_HOST',
   'PROBE_RESPONSE_INVALID'
  ]);
  return output('SAFETY_PREFLIGHT_BLOCKED',{
   reason:safe.has(reason)?reason:'OTHER_PREFLIGHT_ERROR'
  });
 }
 // No Authorization or nonce. Worker must return 401 before any Vault
 // service binding is invoked. Read ONLY status and selected standard headers.
 try{
  const r=await fetcher(url,{method:'GET',redirect:'manual',cache:'no-store',
   headers:{Accept:'application/json','Cache-Control':'no-store'},
   signal:AbortSignal.timeout(12000)});
  if(r.status===401)return output('ANONYMOUS_GATE_EXPECTED_401',{runnerHttpStatus:401});
  if(r.status===503)return output('RUNNER_SETUP_UNAVAILABLE',{runnerHttpStatus:503});
  if(r.status===200)return output('UNAUTHENTICATED_ACCESS_UNEXPECTED',{runnerHttpStatus:200});
  if(r.status===403)return output('RUNNER_ACCESS_FORBIDDEN',{runnerHttpStatus:403});
  if(r.status===404)return output('RUNNER_ROUTE_NOT_FOUND',{runnerHttpStatus:404});
  return output('RUNNER_UNEXPECTED_HTTP_STATUS');
 }catch{return output('RUNNER_TRANSPORT_UNAVAILABLE');}
}

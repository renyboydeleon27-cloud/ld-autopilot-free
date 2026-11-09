'use strict';
// Owner-only, preview-only, one-shot bridge authentication check.
// Never persist or echo secrets. No deployment, AI, Drive or Gmail calls.
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const RUNNER='ner-ldb-runner-binding-probe';
const API='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/subdomain';
const validSubdomain=s=>typeof s==='string'&&/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s);
const result=(res,status,body)=>res.status(status).json({status:body,authenticationVerified:status===200,productionReady:false,googleApiCalled:false,gmailApiCalled:false,inferenceCalled:false});
async function ownedRunnerUrl(token,fetcher){
 const r=await fetcher(API,{method:'GET',redirect:'error',
  headers:{Authorization:'Bearer '+token,Accept:'application/json'},
  signal:AbortSignal.timeout(12000)});
 if(r.status!==200)throw Error('CLOUDFLARE_HOST_PRECHECK_BLOCKED');
 // Only a fixed account's workers.dev subdomain may be used as the target.
 const d=await r.json();
 if(d?.success!==true||!validSubdomain(d?.result?.subdomain))
  throw Error('CLOUDFLARE_HOST_PRECHECK_BLOCKED');
 return 'https://'+RUNNER+'.'+d.result.subdomain+'.workers.dev/delivery-bridge-probe';
}
function sameOrigin(req){
 const host=req.headers.host,origin=req.headers.origin;
 return typeof host==='string'&&/^[a-z0-9-]+\.vercel\.app$/.test(host)&&
  origin==='https://'+host&&
  (!req.headers['sec-fetch-site']||req.headers['sec-fetch-site']==='same-origin');
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Access-Control-Allow-Origin','none');
 res.setHeader('X-Robots-Tag','noindex');
 const env=process.env;
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance')
  return result(res,404,'PREVIEW_ONLY');
 if(req.method!=='POST')return result(res,405,'POST_REQUIRED');
 if(req.url!=='/api/ldb-delivery-readiness'||!sameOrigin(req))
  return result(res,403,'SAME_ORIGIN_REQUIRED');
 if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type']||''))
  return result(res,415,'JSON_REQUIRED');
 const body=req.body;
 if(!body||typeof body!=='object'||Array.isArray(body)||
    Object.keys(body).length!==1||typeof body.secret!=='string'||
    body.secret.length<32||body.secret.length>128||/[\r\n]/.test(body.secret))
  return result(res,400,'INVALID_OWNER_SECRET_INPUT');
 if(env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||typeof env.CLOUDFLARE_API_TOKEN!=='string'||
    env.CLOUDFLARE_API_TOKEN.length<20)
  return result(res,503,'CLOUDFLARE_PREFLIGHT_NOT_CONFIGURED');
 // Keep only the HTTP status of the exact fixed Runner GET. This lets the
 // owner distinguish a rejected owner credential (401) from a setup/bridge
 // failure (503), without reading response bodies or echoing any secret.
 let runnerStatus=null;
 try{
  const url=await ownedRunnerUrl(env.CLOUDFLARE_API_TOKEN,globalThis.fetch);
  const observedFetch=async(target,options)=>{
   const response=await globalThis.fetch(target,options);
   if(target===url&&options?.method==='GET')
    runnerStatus=Number.isInteger(response?.status)?response.status:null;
   return response;
  };
  const {runOwnerVerifiedBindingProbe}=await import('../../scripts/ldb-live-binding-probe.mjs');
  // Passed only to the fixed Cloudflare Runner after fresh live account,
  // Runner and Vault metadata checks. Never stored, logged or returned.
  const proof=await runOwnerVerifiedBindingProbe({env:{
    CLOUDFLARE_ACCOUNT_ID:ACCOUNT,
    CLOUDFLARE_API_TOKEN:env.CLOUDFLARE_API_TOKEN,
    LDB_PROBE_URL:url,
    LDB_RUNNER_SECRET:body.secret
  },fetcher:observedFetch});
  return result(res,proof.status==='BRIDGE_AUTHENTICATED'?200:503,
    proof.status==='BRIDGE_AUTHENTICATED'?'BRIDGE_AUTHENTICATED':'PROBE_NOT_VERIFIED');
 }catch(e){
  const reason=e?.message;
  // Only pre-approved static categories; never echo tokens, provider text or URLs.
  if(reason==='PROBE_NOT_AUTHENTICATED'){
   if(runnerStatus===401)return result(res,401,'RUNNER_SECRET_REJECTED');
   if(runnerStatus===503)return result(res,503,'RUNNER_OR_VAULT_UNAVAILABLE');
   return result(res,503,'PROBE_NOT_VERIFIED');
  }
  if(reason==='PROBE_SECRET_REQUIRED')
   return result(res,400,'INVALID_OWNER_SECRET_INPUT');
  if(reason==='PROBE_VAULT_CUSTOM_DOMAIN_UNSAFE'||
     reason==='PROBE_VAULT_DOMAINS_UNVERIFIED'||
     reason==='PROBE_DEPLOYED_SETTINGS_NOT_SAFE')
   return result(res,503,'CLOUDFLARE_SAFETY_PREFLIGHT_BLOCKED');
  return result(res,503,'PROBE_NOT_VERIFIED');
 }
};

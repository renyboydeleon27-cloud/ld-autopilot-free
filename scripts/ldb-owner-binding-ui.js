// Owner-triggered preview-only bridge check. No secret persistence or logging.
(()=>{'use strict';
 const input=document.getElementById('ownerBridgeSecret');
 const button=document.getElementById('ownerBridgeCheck');
 const status=document.getElementById('ownerBridgeStatus');
 if(!input||!button||!status)return;
 button.addEventListener('click',async()=>{
  if(button.disabled)return;
  const secret=input.value;
  // Clear the visible secret before the first asynchronous operation.
  input.value='';
  if(typeof secret!=='string'||secret.length<32||secret.length>128){
   status.textContent='Enter the RUNNER_SECRET you created in Cloudflare (32–128 characters).';
   return;
  }
  button.disabled=true;
  status.textContent='Checking the existing Runner → Vault connection (no uploads)…';
  try{
   const response=await fetch('/api/ldb-delivery-readiness',{
    method:'POST',credentials:'same-origin',redirect:'error',cache:'no-store',
    headers:{'Content-Type':'application/json',Accept:'application/json','X-LDB-Owner-Test':'1'},
    body:JSON.stringify({secret})
   });
   const data=await response.json();
   if(response.status===200&&data?.status==='BRIDGE_AUTHENTICATED'&&
      data.authenticationVerified===true&&data.productionReady===false&&
      data.googleApiCalled===false&&data.gmailApiCalled===false&&
      data.inferenceCalled===false){
    status.textContent='PASS: Runner → Vault authentication verified. Production, AI, Drive and Gmail remain OFF.';
   }else if(data?.status==='RUNNER_SECRET_REJECTED'){
    status.textContent='Cloudflare Runner returned 401: the RUNNER_SECRET entered was rejected. This is NOT the API token or the shared Vault secret. No other settings were changed.';
   }else if(data?.status==='RUNNER_OR_VAULT_UNAVAILABLE'){
    status.textContent='Cloudflare Runner returned 503: its configuration or private Vault connection is unavailable. This does NOT prove your RUNNER_SECRET is wrong. No production changes.';
   }else if(data?.status==='RUNNER_ROUTE_NOT_FOUND'){
    status.textContent='Runner returned HTTP 404: deployed endpoint not found after authentication. This needs a code/deployment fix, not a password change.';
   }else if(data?.status==='RUNNER_ACCESS_FORBIDDEN'){
    status.textContent='Runner returned HTTP 403: access blocked by Cloudflare. No password changes yet.';
   }else if(data?.status==='RUNNER_RATE_LIMITED'){
    status.textContent='Cloudflare returned HTTP 429: temporary rate limit. No secret changes.';
   }else if(data?.status==='RUNNER_ACK_INVALID'){
    status.textContent='Runner returned an invalid authentication acknowledgement. The server reply requires a code/configuration fix.';
   }else if(data?.status==='RUNNER_TRANSPORT_UNAVAILABLE'){
    status.textContent='The protected preview could not reach the authenticated Runner request. No Cloudflare changes.';
   }else if(data?.status==='CLOUDFLARE_PREFLIGHT_UNAVAILABLE'){
    status.textContent='Cloudflare preflight API unavailable. The owner secret was not sent to the Runner.';
   }else if(data?.status==='RUNNER_SECRET_MUST_NOT_BE_API_TOKEN'){
    status.textContent='Cloudflare API token cannot be used as RUNNER_SECRET. Do not paste the API token here.';
   }else if(data?.status==='RUNNER_UNEXPECTED_HTTP_RESPONSE'){
    status.textContent='Runner returned an unexpected HTTP response. Connection not verified.';
   }else if(data?.status==='CLOUDFLARE_SAFETY_PREFLIGHT_BLOCKED'){
    status.textContent='Cloudflare safety preflight blocked the test. No secret was sent to the Runner.';
   }else{
    status.textContent='Connection not verified ('+
     (['PREVIEW_ONLY','POST_REQUIRED','SAME_ORIGIN_REQUIRED','JSON_REQUIRED','INVALID_OWNER_SECRET_INPUT','CLOUDFLARE_PREFLIGHT_NOT_CONFIGURED','PROBE_NOT_VERIFIED'].includes(data?.status)?data.status:'UNAVAILABLE')+
     '). No production changes.';
   }
  }catch{
   status.textContent='Connection test unavailable. Nothing was uploaded or enabled.';
  }finally{button.disabled=false;}
 });
})();

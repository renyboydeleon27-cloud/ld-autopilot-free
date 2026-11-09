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

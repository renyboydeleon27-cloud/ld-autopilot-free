// LDB Auto Studio mobile status panel. One explicit GET, no AI calls.
(()=>{'use strict';
 const button=document.getElementById('cfCheck');
 const status=document.getElementById('cfStatus');
 const list=document.getElementById('cfDetails');
 if(!button||!status||!list)return;
 const show=lines=>{
  list.replaceChildren();
  for(const line of lines){
   const item=document.createElement('li');
   item.textContent=line;
   list.appendChild(item);
  }
 };
 button.addEventListener('click',async()=>{
  if(button.disabled)return;
  button.disabled=true;
  status.textContent='Checking Cloudflare read-only telemetry…';
  show([]);
  try{
   // Browser does not receive the API token. The Vercel function uses the
   // preview-only credential and never exposes an inference endpoint.
   const response=await fetch('/api/ldb-cloudflare-readiness',{
    method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',
    headers:{Accept:'application/json'}
   });
   if(!response.ok){
    status.textContent=response.status===404||response.status===401||response.status===403?
     'Live diagnostic is unavailable here. Open the protected development preview. Production remains NO-GO.':
     'Read-only diagnostic could not be completed. Production remains NO-GO.';
    return;
   }
   const data=await response.json();
   if(!data||data.inferenceCalled!==false||data.inferenceAuthorized!==false||
      data.productionAccepted!==false)throw Error('UNTRUSTED_DIAGNOSTIC');
   const verified=data.status==='READ_ONLY_TELEMETRY_CHECKED';
   status.textContent=verified?
    'Cloudflare usage telemetry checked. Production remains NO-GO.':
    'Cloudflare telemetry cannot be verified. Production remains NO-GO.';
   const lines=[];
   if(verified&&Number.isFinite(data.reportedNeuronsUsed)&&data.reportedNeuronsUsed>=0)
    lines.push('Reported neurons used today: '+data.reportedNeuronsUsed.toLocaleString('en-US')+
     ' (read-only snapshot, NOT billing approval).');
   if(data.billingReadStatus==='BILLING_READ_PERMISSION_REQUIRED')
    lines.push('Billing plan: UNVERIFIED — Cloudflare subscription access denied (HTTP 403). Confirm Workers Free in your dashboard.');
   else if(data.billingReadStatus==='PAID_WORKERS_SUBSCRIPTION_DETECTED')
    lines.push('Billing plan: Workers Paid indicated. Do NOT run a Free-only HOOK test.');
   else
    lines.push('Billing plan: UNVERIFIED — check Cloudflare dashboard manually.');
   if(data.existingV5Worker===true)
    lines.push('An existing V5 Worker needs owner review; no Worker will be deleted here.');
   else if(data.existingV5Worker===false)
    lines.push('Isolated V5 Worker: none reported.');
   else
    lines.push('V5 Worker inspection: unavailable.');
   if(typeof data.blocker==='string'&&/^[A-Z_]+$/.test(data.blocker))
    lines.push('Provider telemetry blocker: '+data.blocker);
   lines.push('HOOK V5, 17-image generation, Drive and Gmail remain OFF. This button only reads status.');
   show(lines);
  }catch{
   status.textContent='Read-only diagnostic unavailable or invalid. Production remains NO-GO.';
   show([]);
  }finally{
   button.disabled=false;
  }
 });
})();

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
   // The client only reports preflight evidence; it MUST NOT turn operator
   // screenshots or public quota estimates into permission to render.
   const usageEvidence=verified&&data.workersListHttpStatus===200&&
    data.graphqlSchemaHttpStatus===200&&data.usageHttpStatus===200&&
    Number.isFinite(data.reportedNeuronsUsed)&&data.reportedNeuronsUsed>=0;
   const bufferOk=data.hookV5BudgetStatus==='BUDGET_SPACE_ESTIMATED'&&
    Number.isFinite(data.hookV5EstimatedNeurons)&&data.hookV5EstimatedNeurons>0&&
    Number.isFinite(data.hookV5ReservedNeurons)&&
    data.hookV5ReservedNeurons>=data.hookV5EstimatedNeurons;
   const noOldWorker=data.existingV5Worker===false;
   const planNotKnownPaid=data.billingReadStatus!=='PAID_WORKERS_SUBSCRIPTION_DETECTED';
   const candidate=usageEvidence&&bufferOk&&noOldWorker&&planNotKnownPaid;
   status.textContent=candidate?
    'HOOK V5 read-only preflight checked. Image NOT generated. Owner plan confirmation and authenticated executor still required. Production NO-GO.':
    'HOOK V5 preflight incomplete or blocked. Image NOT generated. Production NO-GO.';
   const lines=[];
   if(verified&&Number.isFinite(data.reportedNeuronsUsed)&&data.reportedNeuronsUsed>=0)
    lines.push('Reported neurons used today: '+data.reportedNeuronsUsed.toLocaleString('en-US')+
     ' (read-only snapshot, NOT billing approval).');
   if(verified&&Number.isFinite(data.hookV5EstimatedNeurons)&&
      Number.isFinite(data.hookV5ReservedNeurons)&&
      ['BUDGET_SPACE_ESTIMATED','INSUFFICIENT_LOCAL_BUFFER'].includes(data.hookV5BudgetStatus)){
    lines.push('One HOOK V5 image: approximately '+data.hookV5EstimatedNeurons+
     ' neurons by published tile pricing; local safety reserve '+data.hookV5ReservedNeurons+
     ' neurons. Estimate only, NOT permission to render.');
    if(data.hookV5BudgetStatus==='INSUFFICIENT_LOCAL_BUFFER')
     lines.push('HOOK V5 quota buffer insufficient: live render stays BLOCKED.');
   }
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
   if(typeof data.isolatedRunnerProbePresent==='boolean'&&
      typeof data.isolatedVaultProbePresent==='boolean'){
    const runner=data.isolatedRunnerProbePresent?'PRESENT (review before changes)':'NOT LISTED';
    const vault=data.isolatedVaultProbePresent?'PRESENT (review before changes)':'NOT LISTED';
    lines.push('Isolated binding-probe Workers: Runner '+runner+'; Vault '+vault+
     '. Inventory only, NOT a live binding check or deployment permission.');
   }
   if(typeof data.blocker==='string'&&/^[A-Z_]+$/.test(data.blocker))
    lines.push('Provider telemetry blocker: '+data.blocker);
   if(candidate){
    lines.push('Single HOOK V5 candidate: read-only usage and local buffer checks passed. This does NOT confirm Workers Free billing or authorize inference.');
    lines.push('NEXT: Owner-verified Workers Free plan, fresh same-day attestation and trusted cloud executor required before any image test.');
   }else{
    if(!usageEvidence)lines.push('BLOCKED: Complete, current account usage evidence unavailable.');
    if(!bufferOk)lines.push('BLOCKED: Safe local budget buffer not established.');
    if(!noOldWorker)lines.push('BLOCKED: Existing or unknown V5 Worker needs owner review.');
    if(!planNotKnownPaid)lines.push('BLOCKED: Workers Paid plan detected.');
   }
   lines.push('HOOK V5 generation, 17-image production, Google Drive and Gmail remain OFF. This button only reads status.');
   show(lines);
  }catch{
   status.textContent='Read-only diagnostic unavailable or invalid. Production remains NO-GO.';
   show([]);
  }finally{
   button.disabled=false;
  }
 });
})();

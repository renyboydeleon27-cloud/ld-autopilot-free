// Derive milestones only from the runner's own durable records.
import {deliveryReadiness} from './delivery-readiness.mjs';
import {eligibleMilestones} from './google-delivery.mjs';
const valid=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export async function productionMilestoneState(storage){
 const job=await storage.get('job'),delivery=await storage.get('delivery');
 if(!job||!valid(job.id))return null;
 const trusted=deliveryReadiness({job,delivery}).approvedDeliveryPlanPresent;
 const plan=trusted?delivery.plan:null;
 const count=category=>plan?.assets.filter(a=>a.category===category).length||0;
 const images=plan?plan.assets.filter(a=>['Thumbnail','Approved reference images'].includes(a.category)).map(a=>({...a,visualAudit:'PASS'})):job.outputs;
 return {jobId:job.id,approvalVerified:trusted||valid(job.approvedSource?.sha256),
  stopped:job.stop===true||delivery?.stopped===true,
  blocked:job.status==='NEEDS_REVIEW'||delivery?.status==='NEEDS_REVIEW',images,
  flowCount:count('Flow video prompts'),narrationCount:count('Narration'),imagePromptCount:count('Image prompts'),
  expectedDeliverables:plan?.assets,driveVerified:trusted?delivery.verified:[]};
}

// Runner receipts are an at-most-once boundary too. Do not repair malformed
// or unknown state by overwriting it and sending: that could duplicate a
// notification whose earlier outcome is no longer trustworthy.
const MILESTONE_PERCENTS=[30,50,70,100];
const RUNNER_RECEIPT_STATUSES=new Set(['SENT','CLAIMED','UNCERTAIN','RETRY_WAIT']);
function inspectRunnerReceipt(record){
 if(record===undefined||record===null)return {valid:true,missing:true};
 if(!record||typeof record!=='object'||Array.isArray(record)||
    Object.keys(record).sort().join(',')!=='attempts,status'||
    !RUNNER_RECEIPT_STATUSES.has(record.status)||
    !Number.isSafeInteger(record.attempts)||record.attempts<0||record.attempts>3||
    (record.status==='RETRY_WAIT'?record.attempts>0:record.attempts<1))
  return {valid:false};
 return {valid:true,missing:false,status:record.status,attempts:record.attempts};
}
function isOwnedRunnerClaim(record,attempts){
 const inspected=inspectRunnerReceipt(record);
 return inspected.valid&&!inspected.missing&&inspected.status==='CLAIMED'&&
  inspected.attempts===attempts;
}
const MISSING_RECEIPT_TOMBSTONE={status:'UNCERTAIN',attempts:1};

export async function notifyProductionMilestones({storage,notify,now=Date.now}={}){
 if(typeof notify!=='function')return {status:'DISABLED'};
 if(!storage||typeof storage.get!=='function'||typeof storage.transaction!=='function'||
    typeof storage.setAlarm!=='function'||typeof now!=='function')
  throw Error('DURABLE_MILESTONE_STORAGE_REQUIRED');
 const state=await productionMilestoneState(storage);
 for(const percent of eligibleMilestones(state)){
  const key='milestone-result:'+state.jobId+':'+percent;
  // Recheck the exact job, STOP, review state and milestone eligibility in
  // the transaction that creates the durable single-flight claim.
  const claim=await storage.transaction(async tx=>{
   const current=await productionMilestoneState(tx);
   if(current?.jobId!==state.jobId||!eligibleMilestones(current).includes(percent))
    return {status:'HALT'};
   // Never send a later notification while an earlier one is unresolved.
   for(const earlier of MILESTONE_PERCENTS){
    if(earlier>=percent)break;
    const prior=inspectRunnerReceipt(await tx.get('milestone-result:'+state.jobId+':'+earlier));
    if(!prior.valid||prior.status==='CLAIMED'||prior.status==='RETRY_WAIT')
     return {status:'HALT'};
   }
   const prior=inspectRunnerReceipt(await tx.get(key));
   // Unknown, malformed, or incomplete receipt state is a manual-recovery
   // condition. Never replace it with a fresh claim and risk a duplicate.
   if(!prior.valid)return {status:'HALT'};
   if(prior.missing){
    await tx.put(key,{status:'CLAIMED',attempts:1});
    return {status:'SEND',attempts:1};
   }
   if(prior.status==='SENT'||prior.status==='UNCERTAIN')return {status:'SKIP'};
   if(prior.status==='CLAIMED')return {status:'HALT'};
   // Only RETRY_WAIT/0 is proof that STOP canceled the claim before any
   // notification request. Any prior attempt count is ambiguous and quarantined.
   if(prior.status==='RETRY_WAIT'&&prior.attempts>0){
    await tx.put(key,{status:'UNCERTAIN',attempts:prior.attempts});
    return {status:'HALT'};
   }
   if(prior.status!=='RETRY_WAIT'||prior.attempts!==0)return {status:'HALT'};
   await tx.put(key,{status:'CLAIMED',attempts:1});
   return {status:'SEND',attempts:1};
  });
  if(claim.status==='HALT')break;
  if(claim.status!=='SEND')continue;

  // A fresh durable snapshot immediately before the external call prevents a
  // STOP/review/job transition observed after reservation from sending.
  const live=await productionMilestoneState(storage);
  if(live?.jobId!==state.jobId||!eligibleMilestones(live).includes(percent)){
   await storage.transaction(async tx=>{
    const record=await tx.get(key);
    if(isOwnedRunnerClaim(record,claim.attempts))
     await tx.put(key,{status:'RETRY_WAIT',attempts:0});
   });
   break;
  }

  let outcome;
  try {
   outcome=await notify(live,percent);
   if(!['SENT','UNCERTAIN','CLAIMED'].includes(outcome?.status))
    throw Error('INVALID_MILESTONE_RESPONSE');
  }catch{
   // The Vault may have accepted the send before transport failed. Preserve
   // uncertainty and never automatically retry this milestone.
   await storage.transaction(async tx=>{
    const record=await tx.get(key);
    if(isOwnedRunnerClaim(record,claim.attempts))
     await tx.put(key,{status:'UNCERTAIN',attempts:claim.attempts});
    else if(record===undefined||record===null)
     await tx.put(key,{status:'UNCERTAIN',attempts:claim.attempts});
   });
   break;
  }

  await storage.transaction(async tx=>{
   const record=await tx.get(key);
   if(isOwnedRunnerClaim(record,claim.attempts)){
    await tx.put(key,{status:outcome.status,attempts:claim.attempts});
   }else if(record===undefined||record===null){
    // The external notification may have been accepted. A deleted claim must
    // become a durable no-resend tombstone, not an apparently fresh milestone.
    await tx.put(key,{status:'UNCERTAIN',attempts:claim.attempts});
   }
   // Changed/corrupt receipts are deliberately not overwritten. Their
   // integrity failure will block future automatic sends.
  });
  // An unresolved Vault CLAIMED receipt cannot prove the notification outcome.
  if(outcome.status==='CLAIMED')break;
 }
 return {status:'CHECKED'};
}

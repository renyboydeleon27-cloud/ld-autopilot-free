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
// Durable single-flight claim BEFORE any external notification. Without this,
// overlapping alarms can race to write different receipt statuses, hiding a
// confirmed send or allowing a second runner-side notification attempt.
const MILESTONE_PERCENTS=[30,50,70,100];
export async function notifyProductionMilestones({storage,notify,now=Date.now}={}){
 if(typeof notify!=='function')return {status:'DISABLED'};
 if(!storage||typeof storage.get!=='function'||typeof storage.transaction!=='function'||
    typeof storage.setAlarm!=='function'||typeof now!=='function')
  throw Error('DURABLE_MILESTONE_STORAGE_REQUIRED');
 const state=await productionMilestoneState(storage);
 for(const percent of eligibleMilestones(state)){
  const key='milestone-result:'+state.jobId+':'+percent;
  // Recheck STOP, review and delivery evidence inside the same transaction
  // that reserves the single runner-side attempt.
  const claim=await storage.transaction(async tx=>{
   const current=await productionMilestoneState(tx);
   if(current?.jobId!==state.jobId||!eligibleMilestones(current).includes(percent))
    return {status:'HALT'};
   // Never send 50 before a concurrent 30 claim resolves.
   for(const earlier of MILESTONE_PERCENTS){
    if(earlier>=percent)break;
    const prior=await tx.get('milestone-result:'+state.jobId+':'+earlier);
    if(prior?.status==='CLAIMED')return {status:'HALT'};
   }
   const prior=await tx.get(key);
   if(['SENT','UNCERTAIN','CLAIMED'].includes(prior?.status))
    return {status:'SKIP'};
   // Legacy RETRY_WAIT records with attempts > 0 may have already reached
   // Gmail before their Runner->Vault acknowledgement was lost. Converting
   // them to UNCERTAIN prevents duplicate notifications after an upgrade.
   // Attempts 0 arise only when STOP cancelled a claim BEFORE provider I/O.
   if(prior?.status==='RETRY_WAIT'&&prior.attempts>0){
    await tx.put(key,{status:'UNCERTAIN',attempts:prior.attempts});
    return {status:'HALT'};
   }
   if(prior?.attempts>=3)return {status:'SKIP'};
   const attempts=(prior?.attempts||0)+1;
   await tx.put(key,{status:'CLAIMED',attempts});
   return {status:'SEND',attempts};
  });
  if(claim.status==='HALT')break;
  if(claim.status!=='SEND')continue;
  // One additional check catches STOP immediately after the reservation.
  // STOP after provider I/O begins cannot recall the already-started send.
  const live=await productionMilestoneState(storage);
  if(live?.jobId!==state.jobId||!eligibleMilestones(live).includes(percent)){
   await storage.transaction(async tx=>{
    const record=await tx.get(key);
    if(record?.status==='CLAIMED'&&record.attempts===claim.attempts)
     await tx.put(key,{status:'RETRY_WAIT',attempts:claim.attempts-1});
   });
   break;
  }
  let outcome;
  try {
   outcome=await notify(live,percent);
   if(!['SENT','UNCERTAIN','CLAIMED'].includes(outcome?.status))
    throw Error('INVALID_MILESTONE_RESPONSE');
  }catch{
   // A lost Runner->Vault response is ambiguous: the Vault may already
   // have submitted the Gmail message. Never schedule an automatic resend.
   // Keep a durable UNCERTAIN receipt for owner investigation, with no
   // provider error text or message identifiers.
   await storage.transaction(async tx=>{
    const record=await tx.get(key);
    if(record?.status==='CLAIMED'&&record.attempts===claim.attempts)
     await tx.put(key,{status:'UNCERTAIN',attempts:claim.attempts});
   });
   break;
  }
  await storage.transaction(async tx=>{
   const record=await tx.get(key);
   if(record?.status==='CLAIMED'&&record.attempts===claim.attempts)
    await tx.put(key,{status:outcome.status,attempts:claim.attempts});
  });
  // An unresolved Vault CLAIMED receipt cannot prove send completion.
  if(outcome.status==='CLAIMED')break;
 }
 return {status:'CHECKED'};
}

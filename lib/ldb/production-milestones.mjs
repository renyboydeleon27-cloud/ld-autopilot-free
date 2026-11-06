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
export async function notifyProductionMilestones({storage,notify,now=Date.now}){
 if(typeof notify!=='function')return {status:'DISABLED'};
 const state=await productionMilestoneState(storage);
 for(const percent of eligibleMilestones(state)){
  const key='milestone-result:'+state.jobId+':'+percent;
  const prior=await storage.get(key);
  if(prior?.status==='SENT'||prior?.status==='UNCERTAIN'||prior?.status==='CLAIMED'||prior?.attempts>=3)continue;
  try{
   const result=await notify(state,percent);
   if(!['SENT','UNCERTAIN','CLAIMED'].includes(result?.status))throw Error('INVALID_MILESTONE_RESPONSE');
   await storage.put(key,{status:result.status,attempts:(prior?.attempts||0)+1});
  }catch{
   const attempts=(prior?.attempts||0)+1;
   await storage.put(key,{status:'RETRY_WAIT',attempts});
   if(attempts<3)await storage.setAlarm(now()+30000);
  }
 }
 return {status:'CHECKED'};
}

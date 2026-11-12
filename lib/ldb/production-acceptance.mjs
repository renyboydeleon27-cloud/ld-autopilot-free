// One owner-only, read-only acceptance rollup from durable state.
// A green CI build or generated-image count is NEVER proof that the cloud
// episode has completed or that Google/Gmail delivery is live.
import {productionProgressSnapshot} from './production-progress.mjs';
const HASH=/^[a-f0-9]{64}$/;
const PERCENTS=Object.freeze([30,50,70,100]);
const RECEIPT_STATUS=new Set(['SENT','CLAIMED','UNCERTAIN','RETRY_WAIT']);
const REPORTABLE_STATUS=new Set([...RECEIPT_STATUS,'NOT_RECORDED','INVALID_RECEIPT','RECEIPT_UNAVAILABLE']);
// Runner receipts are separate from the Vault Gmail API receipt. Do not
// count a bare 'SENT' word as evidence: the durable Runner checkpoint has
// an exact status+attempts shape, with at most three claimed attempts.
export function classifyRunnerMilestoneReceipt(record){
 if(record==null)return 'NOT_RECORDED';
 if(typeof record!=='object'||Array.isArray(record)||
    Object.keys(record).sort().join(',')!=='attempts,status'||
    !RECEIPT_STATUS.has(record.status)||
    !Number.isSafeInteger(record.attempts)||record.attempts<0||
    record.attempts>3)return 'INVALID_RECEIPT';
 if(record.status!=='RETRY_WAIT'&&record.attempts===0)return 'INVALID_RECEIPT';
 return record.status;
}
export async function readMilestoneReceipts(storage,jobId){
 if(!storage||typeof storage.get!=='function'||typeof jobId!=='string'||!HASH.test(jobId))
  return Object.freeze({});
 const pairs=await Promise.all(PERCENTS.map(async percent=>{
  try{
   const record=await storage.get('milestone-result:'+jobId+':'+percent);
   return [percent,classifyRunnerMilestoneReceipt(record)];
  }catch{return [percent,'RECEIPT_UNAVAILABLE'];}
 }));
 return Object.freeze(Object.fromEntries(pairs));
}
export function productionAcceptanceSnapshot({job,delivery,receipts={}}={}){
 const progress=productionProgressSnapshot({job,delivery});
 const generated=progress.production.renderedScenes;
 const trusted=progress.production.approvedDeliveryPlanPresent;
 const drive=progress.production.deliveryComplete;
 const sourceDigestRecorded=progress.job!==null&&
  typeof job.approvedSource?.sha256==='string'&&HASH.test(job.approvedSource.sha256);
 const milestoneReceipts=Object.fromEntries(PERCENTS.map(percent=>
  [percent,REPORTABLE_STATUS.has(receipts?.[percent])?receipts[percent]:'NOT_RECORDED']));
 const acked=PERCENTS.filter(percent=>milestoneReceipts[percent]==='SENT');
 const blockers=[];
 if(!sourceDigestRecorded)blockers.push('APPROVED_STORYBOARD_SOURCE_NOT_VERIFIED');
 if(generated<17||!progress.production.approvedDeliveryPlanPresent&&job?.status!=='IMAGES_READY')
  blockers.push('RENDER_17_SCENES_NOT_COMPLETE');
 if(!trusted)blockers.push('TRUSTED_17_IMAGE_VISUAL_REVIEW_AND_PLAN_MISSING');
 if(!drive)blockers.push('DRIVE_69_FILES_NOT_VERIFIED');
 if(acked.length!==4)blockers.push('GMAIL_MILESTONE_RECEIPTS_INCOMPLETE');
 if(PERCENTS.some(percent=>['INVALID_RECEIPT','RECEIPT_UNAVAILABLE'].includes(milestoneReceipts[percent])))
  blockers.push('GMAIL_MILESTONE_RECEIPT_INTEGRITY_NOT_VERIFIED');
 // Even all four Vault acknowledgements cannot prove inbox receipt.
 blockers.push('LIVE_CONNECTOR_QUOTA_AND_INBOX_ACCEPTANCE_NOT_VERIFIED');
 blockers.push('PRODUCTION_RELEASE_NOT_APPROVED');
 return Object.freeze({
  status:'NO_GO',
  codeTestsAreNotLiveAcceptance:true,
  stopped:progress.production.stopped,
  originalStoryboardDigestRecorded:sourceDigestRecorded,
  renderedScenes:generated,
  expectedScenes:17,
  acceptedImageDeliveryPlan:trusted,
  verifiedDriveFiles:progress.production.verifiedDriveFiles,
  expectedDriveFiles:69,
  driveCheckpointComplete:drive,
  gmailVaultAcknowledged:acked.length,
  gmailExpectedMilestones:4,
  gmailReceiptStatuses:milestoneReceipts,
  gmailInboxVerified:false,
  freeQuotaVerifiedToday:false,
  productionDeployedAndAccepted:false,
  blockers,
  note:'A SENT receipt is a vault acknowledgement, not proof of email arrival. This report never authorizes rendering, delivery or production.'
 });
}

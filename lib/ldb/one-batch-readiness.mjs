import {verifyOneHookUsageReport} from './v5-free-usage-gate.mjs';

// Observational preflight ONLY. Passing this check never starts a render,
// authorizes billing, or proves that the plan is Free in Cloudflare's UI.
export function oneBatchReadiness({env={},report,now=Date.now()}={}){
 const blockers=[];
 if(!Number.isFinite(now))blockers.push('CURRENT_TIME_NOT_VERIFIED');
 const day=Number.isFinite(now)?new Date(now).toISOString().slice(0,10):null;
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance')
  blockers.push('ISOLATED_PREVIEW_REQUIRED');
 if(!day||env.LDB_WORKERS_PLAN!=='free'||env.LDB_FREE_PLAN_VERIFIED_DATE!==day)
  blockers.push('CURRENT_FREE_PLAN_VERIFICATION_REQUIRED');
 let usage=null;
 try{usage=verifyOneHookUsageReport(report,{now});}
 catch(e){blockers.push(e?.message||'FREE_USAGE_NOT_VERIFIED');}
 if(Array.isArray(report?.v5)&&report.v5.length)
  blockers.push('EXISTING_V5_WORKER_REQUIRES_SEPARATE_REVIEW');
 return Object.freeze({
  status:blockers.length?'NO_GO':'READ_ONLY_PREFLIGHT_PASSED',
  checkedDayUtc:day,freePlanSelfAttestedToday:env.LDB_WORKERS_PLAN==='free'&&env.LDB_FREE_PLAN_VERIFIED_DATE===day,
  ...(usage?{reportedNeuronsUsed:usage.used,reportedUsageGroups:usage.groups}:{}),
  blockers:Object.freeze([...new Set(blockers)]),
  inferenceExecuted:false,
  inferenceAuthorized:false,
  billingEligibilityIndependentlyVerified:false,
  liveImageApproved:false,
  driveDeliveryVerified:false,
  gmailInboxVerified:false,
  note:'No-go for production; a successful read-only check alone cannot approve Cloudflare billing, visual quality or episode delivery.'
 });
}

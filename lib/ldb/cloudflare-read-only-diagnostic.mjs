// Read-only Cloudflare diagnostics for the preview. Never call Workers AI.
// GraphQL POST contains ONLY queries (no mutation) and is not an inference.
import {verifyOneHookUsageReport,MAX_USAGE_GROUPS} from './v5-free-usage-gate.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const GRAPHQL='https://api.cloudflare.com/client/v4/graphql';
const SUBSCRIPTIONS='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/subscriptions';
const code=e=>typeof e?.message==='string'&&/^[A-Z_]+$/.test(e.message)?e.message:'CLOUDFLARE_READ_ONLY_CHECK_FAILED';
// A subscription list can contain unrelated zone plans. Never infer that
// Workers Free is active from the absence of a visible paid subscription.
export function classifyWorkersBillingRead({httpStatus,body}={}){
 if(httpStatus===401||httpStatus===403)return Object.freeze({
  status:'BILLING_READ_PERMISSION_REQUIRED',subscriptionListComplete:false,
  workersPlan:'UNVERIFIED',freePlanVerified:false
 });
 const rows=body?.result,info=body?.result_info;
 if(httpStatus!==200||body?.success!==true||!Array.isArray(rows)||
  !info||!Number.isSafeInteger(info.total_count)||info.total_count<0||
  info.total_count!==rows.length)
  return Object.freeze({status:'BILLING_SUBSCRIPTIONS_NOT_VERIFIED',
   subscriptionListComplete:false,workersPlan:'UNVERIFIED',freePlanVerified:false});
 const workers=rows.filter(x=>typeof x?.rate_plan?.public_name==='string'&&
  /^Workers(?:\s|$)/i.test(x.rate_plan.public_name));
 const paid=workers.some(x=>/\bPaid\b/i.test(x.rate_plan.public_name)&&
  ['Paid','Provisioned','Trial','AwaitingPayment'].includes(x.state));
 return Object.freeze({
  status:paid?'PAID_WORKERS_SUBSCRIPTION_DETECTED':'WORKERS_PLAN_REQUIRES_DASHBOARD_CHECK',
  subscriptionListComplete:true,
  workersPlan:paid?'PAID_LISTED':'UNVERIFIED',
  freePlanVerified:false
 });
}

export function previewDiagnosticScope(env={}){
 return env.VERCEL_ENV==='preview'&&
  env.VERCEL_GIT_COMMIT_REF==='feature/ldb-image-acceptance';
}
export async function cloudflareReadOnlyDiagnostic({
 accountId,token,fetcher=fetch,now=Date.now()
}={}){
 if(accountId!==ACCOUNT||typeof token!=='string'||token.length<20||
   /\s/.test(token)||typeof fetcher!=='function'||!Number.isFinite(now))
  throw Error('READ_ONLY_DIAGNOSTIC_CONFIGURATION_REQUIRED');
 const checkedAt=new Date(now).toISOString();
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const request=async(url,body)=>{
  // Server constructs both URLs. A browser cannot supply or redirect one.
  if(url!==GRAPHQL&&url!==SUBSCRIPTIONS&&url!=='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts')
   throw Error('UNAPPROVED_CLOUDFLARE_URL');
  try{
   const response=await fetcher(url,{
    method:body===undefined?'GET':'POST',
    headers,redirect:'error',signal:AbortSignal.timeout(15000),
    ...(body!==undefined?{body:JSON.stringify({query:body})}:{})
   });
   const data=await response.json();
   return {status:response.status,data};
  }catch{return {status:null,data:{errors:[{message:'READ_ONLY_REQUEST_FAILED'}]}};}
 };
 const [workers,schema,subscriptions]=await Promise.all([
  request('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts'),
  request(GRAPHQL,'{ __schema { types { name fields { name } } } }'),
  request(SUBSCRIPTIONS)
 ]);
 const billing=classifyWorkersBillingRead({httpStatus:subscriptions.status,body:subscriptions.data});
 const list=workers.data?.result;
 const typed=schema.data?.data?.__schema?.types;
 const sums=Array.isArray(typed)?typed.filter(t=>/aiInference.*sum$/i.test(t?.name||'')):[];
 const matches=[...new Set(sums.flatMap(t=>t.fields||[]).map(f=>f?.name)
  .filter(n=>/^(?:totalNeurons|neuronTotal)$/i.test(n||'')))];
 const metric=matches.length===1?matches[0]:null;
 let usage=null;
 if(metric){
  const start=checkedAt.slice(0,10)+'T00:00:00Z';
  const query='{ viewer { accounts(filter: {accountTag: '+JSON.stringify(ACCOUNT)+
   '}) { aiInferenceAdaptiveGroups(filter: {datetime_geq: '+
   JSON.stringify(start)+', datetime_leq: '+JSON.stringify(checkedAt)+
   '}, limit: '+MAX_USAGE_GROUPS+') { sum { '+metric+' } } } } }';
  const result=await request(GRAPHQL,query);
  usage={httpStatus:result.status,errors:result.data?.errors?.map(e=>e?.message||'GRAPHQL_ERROR'),
   metric,limit:MAX_USAGE_GROUPS,data:result.data?.data??null};
 }
 const report={checkedAt,inferenceCalled:false,
  workerListStatus:workers.status,
  v5:Array.isArray(list)&&workers.data?.success===true?
   list.filter(s=>s?.id==='ner-ldb-runner-quality-v5')
    .map(s=>({id:s.id})):null,
  graphqlStatus:schema.status,
  errors:schema.data?.errors?.map(e=>e?.message||'GRAPHQL_SCHEMA_ERROR'),
  usage};
 let usageResult=null,reason=null;
 try{usageResult=verifyOneHookUsageReport(report,{now});}
 catch(e){reason=code(e);}
 return Object.freeze({
  status:usageResult?'READ_ONLY_TELEMETRY_CHECKED':'READ_ONLY_NO_GO',
  checkedAt,workersListHttpStatus:workers.status,graphqlSchemaHttpStatus:schema.status,
  billingReadStatus:billing.status,billingHttpStatus:subscriptions.status,
  workersSubscription:billing.workersPlan,subscriptionListComplete:billing.subscriptionListComplete,
  ...(usage?{usageHttpStatus:usage.httpStatus}:{}),
  ...(usageResult?{reportedNeuronsUsed:usageResult.used,
   reportedUsageGroups:usageResult.groups}:{}),
  ...(reason?{blocker:reason}:{}),
  existingV5Worker:Array.isArray(report.v5)?report.v5.length===1:null,
  inferenceCalled:false,freePlanIndependentlyVerified:false,
  inferenceAuthorized:false,productionAccepted:false,
  note:'Read-only billing evidence is informational only. Confirm Workers Free status and quota in the Cloudflare dashboard before rendering.'
 });
}

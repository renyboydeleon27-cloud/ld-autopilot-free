// Fail-closed, same-session read-only Workers AI usage verification.
// Dashboard confirmation of the Free plan remains a separate owner action.
const FRESHNESS_MS = 5 * 60 * 1000;
const FUTURE_SKEW_MS = 30 * 1000;
export const MAX_USAGE_GROUPS = 100;

export function verifyOneHookUsageReport(report,{now=Date.now()}={}){
 if(!report||report.inferenceCalled!==false)throw Error('READ_ONLY_USAGE_REPORT_REQUIRED');
 if(!Number.isFinite(now))throw Error('CURRENT_TIME_NOT_VERIFIED');
 const timestamp=report.checkedAt;
 if(typeof timestamp!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp))
  throw Error('FRESH_USAGE_REPORT_REQUIRED');
 const checkedAt=Date.parse(timestamp);
 if(!Number.isFinite(checkedAt)||checkedAt<now-FRESHNESS_MS||checkedAt>now+FUTURE_SKEW_MS)
  throw Error('FRESH_USAGE_REPORT_REQUIRED');
 if(report.workerListStatus!==200||!Array.isArray(report.v5)||
  report.v5.length>1||report.v5.some(w=>w?.id!=='ner-ldb-runner-quality-v5'))
  throw Error('WORKER_LIST_NOT_VERIFIED');
 if(report.graphqlStatus!==200||(report.errors?.length??0)>0)
  throw Error('GRAPHQL_SCHEMA_NOT_VERIFIED');
 const usage=report.usage;
 const metric=usage?.metric;
 // Reject non-total or ambiguous counters such as input/output neurons.
 if(typeof metric!=='string'||! /^(?:totalNeurons|neuronTotal)$/i.test(metric))
  throw Error('FREE_USAGE_METRIC_NOT_VERIFIED');
 if(usage?.limit!==MAX_USAGE_GROUPS)throw Error('FREE_USAGE_QUERY_SCOPE_NOT_VERIFIED');
 const accounts=usage?.data?.viewer?.accounts;
 const rows=accounts?.[0]?.aiInferenceAdaptiveGroups;
 if(usage.httpStatus!==200||(usage.errors?.length??0)>0||
  !Array.isArray(accounts)||accounts.length!==1||!Array.isArray(rows))
  throw Error('FREE_USAGE_NOT_VERIFIED');
 // Exactly MAX_USAGE_GROUPS might hide an additional page. Never undercount it.
 if(rows.length>=MAX_USAGE_GROUPS)throw Error('FREE_USAGE_ROWS_TRUNCATED');
 let used=0;
 for(const row of rows){
  const count=row?.sum?.[metric];
  if(typeof count!=='number'||!Number.isFinite(count)||count<0)
   throw Error('FREE_USAGE_NOT_VERIFIED');
  used+=count;
  if(!Number.isFinite(used)||used>9000)throw Error('FREE_USAGE_NOT_VERIFIED');
 }
 // A valid, successful zero-group query is zero usage, not missing data.
 // 9000 is a conservative ceiling below the daily 10000-neuron allocation.
 return {used,metric,groups:rows.length};
}

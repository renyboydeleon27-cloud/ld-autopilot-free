// Free Workers AI daily quota resets at 00:00 UTC.
// These fields are explicit operator attestations, NOT live billing evidence.
// Absence or staleness blocks only *new inference*, never safe owner controls.
export function freeInferenceStatus(env={},now=Date.now()){
 if(!Number.isFinite(now))return Object.freeze({enabled:false,reason:'CLOCK_NOT_VERIFIED',utcDay:null,accountTelemetryVerified:false});
 const utcDay=new Date(now).toISOString().slice(0,10);
 let reason='READY_FOR_OPERATOR_APPROVED_INFERENCE';
 if(env.RUNNER_ENABLED!=='true')reason='RUNNER_DISABLED';
 else if(env.FREE_PLAN_CONFIRMED!=='true')reason='FREE_PLAN_NOT_CONFIRMED';
 else if(env.LDB_FREE_PLAN_VERIFIED_DATE!==utcDay)reason='FREE_PLAN_DATE_STALE';
 else if(env.LDB_FREE_USAGE_VERIFIED_DATE!==utcDay)reason='FREE_USAGE_DATE_STALE';
 return Object.freeze({enabled:reason==='READY_FOR_OPERATOR_APPROVED_INFERENCE',
  reason,utcDay,accountTelemetryVerified:false,
  note:'Configured dates are operator attestations, not independently verified live Cloudflare billing evidence.'});
}
export function freeInferenceAllowed(env={},now=Date.now()){
 if(!Number.isFinite(now))return false;
 const day=new Date(now).toISOString().slice(0,10);
 return env?.FREE_PLAN_CONFIRMED==='true' &&
  env.LDB_FREE_PLAN_VERIFIED_DATE===day &&
  env.LDB_FREE_USAGE_VERIFIED_DATE===day;
}

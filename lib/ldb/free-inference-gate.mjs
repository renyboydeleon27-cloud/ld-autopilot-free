// Free Workers AI daily quota resets at 00:00 UTC.
// These fields are explicit operator attestations, NOT live billing evidence.
// Absence or staleness blocks only *new inference*, never safe owner controls.
export function freeInferenceAllowed(env={},now=Date.now()){
 if(!Number.isFinite(now))return false;
 const day=new Date(now).toISOString().slice(0,10);
 return env?.FREE_PLAN_CONFIRMED==='true' &&
  env.LDB_FREE_PLAN_VERIFIED_DATE===day &&
  env.LDB_FREE_USAGE_VERIFIED_DATE===day;
}

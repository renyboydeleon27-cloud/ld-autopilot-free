import {sanitizeLdbInspector} from './readiness-response-sanitizer.mjs';
// Preview-only Cloudflare diagnostic snapshot: independent fail-closed checks.
// Does not initiate any request itself; inspector functions are injected by
// the server and may use only their already-reviewed fixed GET endpoints.
// No thrown provider exceptions, credential values or error text are returned.
const fallback=Object.freeze({
 quality:Object.freeze({status:'CLOUDFLARE_WIRING_NOT_VERIFIED',
  productionReady:false,workerModified:false,inferenceCalled:false,
  googleApiCalled:false,gmailApiCalled:false,liveServiceBindingProbed:false}),
 isolated:Object.freeze({status:'ISOLATED_PROBE_METADATA_NOT_VERIFIED',
  productionReady:false,workerModified:false,inferenceCalled:false,
  googleApiCalled:false,gmailApiCalled:false,
  authenticationProbeCalled:false,authenticationVerified:false}),
 host:Object.freeze({status:'PROBE_HOST_METADATA_NOT_VERIFIED',
  productionReady:false,workerModified:false,inferenceCalled:false,
  googleApiCalled:false,gmailApiCalled:false,
  authenticatedProbeCalled:false,ownerSecretSent:false})
});
const kinds=Object.freeze(['quality','isolated','host']);
const statusAllowed={
 quality:new Set(['CLOUDFLARE_WIRING_NOT_VERIFIED','CLOUDFLARE_WIRING_METADATA_MATCHES_OFF']),
 isolated:new Set(['ISOLATED_PROBE_METADATA_NOT_VERIFIED','ISOLATED_PROBE_METADATA_MATCHES_SAFE']),
 host:new Set(['PROBE_HOST_METADATA_NOT_VERIFIED','PROBE_HOST_METADATA_READY'])
};
const permitted=(kind,result)=>{
 if(!result||typeof result!=='object'||Array.isArray(result)||
    !statusAllowed[kind].has(result.status)||result.productionReady!==false||
    result.workerModified!==false||result.inferenceCalled!==false||
    result.googleApiCalled!==false||result.gmailApiCalled!==false)return false;
 if(kind==='quality')return result.liveServiceBindingProbed===false;
 if(kind==='isolated')return result.authenticationProbeCalled===false&&
  result.authenticationVerified===false;
 return result.authenticatedProbeCalled===false&&result.ownerSecretSent===false;
};
export async function collectLdbReadOnlyDeliverySnapshot({
 inventory,credentialsConfigured=false,inspectQuality,inspectIsolated,inspectHost
}={}){
 if(!inventory||typeof inventory!=='object'||
    inventory.productionReady!==false||inventory.googleApiCalled!==false||
    inventory.gmailApiCalled!==false)
  throw Error('DELIVERY_INVENTORY_INVALID');
 const calls=[inspectQuality,inspectIsolated,inspectHost];
 const outcomes=credentialsConfigured?
  await Promise.all(kinds.map(async(kind,i)=>{
   if(typeof calls[i]!=='function')return {kind,value:fallback[kind],check:'UNAVAILABLE'};
   try{
    const value=await calls[i]();
    if(permitted(kind,value))return {kind,value:sanitizeLdbInspector(kind,value),check:'RETURNED'};
   }catch{/* Provider errors never cross the response boundary. */}
   return {kind,value:fallback[kind],check:'UNAVAILABLE'};
  })):
  kinds.map(kind=>({kind,value:fallback[kind],check:'NOT_CONFIGURED'}));
 const checks=Object.fromEntries(outcomes.map(x=>[x.kind,x.check]));
 const completed=outcomes.filter(x=>x.check==='RETURNED').length;
 const overall=!credentialsConfigured?'NOT_CONFIGURED':
  completed===3?'ALL_RETURNED':completed===0?'UNAVAILABLE':'PARTIAL';
 const byKind=Object.fromEntries(outcomes.map(x=>[x.kind,x.value]));
 return Object.freeze({
  ...inventory,cloudflareVault:byKind.quality,
  isolatedProbe:byKind.isolated,probeHost:byKind.host,
  cloudflareDiagnosticCoverage:Object.freeze({
   status:overall,checks:Object.freeze(checks),
   returned:completed,expected:3,
   note:'RETURNED means a sanitized check responded, NOT that wiring, authentication or Google delivery succeeded.'
  })
 });
}

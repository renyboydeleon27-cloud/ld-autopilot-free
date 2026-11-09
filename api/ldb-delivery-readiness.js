'use strict';
// Exact-branch preview-only diagnostics. Independently fail closed; no
// Cloudflare mutations, Google calls, Runner owner secrets or AI inference.
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Access-Control-Allow-Origin','none');
 const env=process.env;
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance')
  return res.status(404).json({status:'PREVIEW_ONLY'});
 // Reuse the existing protected Vercel Function; Hobby limits this project
 // to 12 Functions. Only a deliberate same-origin POST with a fixed header
 // can enter the isolated owner authentication test. Ordinary GET remains
 // the existing read-only delivery status and all other methods stay closed.
 if(req.method==='POST'&&req.headers['x-ldb-owner-test']==='1'){
  const test=require('../lib/ldb/owner-binding-probe.cjs');
  return test(req,res);
 }
 if(req.method!=='GET')return res.status(405).json({status:'METHOD_NOT_ALLOWED'});
 if(req.url!=='/api/ldb-delivery-readiness')
  return res.status(400).json({status:'QUERY_PARAMETERS_NOT_ALLOWED'});
 try{
  const {assessLdbDeliveryConfig}=await import('../lib/ldb/delivery-configuration-check.mjs');
  const {collectLdbReadOnlyDeliverySnapshot}=await import('../lib/ldb/delivery-readiness-snapshot.mjs');
  const inventory=assessLdbDeliveryConfig({env});
  const configured=Boolean(env.CLOUDFLARE_ACCOUNT_ID&&env.CLOUDFLARE_API_TOKEN);
  let inspectQuality,inspectIsolated,inspectHost;
  if(configured){
   const [wiring,host]=await Promise.all([
    import('../lib/ldb/cloudflare-vault-wiring.mjs').catch(()=>null),
    import('../lib/ldb/probe-host-readonly.mjs').catch(()=>null)
   ]);
   const args={accountId:env.CLOUDFLARE_ACCOUNT_ID,token:env.CLOUDFLARE_API_TOKEN};
   if(wiring){
    inspectQuality=()=>wiring.inspectLdbCloudflareVaultWiring(args);
    inspectIsolated=()=>wiring.inspectLdbIsolatedProbeWiring(args);
   }
   if(host)inspectHost=()=>host.inspectLdbProbeHost(args);
  }
  const snapshot=await collectLdbReadOnlyDeliverySnapshot({
   inventory,credentialsConfigured:configured,
   inspectQuality,inspectIsolated,inspectHost
  });
  return res.status(200).json(snapshot);
 }catch{
  return res.status(503).json({status:'DELIVERY_READINESS_CHECK_UNAVAILABLE',
   productionReady:false,googleApiCalled:false,gmailApiCalled:false});
 }
};

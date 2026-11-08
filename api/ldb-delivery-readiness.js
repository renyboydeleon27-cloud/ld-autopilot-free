'use strict';
// Exact-branch, preview-only inventory; optional Cloudflare metadata GET only.
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Access-Control-Allow-Origin','none');
 const env=process.env;
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance')
  return res.status(404).json({status:'PREVIEW_ONLY'});
 if(req.method!=='GET')return res.status(405).json({status:'METHOD_NOT_ALLOWED'});
 if(req.url!=='/api/ldb-delivery-readiness')
  return res.status(400).json({status:'QUERY_PARAMETERS_NOT_ALLOWED'});
 try{
  const {assessLdbDeliveryConfig}=await import('../lib/ldb/delivery-configuration-check.mjs');
  const inventory=assessLdbDeliveryConfig({env});
  let cloudflareVault={status:'CLOUDFLARE_WIRING_NOT_VERIFIED',
   productionReady:false,googleApiCalled:false,gmailApiCalled:false};
  let isolatedProbe={status:'ISOLATED_PROBE_METADATA_NOT_VERIFIED',
   authenticationProbeCalled:false,authenticationVerified:false,
   productionReady:false,workerModified:false};
  if(env.CLOUDFLARE_ACCOUNT_ID&&env.CLOUDFLARE_API_TOKEN){
   try{
    const {inspectLdbCloudflareVaultWiring,inspectLdbIsolatedProbeWiring}=
     await import('../lib/ldb/cloudflare-vault-wiring.mjs');
    cloudflareVault=await inspectLdbCloudflareVaultWiring({
     accountId:env.CLOUDFLARE_ACCOUNT_ID,token:env.CLOUDFLARE_API_TOKEN
    });
    isolatedProbe=await inspectLdbIsolatedProbeWiring({
     accountId:env.CLOUDFLARE_ACCOUNT_ID,token:env.CLOUDFLARE_API_TOKEN
    });
   }catch{/* Zero provider errors or secret data in client responses. */}
  }
  return res.status(200).json({...inventory,cloudflareVault,isolatedProbe});
 }catch{
  return res.status(503).json({status:'DELIVERY_READINESS_CHECK_UNAVAILABLE',
   productionReady:false,googleApiCalled:false,gmailApiCalled:false});
 }
};

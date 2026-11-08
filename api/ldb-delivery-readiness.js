'use strict';
// Exact-branch, preview-only Vercel diagnostics. No external calls.
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
  return res.status(200).json(assessLdbDeliveryConfig({env}));
 }catch{
  return res.status(503).json({status:'DELIVERY_READINESS_CHECK_UNAVAILABLE',
   productionReady:false,googleApiCalled:false,gmailApiCalled:false});
 }
};

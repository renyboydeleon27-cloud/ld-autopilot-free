'use strict';
// Vercel SSO-protected PREVIEW diagnostic. Never expose the Cloudflare token.
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Access-Control-Allow-Origin','none');
 const env=process.env;
 // No browser-controllable endpoint, token, request body or target account.
 if(env.VERCEL_ENV!=='preview'||
    env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance'){
  return res.status(404).json({status:'PREVIEW_ONLY'});
 }
 if(req.method!=='GET')return res.status(405).json({status:'METHOD_NOT_ALLOWED'});
 const url=req.url||'';
 if(url!=='/api/ldb-cloudflare-readiness'){
  return res.status(400).json({status:'QUERY_PARAMETERS_NOT_ALLOWED'});
 }
 if(!env.CLOUDFLARE_API_TOKEN||!env.CLOUDFLARE_ACCOUNT_ID){
  return res.status(503).json({status:'READ_ONLY_CREDENTIALS_NOT_CONFIGURED'});
 }
 try{
  const {cloudflareReadOnlyDiagnostic}=await import('../lib/ldb/cloudflare-read-only-diagnostic.mjs');
  const result=await cloudflareReadOnlyDiagnostic({
   accountId:env.CLOUDFLARE_ACCOUNT_ID,token:env.CLOUDFLARE_API_TOKEN
  });
  return res.status(200).json(result);
 }catch{
  // Do not print network/provider exceptions (may contain secrets).
  return res.status(503).json({status:'READ_ONLY_DIAGNOSTIC_UNAVAILABLE',
   inferenceCalled:false,inferenceAuthorized:false});
 }
};

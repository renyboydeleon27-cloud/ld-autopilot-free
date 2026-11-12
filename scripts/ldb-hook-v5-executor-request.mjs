import {appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const fail=code=>{throw Error('HOOK_V5_EXECUTOR_'+code);};
export function parseExecutorRequest(value,now=Date.now()){
 if(value==='hook-v5-executor-check')return {mode:'configuration_only',utc_day:'',public_review_artifact:'false'};
 const match=/^hook-v5-executor-render-public-review-(\d{4}-\d{2}-\d{2})$/.exec(value||'');
 if(!match||!Number.isFinite(now)||match[1]!==new Date(now).toISOString().slice(0,10))
  fail('EXPLICIT_CURRENT_REQUEST_REQUIRED');
 return {mode:'render_one_hook',utc_day:match[1],public_review_artifact:'true'};
}

export function checkExecutorConfiguration(env={},now=Date.now()){
 const missing=[];
 if(env.LDB_HOOK_V5_CLOUDFLARE_ACCOUNT_ID!=='a437dda5f38ba6b10991684b8388760b')missing.push('LDB_HOOK_V5_CLOUDFLARE_ACCOUNT_ID');
 if(env.LDB_WORKERS_PLAN!=='free')missing.push('LDB_WORKERS_PLAN');
 if(!Number.isFinite(now)||env.LDB_FREE_PLAN_VERIFIED_DATE!==new Date(now).toISOString().slice(0,10))missing.push('LDB_FREE_PLAN_VERIFIED_DATE');
 if(env.LDB_HOOK_V5_ENV_REVIEW_APPROVED!=='true')missing.push('LDB_HOOK_V5_ENV_REVIEW_APPROVED');
 if(env.LDB_TOKEN_PRESENT!=='true')missing.push('LDB_HOOK_V5_CLOUDFLARE_API_TOKEN');
 return {status:missing.length?'CONFIGURATION_INCOMPLETE':'CONFIGURATION_PRESENT',missing,
  credentialScopeVerified:false,cloudflareChecked:false,inferenceCalled:false,readyToGenerate:false};
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  if(process.argv.includes('--configuration-only')){
   const result=checkExecutorConfiguration(process.env);
   const summary='### HOOK V5 configuration check\n'+JSON.stringify(result,null,2)+'\nNo provider credential read, Cloudflare call, Worker mutation, image, Drive upload or Gmail send.\n';
   console.log(summary);
   if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
   if(result.missing.length)process.exitCode=1;
  }else{
   const result=parseExecutorRequest(process.env.LDB_EXECUTOR_REQUEST);
   if(!process.env.GITHUB_OUTPUT)fail('GITHUB_OUTPUT_REQUIRED');
   await appendFile(process.env.GITHUB_OUTPUT,Object.entries(result).map(([k,v])=>k+'='+v+'\n').join(''));
   console.log('Validated executor mode: '+result.mode+'; no inference performed.');
  }
 }catch(e){console.error(/^HOOK_V5_EXECUTOR_[A-Z_]+$/.test(e.message)?e.message:'HOOK_V5_EXECUTOR_REQUEST_FAILED');process.exitCode=1;}
}

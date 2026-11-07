// Read-only account audit; no inference, deployment, plan or credential mutations.
import {mkdir,writeFile} from 'node:fs/promises';
if(process.env.VERCEL_ENV!=='preview'||process.env.CLOUDFLARE_ACCOUNT_ID!=='a437dda5f38ba6b10991684b8388760b'||!process.argv.includes('--read-only'))throw Error('PREVIEW_REQUIRED');
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const read=async path=>{try{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},redirect:'error',signal:AbortSignal.timeout(20000)});const d=await r.json();return {httpStatus:r.status,success:d.success===true,result:d.result};}catch{return {success:false,httpStatus:null};}};
const settings=await read('/workers/account-settings');
const subscriptions=await read('/subscriptions');
const report={inferenceCalled:false,checkedAt:new Date().toISOString(),settings:{httpStatus:settings.httpStatus,success:settings.success,defaultUsageModel:settings.result?.default_usage_model??null},subscriptions:{httpStatus:subscriptions.httpStatus,success:subscriptions.success,plans:Array.isArray(subscriptions.result)?subscriptions.result.map(s=>({name:s.rate_plan?.public_name||s.rate_plan?.id||null,state:s.state,price:s.price??null})):[]},liveQuotaRemaining:null};
await mkdir('cloudflare/ldb-runner/public',{recursive:true});
await writeFile('cloudflare/ldb-runner/public/image-preflight.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

// One explicitly authorized retry after the November 7 visual rejection.
// Never removes an arbitrary existing Worker or changes the approved storyboard.
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance'||!process.argv.includes('--one-reviewed-hook-free-only'))throw Error('EXPLICIT_PREVIEW_REQUIRED');
const today=new Date().toISOString().slice(0,10);
if(process.env.LDB_WORKERS_PLAN!=='free'||process.env.LDB_FREE_PLAN_VERIFIED_DATE!==today)throw Error('CURRENT_FREE_PLAN_VERIFICATION_REQUIRED');
const run=(command,args)=>{const r=spawnSync(command,args,{stdio:'inherit',env:process.env});if(r.status!==0)throw Error('DIAGNOSTIC_STEP_FAILED');};
run('python3',['-c','from PIL import Image, ImageOps']);
run('node',['scripts/ldb-live-usage-preflight.mjs','--read-only']);
const report=JSON.parse(await readFile('cloudflare/ldb-runner/public/live-preflight.json','utf8'));
const accounts=report.usage?.data?.viewer?.accounts;
const rows=accounts?.[0]?.aiInferenceAdaptiveGroups;
const used=rows?.[0]?.sum?.totalNeurons;
if(report.usage?.errors?.length||report.usage?.httpStatus!==200||accounts?.length!==1||rows?.length!==1||!Number.isFinite(used)||used<0||used>9000)throw Error('FREE_USAGE_NOT_VERIFIED');
if(report.workerListStatus!==200||!Array.isArray(report.v5))throw Error('WORKER_LIST_NOT_VERIFIED');
if(report.v5.length){
 if(report.v5.length!==1||report.v5[0].id!=='ner-ldb-runner-quality-v5'||report.v5[0].modifiedOn!=='2026-11-07T09:34:14.093436Z')throw Error('UNRECOGNIZED_V5_WORKER');
 const base='https://api.cloudflare.com/client/v4/accounts/a437dda5f38ba6b10991684b8388760b/workers/scripts/ner-ldb-runner-quality-v5';
 const api=async(path,method='GET')=>{
  const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},redirect:'error',signal:AbortSignal.timeout(20000)});
  const d=await r.json();if(!r.ok||d.success!==true)throw Error('V5_CLEANUP_API_FAILED');return d.result;
 };
 const settings=await api('/settings'),bindings=settings?.bindings;
 const flag=name=>bindings?.find(b=>b.name===name)?.text;
 if(flag('HOOK_ONLY_TEST')!=='true'||flag('DELIVERY_BRIDGE_ENABLED')!=='false'||flag('BRIDGE_PROBE_ENABLED')!=='false'||bindings?.some(b=>b.name==='RUNNER_SECRET'))throw Error('V5_NOT_DISPOSABLE');
 await api('','DELETE');
 console.log('Removed verified November 7 disposable V5 test Worker; V4 and production untouched.');
}
run('node',['scripts/ldb-run-hook-v5.mjs','--one-approved-hook-free-only']);

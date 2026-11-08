// Explicit one-image acceptance test. Never runs during a normal app build.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {workerModules} from './ldb-worker-module-graph.mjs';
import {validateRenderJob} from '../lib/ldb/approved-render-job.mjs';
import {freeInferenceAllowed} from '../lib/ldb/free-inference-gate.mjs';
import {verifyOneHookUsageReport} from '../lib/ldb/v5-free-usage-gate.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b', NAME='ner-ldb-runner-quality-v4', V5_NAME='ner-ldb-runner-quality-v5';
export function assertV5PreviewScope({args=[],env={}}={}){
 if(!args.includes('--hook-v5'))return true; // Existing V4 diagnostics unchanged.
 if(env.VERCEL_ENV!=='preview')throw Error('V5_PREVIEW_ONLY');
 if(env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance')throw Error('V5_APPROVED_BRANCH_REQUIRED');
 return true;
}

// This guard lives at the *actual* exported execution boundary, not just
// in the CLI wrapper. It prevents direct imports or alternate callers from
// bypassing V5's preview, Free-plan, and fresh telemetry prerequisites.
export function assertV5InferenceGate({env={},usageReport,now=Date.now()}={}){
 assertV5PreviewScope({args:['--hook-v5'],env});
 if(!Number.isFinite(now))throw Error('V5_CLOCK_NOT_VERIFIED');
 const day=new Date(now).toISOString().slice(0,10);
 if(env.LDB_WORKERS_PLAN!=='free'||env.FREE_PLAN_CONFIRMED!=='true'||
    env.LDB_FREE_PLAN_VERIFIED_DATE!==day||env.LDB_FREE_USAGE_VERIFIED_DATE!==day)
  throw Error('V5_FREE_PLAN_ATTESTATION_REQUIRED');
 // The read-only account-scoped report must be generated in the same session
 // and be fresh (5 minutes). Date-only environment flags are insufficient.
 const verified=verifyOneHookUsageReport(usageReport,{now});
 if(usageReport.v5.length!==0)throw Error('EXISTING_V5_WORKER_REQUIRES_REVIEW');
 return Object.freeze({utcDay:day,reportedNeuronsUsed:verified.used,readyForOperatorTest:true,
  note:'Operator attestation is not independent billing verification; no inference is authorized by this function alone.'});
}

export async function hookCloudTest({env=process.env,fetcher=fetch,read=readFile,sleep=ms=>new Promise(r=>setTimeout(r,ms)),freePlanConfirmed=false,workerName=NAME,usageReport,now=Date.now()}={}) {
 if(workerName!==NAME&&workerName!==V5_NAME)throw Error('UNAPPROVED_TEST_WORKER');
 if(workerName===V5_NAME)assertV5InferenceGate({env,usageReport,now});
 if(env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT || !env.CLOUDFLARE_API_TOKEN || /\s/.test(env.CLOUDFLARE_API_TOKEN))throw Error('CONFIGURATION_REQUIRED');
 if(freePlanConfirmed!==true||!freeInferenceAllowed({...env,FREE_PLAN_CONFIRMED:'true'}))throw Error('FREE_PLAN_CONFIRMATION_REQUIRED');
 const modules=await workerModules('cloudflare/ldb-runner/worker.mjs',{read});
 const bundle=JSON.parse(await read('/tmp/ldb-hook-package/render_job.json','utf8'));
 const validated=validateRenderJob(bundle);
 if(workerName===V5_NAME){
  // Fail before any Cloudflare API mutation if the V5-only HOOK prompt is
  // missing or if an old V4 prompt was accidentally reused.
  const hook=bundle.render_scenes[0];
  if(hook.id!=='HOOK'||!hook.image_prompt.includes('HOOK-only composition lock:')||
     !hook.image_prompt.includes('Moon OUTSIDE frame; NO visible moon disk.')||
     !hook.image_prompt.includes('R=G=B'))throw Error('HOOK_V5_PROMPT_REQUIRED');
 }
 const token=env.CLOUDFLARE_API_TOKEN, key=randomBytes(32).toString('hex');
 const base=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers`;
 const api=async(path,options={})=>{
  const r=await fetcher(base+path,{...options,redirect:'error',headers:{Authorization:`Bearer ${token}`,...options.headers},signal:AbortSignal.timeout(60000)});
  let data;try{data=await r.json()}catch{throw Error('CLOUDFLARE_INVALID_RESPONSE')}
  if(!r.ok||data.success!==true)throw Error(`CLOUDFLARE_HTTP_${r.status}`);
  return data.result;
 };
 const scripts=await api('/scripts');
 if(!Array.isArray(scripts)||scripts.some(s=>s.id===workerName))throw Error('EXISTING_TEST_WORKER_REQUIRES_REVIEW');
 const sub=await api('/subdomain');
 if(!/^[a-z0-9-]+$/.test(sub?.subdomain||''))throw Error('INVALID_WORKERS_SUBDOMAIN');
 const endpoint=`https://${workerName}.${sub.subdomain}.workers.dev`;
 const entry='cloudflare/ldb-runner/worker.mjs';
 const bindings=[{name:'LDB_COORDINATOR',type:'durable_object_namespace',class_name:'LdbCoordinator'},
 ...Object.entries({RUNNER_ENABLED:'true',FREE_PLAN_CONFIRMED:'true',LDB_FREE_PLAN_VERIFIED_DATE:env.LDB_FREE_PLAN_VERIFIED_DATE,LDB_FREE_USAGE_VERIFIED_DATE:env.LDB_FREE_USAGE_VERIFIED_DATE,HOOK_ONLY_TEST:'true',DELIVERY_BRIDGE_ENABLED:'false',BRIDGE_PROBE_ENABLED:'false',CLOUDFLARE_ACCOUNT_ID:ACCOUNT}).map(([name,text])=>({name,type:'plain_text',text})),
 {name:'AI',type:'ai'},{name:'RUNNER_SECRET',type:'secret_text',text:key}];
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify({main_module:entry,compatibility_date:'2026-10-28',compatibility_flags:['nodejs_compat'],bindings,migrations:{new_tag:'v1',new_sqlite_classes:['LdbCoordinator']}})],{type:'application/json'}));
 for(const [path,source] of modules)form.set(path,new Blob([source],{type:'application/javascript+module'}),path);
 let result,bytes,primaryError,workerPutAttempted=false;
 try {
  // Mark attempt BEFORE the HTTP call. A transport timeout can still have
  // created a Worker; cleanup must run for that ambiguous outcome.
  workerPutAttempted=true;
  await api(`/scripts/${workerName}`,{method:'PUT',body:form});
  await api(`/scripts/${workerName}/subdomain`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
  const call=async(path,method='GET',body)=>{
   const r=await fetcher(endpoint+path,{method,redirect:'error',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
   if(!r.ok)throw Error(`RUNNER_HTTP_${r.status}`);return r;
  };
  // Wait for route propagation without ever retrying POST /jobs.
  let ready=false;
  for(let i=0;i<12;i++){try{await call('/status');ready=true;break}catch{await sleep(5000)}}
  if(!ready)throw Error('RUNNER_ROUTE_NOT_READY');
  const unauth=await fetcher(endpoint+'/status',{redirect:'error',signal:AbortSignal.timeout(15000)});
  if(unauth.status!==401)throw Error('UNAUTHORIZED_REQUEST_NOT_BLOCKED');
  await call('/jobs','POST',bundle);
  await call('/stop','POST');
  const stopped=(await (await call('/status')).json()).job;
  if(stopped?.status!=='STOPPED'||stopped.completedScenes!==0)throw Error('STOP_BEFORE_RENDER_NOT_VERIFIED');
  await call('/resume','POST');
  let job;
  for(let i=0;i<48;i++){
   await sleep(5000);job=(await (await call('/status')).json()).job;
   if(job?.status==='TEST_PAUSED')break;
   if(job?.status==='NEEDS_REVIEW')throw Error('RENDER_NEEDS_REVIEW_'+(job.providerCode||'UNKNOWN'));
  }
  if(job?.status!=='TEST_PAUSED'||job.completedScenes!==1)throw Error('HOOK_TEST_INCOMPLETE');
  const response=await call('/images/HOOK');bytes=Buffer.from(await response.arrayBuffer());
  const sha256=createHash('sha256').update(bytes).digest('hex');
  if(sha256!==job.outputs[0]?.sha256||sha256!==response.headers.get('X-LDB-SHA256'))throw Error('IMAGE_CHECKSUM_FAILED');
  const persisted=(await (await call('/status')).json()).job;
  if(persisted.id!==validated.id||persisted.completedScenes!==1)throw Error('CHECKPOINT_VERIFICATION_FAILED');
  result={status:'HOOK_CLOUD_TEST_PASSED',worker:workerName,storyboard_sha256:validated.id,unauthenticatedBlocked:true,stopBeforeRender:true,resumeStartedRender:true,completedScenes:1,totalScenes:17,checkpointStatus:job.status,output:job.outputs[0],fullAutoProduction:false,googleConnected:false,verifiedAt:new Date().toISOString()};
 }catch(e){primaryError=e}
 // Remove credentials even when cloud rendering failed or timed out.
 // V5 is an isolated disposable diagnostic, so also remove its *own*
 // Worker script. Never delete historical V4 or production quality Workers.
 const cleanup=[];
 for(const name of ['RUNNER_SECRET'])try{
  await api(`/scripts/${workerName}/secrets/${name}`,{method:'DELETE'});
 }catch{cleanup.push('RUNNER_SECRET')}
 let isolatedWorkerRemoved=false;
 if(workerName===V5_NAME&&workerPutAttempted){
  try{
   await api(`/scripts/${workerName}`,{method:'DELETE'});
   isolatedWorkerRemoved=true;
  }catch{cleanup.push('ISOLATED_V5_WORKER')}
 }
 // Fail closed: never publish evidence as PASS after a failed cleanup.
 if(cleanup.length)throw Error('TEST_RUNTIME_CLEANUP_FAILED');
 if(primaryError)throw primaryError;
 return {report:{...result,runtimeCredentialsRemoved:true,
  ...(workerName===V5_NAME?{isolatedWorkerRemoved}:{})},bytes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv.includes('--one-approved-hook-free-only')){console.error('EXPLICIT_HOOK_TEST_FLAG_REQUIRED');process.exit(1)}
 try{
  assertV5PreviewScope({args:process.argv,env:process.env});
  const today=new Date().toISOString().slice(0,10);
  if(process.env.LDB_WORKERS_PLAN!=='free'||process.env.LDB_FREE_PLAN_VERIFIED_DATE!==today||process.env.LDB_FREE_USAGE_VERIFIED_DATE!==today)throw Error('CURRENT_FREE_PLAN_VERIFICATION_REQUIRED');
  const v5=process.argv.includes('--hook-v5');
  const usageReport=v5?JSON.parse(await readFile('cloudflare/ldb-runner/public/live-preflight.json','utf8')):undefined;
  const {report,bytes}=await hookCloudTest({freePlanConfirmed:true,workerName:v5?V5_NAME:NAME,usageReport});const folder='cloudflare/ldb-runner/public';await mkdir(folder,{recursive:true});
  await writeFile(`${folder}/HOOK.jpg`,bytes);await writeFile(`${folder}/report.json`,JSON.stringify(report,null,2));
  await writeFile(`${folder}/index.html`,'<!doctype html><meta name="viewport" content="width=device-width"><title>LDB HOOK test</title><h1>HOOK cloud test</h1><p>One raw image only. Visual QA and full production are not complete.</p><a href="report.json">Test report</a><p><img style="max-width:100%" src="HOOK.jpg"></p>');
  console.log(JSON.stringify(report));
 }catch(e){console.error(/^[A-Z0-9_]+$/.test(e.message)?e.message:'HOOK_TEST_FAILED');process.exit(1)}
}


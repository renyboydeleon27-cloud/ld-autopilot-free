// Explicit one-image acceptance test. Never runs during a normal app build.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateRenderJob} from '../lib/ldb/approved-render-job.mjs';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b', NAME='ner-ldb-runner-quality-v2';
export async function hookCloudTest({env=process.env,fetcher=fetch,read=readFile,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
 if(env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT || !env.CLOUDFLARE_API_TOKEN || /\s/.test(env.CLOUDFLARE_API_TOKEN))throw Error('CONFIGURATION_REQUIRED');
 const bundle=JSON.parse(await read('/tmp/ldb-hook-package/render_job.json','utf8'));
 const validated=validateRenderJob(bundle);
 const token=env.CLOUDFLARE_API_TOKEN, key=randomBytes(32).toString('hex');
 const base=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers`;
 const api=async(path,options={})=>{
  const r=await fetcher(base+path,{...options,redirect:'error',headers:{Authorization:`Bearer ${token}`,...options.headers},signal:AbortSignal.timeout(60000)});
  let data;try{data=await r.json()}catch{throw Error('CLOUDFLARE_INVALID_RESPONSE')}
  if(!r.ok||data.success!==true)throw Error(`CLOUDFLARE_HTTP_${r.status}`);
  return data.result;
 };
 const scripts=await api('/scripts');
 if(!Array.isArray(scripts)||scripts.some(s=>s.id===NAME))throw Error('EXISTING_TEST_WORKER_REQUIRES_REVIEW');
 const sub=await api('/subdomain');
 if(!/^[a-z0-9-]+$/.test(sub?.subdomain||''))throw Error('INVALID_WORKERS_SUBDOMAIN');
 const endpoint=`https://${NAME}.${sub.subdomain}.workers.dev`;
 const files=['cloudflare/ldb-runner/worker.mjs','cloudflare/ldb-runner/checkpoints.mjs','lib/ldb/cloudflare-image.mjs','lib/ldb/approved-render-job.mjs'];
 const bindings=[{name:'LDB_COORDINATOR',type:'durable_object_namespace',class_name:'LdbCoordinator'},
 ...Object.entries({RUNNER_ENABLED:'true',FREE_PLAN_CONFIRMED:'true',HOOK_ONLY_TEST:'true',CLOUDFLARE_ACCOUNT_ID:ACCOUNT}).map(([name,text])=>({name,type:'plain_text',text})),
 {name:'AI',type:'ai'},{name:'RUNNER_SECRET',type:'secret_text',text:key}];
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify({main_module:files[0],compatibility_date:'2026-10-28',compatibility_flags:['nodejs_compat'],bindings,migrations:{new_tag:'v1',new_sqlite_classes:['LdbCoordinator']}})],{type:'application/json'}));
 for(const path of files)form.set(path,new Blob([await read(path)],{type:'application/javascript+module'}),path);
 let result,bytes,primaryError;
 try {
  await api(`/scripts/${NAME}`,{method:'PUT',body:form});
  await api(`/scripts/${NAME}/subdomain`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
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
  result={status:'HOOK_CLOUD_TEST_PASSED',worker:NAME,storyboard_sha256:validated.id,unauthenticatedBlocked:true,stopBeforeRender:true,resumeStartedRender:true,completedScenes:1,totalScenes:17,checkpointStatus:job.status,output:job.outputs[0],fullAutoProduction:false,googleConnected:false,verifiedAt:new Date().toISOString()};
 }catch(e){primaryError=e}
 // Remove temporary runtime credentials even on a failed acceptance test.
 const cleanup=[];
 for(const name of ['RUNNER_SECRET'])try{await api(`/scripts/${NAME}/secrets/${name}`,{method:'DELETE'});}catch{cleanup.push(name)}
 if(cleanup.length)throw Error('TEST_SECRET_CLEANUP_FAILED');
 if(primaryError)throw primaryError;
 return {report:{...result,runtimeCredentialsRemoved:true},bytes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv.includes('--one-approved-hook-free-only')){console.error('EXPLICIT_HOOK_TEST_FLAG_REQUIRED');process.exit(1)}
 try{
  const {report,bytes}=await hookCloudTest();const folder='cloudflare/ldb-runner/public';await mkdir(folder,{recursive:true});
  await writeFile(`${folder}/HOOK.jpg`,bytes);await writeFile(`${folder}/report.json`,JSON.stringify(report,null,2));
  await writeFile(`${folder}/index.html`,'<!doctype html><meta name="viewport" content="width=device-width"><title>LDB HOOK test</title><h1>HOOK cloud test</h1><p>One raw image only. Visual QA and full production are not complete.</p><a href="report.json">Test report</a><p><img style="max-width:100%" src="HOOK.jpg"></p>');
  console.log(JSON.stringify(report));
 }catch(e){console.error(/^[A-Z0-9_]+$/.test(e.message)?e.message:'HOOK_TEST_FAILED');process.exit(1)}
}

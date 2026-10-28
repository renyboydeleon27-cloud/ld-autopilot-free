import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const NAME='ner-ldb-runner';
export async function deployDisabledRunner({env=process.env,fetcher=fetch,read=readFile}={}) {
 const token=env.CLOUDFLARE_API_TOKEN;
 if(env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT || !token || /\s/.test(token))throw Error('CONFIGURATION_REQUIRED');
 const base=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers`;
 const headers={Authorization:`Bearer ${token}`};
 const api=async(path,options={})=>{
  const res=await fetcher(base+path,{...options,headers:{...headers,...options.headers},redirect:'error',signal:AbortSignal.timeout(60000)});
  let data;try{data=await res.json()}catch{throw Error('INVALID_API_RESPONSE')}
  if(!res.ok || data.success!==true) {const codes=(data.errors||[]).map(e=>e.code).filter(n=>Number.isInteger(n)).join(',');throw Error(`CLOUDFLARE_HTTP_${res.status}_CODES_${codes}`);}
  return data.result;
 };
 // Read-only permission check; never overwrite another existing deployment.
 const scripts=await api('/scripts');
 if(!Array.isArray(scripts))throw Error('INVALID_SCRIPT_LIST');
 if(scripts.some(s=>s.id===NAME))throw Error('WORKER_EXISTS_REVIEW_BEFORE_UPDATE');
 const files=['cloudflare/ldb-runner/worker.mjs','cloudflare/ldb-runner/checkpoints.mjs','lib/ldb/cloudflare-image.mjs'];
 const form=new FormData();
 const metadata={main_module:files[0],compatibility_date:'2026-10-28',compatibility_flags:['nodejs_compat'],
  bindings:[{name:'LDB_COORDINATOR',type:'durable_object_namespace',class_name:'LdbCoordinator'},
   {name:'RUNNER_ENABLED',type:'plain_text',text:'false'},{name:'FREE_PLAN_CONFIRMED',type:'plain_text',text:'false'},
   {name:'CLOUDFLARE_ACCOUNT_ID',type:'plain_text',text:ACCOUNT}],
  migrations:{new_tag:'v1',new_sqlite_classes:['LdbCoordinator']}};
 form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}));
 for(const path of files)form.set(path,new Blob([await read(path)],{type:'application/javascript+module'}),path);
 await api(`/scripts/${NAME}`,{method:'PUT',body:form});
 const settings=await api(`/scripts/${NAME}/settings`);
 const bindings=settings.bindings||[];
 if(!bindings.some(b=>b.name==='RUNNER_ENABLED' && b.text==='false') || !bindings.some(b=>b.name==='LDB_COORDINATOR' && b.type==='durable_object_namespace'))throw Error('POST_DEPLOY_VERIFICATION_FAILED');
 return {status:'DEPLOYED_DISABLED',worker:NAME,sqliteNamespaceBound:true,productionEnabled:false,googleConnected:false,verifiedAt:new Date().toISOString()};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 if(!process.argv.includes('--deploy-disabled')) {console.error('Explicit --deploy-disabled flag required');process.exit(1);}
 try {
  const result=await deployDisabledRunner();
  await mkdir('assets/ldb-runner-status',{recursive:true});
  await writeFile('assets/ldb-runner-status/deployment.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
  // Preserve the prior verified smoke sample without generating a second image.
  const imageResponse=await fetch('https://ld-autopilot-free.vercel.app/assets/ldb-cloudflare-portrait-smoke/sample.jpg',{redirect:'error',signal:AbortSignal.timeout(15000)});
  if(imageResponse.ok){const bytes=Buffer.from(await imageResponse.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')==='55df65358ab5ccc02fb33820466dd557dcdb4d3d6900be3498bc84755edfc271'){
   await mkdir('assets/ldb-cloudflare-portrait-smoke',{recursive:true});await writeFile('assets/ldb-cloudflare-portrait-smoke/sample.jpg',bytes);
  }}
 } catch(error) {console.error(/^CLOUDFLARE_HTTP_\d+_CODES_[\d,]*$/.test(error.message)?error.message:['CONFIGURATION_REQUIRED','WORKER_EXISTS_REVIEW_BEFORE_UPDATE','POST_DEPLOY_VERIFICATION_FAILED'].includes(error.message)?error.message:'DEPLOYMENT_OR_VERIFICATION_FAILED');process.exit(1);}
}

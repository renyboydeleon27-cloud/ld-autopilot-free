// Explicit isolated diagnostic deployment. No Google credentials or AI bindings.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {posix, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {checkFromDisk} from './ldb-cloudflare-isolated-probe-gate.mjs';
import {verifyLiveBindingProbe} from './ldb-live-binding-probe.mjs';

export async function collectModules(entry, read=path=>readFile(path,'utf8'), found=new Map()) {
 if(found.has(entry))return found;
 assert.match(entry,/^(cloudflare|lib)\/[a-zA-Z0-9_./-]+\.mjs$/);
 assert.ok(!entry.split('/').includes('..'));
 const source=await read(entry);found.set(entry,source);
 for(const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
  const specifier=match[1];
  if(specifier.startsWith('.'))await collectModules(posix.normalize(posix.join(posix.dirname(entry),specifier)),read,found);
  else assert.match(specifier,/^(node:|cloudflare:)/);
 }
 return found;
}

export async function main(){
 const account='a437dda5f38ba6b10991684b8388760b';
 assert.equal(process.env.VERCEL_ENV,'preview');
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,account);
 assert.ok(process.env.CLOUDFLARE_API_TOKEN);
 assert.ok(process.argv.includes('--isolated-read-only'));
 checkFromDisk();
 const configs=await Promise.all(['ldb-google-vault','ldb-runner'].map(async dir=>({dir:'cloudflare/'+dir,config:JSON.parse(await readFile('cloudflare/'+dir+'/wrangler.probe.jsonc','utf8'))})));
 // Resolve the complete module graph before any remote mutation.
 for(const item of configs)item.modules=await collectModules(item.dir+'/worker.mjs');
 const api=async(path,options={})=>{
  const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers'+path,{...options,redirect:'error',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...options.headers},signal:AbortSignal.timeout(45000)});
  const data=await response.json();
  if(!response.ok||!data.success)throw Error('CF_HTTP_'+response.status+'_CODES_'+(data.errors||[]).map(e=>e.code).join('_'));
  return data.result;
 };
 const existing=await api('/scripts');
 for(const {config} of configs)assert.ok(!existing.some(s=>s.id===config.name),'EXISTING_PROBE_REFUSED');
 const sub=await api('/subdomain');assert.match(sub.subdomain,/^[a-z0-9-]+$/);
 const bridgeSecret=randomBytes(32).toString('hex'),runnerSecret=randomBytes(32).toString('hex');
 const report={status:'PENDING',productionReady:false,created:[],checks:{},sourceCommit:process.env.VERCEL_GIT_COMMIT_SHA||null};
 let stage='DEPLOY';
 try {
  for(const {dir,config:c,modules} of configs){
   const bindings=[...Object.entries(c.vars).map(([name,text])=>({name,type:'plain_text',text})),...c.durable_objects.bindings.map(b=>({...b,type:'durable_object_namespace'})),...(c.services||[]).map(b=>({name:b.binding,type:'service',service:b.service})),{name:'GOOGLE_BRIDGE_PROBE_SECRET',type:'secret_text',text:bridgeSecret}];
   if(c.name==='ner-ldb-runner-binding-probe')bindings.push({name:'RUNNER_SECRET',type:'secret_text',text:runnerSecret});
   const form=new FormData();
   form.set('metadata',new Blob([JSON.stringify({main_module:dir+'/worker.mjs',compatibility_date:c.compatibility_date,compatibility_flags:c.compatibility_flags,bindings,migrations:{new_tag:'v1',new_sqlite_classes:c.migrations[0].new_sqlite_classes}})],{type:'application/json'}));
   for(const [name,source] of modules)form.set(name,new Blob([source],{type:'application/javascript+module'}),name);
   await api('/scripts/'+c.name,{method:'PUT',body:form});report.created.push(c.name);
   await api('/scripts/'+c.name+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:c.workers_dev,previews_enabled:false})});
  }
  stage='LIVE_AUTH';
  const origin='https://ner-ldb-runner-binding-probe.'+sub.subdomain+'.workers.dev';
  let authenticated=false;
  for(let attempt=0;attempt<10;attempt++){
   try{await verifyLiveBindingProbe({url:origin+'/delivery-bridge-probe',secret:runnerSecret});authenticated=true;break;}catch{}
   await new Promise(r=>setTimeout(r,3000));
  }
  assert.ok(authenticated,'BINDING_AUTH_FAILED');report.checks.authenticated=true;
  const request=async(path,secret,method='GET')=>fetch(origin+path,{method,redirect:'manual',headers:secret?{Authorization:'Bearer '+secret}:{},signal:AbortSignal.timeout(12000)});
  assert.equal((await request('/delivery-bridge-probe')).status,401);report.checks.noSecretRejected=true;
  assert.equal((await request('/delivery-bridge-probe','wrong-secret')).status,401);report.checks.wrongSecretRejected=true;
  assert.equal((await request('/delivery-bridge-probe',runnerSecret,'POST')).status,405);report.checks.nonGetRejected=true;
  assert.equal((await request('/jobs',runnerSecret,'POST')).status,503);report.checks.productionJobDisabled=true;
  stage='CONFIG_VERIFY';
  for(const {config:c} of configs){
   const settings=await api('/scripts/'+c.name+'/settings');
   for(const [key,value] of Object.entries(c.vars))assert.equal(settings.bindings.find(b=>b.name===key)?.text,value);
   const exposure=await api('/scripts/'+c.name+'/subdomain');assert.equal(exposure.enabled,c.workers_dev);
   const allowed=new Set([...Object.keys(c.vars),...c.durable_objects.bindings.map(b=>b.name),...(c.services||[]).map(b=>b.binding),'GOOGLE_BRIDGE_PROBE_SECRET',...(c.name.includes('runner')?['RUNNER_SECRET']:[])]);
   assert.ok(settings.bindings.every(b=>allowed.has(b.name)));
  }
  report.checks.flagsVerified=true;report.checks.vaultPublicAccessDisabled=true;
  report.status='BRIDGE_AUTHENTICATED';
 }catch(error){report.status='FAILED';report.stage=stage;report.code=/^CF_HTTP_/.test(error.message)?error.message:'PROBE_CHECK_FAILED';}
 finally {
  // Test secrets are ephemeral: revoke after the acceptance run, including failures.
  report.cleanupComplete=true;
  for(const name of report.created){
   for(const key of ['GOOGLE_BRIDGE_PROBE_SECRET',...(name.includes('runner')?['RUNNER_SECRET']:[])]){
    try{await api('/scripts/'+name+'/secrets/'+key,{method:'DELETE'});}catch{report.cleanupComplete=false;}
   }
  }
  await mkdir('cloudflare/ldb-google-vault/public',{recursive:true});
  await writeFile('cloudflare/ldb-google-vault/public/binding-probe.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
 }
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();

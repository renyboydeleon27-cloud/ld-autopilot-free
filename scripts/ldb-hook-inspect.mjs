// Read persisted test state only. Does not submit, resume or generate an image.
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
const account='a437dda5f38ba6b10991684b8388760b',name='ner-ldb-runner-quality';
const token=process.env.CLOUDFLARE_API_TOKEN,key=randomBytes(32).toString('hex');
if(process.env.CLOUDFLARE_ACCOUNT_ID!==account||!token)throw Error('CONFIGURATION_REQUIRED');
const api=async(path,options={})=>{
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers${path}`,{...options,headers:{Authorization:`Bearer ${token}`,...options.headers},redirect:'error',signal:AbortSignal.timeout(20000)});
 const d=await r.json();if(!r.ok||d.success!==true)throw Error(`CLOUDFLARE_HTTP_${r.status}`);return d.result;
};
try{
 const sub=await api('/subdomain');if(!/^[a-z0-9-]+$/.test(sub?.subdomain||''))throw Error('INVALID_SUBDOMAIN');
 await api(`/scripts/${name}/secrets`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'RUNNER_SECRET',type:'secret_text',text:key})});
 let report;
 try{
  const r=await fetch(`https://${name}.${sub.subdomain}.workers.dev/status`,{headers:{Authorization:`Bearer ${key}`},redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error(`RUNNER_HTTP_${r.status}`);report=await r.json();
 }finally{await api(`/scripts/${name}/secrets/RUNNER_SECRET`,{method:'DELETE'});}
 const secrets=await api(`/scripts/${name}/secrets`);
 if(secrets.some(s=>['RUNNER_SECRET','CLOUDFLARE_API_TOKEN'].includes(s.name)))throw Error('CREDENTIAL_CLEANUP_NOT_CONFIRMED');
 report={...report,inspection:'READ_ONLY_NO_IMAGE_RETRY',runtimeCredentialsRemoved:true,verifiedAt:new Date().toISOString()};
 const dir='cloudflare/ldb-runner/public';await mkdir(dir,{recursive:true});await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));await writeFile(`${dir}/index.html`,'<!doctype html><h1>LDB cloud test status</h1><p>Rendering requires investigation. No completed image.</p><a href="report.json">Verified persisted job report</a>');
 console.log(JSON.stringify(report));
}catch(e){console.error(/^[A-Z0-9_]+$/.test(e.message)?e.message:'INSPECTION_FAILED');process.exit(1)}

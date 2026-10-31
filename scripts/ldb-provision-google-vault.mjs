// Explicit provisioning only; never part of a normal build. No credential output.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b', NAME='ner-ldb-google-vault-quality';
export async function provision({env=process.env,fetcher=fetch,read=readFile,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
 if(env.VERCEL_ENV!=='preview'||env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||!env.CLOUDFLARE_API_TOKEN||!env.LDB_GOOGLE_CLIENT_ID||!env.LDB_GOOGLE_CLIENT_SECRET||!/^\w{64}$/.test(env.LDB_GOOGLE_VAULT_SECRET||'')||!/^[a-f0-9]{64}$/i.test(env.LDB_GOOGLE_VAULT_KEY||''))throw Error('VAULT_PROVISION_CONFIGURATION_REQUIRED');
 const api=async(path,options={})=>{
  const r=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers`+path,{...options,redirect:'error',headers:{Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN,...options.headers},signal:AbortSignal.timeout(60000)});
  let d;try{d=await r.json()}catch{throw Error('CLOUDFLARE_RESPONSE_INVALID')}
  if(!r.ok||d.success!==true)throw Error('CLOUDFLARE_HTTP_'+r.status);return d.result;
 };
 const scripts=await api('/scripts');
 if(!Array.isArray(scripts)||scripts.some(s=>s.id===NAME))throw Error('EXISTING_VAULT_REQUIRES_REVIEW');
 const sub=await api('/subdomain');if(!/^[a-z0-9-]+$/.test(sub?.subdomain||''))throw Error('INVALID_SUBDOMAIN');
 const endpoint=`https://${NAME}.${sub.subdomain}.workers.dev`;
 const files=['cloudflare/ldb-google-vault/worker.mjs','cloudflare/ldb-google-vault/core.mjs'];
 const bindings=[{name:'GOOGLE_VAULT',type:'durable_object_namespace',class_name:'LdbGoogleVault'},{name:'VAULT_ENABLED',type:'plain_text',text:'true'},...Object.entries({VAULT_KEY:env.LDB_GOOGLE_VAULT_KEY,VAULT_SECRET:env.LDB_GOOGLE_VAULT_SECRET,GOOGLE_CLIENT_ID:env.LDB_GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET:env.LDB_GOOGLE_CLIENT_SECRET}).map(([name,text])=>({name,type:'secret_text',text}))];
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify({main_module:files[0],compatibility_date:'2026-10-28',compatibility_flags:['nodejs_compat'],bindings,migrations:{new_tag:'v1',new_sqlite_classes:['LdbGoogleVault']}})],{type:'application/json'}));
 for(const p of files)form.set(p,new Blob([await read(p)],{type:'application/javascript+module'}),p);
 await api(`/scripts/${NAME}`,{method:'PUT',body:form});
 await api(`/scripts/${NAME}/subdomain`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
 const call=(path,body,auth=true)=>fetcher(endpoint+path,{method:body?'POST':'GET',redirect:'error',headers:{...(auth?{Authorization:'Bearer '+env.LDB_GOOGLE_VAULT_SECRET}:{}),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
 let ready=false;for(let i=0;i<12;i++){try{const r=await call('/status');if(r.ok){ready=true;break;}}catch{}await sleep(5000);}
 if(!ready)throw Error('VAULT_ROUTE_NOT_READY');
 if((await call('/status',null,false)).status!==401)throw Error('VAULT_AUTH_TEST_FAILED');
 const status=await (await call('/status')).json();if(status.connected!==false||status.deliveryReady!==false)throw Error('VAULT_INITIAL_STATE_INVALID');
 const claim={id:randomBytes(32).toString('hex'),expiresAt:Date.now()+60000};
 if(!(await call('/claim',claim)).ok||(await call('/claim',claim)).status!==409)throw Error('VAULT_REPLAY_TEST_FAILED');
 if((await call('/credentials',{email:'wrong@example.invalid',subject:'synthetic',refreshToken:'synthetic',scopes:[]})).status!==409)throw Error('VAULT_OWNER_TEST_FAILED');
 if((await call('/token')).status!==404)throw Error('VAULT_TOKEN_EXPORT_TEST_FAILED');
 return {status:'VAULT_DEPLOYED_NOT_CONNECTED',endpoint,unauthenticatedBlocked:true,replayBlocked:true,invalidCredentialsBlocked:true,tokenExportBlocked:true,googleConnected:false,deliveryReady:false,verifiedAt:new Date().toISOString()};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv.includes('--preview-free-vault')){console.error('EXPLICIT_FLAG_REQUIRED');process.exit(1)}
 try{const report=await provision();const folder='cloudflare/ldb-google-vault/public';await mkdir(folder,{recursive:true});await writeFile(folder+'/report.json',JSON.stringify(report,null,2));await writeFile(folder+'/index.html','<!doctype html><title>LDB vault test</title><h1>Token storage test</h1><p>Google authorization and delivery are not connected.</p><a href="report.json">Report</a>');console.log(JSON.stringify(report));}
 catch(e){console.error(/^[A-Z0-9_]+$/.test(e.message)?e.message:'VAULT_PROVISION_FAILED');process.exit(1)}
}

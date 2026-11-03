// Explicit reviewed update: preserve vault keys, namespace and stored records.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const account='a437dda5f38ba6b10991684b8388760b',name='ner-ldb-google-vault-quality';
if(process.env.VERCEL_ENV!=='preview'||process.env.CLOUDFLARE_ACCOUNT_ID!==account||!process.argv.includes('--verify-google-connection'))throw Error('PREVIEW_CONFIGURATION_REQUIRED');
const api=async(path,options={})=>{const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers`+path,{...options,redirect:'error',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...options.headers},signal:AbortSignal.timeout(60000)});const d=await r.json();if(!r.ok||!d.success)throw Error('CLOUDFLARE_HTTP_'+r.status);return d.result;};
const before=await api('/scripts/'+name+'/settings');const binding=before.bindings?.find(x=>x.name==='GOOGLE_VAULT');
if(!binding?.namespace_id||binding.class_name!=='LdbGoogleVault')throw Error('EXISTING_NAMESPACE_REQUIRED');
for(const key of ['VAULT_KEY','VAULT_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'])if(!before.bindings.some(b=>b.name===key&&b.type==='secret_text'))throw Error('EXISTING_SECRET_REQUIRED');
const files=['cloudflare/ldb-google-vault/worker.mjs','cloudflare/ldb-google-vault/core.mjs','cloudflare/ldb-google-vault/acceptance.mjs','lib/ldb/google-delivery.mjs','lib/ldb/production-delivery.mjs'];
const form=new FormData();form.set('metadata',new Blob([JSON.stringify({main_module:files[0],compatibility_date:'2026-10-28',compatibility_flags:['nodejs_compat'],keep_bindings:['secret_text','plain_text','durable_object_namespace']})],{type:'application/json'}));
for(const p of files)form.set(p,new Blob([await readFile(p)],{type:'application/javascript+module'}),p);
await api('/scripts/'+name,{method:'PUT',body:form});
const after=await api('/scripts/'+name+'/settings');if(after.bindings?.find(b=>b.name==='GOOGLE_VAULT')?.namespace_id!==binding.namespace_id)throw Error('NAMESPACE_VERIFICATION_FAILED');
for(const b of before.bindings)if(!after.bindings.some(a=>a.name===b.name&&a.type===b.type))throw Error('BINDING_VERIFICATION_FAILED');
const r=await fetch(process.env.LDB_GOOGLE_VAULT_URL+'/status',{headers:{Authorization:'Bearer '+process.env.LDB_GOOGLE_VAULT_SECRET},redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('UPDATED_VAULT_STATUS_FAILED');const status=await r.json();
await mkdir('cloudflare/ldb-google-vault/public',{recursive:true});
const v=await fetch(process.env.LDB_GOOGLE_VAULT_URL+'/verify',{method:'POST',headers:{Authorization:'Bearer '+process.env.LDB_GOOGLE_VAULT_SECRET},redirect:'error',signal:AbortSignal.timeout(20000)});
const result=await v.json();const verified=v.ok&&result.verified===true;
const codes=['NOT_FOUND','VAULT_DATA_INVALID','GOOGLE_NOT_CONFIGURED','GOOGLE_RECONNECT_REQUIRED','GOOGLE_REFRESH_UNAVAILABLE','GOOGLE_REFRESH_TRANSPORT_TYPE','GOOGLE_REFRESH_TIMEOUT','GOOGLE_REFRESH_RESPONSE_INVALID','GOOGLE_CLIENT_REJECTED','GOOGLE_REFRESH_REQUEST_REJECTED','GOOGLE_REFRESH_HTTP_FAILED','GOOGLE_REFRESH_INVALID','GOOGLE_CONNECTION_CHANGED','GOOGLE_VERIFICATION_FAILED'];
const report={googleConnected:status.connected===true,refreshVerified:verified,verificationHttpStatus:v.status,diagnostic:verified?'PASS':codes.includes(result.status)?result.status:'UNKNOWN',namespacePreserved:true,bindingsPreserved:true,driveUploadTested:false,gmailSendTested:false};
await writeFile('cloudflare/ldb-google-vault/public/refresh-check.json',JSON.stringify(report));console.log(JSON.stringify(report));

if(verified&&process.argv.includes('--delivery-acceptance')){
 const a=await fetch(process.env.LDB_GOOGLE_VAULT_URL+'/acceptance',{method:'POST',headers:{Authorization:'Bearer '+process.env.LDB_GOOGLE_VAULT_SECRET},redirect:'error',signal:AbortSignal.timeout(60000)});
 const data=await a.json();
 const safe={httpStatus:a.status,driveVerified:data.driveVerified===true,gmailStatus:['SENT','CLAIMED','UNCERTAIN'].includes(data.gmailStatus)?data.gmailStatus:null,diagnostic:['DRIVE_ID_UNAVAILABLE','DRIVE_VERIFY_UNAVAILABLE','DRIVE_CONTENT_MISMATCH','DRIVE_UPLOAD_UNCONFIRMED','DRIVE_REQUEST_UNCERTAIN','DRIVE_RETRY_LIMIT','ACCEPTANCE_FAILED'].includes(data.status)?data.status:null,productionComplete:false};
 await writeFile('cloudflare/ldb-google-vault/public/delivery-check.json',JSON.stringify(safe));console.log(JSON.stringify(safe));
}

if(verified&&process.argv.includes('--storage-check')){
 const r=await fetch(process.env.LDB_GOOGLE_VAULT_URL+'/capacity',{headers:{Authorization:'Bearer '+process.env.LDB_GOOGLE_VAULT_SECRET},redirect:'error',signal:AbortSignal.timeout(20000)});const d=await r.json();
 const safe={httpStatus:r.status,unlimited:r.ok&&d.unlimited===true,remaining:r.ok&&typeof d.remaining==='string'&&/^\d+$/.test(d.remaining)?d.remaining:null};await writeFile('cloudflare/ldb-google-vault/public/storage-check.json',JSON.stringify(safe));console.log(JSON.stringify(safe));
}

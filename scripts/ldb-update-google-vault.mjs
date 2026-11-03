// Explicit reviewed update: preserve vault keys, namespace and stored records.
import {readFile,writeFile} from 'node:fs/promises';
const account='a437dda5f38ba6b10991684b8388760b',name='ner-ldb-google-vault-quality';
if(process.env.VERCEL_ENV!=='preview'||process.env.CLOUDFLARE_ACCOUNT_ID!==account||!process.argv.includes('--preserve-existing-vault'))throw Error('PREVIEW_CONFIGURATION_REQUIRED');
const probe=JSON.parse(await readFile('cloudflare/ldb-google-vault/public/save-probe.json','utf8'));if(probe.passed!==true||probe.syntheticOnly!==true)throw Error('CLOUD_SAVE_PROBE_MUST_PASS');
const api=async(path,options={})=>{const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers`+path,{...options,redirect:'error',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...options.headers},signal:AbortSignal.timeout(60000)});const d=await r.json();if(!r.ok||!d.success)throw Error('CLOUDFLARE_HTTP_'+r.status);return d.result;};
const before=await api('/scripts/'+name+'/settings');const binding=before.bindings?.find(x=>x.name==='GOOGLE_VAULT');
if(!binding?.namespace_id||binding.class_name!=='LdbGoogleVault')throw Error('EXISTING_NAMESPACE_REQUIRED');
for(const key of ['VAULT_KEY','VAULT_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'])if(!before.bindings.some(b=>b.name===key&&b.type==='secret_text'))throw Error('EXISTING_SECRET_REQUIRED');
const files=['cloudflare/ldb-google-vault/worker.mjs','cloudflare/ldb-google-vault/core.mjs'];
const form=new FormData();form.set('metadata',new Blob([JSON.stringify({main_module:files[0],compatibility_date:'2026-10-28',compatibility_flags:['nodejs_compat'],keep_bindings:['secret_text','plain_text','durable_object_namespace']})],{type:'application/json'}));
for(const p of files)form.set(p,new Blob([await readFile(p)],{type:'application/javascript+module'}),p);
await api('/scripts/'+name,{method:'PUT',body:form});
const after=await api('/scripts/'+name+'/settings');if(after.bindings?.find(b=>b.name==='GOOGLE_VAULT')?.namespace_id!==binding.namespace_id)throw Error('NAMESPACE_VERIFICATION_FAILED');
for(const b of before.bindings)if(!after.bindings.some(a=>a.name===b.name&&a.type===b.type))throw Error('BINDING_VERIFICATION_FAILED');
const r=await fetch(process.env.LDB_GOOGLE_VAULT_URL+'/status',{headers:{Authorization:'Bearer '+process.env.LDB_GOOGLE_VAULT_SECRET},redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('UPDATED_VAULT_STATUS_FAILED');const status=await r.json();
const report={updated:true,syntheticCloudSavePassed:true,namespacePreserved:true,bindingsPreserved:true,googleConnected:status.connected===true,realConsentRetestRequired:status.connected!==true};
await writeFile('cloudflare/ldb-google-vault/public/vault-fix.json',JSON.stringify(report));console.log(JSON.stringify(report));

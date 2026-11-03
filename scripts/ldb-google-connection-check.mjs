// Preview-only backend checks. Never prints credentials or calls Google token APIs.
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
if(process.env.VERCEL_ENV!=='preview')throw Error('PREVIEW_ONLY');
const base=process.env.LDB_GOOGLE_VAULT_URL;
if(!/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/.test(base||''))throw Error('INVALID_VAULT');
const report={googleConnected:false,checks:{}};
for(const path of ['/status','/claim']){
 try{
 const body=path==='/claim'?JSON.stringify({id:randomBytes(32).toString('hex'),expiresAt:Date.now()+60000}):undefined;
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+process.env.LDB_GOOGLE_VAULT_SECRET,'Content-Type':'application/json'},body,redirect:'error',signal:AbortSignal.timeout(15000)});
 report.checks[path]={httpStatus:r.status};
 if(path==='/status'&&r.ok){const d=await r.json();report.googleConnected=d.connected===true;}
 }catch{report.checks[path]={error:'NETWORK_FAILED'};}
}
try{const r=await fetch('https://accounts.google.com/.well-known/openid-configuration',{redirect:'error',signal:AbortSignal.timeout(15000)});report.checks.discovery={httpStatus:r.status};}catch{report.checks.discovery={error:'NETWORK_FAILED'};}
await mkdir('cloudflare/ldb-google-vault/public',{recursive:true});
await writeFile('cloudflare/ldb-google-vault/public/connection-check.json',JSON.stringify(report));
console.log(JSON.stringify(report));

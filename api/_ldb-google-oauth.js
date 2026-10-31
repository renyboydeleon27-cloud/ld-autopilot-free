'use strict';
const crypto = require('node:crypto');
const ORIGIN = 'https://ld-autopilot-free.vercel.app';
const CALLBACK = ORIGIN + '/api/ldb-google-callback';
const OWNER = 'renyboydeleon27@gmail.com';
const SCOPES = ['openid','email','https://www.googleapis.com/auth/gmail.send','https://www.googleapis.com/auth/drive.file'];
function callbackUrl(env=process.env) {
  if(env.VERCEL_ENV==='preview') {
    if(env.VERCEL_BRANCH_URL==='ld-autopilot-free-git-feature-ldb-pro-7f581c-renyboydeleon-5731.vercel.app') return 'https://'+env.VERCEL_BRANCH_URL+'/api/ldb-google-callback';
    if(!/^ld-autopilot-free-[a-z0-9-]+\.vercel\.app$/.test(env.VERCEL_URL||'')) throw Error('Invalid preview origin');
    return 'https://'+env.VERCEL_URL+'/api/ldb-google-callback';
  }
  return CALLBACK;
}
function config() {
  const clientId = process.env.LDB_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.LDB_GOOGLE_CLIENT_SECRET;
  const key = process.env.LDB_GOOGLE_COOKIE_KEY;
  if (!clientId || !clientSecret || !key || !/^[a-f0-9]{64}$/i.test(key)) throw new Error('Google OAuth server configuration incomplete');
  const vaultUrl=process.env.LDB_GOOGLE_VAULT_URL;
  const vaultSecret=process.env.LDB_GOOGLE_VAULT_SECRET;
  if (!vaultUrl || !/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/.test(vaultUrl) || !vaultSecret || vaultSecret.length<32) throw new Error('Google vault configuration incomplete');
  return {callback:callbackUrl(),clientId,clientSecret,key:Buffer.from(key,'hex'),vaultUrl,vaultSecret};
}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const n=x.indexOf('=');return [x.slice(0,n),x.slice(n+1)]}));}
function seal(value,key){const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64url');}
function unseal(value,key){const b=Buffer.from(value,'base64url');if(b.length<29)throw Error('Invalid cookie');const dec=crypto.createDecipheriv('aes-256-gcm',key,b.subarray(0,12));dec.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([dec.update(b.subarray(28)),dec.final()]).toString());}
function cookie(name,value,maxAge){return name+'='+value+'; Path=/api/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge;}
function html(res,status,message){res.status(status).setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><html><meta name="viewport" content="width=device-width"><title>LDB Google</title><body><h2>'+message+'</h2><p><a href="/">Back to NER STUDIO</a></p></body></html>');}
async function vault(cfg,path,body){
 const response=await fetch(cfg.vaultUrl+path,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+cfg.vaultSecret,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('VAULT_UNAVAILABLE');
 return response.json();
}
module.exports={callbackUrl,OWNER,vault,config,cookies,seal,unseal,cookie,html,ORIGIN,CALLBACK,SCOPES};

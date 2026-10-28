'use strict';
const crypto=require('node:crypto');
const {config,cookies,unseal,seal,cookie,html,CALLBACK}=require('./_ldb-google-oauth');
module.exports=async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end();}
 res.setHeader('Cache-Control','no-store');
 let cfg;try{cfg=config();}catch{return html(res,503,'Google connection is not configured yet.');}
 const c=cookies(req);
 let pending;try{pending=unseal(c.ldb_google_pending||'',cfg.key);}catch{return html(res,400,'Sign-in session expired. Start again from NER STUDIO.');}
 res.setHeader('Set-Cookie',cookie('ldb_google_pending','',0));
 const u=new URL(req.url,'https://example.invalid');
 const state=u.searchParams.get('state')||'';
 if(!state||!pending.state||state.length!==pending.state.length||!crypto.timingSafeEqual(Buffer.from(state),Buffer.from(pending.state))||Date.now()>pending.exp)return html(res,400,'Invalid or expired sign-in session.');
 if(u.searchParams.has('error'))return html(res,400,'Google permission was not granted.');
 const code=u.searchParams.get('code');if(!code)return html(res,400,'Missing Google authorization code.');
 try{
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:cfg.clientId,client_secret:cfg.clientSecret,redirect_uri:CALLBACK,grant_type:'authorization_code',code_verifier:pending.verifier}),signal:AbortSignal.timeout(12000)});
  if(!response.ok)return html(res,502,'Google authorization could not be completed.');
  const data=await response.json();
  if(!data.refresh_token)return html(res,409,'Google did not provide offline authorization. Please reconnect.');
  // Encrypted, HttpOnly cookie: prototype only. Persistent cloud jobs require a server-side encrypted token vault.
  const token=seal({refresh_token:data.refresh_token,created:Date.now()},cfg.key);
  if(token.length>3500)return html(res,500,'Google authorization storage limit exceeded.');
  res.setHeader('Set-Cookie',[cookie('ldb_google_pending','',0),cookie('ldb_google_token',token,86400)]);
  return html(res,200,'Google authorization received. Background delivery is not enabled yet.');
 }catch{return html(res,502,'Google connection failed. Please retry later.');}
};

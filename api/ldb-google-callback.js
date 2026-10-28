'use strict';
const crypto=require('node:crypto');
const {config,cookies,unseal,cookie,html,CALLBACK}=require('./_ldb-google-oauth');
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
  if(!data.access_token || !data.refresh_token)return html(res,409,'Google did not provide the required authorization. Please reconnect.');
  // Connection smoke test only: never put long-lived credentials into a browser cookie.
  // Refresh tokens must be stored server-side in an encrypted vault before enabling background jobs.
  return html(res,200,'Google authorization exchange succeeded (test only). No tokens saved. Background delivery is not enabled yet.');
 }catch{return html(res,502,'Google connection failed. Please retry later.');}
};

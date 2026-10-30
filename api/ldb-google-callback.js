'use strict';
const crypto=require('node:crypto');
const {config,cookies,unseal,cookie,html,CALLBACK,SCOPES,OWNER,vault}=require('./_ldb-google-oauth');
module.exports=async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end();}
 res.setHeader('Cache-Control','no-store');
 let cfg;try{cfg=config();}catch{return html(res,503,'Google connection is not configured yet.');}
 const c=cookies(req);
 let pending;try{pending=unseal(c.ldb_google_pending||'',cfg.key);}catch{return html(res,400,'Sign-in session expired. Start again from NER STUDIO.');}
 res.setHeader('Set-Cookie',cookie('ldb_google_pending','',0));
 const u=new URL(req.url,'https://example.invalid');
 const state=u.searchParams.get('state')||'';
 if(!/^[A-Za-z0-9_-]{32}$/.test(state)||typeof pending.state!=='string'||!Number.isFinite(pending.exp)||pending.exp<Date.now()||pending.exp>Date.now()+600000||typeof pending.verifier!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(pending.verifier)||Buffer.byteLength(state)!==Buffer.byteLength(pending.state)||!crypto.timingSafeEqual(Buffer.from(state),Buffer.from(pending.state)))return html(res,400,'Invalid or expired sign-in session.');
 if(u.searchParams.has('error'))return html(res,400,'Google permission was not granted.');
 const code=u.searchParams.get('code');if(!code)return html(res,400,'Missing Google authorization code.');
 try{
  await vault(cfg,'/claim',{id:crypto.createHash('sha256').update(state).digest('hex'),expiresAt:pending.exp});
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:cfg.clientId,client_secret:cfg.clientSecret,redirect_uri:cfg.callback,grant_type:'authorization_code',code_verifier:pending.verifier}),signal:AbortSignal.timeout(12000)});
  if(!response.ok)return html(res,502,'Google authorization could not be completed.');
  const data=await response.json();
  if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string'||!data.access_token||!data.refresh_token||data.token_type?.toLowerCase()!=='bearer')return html(res,409,'Google did not provide the required authorization. Please reconnect.');
  const granted=new Set(typeof data.scope==='string'?data.scope.split(' '):[]);
  if(!SCOPES.filter(s=>s.startsWith('https://')).every(s=>granted.has(s)))return html(res,403,'Drive and Gmail permissions are both required.');
  const identityResponse=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+data.access_token},redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!identityResponse.ok)throw Error('IDENTITY_UNAVAILABLE');
  const identity=await identityResponse.json();
  if(identity.email_verified!==true||identity.email!==OWNER||typeof identity.sub!=='string'||!identity.sub)return html(res,403,'Connect the configured NER STUDIO sender account.');
  await vault(cfg,'/credentials',{email:identity.email,subject:identity.sub,refreshToken:data.refresh_token,scopes:[...granted]});
  return html(res,200,'Google connection saved securely. Production and delivery still require their acceptance tests.');
 }catch{return html(res,502,'Google connection failed. Please retry later.');}
};

'use strict';
const crypto=require('node:crypto');
const {config,seal,cookie,html,CALLBACK,SCOPES,OWNER}=require('./_ldb-google-oauth');
module.exports=async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end();}
  let cfg;try{cfg=config();}catch{return html(res,503,'Google connection is not configured yet.');}
  const state=crypto.randomBytes(24).toString('base64url');
  const verifier=crypto.randomBytes(32).toString('base64url');
  const challenge=crypto.createHash('sha256').update(verifier).digest('base64url');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Set-Cookie',cookie('ldb_google_pending',seal({state,verifier,exp:Date.now()+600000},cfg.key),600));
  const q=new URLSearchParams({client_id:cfg.clientId,redirect_uri:cfg.callback,response_type:'code',scope:SCOPES.join(' '),login_hint:OWNER,access_type:'offline',prompt:'consent',state,code_challenge:challenge,code_challenge_method:'S256'});
  res.writeHead(302,{Location:'https://accounts.google.com/o/oauth2/v2/auth?'+q});res.end();
};

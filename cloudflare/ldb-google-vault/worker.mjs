import {DurableObject} from 'cloudflare:workers';
import {createHash,timingSafeEqual} from 'node:crypto';
import {GoogleVault} from './core.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default {async fetch(req,env){
 if(env.VAULT_ENABLED!=='true'||!env.VAULT_SECRET||env.VAULT_SECRET.length<32||!/^[a-f0-9]{64}$/i.test(env.VAULT_KEY||''))return json({status:'SETUP_REQUIRED'},503);
 const hash=s=>createHash('sha256').update(s).digest();
 if(!timingSafeEqual(hash(req.headers.get('Authorization')||''),hash('Bearer '+env.VAULT_SECRET)))return json({status:'UNAUTHORIZED'},401);
 return env.GOOGLE_VAULT.getByName('single-owner-v1').fetch(req);
}};
export class LdbGoogleVault extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.core=new GoogleVault(ctx.storage,{key:env.VAULT_KEY,clientId:env.GOOGLE_CLIENT_ID,clientSecret:env.GOOGLE_CLIENT_SECRET});}
 async fetch(req){
  const path=new URL(req.url).pathname;
  if(req.method==='GET'&&path==='/status')return json(await this.core.status());
  if(req.method==='POST'&&path==='/verify'){
   try{return json(await this.core.verify());}catch(error){const allowed=['VAULT_DATA_INVALID','GOOGLE_NOT_CONFIGURED','GOOGLE_RECONNECT_REQUIRED','GOOGLE_REFRESH_UNAVAILABLE','GOOGLE_REFRESH_INVALID','GOOGLE_CONNECTION_CHANGED'];return json({verified:false,status:allowed.includes(error.message)?error.message:'GOOGLE_VERIFICATION_FAILED'},502);}
  }
  if(req.method!=='POST'||!['/claim','/credentials'].includes(path))return json({status:'NOT_FOUND'},404);
  try{
   const reader=req.body?.getReader();if(!reader)throw Error();
   const parts=[];let size=0;
   for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();return json({status:'TOO_LARGE'},413);}parts.push(Buffer.from(value));}
   const body=JSON.parse(Buffer.concat(parts).toString());
   if(path==='/claim')await this.core.claim(body);else await this.core.save(body);
   return json({ok:true});
  }catch{return json({status:'REQUEST_REJECTED'},409);}
 }
}

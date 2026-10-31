import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
export const OWNER='renyboydeleon27@gmail.com';
const REQUIRED=['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/gmail.send'];
const AAD=Buffer.from('ldb-google-vault-v1:'+OWNER);
export class GoogleVault {
 constructor(storage,{key,clientId,clientSecret,fetcher=fetch,now=Date.now}){
  if(!/^[a-f0-9]{64}$/i.test(key||''))throw Error('VAULT_NOT_CONFIGURED');
  this.storage=storage;this.key=Buffer.from(key,'hex');this.clientId=clientId;this.clientSecret=clientSecret;this.fetcher=fetcher;this.now=now;
 }
 encrypt(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(AAD);const bytes=Buffer.concat([cipher.update(Buffer.from(JSON.stringify(value),'utf8')),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),bytes]).toString('base64');}
 decrypt(value){try{const bytes=Buffer.from(value,'base64'),cipher=createDecipheriv('aes-256-gcm',this.key,bytes.subarray(0,12));cipher.setAAD(AAD);cipher.setAuthTag(bytes.subarray(12,28));return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString());}catch{throw Error('VAULT_DATA_INVALID');}}
 async claim({id,expiresAt}){
  const now=this.now();
  if(!/^[a-f0-9]{64}$/.test(id||'')||!Number.isFinite(expiresAt)||expiresAt<=now||expiresAt>now+600000)throw Error('INVALID_CLAIM');
  await this.storage.transaction(async tx=>{
   const claims=(await tx.get('claims')||[]).filter(x=>x.expiresAt>now);
   if(claims.some(x=>x.id===id)||claims.length>=24)throw Error('CLAIM_REJECTED');
   claims.push({id,expiresAt});await tx.put('claims',claims);
  });
 }
 async save({email,subject,refreshToken,scopes}){
  if(email!==OWNER||typeof subject!=='string'||!subject||subject.length>255||typeof refreshToken!=='string'||!refreshToken||refreshToken.length>8192||!Array.isArray(scopes)||!REQUIRED.every(x=>scopes.includes(x)))throw Error('INVALID_CREDENTIALS');
  const record={version:1,ciphertext:this.encrypt({email,subject,refreshToken,scopes:REQUIRED}),connectedAt:this.now(),reconnectRequired:false};
  await this.storage.put('credentials',record);this.access=null;
 }
 async status(){const r=await this.storage.get('credentials');return {connected:!!r&&!r.reconnectRequired,reconnectRequired:!!r?.reconnectRequired,deliveryReady:false};}
 // Internal adapter only: there is deliberately no HTTP token-export route.
 async accessToken(){
  if(this.refreshing)return this.refreshing;
  this.refreshing=this.refresh();try{return await this.refreshing;}finally{this.refreshing=null;}
 }
 async refresh(){
  if(this.access?.expiresAt>this.now()+60000)return this.access.token;
  if(!this.clientId||!this.clientSecret)throw Error('GOOGLE_NOT_CONFIGURED');
  const record=await this.storage.get('credentials');
  if(!record||record.reconnectRequired)throw Error('GOOGLE_RECONNECT_REQUIRED');
  const saved=this.decrypt(record.ciphertext);
  let response,data;
  try{response=await this.fetcher('https://oauth2.googleapis.com/token',{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:saved.refreshToken,client_id:this.clientId,client_secret:this.clientSecret}),signal:AbortSignal.timeout(12000)});data=await response.json();}catch{throw Error('GOOGLE_REFRESH_UNAVAILABLE');}
  if(!response.ok){
   if(data.error==='invalid_grant'){
    await this.storage.transaction(async tx=>{const current=await tx.get('credentials');if(current?.ciphertext===record.ciphertext)await tx.put('credentials',{...record,reconnectRequired:true});});
    throw Error('GOOGLE_RECONNECT_REQUIRED');
   }throw Error('GOOGLE_REFRESH_UNAVAILABLE');
  }
  if(typeof data.access_token!=='string'||!data.access_token||data.token_type?.toLowerCase()!=='bearer'||!Number.isFinite(data.expires_in)||data.expires_in<120||data.expires_in>86400)throw Error('GOOGLE_REFRESH_INVALID');
  // A reconnect can race a pending refresh; never return a superseded account token.
  if((await this.storage.get('credentials'))?.ciphertext!==record.ciphertext)throw Error('GOOGLE_CONNECTION_CHANGED');
  this.access={token:data.access_token,expiresAt:this.now()+data.expires_in*1000};return this.access.token;
 }
}

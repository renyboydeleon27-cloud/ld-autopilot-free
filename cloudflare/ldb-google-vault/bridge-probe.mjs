// Separate read-only bridge authentication, using a credential that is
// NOT usable for Drive delivery or owner Google OAuth.
import {createHash,timingSafeEqual} from 'node:crypto';
const json=(x,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
const hash=s=>createHash('sha256').update(s).digest();
export const isBridgeHealthPath=path=>path==='/internal/bridge/health';
// This read-only route MUST run at the Worker edge, before any Google Vault
// credential gate or Durable Object construction. It authenticates the private
// service binding without initializing OAuth or reading persisted account data.
export function routeVaultHealthProbe(request,env){
 if(!isBridgeHealthPath(new URL(request.url).pathname))return null;
 return handleVaultBridgeHealth(request,{
  enabled:env?.BRIDGE_PROBE_ENABLED==='true',
  secret:env?.GOOGLE_BRIDGE_PROBE_SECRET
 });
}
export function handleVaultBridgeHealth(request,{enabled=false,secret}={}){
 if(!isBridgeHealthPath(new URL(request.url).pathname))return json({status:'NOT_FOUND'},404);
 if(enabled!==true||typeof secret!=='string'||secret.length<32)return json({status:'SETUP_REQUIRED'},503);
 if(!timingSafeEqual(hash(request.headers.get('Authorization')||''),hash('Bearer '+secret)))return json({status:'UNAUTHORIZED'},401);
 if(request.method!=='GET')return json({status:'METHOD_NOT_ALLOWED'},405);
 // No vault.core, accessToken, storage or Google API calls.
 return json({status:'BRIDGE_AUTHENTICATED'});
}

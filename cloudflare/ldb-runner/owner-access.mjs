// A disabled image provider must NEVER lock an owner out of STOP and status.
// This is only a narrow authentication/routing gate; it does NOT start jobs,
// resume a worker, create approvals, upload to Drive, or bypass inference caps.
import {createHash,timingSafeEqual} from 'node:crypto';
const deny=(status,code)=>Response.json({status:code},{status,headers:{'Cache-Control':'no-store'}});
const imagePath=/^\/images\/(?:HOOK|P(?:[1-9]|1[0-4])|ENDING|THUMBNAIL)$/;
export function isOwnerSafeRoute(req){
 const path=new URL(req.url).pathname;
 return (req.method==='GET'&&(
  path==='/status'||path==='/delivery-readiness'||
  path==='/delivery-next-action'||imagePath.test(path)))||
  (req.method==='POST'&&path==='/stop');
}
export function ownerAccessGate(req,env={}){
 const path=new URL(req.url).pathname;
 const probe=path==='/delivery-bridge-probe';
 const ownerSafe=isOwnerSafeRoute(req);
 const secret=env.RUNNER_SECRET;
 if(typeof secret!=='string'||secret.length<32)return deny(503,'SETUP_REQUIRED');
 // Only exact method/path pairs escape the "generation enabled" gate.
 // Even authenticated callers cannot start or resume with Free-plan OFF.
 if(probe){
  if(env.BRIDGE_PROBE_ENABLED!=='true')return deny(503,'SETUP_REQUIRED');
 }else if(!ownerSafe&&(env.RUNNER_ENABLED!=='true'||env.FREE_PLAN_CONFIRMED!=='true')){
  return deny(503,'SETUP_REQUIRED');
 }
 const supplied=createHash('sha256').update(req.headers.get('Authorization')||'').digest();
 const expected=createHash('sha256').update('Bearer '+secret).digest();
 if(!timingSafeEqual(supplied,expected))return deny(401,'UNAUTHORIZED');
 return null;
}

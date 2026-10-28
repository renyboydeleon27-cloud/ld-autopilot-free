import { DurableObject } from 'cloudflare:workers';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Checkpoints, SCENES } from './checkpoints.mjs';
import { generateImage } from '../../lib/ldb/cloudflare-image.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env) {
  if(env.RUNNER_ENABLED!=='true' || env.FREE_PLAN_CONFIRMED!=='true' || !env.RUNNER_SECRET || env.RUNNER_SECRET.length<32)return json({status:'SETUP_REQUIRED'},503);
  const provided=request.headers.get('Authorization')||'';
  const a=createHash('sha256').update(provided).digest(),b=createHash('sha256').update(`Bearer ${env.RUNNER_SECRET}`).digest();
  if(!timingSafeEqual(a,b))return json({status:'UNAUTHORIZED'},401);
  return env.LDB_COORDINATOR.getByName('single-owner-v1').fetch(request);
 }
};
export class LdbCoordinator extends DurableObject {
 constructor(ctx,env) {super(ctx,env);this.core=new Checkpoints(ctx.storage,{render:prompt=>generateImage({prompt,env,freePlanConfirmed:env.FREE_PLAN_CONFIRMED==='true'})});}
 async alarm() {if(this.env.RUNNER_ENABLED==='true' && this.env.FREE_PLAN_CONFIRMED==='true')await this.core.tick();}
 async fetch(req) {
  const path=new URL(req.url).pathname;
  try {
   if(req.method==='GET' && path==='/status') {
    const j=await this.core.status();return json({job:j?{id:j.id,status:j.status,completedScenes:j.index,totalScenes:17,outputs:j.outputs,error:j.error}:null,autoProductionReady:false,deliveryConnected:false});
   }
   if(req.method==='POST' && path==='/stop'){await this.core.stop();return json({ok:true});}
   if(req.method==='POST' && path==='/resume'){await this.core.resume();return json({ok:true});}
   if(req.method==='POST' && path==='/jobs') {
    // Enforce streaming size limit even if Content-Length is absent or forged.
    const reader=req.body?.getReader();if(!reader)return json({status:'INVALID_BUNDLE'},400);
    let size=0;const chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();return json({status:'BUNDLE_TOO_LARGE'},413);}chunks.push(Buffer.from(value));}
    const bundle=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(bundle.schema!=='ldb-approved-bundle-v1' || typeof bundle.storyboard_utf8!=='string')throw Error('INVALID_BUNDLE');
    const id=createHash('sha256').update(bundle.storyboard_utf8).digest('hex');
    if(bundle.approval?.storyboard_id!==id || bundle.approval?.approved_scene_count!==17)throw Error('INVALID_APPROVAL');
    const story=JSON.parse(bundle.storyboard_utf8);
    const scenes=Array.isArray(story.scenes)?story.scenes:SCENES.map(id=>({id,...story.scenes?.[id]}));
    const job=await this.core.submit(id,scenes);return json({id:job.id,status:job.status},202);
   }
   return json({status:'NOT_FOUND'},404);
  }catch {return json({status:'REQUEST_REJECTED'},409);}
 }
}

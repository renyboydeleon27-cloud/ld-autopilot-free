import { Buffer } from 'node:buffer';
import { DurableObject } from 'cloudflare:workers';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Checkpoints, SCENES } from './checkpoints.mjs';
import { validateRenderJob } from '../../lib/ldb/approved-render-job.mjs';
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
 constructor(ctx,env) {super(ctx,env);this.core=new Checkpoints(ctx.storage,{maxScenes:env.HOOK_ONLY_TEST==='true'?1:17,initialDelay:env.HOOK_ONLY_TEST==='true'?30000:1000,render:prompt=>generateImage({prompt,env,freePlanConfirmed:env.FREE_PLAN_CONFIRMED==='true'})});}
 async alarm() {if(this.env.RUNNER_ENABLED==='true' && this.env.FREE_PLAN_CONFIRMED==='true')await this.core.tick();}
 async fetch(req) {
  const path=new URL(req.url).pathname;
  try {
   if(req.method==='GET' && path==='/status') {
    const j=await this.core.status();return json({job:j?{id:j.id,status:j.status,completedScenes:j.index,totalScenes:17,outputs:j.outputs,error:j.error}:null,autoProductionReady:false,deliveryConnected:false});
   }
   if(req.method==='GET' && /^\/images\/(HOOK|P[1-9]|P1[0-4]|ENDING|THUMBNAIL)$/.test(path)) {
    const scene=path.split('/').at(-1),j=await this.core.status();
    const index=SCENES.indexOf(scene),meta=j?.outputs.find(x=>x.scene===scene);
    if(!meta)return json({status:'IMAGE_NOT_READY'},404);
    const chunks=[];for(let n=0;n<meta.chunks;n++) {
     const chunk=await this.ctx.storage.get(`image:${index}:${n}`);
     if(!chunk)throw Error('MISSING_CHUNK');chunks.push(Buffer.from(chunk));
    }
    const bytes=Buffer.concat(chunks);
    if(createHash('sha256').update(bytes).digest('hex')!==meta.sha256)throw Error('CORRUPT_IMAGE');
    return new Response(bytes,{headers:{'Content-Type':meta.mimeType,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-LDB-SHA256':meta.sha256,'X-LDB-Visual-Audit':'PENDING'}});
   }
   if(req.method==='POST' && path==='/stop'){await this.core.stop();return json({ok:true});}
   if(req.method==='POST' && path==='/resume'){await this.core.resume();return json({ok:true});}
   if(req.method==='POST' && path==='/jobs') {
    // Enforce streaming size limit even if Content-Length is absent or forged.
    const reader=req.body?.getReader();if(!reader)return json({status:'INVALID_BUNDLE'},400);
    let size=0;const chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();return json({status:'BUNDLE_TOO_LARGE'},413);}chunks.push(Buffer.from(value));}
    const bundle=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const {id,scenes}=validateRenderJob(bundle);
    const job=await this.core.submit(id,scenes);return json({id:job.id,status:job.status},202);
   }
   return json({status:'NOT_FOUND'},404);
  }catch {return json({status:'REQUEST_REJECTED'},409);}
 }
}

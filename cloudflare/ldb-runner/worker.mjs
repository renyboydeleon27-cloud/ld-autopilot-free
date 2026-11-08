import { Buffer } from 'node:buffer';
import { DurableObject } from 'cloudflare:workers';
import { createHash } from 'node:crypto';
import { ownerAccessGate } from './owner-access.mjs';
import { freeInferenceAllowed, freeInferenceStatus } from '../../lib/ldb/free-inference-gate.mjs';
import { Checkpoints, SCENES } from './checkpoints.mjs';
import { validateRenderJob } from '../../lib/ldb/approved-render-job.mjs';
import { generateImage } from '../../lib/ldb/cloudflare-image.mjs';
import { deliveryReadiness } from '../../lib/ldb/delivery-readiness.mjs';
import { productionProgressSnapshot } from '../../lib/ldb/production-progress.mjs';
import { productionAcceptanceSnapshot, readMilestoneReceipts } from '../../lib/ldb/production-acceptance.mjs';
import { deliveryNextAction } from '../../lib/ldb/delivery-coordinator-gate.mjs';
import { dispatchCoordinatorAlarm } from './delivery-alarm.mjs';
import { createGoogleDeliveryBridge } from './google-delivery-bridge.mjs';
import { resumeDurableApprovedDelivery } from '../../lib/ldb/resume-durable-approved-delivery.mjs';
import { stopProduction, resumeProduction, resumeApprovedDeliveryOnly } from '../../lib/ldb/production-controls.mjs';
import { probeGoogleVaultBinding } from './bridge-probe.mjs';
import { notifyProductionMilestones } from '../../lib/ldb/production-milestones.mjs';
import {isQualityImportPath,qualityImportGate,handleQualityImport} from './quality-import.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env) {
  if(isQualityImportPath(new URL(request.url).pathname)){
   const denied=qualityImportGate(request,env);
   if(denied)return denied;
   return env.LDB_COORDINATOR.getByName('single-owner-v1').fetch(request);
  }
  const probe=new URL(request.url).pathname==='/delivery-bridge-probe';
  // Keep owner safety/read-only routes reachable even when inference or the
  // daily Free-plan confirmation is OFF. All routes still require owner auth.
  const denied=ownerAccessGate(request,env);
  if(denied)return denied;
  if(probe){
   if(request.method!=='GET')return json({status:'METHOD_NOT_ALLOWED'},405);
   try{return json(await probeGoogleVaultBinding(env));}
   catch{return json({status:'BRIDGE_PROBE_UNAVAILABLE',productionReady:false},503);}
  }
  return env.LDB_COORDINATOR.getByName('single-owner-v1').fetch(request);
 }
};
export class LdbCoordinator extends DurableObject {
 constructor(ctx,env) {super(ctx,env);this.core=new Checkpoints(ctx.storage,{maxScenes:env.HOOK_ONLY_TEST==='true'?1:17,initialDelay:env.HOOK_ONLY_TEST==='true'?30000:1000,render:prompt=>generateImage({prompt,env,freePlanConfirmed:freeInferenceAllowed(env)})});}
 async alarm() {
  // Master RUNNER_ENABLED stops all background work. The Free quota flag
  // gates AI generation only, not explicitly reviewed Google delivery.
  if(this.env.RUNNER_ENABLED!=='true')return;
  // Inert by default. Only a fully audited, persisted 69-asset delivery
  // checkpoint can pass dispatchCoordinatorAlarm's trusted readiness gate.
  // Google access and refresh tokens remain inside the separate vault Worker.
  let bridge=null;
  if(this.env.DELIVERY_BRIDGE_ENABLED==='true'){
   try{bridge=createGoogleDeliveryBridge(this.env);}catch{/* Stay disabled if configuration is missing. */}
  }
  await dispatchCoordinatorAlarm({storage:this.ctx.storage,imageCore:this.core,
   imageEnabled:freeInferenceAllowed(this.env),
   deliveryEnabled:bridge!==null,
   ...(bridge?{createDelivery:({jobId})=>resumeDurableApprovedDelivery({
     deliveryStorage:this.ctx.storage,imageStorage:this.ctx.storage,textStorage:this.ctx.storage,
     drive:bridge.drive,capacity:bridge.capacity,jobId
   })}:{})
  });
  if(bridge&&this.env.GMAIL_MILESTONES_ENABLED==='true')await notifyProductionMilestones({storage:this.ctx.storage,notify:bridge.notifyMilestone});
 }
 async fetch(req) {
  const path=new URL(req.url).pathname;
  if(isQualityImportPath(path))return handleQualityImport(req,{storage:this.ctx.storage,
   env:this.env,createBackend:()=>createGoogleDeliveryBridge(this.env)});
  try {
   if(req.method==='GET' && path==='/delivery-next-action') {
    // Trusted server-side records only. Never accept a browser-supplied delivery plan.
    // Read the actual ProductionDelivery durable checkpoint. There is no
    // separate browser-writable approval record and this endpoint never uploads.
    const snapshot=await this.ctx.storage.get('delivery');
    const plan=snapshot?.plan;
    if(!plan || !snapshot)return json({status:'DELIVERY_NOT_CONFIGURED'},503);
    try {return json(deliveryNextAction(plan,snapshot));}
    catch {return json({status:'DELIVERY_BLOCKED'},409);}
   }
   if(req.method==='GET' && path==='/delivery-readiness') {
    // Observe the trusted durable checkpoint only; never accept browser state.
    // This reports readiness but cannot start or resume Google delivery.
    const [job,delivery]=await Promise.all([this.core.status(),this.ctx.storage.get('delivery')]);
    return json(deliveryReadiness({job,delivery}));
   }
   if(req.method==='GET' && path==='/status') {
    // Read-only and owner-authenticated at the edge. Never claim 100% from
    // just image generation or from untrusted Drive/visual-review metadata.
    const [job,delivery]=await Promise.all([this.core.status(),this.ctx.storage.get('delivery')]);
    const receipts=await readMilestoneReceipts(this.ctx.storage,job?.id);
    return json({...productionProgressSnapshot({job,delivery}),
     inferenceGate:freeInferenceStatus(this.env),
     acceptance:productionAcceptanceSnapshot({job,delivery,receipts})});
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
   if(req.method==='POST' && path==='/stop'){
    const outcome=await stopProduction({core:this.core,storage:this.ctx.storage});
    return json({ok:true,...outcome});
   }
   if(req.method==='POST' && path==='/resume'){
    if(!freeInferenceAllowed(this.env))return json({status:'FREE_DAILY_VERIFICATION_REQUIRED'},503);
    let connectorReady=false;
    try{createGoogleDeliveryBridge(this.env);connectorReady=true;}catch{/* Fail closed. */}
    const outcome=await resumeProduction({core:this.core,storage:this.ctx.storage,deliveryEnabled:connectorReady});
    return json({ok:true,...outcome});
   }
   if(req.method==='POST' && path==='/resume-delivery'){
    // Dedicated path: the edge requires owner auth + RUNNER_ENABLED + bridge,
    // then this Durable Object checks the immutable reviewed 69-file plan.
    // This can NEVER resume image generation or bypass the Free AI gate.
    try{createGoogleDeliveryBridge(this.env);}
    catch{return json({status:'DELIVERY_CONNECTOR_DISABLED'},503);}
    const outcome=await resumeApprovedDeliveryOnly({
      core:this.core,storage:this.ctx.storage,deliveryEnabled:true
    });
    return json({ok:true,...outcome});
   }
   if(req.method==='POST' && path==='/jobs') {
    if(!freeInferenceAllowed(this.env))return json({status:'FREE_DAILY_VERIFICATION_REQUIRED'},503);
    // Enforce streaming size limit even if Content-Length is absent or forged.
    const reader=req.body?.getReader();if(!reader)return json({status:'INVALID_BUNDLE'},400);
    let size=0;const chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();return json({status:'BUNDLE_TOO_LARGE'},413);}chunks.push(Buffer.from(value));}
    const bundle=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const {id,scenes}=validateRenderJob(bundle);
    const job=await this.core.submit(id,scenes,{approvedBundle:bundle});return json({id:job.id,status:job.status},202);
   }
   return json({status:'NOT_FOUND'},404);
  }catch {return json({status:'REQUEST_REJECTED'},409);}
 }
}

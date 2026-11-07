// Durable state core. The storage interface is Cloudflare Durable Object Storage,
// not a local filesystem. A singleton object bounds account-wide image requests.
import {approvedSourceChunks} from '../../lib/ldb/approved-text-assets.mjs';
export const SCENES = ['HOOK',...Array.from({length:14},(_,i)=>`P${i+1}`),'ENDING','THUMBNAIL'];
const err = code => { throw new Error(code); };
export class Checkpoints {
  constructor(storage, {render, now=Date.now, maxScenes=17, initialDelay=1000, watchdogMs=180000}={}) {
    if(![1,17].includes(maxScenes))err("INVALID_SCENE_LIMIT");
    // Provider request timeout is 90 s. The watchdog is a conservative
    // 180 s by default; never treat an ambiguous request as free to retry.
    if(!Number.isSafeInteger(watchdogMs)||watchdogMs<120000||watchdogMs>900000)err('INVALID_INFERENCE_WATCHDOG');
    this.s=storage; this.render=render; this.now=now; this.maxScenes=maxScenes; this.initialDelay=initialDelay;this.watchdogMs=watchdogMs;
  }
  async submit(id, scenes, {approvedBundle}={}) {
    if(!/^[a-f0-9]{64}$/.test(id) || !Array.isArray(scenes) || scenes.length!==17) err('INVALID_JOB');
    for(let i=0;i<17;i++) if(scenes[i].id!==SCENES[i] || typeof scenes[i].image_prompt!=='string' || !scenes[i].image_prompt.trim() || scenes[i].image_prompt.length>2048 || (i<16 && (typeof scenes[i].flow_prompt!=='string' || !scenes[i].flow_prompt.trim()))) err('INVALID_SCENES');
    const source=approvedBundle===undefined?null:approvedSourceChunks(approvedBundle,{id,scenes});
    return this.s.transaction(async tx=>{
      const old=await tx.get('job');
      if(old){if(old.id!==id)err('EXISTING_JOB_REQUIRES_DELIVERY');
       if(JSON.stringify(old.scenes)!==JSON.stringify(scenes))err('JOB_INPUT_CHANGED');
       if(source&&old.approvedSource?.sha256!==source.meta.sha256)err('JOB_SOURCE_CHANGED');
       return old;}
      const job={id,scenes,index:0,status:'QUEUED',stop:false,outputs:[],createdAt:this.now(),
       ...(source?{approvedSource:source.meta}:{})};
      if(source)for(let i=0;i<source.chunks.length;i++)await tx.put('approved-source:'+i,source.chunks[i]);
      await tx.put('job',job); await tx.setAlarm(this.now()+this.initialDelay);return job;
    });
  }
  async status() { return await this.s.get('job') || null; }
  async stop() {
    return this.s.transaction(async tx=>{
      const j=await tx.get('job');if(!j)err('NO_JOB');j.stop=true;
      if(j.status!=='RENDERING' && !['IMAGES_READY','TEST_PAUSED','NEEDS_REVIEW'].includes(j.status)) j.status='STOPPED';
      await tx.put('job',j);await tx.deleteAlarm();return j;
    });
  }
  async resume() {
    return this.s.transaction(async tx=>{
      const j=await tx.get('job');if(!j)err('NO_JOB');
      if(!['STOPPED','WAITING_QUOTA','QUEUED'].includes(j.status))err('RESUME_NOT_SAFE');
      j.stop=false;j.status='QUEUED';await tx.put('job',j);await tx.setAlarm(this.now()+1000);return j;
    });
  }
  async tick() {
    const claim=await this.s.transaction(async tx=>{
      const j=await tx.get('job');if(!j || ['IMAGES_READY','TEST_PAUSED','NEEDS_REVIEW'].includes(j.status))return null;
      // The persisted watchdog runs even if a Worker process disappears.
      // Never make a second provider request for an unresolved claim.
      if(j.status==='RENDERING') {
        const deadline=j.claim?.watchdogAt;
        if(Number.isSafeInteger(deadline)&&this.now()<deadline){
          await tx.setAlarm(deadline);
          return null; // early/replayed alarm: leave the current claim alone
        }
        j.status='NEEDS_REVIEW';j.error='AMBIGUOUS_INFERENCE';
        await tx.put('job',j);await tx.deleteAlarm();
        return null;
      }
      if(j.stop){j.status='STOPPED';await tx.put('job',j);return null;}
      if(j.index>=17){j.status='IMAGES_READY';await tx.put('job',j);return null;}
      const day=new Date(this.now()).toISOString().slice(0,10);
      let budget=await tx.get('budget');if(budget?.day!==day)budget={day,attempts:0};
      // Conservative 40 requests/day cap; account Free plan remains the final ceiling.
      if(budget.attempts>=40){j.status='WAITING_QUOTA';await tx.put('job',j);await tx.setAlarm(Date.parse(day)+86400000+1000);return null;}
      budget.attempts++;j.status='RENDERING';
      j.claim={index:j.index,day,attempt:budget.attempts,watchdogAt:this.now()+this.watchdogMs};
      // Atomic alarm + claim: a worker crash cannot leave an indefinite
      // RENDERING record without a future recovery opportunity.
      await tx.put('budget',budget);await tx.put('job',j);
      await tx.setAlarm(j.claim.watchdogAt);
      return structuredClone(j);
    });
    if(!claim)return;
    let image;
    try {image=await this.render(claim.scenes[claim.index].image_prompt);}
    catch(e) {
      await this.s.transaction(async tx=>{
        const j=await tx.get('job');
        if(j?.id!==claim.id||j.index!==claim.index||j.status!=='RENDERING')return;
        j.status='NEEDS_REVIEW';
        j.error=e?.code==='QUOTA_OR_RATE_LIMIT'?'PROVIDER_QUOTA_REVIEW':'INFERENCE_FAILED_OR_AMBIGUOUS';
        j.providerCode=['CONFIGURATION_REQUIRED','AUTHORIZATION_FAILED','PROVIDER_FAILED','INVALID_IMAGE_RESPONSE','INVALID_IMAGE','INVALID_PORTRAIT_DIMENSIONS','PROVIDER_UNAVAILABLE_OR_INVALID_RESPONSE','RESPONSE_TOO_LARGE','QUOTA_OR_RATE_LIMIT'].includes(e?.code)?e.code:'UNKNOWN_RENDER_FAILURE';
        await tx.put('job',j);await tx.deleteAlarm();
      });return;
    }
    if(!image?.bytes || image.bytes.length>8000000 || image.width!==576 || image.height!==1024) {
      await this.s.transaction(async tx=>{
        const j=await tx.get('job');
        if(j?.id!==claim.id||j.index!==claim.index||j.status!=='RENDERING')return;
        j.status='NEEDS_REVIEW';j.error='INVALID_RENDER_OUTPUT';
        await tx.put('job',j);await tx.deleteAlarm();
      });return;
    }
    // Atomic chunks + checkpoint. STOP during inference preserves the finished scene.
    await this.s.transaction(async tx=>{
      const j=await tx.get('job');
      if(j.id!==claim.id || j.index!==claim.index || j.status!=='RENDERING')err('CLAIM_CHANGED');
      let chunks=0;
      for(let start=0;start<image.bytes.length;start+=64000)await tx.put(`image:${j.index}:${chunks++}`,image.bytes.slice(start,start+64000));
      j.outputs.push({scene:SCENES[j.index],chunks,bytes:image.bytes.length,sha256:image.sha256,mimeType:image.mimeType,width:576,height:1024,visualAudit:'PENDING'});
      j.index++;j.status=j.index===17?'IMAGES_READY':j.index>=this.maxScenes?'TEST_PAUSED':j.stop?'STOPPED':'QUEUED';delete j.claim;
      await tx.put('job',j);
      if(j.status==='QUEUED')await tx.setAlarm(this.now()+1000);
      else await tx.deleteAlarm(); // finished, one-HOOK pause or STOP
    });
  }
}

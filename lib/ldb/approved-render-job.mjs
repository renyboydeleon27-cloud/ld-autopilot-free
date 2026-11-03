import { createHash } from 'node:crypto';
export const SCENES = ['HOOK', ...Array.from({length:14},(_,i)=>`P${i+1}`), 'ENDING', 'THUMBNAIL'];
const reject = () => { throw Error('INVALID_APPROVED_RENDER_JOB'); };
// Only call behind server-to-server authentication. An approval JSON is not
// proof of identity, and a matching digest alone does not authorize a user.
export function validateRenderJob(bundle) {
 if(bundle?.schema!=='ldb-approved-render-job-v1' || typeof bundle.storyboard_utf8!=='string')reject();
 const id=createHash('sha256').update(bundle.storyboard_utf8).digest('hex');
 const a=bundle.approval;
 if(a?.schema!=='ldb-storyboard-approval-v1' || a.source!=='local-manual-approval' || a.hash_algorithm!=='sha256-utf8-original-json' || a.requires_backend_verification!==true || a.storyboard_id!==id || a.approved_scene_count!==17)reject();
 const story=JSON.parse(bundle.storyboard_utf8);
 if(!story.scenes || Array.isArray(story.scenes) || Object.keys(story.scenes).length!==17 || SCENES.some(k=>!story.scenes[k]))reject();
 const scenes=bundle.render_scenes;
 if(!Array.isArray(scenes)||scenes.length!==17)reject();
 for(let i=0;i<17;i++) {
  const scene=scenes[i],visual=story.scenes[SCENES[i]].visual;
  if(scene?.id!==SCENES[i] || typeof visual!=='string' || !visual.trim() || typeof scene.image_prompt!=='string' || scene.image_prompt.length>2048 || !scene.image_prompt.includes(visual))reject();
  if(i<16 && (typeof scene.narration!=='string' || !scene.narration.trim() || typeof scene.flow_prompt!=='string' || !['0–2s:','2–6s:','6–10s:','EXACTLY 10 SECONDS'].every(x=>scene.flow_prompt.includes(x))))reject();
 }
 return {id,scenes};
}

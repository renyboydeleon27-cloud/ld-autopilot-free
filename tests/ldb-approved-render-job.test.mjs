import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateRenderJob, SCENES} from '../lib/ldb/approved-render-job.mjs';
function fixture(){const raw=JSON.stringify({scenes:Object.fromEntries(SCENES.map(id=>[id,{visual:`Specific approved visual for ${id}`}]))});return {schema:'ldb-approved-render-job-v1',storyboard_utf8:raw,approval:{schema:'ldb-storyboard-approval-v1',source:'local-manual-approval',hash_algorithm:'sha256-utf8-original-json',requires_backend_verification:true,storyboard_id:createHash('sha256').update(raw).digest('hex'),approved_scene_count:17},render_scenes:SCENES.map(id=>({id,image_prompt:`Style. Specific approved visual for ${id}`,narration:'Complete separate narration.',flow_prompt:'EXACTLY 10 SECONDS; 0–2s: Start; 2–6s: Move; 6–10s: Hold'}))};}
test('accepts authorized expansion without altering storyboard hash',()=>assert.equal(validateRenderJob(fixture()).scenes.length,17));
test('rejects changed approval, substituted visual and missing ENDING motion',()=>{for(const mutate of [b=>b.storyboard_utf8+=' ',b=>b.approval.source='auto',b=>b.approval.requires_backend_verification=false,b=>b.render_scenes[3].image_prompt='Unrelated scene',b=>b.render_scenes[15].flow_prompt='',b=>b.render_scenes[5].narration='']){const b=fixture();mutate(b);assert.throws(()=>validateRenderJob(b));}});

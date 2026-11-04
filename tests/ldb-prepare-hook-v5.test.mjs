import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {prepareHookV5,APPROVAL_ID,COMPOSITION_LOCK} from '../scripts/ldb-prepare-hook-v5.mjs';
import {validateRenderJob,SCENES} from '../lib/ldb/approved-render-job.mjs';
async function fixture(){
 const raw=JSON.parse(await readFile(new URL('../ldb-submissions/lake-nyos-1986-test/approved_bundle.json',import.meta.url),'utf8'));
 const storyboard=JSON.parse(raw.storyboard_utf8);
 assert.equal(createHash('sha256').update(raw.storyboard_utf8).digest('hex'),APPROVAL_ID);
 raw.schema='ldb-approved-render-job-v1';
 raw.render_scenes=SCENES.map(id=>({
  id,
  image_prompt:'Historical 2D anime '+storyboard.scenes[id].visual,
  narration:'Historical narration for '+id,
  flow_prompt:'EXACTLY 10 SECONDS; 0–2s: Start; 2–6s: Move; 6–10s: Hold'
 }));
 validateRenderJob(raw);
 return raw;
}
test('HOOK V5 preserves original approval and changes only one image prompt',async()=>{
 const raw=await fixture(),prepared=prepareHookV5(raw);
 assert.equal(prepared.storyboard_utf8,raw.storyboard_utf8);
 assert.equal(validateRenderJob(prepared).id,APPROVAL_ID);
 assert.equal(prepared.render_scenes.length,17);
 assert.ok(prepared.render_scenes[0].image_prompt.includes(COMPOSITION_LOCK));
 assert.ok(prepared.render_scenes[0].image_prompt.includes('Moon and sun must remain entirely OUTSIDE'));
 assert.ok(prepared.render_scenes[0].image_prompt.includes('R=G=B'));
 assert.notEqual(prepared.render_scenes[0].image_prompt,raw.render_scenes[0].image_prompt);
 assert.deepEqual(prepared.render_scenes.slice(1),raw.render_scenes.slice(1));
 assert.deepEqual(prepared.render_scenes[0].flow_prompt,raw.render_scenes[0].flow_prompt);
 assert.deepEqual(prepared.render_scenes[0].narration,raw.render_scenes[0].narration);
 assert.ok(prepared.render_scenes[0].image_prompt.length<=2048);
});
test('HOOK V5 rejects nonapproved storyboard and duplicate preparation',async()=>{
 const raw=await fixture(),prepared=prepareHookV5(raw);
 assert.throws(()=>prepareHookV5(prepared),/DIAGNOSTIC_ALREADY_PREPARED/);
 raw.storyboard_utf8+=' ';
 assert.throws(()=>prepareHookV5(raw),/WRONG_TEST_APPROVAL|INVALID_APPROVED_RENDER_JOB/);
});

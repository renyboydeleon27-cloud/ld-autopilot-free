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
 assert.ok(prepared.render_scenes[0].image_prompt.includes('Moon OUTSIDE frame'));
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

test('real Lake Nyos free-packager HOOK V5 remains inside Cloudflare 2048-char limit',async()=>{
 const {spawnSync}=await import('node:child_process');
 const {mkdtemp,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {fileURLToPath}=await import('node:url');
 const root=fileURLToPath(new URL('../',import.meta.url));
 const original=fileURLToPath(new URL('../ldb-submissions/lake-nyos-1986-test/approved_bundle.json',import.meta.url));
 const temp=await mkdtemp(join(tmpdir(),'ldb-hook-v5-regression-'));
 try{
  const output=join(temp,'package');
  const run=spawnSync('python3',['-m','scripts.ldb_free_packager','--bundle',original,output],
   {cwd:root,encoding:'utf8',timeout:30000});
  assert.equal(run.status,0,run.stderr?.slice(0,1200));
  const raw=JSON.parse(await readFile(join(output,'render_job.json'),'utf8'));
  assert.equal(validateRenderJob(raw).id,APPROVAL_ID);
  const originalPrompt=raw.render_scenes[0].image_prompt;
  assert.ok(originalPrompt.length<2048,'packaged HOOK already exceeds provider bound');
  const prepared=prepareHookV5(raw);
  const hookPrompt=prepared.render_scenes[0].image_prompt;
  assert.ok(hookPrompt.length<=2048,'REAL approved HOOK V5 exceeds 2048-character provider limit: '+hookPrompt.length);
  assert.ok(hookPrompt.includes(JSON.parse(raw.storyboard_utf8).scenes.HOOK.visual));
  assert.ok(hookPrompt.includes('Moon OUTSIDE frame; NO visible moon disk.'));
  assert.ok(hookPrompt.includes('R=G=B'));
  assert.equal(validateRenderJob(prepared).id,APPROVAL_ID);
  assert.deepEqual(prepared.render_scenes.slice(1),raw.render_scenes.slice(1));
 }finally{await rm(temp,{recursive:true,force:true});}
});

test('V5 wrapper preflights grayscale decoder before cloud call and publishes review after rendering',async()=>{
 const {readFile}=await import('node:fs/promises');
 const s=await readFile(new URL('../scripts/ldb-run-hook-v5.mjs',import.meta.url),'utf8');
 const decoder=s.indexOf('from PIL import Image, ImageOps');
 const packager=s.indexOf('scripts.ldb_free_packager');
 const cloud=s.indexOf('scripts/ldb-hook-cloud-test.mjs');
 const grayscale=s.indexOf('scripts.ldb_hook_bw_audit');
 assert.ok(decoder>0&&packager>decoder&&cloud>packager&&grayscale>cloud);
 assert.ok(s.includes('--preview-compare'));
 assert.ok(s.includes('--hook-v5'));
});

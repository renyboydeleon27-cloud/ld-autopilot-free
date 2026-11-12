// Offline-only rehearsal of the exact approved Lake Nyos HOOK V5 package.
// NO provider, no Cloudflare, no Gmail, no Google Drive, no image rendering.
// Keep the real storyboard approval and all non-HOOK scenes byte-identical.
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareHookV5,APPROVAL_ID,COMPOSITION_LOCK} from './ldb-prepare-hook-v5.mjs';
import {validateRenderJob,SCENES} from '../lib/ldb/approved-render-job.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const bundle=fileURLToPath(new URL('../ldb-submissions/lake-nyos-1986-test/approved_bundle.json',import.meta.url));
const sha256=s=>createHash('sha256').update(s).digest('hex');

export async function verifyOfflineHookV5({runner=spawnSync}={}){
 const dir=await mkdtemp(join(tmpdir(),'ldb-v5-offline-ready-'));
 try{
  const out=join(dir,'packaged');
  // Run the SAME original free packager as the actual V5 image pipeline.
  const run=runner('python3',['-m','scripts.ldb_free_packager','--bundle',bundle,out],
    {cwd:root,encoding:'utf8',timeout:60000});
  assert.equal(run?.status,0,'OFFLINE_PACKAGER_FAILED');
  const original=JSON.parse(await readFile(join(out,'render_job.json'),'utf8'));
  const approved=validateRenderJob(original);
  assert.equal(approved.id,APPROVAL_ID,'APPROVAL_HASH_MISMATCH');
  assert.equal(sha256(original.storyboard_utf8),APPROVAL_ID,'ORIGINAL_STORYBOARD_CHANGED');
  assert.equal(original.render_scenes.length,17,'WRONG_SCENE_COUNT');
  assert.deepEqual(original.render_scenes.map(s=>s.id),SCENES,'WRONG_SCENE_ORDER');
  const prepared=prepareHookV5(original);
  assert.equal(validateRenderJob(prepared).id,APPROVAL_ID,'APPROVAL_ID_CHANGED');
  assert.equal(prepared.storyboard_utf8,original.storyboard_utf8,'STORYBOARD_BYTES_CHANGED');
  assert.deepEqual(prepared.render_scenes.slice(1),original.render_scenes.slice(1),
    'NON_HOOK_SCENES_CHANGED');
  assert.deepEqual({...prepared.render_scenes[0],image_prompt:original.render_scenes[0].image_prompt},
    original.render_scenes[0],'HOOK_NON_IMAGE_FIELDS_CHANGED');
  const prompt=prepared.render_scenes[0].image_prompt;
  assert.ok(prompt.includes(COMPOSITION_LOCK),'COMPOSITION_LOCK_MISSING');
  assert.ok(prompt.includes('Moon OUTSIDE frame; NO visible moon disk.'),'MOON_LOCK_MISSING');
  assert.ok(prompt.includes('R=G=B'),'GRAYSCALE_LOCK_MISSING');
  assert.ok(prompt.length>0&&prompt.length<=2048,'IMAGE_MODEL_PROMPT_LIMIT');
  return Object.freeze({
    status:'HOOK_V5_OFFLINE_PACKAGE_READY',
    approvedStoryboard:APPROVAL_ID,
    scenesChecked:17,onlyHookImageChanged:true,promptLength:prompt.length,
    inferenceCalled:false,cloudflareCalled:false,googleDriveCalled:false,
    gmailCalled:false,visualApproved:false,productionAccepted:false
  });
 }finally{await rm(dir,{recursive:true,force:true});}
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const result=await verifyOfflineHookV5();
  console.log('HOOK_V5_OFFLINE_PACKAGE_READY: '+result.scenesChecked+
    ' scenes verified, only HOOK image prompt changed, length '+result.promptLength+
    '/2048. NO inference, uploads or visual approval.');
 }catch(e){
  // Do not expose unexpected Python output, prompts or environment values.
  const code=typeof e?.message==='string'&&/^[A-Z_]+$/.test(e.message)?
    e.message:'OFFLINE_READINESS_UNAVAILABLE';
  console.error('HOOK_V5_'+code);
  process.exitCode=1;
 }
}

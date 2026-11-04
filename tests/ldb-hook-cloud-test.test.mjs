import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {hookCloudTest,assertV5PreviewScope} from '../scripts/ldb-hook-cloud-test.mjs';
const env={CLOUDFLARE_ACCOUNT_ID:'a437dda5f38ba6b10991684b8388760b',CLOUDFLARE_API_TOKEN:'private-test-token'};
async function harness(failRender=false){
 const bundle=JSON.parse(await readFile(new URL('../ldb-submissions/lake-nyos-1986-test/approved_bundle.json',import.meta.url),'utf8'));
 bundle.schema='ldb-approved-render-job-v1';bundle.render_scenes=Object.entries(JSON.parse(bundle.storyboard_utf8).scenes).map(([id,s])=>({id,image_prompt:s.visual,narration:'Separate narration.',flow_prompt:'EXACTLY 10 SECONDS 0–2s: Start; 2–6s: move; 6–10s: stop'}));
 let stage='EMPTY',submits=0;const removed=[];const bytes=Buffer.from('image-test-data'),sha=createHash('sha256').update(bytes).digest('hex');
 const fetcher=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(url.startsWith('https://api.cloudflare.com')){
   let result={};if(path.endsWith('/scripts')&&!opts.method)result=[];
   if(path.endsWith('/subdomain')&&!opts.method)result={subdomain:'test'};
   if(opts.method==='DELETE')removed.push(path.split('/').at(-1));
   if(opts.method==='PUT'){const meta=JSON.parse(await opts.body.get('metadata').text());assert.equal(meta.bindings.find(x=>x.name==='HOOK_ONLY_TEST').text,'true');}
   return Response.json({success:true,result});
  }
  if(!opts.headers?.Authorization)return new Response('',{status:401});
  if(path==='/jobs'){submits++;stage='QUEUED';return Response.json({});}
  if(path==='/stop'){stage='STOPPED';return Response.json({});}
  if(path==='/resume'){stage=failRender?'NEEDS_REVIEW':'TEST_PAUSED';return Response.json({});}
  if(path==='/images/HOOK')return new Response(bytes,{headers:{'X-LDB-SHA256':sha}});
  return Response.json({job:{id:bundle.approval.storyboard_id,status:stage,completedScenes:stage==='TEST_PAUSED'?1:0,outputs:[{scene:'HOOK',sha256:sha}]}});
 };
 return {options:{env,freePlanConfirmed:true,fetcher,sleep:async()=>{},read:async p=>p.endsWith('render_job.json')?JSON.stringify(bundle):'module'},removed,getSubmits:()=>submits};
}
test('one job only, authenticated STOP/resume, checksum and credential cleanup',async()=>{const h=await harness();const r=await hookCloudTest(h.options);assert.equal(r.report.completedScenes,1);assert.equal(h.getSubmits(),1);assert.deepEqual(h.removed,['RUNNER_SECRET']);assert.ok(!JSON.stringify(r.report).includes(env.CLOUDFLARE_API_TOKEN));});
test('render failure still removes credentials without resubmission',async()=>{const h=await harness(true);await assert.rejects(hookCloudTest(h.options),/RENDER_NEEDS_REVIEW/);assert.equal(h.getSubmits(),1);assert.equal(h.removed.length,1);});
test('missing configuration never calls provider',async()=>{await assert.rejects(hookCloudTest({env:{},fetcher:()=>assert.fail('network')}),/CONFIGURATION_REQUIRED/);});


test("unknown or paid plan never calls provider",async()=>{await assert.rejects(hookCloudTest({env,fetcher:()=>assert.fail("network")}),/FREE_PLAN_CONFIRMATION_REQUIRED/);});

test('V5 refuses unprepared bundle before any Cloudflare API call',async()=>{
 const h=await harness();
 await assert.rejects(hookCloudTest({...h.options,workerName:'ner-ldb-runner-quality-v5',fetcher:()=>assert.fail('unexpected network')}),/HOOK_V5_PROMPT_REQUIRED/);
 assert.equal(h.getSubmits(),0);
});
test('V5 uses a new isolated Worker and preserves original V4 evidence',async()=>{
 const h=await harness();
 const originalRead=h.options.read,originalFetch=h.options.fetcher;
 let puts=0;
 const read=async path=>{
  const data=await originalRead(path);
  if(path.endsWith('render_job.json')){
   const {prepareHookV5}=await import('../scripts/ldb-prepare-hook-v5.mjs');
   return JSON.stringify(prepareHookV5(JSON.parse(data)));
  }
  return data;
 };
 const fetcher=async(url,opts)=>{
  if(opts?.method==='PUT'){
   puts++;
   assert.ok(url.endsWith('/scripts/ner-ldb-runner-quality-v5'));
  }
  return originalFetch(url,opts);
 };
 const result=await hookCloudTest({...h.options,read,fetcher,workerName:'ner-ldb-runner-quality-v5'});
 assert.equal(puts,1);
 assert.equal(result.report.worker,'ner-ldb-runner-quality-v5');
 assert.equal(result.report.completedScenes,1);
 assert.deepEqual(h.removed,['RUNNER_SECRET']);
 assert.equal(h.getSubmits(),1);
});
test('worker names outside explicit V4/V5 allowlist never reach Cloudflare',async()=>{
 const h=await harness();
 for(const workerName of ['ner-ldb-runner-quality','ner-ldb-runner-quality-v6','../../quality',''])
  await assert.rejects(hookCloudTest({...h.options,workerName,fetcher:()=>assert.fail('unexpected network')}),/UNAPPROVED_TEST_WORKER/);
});

test('V5 CLI refuses local or Production execution before any Cloudflare call',()=>{
 const args=['node','scripts/ldb-hook-cloud-test.mjs','--one-approved-hook-free-only','--hook-v5'];
 for(const env of [
  {},{VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance'},
  {VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'main'},
  {VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/other-branch'}
 ])assert.throws(()=>assertV5PreviewScope({args,env}),/V5_PREVIEW_ONLY|V5_APPROVED_BRANCH_REQUIRED/);
 assert.equal(assertV5PreviewScope({args,env:{VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/ldb-image-acceptance'}}),true);
 assert.equal(assertV5PreviewScope({args:args.filter(a=>a!=='--hook-v5'),env:{VERCEL_ENV:'production'}}),true);
});

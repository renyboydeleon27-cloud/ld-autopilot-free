import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {hookCloudTest} from '../scripts/ldb-hook-cloud-test.mjs';
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
 return {options:{env,fetcher,sleep:async()=>{},read:async p=>p.endsWith('render_job.json')?JSON.stringify(bundle):'module'},removed,getSubmits:()=>submits};
}
test('one job only, authenticated STOP/resume, checksum and credential cleanup',async()=>{const h=await harness();const r=await hookCloudTest(h.options);assert.equal(r.report.completedScenes,1);assert.equal(h.getSubmits(),1);assert.deepEqual(h.removed,['RUNNER_SECRET']);assert.ok(!JSON.stringify(r.report).includes(env.CLOUDFLARE_API_TOKEN));});
test('render failure still removes credentials without resubmission',async()=>{const h=await harness(true);await assert.rejects(hookCloudTest(h.options),/RENDER_NEEDS_REVIEW/);assert.equal(h.getSubmits(),1);assert.equal(h.removed.length,1);});
test('missing configuration never calls provider',async()=>{await assert.rejects(hookCloudTest({env:{},fetcher:()=>assert.fail('network')}),/CONFIGURATION_REQUIRED/);});

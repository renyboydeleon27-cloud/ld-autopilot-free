import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {buildReadOnlyReviewPackage,validateReviewEndpoint} from '../lib/ldb/read-only-review-package.mjs';
import {makeTestPng} from './helpers/make-test-png.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const endpoint='https://ner-ldb-runner-quality.owner.workers.dev';
const secret='review-secret-kept-out-of-exported-files-1234';
const jobId='a'.repeat(64);
const scenes=ALL_SCENES.map(scene=>{
 const bytes=makeTestPng(scene==='THUMBNAIL'?'color':'gray');
 return {scene,bytes,sha256:sha(bytes),status:'STAGED'};
});
const status=()=>({status:'REVIEW_CANDIDATES_READY',reviewReady:true,visualAudit:'PENDING',
 deliveryReady:false,googleUploadsStarted:false,stagedVerified:17,expectedScenes:17,jobId,
 scenes:scenes.map(s=>({scene:s.scene,bytes:s.bytes.length,sha256:s.sha256,status:s.status}))});
function mock({tamper=false,partial=false}={}){
 const calls=[];
 const fetcher=async(url,options)=>{
  calls.push({url,options});
  assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  assert.equal(options.headers.Authorization,'Bearer '+secret);
  if(url===endpoint+'/internal/quality/status')
   return Response.json({...status(),...(partial?{stagedVerified:16}: {})});
  const scene=url.split('/').at(-1),entry=scenes.find(s=>s.scene===scene);
  assert.ok(entry,'unknown scene '+scene);
  return new Response(tamper&&scene==='P1'?Buffer.from('bad'):entry.bytes,{headers:{
   'content-type':'image/png','x-ldb-scene':scene,'x-ldb-sha256':entry.sha256,'x-ldb-visual-audit':'PENDING'
  }});
 };
 return {calls,fetcher};
}
test('creates exactly 17 checked images with inert draft and no POST',async()=>{
 const root=await mkdtemp(join(tmpdir(),'ldb-reviewed-test-'));
 try{
  const m=mock();
  const r=await buildReadOnlyReviewPackage({baseUrl:endpoint,secret,outputRoot:root,fetcher:m.fetcher});
  assert.equal(r.status,'REVIEW_PACKAGE_READY');
  assert.equal(r.imageCount,17);assert.equal(r.approvalGranted,false);
  assert.equal(m.calls.length,18);
  const names=await readdir(r.path);
  assert.equal(names.length,20); // 17 images, manifest, draft and local gallery.
  const manifest=JSON.parse(await readFile(join(r.path,'manifest.json'),'utf8'));
  const audit=JSON.parse(await readFile(join(r.path,'review-audit-draft.json'),'utf8'));
  const html=await readFile(join(r.path,'index.html'),'utf8');
  assert.equal(manifest.assets.length,17);
  assert.equal(manifest.visualAudit,'PENDING');
  assert.equal(audit.status,'PENDING');
  assert.equal(audit.reviewerVerified,false);
  assert.ok(audit.scenes.every(s=>s.result==='PENDING'));
  assert.match(html,/HOOK/);assert.match(html,/THUMBNAIL/);
  assert.ok(!html.includes(secret)&&!JSON.stringify(manifest).includes(secret));
  for(const s of scenes)assert.deepEqual(await readFile(join(r.path,s.scene+'.png')),s.bytes);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('partial job and altered PNG cause no complete review package',async()=>{
 const root=await mkdtemp(join(tmpdir(),'ldb-review-reject-'));
 try{
  const partial=mock({partial:true});
  await assert.rejects(buildReadOnlyReviewPackage({baseUrl:endpoint,secret,outputRoot:root,fetcher:partial.fetcher}),/REVIEW_CANDIDATES_NOT_READY/);
  assert.equal(partial.calls.length,1);
  const bad=mock({tamper:true});
  await assert.rejects(buildReadOnlyReviewPackage({baseUrl:endpoint,secret,outputRoot:root,fetcher:bad.fetcher}),/REVIEW_IMAGE_INTEGRITY_FAILED/);
  const dirs=await readdir(root);
  assert.equal(dirs.length,1);
  assert.ok(!(await readdir(join(root,dirs[0]))).includes('index.html'));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('credentials and endpoint are fail-closed before any request',async()=>{
 const root=await mkdtemp(join(tmpdir(),'ldb-review-safety-'));
 try{
  const forbidden=['http://ner-ldb-runner-quality.owner.workers.dev',
   'https://example.com','https://ner-ldb-runner-quality.owner.workers.dev.evil.com',
   endpoint+'/jobs','https://attacker@ner-ldb-runner-quality.owner.workers.dev',endpoint+'?token=x'];
  for(const value of forbidden)assert.throws(()=>validateReviewEndpoint(value),/INVALID_REVIEW_ENDPOINT/);
  await assert.rejects(buildReadOnlyReviewPackage({baseUrl:endpoint,secret:'short',
   outputRoot:root,fetcher:()=>assert.fail('must never send')}),/REVIEW_SECRET_REQUIRED/);
  assert.equal((await readdir(root)).length,0);
 }finally{await rm(root,{recursive:true,force:true});}
});

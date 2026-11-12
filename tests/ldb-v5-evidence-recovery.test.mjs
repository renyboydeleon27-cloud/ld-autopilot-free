import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {recoverV5AuditEvidence,resolveV5SourceFile} from '../scripts/ldb-v5-evidence-recovery.mjs';
import {makeTestPng} from './helpers/make-test-png.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const id='75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05';
// A metadata fixture, not a claim of fully decoded pixels.
function image(){
 const b=Buffer.alloc(120,0);
 b.set([0xff,0xd8,0xff,0xc0,0,17,8,0x04,0,0x02,0x40],0);
 b[118]=0xff;b[119]=0xd9;return b;
}
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'ldb-v5-recovery-')),bytes=image();
 const report={status:'HOOK_CLOUD_TEST_PASSED',worker:'ner-ldb-runner-quality-v5',
  storyboard_sha256:id,completedScenes:1,totalScenes:17,
  checkpointStatus:'TEST_PAUSED',runtimeCredentialsRemoved:true,isolatedWorkerRemoved:true,
  fullAutoProduction:false,googleConnected:false,
  output:{scene:'HOOK',sha256:hash(bytes),bytes:bytes.length,mimeType:'image/jpeg',visualAudit:'PENDING'}};
 await writeFile(join(root,'HOOK.jpg'),bytes);
 await writeFile(join(root,'report.json'),JSON.stringify(report));
 await writeFile(join(root,'index.html'),'<h1>Original cloud record</h1>');
 return {root,bytes,report,cleanup:()=>rm(root,{recursive:true,force:true})};
}
test('failed offline QA preserves a checksum verified original, clearly NOT APPROVED',async()=>{
 const f=await fixture();try{
  const result=await recoverV5AuditEvidence({root:f.root});
  assert.equal(result.status,'V5_AUDIT_FAILED_REVIEW_ONLY');
  assert.equal(result.sha256,hash(f.bytes));
  assert.equal(result.productionDeliveryAllowed,false);
  assert.equal(result.humanVisualAudit,'PENDING');
  assert.deepEqual(await readFile(join(f.root,'HOOK.jpg')),f.bytes);
  const page=await readFile(join(f.root,'index.html'),'utf8');
  assert.match(page,/AUDIT FAILED/);assert.match(page,/NOT APPROVED/);
  const data=JSON.parse(await readFile(join(f.root,'review-only/audit-failure.json'),'utf8'));
  assert.equal(data.productionDeliveryAllowed,false);
 }finally{await f.cleanup();}
});
test('altered bytes, unclean Worker, forged PASS or wrong dimensions cannot publish',async()=>{
 for(const change of [
  async f=>writeFile(join(f.root,'HOOK.jpg'),Buffer.concat([f.bytes,Buffer.from('extra')])),
  async f=>writeFile(join(f.root,'report.json'),JSON.stringify({...f.report,output:{...f.report.output,sha256:'f'.repeat(64)}})),
  async f=>writeFile(join(f.root,'report.json'),JSON.stringify({...f.report,isolatedWorkerRemoved:false})),
  async f=>writeFile(join(f.root,'report.json'),JSON.stringify({...f.report,output:{...f.report.output,visualAudit:'PASS'}})),
  async f=>writeFile(join(f.root,'report.json'),JSON.stringify({...f.report,output:{...f.report.output,width:1024,height:576}})),
  async f=>writeFile(join(f.root,'report.json'),JSON.stringify({...f.report,storyboard_sha256:'0'.repeat(64)}))
 ]){
  const f=await fixture();try{
   await change(f);
   await assert.rejects(recoverV5AuditEvidence({root:f.root}),/V5_RECOVERY_EVIDENCE_INVALID/);
   await assert.rejects(readFile(join(f.root,'review-only/audit-failure.json')));
   assert.equal(await readFile(join(f.root,'index.html'),'utf8'),'<h1>Original cloud record</h1>');
  }finally{await f.cleanup();}
 }
});
test('review-only recovery can be repeated without changing original evidence',async()=>{
 const f=await fixture();try{
  const rawReport=await readFile(join(f.root,'report.json'));
  const first=await recoverV5AuditEvidence({root:f.root});
  const second=await recoverV5AuditEvidence({root:f.root});
  assert.deepEqual(first,second);
  assert.deepEqual(await readFile(join(f.root,'report.json')),rawReport);
 }finally{await f.cleanup();}
});

test('PNG recovery preserves source bytes, and report remains NOT APPROVED',async()=>{
 const root=await mkdtemp(join(tmpdir(),'ldb-v5-png-'));
 try{
  const bytes=makeTestPng();
  const report={status:'HOOK_CLOUD_TEST_PASSED',
   worker:'ner-ldb-runner-quality-v5',storyboard_sha256:id,
   completedScenes:1,totalScenes:17,checkpointStatus:'TEST_PAUSED',
   runtimeCredentialsRemoved:true,isolatedWorkerRemoved:true,
   fullAutoProduction:false,googleConnected:false,sourceFile:'HOOK.png',
   output:{scene:'HOOK',sha256:hash(bytes),bytes:bytes.length,
    mimeType:'image/png',visualAudit:'PENDING'}
  };
  await writeFile(join(root,'HOOK.png'),bytes);
  await writeFile(join(root,'report.json'),JSON.stringify(report));
  await writeFile(join(root,'index.html'),'<h1>Original PNG preview</h1>');
  const result=await recoverV5AuditEvidence({root});
  assert.equal(result.image,'HOOK.png');
  assert.equal(result.productionDeliveryAllowed,false);
  assert.deepEqual(await readFile(join(root,'HOOK.png')),bytes);
  const html=await readFile(join(root,'index.html'),'utf8');
  assert.match(html,/src="HOOK.png"/);assert.match(html,/NOT APPROVED/);
 }finally{await rm(root,{recursive:true,force:true})}
});
test('recovery rejects mismatched or unsafe filenames instead of guessing PNG',()=>{
 for(const sourceFile of ['HOOK.jpg','../HOOK.png','HOOK.jpeg','HOOK.png?x=1',undefined])
  assert.throws(()=>resolveV5SourceFile({sourceFile,output:{mimeType:'image/png'}}),/V5_RECOVERY_EVIDENCE_INVALID/);
 assert.equal(resolveV5SourceFile({output:{mimeType:'image/jpeg'}}),'HOOK.jpg');
});

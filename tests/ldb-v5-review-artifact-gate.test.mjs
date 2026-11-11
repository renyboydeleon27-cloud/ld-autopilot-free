import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {makeTestPng} from './helpers/make-test-png.mjs';
import {verifyV5ReviewArtifact} from '../scripts/ldb-v5-review-artifact-gate.mjs';

const ROOT='cloudflare/ldb-runner/public';
const hash=b=>createHash('sha256').update(b).digest('hex');
const APPROVAL='75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05';
function fixture(failed=false){
 const b=makeTestPng(),digest=hash(b),prefix='HOOK.'+digest.slice(0,12);
 const report={
  status:'HOOK_CLOUD_TEST_PASSED',worker:'ner-ldb-runner-quality-v5',
  storyboard_sha256:APPROVAL,completedScenes:1,totalScenes:17,
  checkpointStatus:'TEST_PAUSED',runtimeCredentialsRemoved:true,
  isolatedWorkerRemoved:true,fullAutoProduction:false,
  googleConnected:false,sourceFile:'HOOK.png',
  output:{scene:'HOOK',sha256:digest,mimeType:'image/png',bytes:b.length,visualAudit:'PENDING'}
 };
 const files=new Map();
 files.set(ROOT+'/HOOK.png',b);
 files.set(ROOT+'/report.json',JSON.stringify(report));
 if(failed){
  files.set(ROOT+'/review-only/audit-failure.json',JSON.stringify({
   status:'V5_AUDIT_FAILED_REVIEW_ONLY',image:'HOOK.png',
   sha256:digest,bytes:b.length,humanVisualAudit:'PENDING',
   productionDeliveryAllowed:false
  }));
 }else{
  files.set(ROOT+'/review-only/'+prefix+'.neutral.png',b);
  files.set(ROOT+'/review-only/'+prefix+'.bw-review.json',JSON.stringify({
   status:'GRAYSCALE_CANDIDATE_ONLY',originalFile:'HOOK.png',
   originalSha256:digest,originalBytes:b.length,
   correctedFile:prefix+'.neutral.png',correctedSha256:hash(b),
   correctedBytes:b.length,correctedNeutrality:{neutralRgbExact:true},
   humanVisualAudit:'PENDING',productionDeliveryAllowed:false,
   compositionVerified:false,anatomyVerified:false,
   historicalAccuracyVerified:false
  }));
 }
 const read=async(path,encoding)=>{
  if(!files.has(path))throw Error('ENOENT');
  const x=files.get(path);
  if(encoding==='utf8')return Buffer.isBuffer(x)?x.toString('utf8'):x;
  return Buffer.isBuffer(x)?Buffer.from(x):Buffer.from(x,'utf8');
 };
 return {files,read,report,b};
}
test('valid grayscale candidate retains original and stays NOT APPROVED',async()=>{
 const f=fixture();
 const x=await verifyV5ReviewArtifact({read:f.read});
 assert.equal(x.status,'V5_REVIEW_EVIDENCE_READY_NOT_APPROVED');
 assert.equal(x.reviewMode,'GRAYSCALE_CANDIDATE_ONLY');
 assert.equal(x.sourceFile,'HOOK.png');
 assert.equal(x.sourceSha256,hash(f.b));
 assert.equal(x.humanVisualAudit,'PENDING');
 for(const a of ['inferenceCalled','productionApproved','googleDriveCalled','gmailCalled'])
  assert.equal(x[a],false,a);
});
test('failed offline visual audit can preserve verified image without approving',async()=>{
 const f=fixture(true);
 const x=await verifyV5ReviewArtifact({read:f.read});
 assert.equal(x.reviewMode,'AUDIT_FAILED_NOT_APPROVED');
 assert.equal(x.productionApproved,false);
});
test('original missing, changed SHA or unsafe metadata blocks artifact upload',async()=>{
 for(const tamper of [
  f=>f.files.delete(ROOT+'/HOOK.png'),
  f=>f.files.set(ROOT+'/HOOK.png',Buffer.from('this-is-not-a-real-image')),
  f=>{f.report.output.sha256='0'.repeat(64);f.files.set(ROOT+'/report.json',JSON.stringify(f.report))},
  f=>{f.report.isolatedWorkerRemoved=false;f.files.set(ROOT+'/report.json',JSON.stringify(f.report))},
  f=>{f.report.sourceFile='../HOOK.png';f.files.set(ROOT+'/report.json',JSON.stringify(f.report))},
  f=>{f.report.output.visualAudit='PASS';f.files.set(ROOT+'/report.json',JSON.stringify(f.report))},
  f=>{f.report.googleConnected=true;f.files.set(ROOT+'/report.json',JSON.stringify(f.report))}
 ]){
  const f=fixture();tamper(f);
  await assert.rejects(verifyV5ReviewArtifact({read:f.read}),/V5_REVIEW_EVIDENCE_NOT_VERIFIED/);
 }
});
test('missing, inconsistent or falsely approved review fails closed',async()=>{
 for(const tamper of [
  f=>[...f.files.keys()].filter(k=>k.includes('.bw-review.json')).forEach(k=>f.files.delete(k)),
  f=>[...f.files.keys()].filter(k=>k.endsWith('.neutral.png')).forEach(k=>f.files.delete(k)),
  f=>{
   const p=[...f.files.keys()].find(k=>k.includes('.bw-review.json'));
   const v=JSON.parse(f.files.get(p));v.productionDeliveryAllowed=true;
   f.files.set(p,JSON.stringify(v));
  },
  f=>{
   const p=[...f.files.keys()].find(k=>k.includes('.bw-review.json'));
   const v=JSON.parse(f.files.get(p));v.correctedSha256='f'.repeat(64);
   f.files.set(p,JSON.stringify(v));
  },
  f=>f.files.set(ROOT+'/review-only/audit-failure.json',JSON.stringify({status:'V5_AUDIT_FAILED_REVIEW_ONLY'}))
 ]){
  const f=fixture();tamper(f);
  await assert.rejects(verifyV5ReviewArtifact({read:f.read}),/V5_REVIEW_EVIDENCE_NOT_VERIFIED/);
 }
});
test('workflow verifies source image before publishing artifact for owner review',()=>{
 const y=readFileSync('.github/workflows/ldb-hook-v5-one-shot.yml','utf8');
 const a=y.indexOf('      - name: Run exactly one isolated reviewed HOOK V5');
 const b=y.indexOf('      - name: Validate original HOOK and review-only artifact checksums');
 const c=y.indexOf('      - name: Publish original and review evidence for ONE DAY');
 assert.ok(a>0&&b>a&&c>b,'validation MUST follow render and precede artifact upload');
 const gate=y.slice(b,c);
 assert.match(gate,/node scripts\/ldb-v5-review-artifact-gate\.mjs/);
 assert.doesNotMatch(gate,/CLOUDFLARE_API_TOKEN|secrets\.|^\s+env:/m);
 const upload=y.slice(c);
 assert.match(upload,/inputs\.public_review_artifact/);
 assert.match(upload,/cloudflare\/ldb-runner\/public\/HOOK.png/);
 assert.match(upload,/cloudflare\/ldb-runner\/public\/HOOK.jpg/);
 assert.match(upload,/cloudflare\/ldb-runner\/public\/report.json/);
 assert.match(upload,/cloudflare\/ldb-runner\/public\/review-only\/\*\*/);
 assert.match(upload,/retention-days: 1/);
});

// Verify a single isolated HOOK V5 evidence package BEFORE publishing an
// explicitly owner-consented GitHub artifact. No Cloudflare, inference, Drive,
// Gmail, production approval, credential handling or network access.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {imageMetadata} from '../lib/ldb/cloudflare-image.mjs';
import {resolveV5SourceFile} from './ldb-v5-evidence-recovery.mjs';

const ROOT='cloudflare/ldb-runner/public';
const APPROVAL='75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05';
const fail=()=>{throw Error('V5_REVIEW_EVIDENCE_NOT_VERIFIED');};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function readJson(read,path){
 try{return JSON.parse(await read(path,'utf8'))}catch{fail()}
}
async function readBytes(read,path){
 try{return Buffer.from(await read(path))}catch{fail()}
}
function validImage(bytes,expectedMime){
 let info;try{info=imageMetadata(bytes)}catch{fail()}
 if(bytes.length<100||bytes.length>8_000_000||
    info.mimeType!==expectedMime||info.width!==576||info.height!==1024)fail();
 return info;
}
export async function verifyV5ReviewArtifact({root=ROOT,read=readFile}={}){
 const report=await readJson(read,root+'/report.json');
 let source;try{source=resolveV5SourceFile(report)}catch{fail()}
 const mime=source==='HOOK.png'?'image/png':'image/jpeg';
 const original=await readBytes(read,root+'/'+source);
 validImage(original,mime);
 const originalHash=sha(original),out=report?.output;
 if(report.status!=='HOOK_CLOUD_TEST_PASSED'||
    report.worker!=='ner-ldb-runner-quality-v5'||
    report.storyboard_sha256!==APPROVAL||
    report.completedScenes!==1||report.totalScenes!==17||
    report.checkpointStatus!=='TEST_PAUSED'||
    report.runtimeCredentialsRemoved!==true||
    report.isolatedWorkerRemoved!==true||
    report.fullAutoProduction!==false||
    report.googleConnected!==false||
    out?.scene!=='HOOK'||out?.sha256!==originalHash||
    out.bytes!==original.length||out.mimeType!==mime||
    (out.visualAudit!==undefined&&out.visualAudit!=='PENDING')||
    (('width' in out||'height' in out)&&
      (out.width!==576||out.height!==1024)))fail();

 const prefix='HOOK.'+originalHash.slice(0,12);
 // The Python reviewer chooses one path. Even its failure evidence must
 // remain visible and explicitly NOT APPROVED, never called a "pass".
 const candidatePath=root+'/review-only/'+prefix+'.neutral.png';
 const reviewPath=root+'/review-only/'+prefix+'.bw-review.json';
 const failurePath=root+'/review-only/audit-failure.json';
 let candidate,review,failure;
 try{
  candidate=await readBytes(read,candidatePath);
  review=await readJson(read,reviewPath);
 }catch{
  candidate=null;review=null;
 }
 try{failure=await readJson(read,failurePath)}catch{failure=null}
 if(candidate&&review&&failure)fail();
 let reviewMode;
 if(candidate&&review){
  validImage(candidate,'image/png');
  if(review.status!=='GRAYSCALE_CANDIDATE_ONLY'||
     review.originalFile!==source||
     review.originalSha256!==originalHash||
     review.originalBytes!==original.length||
     review.correctedFile!==prefix+'.neutral.png'||
     review.correctedSha256!==sha(candidate)||
     review.correctedBytes!==candidate.length||
     review.correctedNeutrality?.neutralRgbExact!==true||
     review.humanVisualAudit!=='PENDING'||
     review.productionDeliveryAllowed!==false||
     review.compositionVerified!==false||
     review.anatomyVerified!==false||
     review.historicalAccuracyVerified!==false)fail();
  reviewMode='GRAYSCALE_CANDIDATE_ONLY';
 }else if(!candidate&&!review&&failure){
  if(failure.status!=='V5_AUDIT_FAILED_REVIEW_ONLY'||
     failure.image!==source||failure.sha256!==originalHash||
     failure.bytes!==original.length||
     failure.humanVisualAudit!=='PENDING'||
     failure.productionDeliveryAllowed!==false)fail();
  reviewMode='AUDIT_FAILED_NOT_APPROVED';
 }else fail();
 return Object.freeze({
  status:'V5_REVIEW_EVIDENCE_READY_NOT_APPROVED',
  sourceFile:source,sourceSha256:originalHash,
  reviewMode,humanVisualAudit:'PENDING',
  imageGeneratedPreviously:true,inferenceCalled:false,
  productionApproved:false,googleDriveCalled:false,gmailCalled:false
 });
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const r=await verifyV5ReviewArtifact();
  console.log('HOOK V5 review artifact VERIFIED but NOT APPROVED. Mode: '+
    r.reviewMode+'. Source: '+r.sourceFile+' SHA256 '+r.sourceSha256+
    '. No new image generation, Drive, or Gmail.');
 }catch{
  console.error('V5_REVIEW_EVIDENCE_NOT_VERIFIED; artifact publication blocked.');
  process.exitCode=1;
 }
}

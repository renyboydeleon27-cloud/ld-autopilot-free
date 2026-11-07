// Salvage one verified V5 diagnostic JPEG after an offline QA failure.
// No provider calls, visual approvals, Google uploads or credentials.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {imageMetadata} from '../lib/ldb/cloudflare-image.mjs';
const ROOT='cloudflare/ldb-runner/public';
const APPROVAL='75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05';
const fail=()=>{throw Error('V5_RECOVERY_EVIDENCE_INVALID');};
const hash=b=>createHash('sha256').update(b).digest('hex');
export async function recoverV5AuditEvidence({root=ROOT,read=readFile,createDir=mkdir,write=writeFile}={}){
 let bytes,report,meta;
 try{
  bytes=Buffer.from(await read(root+'/HOOK.jpg'));
  report=JSON.parse(await read(root+'/report.json','utf8'));
  meta=imageMetadata(bytes);
 }catch{fail();}
 const output=report?.output;
 if(bytes.length>8_000_000||meta.mimeType!=='image/jpeg'||meta.width!==576||meta.height!==1024||
    report?.status!=='HOOK_CLOUD_TEST_PASSED'||
    report.worker!=='ner-ldb-runner-quality-v5'||
    report.storyboard_sha256!==APPROVAL||
    report.completedScenes!==1||report.totalScenes!==17||
    report.checkpointStatus!=='TEST_PAUSED'||report.runtimeCredentialsRemoved!==true||
    report.isolatedWorkerRemoved!==true||
    report.fullAutoProduction!==false||report.googleConnected!==false||
    output?.scene!=='HOOK'||output.sha256!==hash(bytes)||
    output.bytes!==bytes.length||output.mimeType!=='image/jpeg'||
    (output.visualAudit!==undefined&&output.visualAudit!=='PENDING')||
    (('width'in output||'height'in output)&&
      (output.width!==576||output.height!==1024)))fail();
 const snapshot=Object.freeze({
  status:'V5_AUDIT_FAILED_REVIEW_ONLY',
  schema:'ldb-v5-audit-recovery-v1',
  sha256:hash(bytes),bytes:bytes.length,dimensions:'576x1024',
  image:'HOOK.jpg',sourceReport:'report.json',
  humanVisualAudit:'PENDING',productionDeliveryAllowed:false,
  note:'Cloud JPEG checksum/header verified. Offline audit failed; pose, grayscale, history and anatomy are NOT approved.'
 });
 await createDir(root+'/review-only',{recursive:true});
 await write(root+'/review-only/audit-failure.json',JSON.stringify(snapshot,null,2)+'\n');
 const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>HOOK V5 — AUDIT FAILED, NOT APPROVED</title>'+
  '<main style="font:16px system-ui;max-width:700px;margin:auto;padding:20px">'+
  '<h1>HOOK V5 · AUDIT FAILED · NOT APPROVED</h1>'+
  '<p>Original cloud JPEG saved. Offline QA failed. Production delivery is BLOCKED. No new render or upload was started.</p>'+
  '<img src="HOOK.jpg" alt="Unapproved original HOOK V5" style="max-width:100%;height:auto">'+
  '<p><a href="report.json">Cloud execution report</a> · '+
  '<a href="review-only/audit-failure.json">Failed audit status</a></p></main>';
 await write(root+'/index.html',html);
 return snapshot;
}

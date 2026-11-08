// Deliberately isolated V5 one-HOOK cloud acceptance entrypoint.
// Does NOT run in normal builds; requires explicit preview and current free-plan
// verification. Never touches V4, quality Workers, Drive or production alias.
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {recoverV5AuditEvidence,resolveV5SourceFile} from './ldb-v5-evidence-recovery.mjs';
if(process.env.VERCEL_ENV!=='preview'||!process.argv.includes('--one-approved-hook-free-only'))
 throw Error('EXPLICIT_PREVIEW_TEST_REQUIRED');
const now=new Date().toISOString().slice(0,10);
if(process.env.LDB_WORKERS_PLAN!=='free'||process.env.LDB_FREE_PLAN_VERIFIED_DATE!==now)
 throw Error('CURRENT_FREE_PLAN_VERIFICATION_REQUIRED');
const commands=[
 // Check Pillow availability BEFORE any Cloudflare deployment or inference.
 ['python3',['-c','from PIL import Image, ImageOps; print("HOOK_REVIEW_DECODER_READY")']],
 ['python3',['-m','scripts.ldb_free_packager','--bundle','ldb-submissions/lake-nyos-1986-test/approved_bundle.json','/tmp/ldb-hook-package']],
 ['node',['scripts/ldb-prepare-hook-v5.mjs']],
 // A direct V5 wrapper run must always refresh account-scoped usage data;
 // yesterday's report and manual date flags never suffice for inference.
 ['node',['scripts/ldb-live-usage-preflight.mjs','--read-only']],
 ['node',['scripts/ldb-hook-cloud-test.mjs','--one-approved-hook-free-only','--hook-v5']],
 // This step runs locally on the existing image. It must never approve or upload.
 ['python3',['-m','scripts.ldb_hook_bw_audit','--input','__V5_SOURCE_FILE_FROM_REPORT__','--output-dir','cloudflare/ldb-runner/public/review-only','--preview-compare']]
];
// Earlier steps must fail closed. Only the LAST, offline Python audit may
// preserve a failed/NOT APPROVED review preview instead of discarding the
// already generated source image by failing the entire Vercel preview build.
for(const [index,[command,args]] of commands.entries()){
 if(index===commands.length-1){
  // The runner can return image/png OR image/jpeg.
  let sourceFile;
  try{sourceFile=resolveV5SourceFile(JSON.parse(readFileSync('cloudflare/ldb-runner/public/report.json','utf8')))}
  catch{throw Error('V5_SOURCE_REPORT_INVALID')}
  args[args.indexOf('--input')+1]='cloudflare/ldb-runner/public/'+sourceFile;
 }
 const result=spawnSync(command,args,{stdio:'inherit',env:process.env});
 if(result.status===0)continue;
 if(index!==commands.length-1)process.exit(result.status||1);
 try{
  const snapshot=await recoverV5AuditEvidence();
  console.error('V5_AUDIT_FAILED_REVIEW_ONLY: preserved verified source; never approved. '+snapshot.sha256);
 }catch{
  console.error('V5_AUDIT_FAILURE_AND_UNVERIFIED_EVIDENCE');
  process.exit(result.status||1);
 }
}

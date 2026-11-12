// Read-only private review package. Uses the *reviewer* credential, never
// staging or runner credentials. Does not render, approve, POST or upload.
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import {mkdir,mkdtemp,writeFile,rename,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {ALL_SCENES} from './verified-image-handoff.mjs';
import {assertPngContainer} from './png-container-gate.mjs';
const HASH=/^[a-f0-9]{64}$/;
const digest=b=>createHash('sha256').update(b).digest('hex');
const fail=message=>{throw Error(message);};
export function validateReviewEndpoint(baseUrl){
 let url;try{url=new URL(baseUrl)}catch{fail('INVALID_REVIEW_ENDPOINT')}
 if(url.protocol!=='https:'||url.port||url.username||url.password||
  url.pathname!=='/'||url.search||url.hash||
  !/^ner-ldb-runner-quality(?:-v5)?\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname))
  fail('INVALID_REVIEW_ENDPOINT');
 return url.origin;
}
// Never buffer an unbounded response body from a remote Worker. The exact
// byte count is signed by the already-checked server status snapshot.
async function readCheckedBody(response,expectedBytes){
 const length=response.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>expectedBytes))
  fail('REVIEW_IMAGE_BODY_TOO_LARGE');
 const reader=response.body?.getReader();
 if(!reader)fail('REVIEW_IMAGE_BODY_MISSING');
 const chunks=[];let total=0;
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   if(!(value instanceof Uint8Array))fail('REVIEW_IMAGE_STREAM_INVALID');
   total+=value.byteLength;
   if(total>expectedBytes)fail('REVIEW_IMAGE_BODY_TOO_LARGE');
   chunks.push(Buffer.from(value));
  }
 }catch(e){
  try{await reader.cancel()}catch{/* preserve original integrity error */}
  throw e;
 }
 return Buffer.concat(chunks,total);
}

export async function buildReadOnlyReviewPackage({
 baseUrl,secret,outputRoot,fetcher=fetch
}={}){
 const origin=validateReviewEndpoint(baseUrl);
 if(typeof secret!=='string'||secret.length<32||/\s/.test(secret))fail('REVIEW_SECRET_REQUIRED');
 if(typeof outputRoot!=='string'||!outputRoot.trim())fail('OUTPUT_ROOT_REQUIRED');
 if(typeof fetcher!=='function')fail('FETCHER_REQUIRED');
 const get=async path=>{
  let response;
  try{
   response=await fetcher(origin+path,{method:'GET',redirect:'error',
    headers:{Authorization:'Bearer '+secret,Accept:path.endsWith('/status')?'application/json':'image/png'},
    signal:AbortSignal.timeout(20000)});
  }catch{fail('REVIEW_READ_UNAVAILABLE')}
  if(response.status!==200)fail('REVIEW_READ_UNAVAILABLE');
  return response;
 };
 const status=await (await get('/internal/quality/status')).json();
 if(status?.status!=='REVIEW_CANDIDATES_READY'||status.reviewReady!==true||
    status.visualAudit!=='PENDING'||status.deliveryReady!==false||
    status.googleUploadsStarted!==false||status.stagedVerified!==17||
    status.expectedScenes!==17||!HASH.test(status.jobId||'')||
    !Array.isArray(status.scenes)||status.scenes.length!==17)
  fail('REVIEW_CANDIDATES_NOT_READY');
 const seen=new Set(),assets=[];
 for(let i=0;i<17;i++){
  const scene=ALL_SCENES[i],item=status.scenes[i];
  if(item?.scene!==scene||item.status!=='STAGED'||!HASH.test(item.sha256||'')||
    !Number.isSafeInteger(item.bytes)||item.bytes<1||item.bytes>8_000_000||seen.has(scene))
   fail('REVIEW_STATUS_INTEGRITY_FAILED');
  seen.add(scene);
 }
 // Never expose an incomplete package under a ready filename. Create private
 // temporary files, revalidate the live job, and publish via a single rename.
 const root=resolve(outputRoot);
 await mkdir(root,{recursive:true,mode:0o700});
 const staging=await mkdtemp(join(root,'.ldb-review-'+status.jobId.slice(0,8)+'-building-'));
 const ready=join(root,staging.slice(root.length+1).replace(/^\./,'').replace('-building-','-ready-'));
 let published=false;
 try{
  for(const item of status.scenes){
   const resp=await get('/internal/quality/candidate/'+item.scene);
   if(resp.headers.get('content-type')?.split(';')[0].trim()!=='image/png'||
    resp.headers.get('x-ldb-scene')!==item.scene||
    resp.headers.get('x-ldb-visual-audit')!=='PENDING'||
    resp.headers.get('x-ldb-sha256')!==item.sha256)
    fail('REVIEW_IMAGE_HEADERS_MISMATCH');
   const bytes=await readCheckedBody(resp,item.bytes);
   if(bytes.length!==item.bytes||digest(bytes)!==item.sha256)
    fail('REVIEW_IMAGE_INTEGRITY_FAILED');
   assertPngContainer(bytes);
   const name=item.scene+'.png';
   await writeFile(join(staging,name),bytes,{flag:'wx',mode:0o600});
   assets.push({scene:item.scene,name,sha256:item.sha256,bytes:item.bytes,status:'PENDING'});
  }
  // A complete candidate set could have been STOPPED or replaced while
  // 17 files were streaming. Verify the SAME immutable job and digest set.
  const latest=await (await get('/internal/quality/status')).json();
  if(latest?.jobId!==status.jobId||
   latest.status!=='REVIEW_CANDIDATES_READY'||latest.reviewReady!==true||
   latest.visualAudit!=='PENDING'||latest.deliveryReady!==false||
   latest.googleUploadsStarted!==false||latest.stagedVerified!==17||
   !Array.isArray(latest.scenes)||latest.scenes.length!==17||
   latest.scenes.some((item,i)=>item?.scene!==status.scenes[i].scene||
    item?.sha256!==status.scenes[i].sha256||
    item?.bytes!==status.scenes[i].bytes||item?.status!=='STAGED'))
   fail('REVIEW_SNAPSHOT_CHANGED');
  // No reviewerVerified=true, PASS, or network submission is ever emitted.
  const audit={jobId:status.jobId,status:'PENDING',reviewerVerified:false,
   scenes:assets.map(a=>({scene:a.scene,result:'PENDING',sha256:a.sha256}))};
  const manifest={schema:'ldb-read-only-review-package-v1',jobId:status.jobId,
   imageCount:17,visualAudit:'PENDING',driveUploadsStarted:false,
   inferenceCalled:false,assets};
  const cards=assets.map(a=>'<article><img loading="lazy" src="'+a.name+
   '" alt="'+a.scene+' candidate"><h2>'+a.scene+'</h2><p>Review: PENDING</p><small>SHA-256: '+
   a.sha256+'</small></article>').join('\n');
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
   '<meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<title>LDB Private 17-Image Review</title><style>body{font:16px system-ui;margin:20px;background:#121821;color:white}'+
   'main{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}'+
   'article{padding:12px;border:1px solid #53617b;border-radius:12px}img{width:100%;height:auto}'+
   'small{overflow-wrap:anywhere;color:#aebbcf}</style></head><body>'+
   '<h1>LDB — 17 staged image candidates</h1><p>Visual review PENDING. No approval, upload or AI generation has been triggered.</p>'+
   '<p>Check history, grayscale (except the thumbnail), consistent characters and physical motion. '+
   'Only a separately authenticated reviewer can approve final content.</p><main>'+cards+
   '</main></body></html>';
  await writeFile(join(staging,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});
  await writeFile(join(staging,'review-audit-draft.json'),JSON.stringify(audit,null,2),{flag:'wx',mode:0o600});
  await writeFile(join(staging,'index.html'),html,{flag:'wx',mode:0o600});
  await rename(staging,ready);
  published=true;
  return Object.freeze({status:'REVIEW_PACKAGE_READY',path:ready,imageCount:17,
   visualAudit:'PENDING',approvalGranted:false,driveUploadsStarted:false,inferenceCalled:false});
 }finally{
  // A network timeout, corrupt image, job swap, or disk-write failure must
  // never leave partial private content in the operator's workspace.
  if(!published)await rm(staging,{recursive:true,force:true});
 }
}

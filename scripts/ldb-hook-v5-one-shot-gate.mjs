// Fail-closed, owner-only GitHub Actions gate for the isolated V5 one-image test.
// This gate never contacts Cloudflare; the existing V5 CLI independently performs
// current account/quota checks immediately before any Worker write or inference.
import {pathToFileURL} from 'node:url';

const OWNER='renyboydeleon27-cloud';
const REPO=OWNER+'/ld-autopilot-free';
const REF='refs/heads/feature/ldb-image-acceptance';
const WORKFLOW='ldb-hook-v5-one-shot.yml';
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const fail=message=>{throw Error('HOOK_V5_GATE_'+message)};

export function inspectOneShotEnvironment(env={},now=Date.now()){
 if(!Number.isFinite(now))fail('CLOCK_INVALID');
 const day=new Date(now).toISOString().slice(0,10);
 if(env.GITHUB_REPOSITORY!==REPO||env.GITHUB_REF!==REF||
    env.GITHUB_ACTOR!==OWNER||env.GITHUB_EVENT_NAME!=='workflow_dispatch')
  fail('OWNER_OR_BRANCH_MISMATCH');
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!==REF.slice('refs/heads/'.length))
  fail('PREVIEW_REQUIRED');
 if(env.GITHUB_RUN_ATTEMPT!=='1'||!/^\d+$/.test(env.GITHUB_RUN_ID||'')||
    !Number.isSafeInteger(Number(env.GITHUB_RUN_ID))||Number(env.GITHUB_RUN_ID)<1)
  fail('RUN_ID_OR_ATTEMPT_INVALID');
 if(!DAY.test(env.LDB_HOOK_REQUEST_UTC_DATE||'')||
    env.LDB_HOOK_REQUEST_UTC_DATE!==day||env.LDB_FREE_PLAN_VERIFIED_DATE!==day)
  fail('SAME_DAY_OWNER_ATTESTATION_REQUIRED');
 if(env.LDB_HOOK_V5_ENV_REVIEW_APPROVED!=='true'||
    env.LDB_WORKERS_PLAN!=='free'||env.FREE_PLAN_CONFIRMED!=='true')
  fail('FREE_ONLY_ENVIRONMENT_APPROVAL_REQUIRED');
 // An account identifier is public metadata; do NOT provide the Cloudflare
 // token to this step. Only the final V5 render step may receive that secret.
 if(env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT)
  fail('ISOLATED_ACCOUNT_REQUIRED');
 if(typeof env.GITHUB_TOKEN!=='string'||env.GITHUB_TOKEN.length<10||
    /\s/.test(env.GITHUB_TOKEN))fail('ACTIONS_READ_TOKEN_REQUIRED');
 return Object.freeze({day,runId:Number(env.GITHUB_RUN_ID)});
}

export async function oneShotGate({env=process.env,now=Date.now(),fetcher=fetch}={}){
 const {day,runId}=inspectOneShotEnvironment(env,now);
 if(typeof fetcher!=='function')fail('FETCH_UNAVAILABLE');
 // Require complete, same-UTC-day workflow-run inventory. If GitHub cannot
 // prove this is the first attempt, no expensive operation may begin.
 const url='https://api.github.com/repos/'+REPO+'/actions/workflows/'+WORKFLOW+
  '/runs?event=workflow_dispatch&created='+day+'&per_page=100';
 let response,body;
 try{
  response=await fetcher(url,{method:'GET',redirect:'error',
   headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000)});
  if(response.status!==200)fail('RUN_INVENTORY_UNAVAILABLE');
  body=await response.json();
 }catch{fail('RUN_INVENTORY_UNAVAILABLE');}
 if(!body||!Number.isSafeInteger(body.total_count)||body.total_count<1||
    body.total_count>100||!Array.isArray(body.workflow_runs)||
    body.workflow_runs.length!==body.total_count)
  fail('RUN_INVENTORY_INCOMPLETE');
 const runs=body.workflow_runs;
 if(!runs.some(r=>r&&r.id===runId&&r.head_branch===REF.slice('refs/heads/'.length)&&
   typeof r.created_at==='string'&&r.created_at.slice(0,10)===day))
  fail('CURRENT_RUN_NOT_IN_INVENTORY');
 if(runs.some(r=>r&&r.id!==runId&&
    r.head_branch===REF.slice('refs/heads/'.length)&&
    typeof r.created_at==='string'&&r.created_at.slice(0,10)===day))
  fail('EARLIER_ONE_SHOT_ALREADY_REQUESTED');
 // This only approves entering the existing preflight CLI. It does not
 // approve inference, paid plan, images, or cleanup on its own.
 return Object.freeze({status:'ONE_SHOT_GATE_PASSED',day,runId,
  inferenceCalled:false,productionReleased:false});
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{const result=await oneShotGate();
  console.log('One-shot owner and daily-attempt guard passed for '+result.day+
   '; V5 provider preflight remains mandatory.');}
 catch(e){console.error(/^HOOK_V5_GATE_[A-Z_]+$/.test(e.message)?e.message:'HOOK_V5_GATE_UNAVAILABLE');
  process.exitCode=1;}
}

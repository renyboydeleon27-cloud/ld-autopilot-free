// GitHub Environment security audit, READ ONLY. No Cloudflare access.
// Failure to inspect is NOT evidence that a protected environment exists.
import {pathToFileURL} from 'node:url';

const REPO='renyboydeleon27-cloud/ld-autopilot-free';
const ENV='ldb-hook-v5-free';
const ACCEPTANCE='feature/ldb-image-acceptance';
const AUDIT_BRANCH='refs/heads/feature/ldb-hook-v5-cloud-executor';
const API='https://api.github.com/repos/'+REPO+'/environments/'+ENV;
const deny=code=>{throw Error('HOOK_V5_ENV_'+code);};

function validateIdentity(env){
 if(env.GITHUB_REPOSITORY!==REPO||env.GITHUB_REF!==AUDIT_BRANCH||
    env.GITHUB_ACTOR!=='renyboydeleon27-cloud'||
    env.GITHUB_EVENT_NAME!=='workflow_dispatch'||
    env.LDB_AUDIT_REQUEST!=='hook-v5-environment-audit')deny('OWNER_BRANCH_OR_MODE_REQUIRED');
 if(typeof env.GITHUB_TOKEN!=='string'||env.GITHUB_TOKEN.length<10||
   /\s/.test(env.GITHUB_TOKEN))deny('READ_ONLY_TOKEN_UNAVAILABLE');
}

async function getGitHub(url,token,fetcher){
 let r,j;
 try{
  r=await fetcher(url,{method:'GET',redirect:'error',
   headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000)});
  if(r.status!==200)deny('METADATA_UNVERIFIED');
  j=await r.json();
 }catch{deny('METADATA_UNVERIFIED');}
 return j;
}

export async function auditHookV5Environment({env=process.env,fetcher=fetch}={}){
 validateIdentity(env);
 const details=await getGitHub(API,env.GITHUB_TOKEN,fetcher);
 if(!details||details.name!==ENV)deny('WRONG_ENVIRONMENT');
 const deployment=details.deployment_branch_policy;
 if(deployment?.custom_branch_policies!==true||
    deployment.protected_branches!==false)deny('CUSTOM_ACCEPTANCE_BRANCH_REQUIRED');
 const rules=details.protection_rules;
 if(!Array.isArray(rules))deny('REVIEW_RULES_UNVERIFIED');
 const reviews=rules.find(rule=>rule?.type==='required_reviewers');
 if(!Array.isArray(reviews?.reviewers)||reviews.reviewers.length<1)
  deny('REVIEWER_APPROVAL_REQUIRED');
 // Do not mistake a review gate for a usable one. If the only reviewer is
 // the deployment initiator, a self-review restriction would deadlock.
 const logins=reviews.reviewers.map(r=>r?.reviewer?.login).filter(Boolean);
 if(logins.length===0)deny('REVIEWER_IDENTITIES_UNVERIFIED');
 if(details.prevent_self_review===true&&
    logins.every(x=>x==='renyboydeleon27-cloud'))deny('SELF_REVIEW_DEADLOCK');
 const policy=await getGitHub(API+'/deployment-branch-policies?per_page=100',
  env.GITHUB_TOKEN,fetcher);
 if(!Number.isSafeInteger(policy?.total_count)||policy.total_count!==1||
    !Array.isArray(policy.branch_policies)||policy.branch_policies.length!==1||
    policy.branch_policies[0]?.name!==ACCEPTANCE)
  deny('EXACT_BRANCH_POLICY_REQUIRED');
 return Object.freeze({
  status:'GITHUB_ENV_REVIEW_CONFIGURED',
  environment:ENV,acceptedBranch:ACCEPTANCE,
  reviewerCount:reviews.reviewers.length,protectedBranchPolicy:true,
  ownerCanTriggerRender:false,cloudflareChecked:false,inferenceCalled:false,
  note:'Environment configuration is only one gate; no inference authorization.'
 });
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const result=await auditHookV5Environment();
  console.log('HOOK V5 environment review rules and exact branch policy verified: '+
    result.environment+'; inference remains OFF.');
 }catch(e){
  const code=typeof e?.message==='string'&&/^HOOK_V5_ENV_[A-Z_]+$/.test(e.message)?
   e.message:'HOOK_V5_ENV_METADATA_UNVERIFIED';
  console.error(code+'; no image render or credential access.');
  process.exitCode=1;
 }
}

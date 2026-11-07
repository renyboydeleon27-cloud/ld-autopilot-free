// Explicit read-only preview diagnostic. No inference or credential output.
import {mkdir,writeFile} from 'node:fs/promises';
if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance'||!process.argv.includes('--read-only'))throw Error('PREVIEW_REQUIRED');
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
if(account!=='a437dda5f38ba6b10991684b8388760b')throw Error('ACCOUNT_MISMATCH');
const headers={Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'};
const request=async(url,options={})=>{
 try{const response=await fetch(url,{...options,headers,redirect:'error',signal:AbortSignal.timeout(20000)});
 return {status:response.status,data:await response.json()};}
 catch{return {status:null,data:{errors:[{message:'REQUEST_FAILED'}]}};}
};
const graphql=query=>request('https://api.cloudflare.com/client/v4/graphql',{method:'POST',body:JSON.stringify({query})});
const scripts=await request('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts');
const schema=await graphql('{ __schema { types { name fields { name } } } }');
const types=schema.data.data?.__schema?.types?.filter(t=>/aiInference/i.test(t.name))||[];
const now=new Date(),start=now.toISOString().slice(0,10)+'T00:00:00Z';
const sums=types.filter(t=>/sum$/i.test(t.name));
const neuronField=sums.flatMap(t=>t.fields||[]).find(f=>/neurons/i.test(f.name))?.name;
let usage=null;
if(neuronField&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(neuronField)){
 const query='{ viewer { accounts(filter: {accountTag: '+JSON.stringify(account)+'}) { aiInferenceAdaptiveGroups(filter: {datetime_geq: '+JSON.stringify(start)+', datetime_leq: '+JSON.stringify(now.toISOString())+'}, limit: 1) { sum { '+neuronField+' } } } } }';
 const result=await graphql(query);
 usage={httpStatus:result.status,errors:result.data.errors?.map(e=>e.message),metric:neuronField,data:result.data.data??null};
}
const report={checkedAt:now.toISOString(),inferenceCalled:false,workerListStatus:scripts.status,
 v5:Array.isArray(scripts.data.result)?scripts.data.result.filter(s=>s.id==='ner-ldb-runner-quality-v5').map(s=>({id:s.id,modifiedOn:s.modified_on})):null,
 graphqlStatus:schema.status,errors:schema.data.errors?.map(e=>e.message),
 aiTypes:types.map(t=>({name:t.name,fields:t.fields?.map(f=>f.name)})),usage,
 liveQuotaRemaining:null};
await mkdir('cloudflare/ldb-runner/public',{recursive:true});
await writeFile('cloudflare/ldb-runner/public/live-preflight.json',JSON.stringify(report,null,2));
console.log('Read-only preflight completed; inferenceCalled=false');

// Deliberately isolated V5 one-HOOK cloud acceptance entrypoint.
// Does NOT run in normal builds; requires explicit preview and current free-plan
// verification. Never touches V4, quality Workers, Drive or production alias.
import {spawnSync} from 'node:child_process';
if(process.env.VERCEL_ENV!=='preview'||!process.argv.includes('--one-approved-hook-free-only'))
 throw Error('EXPLICIT_PREVIEW_TEST_REQUIRED');
const now=new Date().toISOString().slice(0,10);
if(process.env.LDB_WORKERS_PLAN!=='free'||process.env.LDB_FREE_PLAN_VERIFIED_DATE!==now)
 throw Error('CURRENT_FREE_PLAN_VERIFICATION_REQUIRED');
const commands=[
 ['python3',['-m','scripts.ldb_free_packager','--bundle','ldb-submissions/lake-nyos-1986-test/approved_bundle.json','/tmp/ldb-hook-package']],
 ['node',['scripts/ldb-prepare-hook-v5.mjs']],
 ['node',['scripts/ldb-hook-cloud-test.mjs','--one-approved-hook-free-only','--hook-v5']]
];
for(const [command,args] of commands){
 const result=spawnSync(command,args,{stdio:'inherit',env:process.env});
 if(result.status!==0)process.exit(result.status||1);
}

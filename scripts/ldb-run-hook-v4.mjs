import {spawnSync} from 'node:child_process';
if(process.env.VERCEL_ENV!=='preview'||!process.argv.includes('--one-approved-hook-free-only'))throw Error('EXPLICIT_PREVIEW_TEST_REQUIRED');
for(const [command,args] of [['python3',['-m','scripts.ldb_free_packager','--bundle','ldb-submissions/lake-nyos-1986-test/approved_bundle.json','/tmp/ldb-hook-package']],['node',['scripts/ldb-prepare-hook-v4.mjs']],['node',['scripts/ldb-hook-cloud-test.mjs','--one-approved-hook-free-only']]]){
 const result=spawnSync(command,args,{stdio:'inherit',env:process.env});if(result.status!==0)process.exit(result.status||1);
}

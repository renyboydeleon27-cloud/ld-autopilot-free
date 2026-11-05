import {writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if(process.env.VERCEL_ENV!=='preview'||!process.argv.includes('--one-approved-hook-free-only'))throw Error('EXPLICIT_PREVIEW_TEST_REQUIRED');
// Fail before any inference if the read-only audit dependency is unavailable.
const dependency=spawnSync('python3',['-c','from PIL import Image, ImageOps'],{stdio:'inherit'});
if(dependency.status!==0)throw Error('PIXEL_AUDIT_DEPENDENCY_REQUIRED');
for(const [command,args] of [['python3',['-m','scripts.ldb_free_packager','--bundle','ldb-submissions/lake-nyos-1986-test/approved_bundle.json','/tmp/ldb-hook-package']],['node',['scripts/ldb-prepare-hook-v4.mjs']],['node',['scripts/ldb-hook-cloud-test.mjs','--one-approved-hook-free-only']]]){
 const result=spawnSync(command,args,{stdio:'inherit',env:process.env});if(result.status!==0)process.exit(result.status||1);
}

// Keep technical execution separate from pixel and visual acceptance.
const pixel=spawnSync('python3',['-m','scripts.ldb_audit_image','HOOK','cloudflare/ldb-runner/public/HOOK.jpg'],{encoding:'utf8'});
if(![0,2].includes(pixel.status))throw Error('PIXEL_AUDIT_EXECUTION_FAILED');
const audit=JSON.parse(pixel.stdout);
if(audit.delivery_ready!==false||audit.visual_check!=='PENDING')throw Error('INVALID_PIXEL_AUDIT');
writeFileSync('cloudflare/ldb-runner/public/pixel-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log('Pixel audit: '+audit.structural_check+'; visual approval still required.');


// Persist correction separately; source render and checkpoint remain immutable.
const prepare=spawnSync('python3',['-m','scripts.ldb_prepare_rendered_image',
 '--source','cloudflare/ldb-runner/public/HOOK.jpg',
 '--checkpoint','cloudflare/ldb-runner/public/report.json',
 '--destination','cloudflare/ldb-runner/public/prepared'],{stdio:'inherit'});
if(prepare.status!==0)throw Error('CORRECTED_RENDER_PERSISTENCE_FAILED');

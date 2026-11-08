// One-command, no-network, no-inference readiness summary for the owner.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {oneBatchReadiness} from '../lib/ldb/one-batch-readiness.mjs';
export {oneBatchReadiness};
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv.includes('--read-only'))throw Error('READ_ONLY_FLAG_REQUIRED');
 let report=null;
 try{report=JSON.parse(await readFile('cloudflare/ldb-runner/public/live-preflight.json','utf8'));}
 catch{/* Missing, malformed or inaccessible report must fail closed. */}
 console.log(JSON.stringify(oneBatchReadiness({env:process.env,report}),null,2));
}

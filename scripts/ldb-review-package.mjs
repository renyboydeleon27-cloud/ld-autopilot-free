// Explicit, owner-invoked, read-only private review gallery builder.
import {pathToFileURL} from 'node:url';
import {buildReadOnlyReviewPackage} from '../lib/ldb/read-only-review-package.mjs';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv.includes('--read-only'))throw Error('EXPLICIT_READ_ONLY_FLAG_REQUIRED');
 const result=await buildReadOnlyReviewPackage({
  baseUrl:process.env.LDB_RUNNER_REVIEW_URL,
  secret:process.env.LDB_QUALITY_REVIEW_SECRET,
  outputRoot:process.env.LDB_REVIEW_PACKAGE_ROOT||'./ldb-review-packages'
 });
 // No credential or private provider response is logged.
 console.log(JSON.stringify(result,null,2));
}

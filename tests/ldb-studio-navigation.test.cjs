'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const worker=fs.readFileSync(require('node:path').join(__dirname,'../service-worker.js'),'utf8');
test('PWA navigation fallback only applies to root and index, not separate studios',()=>{
 assert.match(worker,/request\.mode==='navigate'&&\(url\.pathname==='\/'\|\|url\.pathname==='\/index\.html'\)/);
 assert.doesNotMatch(worker,/if\(request\.mode==='navigate'\)\s*\{/);
 assert.match(worker,/fetch\(request,\{cache:'no-store'\}\)/);
});

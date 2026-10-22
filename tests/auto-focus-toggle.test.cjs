/* Magnetic auto-scroll removal — permanent no-op and explicit manual navigation only. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../ner-auto-focus.js');
const source=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('legacy magnetic API is permanently OFF even with saved preference ON',()=>{
 const writes=[];globalThis.localStorage={getItem:k=>k===A.KEY?'on':null,setItem:(...v)=>writes.push(v)};
 let moves=0;const stage={scrollIntoView(){moves++;}};
 assert.equal(A.enabled(),false);
 assert.equal(A.setEnabled(true),false);
 assert.equal(A.scrollTo(stage,{behavior:'smooth'}),false);
 assert.equal(A.mount(),false);
 assert.equal(moves,0);
 assert.equal(writes.length,0,'no saved project or toggle setting is ever changed');
});
test('release no longer loads the magnetic auto-focus module or its UI',()=>{
 const html=source('index.html');
 assert.doesNotMatch(html,/src="ner-auto-focus\.js/);
 assert.match(html,/v5\.1\.40/);
 const smart=source('smart-continue.js');
 assert.doesNotMatch(smart,/NERAutoFocus/);
 assert.doesNotMatch(smart,/scrollIntoView\s*\(/);
 assert.doesNotMatch(smart,/restoreCurrentPanelViewport\(\{/,'no reload/return page jumps');
 assert.match(smart,/function restoreCurrentPanelViewport\(\)\{return false;\}/);
});
test('new-project reset, project lock and project library cannot force page jumps',()=>{
 for(const file of ['new-project-fix.js','project-locks.js','project-library.js']){
   const text=source(file);
   assert.doesNotMatch(text,/scrollIntoView\s*\(/,file);
 }
 assert.doesNotMatch(source('new-project-fix.js'),/Element\.prototype\.scrollIntoView|installViewportGuard|\.focus\s*\(/);
 assert.doesNotMatch(source('project-library.js'),/topic\.focus\s*\(/);
});
test('manual panel jump controls continue working when user explicitly taps them',()=>{
 const app=source('app.js');
 assert.match(app,/function scrollToCard\(card\).*?card\.scrollIntoView/s);
 assert.match(app,/jumpStage\.addEventListener\('change',\(\)=>scrollToCard/s);
 assert.match(app,/nextIncompleteBtn\.addEventListener\('click',nextIncomplete\)/);
});

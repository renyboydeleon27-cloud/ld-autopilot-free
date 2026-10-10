const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('narration-smart-continue.js','utf8');
function boot(storage=new Map(),saved=null){
 const fields=Object.fromEntries(['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'].map(s=>[s,{value:'Narration '+s}]));
 let currentTopic='Event A';
 const window={ldNarrationApprovalState:saved,dispatchEvent(){},LDCore:{saveCurrent(){}}};
 const ctx={window,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:id=>({value:id==='format'?'shorts':currentTopic})},stages:{querySelector:selector=>{const stage=selector.match(/data-stage="([^"]+)"/)[1];return {querySelector:()=>fields[stage]};}},CustomEvent:class{}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function topic(){'),source.indexOf('  function detectSeconds('))+';this.api={approveNarration,isApproved,clearApproval};',ctx);
 return {api:ctx.api,window,fields,storage,setTopic:t=>currentTopic=t};
}
test('approval survives cold restart from local storage and from a project snapshot',()=>{
 const a=boot();assert.equal(a.api.approveNarration(),true);
 assert.equal(boot(a.storage).api.isApproved(),true);
 const saved=JSON.parse(JSON.stringify(a.window.ldNarrationApprovalState));
 assert.equal(boot(new Map(),saved).api.isApproved(),true);
});
test('different project, changed narration and missing narration cannot inherit approval',()=>{
 const a=boot();a.api.approveNarration();a.setTopic('Event B');assert.equal(a.api.isApproved(),false);
 a.setTopic('Event A');a.fields.P1.value='Changed';assert.equal(a.api.isApproved(),false);
 a.fields.P1.value='';assert.equal(a.api.approveNarration(),false);
});
test('explicit invalidation clears memory and durable state across restart',()=>{
 const a=boot();a.api.approveNarration();a.api.clearApproval();assert.equal(a.window.ldNarrationApprovalState,null);assert.equal(boot(a.storage).api.isApproved(),false);
});
test('core snapshot includes the approval and project build hydrates it',()=>{
 const app=fs.readFileSync('app.js','utf8');
 assert.match(app,/narrationApproval:window\.ldNarrationApprovalState\|\|null/);
 assert.match(app,/window\.ldNarrationApprovalState=seed\?\.narrationApproval/);
});

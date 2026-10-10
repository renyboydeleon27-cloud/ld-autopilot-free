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
test('startup narration protection works before narration UI loads',()=>{
 const a=boot();a.api.approveNarration();
 const app=fs.readFileSync('app.js','utf8');
 const ctx={window:a.window,topicEl:{value:'Event A'},formatEl:{value:'shorts'},stagesEl:{querySelector:q=>a.fields[q.match(/data-stage="([^"]+)"/)[1]]}};
 vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('function isNarrationProtected(){'),app.indexOf('function applyApprovalLedgerSnapshot(')),ctx);
 assert.equal(ctx.isNarrationProtected(),true);
 a.fields.P1.value='Manual edit';assert.equal(ctx.isNarrationProtected(),false);
});
test('historical startup enhancer preserves approved imported speech',()=>{
 const src=fs.readFileSync('historical-context.js','utf8');
 const start=src.indexOf('    if(!window.LDCore?.isNarrationProtected?.()&&narration');
 const code=src.slice(start,src.indexOf('\n    if(image)',start));
 const ctx={window:{LDCore:{isNarrationProtected:()=>true}},narration:{value:'My approved wording'},stage:'P1',preserveSaved:false,card:{dataset:{}},ctx:{},improveNarration:()=> 'Template replacement'};
 vm.createContext(ctx);vm.runInContext(code,ctx);assert.equal(ctx.narration.value,'My approved wording');
});
test('real core API exposes synchronous save used by import approval',()=>{
 const app=fs.readFileSync('app.js','utf8');
 assert.match(app,/window.LDCore=Object.freeze\(\{saveCurrent,isNarrationProtected,/);
});

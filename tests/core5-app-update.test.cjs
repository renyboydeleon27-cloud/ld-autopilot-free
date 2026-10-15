const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function fixture(controlled=true){
 const elements=[],events={},reg={addEventListener(){},update:async()=>{}},controller={postMessage(){}};
 let reloads=0,saves=0,saveResult=true;
 const document={readyState:'complete',hidden:false,addEventListener(){},getElementById:id=>elements.find(e=>e.id===id),querySelector:selector=>selector==='.topbar'?{append(){}}:selector==='.stage-card'?{}:null,
 createElement(){const handlers={};const el={append(){},setAttribute(){},addEventListener:(name,fn)=>handlers[name]=fn,click:()=>handlers.click?.()};elements.push(el);return el;}};
 const window={LDCore:{saveCurrent(){saves++;return saveResult;}},addEventListener(){}};
 const sw={controller:controlled?controller:null,addEventListener:(n,f)=>events[n]=f,register:async()=>reg};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app-update.js'),'utf8'),{document,window,navigator:{serviceWorker:sw},location:{reload(){reloads++;}},Date,WeakSet,setTimeout:()=>1,clearTimeout(){},MessageChannel:class{constructor(){this.port1={close(){}};this.port2={};}}});
 return {document,events,setSave:v=>saveResult=v,get reloads(){return reloads;},get saves(){return saves;}};
}
test('activation does not silently reload and explicit update refuses a failed save',async()=>{
 const f=fixture();await Promise.resolve();f.events.controllerchange();assert.equal(f.reloads,0);
 const button=f.document.getElementById('appUpdateButton');assert.equal(button.textContent,'Load available update');
 f.setSave(false);await button.click();assert.equal(f.reloads,0);assert.match(f.document.getElementById('appUpdateStatus').textContent,/Save failed/);
 f.setSave(true);await button.click();assert.equal(f.reloads,1);assert.equal(f.saves,2);
});
test('first worker install does not offer a redundant reload loop',()=>{
 const f=fixture(false);f.events.controllerchange();assert.equal(f.document.getElementById('appUpdateButton').textContent,'Check app update');assert.equal(f.reloads,0);
});

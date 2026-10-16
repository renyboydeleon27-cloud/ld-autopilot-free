const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('legacy survival decorator cannot rewrite approved hooks before hook-choice module loads',()=>{
 for(const mode of ['committed','done','canonical']){
  const timers=[],fields={'.image-prompt':{value:'Approved image'},'.flow-prompt':{value:'Approved animation'},'.scene-role':{textContent:'Approved role'},'.done-toggle':{checked:mode==='done'}};
  const card={dataset:{approvalCommitted:mode==='committed'?'1':''},querySelector:s=>fields[s]};
  const stages={querySelector:()=>card},document={getElementById:()=>stages,addEventListener(){}};
  const window={addEventListener(){},NERCore5Runtime:{protectedPanel:()=>mode==='canonical'}};
  const before=JSON.stringify(fields);vm.runInNewContext(fs.readFileSync('hook-survival-lock.js','utf8'),{window,document,setTimeout:f=>timers.push(f)});timers.forEach(f=>f());assert.equal(JSON.stringify(fields),before);
 }
});

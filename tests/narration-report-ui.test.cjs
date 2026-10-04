const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('narration-smart-continue.js','utf8');
const reportCode=source.slice(source.indexOf('  // Reports are diagnostic only:'),source.indexOf('  const importBox='));
function mount(storage,selection){
 const element=()=>({style:{},setAttribute(){},append(){},addEventListener(){}});
 const context={document:{createElement:element,getElementById:()=>element()},controls:{appendChild(){}},window:{addEventListener(){}},localStorage:storage,topic:()=>selection.topic,format:()=> 'shorts'};
 vm.createContext(context);vm.runInContext(reportCode+';globalThis.reportTest={saveReport,refreshReport,reportKey,reportText,reportDetails};',context);
 return context.reportTest;
}
test('report survives reload and remains isolated by project and topic',()=>{
 const saved=new Map(),selection={id:'one',topic:'Tornado 1989'};
 const storage={getItem:k=>k==='ld-autopilot-free-active-project'?selection.id:saved.get(k),setItem:(k,v)=>saved.set(k,v)};
 const a=mount(storage,selection);a.saveReport({topic:selection.topic,claim:'<script>untrusted</script>'},a.reportKey());
 const b=mount(storage,selection);assert.match(b.reportText.value,/<script>untrusted/);assert.equal(b.reportDetails.hidden,false);
 selection.id='two';b.refreshReport();assert.equal(b.reportDetails.hidden,true);assert.equal(b.reportText.value,'');
 selection.id='one';selection.topic='Different event';b.refreshReport();assert.equal(b.reportDetails.hidden,true);
 selection.topic='Tornado 1989';b.refreshReport();assert.match(b.reportText.value,/Tornado 1989/);
});
test('storage failure retains copyable report and tells user it was not saved',()=>{
 const selection={topic:'Event 1989'},ui=mount({getItem:()=>null,setItem:()=>{throw Error('full');}},selection);
 ui.saveReport({topic:selection.topic},ui.reportKey());
 assert.equal(ui.reportDetails.hidden,false);assert.match(ui.reportText.value,/could not be saved/);
});

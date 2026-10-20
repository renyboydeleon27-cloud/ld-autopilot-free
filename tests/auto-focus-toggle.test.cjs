const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../ner-auto-focus.js');
function setup(value){
 const storage=new Map(value===undefined?[]:[[A.KEY,value]]);let writes=0;
 globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem(key,val){storage.set(key,val);writes++;}};
 return {storage,get writes(){return writes;}};
}
test('Auto Screen Focus defaults OFF and does not auto-scroll',()=>{
 const f=setup();let calls=0;
 const el={scrollIntoView(){calls++;}};
 assert.equal(A.enabled(),false);
 assert.equal(A.scrollTo(el,{behavior:'smooth'}),false);
 assert.equal(calls,0);
 assert.equal(f.writes,0,'read-only setting cannot write project storage');
});
test('ON/OFF changes only its own preference, persists across preference reads',()=>{
 const f=setup();
 const project='ld-autopilot-free-v1',audit='ner-core5-audit-journal';
 f.storage.set(project,'APPROVED_P3');f.storage.set(audit,'P3-JOURNAL');
 assert.equal(A.setEnabled(true),true);
 assert.equal(A.enabled(),true);
 const opts={behavior:'smooth'};let seen=null;
 assert.equal(A.scrollTo({scrollIntoView(arg){seen=arg;}},opts),true);
 assert.deepEqual(seen,opts);
 assert.equal(f.storage.get(A.KEY),'on');
 assert.equal(A.setEnabled(false),false);
 assert.equal(A.enabled(),false);
 assert.equal(f.storage.get(A.KEY),'off');
 assert.equal(f.storage.get(project),'APPROVED_P3');
 assert.equal(f.storage.get(audit),'P3-JOURNAL');
});
test('a reload with previously enabled preference restores ON only when user selected it',()=>{
 setup('on');assert.equal(A.enabled(),true);
 setup('off');assert.equal(A.enabled(),false);
});
test('manual stage navigation is not rewritten by the preference',()=>{
 const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
 assert.match(source,/function scrollToCard\(card\).*?card\.scrollIntoView/s);
 const smart=fs.readFileSync(path.join(__dirname,'..','smart-continue.js'),'utf8');
 assert.match(smart,/function restoreCurrentPanelViewport\(options=\{\}\)\{\s*clearTimeout\(viewportRestoreTimer\);\s*\/\/.*?\n\s*if\(!window\.NERAutoFocus\?\.enabled\(\)\)return;/s);
 assert.doesNotMatch(smart,/\.scrollIntoView\(/);
 assert.match(smart,/NERAutoFocus\?\.mount/);
});

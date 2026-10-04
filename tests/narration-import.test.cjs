const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const api=require('../narration-import.js');
const script=Array.from({length:14},(_,i)=>`P${i+1}: Sentence ${i+1}.`).join('\n\n');
test('maps all panels, preserves wording and adds locked ending without narration for silent hook',()=>{
 const p=api.parse(script,{silentHook:true});assert.equal(Object.keys(p).length,16);assert.equal(p.HOOK,'');assert.equal(p.P14,'Sentence 14.');assert.equal(p.ENDING,api.ENDING);
 assert.equal(api.parse('HOOK: Spoken hook.\n'+script).HOOK,'Spoken hook.');
});
test('rejects missing, duplicate and unsupported panels before import',()=>{
 for(const text of [script.replace('P4: Sentence 4.',''),script+'\nP3: Duplicate.',script+'\nP15: Extra.','TITLE\n'+script])assert.throws(()=>api.parse(text,{silentHook:true}));
});
test('enforces hook and ending locks',()=>{
 assert.throws(()=>api.parse('HOOK: Spoken.\n'+script,{silentHook:true}));
 assert.throws(()=>api.parse(script));
 assert.equal(api.parse(script+'\nENDING: Different CTA.',{silentHook:true}).ENDING,api.ENDING);
 assert.equal(api.parse('HOOK: [SILENT]\n'+script,{silentHook:true}).HOOK,'');
});
test('supports fenced multiline text without rewriting content',()=>{
 const p=api.parse('```text\n'+script.replace('P1: Sentence 1.','P1:\nSentence 1.\nA second line.')+'\n```',{silentHook:true});
 assert.equal(p.P1,'Sentence 1. A second line.');
});
function harness(){
 const source=fs.readFileSync('narration-smart-continue.js','utf8');
 const code=source.slice(source.indexOf('  const importBox='),source.indexOf('  function fullNarrationText(){'));
 let title='Test event',approved=false,backups=0;const values={};const events={};
 const element=()=>({style:{},setAttribute(){},append(){},addEventListener(k,fn){this[k]=fn;}});
 const c={document:{createElement:element},controls:{insertBefore(){}},window:{LDNarrationImport:api,addEventListener(k,f){events[k]=f;},dispatchEvent(){}},btn:{disabled:false,dataset:{}},topic:()=>title,format:()=> 'shorts',projectKey:()=>title,hookIsSilent:()=>true,stageCard:s=>({stage:s,querySelector:()=>({})}),narrationSignature:()=>JSON.stringify(values),saveBackup:()=>{backups++;},clearApproval:()=>{approved=false;},setNarration:(card,text)=>{values[card.stage]=text;},approveNarration:()=>{approved=true;return true;},restoreBackup(){},undo:{classList:{remove(){}}},refreshApprovalUi(){},CustomEvent:function(){},fetch(){throw Error('Import must not call API');}};
 vm.createContext(c);vm.runInContext(code+';globalThis.ui={importInput,approveImport,importMessage};',c);
 return {ui:c.ui,values,changeTopic:()=>{title='Other';},approved:()=>approved,backups:()=>backups};
}
test('one OK distributes every panel, approves and uses no API',()=>{
 const h=harness();h.ui.importInput.value=script;assert.deepEqual(h.values,{});
 h.ui.approveImport.click();assert.equal(h.values.P1,'Sentence 1.');assert.equal(h.values.P14,'Sentence 14.');assert.equal(h.values.HOOK,'');assert.equal(h.values.ENDING,api.ENDING);assert.equal(h.approved(),true);assert.equal(h.backups(),1);
});
test('invalid paste makes no changes and cannot approve',()=>{
 const h=harness();h.ui.importInput.value='P1: Incomplete.';h.ui.approveImport.click();assert.deepEqual(h.values,{});assert.equal(h.approved(),false);assert.equal(h.backups(),0);assert.match(h.ui.importMessage.textContent,/Missing narration/);
});

test('one OK accepts alternate ending wording and strips ending production notes',()=>{
 for(const ending of ['Thank you for watching. Like, share and subscribe.', '[NO NARRATION]', '', api.ENDING]){
  const h=harness();h.ui.importInput.value=script+'\nENDING: '+ending;
  h.ui.approveImport.click();
  assert.equal(h.approved(),true);assert.equal(h.values.ENDING,api.ENDING);
  assert.equal(h.values.P14,'Sentence 14.');assert.match(h.ui.importMessage.textContent,/Standard channel ending applied/);
 }
});
test('alternate ending does not bypass missing panel validation',()=>{
 const h=harness();h.ui.importInput.value=script.replace('P8: Sentence 8.','')+'\nENDING: Thanks.';
 h.ui.approveImport.click();assert.equal(h.approved(),false);assert.equal(h.backups(),0);
 assert.deepEqual(h.values,{});assert.match(h.ui.importMessage.textContent,/Missing narration: P8/);
});

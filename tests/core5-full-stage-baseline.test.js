/* Offline full-stage compatibility: no paid providers, no user project mutation. */
'use strict';
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const vm=require('node:vm');
const core=require('../ner-core-5.js');
const source=cp.execFileSync('git',['show','origin/main:ner-core-5.js'],{encoding:'utf8'});
const ctx={module:{exports:{}},exports:{}};
vm.runInNewContext(source,ctx,{filename:'main-ner-core-5.js'});
const oldCore=ctx.module.exports;
const stages=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
const examples=[
 ['Aberfan Disaster — Wales — 1966',1966,'Aberfan, Wales','Coal waste rose above the Welsh village before the disaster.'],
 ['Halabja Chemical Attack — Iraq — 1988',1988,'Halabja, Iraq','Residents faced the devastating aftermath of the chemical attack.'],
 ['Wellington Avalanche — Washington — 1910',1910,'Wellington, Washington, USA','Heavy snow gathered around the mountain rail line.']
];
let compared=0,compiled=0;
for(const [topic,eventYear,location,narration] of examples){
 for(const stage of stages){
  const args={topic,eventYear,location,stage,narration,facts:[]};
  const old=oldCore.plan(args),now=core.plan(args);
  assert.equal(core.stable(now),oldCore.stable(old),topic+' '+stage+' StageSpec preserved');
  const before=oldCore.validate(old),after=core.validate(now);
  assert.equal(after.ok,before.ok,topic+' '+stage+' validation outcome preserved');
  assert.equal(JSON.stringify(after.issues),JSON.stringify(before.issues),topic+' '+stage+' validation reasons preserved');
  if(after.ok){
   const compiledNow=core.compile(now),compiledBefore=oldCore.compile(old);
   const added=compiledNow.split('\n').filter(line=>line.startsWith('FACE REACTION & NATURAL MOVEMENT: '));
   assert.equal(added.length,1,topic+' '+stage+' exactly one face-reaction lock');
   assert.match(added[0],/natural blinking, breathing/);
   assert.match(added[0],/No exaggerated anime reaction faces/);
   assert.equal(compiledNow.replace('\n\n'+added[0],''),compiledBefore,topic+' '+stage+' unchanged prompt apart from explicit face-reaction lock');
   assert.equal(core.validatePayload(core.payload(now)).ok,true,topic+' '+stage+' payload');
   compiled++;
  }
  compared++;
 }
}
assert.equal(compared,48);
console.log('Core 5 full-stage baseline preservation passed: '+compared+' stages compared, '+compiled+' valid prompts compiled. Generated fixtures only; user backups not inspected.');

const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const policy=require('../public-health-policy.js');
function harness(topic){
 const source=fs.readFileSync('video-modes.js','utf8');
 const end=source.indexOf('\n',source.indexOf('window.LDVideoModes='));
 const nodes={projectTitle:{textContent:topic},format:{value:'shorts'}};
 const c={window:{LDPublicHealthPolicy:policy,ldProjectLocks:{visualStyle:'anime',colorMode:'bw'},ldVideoContinuity:{year:'2020',location:'Philadelphia'}},document:{getElementById:k=>nodes[k],querySelector:()=>null,querySelectorAll:()=>[]},localStorage:{getItem:()=>null},setTimeout(){}};
 vm.createContext(c);vm.runInContext(source.slice(0,end)+'\n})();',c);return c.window.LDVideoModes;
}
test('all fourteen public-health panels use coherent quiet audio, motion and camera rules',()=>{
 const api=harness('Xylazine Crisis — Philadelphia — 2020');
 for(let i=1;i<=14;i++){
  const stage='P'+i,text=api.lock()+'\n'+api.cinematicMasterLock(stage,false)+'\n'+api.progressionLock(stage,null);
  assert.deepEqual(policy.issues('Xylazine',text),[]);
  assert.match(text,/Quiet scene-specific ambience/);assert.match(text,/No generic disaster debris/);
  assert.ok(api.qualityPromptCompatible(text));assert.ok(api.antiClonePromptCompatible(text));
 }
});
test('natural-disaster impact rules remain available',()=>{
 const api=harness('Earthquake — Test — 1900');
 assert.match(api.audioDirector('P6'),/powerful hazard sound/);
 assert.match(api.cinematicMasterLock('P6',false),/PEAK PRIMARY IMPACT/);
 assert.deepEqual(policy.issues('Earthquake','PEAK PRIMARY IMPACT'),[]);
});
test('narration content determines scene group instead of panel number',()=>{
 assert.equal(policy.beat('Xylazine use is associated with severe skin wounds.'),7);
 assert.equal(policy.beat('Xylazine can slow the heart and suppress breathing.'),6);
 assert.equal(policy.beat('People might not know xylazine was present.'),3);
});
test('known contradictory templates are caught without network access',()=>{
 for(const text of ['rising environmental pressure','PEAK PRIMARY IMPACT','P1 returns to normal life before the event','The prior panel P1 used relief interior and structural damage.','Wind builds before objects accelerate'])assert.ok(policy.issues('Xylazine',text).length);
});
test('paid audit is not called when local conflict check fails',async()=>{
 const src=fs.readFileSync('smart-continue.js','utf8');
 const code=src.slice(src.indexOf('async function audit(payload){'),src.indexOf('function removeMotionPositionContradictions'));
 let calls=0;const ctx={window:{LDPublicHealthPolicy:policy},fetchWithTimeout:()=>{calls++;throw Error('unexpected network');}};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 await assert.rejects(ctx.audit({topic:'Xylazine',currentPrompt:'rising environmental pressure'}),/no audit credits used/);
 assert.equal(calls,0);
});

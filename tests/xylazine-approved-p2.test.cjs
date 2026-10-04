const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('video-modes.js','utf8');
function harness(){
 const c={current:()=> 'Xylazine Crisis — Philadelphia — 2020',style:()=> 'anime',colorMode:()=> 'bw',format:()=> 'shorts',absoluteStyleLock:()=> '2D ANIME ONLY'};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('function approvedXylazineP2('),src.indexOf('function build(card){')),c);
 const fields={'.narration':{value:'Used in veterinary medicine to sedate animals.'},'.video-scene':{value:'Old scene'}};
 const card={dataset:{stage:'P2'},querySelector:k=>fields[k]};return {c,card,fields};
}
test('approved scene is scoped to the matching narration, topic and selected visual mode',()=>{
 const {c,card,fields}=harness();assert.equal(c.approvedXylazineP2(card),true);
 card.dataset.stage='P3';assert.equal(c.approvedXylazineP2(card),false);card.dataset.stage='P2';
 c.style=()=> 'real';assert.equal(c.approvedXylazineP2(card),false);c.style=()=> 'anime';
 fields['.narration'].value='Wound care response.';assert.equal(c.approvedXylazineP2(card),false);
});
test('build updates scene and supplies a complete prompt without invented P1 damage',()=>{
 const {c,card,fields}=harness();const text=c.xylazineP2Prompt(card);
 for(const label of ['PANEL SCENE:','TIMING:','CAMERA:','PHYSICS AND TIME:','AUDIO:','NEGATIVE:','ENVIRONMENT BIBLE — SHARED PHYSICAL WORLD:','EPISODE CANON — CONTINUITY ENGINE:'])assert.ok(text.includes(label),label);
 assert.equal(card.dataset.videoScene,fields['.video-scene'].value);
 assert.ok(text.includes('Camera parallax only'));assert.ok(text.includes('No people or animals'));
 assert.ok(!text.includes('prior panel P1 used relief interior'));assert.ok(!text.includes('Wind builds before'));
 assert.equal(card.dataset.approvalCommitted,undefined);
});

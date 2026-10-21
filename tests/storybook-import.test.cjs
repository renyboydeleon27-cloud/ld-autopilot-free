/* Director Story Book — no-cost validation and native-state preservation gates. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../ner-storybook-import.js'),'utf8');
const fake={NERCore5:{metadata:()=>({year:2011,location:'Tōhoku, Japan'})},LDProjectLocks:{visualStyle:()=> 'anime',colorMode:()=> 'bw'}};
const moduleObject={exports:{}};
vm.runInNewContext(code,{window:fake,globalThis:fake,module:moduleObject,TextEncoder,console},{filename:'ner-storybook-import.js'});
const api=moduleObject.exports;
const cards=Array.from({length:14},(_,i)=>({dataset:{stage:'P'+(i+1),approvalCommitted:i<4?'1':'0'},querySelector:()=>({checked:i<4})}));
const ctx={topic:'2011 Tōhoku Earthquake and Tsunami',format:'shorts',year:2011,cards,projectId:'demo',identity:'demo'};
const prompt='VIDEO PROMPT — EXACTLY 10 SECONDS. True black-and-white grayscale. 2D historical hand-drawn anime. Vertical 9:16. One continuous shot. 2011 Japanese coastline. Natural stable camera movement with grounded feet, visible gravity, believable time progression, consistent identities and clothing, no cuts, speech, additional characters, subtitles, music, CGI, or teleportation. The main action completes with an organic transition hold and a realistic remaining physical response.';
function p(n){
 return {stage:'P'+n,narration:'Along the coast, local residents hurried toward higher ground as warnings spread.',
  videoPrompt:prompt,direction:{historicalBeat:'Chronological part of the 2011 Tōhoku event',location:'Residential school evacuation route '+n,cast:'Two ordinary Japanese residents',action:'Both characters move toward safe higher ground',camera:'Slow tracking from behind the characters',emotion:'Concern',
   timeline:{s0to2:'Establish already moving characters',s2to8:'Continue motivated action with gravity',s8to10:'Keep natural movement into next scene'},transitionOut:'Natural continuity handle for transition',continuityAndFailures:'No camera reversals, morphing, early cut, or animated reset'},
  promptReview:{grade:9.2,note:'Cinematography and historical continuity reviewed',directorReviewed:true}};
}
function book(){return {schemaVersion:'ner.storybook.v1',bookId:'tohoku-directors-test',revision:1,createdAt:'2026-10-21T10:00:00Z',
 project:{topic:ctx.topic,eventYear:2011,location:'Tōhoku, Japan',format:'shorts',videoMode:'text',visualStyle:'anime',colorMode:'bw',aspectRatio:'9:16'},
 globalDirection:{panelDurationSeconds:10,narrationTargetSeconds:8,transitionHandleSeconds:2,manualStages:['HOOK','ENDING','THUMBNAIL']},
 panels:Array.from({length:14},(_,i)=>p(i+1))};}
function valid(b){return api.validate(b,ctx);}
test('accepts a complete director-reviewed, exact 14-panel source',()=>{const r=valid(book());assert.equal(r.ok,true,r.errors.join('; '));assert.equal(r.panels.length,14);assert.equal(r.panels.filter(x=>x.protectedNative).length,4);});
test('does not mutate any existing panel or its approval status during validation',()=>{const before=JSON.stringify(cards);valid(book());assert.equal(JSON.stringify(cards),before);});
test('rejects incomplete, duplicate, and imported manual stages',()=>{
 const a=book();a.panels.pop();assert.equal(valid(a).ok,false);
 const b=book();b.panels[13].stage='P1';assert.equal(valid(b).ok,false);
 const c=book();c.panels[13].stage='HOOK';assert.equal(valid(c).ok,false);
});
test('rejects mismatched topic, year, mode and manual ending',()=>{
 const a=book();a.project.topic='Another disaster — 2011';assert.equal(valid(a).ok,false);
 const b=book();b.project.eventYear=2012;assert.equal(valid(b).ok,false);
 const c=book();c.project.videoMode='image';assert.equal(valid(c).ok,false);
 const d=book();d.globalDirection.manualStages=['HOOK','ENDING','P14'];assert.equal(valid(d).ok,false);
});
test('requires director grade 9.0+, usable exact prompt and 10/8/2 timing',()=>{
 const a=book();a.panels[3].promptReview.grade=8.5;assert.equal(valid(a).ok,false);
 const b=book();b.panels[7].videoPrompt=b.panels[7].videoPrompt.replace('10 SECONDS','15 SECONDS');assert.equal(valid(b).ok,false);
 const c=book();c.globalDirection.narrationTargetSeconds=10;assert.equal(valid(c).ok,false);
});
test('blocks injected unrecognized fields and refuses invalid narration',()=>{
 const a=book();a.panels[2].untrustedChange=true;assert.equal(valid(a).ok,false);
 const b=book();b.panels[5].narration='';assert.equal(valid(b).ok,false);
 const c=book();c.hook={scene:'must never write HOOK'};assert.equal(valid(c).ok,false);
});
test('can reparse exported workspace without treating reviews as panel instructions',()=>{
 const original=book(),exported=api.exportWorkspace({book:original,reviews:{P5:{status:'rejected'}},history:[]});
 assert.equal(JSON.stringify(api.parse(exported).book),JSON.stringify(original));
 assert.equal(api.parse(exported).exportFormat,'ner.storybook.workspace.v1');
});
test('prevents wrong project being treated as matching based on case-insensitive superficial text',()=>{
 const a=book(),c={...ctx,topic:'2011 Japanese coastal disaster but a different one'};
 assert.equal(api.validate(a,c).ok,false);
});
console.log('Story Book schema and approved-panel read-only gates loaded.');

test('exported workspace retains review records for round-trip restore',()=>{
 const original=book(),clip=original.panels[4].videoPrompt;
 const record={book:original,reviews:{P5:{status:'rejected',grade:7.8,filename:'1000273755.mp4',reason:'camera-reset',note:'Camera-facing finish observed',promptRevision:1,prompt:clip,reviewedAt:'2026-10-21T14:00:00Z'}},history:[]};
 const backup=api.parse(api.exportWorkspace(record));
 assert.equal(api.backupFromFile(backup).reviews.P5.prompt,clip);
 assert.equal(api.backupFromFile(backup).reviews.P5.grade,7.8);
 assert.equal(valid(backup.book).ok,true);
});
test('corrupted workspace records cannot silently restore as approved',()=>{
 const a=book(), backup=api.parse(api.exportWorkspace({book:a,reviews:{},history:[]}));
 backup.reviews.P5={status:'approved',grade:10,filename:'foo.mp4',reason:'',note:'invented',promptRevision:1,prompt:'WRONG',reviewedAt:'2026-10-21T14:00:00Z'};
 assert.throws(()=>api.backupFromFile(backup),/does not match/);
});

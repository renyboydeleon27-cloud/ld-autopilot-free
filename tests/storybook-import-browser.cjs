/* Actual Android-sized browser: Story Book stays separate from the old project. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..');
const prompt='VIDEO PROMPT — EXACTLY 10 SECONDS. Strict black-and-white grayscale. Hand-drawn 2D historical anime only. Portrait 9:16. One continuous shot. Historical Japan earthquake scene accurately follows the original event timeline. Camera movement stays grounded and motivated from start to finish, every footstep transfers weight correctly to the sloping road, no character morphing or teleporting. Natural character reaction, practical clothing and geographically correct coastal neighborhood. No cuts, voice, narration, text, subtitles, music, reset or CGI.';
const topic='2011 Tōhoku Earthquake and Tsunami';
const book={schemaVersion:'ner.storybook.v1',bookId:'tohoku-directors-browser',revision:1,createdAt:'2026-10-21T10:00:00Z',
 project:{topic,eventYear:2011,location:'Tōhoku, Japan',format:'shorts',videoMode:'text',visualStyle:'anime',colorMode:'bw',aspectRatio:'9:16'},
 globalDirection:{panelDurationSeconds:10,narrationTargetSeconds:8,transitionHandleSeconds:2,manualStages:['HOOK','ENDING','THUMBNAIL']},
 panels:Array.from({length:14},(_,i)=>({stage:'P'+(i+1),narration:'The coast was changing, and people hurried toward safer ground together.',
 videoPrompt:prompt+' Stage '+(i+1)+': clearly motivated motion away from disaster.',
 direction:{historicalBeat:'Historical Tōhoku event sequence and verified chronology',location:'Period-correct Japan location scene '+(i+1),cast:'Two real-looking Japanese adults',action:'Coherent period-correct environmental motion and response',camera:'One tracking angle behind the cast',emotion:'Urgency',timeline:{s0to2:'Establish plausible action',s2to8:'Complete core action naturally',s8to10:'Usable transition continuation'},transitionOut:'Hold natural movement for transition',continuityAndFailures:'Keep cast, physics, geography, and camera continuity'},
 promptReview:{grade:9.3,note:'Director-reviewed action and camera coherence',directorReviewed:true}}))};
(async()=>{
 let requests=0;const server=http.createServer((req,res)=>{
  const file=new URL(req.url,'http://localhost').pathname;
  if(file==='/seed.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Seed storage</title>');return;}
  if(file.startsWith('/api/')){requests++;res.writeHead(500).end('Denied by test');return;}
  try{const actual=file==='/'?path.join(root,'index.html'):path.resolve(root,'.'+file);if(!actual.startsWith(root+path.sep))throw Error('forbidden');
   res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');
   res.end(fs.readFileSync(actual));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let browser;try{
  let launch={headless:true};if(process.env.CORE5_CHROMIUM_MODULE){const m=await import(process.env.CORE5_CHROMIUM_MODULE),c=m.default||m;launch={...launch,executablePath:await c.executablePath(),args:c.args};}
  browser=await chromium.launch(launch);const context=await browser.newContext({viewport:{width:393,height:851},serviceWorkers:'block',acceptDownloads:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto(origin+'/seed.html');
  const seed={topic,format:'shorts',category:'disaster',narrativeFormat:'original',videoContinuity:{year:'2011',location:'Tōhoku, Japan'},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{}};
  for(const st of ['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING','THUMBNAIL'])
   seed.stages[st]={narration:'Original '+st+' never replace',imagePrompt:'old image '+st,flowPrompt:'old flow '+st,done:/^P[1-4]$/.test(st),approvalCommitted:/^P[1-4]$/.test(st),videoMode:'text',textVideoPrompt:'old exact '+st,videoScene:'old scene '+st};
  seed.stages.P5.core5Record='{"status":"AUDITED","old":"journal must survive"}';
  await page.evaluate(s=>{localStorage.setItem('ld-autopilot-free-v1',JSON.stringify(s));localStorage.setItem('ld-autopilot-free-active-project','tohoku-storybook-test');},seed);
  await page.goto(origin);try{await page.waitForFunction(()=>window.LDCore&&window.NERStoryBook&&document.querySelector('#nerBookBox'),null,{timeout:7000});}
  catch(e){const state=await page.evaluate(()=>({ready:document.readyState,core:!!window.LDCore,storybook:!!window.NERStoryBook,box:!!document.getElementById('nerBookBox'),sample:document.body.innerText.slice(0,800)}));throw Error('Story Book boot diagnostic: '+JSON.stringify({state,errors}));}
  await page.locator('#nerBookBox > summary').click();
  await page.locator('#nerBookFile').setInputFiles({name:'TOHOKU_STORY_BOOK.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(book))});
  await page.waitForFunction(()=>!document.getElementById('nerBookDistribute').disabled);
  assert((await page.locator('#nerBookPreview').innerText()).includes('P14'));
  await page.waitForTimeout(500);
  const before=await page.evaluate(()=>LDCore.collectState());
  await page.locator('#nerBookDistribute').click();
  await page.waitForFunction(async()=>{try{return (await NERStoryBook.read())?.book?.panels?.length===14;}catch{return false;}});
  const after=await page.evaluate(()=>LDCore.collectState());
  for(const s of ['P1','P2','P3','P4'])for(const key of Object.keys(before.stages[s]))assert.equal(after.stages[s][key],before.stages[s][key],s+' native '+key);
  assert.equal(after.stages.P5.core5Record,before.stages.P5.core5Record,'P5 existing paid audit record preserved');
  for(const s of ['HOOK','ENDING','THUMBNAIL'])for(const key of Object.keys(before.stages[s]))assert.equal(after.stages[s][key],before.stages[s][key],s+' manually controlled '+key);
  const p5=page.locator('.stage-card[data-stage="P5"] .ner-storybook-stage');
  assert.equal(await p5.count(),1);
  assert.equal(await p5.locator('textarea').nth(1).inputValue(),book.panels[4].videoPrompt);
  await page.locator('.stage-card[data-stage="P5"] .collapse-btn').click();
  // Native stage cards are collapsed by default. Open the stage before clicking its imported overlay.
  await page.locator('.stage-card[data-stage="P5"] .collapse-btn').click();
  await p5.locator('summary').click();
  await p5.locator('select').first().selectOption('rejected');
  await p5.locator('input[type="text"]').fill('1000273755.mp4');
  await p5.locator('input[type="number"]').fill('7.8');
  await p5.locator('textarea').last().fill('Observed reversal and face-to-camera drift in actual render.');
  await p5.locator('select').last().selectOption('camera-reset');
  await p5.getByRole('button',{name:'Save actual video review · FREE'}).click();
  await page.waitForFunction(async()=>{const s=await NERStoryBook.read();return s?.reviews?.P5?.status==='rejected';});
  const exportPromise=page.waitForEvent('download');await page.locator('#nerBookBox').getByRole('button',{name:'EXPORT STORY BOOK'}).click();
  const dl=await exportPromise;assert(dl.suggestedFilename().includes('workspace'));
  await page.reload();await page.waitForFunction(()=>window.NERStoryBook&&document.querySelector('.stage-card[data-stage="P5"] .ner-storybook-stage'));
  const saved=await page.evaluate(async()=>NERStoryBook.read());
  assert.equal(saved.book.bookId,book.bookId);assert.equal(saved.reviews.P5.filename,'1000273755.mp4');
  assert.equal((await page.evaluate(()=>LDCore.collectState())).stages.P1.narration,before.stages.P1.narration);
  assert.equal(requests,0,'Story Book workflow must not call paid APIs');assert.deepEqual(errors,[],'No browser runtime errors');
  console.log('PASS Story Book: 14-panel JSON upload, preview, guarded atomic distribution, original P1–P4/P5/manual preservation, clip review, export, reload, zero API requests.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

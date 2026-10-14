const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..');
const deadline=setTimeout(()=>{console.error('Browser regression timed out');process.exit(1);},180000);deadline.unref();
(async()=>{
 const server=http.createServer((req,res)=>{let p=path.join(root,new URL(req.url,'http://localhost').pathname);if(p.endsWith('/'))p+='index.html';if(!p.startsWith(root+'/')){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let launch={headless:true};if(process.env.CORE5_CHROMIUM_MODULE){const mod=await import(process.env.CORE5_CHROMIUM_MODULE);const portable=mod.default||mod;launch={...launch,executablePath:await portable.executablePath(),args:portable.args};}let browser;try{browser=await chromium.launch(launch);}catch(e){server.close();throw e;}const ctx=await browser.newContext({serviceWorkers:'block'});let calls=[],errors=[];
 await ctx.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(u.origin!==origin)return route.abort();if(u.pathname.startsWith('/api/')){calls.push({url:u.pathname,body:req.postDataJSON()});return route.fulfill({json:{ok:true,result:'PASS',issues:[],summary:'Mock local test'}});}return route.continue();});
 await ctx.addInitScript(()=>{window.__copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied.push(text);},readText:async()=>window.__copied.at(-1)}});});
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto(origin);await page.waitForFunction(()=>window.LDSmartContinue&&window.NERCore5Runtime);

 const stages=['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING'];
 const fixture=require('./fixtures/great-smog.json'),C=require('../ner-core-5.js');
 const seed={topic:fixture.topic,format:'shorts',category:'disaster',narrativeFormat:'original',videoContinuity:{},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{}};
 stages.forEach(st=>seed.stages[st]={narration:'',videoMode:'text',done:false});
 seed.stages.P1.videoScene='SCENE BANK — old generic plaza with missing region';
 await page.evaluate(s=>{localStorage.setItem('ld-autopilot-free-active-project','core5-episode-regression');window.LDCore.loadProductionState(s);},seed);
 assert.equal(await page.evaluate(()=>{try{window.NERCore5Runtime.prepareEpisode();return false;}catch{return ![...document.querySelectorAll('.stage-card')].some(c=>c.dataset.core5Spec);}}),true,'invalid incomplete episode causes no partial writes');
 const input=page.locator('#ldNarrationStageZero textarea[aria-label="Paste full narration"]');
 await input.locator('..').locator('summary').click();
 await input.fill(stages.map((st,i)=>st+': '+fixture.narrations[i]).join('\n\n'));
 await input.locator('..').getByRole('button',{name:'OK',exact:true}).click();
 assert(await page.evaluate(()=>window.LDNarrationApproval.isApproved()),'paste narration approved');
 await page.locator('.core5-plan-episode').click();
 assert.equal(calls.length,0,'episode preparation free');
 const planned=await page.evaluate(()=>{const R=window.NERCore5Runtime;return [...document.querySelectorAll('.stage-card')].filter(R.manages).map(c=>({stage:c.dataset.stage,preflight:R.preflight(c),legacy:c.dataset.core5LegacyScene}));});
 assert.equal(planned.length,16);for(const p of planned)assert(p.preflight.ok,p.stage+JSON.stringify(p.preflight.issues));
 assert.match(planned.find(p=>p.stage==='P1').legacy,/old generic plaza/);
 assert.equal(planned.find(p=>p.stage==='P13').preflight.spec.chronology.sceneYear,1956);
 assert.equal(planned.find(p=>p.stage==='P14').preflight.spec.chronology.sceneYear,null);
 const snapshots={};
 await page.evaluate(()=>window.LDSmartContinue.run());
 for(let i=0;i<stages.length;i++){
  const st=stages[i];assert.equal(calls.length,i+1,st+' one mock audit');
  const data=await page.evaluate(st=>{const c=document.querySelector('.stage-card[data-stage="'+st+'"]');return {ready:window.NERCore5Runtime.ready(c),record:JSON.parse(c.dataset.core5Record),spec:JSON.parse(c.dataset.core5Spec),copied:window.__copied.at(-1)};},st);
  const expectedRoles=['hook','normal-world','cause-context','cause-context','onset','human-impact','human-impact','human-impact','human-impact','human-toll','aftermath','human-toll','accountability','accountability','legacy','ending'];
  assert.equal(data.spec.role,expectedRoles[i],st+' semantic role');
  assert(C.validatePayload(calls[i].body).ok,st+' canonical request');assert(data.ready,st+' ready');
  const before=JSON.stringify(data.record);await page.evaluate(()=>window.NERCore5Runtime.prepareEpisode());
  assert.equal(await page.evaluate(st=>document.querySelector('.stage-card[data-stage="'+st+'"]').dataset.core5Record,st),before,st+' preparation retains audited record');assert.equal(data.copied,calls[i].body.currentPrompt,st+' copied audited bytes');
  assert.equal(data.record.prompt,calls[i].body.currentPrompt);snapshots[st]=data;
  await page.evaluate(st=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="'+st+'"]')),st);
  assert.equal(calls.length,i+1,st+' repeat uses same audit');
  await page.evaluate(()=>window.LDSmartContinue.run());
  const saved=await page.evaluate(()=>window.LDCore.collectState().stages);
  for(const doneStage of stages.slice(0,i+1)){assert(saved[doneStage].done,doneStage+' approval remains');assert.equal(JSON.parse(saved[doneStage].core5Record).prompt,snapshots[doneStage].record.prompt,doneStage+' frozen bytes');}
 }
 await page.evaluate(()=>window.LDCore.saveCurrent());await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.stage-card[data-stage="ENDING"]')?.querySelector('.done-toggle')?.checked);
 const after=await page.evaluate(()=>window.LDCore.collectState().stages);
 for(const st of stages){assert(after[st].done,st+' remains approved after reload');assert.equal(JSON.parse(after[st].core5Record).prompt,snapshots[st].record.prompt);}
 assert.equal(calls.length,16);assert.deepEqual(errors,[]);
 const report={result:'PASS',project:'full Great Smog narration imported; one free preparation; no per-panel manual edits',stages:16,mockedAuditRequests:calls.length,paidRequests:0,pageErrors:errors,checks:['one episode preparation button','Smart Continue HOOK through ENDING','one audit per panel','repeat audit reuse','copied/audited/approved bytes','approved persistence after reload'],sceneReview:Object.fromEntries(Object.entries(snapshots).map(([k,v])=>[k,{role:v.spec.role,chronology:v.spec.chronology,setting:v.spec.location.setting,action:v.spec.action,camera:v.spec.camera}]))};
 console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});

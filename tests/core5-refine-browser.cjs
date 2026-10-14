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


 const seed={topic:'The Great Smog of London (1952): how deadly air pollution engulfed London and led to the Clean Air Act of 1956.',format:'shorts',category:'disaster',narrativeFormat:'original',videoContinuity:{year:'1952'},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{P1:{narration:'London, December 1952. Winter tightened its grip, and families fed their coal fires, trying to keep the bitter cold outside.',videoMode:'text',videoScene:'SCENE BANK — unique panel setting: at an open plaza if present locally within 1952.',done:false}}};
 await page.evaluate(s=>{localStorage.setItem('ld-autopilot-free-active-project','core5-smog-regression');window.LDCore.loadProductionState(s);},seed);
 const card=page.locator('.stage-card[data-stage="P1"]');
 await card.locator('.stage-body').evaluate(el=>el.classList.remove('hidden'));
 await card.locator('.core5-review summary').click();
 assert.equal(await card.locator('[data-core5-field=region]').inputValue(),'London');
 assert.equal(await card.locator('[data-core5-field=eventYear]').inputValue(),'1952');
 const before=await page.evaluate(()=>window.NERCore5Runtime.preflight(document.querySelector('.stage-card[data-stage="P1"]')));
 assert(before.issues.some(x=>x.includes('KEEP CURRENT SCENE')));assert(!before.issues.some(x=>x.includes('source identity')||x.includes('location is missing')));assert.equal(calls.length,0);
 await page.evaluate(()=>{const R=window.NERCore5Runtime,c=document.querySelector('.stage-card[data-stage="P1"]'),s=window.NERCore5.clone(R.reviewSpec(c));delete s.choreography;s.timing=[{start:0,end:2,phase:'establish'},{start:2,end:6,phase:'action'},{start:6,end:10,phase:'hold'}];R.applyReview(c,s);R.build(c);});
 await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('ld-auto-smart-continue-session-v1:')){const s=JSON.parse(localStorage.getItem(k));s.targetStage='P1';localStorage.setItem(k,JSON.stringify(s));}});
 await page.evaluate(()=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="P1"]')));
 assert.equal(calls.length,1);assert.equal(calls[0].body.location,'London');assert.equal(calls[0].body.year,'1952');
 await page.evaluate(()=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="P1"]')));assert.equal(calls.length,1);
 const oldRecord=await card.evaluate(c=>c.dataset.core5Record);
 assert.match(await card.locator('.video-mode-status').textContent(),/audit passed/);
 await card.locator('.core5-refine-action').click();assert.equal(calls.length,1);
 assert.match(await card.locator('.core5-review [role="status"]').textContent(),/refined locally/);
 assert.equal(await card.evaluate(c=>window.NERCore5Runtime.ready(c)),false);
 assert.equal(await card.evaluate(c=>JSON.parse(c.dataset.core5SceneHistory).at(-1).record),oldRecord);
 assert.doesNotMatch(await card.locator('.video-mode-status').textContent(),/audit passed/);
 await page.evaluate(()=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="P1"]')));assert.equal(calls.length,2);
 assert.match(calls[1].body.currentPrompt,/Starting state:/);assert.match(calls[1].body.currentPrompt,/7–10s/);
 assert.match(await card.locator('.video-mode-status').textContent(),/audit passed/);
 await card.locator('.core5-refine-action').click();await page.evaluate(()=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="P1"]')));assert.equal(calls.length,2);
 const prompt=await page.evaluate(()=>{const c=document.querySelector('.stage-card[data-stage="P1"]');const p=window.NERCore5Runtime.approve(c);c.querySelector('.done-toggle').checked=true;window.LDCore.saveCurrent();return p;});
 await page.reload();await page.waitForFunction(()=>document.querySelector('.stage-card[data-stage="P1"]')?.querySelector('.done-toggle')?.checked);
 assert.equal(await page.evaluate(()=>window.NERCore5Runtime.preserve(document.querySelector('.stage-card[data-stage="P1"]'))),prompt);
 assert.equal(calls.length,2);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',checks:['existing audited draft retained until explicit refinement','free refinement UI','old record archived','new audit required','repeat refinement inert','accurate prompt status','approved reload byte equality'],mockAuditCalls:calls.length,paidCalls:0}));
 }finally{await browser.close();await new Promise(r=>server.close(r));clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});

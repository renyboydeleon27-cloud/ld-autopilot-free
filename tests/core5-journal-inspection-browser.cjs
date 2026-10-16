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
 await page.goto(origin);await page.waitForFunction(()=>window.LDSmartContinue&&window.NERCore5Runtime&&!document.querySelector('main').inert);



 const seed={topic:'The Great Smog of London — 1952',format:'shorts',category:'disaster',narrativeFormat:'original',videoContinuity:{year:'1952',location:'London, England'},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{P3:{narration:'Above the rooftops, warmer air trapped colder air below. With little wind, the smoke could no longer disperse into the sky.',videoMode:'text',done:false}}};
 // Model the actual production: completed HOOK/P1/P2 make P3 the persisted target.
 // Otherwise the delayed Smart Continue restore correctly reopens the empty HOOK
 // and closes P3 while the test is attempting its diagnostic click.
 for(const stage of ['HOOK','P1','P2'])seed.stages[stage]={done:true,approvalCommitted:true,videoMode:'text',narration:'Approved narration '+stage,imagePrompt:'Approved image '+stage,flowPrompt:'Approved flow '+stage,textVideoPrompt:'Approved exact prompt '+stage,videoScene:'Approved scene '+stage};
 await page.evaluate(s=>{localStorage.setItem("ld-autopilot-free-active-project","journal-inspection-test");window.LDCore.loadProductionState(s);const c=document.querySelector('[data-stage="P3"]');NERCore5Runtime.applyReview(c,NERCore5Runtime.reviewSpec(c));NERCore5Runtime.build(c);},seed);
 // Settle legacy production decorators before measuring a read-only journal action.
 await page.waitForTimeout(1600);
 const settled=await page.evaluate(()=>LDCore.collectState());
 for(const stage of ['HOOK','P1','P2'])for(const [field,value] of Object.entries(seed.stages[stage]))assert.deepEqual(settled.stages[stage][field],value,'approved '+stage+'.'+field);
 const card=page.locator('.stage-card[data-stage="P3"]');await card.locator('.stage-body').evaluate(e=>e.classList.remove('hidden'));await card.locator('.core5-review').evaluate(e=>e.open=true);
 const initial=await page.evaluate(async()=>{const c=document.querySelector('[data-stage="P3"]'),r=NERCore5Runtime,p=NERCore5.payload(r.spec(c));const d=await NERCore5AuditCoordinator.inspect(r.scope(),p);window.fixture={key:d.key,p};return {d,databases:await indexedDB.databases()};});
 assert.equal(initial.d.found,false);assert(!initial.databases.some(x=>x.name==='ner-core5-audit-journals'),'inspection must not create a DB');
 async function inspect(){await card.locator('.core5-check-audit').click();await page.waitForFunction(()=>!document.querySelector('[data-stage="P3"] .core5-check-audit').disabled);return card.locator('.core5-audit-diagnosis').textContent();}
 assert.match(await inspect(),/Journal found: NO/);
 await page.evaluate(()=>localStorage.setItem(fixture.key,JSON.stringify({schema:1,identity:NERCore5.stable(fixture.p),status:'UNCERTAIN'})));
 const legacyText=await inspect();assert.match(legacyText,/Storage source: legacy/);assert.match(legacyText,/Status: UNCERTAIN/);assert.match(legacyText,/Recoverable result: NO/);
 assert.equal(await page.evaluate(async()=> (await indexedDB.databases()).some(x=>x.name==='ner-core5-audit-journals')),false,'no diagnostic migration');
 // Matched legacy + IndexedDB interruption: cancel preserves both sources;
 // confirmed archive preserves the record and panel bytes without sending an API request.
 await page.evaluate(()=>NERCore5JournalStore.read(fixture.key));
 assert.match(await inspect(),/Storage source: legacy \+ IndexedDB/);
 const snapshot=await page.evaluate(()=>JSON.stringify(LDCore.collectState().stages));
 page.once('dialog',d=>d.dismiss());await card.locator('.core5-archive-journal').click();
 assert.match(await inspect(),/Status: UNCERTAIN/);
 // A failed archive transaction must retain both original copies.
 await page.evaluate(()=>{window.originalAdd=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(...args){const r=originalAdd.apply(this,args);this.transaction.abort();return r;};});
 page.once('dialog',d=>d.accept());await card.locator('.core5-archive-journal').click();
 await page.waitForFunction(()=>!document.querySelector('.core5-archive-journal').disabled);
 assert.doesNotMatch(await card.locator('.core5-audit-diagnosis').textContent(),/archived safely/);
 await page.evaluate(()=>IDBObjectStore.prototype.add=originalAdd);
 assert.match(await inspect(),/Storage source: legacy \+ IndexedDB/);
 // Simulate legacy removal failure after archive commit: the legacy guard must remain.
 await page.evaluate(()=>{window.originalRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k===fixture.key)throw Error('Simulated storage denial');return originalRemove.call(this,k);};});
 page.once('dialog',d=>d.accept());await card.locator('.core5-archive-journal').click();
 await page.waitForFunction(()=>document.querySelector('.core5-audit-diagnosis').textContent.includes('Simulated storage denial'));
 assert.equal(await page.evaluate(()=>JSON.stringify(LDCore.collectState().stages)),snapshot);
 assert.equal(await page.evaluate(()=>!!localStorage.getItem(fixture.key)),true);
 await page.evaluate(()=>Storage.prototype.removeItem=originalRemove);
 await inspect();page.once('dialog',d=>d.accept());await card.locator('.core5-archive-journal').click();
 await page.waitForFunction(()=>document.querySelector('.core5-audit-diagnosis').textContent.includes('archived safely'));
 assert.equal(await page.evaluate(()=>JSON.stringify(LDCore.collectState().stages)),snapshot);
 assert.equal(await page.evaluate(async()=>!!(await NERCore5JournalStore.inspect(fixture.key)).record),false);
 const archives=await page.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('ner-core5-audit-journals',1);q.onsuccess=()=>{const db=q.result,r=db.transaction('journals').objectStore('journals').getAll();r.onsuccess=()=>{resolve(r.result.filter(x=>x.kind==='explicit-incomplete-archive'));db.close();};r.onerror=reject;};}));
 assert(archives.length>=1);assert.equal(archives[0].record.status,'UNCERTAIN');assert(archives[0].legacyRaw);
 // A repeated recovery click cannot erase the next attempt or grant a second attempt.
 await page.evaluate(async()=>{window.mockCalls=0;const run=()=>NERCore5AuditCoordinator.run(NERCore5Runtime.scope(),fixture.p,async()=>{mockCalls++;return {ok:true,result:'PASS',issues:[]};});await Promise.all([run(),run()]);});
 assert.equal(await page.evaluate(()=>mockCalls),1);
 assert.equal(calls.length,0);

 await page.evaluate(()=>NERCore5JournalStore.save(fixture.key,{schema:1,identity:'different payload',status:'DONE',result:{ok:true,result:'PASS',issues:[]}}));
 assert.match(await inspect(),/Payload identity match: NO/);assert.equal(await card.locator('.core5-recover-journal').isVisible(),false);
 await page.evaluate(()=>localStorage.setItem(fixture.key,JSON.stringify({schema:1,identity:NERCore5.stable(fixture.p),status:'STARTED'})));
 assert.match(await inspect(),/Storage conflict: YES/);assert.equal(await card.locator('.core5-recover-journal').isVisible(),false);
 await page.evaluate(()=>localStorage.removeItem(fixture.key));
 await page.evaluate(()=>NERCore5JournalStore.save(fixture.key,{schema:1,identity:NERCore5.stable(fixture.p),status:'DONE',result:{ok:true,result:'PASS',issues:[]}}));
 const before=await page.evaluate(async()=>({journal:await NERCore5JournalStore.inspect(fixture.key),panel:document.querySelector('[data-stage="P3"]').dataset.core5Record||''}));
 assert.match(await inspect(),/Recoverable result: YES/);
 assert.deepEqual(await page.evaluate(async()=>({journal:await NERCore5JournalStore.inspect(fixture.key),panel:document.querySelector('[data-stage="P3"]').dataset.core5Record||''})),before);
 await card.locator('.core5-recover-journal').click();await page.waitForFunction(()=>NERCore5Runtime.ready(document.querySelector('[data-stage="P3"]')));
 assert.equal(await card.evaluate(c=>NERCore5Runtime.build(c)),await page.evaluate(()=>fixture.p.currentPrompt));
 await page.evaluate(()=>LDCore.saveCurrent());await page.reload();await page.waitForFunction(()=>window.NERCore5Runtime&&document.querySelector('[data-stage="P3"]'));

 assert.equal(await page.evaluate(()=>NERCore5Runtime.ready(document.querySelector('[data-stage="P3"]'))),true);
 assert.equal(calls.length,0);assert.deepEqual(errors,[]);
 console.log('PASS: actual IndexedDB/legacy journal diagnostics, no DB creation or migration, identity conflict, source conflict, free DONE recovery, exact prompt and reload readiness; zero API calls.');
 }finally{await browser.close();await new Promise(r=>server.close(r));clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});

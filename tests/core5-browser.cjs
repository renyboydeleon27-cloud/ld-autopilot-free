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
 const seed={topic:'Aberfan Disaster — Wales — 1966',format:'shorts',category:'disaster',narrativeFormat:'original',videoContinuity:{year:'1966',location:'Aberfan, Wales'},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{}};
 for(const st of ['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING','THUMBNAIL'])seed.stages[st]={narration:'Documented local context.',imagePrompt:'existing image',flowPrompt:'existing flow',videoMode:'text',done:!['P12','P13','P14','ENDING','THUMBNAIL'].includes(st),textVideoPrompt:'LEGACY APPROVED '+st,videoScene:'legacy scene '+st};
 seed.stages.P12.narration='A public tribunal investigated water beneath the coal tip.';seed.stages.P13.narration='The tribunal placed responsibility on the National Coal Board; it was preventable.';seed.stages.P14.narration='Decades later, remembrance and coal-tip safety remain its legacy.';
 await page.evaluate(seed=>window.LDCore.loadProductionState(seed),seed);await page.waitForTimeout(900);
 const initial=await page.evaluate(()=>({errors:[],stages:window.LDCore.collectState().stages,managed:window.NERCore5Runtime.manages(document.querySelector('[data-stage="P12"]')),target:window.LDSmartContinue.currentCard()?.dataset.stage}));
 console.log('initial',JSON.stringify({managed:initial.managed,target:initial.target,errors}));
 const approvedBefore=initial.stages.P1;
 for(const [st,s] of Object.entries(seed.stages)){if(!s.done)continue;for(const k of ['narration','imagePrompt','flowPrompt','textVideoPrompt','videoScene'])assert.equal(initial.stages[st][k],s[k],st+' approved '+k+' changed during load');}
 // Review legacy scenes through the real local form, without a console-only API.
 for(const st of ['P12','P13','P14','ENDING']){
  const card=page.locator('.stage-card[data-stage="'+st+'"]');
  await card.locator('.stage-body').evaluate(el=>el.classList.remove('hidden'));
  await card.locator('.core5-review summary').click();
  await card.locator('.core5-apply-scene').click();
  assert.match(await card.locator('.core5-review [role="status"]').textContent(),/Reviewed scene saved/);
 }
 await page.evaluate(()=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="P12"]')));
 console.log('after prepare',await page.evaluate(()=>({status:document.getElementById('ldSmartContinueStatus').textContent,ready:window.NERCore5Runtime.ready(document.querySelector('.stage-card[data-stage="P12"]'))})));
 assert.equal(calls.length,1);assert.equal(calls[0].url,'/api/ai-t2v-audit');
 let p=await page.evaluate(()=>window.LDCore.collectState().stages.P12);assert.equal(p.textVideoPrompt,calls[0].body.currentPrompt);assert(p.smartReady);assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),p.textVideoPrompt,'clipboard bytes equal audit bytes');
 await page.evaluate(()=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="P12"]')));assert.equal(calls.length,1,'reuse exact audit');
 await page.evaluate(()=>window.LDCore.saveCurrent());await page.reload();await page.waitForFunction(()=>{const c=document.querySelector('.stage-card[data-stage="P12"]');return c&&window.NERCore5Runtime?.ready(c);},{},{timeout:15000});
 assert.equal(await page.evaluate(()=>window.NERCore5Runtime.ready(document.querySelector('.stage-card[data-stage="P12"]'))),true,'reload ready');
 await page.evaluate(()=>window.LDSmartContinue.run());
 console.log('handoff',await page.evaluate(()=>({status:document.getElementById('ldSmartContinueStatus').textContent,target:window.LDSmartContinue.currentCard()?.dataset.stage})));
 const after=await page.evaluate(()=>window.LDCore.collectState().stages);
 assert.equal(after.P12.done,true,'Smart Continue approved P12');assert.equal(after.P12.textVideoPrompt,calls[0].body.currentPrompt);
 assert.equal(after.P1.textVideoPrompt,approvedBefore.textVideoPrompt);assert.equal(after.P1.narration,approvedBefore.narration);
 assert(after.P1.done);assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(after.P13.smartReady,true,'approval advances and audits P13');assert.equal(calls.length,2);
 await page.evaluate(()=>window.LDSmartContinue.run());
 let last=await page.evaluate(()=>window.LDCore.collectState().stages);assert(last.P13.done);assert(last.P14.smartReady);assert.equal(calls.length,3);assert.equal(last.P14.textVideoPrompt,calls[2].body.currentPrompt);
 await page.evaluate(()=>window.LDSmartContinue.run());last=await page.evaluate(()=>window.LDCore.collectState().stages);assert(last.P14.done);
 assert.equal(JSON.parse(last.P12.core5Record).status,'APPROVED');assert.equal(JSON.parse(last.P13.core5Record).status,'APPROVED');assert.equal(JSON.parse(last.P14.core5Record).status,'APPROVED');
 assert(last.ENDING.smartReady);assert.equal(last.ENDING.imagePrompt,calls[3].body.currentPrompt);assert.match(last.ENDING.imagePrompt,/ILLUSTRATION PROMPT/);
 await page.evaluate(()=>window.LDSmartContinue.run());last=await page.evaluate(()=>window.LDCore.collectState().stages);assert(last.ENDING.done);assert.equal(JSON.parse(last.ENDING.core5Record).status,'APPROVED');
 for(const [topic,year,location] of [['Wellington Avalanche 1910','1910','Wellington'],['Xylazine Crisis 2020','2020','Philadelphia'],['Halabja Chemical Attack 1988','1988','Halabja']]){
  const next={...seed,topic,videoContinuity:{year,location},stages:{HOOK:{narration:'A documented warning changed ordinary life.',imagePrompt:'saved draft',flowPrompt:'saved flow',videoMode:'text',done:false}}};
  await page.evaluate(s=>{localStorage.setItem('ld-autopilot-free-active-project','test-'+s.topic);window.LDCore.loadProductionState(s);},next);
  const c=page.locator('.stage-card[data-stage="HOOK"]');await c.locator('.core5-review summary').click();await c.locator('[data-core5-field=setting]').fill('representative outdoor viewing area');await c.locator('[data-core5-field=action]').fill('adult-1 slowly turns their head to the left');await c.locator('.core5-apply-scene').click();
  assert.match(await c.locator('.core5-review [role="status"]').textContent(),/Reviewed scene saved/);
  const before=calls.length;await page.evaluate(()=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="HOOK"]')));
  assert.equal(calls.length,before+1);assert.equal(calls.at(-1).body.topic,topic);
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),calls.at(-1).body.currentPrompt);
 }
 // Real Web Locks and shared localStorage: simultaneous tabs reuse one provider result.
 const other=await ctx.newPage();await other.goto(origin);await other.waitForFunction(()=>window.NERCore5AuditCoordinator);
 const shared=await page.evaluate(()=>window.NERCore5.payload(window.NERCore5.plan({stage:'P12',topic:'Flood 1931',narration:'An inquiry investigated the evidence.',eventYear:1931,location:'China'})));
 const run=(p,scope)=>p.evaluate(async({payload,scope})=>window.NERCore5AuditCoordinator.run(scope,payload,async data=>(await fetch('/api/ai-t2v-audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})).json()),{payload:shared,scope});
 const start=calls.length;await Promise.all([run(page,'two-tabs'),run(other,'two-tabs')]);assert.equal(calls.length,start+1,'cross-tab deduplication');
 await page.evaluate(payload=>window.NERCore5AuditCoordinator.reset('two-tabs',payload),shared);await run(page,'two-tabs');assert.equal(calls.length,start+1,'stale retry preserves a conclusive verdict');
 // Closing a tab while an audit is uncertain must not silently trigger a replacement request.
 await other.evaluate(payload=>{window.__pendingAudit=window.NERCore5AuditCoordinator.run('interrupted',payload,()=>new Promise(()=>{}));},shared);
 await other.waitForFunction(()=>Object.keys(localStorage).some(k=>k.startsWith('ner-core5-audit-v1:')&&JSON.parse(localStorage.getItem(k)).status==='STARTED'));
 await other.close();await assert.rejects(run(page,'interrupted'),/incomplete or uncertain/);assert.equal(calls.length,start+1);
 await page.evaluate(payload=>window.NERCore5AuditCoordinator.reset('interrupted',payload),shared);await run(page,'interrupted');assert.equal(calls.length,start+2,'explicit retry only');
 await page.evaluate(()=>{window.__realSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('ner-core5-audit-v1:'))throw new DOMException('quota','QuotaExceededError');return window.__realSetItem.call(this,k,v);};});
 await assert.rejects(run(page,'quota-test'),/persist the audit journal/);assert.equal(calls.length,start+2,'quota failure blocks before provider request');
 await page.evaluate(()=>{Storage.prototype.setItem=window.__realSetItem;});
 console.log('PASS: simultaneous tabs share one audit; interrupted tab blocks automatic retry; explicit retry works; storage quota failure makes zero provider calls.');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: actual page -> mock audit -> exact prompt -> reused audit -> reload -> Smart Continue approval; approved legacy P1 unchanged. Mock calls:',calls.length);
 }finally{await browser.close();await new Promise(r=>server.close(r));clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});

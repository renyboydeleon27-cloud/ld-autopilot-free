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
 const narrations=['A warning interrupts ordinary life.','Ordinary life continued in the village.','Years before the disaster, material accumulated above the village.','The slope contained water and loose material.','The slope collapsed toward the village.','The moving material struck a school.','Survivors faced the immediate impact.','The disaster killed local residents.','Families fled toward shelter.','Rescue workers searched the aftermath.','Local aid supported displaced families.','The community faced the aftermath.','A public tribunal investigated water beneath the coal tip.','The tribunal placed responsibility on the National Coal Board; it was preventable.','Decades later, remembrance and coal-tip safety remain its legacy.','Thank you for watching.'];
 const seed={topic:'Aberfan Disaster — Wales — 1966',format:'shorts',category:'disaster',narrativeFormat:'original',videoContinuity:{year:'1966',location:'Aberfan, Wales'},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{}};
 stages.forEach((st,i)=>seed.stages[st]={narration:narrations[i],imagePrompt:'',flowPrompt:'',videoMode:'text',done:false});
 await page.evaluate(s=>{localStorage.setItem('ld-autopilot-free-active-project','core5-isolated-new-project');window.LDCore.loadProductionState(s);},seed);
 await page.waitForTimeout(900);
 assert(await page.evaluate(()=>window.LDNarrationApproval.ready()),'complete narration ready');
 await page.locator('#ldNarrationSmartBtn').evaluate(b=>b.click());
 assert(await page.evaluate(()=>window.LDNarrationApproval.isApproved()),'narration approved through UI');
 assert.equal(calls.length,0,'narration approval is free');
 const snapshots={};
 for(const st of stages){
  const card=page.locator('.stage-card[data-stage="'+st+'"]');
  await card.locator('.stage-body').evaluate(el=>el.classList.remove('hidden'));
  await card.locator('.core5-review summary').click();
  if(['HOOK','P2','P3','P4','P5','P6'].includes(st)){await card.locator('[data-core5-field=setting]').fill('representative outdoor viewing area');await card.locator('[data-core5-field=action]').fill('adult-1 slowly turns their head to the left');}await card.locator('.core5-apply-scene').click();
  assert.match(await card.locator('.core5-review [role="status"]').textContent(),/Reviewed scene saved/,st+' local scene review');
 }
 await page.evaluate(()=>window.LDSmartContinue.run());
 for(let i=0;i<stages.length;i++){
  const st=stages[i];assert.equal(calls.length,i+1,st+' one mock audit');
  const data=await page.evaluate(st=>{const c=document.querySelector('.stage-card[data-stage="'+st+'"]');return {ready:window.NERCore5Runtime.ready(c),record:JSON.parse(c.dataset.core5Record),spec:JSON.parse(c.dataset.core5Spec),copied:window.__copied.at(-1)};},st);
  const expectedRoles=['hook','normal-world','cause-context','cause-context','onset','human-impact','human-impact','human-toll','displacement','response','response','aftermath','evidence','accountability','legacy','ending'];
  assert.equal(data.spec.role,expectedRoles[i],st+' semantic role');
  assert(data.ready,st+' ready');assert.equal(data.copied,calls[i].body.currentPrompt,st+' copied audited bytes');
  assert.equal(data.record.prompt,calls[i].body.currentPrompt);snapshots[st]=data;
  await page.evaluate(st=>window.LDSmartContinue.prepare(document.querySelector('.stage-card[data-stage="'+st+'"]')),st);
  assert.equal(calls.length,i+1,st+' repeat uses same audit');
  await page.evaluate(()=>window.LDSmartContinue.run());
  const saved=await page.evaluate(()=>window.LDCore.collectState().stages);
  for(const doneStage of stages.slice(0,i+1)){assert(saved[doneStage].done,doneStage+' approval remains');assert.equal(JSON.parse(saved[doneStage].core5Record).prompt,snapshots[doneStage].record.prompt,doneStage+' frozen bytes');}
 }
 await page.evaluate(()=>window.LDCore.saveCurrent());await page.reload();await page.waitForTimeout(1200);
 const after=await page.evaluate(()=>window.LDCore.collectState().stages);
 for(const st of stages){assert(after[st].done,st+' remains approved after reload');assert.equal(JSON.parse(after[st].core5Record).prompt,snapshots[st].record.prompt);}
 assert.equal(calls.length,16);assert.deepEqual(errors,[]);
 const report={result:'PASS',project:'isolated new synthetic Aberfan test; no production panels reopened',stages:16,mockedAuditRequests:calls.length,paidRequests:0,pageErrors:errors,checks:['all sixteen local review forms','Smart Continue HOOK through ENDING','one audit per panel','repeat audit reuse','copied/audited/approved bytes','approved persistence after reload'],sceneReview:Object.fromEntries(Object.entries(snapshots).map(([k,v])=>[k,{role:v.spec.role,chronology:v.spec.chronology,setting:v.spec.location.setting,action:v.spec.action,camera:v.spec.camera}]))};
 console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});

/* Validate a supplied production backup through actual import/reload/copy paths.
   Usage: CORE5_BACKUP_PATH=/path/to/backup.json node tests/core5-production-backup.cjs
   The backup is read-only and is never added to git. All API requests are blocked. */
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),input=process.env.CORE5_BACKUP_PATH;
if(!input)throw Error('Set CORE5_BACKUP_PATH to an exported project JSON.');
const original=fs.readFileSync(input),seed=JSON.parse(original),hash=crypto.createHash('sha256').update(original).digest('hex');
const timeout=setTimeout(()=>{console.error('Production backup validation timed out');process.exit(1);},90000);timeout.unref();
(async()=>{
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;const p=path.join(root,name==='/'?'index.html':name);if(!p.startsWith(root+'/')){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;const calls=[],errors=[];
 try{
  let launch={headless:true};if(process.env.CORE5_CHROMIUM_MODULE){const m=await import(process.env.CORE5_CHROMIUM_MODULE),c=m.default||m;launch={...launch,executablePath:await c.executablePath(),args:c.args};}
  browser=await chromium.launch(launch);const ctx=await browser.newContext({viewport:{width:393,height:851},serviceWorkers:'block'});
  await ctx.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();if(u.pathname.startsWith('/api/')){calls.push(u.pathname);return route.fulfill({status:503,json:{ok:false,error:'API disabled for backup validation'}});}return route.continue();});
  await ctx.addInitScript(()=>{window.__copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>window.__copied.push(t)}});});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.waitForFunction(()=>window.LDCore&&window.LDSmartContinue);
  await page.locator('#backupFileInput').setInputFiles(input);await page.waitForFunction(topic=>document.getElementById('topic').value===topic,seed.topic);await page.waitForTimeout(1600);
  const approved=Object.entries(seed.stages).filter(([,s])=>s.done||s.approvalCommitted);
  function verify(state,label){const differences=[];for(const [stage,s] of approved){const actual=state.stages[stage];for(const [field,value] of Object.entries(s)){if(JSON.stringify(actual?.[field])!==JSON.stringify(value))differences.push(stage+'.'+field+' ('+JSON.stringify(value)?.length+' -> '+JSON.stringify(actual?.[field])?.length+' bytes)');}assert(actual?.done,label+': '+stage+' Done');}
   assert.deepEqual(differences,[],label+': approved field differences');
   for(const k of ['topic','format','category','narrativeFormat','storyPremise','storyBible','youtubeTitle','finalPackageMeta','videoContinuity','projectLocks','apiUsage','approvedMemory'])if(k in seed)assert.deepEqual(state[k],seed[k],label+': '+k);
  }
  verify(await page.evaluate(()=>window.LDCore.collectState()),'import');
  await page.evaluate(()=>window.LDCore.saveCurrent());await page.reload();await page.waitForFunction(()=>window.LDCore&&window.LDSmartContinue);await page.waitForTimeout(1600);verify(await page.evaluate(()=>window.LDCore.collectState()),'reload');
  const prompts=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.stage-card')].filter(c=>window.NERCore5Runtime.protectedPanel(c)).map(c=>[c.dataset.stage,window.NERCore5Runtime.preserve(c)])));
  for(const [stage,s] of approved){const expected=stage==='ENDING'||stage==='THUMBNAIL'?s.imagePrompt:s.textVideoPrompt||s.flowPrompt;assert.equal(prompts[stage],expected,'exact preserved copy '+stage);}
  if(approved.length===Object.keys(seed.stages).length){await page.evaluate(()=>window.LDSmartContinue.run());verify(await page.evaluate(()=>window.LDCore.collectState()),'Smart Continue on completed production');}
  await page.evaluate(()=>window.LDCore.saveCurrent());
  const downloaded=page.waitForEvent('download');await page.locator('#backupBtn').evaluate(b=>b.click());const exportFile=await downloaded;verify(JSON.parse(fs.readFileSync(await exportFile.path(),'utf8')),'downloaded backup');
  assert.deepEqual(calls,[],'No API requests should be attempted');assert.deepEqual(errors,[],'No page errors');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex'),hash,'Original backup unchanged');
  console.log(JSON.stringify({result:'PASS',topic:seed.topic,backupSha256:hash,approvedPanels:approved.length,checks:['real UI import','all saved approved stage fields','project settings and API usage','save/reload','downloaded backup export','approval memory','exact preserved prompts','completed Smart Continue is inert','original backup unchanged'],apiRequests:calls.length,pageErrors:errors.length},null,2));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));clearTimeout(timeout);}
})().catch(e=>{console.error(e);process.exitCode=1;});

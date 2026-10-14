/* Real service-worker upgrade, failed install, and offline reload; no provider access. */
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),baseline='6d068d89c393490e75b5ab5a0d54250b9659308d',oldFiles=new Map();
const deadline=setTimeout(()=>{console.error('PWA regression timed out');process.exit(1);},90000);deadline.unref();
(async()=>{
 let release='old',failInstall=false,apiCalls=0;
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');let file=decodeURIComponent(u.pathname).replace(/^\//,'')||'index.html';
  if(file==='pwa-test.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Upgrade fixture</title>');return;}
  if(file.startsWith('api/')){apiCalls++;res.writeHead(503).end('Paid endpoints disabled in local test');return;}
  if(file.includes('..')){res.writeHead(403).end();return;}
  if(release==='new'&&failInstall&&file==='ner-core-5-runtime.js'){res.writeHead(503).end('Simulated interrupted release');return;}
  try{let body;if(release==='old'){if(!oldFiles.has(file))oldFiles.set(file,execFileSync('git',['show',baseline+':'+file],{cwd:root,stdio:['ignore','pipe','ignore']}));body=oldFiles.get(file);}else body=fs.readFileSync(path.join(root,file));
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')||file.endsWith('.webmanifest')?'application/json':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(body);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let browser;try{
  let launch={headless:true};if(process.env.CORE5_CHROMIUM_MODULE){const m=await import(process.env.CORE5_CHROMIUM_MODULE),c=m.default||m;launch={...launch,executablePath:await c.executablePath(),args:c.args};}
  browser=await chromium.launch(launch);const context=await browser.newContext({viewport:{width:393,height:851},serviceWorkers:'allow'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
  const seed={topic:'Aberfan Disaster — Wales — 1966',format:'shorts',category:'disaster',narrativeFormat:'original',videoContinuity:{year:'1966',location:'Aberfan, Wales'},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{}};
  for(const stage of ['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING','THUMBNAIL'])seed.stages[stage]={done:true,approvalCommitted:true,videoMode:'text',narration:'Saved approved narration '+stage,imagePrompt:'Saved image '+stage,flowPrompt:'Saved flow '+stage,textVideoPrompt:'Saved approved prompt '+stage,videoScene:'Saved scene '+stage};
  seed.stages.P5.videoMode='image';seed.stages.P5.smartReady=false;seed.stages.P5.smartReadySignature='preserved-approved-signature';
  // Stop Core 4's timed decorators, then restore a known saved Core 4 backup.
  // This measures upgrade preservation, not mutations by the still-running old app.
  await page.goto(origin+'/pwa-test.html');
  await page.evaluate(s=>localStorage.setItem('ld-autopilot-free-v1',JSON.stringify(s)),seed);const before=seed;
  release='new';failInstall=true;
  const failed=await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();const done=new Promise(resolve=>reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker.addEventListener('statechange',()=>{if(worker.state==='redundant')resolve(worker.state);});},{once:true}));await reg.update();return done;});
  assert.equal(failed,'redundant');assert.equal(await page.evaluate(()=>typeof window.NERCore5),'undefined');
  assert(await page.evaluate(async()=> (await caches.keys()).includes('ner-studio-pwa-4-0-56')),'failed install retains old cache');
  assert(!await page.evaluate(async()=> (await caches.keys()).includes('ner-studio-pwa-5-1-1')),'failed partial shell is removed');
  failInstall=false;
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();const done=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));await reg.update();await done;});
  await page.goto(origin);await page.waitForFunction(()=>window.NERCore5Runtime);await page.waitForTimeout(800);
  function compare(after){for(const [stage,saved] of Object.entries(before.stages)){assert.equal(after.stages[stage].done,true,stage+' approval');for(const key of Object.keys(saved))assert.equal(after.stages[stage][key],saved[key],stage+' '+key);}}
  compare(await page.evaluate(()=>window.LDCore.collectState()));
  await page.locator('#appUpdateButton').click();await page.waitForFunction(()=>!document.getElementById('appUpdateButton').disabled);
  assert.match(await page.locator('#appUpdateStatus').textContent(),/5.1.1/);
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>window.NERCore5Runtime&&window.NERFamilyPlanner4&&window.NERFinalAudit4);compare(await page.evaluate(()=>window.LDCore.collectState()));
  await page.locator('#appUpdateButton').click();await page.waitForFunction(()=>!document.getElementById('appUpdateButton').disabled);compare(await page.evaluate(()=>window.LDCore.collectState()));
  assert.equal(apiCalls,0);assert.deepEqual(errors,[]);
  console.log('PASS: actual Core 4 worker -> interrupted Core 5 installation retains Core 4 -> complete Core 5 activation -> mobile offline reload; every approved panel field preserved; zero API calls.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});

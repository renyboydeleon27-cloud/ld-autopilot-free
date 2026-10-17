/* Reproduce the unchanged-worker release defect, then upgrade via the actual UI. */
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),memo=new Map();
function historical(ref,file){const key=ref+':'+file;if(!memo.has(key))memo.set(key,execFileSync('git',['show',key],{cwd:root,stdio:['ignore','pipe','ignore']}));return memo.get(key);}
const deadline=setTimeout(()=>{console.error('PWA diagnostic regression timed out');process.exit(1);},180000);deadline.unref();
(async()=>{
 let release='99e2602',apiCalls=0,corrupt=false;
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=url.pathname.slice(1)||'index.html';
  if(file.startsWith('api/')){apiCalls++;return res.writeHead(503).end('API blocked');}
  if(file.includes('..'))return res.writeHead(403).end();
  try{const body=file==='seed.html'?Buffer.from('<!doctype html><title>seed</title>'):release==='fixed'?fs.readFileSync(path.join(root,file)):historical(release,file);
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webmanifest')?'application/json':file.endsWith('.html')?'text/html':'application/octet-stream');
   res.end(corrupt&&file==='ner-core-5-editor.js'?Buffer.concat([body,Buffer.from('\n// mixed deployment')]):body);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let browser;try{
  let launch={headless:true};if(process.env.CORE5_CHROMIUM_MODULE){const m=await import(process.env.CORE5_CHROMIUM_MODULE),c=m.default||m;launch={...launch,executablePath:await c.executablePath(),args:c.args};}
  browser=await chromium.launch(launch);const context=await browser.newContext({viewport:{width:393,height:851},serviceWorkers:'allow'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  let page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/seed.html');
  const seed={topic:'The Great Smog of London — 1952',format:'shorts',category:'disaster',narrativeFormat:'original',videoContinuity:{year:'1952',location:'London, England'},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{}};
  for(const stage of ['HOOK',...Array.from({length:14},(_,i)=>'P'+(i+1)),'ENDING','THUMBNAIL'])seed.stages[stage]={done:true,approvalCommitted:true,videoMode:'text',narration:'Approved narration '+stage,imagePrompt:'Approved image '+stage,flowPrompt:'Approved flow '+stage,textVideoPrompt:'Approved exact prompt '+stage,videoScene:'Approved scene '+stage};
  seed.stages.P3={done:false,videoMode:'text',narration:'Above the rooftops, warmer air trapped colder air below. With little wind, the smoke could no longer disperse into the sky.',videoScene:'London rooftops, period chimneys and lingering coal smoke.'};
  await page.evaluate(s=>{localStorage.setItem('ld-autopilot-free-v1',JSON.stringify(s));localStorage.setItem('pwa-preserve-journal','untouched');localStorage.setItem('pwa-preserve-backup',JSON.stringify(s));},seed);
  await page.evaluate(()=>new Promise((resolve,reject)=>{
   const request=indexedDB.open('pwa-preservation-test',1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onerror=()=>reject(request.error);
   request.onsuccess=()=>{const db=request.result,tx=db.transaction('records','readwrite');tx.objectStore('records').put('preserved audit journal','sentinel');tx.oncomplete=()=>{db.close();resolve();};};
  }));
  await page.goto(origin);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller&&window.NERCore5Runtime);await page.waitForTimeout(800);
  await page.evaluate(()=>window.LDCore.saveCurrent());
  const before=await page.evaluate(()=>window.LDCore.collectState());
  assert.equal(await page.getByRole('button',{name:'Check audit status · FREE',exact:true}).count(),0);
  release='3903be8';
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});
  await page.reload();await page.waitForFunction(()=>window.NERCore5Runtime);
  assert.equal(await page.getByRole('button',{name:'Check audit status · FREE',exact:true}).count(),0);
  assert(await page.evaluate(()=>Array.from(document.scripts).some(s=>s.src.endsWith('ner-core-5-editor.js?v=5.1.1'))));
  assert(historical('3903be8','ner-core-5-editor.js').includes('Check audit status'));
  console.log('REPRODUCED: deployed diagnostic exists but unchanged worker serves cached 5.1.1 HTML/editor after update + reload.');
  release='fixed';corrupt=true;
  const failed=await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();const done=new Promise(resolve=>reg.addEventListener('updatefound',()=>{const w=reg.installing;w.addEventListener('statechange',()=>{if(w.state==='redundant')resolve(true);});},{once:true}));await reg.update();return done;});assert(failed);
  assert(await page.evaluate(async()=> (await caches.keys()).includes('ner-studio-pwa-5-1-1')));
  corrupt=false;await page.locator('#appUpdateButton').click();
  await page.waitForFunction(()=>document.getElementById('appUpdateButton').textContent==='Load available update');
  // Activation must not reload or mutate the open production.
  assert(await page.evaluate(()=>Array.from(document.scripts).some(s=>s.src.endsWith('ner-core-5-editor.js?v=5.1.1'))));
  await page.locator('#appUpdateButton').click();await page.waitForFunction(()=>document.getElementById('appUpdateStatus')?.textContent.includes('5.1.9'));
  await page.waitForFunction(()=>document.querySelector('.stage-card[data-stage="P3"] .core5-check-audit'));
  async function verify(){
   await page.waitForFunction(()=>window.LDCore&&document.querySelector('[data-stage="P3"] .core5-check-audit')&&!document.querySelector('main').inert);
   const after=await page.evaluate(()=>window.LDCore.collectState());
   for(const [stage,saved] of Object.entries(seed.stages))if(stage!=='P3')for(const key of Object.keys(saved))assert.deepEqual(after.stages[stage][key],saved[key],stage+' '+key);
   for(const key of ['narration','videoScene','done'])assert.deepEqual(after.stages.P3[key],before.stages.P3[key],'P3 '+key);
   assert.equal(await page.evaluate(()=>localStorage.getItem('pwa-preserve-journal')),'untouched');
   assert.equal(await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('pwa-preservation-test',1);request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,q=db.transaction('records').objectStore('records').get('sentinel');q.onsuccess=()=>{resolve(q.result);db.close();};};})),'preserved audit journal');
   assert.equal(await page.evaluate(()=>localStorage.getItem('pwa-preserve-backup')),JSON.stringify(seed));
   const card=page.locator('.stage-card[data-stage="P3"]');await card.locator('.stage-body').evaluate(e=>e.classList.remove('hidden'));await card.locator('.core5-review').evaluate(e=>e.open=true);
   const snapshot=()=>card.evaluate(c=>JSON.stringify({journals:Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('ner-core5-audit')||k.startsWith('pwa-preserve'))),card:c.dataset.core5Record||'',state:window.LDCore.collectState().stages}));
   const inspectBefore=await snapshot();await card.locator('.core5-check-audit').click();
   await page.waitForFunction(()=>!document.querySelector('[data-stage="P3"] .core5-check-audit').disabled);
   const comparison={before:inspectBefore,after:await snapshot()};
   const d=await card.locator('.core5-audit-diagnosis').textContent();assert.match(d,/Local audit status:/);assert.match(d,/Saved panel record:/);assert.match(d,/Reasons:/);assert.match(d,/No audit request or retry was sent/);assert(d.includes('\n'));assert(!d.includes('\\n'));
   assert.equal(comparison.after,comparison.before,'diagnostic must not write storage, records or panel state');
  }
  await verify();assert.equal(await page.locator('#appUpdateButton').textContent(),'Check app update');
  await page.locator('#appUpdateButton').click();await page.waitForFunction(()=>!document.getElementById('appUpdateButton').disabled);assert.equal(await page.locator('#appUpdateButton').textContent(),'Check app update');
  await context.setOffline(true);await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.waitForFunction(()=>window.NERCore5Runtime);await verify();
  assert.equal(apiCalls,0);assert.deepEqual(errors,[]);
  console.log('PASS: mixed release rejected; old PWA -> explicit load -> current P3 diagnostic -> offline close/reopen; approved panel bytes and P3 unchanged; diagnostic read-only; zero API calls. Desktop Chromium mobile viewport, not physical Android.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});

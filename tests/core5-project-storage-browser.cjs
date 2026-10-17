const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{const file=new URL(req.url,'http://localhost').pathname;try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(file==='/seed.html'?'<title>seed</title>':fs.readFileSync(path.join(root,file==='/'?'index.html':file)));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let launch={headless:true};if(process.env.CORE5_CHROMIUM_MODULE){const m=await import(process.env.CORE5_CHROMIUM_MODULE),c=m.default||m;launch={...launch,executablePath:await c.executablePath(),args:c.args};}const browser=await chromium.launch(launch);
 try{
 const context=await browser.newContext({serviceWorkers:'block'});let api=0;await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();if(u.pathname.startsWith('/api/')){api++;return route.abort();}return route.continue();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/seed.html');
 const seed=process.env.CORE5_BACKUP_PATH?JSON.parse(fs.readFileSync(process.env.CORE5_BACKUP_PATH,'utf8')):{topic:'The Great Smog of London — 1952',format:'shorts',category:'disaster',videoContinuity:{year:'1952',location:'London, England'},projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'bw'},stages:{P3:{narration:'Above the rooftops, warmer air trapped colder air below.',videoMode:'text',done:false}}};
 if(!process.env.CORE5_BACKUP_PATH)for(const s of ['HOOK','P1','P2'])seed.stages[s]={done:true,approvalCommitted:true,videoMode:'text',narration:'Approved '+s,imagePrompt:'image '+s,flowPrompt:'exact '+s,textVideoPrompt:'exact '+s,videoScene:'scene '+s};
 await page.evaluate(s=>{localStorage.setItem('ld-autopilot-free-v1',JSON.stringify(s));localStorage.setItem('ld-autopilot-free-active-project','smog');localStorage.setItem('ld-autopilot-free-project-library-v1',JSON.stringify({projects:[{id:'smog',name:s.topic,state:s},{id:'other',name:'Other saved production',state:{...s,topic:'Other saved production'}}]}));},seed);
 await page.goto(origin);await page.waitForFunction(()=>window.LDProjectLibrary&&document.getElementById('enableProjectStorage'));await page.waitForTimeout(1000);
 const before=await page.evaluate(()=>LDCore.collectState());
 const otherBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('ld-autopilot-free-project-library-v1')).projects.find(p=>p.id==='other'));
 await page.evaluate(()=>localStorage.setItem('ner-core5-audit-v1:preservation-test','unchanged audit journal'));
 await page.evaluate(()=>{let i=0;try{for(;;)localStorage.setItem('quota-fixture-'+i++,'x'.repeat(100000));}catch{};try{for(;;)localStorage.setItem('quota-small-'+i++,'x'.repeat(100));}catch{};const c=document.querySelector('[data-stage="P3"] .narration');c.value+=' '+ 'local save test '.repeat(1000).trim();});
 assert.equal(await page.evaluate(()=>LDCore.saveCurrent()),false,'reproduce actual full-localStorage save failure');
 const unsaved=await page.evaluate(()=>LDCore.collectState());
 await assert.rejects(page.evaluate(()=>NERProjectStorage.ensureSaved()),/save failed/);
 // Failed initial migration must retain every native value and remain in legacy mode.
 await page.evaluate(()=>{window.savedPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw Error('Migration disk failure');};});
 await assert.rejects(page.evaluate(()=>NERProjectStorage.migrate()),/Migration disk failure/);
 assert.equal(await page.evaluate(()=>NERProjectStorage.enabled),false);
 await page.evaluate(()=>IDBObjectStore.prototype.put=savedPut);
 const original=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/^(ld-|ner-)/.test(k)&&!k.startsWith('ner-core5-audit-v1:')&&!k.startsWith('ld-youtube-')).map(k=>[k,localStorage.getItem(k)])));
 await page.locator('#enableProjectStorage').click();await page.waitForFunction(()=>window.NERProjectStorage?.enabled&&window.LDCore&&document.getElementById('enableProjectStorage')?.disabled).catch(async e=>{console.error(await page.locator('body').innerText());throw e;});await page.waitForTimeout(500);
 await page.evaluate(()=>NERProjectStorage.ensureSaved());
 const after=await page.evaluate(()=>LDCore.collectState());
 for(const s of ['HOOK','P1','P2'])assert.deepEqual(after.stages[s],before.stages[s],'approved '+s+' preserved');
 assert.equal(after.stages.P3.narration,unsaved.stages.P3.narration,'unsaved current edits migrated');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ld-autopilot-free-project-library-v1')).projects.length),2);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ld-autopilot-free-project-library-v1')).projects.find(p=>p.id==='other')),otherBefore);
 assert.equal(await page.evaluate(()=>localStorage.getItem('ner-core5-audit-v1:preservation-test')),'unchanged audit journal');
 // Writes queued at a transaction completion boundary must not be dropped.
 await page.evaluate(async()=>{const put=IDBObjectStore.prototype.put;let once=true;IDBObjectStore.prototype.put=function(...args){if(once){once=false;this.transaction.addEventListener('complete',()=>queueMicrotask(()=>queueMicrotask(()=>localStorage.setItem('ner-last-write-test','last write retained'))));}return put.apply(this,args);};localStorage.setItem('ner-write-trigger','first');await NERProjectStorage.flush();IDBObjectStore.prototype.put=put;});
 assert.equal(await page.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('ner-project-storage-v1',1);q.onsuccess=()=>{const db=q.result,r=db.transaction('snapshots').objectStore('snapshots').get('workspace');r.onsuccess=()=>{resolve(r.result.values['ner-last-write-test']);db.close();};};})),'last write retained');
 // Native legacy values remain byte-identical; the facade uses IndexedDB now.
 const migratedLegacy=await page.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('ner-project-storage-v1',1);q.onsuccess=()=>{const db=q.result,r=db.transaction('snapshots').objectStore('snapshots').get('workspace');r.onsuccess=()=>{resolve(r.result.legacy);db.close();};r.onerror=reject;};}));
  assert.deepEqual(Object.keys(migratedLegacy).sort(),Object.keys(original).sort(),'native legacy keyset preserved');
  for(const k of Object.keys(original))assert.equal(migratedLegacy[k],original[k],'native legacy bytes preserved: '+k);
 await page.reload();await page.waitForFunction(()=>NERProjectStorage.enabled&&window.LDCore);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>LDCore.collectState().stages.P3.narration),unsaved.stages.P3.narration);
 const other=await context.newPage();await other.goto(origin);await other.waitForSelector('[role="alert"]');assert.match(await other.locator('[role="alert"]').textContent(),/Another NER Studio tab/);await other.evaluate(()=>localStorage.setItem('ld-youtube-client-id-v1','external-settings-test'));await page.evaluate(()=>NERProjectStorage.ensureSaved());assert.equal(await page.evaluate(()=>localStorage.getItem('ld-youtube-client-id-v1')),'external-settings-test');await other.close();
 assert.deepEqual(errors,[],'no errors before injected disk failure');
 // A failed disk commit must prevent a paid audit even though the in-memory write succeeded.
 await page.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw Error('Simulated disk failure');};document.querySelector('[data-stage="P3"] .narration').value+=' changed';});
 await assert.rejects(page.evaluate(()=>NERProjectStorage.ensureSaved()),/Simulated disk failure/);
 await assert.rejects(page.evaluate(()=>NERCore5Runtime.prepare(document.querySelector('[data-stage="P3"]'),()=>{throw Error('AUDIT MUST NOT RUN');})),/save failed|Simulated disk failure/);
 await page.evaluate(()=>IDBObjectStore.prototype.put=originalPut);
 await page.close();const legacyPage=await context.newPage();await legacyPage.goto(origin+'/seed.html');
 assert.deepEqual(await legacyPage.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/^(ld-|ner-)/.test(k)&&!k.startsWith('ner-core5-audit-v1:')&&!k.startsWith('ld-youtube-')).map(k=>[k,localStorage.getItem(k)]))),original,'native legacy bytes retained');
 await legacyPage.evaluate(()=>localStorage.removeItem('ld-autopilot-free-active-project'));
 await legacyPage.goto(origin);await legacyPage.waitForSelector('[role="alert"]');assert.match(await legacyPage.locator('[role="alert"]').textContent(),/Legacy project data changed/);
 assert.equal(api,0);assert(errors.every(e=>e==='Simulated disk failure'),'only deliberate storage fault errors allowed');console.log('PASS: full-localStorage migration, unsaved edits, all approved fields, other project preservation, reload, cross-tab exclusion, disk failure blocks save; zero API requests.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

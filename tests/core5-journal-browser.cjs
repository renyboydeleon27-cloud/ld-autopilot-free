/* Real Chromium IndexedDB persistence and legacy migration, no provider requests. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const browser=process.env.CHROMIUM_PATH||'/usr/bin/chromium';
const html='<!doctype html><meta charset="utf-8"><script src="/ner-core5-journal-store.js"></script>';
const server=http.createServer((req,res)=>{
 if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;}
 if(req.url==='/ner-core5-journal-store.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(fs.readFileSync(path.join(root,'ner-core5-journal-store.js')));return;}
 res.writeHead(404);res.end();
});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const profile=fs.mkdtempSync('/tmp/core5-browser-');
 const script=`<!doctype html><script src="${origin}/ner-core5-journal-store.js"></script>`;
 // CDP via Chrome remote debugging; use installed puppeteer if repository provides it.
 let puppeteer;
 try{puppeteer=require('puppeteer-core');}catch{throw Error('puppeteer-core required for real browser tests');}
 const instance=await puppeteer.launch({executablePath:browser,headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],userDataDir:profile});
 try{
  const page=await instance.newPage();await page.goto(origin);
  const first=await page.evaluate(async()=>{
   const key='ner-core5-audit-v1:browser-new',s=NERCore5JournalStore;
   await s.save(key,{schema:1,identity:'fresh',status:'STARTED'});
   return (await s.read(key)).status;
  });
  assert.equal(first,'STARTED');
  await page.reload();
  assert.equal(await page.evaluate(async()=> (await NERCore5JournalStore.read('ner-core5-audit-v1:browser-new')).status),'STARTED');
  const migration=await page.evaluate(async()=>{
   const k='ner-core5-audit-v1:browser-legacy';
   localStorage.setItem(k,JSON.stringify({schema:1,identity:'legacy',status:'UNCERTAIN'}));
   await NERCore5JournalStore.read(k);
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ner-core5-audit-journals');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
   const migrated=await new Promise((resolve,reject)=>{const r=db.transaction('journals').objectStore('journals').get(k);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
   return migrated.status==='UNCERTAIN' && JSON.parse(localStorage.getItem(k)).status==='UNCERTAIN';
  });
  assert.equal(migration,true);
  const blocked=await page.evaluate(async()=>{
   try{await NERCore5JournalStore.save('ner-core5-audit-v1:browser-legacy',{schema:1,identity:'legacy',status:'DONE'});return false}
   catch{return true}
  });
  assert.equal(blocked,true);
  console.log('PASS: real Chromium IndexedDB write, reload, migration, and legacy protection');
 }finally{await instance.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());

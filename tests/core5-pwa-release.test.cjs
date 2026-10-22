const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const path=require('node:path'),root=path.resolve(__dirname,'..');
test('release worker matches current HTML and every dependency byte',()=>{execFileSync(process.execPath,['scripts/build-pwa-shell.cjs','--check'],{cwd:root});});
test('precached shell includes diagnostic editor, runtime, journal and compact settings',()=>{
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'),ctx={self:{addEventListener(){}}};vm.createContext(ctx);vm.runInContext(sw+';globalThis.urls=CORE_SHELL;',ctx);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const file of ['smart-continue.js','ner-auto-focus.js']){
  const hit=html.match(new RegExp('src="'+file.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\ for(const url of ['./ner-core-5-editor.js?v=5.1.38','./ner-core-5.js?v=5.1.37','./ner-video-dna.js?v=1.0.3','./smart-continue.js?v=5.1.32','./ner-auto-focus.js?v=1.0.0','./ner-app-bootstrap.js?v=5.1.25','./ner-core-5-runtime.js?v=5.1.38','./ner-core-5-audit-coordinator.js?v=5.1.38','./ner-core5-journal-store.js?v=5.1.38','./core5-shared-settings-compact.js?v=1.0.0'])assert(ctx.urls.includes(url),url);')+'\\?v=[^"]+"'));
  assert(hit,'Missing versioned '+file+' script in HTML');
  assert(ctx.urls.includes('./'+hit[0].slice(5,-1)),file+' shell should match HTML');
 }
 for(const url of ['./ner-core-5-editor.js?v=5.1.38','./ner-core-5.js?v=5.1.37','./ner-video-dna.js?v=1.0.3','./ner-app-bootstrap.js?v=5.1.25','./ner-core-5-runtime.js?v=5.1.38','./ner-core-5-audit-coordinator.js?v=5.1.38','./ner-core5-journal-store.js?v=5.1.38','./core5-shared-settings-compact.js?v=1.0.0'])assert(ctx.urls.includes(url),url);
});

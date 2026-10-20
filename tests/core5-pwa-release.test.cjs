const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const path=require('node:path'),root=path.resolve(__dirname,'..');
test('release worker matches current HTML and every dependency byte',()=>{execFileSync(process.execPath,['scripts/build-pwa-shell.cjs','--check'],{cwd:root});});
test('precached shell includes diagnostic editor, runtime, journal and compact settings',()=>{
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'),ctx={self:{addEventListener(){}}};vm.createContext(ctx);vm.runInContext(sw+';globalThis.urls=CORE_SHELL;',ctx);
 for(const url of ['./ner-core-5-editor.js?v=5.1.27','./ner-core-5.js?v=5.1.35','./ner-video-dna.js?v=1.0.2','./smart-continue.js?v=5.1.32','./ner-auto-focus.js?v=1.0.0','./ner-app-bootstrap.js?v=5.1.25','./ner-core-5-runtime.js?v=5.1.35','./ner-core-5-audit-coordinator.js?v=5.1.10','./ner-core5-journal-store.js?v=5.1.10','./core5-shared-settings-compact.js?v=1.0.0'])assert(ctx.urls.includes(url),url);
});

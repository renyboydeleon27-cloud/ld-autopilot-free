/* NER Studio PWA Service Worker 5.1.1
   Cache/offline/update only. No JavaScript concatenation, injection, rewriting,
   or runtime business logic. App behavior belongs to normal versioned files. */
const CACHE_NAME='ner-studio-pwa-5-1-1';
const CORE_SHELL=['./app-update.js?v=5.1.1','./halabja-p4-hotfix.js?v=5.0.3','./ner-core-4.js?v=4.0.0','./ner-stage-semantics-v4.js?v=4.0.0','./ner-family-planner-v4.js?v=5.0.3','./halabja-event-panel-engine.js?v=1.0','./ner-core-bridge.js?v=4.0.1','./ner-semantic-guard-v4.js?v=4.0.5','./ner-human-life-engine.js?v=1.1.0','./ner-source-story-v4.js?v=4.0.0','./ner-project-store-v4.js?v=4.0.0','./ner-core-diagnostics.js?v=4.0.0','./ner-final-audit-v4.js?v=4.0.0','./', './index.html', './manifest.webmanifest?v=2', './app-icon.svg?v=2', './styles.css?v=3.46.3', './disaster-progression-engine.js?v=3.49.2', './ld-story-format.js?v=1.1', './ner-core-5.js?v=5.1.1', './ner-core-5-audit-coordinator.js?v=5.0.2', './ner-core-5-runtime.js?v=5.1.1', './ner-core-5-editor.js?v=5.1.1', './app.js?v=5.1.1', './final-audit-fix.js?v=2.8', './backup-fix.js?v=2.7', './google-drive-backup.js?v=1.0.1', './project-library.js?v=3.49.27', './new-project-fix.js?v=1.8', './automation-assist.js?v=3.46.0', './wellington-avalanche-panels.js?v=1.1.2', './event-smart-narration.js?v=3.42.0', './static-smart-narration.js?v=3.49.7', './historical-context.js?v=5.0.2', './image-prompt-sync.js?v=5.0.2', './stage-fact-sync.js?v=5.0.2', './composition-lock.js?v=5.0.2', './event-visual-pack.js?v=5.0.2', './cyclone-visual-packs.js?v=3.3.1', './image-workspace.js?v=3.19.1', './ending-format-lock.js?v=5.0.2', './thumbnail-format-lock.js?v=5.0.2', './thumbnail-randomization.js?v=5.0.2', './hook-survival-lock.js?v=3.42.0', './visual-mode.js?v=5.0.2', './scene-variety-lock.js?v=5.0.2', './master-narration.js?v=3.49.35', './narration-import.js?v=1.0.3', './narration-smart-continue.js?v=5.1.1', './quality-polish-lock.js?v=5.0.2', './camera-motion-lock.js?v=5.0.2', './twist-hook-v3-14.js?v=3.17.0', './locust-laundry-hook.js?v=3.17.0', './cyclone-mahina-hook.js?v=3.20.6', './cyclone-nargis-hook.js?v=3.25.0', './tri-state-tornado-hook.js?v=3.39.3', './wellington-avalanche-hook.js?v=1.0', './hook-family-library.js?v=3.39.4-wellington1', './halabja-chemical-hook.js?v=1.4', './production-dna-engine.js?v=3.42.1', './continuity-engine.js?v=1.0.4', './public-health-policy.js?v=1.3.8', './p14-reflective-hotfix.js?v=1.5', './halabja-p3-preloader.js?v=2.0', './video-modes.js?v=5.1.1', './halabja-p3-hotfix.js?v=1.0', './hook-choice-system.js?v=3.49.21', './project-locks.js?v=5.0.4', './title-recommendations.js?v=3.49.23', './ai-assist.js?v=3.46.0', './smart-continue.js?v=5.0.4', './aberfan-p10-toll.js?v=5.0.2', './aberfan-p11-grief.js?v=5.0.2', './aberfan-p12-evidence.js?v=5.0.2', './aberfan-p13-accountability.js?v=5.0.2', './aberfan-p14-legacy.js?v=5.0.2', './smart-narration-progress.js?v=1.0.1', './final-package.js?v=3.49.24'];
// Install the complete shell or retain the working worker. Never activate a partial shell.
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  try{await cache.addAll(CORE_SHELL.map(url=>new Request(url,{cache:'reload'})));}
  catch(error){await caches.delete(CACHE_NAME);throw error;}
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 // Keep the preceding complete shell for tabs still running its versioned HTML.
 // Unrelated caches on this origin are never removed.
 event.waitUntil((async()=>{
  const names=(await caches.keys()).filter(k=>k.startsWith('ner-studio-pwa-')&&k!==CACHE_NAME);
  await Promise.all(names.slice(0,-1).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
async function shellResponse(request){
 const cache=await caches.open(CACHE_NAME);
 const url=new URL(request.url);
 if(request.mode==='navigate'){
  const page=await cache.match('./index.html');
  if(page)return page;
 }
 if(url.searchParams.has('v')){
  const exact=await cache.match(request)||await caches.match(request,{ignoreSearch:false});
  if(exact)return exact;
 }
 try{
  const response=await fetch(request,{cache:'no-store'});
  // API data is never cached; only static resources belong to this worker.
  if(response.ok)await cache.put(request,response.clone());
  return response;
 }catch(error){
  const cached=await cache.match(request,{ignoreSearch:false});
  if(cached)return cached;
  throw error;
 }
}
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith(shellResponse(event.request));
});

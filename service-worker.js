/* NER Studio PWA Service Worker 4.0.9
   Cache/offline/update only. No JavaScript concatenation, injection, rewriting,
   or runtime business logic. App behavior belongs to normal versioned files. */
const CACHE_NAME='ner-studio-pwa-4-0-9';
const CORE_SHELL=[
 './','./index.html','./styles.css?v=3.46.3','./manifest.webmanifest?v=2','./app-icon.svg?v=2',
 './app.js?v=3.50.1','./project-library.js?v=3.49.27','./project-locks.js?v=3.49.11',
 './video-modes.js?v=3.50.4','./smart-continue.js?v=3.50.9','./continuity-engine.js?v=1.0.4',
 './disaster-progression-engine.js?v=3.49.2','./public-health-policy.js?v=1.3.8',
 './halabja-p4-hotfix.js?v=1.0-direct','./halabja-event-panel-engine.js?v=1.0',
 './ner-core-4.js?v=4.0.0','./ner-stage-semantics-v4.js?v=4.0.0','./ner-family-planner-v4.js?v=4.0.0','./ner-core-bridge.js?v=4.0.1','./ner-semantic-guard-v4.js?v=4.0.4','./ner-human-life-engine.js?v=1.1.0',
 './ner-source-story-v4.js?v=4.0.0','./ner-project-store-v4.js?v=4.0.0','./ner-core-diagnostics.js?v=4.0.0','./ner-final-audit-v4.js?v=4.0.0'
];
self.addEventListener('install',event=>{
 self.skipWaiting();
 event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
  for(const url of CORE_SHELL){try{await cache.add(new Request(url,{cache:'reload'}));}catch(e){console.warn('Optional shell cache skipped',url,e);}}
 }));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function networkFirst(request){
 const cache=await caches.open(CACHE_NAME);
 try{
  const response=await fetch(request,{cache:'no-store'});
  if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
  return response;
 }catch(error){
  const cached=await cache.match(request,{ignoreSearch:false})||await caches.match(request,{ignoreSearch:true});
  if(cached)return cached;
  if(request.mode==='navigate')return cache.match('./index.html')||cache.match('./');
  throw error;
 }
}
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith(networkFirst(event.request));
});
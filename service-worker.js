const CACHE_NAME='ner-studio-pwa-3-50-4l';
const APP_SHELL=['./public-health-policy.js?v=1.3.5','./public-health-runtime-hotfix.js?v=1.0.0','./narration-import.js?v=1.0.3','./narration-smart-continue.js?v=1.0.14','./ld-story-format.js?v=1.1','./ai-drama.html','./anime-adventure.html','./fiction-core.js?v=1','./fiction-studio.js?v=1','./assets/thumbnail-design-4-approved.png','./title-recommendations.js?v=3.49.23','./youtube-analytics.html','./youtube-analytics.css?v=3.22.3','./youtube-analytics-core.js?v=3.22.3','./youtube-analytics.js?v=3.22.3','./','./index.html','./styles.css?v=3.46.3','./disaster-progression-engine.js?v=3.49.2','./app.js?v=3.50.1','./final-audit-fix.js?v=2.8','./backup-fix.js?v=2.7','./google-drive-backup.js?v=1.0.1','./project-library.js?v=3.49.12','./automation-assist.js?v=3.46.0','./wellington-avalanche-panels.js?v=1.1.2','./event-smart-narration.js?v=3.42.0','./static-smart-narration.js?v=3.49.6','./historical-context.js?v=3.42.0','./image-prompt-sync.js?v=3.42.0','./stage-fact-sync.js?v=3.20.1','./composition-lock.js?v=2.7','./event-visual-pack.js?v=3.1','./cyclone-visual-packs.js?v=3.3.1','./image-workspace.js?v=3.19.1','./ending-format-lock.js?v=3.49.35','./thumbnail-format-lock.js?v=3.42.1','./thumbnail-randomization.js?v=3.42.3','./hook-survival-lock.js?v=3.42.0','./visual-mode.js?v=3.42.0','./scene-variety-lock.js?v=3.42.0','./master-narration.js?v=3.49.35','./quality-polish-lock.js?v=3.42.0','./camera-motion-lock.js?v=3.42.0','./twist-hook-v3-14.js?v=3.17.0','./locust-laundry-hook.js?v=3.17.0','./cyclone-mahina-hook.js?v=3.20.6','./cyclone-nargis-hook.js?v=3.25.0','./tri-state-tornado-hook.js?v=3.39.3','./wellington-avalanche-hook.js?v=1.0','./hook-family-library.js?v=3.39.4-wellington1','./production-dna-engine.js?v=3.42.1','./continuity-engine.js?v=1.0.4','./video-modes.js?v=3.50.4','./hook-choice-system.js?v=3.49.21','./project-locks.js?v=3.49.11','./ai-assist.js?v=3.46.0','./smart-continue.js?v=3.50.9','./final-package.js?v=3.49.24','./manifest.webmanifest?v=2','./app-icon.svg?v=2'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

async function injectRuntimeHotfix(response){
  if(!response)return response;
  const type=String(response.headers.get('content-type')||'');
  if(!type.includes('text/html'))return response;
  const text=await response.text();
  const tag='<script src="./public-health-runtime-hotfix.js?v=1.0.0"></script>';
  const body=text.includes('public-health-runtime-hotfix.js')?text:text.replace('</body>',tag+'\n</body>');
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  const isNavigation=event.request.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
  if(isNavigation){
    event.respondWith(
      fetch(event.request,{cache:'reload'})
        .then(injectRuntimeHotfix)
        .catch(async()=>{
          const cached=await caches.match('./index.html');
          return cached?injectRuntimeHotfix(cached.clone()):Response.error();
        })
    );
    return;
  }

  event.respondWith(fetch(event.request,{cache:'reload'}).catch(()=>caches.match(event.request)));
});

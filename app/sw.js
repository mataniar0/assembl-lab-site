/* ASSEMBL LAB PWA shell — only public synthetic preview resources are cached.
 * Never cache private Auth/cloud pages or overwrite the home document on navigation.
 */
const CACHE = 'assemble-lab-android-v0.14.4-mode-selection';
const SHELL = [
  './','./index.html','./design-studio.js?v=mvp27-20261118','./nightstand-intent.js?v=mvp27-20261118','./return-3d.mjs?v=mvp27-20261118','./return-3d.css?v=mvp27-20261118','./showcase-glb.mjs','./realistic-glb.mjs','./personal-coffee-hero.mjs?v=mvp27-20261118','./photo-grounded-coffee-glb.mjs','./photo-grounded-coffee-glb.mjs?v=mvp27-20261118','./personal-coffee-hero.css?v=mvp27-20261118','./demo-room.css?v=mvp27-20261118',
  './assets/coffee-reference-room.webp','./assets/coffee-empty-room.webp','./mode-chooser.css?v=mvp28-20261118','./mode-chooser.js?v=mvp28-20261118','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './preview-lab.html','./preview-lab.css','./preview-lab.mjs','./preview-state.mjs',
  '../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',
  '../table/personal/media/personal-design-preview.glb',
  '../table/personal/media/01-hero-finished-angled-960.webp',
  '../assets/geometric-engineering-object-clean.webp',
  '../geometric/media/geometric-v11-design-only.glb',
  './concept-3d.html','./concept-3d.css','./concept-3d.mjs','./concept-geometry.mjs','./concept-export.mjs',
  './preview-fixtures/SC-01.png','./preview-fixtures/SC-02.png',
  './preview-fixtures/SC-04.png','./preview-fixtures/SC-07.png',
  './preview-fixtures/SC-10.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())
      if(key.startsWith('assemble-lab-android-')&&key!==CACHE)await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const scopePath=new URL(self.registration.scope).pathname;
  // A controlled app page may fetch the site's shared, pinned model-viewer
  // outside /app/. Only this exact same-origin vendor asset is cached offline.
  const vendorPath=new URL('../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',self.registration.scope).pathname;
  const sharedShowcaseAssets=new Set([
    '../table/personal/media/personal-design-preview.glb',
    '../table/personal/media/01-hero-finished-angled-960.webp',
    '../assets/geometric-engineering-object-clean.webp',
    '../geometric/media/geometric-v11-design-only.glb'
  ].map(rel=>new URL(rel,self.registration.scope).pathname));
  if(!url.pathname.startsWith(scopePath)&&url.pathname!==vendorPath&&
     !sharedShowcaseAssets.has(url.pathname))return;
  if(request.mode==='navigate'){
    const isHome=url.pathname===scopePath||url.pathname===scopePath+'index.html';
    if(!isHome){
      // Only exact public synthetic documents from SHELL can work offline.
      // Unknown destinations (including cloud Auth) never return the home page.
      event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
      return;
    }
    event.respondWith(fetch(request).then(async response=>{
      if(response.ok){
        // Keep the index cache index-only: not any other navigation response.
        const cache=await caches.open(CACHE);
        await cache.put('./index.html',response.clone());
      }
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});

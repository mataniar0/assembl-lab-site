/* ASSEMBL LAB PWA shell — only public synthetic preview resources are cached.
 * Never cache private Auth/cloud pages or overwrite the home document on navigation.
 */
const CACHE = 'assemble-lab-android-v0.8.0-realistic';
const SHELL = [
  './','./index.html','./nightstand-intent.js','./return-3d.mjs','./return-3d.css','./showcase-glb.mjs','./realistic-glb.mjs','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './preview-lab.html','./preview-lab.css','./preview-lab.mjs','./preview-state.mjs',
  '../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',
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
  if(!url.pathname.startsWith(scopePath)&&url.pathname!==vendorPath)return;
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

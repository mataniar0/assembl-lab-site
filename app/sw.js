/* APP-MOBILE-001 — same-scope offline shell. No customer photos stored here. */
const CACHE = 'assemble-lab-android-v0.3.0-cloud-lab';
const SHELL = ['./', './index.html', './nightstand-intent.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); });
self.addEventListener('activate', event => { event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('assemble-lab-android-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()); });
self.addEventListener('message', event => { if(event.data?.type==='SKIP_WAITING')self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  const path=new URL(request.url).pathname;
  if(!path.startsWith(new URL(self.registration.scope).pathname))return;
  if(request.mode==='navigate'){
    const scopePath=new URL(self.registration.scope).pathname;
    const isMainApp=path===scopePath||path===scopePath+'index.html';
    // Only the main PWA entry can be cached as index.html. Never cache the
    // authenticated cloud lab page as the offline home screen.
    if(isMainApp){
      event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}return response}).catch(()=>caches.match('./index.html')));return;
    }
    event.respondWith(fetch(request));return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});

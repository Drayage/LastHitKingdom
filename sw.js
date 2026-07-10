const CACHE='last-hit-kingdom-v0.1.0';
self.addEventListener('install',event=>{ self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./styles.css','./js/main.js']))); });
self.addEventListener('activate',event=>{ event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',event=>{ event.respondWith(fetch(event.request).then(r=>{ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy)); return r; }).catch(()=>caches.match(event.request))); });

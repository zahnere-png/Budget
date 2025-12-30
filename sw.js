const CACHE='budget-v1122-lts-20251230213017';
const ASSETS=['./','./index.html','./styles.css','./script.js','./manifest.webmanifest','./icons/zahnere-192.png','./icons/zahnere-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))) });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=> k!==CACHE).map(k=> caches.delete(k))))) });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request))) });

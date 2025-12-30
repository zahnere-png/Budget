const CACHE='budget-v113-full-cache';
const ASSETS=['./','./index.html','./styles.css','./script.js','./manifest.webmanifest','./icons/zahnere-192.png','./icons/zahnere-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))) });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request))) });

const CACHE_NAME = 'party-games-v4';
const ASSETS_TO_CACHE = [
  '/GameParty/index.html',
  '/GameParty/icono.png',
  '/GameParty/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim();
});
```

---

## 2. Activar GitHub Pages

- Ve a **Settings** (pestaña arriba en el repo)
- Menú izquierdo → **Pages**
- En *Source* selecciona **Deploy from a branch**
- Branch: **main** / carpeta: **/ (root)**
- Clic en **Save**

En 1-2 minutos tu app estará en:
```
https://chismeh32-jpg.github.io/GameParty/

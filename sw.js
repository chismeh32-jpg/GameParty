// Este archivo sustituye al service worker de la antigua app "Party Games".
// Los móviles que la tenían instalada lo descargarán, borrarán la caché vieja,
// se darán de baja y recargarán la página para mostrar la granja.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});

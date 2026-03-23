/**
 * sw.js — Service Worker Kill-Switch
 *
 * This file exists to unregister any previously installed Workbox service worker
 * and clear all caches. The old SW (from a previous deploy) may be serving stale
 * cached files with outdated chunk hashes, causing a blank white page.
 *
 * When the old SW polls for updates, it fetches this file. The new SW installs,
 * calls skipWaiting() to take over immediately, clears all caches, unregisters
 * itself, and forces a page reload so the browser fetches fresh assets from the network.
 */

self.addEventListener('install', (event) => {
  // Take over immediately without waiting for old SW to finish
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear ALL caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // Claim all clients so this SW controls them immediately
      await clients.claim();

      // Unregister this SW so it doesn't intercept future requests
      await self.registration.unregister();

      // Force all controlled pages to reload so they get fresh assets from network
      const allClients = await clients.matchAll({ type: 'window' });
      for (const client of allClients) {
        client.navigate(client.url);
      }
    })()
  );
});

// Incrementar esta versión al publicar una actualización que cambie recursos precacheados.
const CACHE = 'krono-v3'
const APP_SHELL = [
  '/', '/index.html', '/manifest.webmanifest', '/krono-icon.svg',
  '/sounds/default/get_ready.mp3', '/sounds/default/start.mp3', '/sounds/default/rest.mp3',
]

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)))
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  // La comprobación de versión nunca se guarda: debe llegar al servidor.
  if (url.searchParams.has('__pwa_update_check')) {
    event.respondWith(fetch(event.request))
    return
  }
  // El documento siempre busca red primero para descubrir el bundle publicado.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone()
      caches.open(CACHE).then(cache => cache.put(event.request, copy))
      return response
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html'))))
    return
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone()
    caches.open(CACHE).then(cache => cache.put(event.request, copy))
    return response
  }).catch(() => caches.match('/index.html'))))
})

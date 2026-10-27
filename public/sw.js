// Incrementar esta versión al publicar una actualización que cambie recursos precacheados.
const CACHE = 'krono-v5'
const APP_SHELL = [
  '/', '/index.html', '/manifest.webmanifest', '/krono-icon.svg',
  '/sounds/default/get_ready.mp3', '/sounds/default/start.mp3', '/sounds/default/rest.mp3',
]

self.addEventListener('install', event => {
  // Un recurso opcional no debe impedir que una versión nueva quede esperando.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).catch(error => console.warn('No se pudo precachear el shell.', error)))
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
    event.respondWith(fetch(event.request).then(response => cacheResponse(event.request, response)).catch(() => offlineDocument(event.request)))
    return
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => cacheResponse(event.request, response)).catch(() => new Response('', { status: 503, statusText: 'Offline' }))))
})

async function cacheResponse(request, response) {
  // Cache.put rechaza respuestas parciales/opacas; nunca dejamos que ese fallo
  // rompa la respuesta que se entrega al navegador.
  if (response.ok && response.type === 'basic') {
    try { await (await caches.open(CACHE)).put(request, response.clone()) }
    catch (error) { console.warn('No se pudo guardar un recurso en caché.', error) }
  }
  return response
}

async function offlineDocument(request) {
  return await caches.match(request) || await caches.match('/index.html') || new Response('Sin conexión', { status: 503, statusText: 'Offline' })
}

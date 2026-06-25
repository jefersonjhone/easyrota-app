self.addEventListener('install', (event) => {
  const toCache = [
    '/app/',
    '/manifest.webmanifest',
    '/logo-colorful.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-192.png',
    '/icons/maskable-512.png',
  ]

  event.waitUntil(
    caches.open('easyrota-app-v1')
      .then((cache) =>  cache.addAll(toCache))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => 
          cacheName.startsWith('easyrota-') && cacheName !== 'easyrota-app-v1')
        .map((cacheName) => caches.delete(cacheName))
    ))
    .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname === '/' || url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    if (!url.pathname.startsWith('/app')) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open('easyrota-app-v1')
            .then((cache) => {cache.put(request, responseClone)})
          return response
        })
        .catch(async () => {
            const cachedResponse = await caches.match(request);
            return cachedResponse || caches.match('/app/');
        })
    )
    return
  }

  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/logo-colorful.svg'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open('easyrota-app-v1')
            .then((cache) => {cache.put(request, responseClone)})
          return response
        })
      })
    )
  }
})

self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Event received.')
    let data = {}
    try {
        data = event.data ? event.data.json() : {}
        console.log('[Service Worker] Push Data:', data)
    } catch (e) {
        console.error('[Service Worker] Error parsing push data:', e)
        data = { body: event.data ? event.data.text() : 'No payload' }
    }

    const title = data.head || data.title || "EasyRota"
    const options = {
        body: data.body || "Você tem uma nova atualização.",
        icon: '/logo-colorful.svg',
        badge: '/logo-colorful.svg',
        data: { url: data.url || '/app/' }
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => console.log('[Service Worker] Notification displayed successfully.'))
            .catch(err => console.error('[Service Worker] Error displaying notification:', err))
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    event.waitUntil(clients.openWindow(event.notification.data.url))
})

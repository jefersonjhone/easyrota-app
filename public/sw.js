// public/sw.js
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Event received.');
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
        console.log('[Service Worker] Push Data:', data);
    } catch (e) {
        console.error('[Service Worker] Error parsing push data:', e);
        data = { body: event.data ? event.data.text() : 'No payload' };
    }

    const title = data.head || data.title || "EasyRota";
    const options = {
        body: data.body || "Você tem uma nova atualização.",
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { url: data.url || '/' }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => console.log('[Service Worker] Notification displayed successfully.'))
            .catch(err => console.error('[Service Worker] Error displaying notification:', err))
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
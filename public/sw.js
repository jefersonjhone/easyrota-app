// public/sw.js
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.head || data.title || "EasyRota";
    const options = {
        body: data.body || "Você tem uma nova atualização.",
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { url: data.url || '/' }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
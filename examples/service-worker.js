self.addEventListener('push', (event) => {
  if (!event.data) return;

  const options = {
    body: event.data.text(),
    icon: 'path/to/icon.png',
    badge: 'path/to/badge.png'
  };

  event.waitUntil(
    self.registration.showNotification('Push Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Handle notification click
  event.waitUntil(
    clients.openWindow('/')
  );
});
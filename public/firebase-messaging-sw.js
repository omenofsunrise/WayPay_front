// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Конфигурация Firebase (используй те же данные, что и в основном приложении)
firebase.initializeApp({
  apiKey: "AIzaSyB1-4uJEWVDwEKjrMYtHzWZjtjoCp1EMV4",
  authDomain: "waypayclient.firebaseapp.com",
  projectId: "waypayclient",
  storageBucket: "waypayclient.firebasestorage.app",
  messagingSenderId: "436453303070",
  appId: "1:436453303070:web:9ca003ab67667bd677df0f"
});

const messaging = firebase.messaging();

// Обработка фоновых сообщений (когда приложение закрыто)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Новое уведомление';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data || {}
  };

  // Показываем уведомление
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.route || 
                   event.notification.data?.url || 
                   '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Ищем открытую вкладку с нашим сайтом
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Открываем новую вкладку если не нашли открытую
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
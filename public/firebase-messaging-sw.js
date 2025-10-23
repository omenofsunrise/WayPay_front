importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[SW] ✅ Service Worker запущен', self.location.origin);

const firebaseConfig = {
  apiKey: "AIzaSyB1-4uJEWVDwEKjrMYtHzWZjtjoCp1EMV4",
  authDomain: "waypayclient.firebaseapp.com",
  projectId: "waypayclient",
  storageBucket: "waypayclient.firebasestorage.app",
  messagingSenderId: "436453303070",
  appId: "1:436453303070:web:9ca003ab67667bd677df0f"
};

try {
  console.log('[SW] 🚀 Инициализируем Firebase...');
  firebase.initializeApp(firebaseConfig);
  
  const messaging = firebase.messaging();
  console.log('[SW] ✅ Firebase Messaging инициализирован');

  // Обработка фоновых сообщений
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 📨 Получено фоновое сообщение:', payload);
    
    if (!payload.notification) {
      console.log('[SW] ❌ Уведомление отсутствует в payload');
      return;
    }

    const notificationTitle = payload.notification.title || 'Новое уведомление';
    const notificationOptions = {
      body: payload.notification.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: payload.notification.image,
      data: payload.data || {},
      tag: 'fcm-background-notification',
      requireInteraction: true, // Уведомление не закроется автоматически
      silent: false,
      actions: [
        {
          action: 'open',
          title: 'Открыть'
        },
        {
          action: 'close',
          title: 'Закрыть'
        }
      ]
    };

    console.log('[SW] 🎯 Показываем уведомление:', notificationTitle);
    
    return self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[SW] ✅ Уведомление успешно показано');
      })
      .catch(error => {
        console.error('[SW] ❌ Ошибка показа уведомления:', error);
      });
  });

} catch (error) {
  console.error('[SW] ❌ Критическая ошибка инициализации:', error);
}

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🖱️ Клик по уведомлению:', event.notification);
  event.notification.close();

  const urlToOpen = event.notification.data?.route || self.location.origin + '/';

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((windowClients) => {
      console.log('[SW] Найдено окон:', windowClients.length);
      
      // Ищем открытую вкладку с нашим приложением
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('[SW] Фокусируем существующее окно:', client.url);
          return client.focus();
        }
      }
      
      // Открываем новую вкладку
      console.log('[SW] Открываем новое окно:', urlToOpen);
      return clients.openWindow(urlToOpen);
    })
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 📪 Уведомление закрыто:', event.notification);
});

// События жизненного цикла
self.addEventListener('install', (event) => {
  console.log('[SW] ✅ Service Worker установлен');
  self.skipWaiting(); // Активируем сразу
});

self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service Worker активирован');
  event.waitUntil(self.clients.claim()); // Контролируем все клиенты сразу
});

console.log('[SW] 🎉 Service Worker полностью настроен и готов');
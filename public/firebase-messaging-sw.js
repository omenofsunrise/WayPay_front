// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[SW] Service Worker запущен');

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB1-4uJEWVDwEKjrMYtHzWZjtjoCp1EMV4",
  authDomain: "waypayclient.firebaseapp.com",
  projectId: "waypayclient",
  storageBucket: "waypayclient.firebasestorage.app",
  messagingSenderId: "436453303070",
  appId: "1:436453303070:web:9ca003ab67667bd677df0f"
};

console.log('[SW] Инициализируем Firebase...');
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
console.log('[SW] Firebase Messaging инициализирован');

// Обработка фоновых сообщений
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📨 Получено фоновое сообщение:', payload);
  console.log('[SW] Данные уведомления:', payload.notification);
  console.log('[SW] Дополнительные данные:', payload.data);

  const notificationTitle = payload.notification?.title || 'Новое уведомление';
  const notificationOptions = {
    body: payload.notification?.body || 'Тело уведомления',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data || {},
    requireInteraction: false, // Измени на false для автоматического закрытия
    tag: 'fcm-notification', // Добавляем тег для группировки
    silent: false // Убедимся что звук есть
  };

  console.log('[SW] Пытаемся показать уведомление:', notificationTitle);
  
  // Показываем уведомление
  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[SW] ✅ Уведомление успешно показано');
    })
    .catch(error => {
      console.error('[SW] ❌ Ошибка показа уведомления:', error);
    });
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🖱️ Клик по уведомлению:', event.notification);
  event.notification.close();

  const urlToOpen = event.notification.data?.route || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        console.log('[SW] Найдено окон:', windowClients.length);
        
        // Ищем открытую вкладку
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin)) {
            console.log('[SW] Найдено существующее окно, фокусируем...');
            return client.focus();
          }
        }
        
        // Открываем новую вкладку
        console.log('[SW] Открываем новое окно:', urlToOpen);
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Логирование событий Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] ✅ Service Worker установлен');
  self.skipWaiting(); // Активируем сразу
});

self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service Worker активирован');
  return self.clients.claim();
});

console.log('[SW] Service Worker полностью настроен');
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { firebaseApp } from './config';

// Проверяем поддержку браузером
export const isMessagingSupported = async (): Promise<boolean> => {
  try {
    const supported = await isSupported();
    console.log('📱 Firebase Messaging поддерживается:', supported);
    return supported;
  } catch (error) {
    console.error('❌ Ошибка проверки поддержки Messaging:', error);
    return false;
  }
};

export const messaging = getMessaging(firebaseApp);
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

console.log('🔑 VAPID Key loaded:', !!VAPID_KEY);

export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('1. 🔐 Запрашиваем разрешение на уведомления...');
    const permission = await Notification.requestPermission();
    console.log('2. 📋 Результат разрешения:', permission);
    
    if (permission === 'granted') {
      console.log('3. 🎯 Получаем FCM токен...');
      const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY 
      });
      
      if (currentToken) {
        console.log('4. ✅ FCM Token получен:', currentToken.substring(0, 20) + '...');
        return currentToken;
      } else {
        console.log('4. ❌ Токен не получен - возможно проблема с Service Worker');
        return null;
      }
    } else {
      console.log('3. ❌ Разрешение не получено:', permission);
      return null;
    }
  } catch (error) {
    console.error('❌ Критическая ошибка при получении токена:', error);
    return null;
  }
};

// Обработка сообщений когда приложение активно
export const onForegroundMessage = (callback: (payload: any) => void) => {
  console.log('🔔 Подписываемся на foreground сообщения...');
  
  return onMessage(messaging, (payload) => {
    console.log('📨 Foreground message received:', payload);
    
    // Всегда показываем уведомление в foreground
    if (payload.notification) {
      console.log('🎯 Показываем браузерное уведомление...');
      showBrowserNotification(
        payload.notification.title,
        payload.notification.body,
        payload.data
      );
    }
    
    callback(payload);
  });
};

// Функция показа браузерного уведомления
export const showBrowserNotification = (title: string, body: string, data?: any) => {
  console.log('🔔 Создаем браузерное уведомление:', { title, body, data });
  
  if (Notification.permission !== 'granted') {
    console.log('❌ Нет разрешения на уведомления');
    return;
  }

  const options: NotificationOptions = {
    body: body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data || {},
    tag: 'foreground-notification'
  };
  
  try {
    const notification = new Notification(title, options);
    console.log('✅ Браузерное уведомление создано');
    
    notification.onclick = (event) => {
      console.log('🖱️ Клик по foreground уведомлению');
      event.preventDefault();
      notification.close();
      
      const urlToOpen = data?.route || data?.url || '/';
      window.focus();
      if (urlToOpen !== window.location.pathname) {
        window.location.href = urlToOpen;
      }
    };
    
    // Закрываем через 7 секунд
    setTimeout(() => {
      notification.close();
      console.log('⏰ Уведомление закрыто по таймеру');
    }, 7000);
    
    return notification;
  } catch (error) {
    console.error('❌ Ошибка создания уведомления:', error);
  }
};
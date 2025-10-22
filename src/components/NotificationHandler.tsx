import React, { useEffect, useState } from 'react';
import { onForegroundMessage, isMessagingSupported } from '../firebase/messaging';

const NotificationHandler: React.FC = () => {
  const [status, setStatus] = useState<string>('Инициализация...');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupNotifications = async () => {
      try {
        setStatus('Проверяем поддержку браузера...');
        
        // Проверяем поддержку
        const supported = await isMessagingSupported();
        if (!supported) {
          setStatus('❌ Браузер не поддерживает Firebase Messaging');
          return;
        }

        setStatus('Настраиваем обработку уведомлений...');
        
        // Подписываемся на уведомления
        unsubscribe = onForegroundMessage((payload) => {
          console.log('🎯 Уведомление получено в активном приложении:', payload);
          setStatus(`📨 Получено уведомление: ${payload.notification?.title}`);
          
          // Можно показать toast или другое UI уведомление
          showCustomToast(payload.notification);
        });

        setStatus('✅ Обработчик уведомлений настроен');
        
      } catch (error) {
        console.error('❌ Ошибка настройки уведомлений:', error);
        setStatus(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    setupNotifications();

    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('🔕 Отписались от уведомлений');
      }
    };
  }, []);

  const showCustomToast = (notification: any) => {

};

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f8f9fa',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      border: '1px solid #dee2e6',
      maxWidth: '300px'
    }}>
      <strong>FCM Status:</strong> {status}
    </div>
  );
};

export default NotificationHandler;
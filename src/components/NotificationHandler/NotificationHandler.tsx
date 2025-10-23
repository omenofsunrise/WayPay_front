import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { onForegroundMessage, isMessagingSupported } from '../../firebase/messaging';

const NotificationsContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
`;

const NotificationToast = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  cursor: pointer;
  border-left: 4px solid #007bff;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const NotificationTitle = styled.span`
  font-weight: 600;
  font-size: 20px;
  color: #212529;
`;

const NotificationClose = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  font-weight: bold;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: #f8f9fa;
    color: #495057;
  }
`;

const NotificationBody = styled.div`
  color: #495057;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
`;

const NotificationTime = styled.div`
  color: #6c757d;
  font-size: 12px;
  text-align: right;
`;

const NotificationHandler: React.FC = () => {
  const [status, setStatus] = useState<string>('Инициализация...');
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    title: string;
    body: string;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupNotifications = async () => {
      try {
        setStatus('Проверяем поддержку браузера...');
        
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
          
          // Показываем кастомное уведомление
          showCustomNotification(payload.notification);
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

  const showCustomNotification = (notification: any) => {
    if (!notification) return;

    const newNotification = {
      id: Date.now(),
      title: 'vze)))',
      body: notification.body || '',
      timestamp: new Date()
    };

    // Добавляем уведомление в список
    setNotifications(prev => [newNotification, ...prev]);

  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <>
      <NotificationsContainer>
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id} 
            onClick={() => removeNotification(notification.id)}
          >
            <NotificationHeader>
              <NotificationTitle>{notification.title}</NotificationTitle>
              <NotificationClose
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
              >
                ×
              </NotificationClose>
            </NotificationHeader>
            <NotificationBody>
              {notification.body}
            </NotificationBody>
            <NotificationTime>
              {formatTime(notification.timestamp)}
            </NotificationTime>
          </NotificationToast>
        ))}
      </NotificationsContainer>
    </>
  );
};

export default NotificationHandler;
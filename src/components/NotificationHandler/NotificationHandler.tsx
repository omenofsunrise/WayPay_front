import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { onForegroundMessage, isMessagingSupported } from '../../firebase/messaging';

const NotificationsContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  max-height: 100px;
  flex-direction: column;
`;

const NotificationToast = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 300px;
  max-width: 500px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.98);
  }
`;

const NotificationImage = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  display: flex;
  gap: 4px;
  min-width: 0;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
`;

const NotificationTitle = styled.span`
  font-weight: 600;
  font-size: 16px;
  color: #212529;
  line-height: 1.2;
`;

const NotificationTime = styled.div`
  color: #6c757d;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 30px;
`;

const NotificationBody = styled.div`
  color: #495057;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  text-align: left;
`;

const PLACEHOLDER_IMAGE = 'https://lets-digit.ru/Resourses/Logos/logo.png';

const NotificationHandler: React.FC = () => {
  const [status, setStatus] = useState<string>('Инициализация...');
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    title: string;
    body: string;
    image?: string;
    timestamp: Date;
  }>>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

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
        
        unsubscribe = onForegroundMessage((payload) => {
          console.log('🎯 Уведомление получено в активном приложении:', payload);
          setStatus(`📨 Получено уведомление: ${payload.notification?.title}`);
          
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

  // Эффект для обновления времени каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => [...prev]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const playNotificationSound = () => {
    if (!isSoundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
    } catch (error) {
      console.warn('Не удалось воспроизвести звук уведомления:', error);
    }
  };

  const showCustomNotification = (notification: any) => {
    if (!notification) return;

    playNotificationSound();

    const newNotification = {
      id: Date.now(),
      title: notification.title || 'vze)))',
      body: notification.body || '',
      image: notification.image || PLACEHOLDER_IMAGE,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInSeconds < 10) {
      return 'только что';
    } else if (diffInSeconds < 60) {
      return 'меньше минуты назад';
    } else if (diffInMinutes === 1) {
      return 'минуту назад';
    } else if (diffInMinutes < 5) {
      return `${diffInMinutes} минуты назад`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} минут назад`;
    } else if (diffInHours === 1) {
      return 'час назад';
    } else if (diffInHours < 24) {
      return `${diffInHours} часа назад`;
    } else {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const extractImageFromPayload = (payload: any): string | undefined => {
    // Пробуем разные возможные пути к изображению в payload Firebase
    if (payload.notification?.image) {
      return payload.notification.image;
    }
    
    if (payload.data?.image) {
      return payload.data.image;
    }
    
    if (payload.fcmOptions?.image) {
      return payload.fcmOptions.image;
    }
    
    if (payload.data?.fcm_options?.image) {
      return payload.data.fcm_options.image;
    }
    
    // Для кастомных уведомлений
    if (payload.data?.notification?.image) {
      return payload.data.notification.image;
    }
    
    console.log('🔍 Детали payload для отладки:', {
      notification: payload.notification,
      data: payload.data,
      fcmOptions: payload.fcmOptions
    });
    
    return undefined;
  };

  return (
    <>
      <NotificationsContainer>
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id} 
            onClick={() => removeNotification(notification.id)}
          >
<NotificationImage>
              <img 
                src={notification.image || PLACEHOLDER_IMAGE} 
                alt="Notification"
                onError={(e) => {
                  console.warn('❌ Ошибка загрузки изображения:', notification.image, 'используем заглушку');
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
                onLoad={() => {
                  console.log('✅ Изображение загружено успешно:', notification.image);
                }}
              />
            </NotificationImage>
            
            <NotificationContent>
              <NotificationHeader>
                <NotificationTitle>{notification.title}</NotificationTitle>
                <NotificationBody>
                  {notification.body}
                </NotificationBody>
              </NotificationHeader>

              <NotificationTime>
                  {formatRelativeTime(notification.timestamp)}
              </NotificationTime>
            </NotificationContent>
          </NotificationToast>
        ))}
      </NotificationsContainer>
    </>
  );
};

export default NotificationHandler;
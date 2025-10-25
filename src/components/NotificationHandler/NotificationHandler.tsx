import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useWebSocket } from '../../api/hooks/useWebSocket';
import { formatRelativeTime } from '../../utils/dateFormatter';
import useNotification from '../../api/hooks/useNotification';
import { getShowContractCreationNotificationSetting } from '../modal/SettingsModal';
import { generateAvatar, getInitials } from '../../utils/avatarUtils';

const NotificationsContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  gap: 10px;
  flex-direction: column;
  pointer-events: none;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
    align-items: center;
  }
`;

const NotificationToast = styled.div<{ isLeaving: boolean }>`
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
  pointer-events: auto;
  transform: ${props => props.isLeaving ? 'translateX(100%)' : 'translateX(0)'};
  opacity: ${props => props.isLeaving ? 0 : 1};
  
  &:hover {
    transform: ${props => props.isLeaving ? 'translateX(100%)' : 'translateY(-2px)'};
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.98);
  }

  @media (max-width: 768px) {
    min-width: unset;
    width: 100%;
    max-width: 400px;
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
  background: #f8f9fa;
  
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
  flex: 1;
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

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 4px;
  margin: -4px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-bottom: auto;

  &:hover {
    color: #666;
    background: rgba(0, 0, 0, 0.05);
  }
`;

const PLACEHOLDER_IMAGE = 'https://lets-digit.ru/Resourses/Logos/WayPay.svg';

interface Notification {
  id: number;
  title: string;
  body: string;
  image?: string;
  timestamp: Date;
  route?: string;
  isRead: boolean;
  type?: string;
}

const NotificationHandler: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [closingNotifications, setClosingNotifications] = useState<Set<number>>(new Set());
  const [avatarCache, setAvatarCache] = useState<Map<number, string>>(new Map());
  const nextIdRef = React.useRef(1);
  
  const { getMyNotifications, ReadNotification } = useNotification();

  useEffect(() => {
    const loadInitialNotifications = async () => {
      console.log('📥 Загрузка непрочитанных уведомлений...');
      try {
        const result = await getMyNotifications({
          page: 1,
          pageSize: 10,
          sortDirection: 'desc'
        });
        
        if (result && result.items) {
          const unreadNotifications = result.items
            .filter(item => !item.isRead)
            .map(item => ({
              id: item.id,
              title: item.title,
              body: item.message,
              image: item.senderAvatarPath,
              timestamp: new Date(item.dateTime),
              isRead: item.isRead,
              type: item.type
            }));
          
          console.log(`✅ Загружено ${unreadNotifications.length} непрочитанных уведомлений`);
          setNotifications(unreadNotifications);
        }
      } catch (error) {
        console.error('❌ Ошибка при загрузке уведомлений:', error);
      }
    };

    loadInitialNotifications();
  }, [getMyNotifications]);

  const handleNewNotification = useCallback((message: any) => {
    console.log(`${message}`);

    const showContractCreation = getShowContractCreationNotificationSetting();
    if (!showContractCreation && message.Type === 'credit') {
      return;
    }

    console.log('🎯 New notification received:', message);
    
    const newNotification: Notification = {
      id: nextIdRef.current++,
      title: message.Title,
      body: message.Body,
      image: message.Image,
      route: message.Route,
      timestamp: new Date(message.Timestamp || Date.now()),
      isRead: false,
      type: message.type
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 5);
      console.log('📋 Notifications updated:', updated);
      return updated;
    });

  }, []);

  const handleWebSocketError = useCallback((error: Event) => {
    console.error('💥 WebSocket error in component:', error);
  }, []);

  useWebSocket({
    onNotification: handleNewNotification,
    onError: handleWebSocketError
  });

  const removeNotification = (id: number) => {
    setClosingNotifications(prev => new Set(prev).add(id));
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      setClosingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      // Очищаем кэш аватара при удалении уведомления
      setAvatarCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(id);
        return newCache;
      });
    }, 300);
  };

  const handleNotificationClick = async (notification: Notification) => {
    console.log('🖱️ Notification clicked:', notification);
    
    if (!notification.isRead) {
      try {
        await ReadNotification(notification.id);
        console.log('✅ Уведомление помечено как прочитанное');
      } catch (error) {
        console.error('❌ Ошибка при отметке уведомления как прочитанного:', error);
      }
    }
    
    if (notification.route) {
      console.log('🔗 Navigating to:', notification.route);
      window.location.href = notification.route;
    }
    
    removeNotification(notification.id);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, notification: Notification) => {
    console.warn('❌ Ошибка загрузки изображения:', notification.image, 'генерируем аватар');
    
    // Генерируем аватар на основе заголовка уведомления
    const initials = getInitials(notification.title);
    const generatedAvatar = generateAvatar(initials, 100);
    
    // Сохраняем сгенерированный аватар в кэш
    setAvatarCache(prev => new Map(prev).set(notification.id, generatedAvatar));
    
    // Обновляем src изображения
    e.currentTarget.src = generatedAvatar;
  };

  const handleImageLoad = (notification: Notification) => {
    console.log('✅ Изображение загружено успешно:', notification.image);
  };

  // Функция для получения URL изображения с учетом кэша
  const getNotificationImage = (notification: Notification): string => {
    // Если есть сгенерированный аватар в кэше, используем его
    if (avatarCache.has(notification.id)) {
      return avatarCache.get(notification.id)!;
    }
    
    // Если есть оригинальное изображение, используем его
    if (notification.image) {
      return notification.image;
    }
    
    // Если нет изображения, генерируем аватар на основе заголовка
    const initials = getInitials(notification.title);
    return generateAvatar(initials, 100);
  };
  
  const unreadNotifications = notifications.filter(notification => {
    if (!notification.isRead) {
      const showContractCreation = getShowContractCreationNotificationSetting();
      if (showContractCreation) {
        return true;
      } else {
        return notification.type !== 'credit';
      }
    }
    return false;
  });

  return (
    <NotificationsContainer>
      {unreadNotifications.map(notification => (
        <NotificationToast
          key={notification.id}
          isLeaving={closingNotifications.has(notification.id)}
          onClick={() => handleNotificationClick(notification)}
        >
          <NotificationImage>
            <img 
              src={getNotificationImage(notification)}
              alt="Notification"
              onError={(e) => handleImageError(e, notification)}
              onLoad={() => handleImageLoad(notification)}
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

          <CloseButton 
            onClick={(e) => {
              ReadNotification(notification.id);
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            title="Закрыть"
          >
            ×
          </CloseButton>
        </NotificationToast>
      ))}
    </NotificationsContainer>
  );
};

export default NotificationHandler;
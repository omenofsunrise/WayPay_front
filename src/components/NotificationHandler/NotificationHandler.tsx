import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useWebSocket } from '../../api/hooks/useWebSocket';

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
  
  &:hover {
    color: #666;
    background: rgba(0, 0, 0, 0.05);
  }
`;

const PLACEHOLDER_IMAGE = 'https://lets-digit.ru/Resourses/Logos/logo.png';

interface Notification {
  id: number;
  title: string;
  body: string;
  image?: string;
  timestamp: Date;
  route?: string;
}

const NotificationHandler: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [closingNotifications, setClosingNotifications] = useState<Set<number>>(new Set());
  const nextIdRef = React.useRef(1);

  const handleNewNotification = useCallback((message: any) => {
    console.log('🎯 New notification received:', message);
    
    const newNotification: Notification = {
      id: nextIdRef.current++,
      title: message.Title,
      body: message.Body,
      image: message.Image,
      route: message.Route,
      timestamp: new Date(message.Timestamp || Date.now())
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
    }, 300);
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('🖱️ Notification clicked:', notification);
    
    if (notification.route) {
      console.log('🔗 Navigating to:', notification.route);
      window.location.href = notification.route;
    }
    
    removeNotification(notification.id);
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, notification: Notification) => {
    console.warn('❌ Ошибка загрузки изображения:', notification.image, 'используем заглушку');
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  };

  const handleImageLoad = (notification: Notification) => {
    console.log('✅ Изображение загружено успешно:', notification.image);
  };

  return (
    <NotificationsContainer>
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          isLeaving={closingNotifications.has(notification.id)}
          onClick={() => handleNotificationClick(notification)}
        >
          <NotificationImage>
            <img 
              src={notification.image || PLACEHOLDER_IMAGE} 
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
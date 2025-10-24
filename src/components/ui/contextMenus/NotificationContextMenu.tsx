import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import useNotification from '../../../api/hooks/useNotification';
import type { NotificationResponse } from '../../../api/types/notification';
import { formatRelativeTime } from '../../../utils/dateFormatter';

interface NotificationContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
}

const NotificationContextMenu: React.FC<NotificationContextMenuProps> = ({
  isOpen,
  onClose,
  anchorElement
}) => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getMyNotifications } = useNotification();

  // Сбрасываем состояние при закрытии
  useEffect(() => {
    if (!isOpen) {
      setNotifications([]);
      setCurrentPage(1);
      setHasMore(true);
    }
  }, [isOpen]);

  // Загружаем уведомления при открытии
  useEffect(() => {
    if (isOpen && hasMore && !isLoading) {
      loadNextPage();
    }
  }, [isOpen, hasMore, isLoading]);

  // Загружаем следующую страницу через небольшую задержку после предыдущей
  useEffect(() => {
    if (isOpen && hasMore && !isLoading && currentPage > 1) {
      const timer = setTimeout(() => {
        loadNextPage();
      }, 500); // Задержка 500мс между загрузками
        
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasMore, isLoading, currentPage]);

  const loadNextPage = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    try {
      const result = await getMyNotifications({
        page: currentPage,
        pageSize: 10,
        sortDirection: 'desc'
      });

      if (result?.items) {
        setNotifications(prev => [...prev, ...result.items]);
        
        // Проверяем, есть ли еще страницы
        if (result.items.length < 10 || currentPage >= 10) { // Ограничиваем максимум 10 страниц
          setHasMore(false);
        } else {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getPosition = () => {
    if (!anchorElement) return { top: 60, right: 50 };
    
    const rect = anchorElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    return {
      top: rect.bottom + scrollTop + 5,
      right: window.innerWidth - rect.right
    };
  };

  if (!isOpen) return null;

  const position = getPosition();

  return (
    <MenuContainer 
      ref={menuRef} 
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`
      }}
    >
      <MenuHeader>
        <MenuTitle>Уведомления</MenuTitle>
        {isLoading && <LoadingText>Загрузка...</LoadingText>}
      </MenuHeader>
      
      <NotificationsList>
        {notifications.length === 0 && !isLoading ? (
          <EmptyState>Нет новых уведомлений</EmptyState>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem key={notification.id}>
                <NotificationAvatar 
                  src={notification.senderAvatarPath} 
                  alt="Avatar"
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
                <NotificationContent>
                  <NotificationHeader>
                    <NotificationTitle>{notification.title}</NotificationTitle>
                    <NotificationDate>
                      {formatRelativeTime(notification.dateTime)}
                    </NotificationDate>
                  </NotificationHeader>

                  <NotificationMessage>{notification.message}</NotificationMessage>
                </NotificationContent>
              </NotificationItem>
            ))}
            
            {isLoading && (
              <LoadingState>Загружаем еще уведомления...</LoadingState>
            )}
          </>
        )}
      </NotificationsList>
    </MenuContainer>
  );
};

const MenuContainer = styled.div`
  position: absolute;
  width: 380px;
  max-height: 500px;
  background: white;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MenuHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid rgba(209, 213, 219, 0.5);
  background: rgba(249, 250, 250, 1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MenuTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
`;

const LoadingText = styled.span`
  font-size: 12px;
  color: rgba(107, 114, 128, 1);
`;

const NotificationsList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
`;

const LoadingState = styled.div`
  padding: 16px 20px;
  text-align: center;
  color: rgba(107, 114, 128, 1);
  font-size: 14px;
  border-top: 1px solid rgba(209, 213, 219, 0.3);
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: rgba(107, 114, 128, 1);
  font-size: 14px;
`;

const NotificationItem = styled.div`
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(209, 213, 219, 0.3);
  transition: background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: rgba(249, 250, 250, 1);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  cursor: pointer;
`;

const NotificationAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  object-fit: cover;
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  margin-bottom: 4px;
  line-height: 1.2;
  text-align: left;
`;

const NotificationMessage = styled.div`
  font-size: 13px;
  color: rgba(107, 114, 128, 1);
  margin-bottom: 6px;
  line-height: 1.3;
  word-wrap: break-word;
  text-align: left;
`;

const NotificationDate = styled.div`
  font-size: 12px;
  color: rgba(156, 163, 175, 1);
  text-align: right;
  margin-left: auto;
`;

export default NotificationContextMenu;
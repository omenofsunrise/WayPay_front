import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import CalculatorIcon from '../../../assets/ui/TopBar/calculator.svg';
import ChatIcon from '../../../assets/ui/TopBar/chat.svg';
import TodoIcon from '../../../assets/ui/TopBar/to_do.svg';
import BlogIcon from '../../../assets/ui/TopBar/blog.svg';
import newCreditIcon from '../../../assets/ui/TopBar/newCredit.svg';
import SettingsIcon from '../../../assets/ui/TopBar/settings.svg';
import BellIcon from '../../../assets/ui/TopBar/bell.svg';
import { SideMenuContext } from './SideMenuContext';
import { useNavigate, useLocation } from 'react-router-dom';
import CalculatorModal from '../../modal/CalculatorModal';
import SettingsModal from '../../modal/SettingsModal';
import { useAuth } from '../../../сontext/AuthContext';
import type { Permission, Role } from '../../../api/types/auth';
import useTask from '../../../api/hooks/useTask';
import { useTaskCount } from '../../../сontext/TaskCountContext';
import useChat from '../../../api/hooks/useChat';
import NotificationContextMenu from '../../ui/contextMenus/NotificationContextMenu';

interface MenuItem {
  id: string;
  icon: string;
  text: string;
  path?: string;
  modal?: boolean;
  permission?: Permission;
  forbiddenRole?: Role;
  forbiddenPermissions?: Permission[]; // Изменено на массив permissions
}

const allMenuItems: MenuItem[] = [
  { 
    id: 'newCredit', 
    icon: newCreditIcon, 
    text: 'Новый договор', 
    path: '/new-credit', 
    forbiddenPermissions: ['FORBID_CREATING_CREDITS', 'MANAGE_ACCOUNTING'], // Теперь массив
    forbiddenRole: 'бухгалтер' 
  },
  { id: 'calculator', icon: CalculatorIcon, text: 'Калькулятор', modal: true },
  { id: 'chat', icon: ChatIcon, text: 'Чат', path: '/chat' },
  { id: 'todo', icon: TodoIcon, text: 'Todo', path: '/todo' },
  { id: 'blog', icon: BlogIcon, text: 'Лента', path: '/blog' }
];

export const pathToMenuItemMap: Record<string, string> = {
  '/new-credit': 'newCredit',
  '/calculator': 'calculator',
  '/chat': 'chat',
  '/todo': 'todo',
  '/blog': 'blog'
};

const TopMenu = () => {
  const { 
    collapsed,
    selectedTopMenuItem, 
    setSelectedTopMenuItem,
    setSelectedSideMenuItem
  } = useContext(SideMenuContext);
  const { hasPermission, forbiddenRole, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { activeTasksCount, setActiveTasksCount } = useTaskCount();
  const { getActiveTasksCount } = useTask();
  const { getUnreadChatsCount } = useChat();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchTaskCount = async () => {
      const count = await getActiveTasksCount();
      if (count !== null) {
        setActiveTasksCount(count);
      }
    };
    fetchTaskCount();
  }, [getActiveTasksCount, setActiveTasksCount]);

  // Функция для проверки запрещенных пермишенов
  const hasForbiddenPermission = (forbiddenPermissions?: Permission[]): boolean => {
    if (!forbiddenPermissions || forbiddenPermissions.length === 0) {
      return false;
    }
    
    // Проверяем, есть ли хотя бы один запрещенный пермишен у пользователя
    return forbiddenPermissions.some(permission => hasPermission(permission));
  };

  const menuItems = allMenuItems.filter(item => {
    // Для директора, суперадмина и админа показываем все элементы
    if (hasRole('директор') || hasRole('суперадмин') || hasRole('админ')) {
      return true;
    }
    
    // Проверяем запрещенные пермишены (теперь массив)
    const hasForbiddenPerm = hasForbiddenPermission(item.forbiddenPermissions);
    
    // Проверяем запрещенную роль
    const isForbiddenRole = forbiddenRole(item.forbiddenRole);
    
    // Показываем элемент только если нет запрещенных пермишенов И нет запрещенной роли
    return !hasForbiddenPerm && !isForbiddenRole;
  });

  useEffect(() => {
    const fetchUnreadChatsCount = async () => {
      const count = await getUnreadChatsCount();
      if (count !== null) {
        setUnreadChatsCount(count);
      }
    };
    
    fetchUnreadChatsCount();
    const interval = setInterval(fetchUnreadChatsCount, 30000);
    
    return () => clearInterval(interval);
  }, [getUnreadChatsCount]);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationsClose = () => {
    setShowNotifications(false);
  };

  const getCurrentMenuItem = () => {
    const currentPath = location.pathname;
    
    if (currentPath.startsWith('/chat/')) {
      return 'chat';
    }
    
    return pathToMenuItemMap[currentPath] || null;
  };

  useEffect(() => {
    const currentMenuItem = getCurrentMenuItem();
    if (currentMenuItem) {
      setSelectedTopMenuItem(currentMenuItem);
      setSelectedSideMenuItem(null);
    }
  }, [location.pathname, setSelectedTopMenuItem, setSelectedSideMenuItem]);

  const handleMenuItemClick = (itemId: string, path?: string, isModal?: boolean) => {
    setSelectedTopMenuItem(itemId);
    if (!isModal && path) {
      navigate(path);
    }
    if (isModal) {
      setShowCalculator(true);
    }
  };

  const handleCalculatorClose = () => {
    setShowCalculator(false);
    setSelectedTopMenuItem(null);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  const isItemSelected = (itemId: string) => {
    if (itemId === 'calculator') {
      return showCalculator || selectedTopMenuItem === 'calculator';
    }
    return selectedTopMenuItem === itemId || getCurrentMenuItem() === itemId;
  };

  return (
    <>
      <TopMenuContainer $collapsed={collapsed}>
        <MenuItemsWrapper>
          {menuItems.map((item) => (
            <MenuItem 
              key={item.id}
              onClick={() => handleMenuItemClick(item.id, item.path, item.modal)}
              $selected={isItemSelected(item.id)}
            >
              <IconWrapper>
                <Icon src={item.icon} alt={item.text} $selected={isItemSelected(item.id)} />
              </IconWrapper>
              <Text $selected={isItemSelected(item.id)}>{item.text}</Text>
              {item.id === 'todo' && activeTasksCount > 0 && (
                <TaskCountBadge>{activeTasksCount}</TaskCountBadge>
              )}
              {item.id === 'chat' && unreadChatsCount > 0 && (
                <TaskCountBadge>{unreadChatsCount}</TaskCountBadge>
              )}
            </MenuItem>
          ))}
        </MenuItemsWrapper>
        
        <BellButton 
          ref={bellButtonRef}
          onClick={handleBellClick}
        >
          <SettingsIconImg src={BellIcon} alt="Уведомления" />
        </BellButton>

        <SettingsButton onClick={handleSettingsClick}>
          <SettingsIconImg src={SettingsIcon} alt="Настройки" />
        </SettingsButton>
      </TopMenuContainer>
      
      <NotificationContextMenu
        isOpen={showNotifications}
        onClose={handleNotificationsClose}
        anchorElement={bellButtonRef.current}
      />

      {showCalculator && <CalculatorModal onClose={handleCalculatorClose} />}
      {showSettings && <SettingsModal onClose={handleSettingsClose} />}
    </>
  );
};

type TopMenuContainerProps = {
  $collapsed: boolean;
};

type MenuItemProps = {
  $selected?: boolean;
  onClick?: () => void;
};

type IconProps = {
  $selected?: boolean;
};

type TextProps = {
  $selected?: boolean;
};

const TaskCountBadge = styled.div`
  margin-left: 8px;
  background-color: rgba(89, 212, 188, 1);
  color: black;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 16px;
  font-weight: 500;
`;

const TopMenuContainer = styled.div<TopMenuContainerProps>`
  width: calc(100% - ${({ $collapsed }) => ($collapsed ? '70px' : '315px')});
  height: 56px;
  position: fixed;
  left: ${({ $collapsed }) => ($collapsed ? '70px' : '315px')};
  top: 0;
  padding: 0 14px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  z-index: 90;
  background-color: rgba(249, 250, 250, 1);
  box-shadow: 0 1px 7px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(209, 213, 219, 1);
`;

const MenuItemsWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  max-width: 1050px;
  margin: 0 auto;
`;

const Icon = styled.img<IconProps>`
  width: 17px;
  height: 17px;
  filter: ${({ $selected }) => $selected ? 'brightness(0)' : 'brightness(0.7)'};
  transition: filter 0.3s ease;
`;

const IconWrapper = styled.div`
  margin-right: 6px;
  display: flex;
  align-items: center;
`;

const Text = styled.span<TextProps>`
  color: ${({ $selected }) => $selected ? 'rgba(0, 0, 0, 1)' : 'rgba(80, 85, 92, 1)'};
  font-size: 18px;
  font-weight: 500;
  transition: color 0.3s ease;
`;

const MenuItem = styled.div<MenuItemProps>`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 7px 11px;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-right: 14px;
  background-color: ${({ $selected }) => $selected ? 'rgba(209, 213, 219, 1)' : 'transparent'};

  &:hover {
    background-color: ${({ $selected }) => $selected ? 'rgba(209, 213, 219, 1)' : 'rgba(209, 213, 219, 0.5)'};
    
    ${Icon} {
      filter: brightness(0);
    }
    
    ${Text} {
      color: rgba(0, 0, 0, 1);
    }
  }

  &:last-child {
    margin-right: 0;
  }
`;

const SettingsButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  outline: none;

  &:hover {
    background-color: rgba(209, 213, 219, 0.5);
  }

  &:active {
    background-color: rgba(209, 213, 219, 0.7);
  }

  /* Кастомный фокус для доступности */
  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
`;

const BellButton = styled(SettingsButton)`
  top: 10px;
  right: 50px;
`;

const SettingsIconImg = styled.img`
  width: 20px;
  height: 20px;
  filter: brightness(0.7);
  transition: filter 0.3s ease;
  outline: none;

  ${SettingsButton}:hover & {
    filter: brightness(0);
    outline: none;
  }
`;

export default TopMenu;
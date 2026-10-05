import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import CalculatorIcon from "../../../assets/ui/TopBar/calculator.svg";
import ChatIcon from "../../../assets/ui/TopBar/chat.svg";
import TodoIcon from "../../../assets/ui/TopBar/to_do.svg";
import newCreditIcon from "../../../assets/ui/TopBar/newCredit.svg";
import SettingsIcon from "../../../assets/ui/TopBar/settings.svg";
import BellIcon from "../../../assets/ui/TopBar/bell.svg";
import { SideMenuContext } from "./SideMenuContext";
import { useNavigate, useLocation } from "react-router-dom";
import CalculatorModal from "../../modal/CalculatorModal";
import SettingsModal from "../../modal/SettingsModal";
import { useAuth } from "../../../сontext/AuthContext";
import type { Permission, Role } from "../../../api/types/auth";
import useTask from "../../../api/hooks/useTask";
import { useTaskCount } from "../../../сontext/TaskCountContext";
import useChat from "../../../api/hooks/useChat";
import NotificationContextMenu from "../../ui/contextMenus/NotificationContextMenu";
import { useEmployee } from "../../../api/hooks/useEmployee";
import { useTopMenuActions } from "../../../сontext/TopMenuActionsContext";

interface MenuItem {
  id: string;
  icon: string;
  text: string;
  path?: string;
  modal?: boolean;
  permission?: Permission;
  forbiddenRole?: Role;
  forbiddenPermissions?: Permission[];
}

const allMenuItems: MenuItem[] = [
  {
    id: "newCredit",
    icon: newCreditIcon,
    text: "Новый договор",
    path: "/new-credit",
    forbiddenPermissions: ["FORBID_CREATING_CREDITS"],
  },
  { id: "calculator", icon: CalculatorIcon, text: "Калькулятор", modal: true },
  { id: "chat", icon: ChatIcon, text: "Чат", path: "/chat" },
  { id: "todo", icon: TodoIcon, text: "Todo", path: "/todo" },
];

export const pathToMenuItemMap: Record<string, string> = {
  "/new-credit": "newCredit",
  "/calculator": "calculator",
  "/chat": "chat",
  "/todo": "todo",
};

const TopMenu = () => {
  const {
    collapsed,
    selectedTopMenuItem,
    setSelectedTopMenuItem,
    setSelectedSideMenuItem,
  } = useContext(SideMenuContext);
  const {
    hasPermission,
    forbiddenRole,
    hasRole,
    isSuperAdminCompany,
    refresh,
  } = useAuth();
  const { rightAction } = useTopMenuActions();
  const { setSelfCompany } = useEmployee();
  const [isExiting, setIsExiting] = useState(false);
  const [exitDone, setExitDone] = useState(false);
  const storedCompanyName = localStorage.getItem("enteredCompanyName");
  const isInOtherCompany =
    !exitDone &&
    !!storedCompanyName &&
    hasRole("суперадмин") &&
    !isSuperAdminCompany();
  const enteredCompanyName = isInOtherCompany ? storedCompanyName : null;

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "--header-height",
      isInOtherCompany ? "92px" : "56px"
    );
  }, [isInOtherCompany]);

  const handleExitCompany = async () => {
    if (isExiting) return;
    setIsExiting(true);
    setExitDone(true);
    try {
      const originalCompanyId = Number(
        localStorage.getItem("originalCompanyId") ?? 1
      );
      await setSelfCompany(originalCompanyId);
      await refresh();
      localStorage.removeItem("enteredCompanyName");
      localStorage.removeItem("originalCompanyId");
    } finally {
      setIsExiting(false);
      setExitDone(false);
    }
  };
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
  const hasForbiddenPermission = (
    forbiddenPermissions?: Permission[]
  ): boolean => {
    if (!forbiddenPermissions || forbiddenPermissions.length === 0) {
      return false;
    }

    // Проверяем, есть ли хотя бы один запрещенный пермишен у пользователя
    return forbiddenPermissions.some((permission) => hasPermission(permission));
  };

  const menuItems = allMenuItems.filter((item) => {
    // Для директора, суперадмина и админа показываем все элементы
    if (hasRole("директор") || hasRole("суперадмин") || hasRole("админ")) {
      return true;
    }

    // Проверяем запрещенные пермишены (теперь массив)
    const hasForbiddenPerm = hasForbiddenPermission(item.forbiddenPermissions);

    // Показываем элемент только если нет запрещенных пермишенов И нет запрещенной роли
    return !hasForbiddenPerm;
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

    if (currentPath.startsWith("/chat/")) {
      return "chat";
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

  const handleMenuItemClick = (
    itemId: string,
    path?: string,
    isModal?: boolean
  ) => {
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
    if (itemId === "calculator") {
      return showCalculator || selectedTopMenuItem === "calculator";
    }
    return selectedTopMenuItem === itemId || getCurrentMenuItem() === itemId;
  };

  return (
    <>
      {isInOtherCompany && (
        <CompanyBanner $collapsed={collapsed}>
          <CompanyBannerDot />
          <CompanyBannerText>
            Вы находитесь в компании <strong>{enteredCompanyName}</strong>
          </CompanyBannerText>
          <CompanyBannerExit
            onClick={handleExitCompany}
            disabled={isExiting}
            title={`Выйти из компании ${enteredCompanyName}`}
          >
            {isExiting ? <Spinner /> : "✕ Выйти"}
          </CompanyBannerExit>
        </CompanyBanner>
      )}
      <TopMenuContainer $collapsed={collapsed} $hasBanner={isInOtherCompany}>
        <MenuItemsWrapper>
          {menuItems.map((item) => (
            <MenuItem
              key={item.id}
              onClick={() =>
                handleMenuItemClick(item.id, item.path, item.modal)
              }
              $selected={isItemSelected(item.id)}
            >
              <IconWrapper>
                <Icon
                  src={item.icon}
                  alt={item.text}
                  $selected={isItemSelected(item.id)}
                />
              </IconWrapper>
              <Text $selected={isItemSelected(item.id)}>{item.text}</Text>
              {item.id === "todo" && activeTasksCount > 0 && (
                <TaskCountBadge>{activeTasksCount}</TaskCountBadge>
              )}
              {item.id === "chat" && unreadChatsCount > 0 && (
                <TaskCountBadge>{unreadChatsCount}</TaskCountBadge>
              )}
            </MenuItem>
          ))}
        </MenuItemsWrapper>

        {rightAction && <RightActionSlot>{rightAction}</RightActionSlot>}

        <BellButton ref={bellButtonRef} onClick={handleBellClick}>
          <SettingsIconImg src={BellIcon} alt="Уведомления" />
        </BellButton>

        <SettingsButton
          onClick={handleSettingsClick}
          title="Персональные настройки"
        >
          <SettingsIconImg src={SettingsIcon} alt="Персональные настройки" />
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
  $hasBanner?: boolean;
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
  width: calc(100% - ${({ $collapsed }) => ($collapsed ? "70px" : "315px")});
  height: 56px;
  position: fixed;
  left: ${({ $collapsed }) => ($collapsed ? "70px" : "315px")};
  top: ${({ $hasBanner }) => ($hasBanner ? "36px" : "0")};
  /* Справа резервируем место под кластер кнопок (фильтр/колокол/настройки),
     которые позиционируются абсолютно у правого края, — чтобы пункты меню
     (в т.ч. Todo) к ним не прилипали ни на широких, ни на узких экранах. */
  padding: 0 150px 0 14px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  z-index: 90;
  background-color: rgba(249, 250, 250, 1);
  box-shadow: 0 1px 7px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(209, 213, 219, 1);

  /* На узких экранах меню выезжает поверх контента, поэтому верхняя панель
     всегда выровнена по узкой полосе иконок (70px). */
  @media (max-width: 1280px) {
    left: 70px;
    width: calc(100% - 70px);
  }
`;

const MenuItemsWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  max-width: 1050px;
  margin: 0 auto;

  /* На узких экранах прижимаем пункты влево и убираем «слипание» иконок.
     Место справа под кнопки уже зарезервировано padding-right контейнера. */
  @media (max-width: 1280px) {
    justify-content: flex-start;
    gap: 6px;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Icon = styled.img<IconProps>`
  width: 17px;
  height: 17px;
  filter: ${({ $selected }) =>
    $selected ? "brightness(0)" : "brightness(0.7)"};
  transition: filter 0.3s ease;
`;

const IconWrapper = styled.div`
  margin-right: 6px;
  display: flex;
  align-items: center;
`;

const Text = styled.span<TextProps>`
  color: ${({ $selected }) =>
    $selected ? "rgba(0, 0, 0, 1)" : "rgba(80, 85, 92, 1)"};
  font-size: 18px;
  font-weight: 500;
  transition: color 0.3s ease;
  white-space: nowrap;

  @media (max-width: 1280px) {
    font-size: 14px;
  }
`;

const MenuItem = styled.div<MenuItemProps>`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 7px 11px;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-right: 14px;
  background-color: ${({ $selected }) =>
    $selected ? "rgba(209, 213, 219, 1)" : "transparent"};

  @media (max-width: 1280px) {
    padding: 6px 8px;
    margin-right: 4px;
    flex-shrink: 0;
  }

  &:hover {
    background-color: ${({ $selected }) =>
      $selected ? "rgba(209, 213, 219, 1)" : "rgba(209, 213, 219, 0.5)"};

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
  right: 56px;
`;

const RightActionSlot = styled.div`
  position: absolute;
  right: 102px;
  top: 10px;
  display: flex;
  align-items: center;
`;

const CompanyBanner = styled.div<{ $collapsed: boolean }>`
  position: fixed;
  top: 0;
  left: ${({ $collapsed }) => ($collapsed ? "70px" : "315px")};
  width: calc(100% - ${({ $collapsed }) => ($collapsed ? "70px" : "315px")});
  height: 36px;
  background: #007d88;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 91;
  padding: 0 16px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  @media (max-width: 1280px) {
    left: 70px;
    width: calc(100% - 70px);
  }
`;

const CompanyBannerDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.9);
`;

const CompanyBannerText = styled.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  strong {
    font-weight: 700;
    color: #fff;
  }
`;

const CompanyBannerExit = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.28);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Spinner = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
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

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import CalculatorIcon from "../../../assets/ui/TopBar/calculator.svg";
import ChatIcon from "../../../assets/ui/TopBar/chat.svg";
import TodoIcon from "../../../assets/ui/TopBar/to_do.svg";
import newCreditIcon from "../../../assets/ui/TopBar/newCredit.svg";
import SettingsIcon from "../../../assets/ui/TopBar/settings.svg";
import BellIcon from "../../../assets/ui/TopBar/bell.svg";
import WayPayLogo from "../../../assets/logos/vectorLogo.svg";
import { useLocation, useNavigate } from "react-router-dom";
import CalculatorModal from "../../modal/CalculatorModal";
import { useAuth } from "../../../сontext/AuthContext";
import type { Permission } from "../../../api/types/auth";
import useTask from "../../../api/hooks/useTask";
import { useTaskCount } from "../../../сontext/TaskCountContext";
import useChat from "../../../api/hooks/useChat";
import NotificationContextMenu from "../../ui/contextMenus/NotificationContextMenu";
import { useEmployee } from "../../../api/hooks/useEmployee";
import { useTopMenuActions } from "../../../сontext/TopMenuActionsContext";
import { FILE_BASE_URL } from "../../../api/client";
import { generateAvatar, getInitials } from "../../../utils/avatarUtils";
import { authStorage } from "../../../api/utils/auth-storage";

interface MenuItem {
  id: string;
  icon: string;
  text: string;
  path?: string;
  modal?: boolean;
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

const applicationLinks = [
  ["Аналитика", "/analytics"],
  ["Договоры", "/credits"],
  ["Клиенты", "/clients"],
  ["Ожидаемые платежи", "/schedules"],
  ["Журнал платежей", "/payments"],
  ["Инвесторы", "/investors"],
  ["Финансы", "/finance"],
  ["Настройки", "/settings"],
] as const;

const TopMenu = () => {
  const { hasPermission, hasRole, isSuperAdminCompany, refresh, authInfo } =
    useAuth();
  const { rightAction } = useTopMenuActions();
  const { setSelfCompany } = useEmployee();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTasksCount, setActiveTasksCount } = useTaskCount();
  const { getActiveTasksCount } = useTask();
  const { getUnreadChatsCount } = useChat();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDone, setExitDone] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

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
      isInOtherCompany ? "106px" : "70px"
    );
  }, [isInOtherCompany]);

  useEffect(() => {
    getActiveTasksCount().then((count) => {
      if (count !== null) setActiveTasksCount(count);
    });
  }, [getActiveTasksCount, setActiveTasksCount]);

  useEffect(() => {
    const fetchCount = () =>
      getUnreadChatsCount().then((count) => {
        if (count !== null) setUnreadChatsCount(count);
      });
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [getUnreadChatsCount]);

  const menuItems = allMenuItems.filter((item) => {
    if (hasRole("директор") || hasRole("суперадмин") || hasRole("админ")) {
      return true;
    }
    return !item.forbiddenPermissions?.some((permission) =>
      hasPermission(permission)
    );
  });

  const currentMenuItem = location.pathname.startsWith("/chat/")
    ? "chat"
    : pathToMenuItemMap[location.pathname] || null;

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

  const handleLogout = () => {
    authStorage.clear();
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/auth";
  };

  const employee = authInfo?.employee;
  const avatarSrc = employee?.photoPath
    ? `${FILE_BASE_URL}${employee.photoPath}`
    : generateAvatar(getInitials(employee?.fullName || ""), 44);

  return (
    <>
      {isInOtherCompany && (
        <CompanyBanner>
          <CompanyBannerDot />
          <span>
            Вы находитесь в компании <strong>{enteredCompanyName}</strong>
          </span>
          <CompanyBannerExit onClick={handleExitCompany} disabled={isExiting}>
            {isExiting ? "Выход..." : "✕ Выйти"}
          </CompanyBannerExit>
        </CompanyBanner>
      )}

      <Header $hasBanner={isInOtherCompany}>
        <BrandArea>
          <BrandButton
            type="button"
            onClick={() => setShowAppMenu((value) => !value)}
            aria-label="Открыть основную навигацию"
            aria-expanded={showAppMenu}
          >
            <BrandLogo src={WayPayLogo} alt="WayPay" />
          </BrandButton>
          {showAppMenu && (
            <AppMenu>
              {applicationLinks.map(([label, path]) => (
                <AppMenuItem
                  key={path}
                  $active={location.pathname.startsWith(path)}
                  onClick={() => {
                    navigate(path);
                    setShowAppMenu(false);
                  }}
                >
                  {label}
                </AppMenuItem>
              ))}
            </AppMenu>
          )}
        </BrandArea>

        <QuickNavigation>
          {menuItems.map((item) => {
            const selected =
              currentMenuItem === item.id ||
              (item.id === "calculator" && showCalculator);
            const count =
              item.id === "todo"
                ? activeTasksCount
                : item.id === "chat"
                ? unreadChatsCount
                : 0;
            return (
              <QuickItem
                key={item.id}
                type="button"
                $selected={selected}
                onClick={() => {
                  if (item.modal) setShowCalculator(true);
                  else if (item.path) navigate(item.path);
                }}
              >
                <QuickIcon src={item.icon} alt="" $selected={selected} />
                <span>{item.text}</span>
                {count > 0 && <CountBadge>{count}</CountBadge>}
              </QuickItem>
            );
          })}
        </QuickNavigation>

        <HeaderActions>
          {rightAction && <RightActionSlot>{rightAction}</RightActionSlot>}
          <IconButton
            ref={bellButtonRef}
            type="button"
            onClick={() => setShowNotifications((value) => !value)}
            title="Уведомления"
          >
            <ActionIcon src={BellIcon} alt="" />
          </IconButton>
          <IconButton
            type="button"
            onClick={() => navigate("/settings")}
            title="Настройки"
            $active={location.pathname === "/settings"}
          >
            <ActionIcon src={SettingsIcon} alt="" />
          </IconButton>
          <ProfileArea>
            <ProfileButton
              type="button"
              onClick={() => setShowProfileMenu((value) => !value)}
              aria-expanded={showProfileMenu}
            >
              <ProfileAvatar src={avatarSrc} alt={employee?.fullName || "Профиль"} />
              <Chevron $open={showProfileMenu}>⌄</Chevron>
            </ProfileButton>
            {showProfileMenu && (
              <ProfileMenu>
                <ProfileSummary>
                  <strong>{employee?.fullName || "Профиль"}</strong>
                  <span>{employee?.role || ""}</span>
                </ProfileSummary>
                <ProfileMenuItem onClick={() => navigate("/profile")}>
                  Открыть профиль
                </ProfileMenuItem>
                <ProfileMenuItem onClick={handleLogout}>Выйти</ProfileMenuItem>
              </ProfileMenu>
            )}
          </ProfileArea>
        </HeaderActions>
      </Header>

      <NotificationContextMenu
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        anchorElement={bellButtonRef.current}
      />
      {showCalculator && (
        <CalculatorModal onClose={() => setShowCalculator(false)} />
      )}
    </>
  );
};

const Header = styled.header<{ $hasBanner: boolean }>`
  position: fixed;
  z-index: 100;
  top: ${({ $hasBanner }) => ($hasBanner ? "36px" : "0")};
  left: 0;
  right: 0;
  height: 70px;
  display: grid;
  grid-template-columns: minmax(155px, 240px) minmax(500px, 1fr) auto;
  align-items: center;
  padding: 0 clamp(24px, 5vw, 88px);
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 1px solid #e7edf3;
  box-shadow: 0 2px 14px rgba(36, 54, 78, 0.035);

  @media (max-width: 1050px) {
    grid-template-columns: 140px 1fr auto;
    padding: 0 22px;
  }
`;

const BrandArea = styled.div`
  position: relative;
  justify-self: start;
`;

const BrandButton = styled.button`
  border: 0;
  padding: 5px 0;
  background: transparent;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 8px;

  &:focus-visible {
    outline: 2px solid #0aa99b;
    outline-offset: 4px;
  }
`;

const BrandLogo = styled.img`
  width: 118px;
  height: auto;
  display: block;
`;

const QuickNavigation = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: clamp(10px, 2vw, 46px);
  min-width: 0;

  @media (max-width: 900px) {
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: none;
  }
`;

const QuickItem = styled.button<{ $selected: boolean }>`
  min-height: 42px;
  padding: 7px 8px;
  border: 0;
  border-radius: 8px;
  background: ${({ $selected }) => ($selected ? "#eef8f7" : "transparent")};
  color: ${({ $selected }) => ($selected ? "#007f7c" : "#50617b")};
  display: flex;
  align-items: center;
  gap: 10px;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: #f3f7f9;
    color: #10213d;
  }

  @media (max-width: 1150px) {
    span:not(:last-child) {
      display: none;
    }
  }
`;

const QuickIcon = styled.img<{ $selected: boolean }>`
  width: 21px;
  height: 21px;
  opacity: ${({ $selected }) => ($selected ? 1 : 0.82)};
`;

const CountBadge = styled.span`
  min-width: 21px;
  height: 21px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #20c4b5;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: clamp(16px, 3vw, 54px);
`;

const IconButton = styled.button<{ $active?: boolean }>`
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? "#eef8f7" : "transparent")};
  display: grid;
  place-items: center;
  cursor: pointer;

  &:hover {
    background: #f1f5f8;
  }
`;

const ActionIcon = styled.img`
  width: 21px;
  height: 21px;
  opacity: 0.82;
`;

const RightActionSlot = styled.div`
  display: flex;
  align-items: center;
`;

const ProfileArea = styled.div`
  position: relative;
  margin-left: 5px;
`;

const ProfileButton = styled.button`
  height: 52px;
  padding: 4px 3px 4px 5px;
  border: 0;
  border-radius: 28px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  &:hover {
    background: #f4f7f9;
  }
`;

const ProfileAvatar = styled.img`
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 50%;
`;

const Chevron = styled.span<{ $open: boolean }>`
  color: #52627b;
  font-size: 23px;
  line-height: 1;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "none")};
  transition: transform 0.2s ease;
`;

const FloatingMenu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  background: #fff;
  border: 1px solid #e3e9ef;
  border-radius: 12px;
  box-shadow: 0 16px 38px rgba(28, 45, 70, 0.16);
  padding: 8px;
  text-align: left;
`;

const AppMenu = styled(FloatingMenu)`
  left: 0;
  width: 220px;
`;

const AppMenuItem = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 7px;
  background: ${({ $active }) => ($active ? "#eaf7f5" : "transparent")};
  color: ${({ $active }) => ($active ? "#007f7c" : "#34445d")};
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f1f6f8;
  }
`;

const ProfileMenu = styled(FloatingMenu)`
  right: 0;
  width: 230px;
`;

const ProfileSummary = styled.div`
  padding: 8px 10px 11px;
  border-bottom: 1px solid #edf1f4;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    color: #11213c;
    font-size: 14px;
  }

  span {
    color: #8190a5;
    font-size: 12px;
  }
`;

const ProfileMenuItem = styled.button`
  width: 100%;
  margin-top: 4px;
  padding: 9px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #34445d;
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f1f6f8;
  }
`;

const CompanyBanner = styled.div`
  position: fixed;
  z-index: 101;
  inset: 0 0 auto;
  height: 36px;
  background: #007d88;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
`;

const CompanyBannerDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
`;

const CompanyBannerExit = styled.button`
  padding: 3px 10px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font: inherit;
  cursor: pointer;
`;

export default TopMenu;

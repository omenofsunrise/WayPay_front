import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import TodoIcon from "../../../assets/ui/TopBar/to_do.svg";
import SettingsIcon from "../../../assets/ui/TopBar/settings.svg";
import BellIcon from "../../../assets/ui/TopBar/bell.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../сontext/AuthContext";
import useTask from "../../../api/hooks/useTask";
import { useTaskCount } from "../../../сontext/TaskCountContext";
import NotificationContextMenu from "../../ui/contextMenus/NotificationContextMenu";
import { useEmployee } from "../../../api/hooks/useEmployee";
import { useTopMenuActions } from "../../../сontext/TopMenuActionsContext";
import { SideMenuContext } from "./SideMenuContext";

export const pathToMenuItemMap: Record<string, string> = {
  "/new-credit": "newCredit",
  "/calculator": "calculator",
  "/chat": "chat",
  "/todo": "todo",
};

const TopMenu = () => {
  const { collapsed } = useContext(SideMenuContext);
  const { hasRole, isSuperAdminCompany, refresh } = useAuth();
  const { setSelfCompany } = useEmployee();
  const { rightAction } = useTopMenuActions();
  const { activeTasksCount, setActiveTasksCount } = useTaskCount();
  const { getActiveTasksCount } = useTask();
  const navigate = useNavigate();
  const location = useLocation();
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDone, setExitDone] = useState(false);

  const storedCompanyName = localStorage.getItem("enteredCompanyName");
  const isInOtherCompany =
    !exitDone &&
    !!storedCompanyName &&
    hasRole("суперадмин") &&
    !isSuperAdminCompany();

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

  return (
    <>
      {isInOtherCompany && (
        <CompanyBanner $collapsed={collapsed}>
          <CompanyBannerDot />
          <span>
            Вы находитесь в компании <strong>{storedCompanyName}</strong>
          </span>
          <CompanyBannerExit onClick={handleExitCompany} disabled={isExiting}>
            {isExiting ? "Выход..." : "✕ Выйти"}
          </CompanyBannerExit>
        </CompanyBanner>
      )}

      <Header $collapsed={collapsed} $hasBanner={isInOtherCompany}>
        <HeaderSpacer />
        <HeaderActions>
          {rightAction && <RightActionSlot>{rightAction}</RightActionSlot>}
          <TodoButton
            type="button"
            onClick={() => navigate("/todo")}
            $active={location.pathname === "/todo"}
          >
            <ActionIcon src={TodoIcon} alt="" />
            <span>Todo</span>
            {activeTasksCount > 0 && <CountBadge>{activeTasksCount}</CountBadge>}
          </TodoButton>
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
        </HeaderActions>
      </Header>

      <NotificationContextMenu
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        anchorElement={bellButtonRef.current}
      />
    </>
  );
};

const Header = styled.header<{ $collapsed: boolean; $hasBanner: boolean }>`
  position: fixed;
  z-index: 90;
  top: ${({ $hasBanner }) => ($hasBanner ? "36px" : "0")};
  left: ${({ $collapsed }) => ($collapsed ? "72px" : "272px")};
  right: 0;
  height: 70px;
  padding: 0 clamp(22px, 3vw, 48px);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 1px solid #e5ecf1;
  box-shadow: 0 2px 16px rgba(35, 59, 82, 0.035);
  transition: left 0.25s ease;

  @media (max-width: 1180px) {
    left: 72px;
  }
`;

const HeaderSpacer = styled.div`
  flex: 1;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  width: 42px;
  height: 42px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: ${({ $active }) => ($active ? "#e7f7f6" : "transparent")};
  display: grid;
  place-items: center;
  cursor: pointer;

  &:hover {
    background: #f0f5f7;
  }
`;

const TodoButton = styled(IconButton)<{ $active?: boolean }>`
  width: auto;
  padding: 0 10px;
  display: flex;
  gap: 8px;
  color: #34445b;
  font: inherit;
  font-size: 15px;
`;

const ActionIcon = styled.img`
  width: 20px;
  height: 20px;
  opacity: 0.85;
`;

const CountBadge = styled.span`
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #55d7cc;
  color: #0e464a;
  font-size: 12px;
  font-weight: 700;
`;

const RightActionSlot = styled.div`
  display: flex;
  align-items: center;
`;

const CompanyBanner = styled.div<{ $collapsed: boolean }>`
  position: fixed;
  z-index: 91;
  top: 0;
  left: ${({ $collapsed }) => ($collapsed ? "72px" : "272px")};
  right: 0;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #007d88;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  transition: left 0.25s ease;

  @media (max-width: 1180px) {
    left: 72px;
  }
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

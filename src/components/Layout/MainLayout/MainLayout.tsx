import React, { useEffect, useState } from "react";
import styled from "styled-components";
import SideMenu from "./SideMenu";
import TopMenu, { pathToMenuItemMap } from "./TopMenu";
import { SideMenuContext } from "./SideMenuContext";
import { useLocation } from "react-router-dom";
import LicenseExpiryNotice from "../../Subscription/LicenseExpiryNotice";
import { authStorage } from "../../../api/utils/auth-storage";
import { TopMenuActionsProvider } from "../../../сontext/TopMenuActionsContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const SIDE_MENU_COLLAPSED_KEY = "sideMenuCollapsed";

const MainLayout = ({ children }: MainLayoutProps) => {
  // Пользователю типа payment_place не показываем меню и прочую обвязку —
  // только содержимое страницы.
  if (authStorage.isPaymentPlace()) {
    return <BareContainer>{children}</BareContainer>;
  }

  return <FullLayout>{children}</FullLayout>;
};

const FullLayout = ({ children }: MainLayoutProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDE_MENU_COLLAPSED_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  const [selectedSideMenuItem, setSelectedSideMenuItem] = useState<
    string | null
  >(null);
  const [selectedTopMenuItem, setSelectedTopMenuItem] = useState<string | null>(
    null
  );
  const location = useLocation();

  useEffect(() => {
    const isTopMenuPath = Object.keys(pathToMenuItemMap).includes(
      location.pathname
    );
    if (isTopMenuPath) {
      setSelectedSideMenuItem(null);
    } else {
      setSelectedTopMenuItem(null);
    }
  }, [location.pathname]);

  const toggleCollapsed = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    localStorage.setItem(
      SIDE_MENU_COLLAPSED_KEY,
      JSON.stringify(newCollapsedState)
    );
  };

  return (
    <TopMenuActionsProvider>
      <SideMenuContext.Provider
        value={{
          collapsed,
          toggleCollapsed,
          selectedSideMenuItem,
          setSelectedSideMenuItem,
          selectedTopMenuItem,
          setSelectedTopMenuItem,
        }}
        >
        <LayoutContainer>
          <SideMenu />
          <SideMenuBackdrop $visible={!collapsed} onClick={toggleCollapsed} />
          <TopMenu />
          <ContentContainer $collapsed={collapsed}>{children}</ContentContainer>
          <LicenseExpiryNotice />
        </LayoutContainer>
      </SideMenuContext.Provider>
    </TopMenuActionsProvider>
  );
};

const BareContainer = styled.div`
  min-height: 100vh;
  box-sizing: border-box;
  background-color: rgba(249, 250, 250, 1);
`;

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  position: relative;
  background-color: rgba(249, 250, 250, 1);
`;

const ContentContainer = styled.div<{ $collapsed: boolean }>`
  flex: 1;
  min-width: 0;
  margin-left: ${({ $collapsed }) => ($collapsed ? "72px" : "272px")};
  margin-top: var(--header-height, 70px);
  box-sizing: border-box;
  height: calc(100vh - var(--header-height, 70px));
  overflow-y: auto;
  transition: margin-left 0.25s ease;

  @media (max-width: 1180px) {
    margin-left: 72px;
  }
`;

const SideMenuBackdrop = styled.div<{ $visible: boolean }>`
  display: none;

  @media (max-width: 1180px) {
    display: ${({ $visible }) => ($visible ? "block" : "none")};
    position: fixed;
    inset: 0;
    z-index: 94;
    background: rgba(16, 32, 52, 0.25);
  }
`;

export default MainLayout;

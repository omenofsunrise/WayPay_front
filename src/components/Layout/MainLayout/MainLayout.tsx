import React, { useEffect, useState } from "react";
import styled from "styled-components";
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
  const [collapsed, setCollapsed] = useState<boolean>(true);

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
          <TopMenu />
          <ContentContainer>{children}</ContentContainer>
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

const ContentContainer = styled.div`
  flex: 1;
  min-width: 0;
  margin-top: var(--header-height, 70px);
  box-sizing: border-box;
  height: calc(100vh - var(--header-height, 70px));
  overflow-y: auto;
`;

export default MainLayout;

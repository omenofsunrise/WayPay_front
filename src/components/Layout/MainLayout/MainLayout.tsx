import React, { useEffect, useState } from "react";
import styled from "styled-components";
import SideMenu from "./SideMenu";
import TopMenu, { pathToMenuItemMap } from "./TopMenu";
import { SideMenuContext } from "./SideMenuContext";
import { useLocation } from "react-router-dom";
import LicenseExpiryNotice from "../../Subscription/LicenseExpiryNotice";
import { authStorage } from "../../../api/utils/auth-storage";

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

  // На узких экранах меню по умолчанию свёрнуто (узкая полоса иконок), чтобы не
  // перекрывать контент и верхнюю панель. Разворачивается уже поверх (drawer).
  useEffect(() => {
    const collapseIfNarrow = () => {
      if (window.innerWidth <= 1280) {
        setCollapsed((prev) => {
          if (!prev) {
            localStorage.setItem(SIDE_MENU_COLLAPSED_KEY, "true");
            return true;
          }
          return prev;
        });
      }
    };
    collapseIfNarrow();
    window.addEventListener("resize", collapseIfNarrow);
    return () => window.removeEventListener("resize", collapseIfNarrow);
  }, []);

  const toggleCollapsed = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    localStorage.setItem(
      SIDE_MENU_COLLAPSED_KEY,
      JSON.stringify(newCollapsedState)
    );
  };

  return (
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
        {/* На узких экранах развёрнутое меню выезжает поверх контента —
            затемняем фон, клик по нему сворачивает меню. */}
        <SideMenuBackdrop $visible={!collapsed} onClick={toggleCollapsed} />
        <TopMenu />
        <ContentContainer $collapsed={collapsed}>{children}</ContentContainer>
        <LicenseExpiryNotice />
      </LayoutContainer>
    </SideMenuContext.Provider>
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
  /* Без этого широкий контент (например, грид календаря) распирает страницу
     и горизонтально листается вся страница вместо внутренней области. */
  min-width: 0;
  margin-left: ${({ $collapsed }) => ($collapsed ? "65px" : "315px")};
  margin-top: 56px;
  box-sizing: border-box;
  transition: all 0.3s ease;
  min-height: calc(100vh - 56px); /* Высота минус TopMenu */

  /* Узкие экраны: меню не раздвигает контент, а выезжает поверх него.
     Контент всегда занимает всю ширину, оставляя только узкую полосу иконок. */
  @media (max-width: 1280px) {
    margin-left: 70px;
  }
`;

// Затемнение под развёрнутым меню — только на узких экранах.
const SideMenuBackdrop = styled.div<{ $visible: boolean }>`
  display: none;

  @media (max-width: 1280px) {
    display: ${({ $visible }) => ($visible ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 95;
  }
`;

export default MainLayout;

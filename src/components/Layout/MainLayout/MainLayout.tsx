import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import SideMenu from './SideMenu';
import TopMenu, { pathToMenuItemMap } from './TopMenu';
import { SideMenuContext } from './SideMenuContext';
import { useLocation } from 'react-router-dom';
import LicenseExpiryNotice from '../../Subscription/LicenseExpiryNotice';

interface MainLayoutProps {
  children: React.ReactNode;
}

const SIDE_MENU_COLLAPSED_KEY = 'sideMenuCollapsed';

const MainLayout = ({ children }: MainLayoutProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDE_MENU_COLLAPSED_KEY);
    return saved ? JSON.parse(saved) : false;
  });
  
  const [selectedSideMenuItem, setSelectedSideMenuItem] = useState<string | null>(null);
  const [selectedTopMenuItem, setSelectedTopMenuItem] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const isTopMenuPath = Object.keys(pathToMenuItemMap).includes(location.pathname);
    if (isTopMenuPath) {
      setSelectedSideMenuItem(null);
    } else {
      setSelectedTopMenuItem(null);
    }
  }, [location.pathname]);

  const toggleCollapsed = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    localStorage.setItem(SIDE_MENU_COLLAPSED_KEY, JSON.stringify(newCollapsedState));
  };

  return (
    <SideMenuContext.Provider value={{ 
      collapsed, 
      toggleCollapsed,
      selectedSideMenuItem,
      setSelectedSideMenuItem,
      selectedTopMenuItem,
      setSelectedTopMenuItem
    }}>
      <LayoutContainer>
        <SideMenu />
        <TopMenu />
        <ContentContainer $collapsed={collapsed}>
          {children}
        </ContentContainer>
        <LicenseExpiryNotice />
      </LayoutContainer>
    </SideMenuContext.Provider>
  );
};

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  position: relative;
  background-color: rgba(249, 250, 250, 1);
`;

const ContentContainer = styled.div<{ $collapsed: boolean }>`
  flex: 1;
  margin-left: ${({ $collapsed }) => ($collapsed ? '65px' : '315px')};
  margin-top: 56px;
  box-sizing: border-box;
  transition: all 0.3s ease;
  min-height: calc(100vh - 56px); /* Высота минус TopMenu */
`;

export default MainLayout;

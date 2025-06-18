import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import SideMenu from './SideMenu';
import TopMenu, { pathToMenuItemMap } from './TopMenu';
import { SideMenuContext } from './SideMenuContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedSideMenuItem, setSelectedSideMenuItem] = useState<string | null>(null);
  const [selectedTopMenuItem, setSelectedTopMenuItem] = useState<string | null>(null);
  const navigate = useNavigate();
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
    setCollapsed(!collapsed);
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
  overflow: auto; /* Добавьте, если контент может быть больше экрана */
  min-height: calc(100vh - 56px); /* Высота минус TopMenu */
`;

export default MainLayout;
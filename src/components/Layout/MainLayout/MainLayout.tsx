import React, { useState } from 'react';
import styled from 'styled-components';
import SideMenu from './SideMenu';
import TopMenu from './TopMenu';
import { SideMenuContext } from './SideMenuContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedSideMenuItem, setSelectedSideMenuItem] = useState<string | null>(null);
  const [selectedTopMenuItem, setSelectedTopMenuItem] = useState<string | null>(null);
  
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
  flex: 1; /* Это заставит контейнер занимать всё доступное пространство */
  margin-left: ${({ $collapsed }) => ($collapsed ? '45px' : '315px')};
  margin-top: 56px;
  box-sizing: border-box;
  transition: all 0.3s ease;
  overflow: auto; /* Добавьте, если контент может быть больше экрана */
  min-height: calc(100vh - 56px); /* Высота минус TopMenu */
`;

export default MainLayout;
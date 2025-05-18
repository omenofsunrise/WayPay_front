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
`;

const ContentContainer = styled.div<{ $collapsed: boolean }>`
  margin-left: ${({ $collapsed }) => ($collapsed ? '70px' : '315px')};
  margin-top: 56px;
  width: calc(100% - ${({ $collapsed }) => ($collapsed ? '70px' : '315px')});
  padding: 14px;
  box-sizing: border-box;
  transition: all 0.3s ease;
`;

export default MainLayout;
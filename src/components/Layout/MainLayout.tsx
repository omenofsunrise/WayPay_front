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
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <SideMenuContext.Provider value={{ collapsed, toggleCollapsed }}>
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
  margin-left: ${({ $collapsed }) => ($collapsed ? '100px' : '450px')};
  margin-top: 80px;
  width: calc(100% - ${({ $collapsed }) => ($collapsed ? '100px' : '450px')});
  padding: 20px;
  box-sizing: border-box;
  transition: all 0.3s ease;
`;

export default MainLayout;
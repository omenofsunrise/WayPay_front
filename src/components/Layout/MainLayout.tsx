import styled from 'styled-components';
import SideMenu from './SideMenu';
import TopMenu from './TopMenu';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <LayoutContainer>
      <SideMenu />
      <TopMenu />
      <ContentContainer>
        {children}
      </ContentContainer>
    </LayoutContainer>
  );
};

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  margin-left: 250px;
  margin-top: 60px;
  width: calc(100% - 250px);
  padding: 20px;
  box-sizing: border-box;
`;

export default MainLayout;
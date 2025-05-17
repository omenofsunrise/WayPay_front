import styled from 'styled-components';

const TopMenu = () => {
  return (
    <TopMenuContainer>
      <h3>Верхнее меню</h3>
    </TopMenuContainer>
  );
};

const TopMenuContainer = styled.div`
  width: calc(100% - 250px);
  height: 60px;
  background-color: #34495e;
  color: white;
  position: fixed;
  left: 250px;
  top: 0;
  padding: 0 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  z-index: 100;
`;

export default TopMenu;
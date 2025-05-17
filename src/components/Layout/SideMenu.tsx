import styled from 'styled-components';

const SideMenu = () => {
  return (
    <SideMenuContainer>
      <h2>Меню</h2>
      <ul>
        <li>Пункт 1</li>
        <li>Пункт 2</li>
        <li>Пункт 3</li>
      </ul>
    </SideMenuContainer>
  );
};

const SideMenuContainer = styled.div`
  width: 250px;
  height: 100vh;
  background-color: #2c3e50;
  color: white;
  position: fixed;
  left: 0;
  top: 0;
  padding: 20px;
  box-sizing: border-box;
  z-index: 100;
`;

export default SideMenu;
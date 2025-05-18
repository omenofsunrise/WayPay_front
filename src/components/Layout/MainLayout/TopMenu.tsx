import React, { useContext } from 'react';
import styled from 'styled-components';
import CalculatorIcon from '../../../assets/ui/TopBar/calculator.svg';
import ChatIcon from '../../../assets/ui/TopBar/chat.svg';
import CalendarIcon from '../../../assets/ui/TopBar/calendar.svg';
import TodoIcon from '../../../assets/ui/TopBar/to_do.svg';
import BlogIcon from '../../../assets/ui/TopBar/blog.svg';
import { SideMenuContext } from './SideMenuContext';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { id: 'calculator', icon: CalculatorIcon, text: 'Калькулятор', path: '/calculator' },
  { id: 'chat', icon: ChatIcon, text: 'Чат', path: '/chat' },
  { id: 'calendar', icon: CalendarIcon, text: 'Календарь', path: '/calendar' },
  { id: 'todo', icon: TodoIcon, text: 'Todo', path: '/todo' },
  { id: 'blog', icon: BlogIcon, text: 'Блог', path: '/blog' }
];

const TopMenu = () => {
  const { 
    collapsed,
    selectedTopMenuItem, 
    setSelectedTopMenuItem,
    setSelectedSideMenuItem
  } = useContext(SideMenuContext);
  const navigate = useNavigate();

  const handleMenuItemClick = (itemId: string, path: string) => {
    setSelectedTopMenuItem(itemId);
    setSelectedSideMenuItem(null);
    navigate(path);
  };

  return (
    <TopMenuContainer $collapsed={collapsed}>
      <MenuItemsWrapper>
        {menuItems.map((item) => (
          <MenuItem 
            key={item.id}
            onClick={() => handleMenuItemClick(item.id, item.path)}
            $selected={selectedTopMenuItem === item.id}
          >
            <IconWrapper>
              <Icon src={item.icon} alt={item.text} $selected={selectedTopMenuItem === item.id} />
            </IconWrapper>
            <Text $selected={selectedTopMenuItem === item.id}>{item.text}</Text>
          </MenuItem>
        ))}
      </MenuItemsWrapper>
    </TopMenuContainer>
  );
};

type TopMenuContainerProps = {
  $collapsed: boolean;
};

type MenuItemProps = {
  $selected?: boolean;
  onClick?: () => void;
};

type IconProps = {
  $selected?: boolean;
};

type TextProps = {
  $selected?: boolean;
};

const TopMenuContainer = styled.div<TopMenuContainerProps>`
  width: calc(100% - ${({ $collapsed }) => ($collapsed ? '70px' : '315px')});
  height: 56px;
  position: fixed;
  left: ${({ $collapsed }) => ($collapsed ? '70px' : '315px')};
  top: 0;
  padding: 0 14px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  z-index: 90;
  background-color: rgba(249, 250, 250, 1);
  box-shadow: 0 1px 7px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(209, 213, 219, 1);
`;

const MenuItemsWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  max-width: 1050px;
  margin: 0 auto;
`;

const Icon = styled.img<IconProps>`
  width: 17px;
  height: 17px;
  filter: ${({ $selected }) => $selected ? 'brightness(0)' : 'brightness(0.7)'};
  transition: filter 0.3s ease;
`;

const IconWrapper = styled.div`
  margin-right: 6px;
  display: flex;
  align-items: center;
`;

const Text = styled.span<TextProps>`
  color: ${({ $selected }) => $selected ? 'rgba(0, 0, 0, 1)' : 'rgba(80, 85, 92, 1)'};
  font-size: 18px;
  font-weight: 500;
  transition: color 0.3s ease;
`;

const MenuItem = styled.div<MenuItemProps>`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 7px 11px;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-right: 14px;
  background-color: ${({ $selected }) => $selected ? 'rgba(209, 213, 219, 1)' : 'transparent'};

  &:hover {
    background-color: ${({ $selected }) => $selected ? 'rgba(209, 213, 219, 1)' : 'rgba(209, 213, 219, 0.5)'};
    
    ${Icon} {
      filter: brightness(0);
    }
    
    ${Text} {
      color: rgba(0, 0, 0, 1);
    }
  }

  &:last-child {
    margin-right: 0;
  }
`;

export default TopMenu;
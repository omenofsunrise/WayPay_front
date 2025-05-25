import styled from 'styled-components';
import arrow from '../../../assets/ui/arrow.svg';
import logo from '../../../assets/logos/vectorLogo.svg';
import analyticsIcon from '../../../assets/ui/MenuItems/analitic.svg';
import contractsIcon from '../../../assets/ui/MenuItems/credits.svg';
import clientsIcon from '../../../assets/ui/MenuItems/clients.svg';
import paymentsIcon from '../../../assets/ui/MenuItems/payments.svg';
import investorsIcon from '../../../assets/ui/MenuItems/investors.svg';
import referencesIcon from '../../../assets/ui/MenuItems/catalogs.svg';
import financeIcon from '../../../assets/ui/MenuItems/finance.svg';
import profileIcon from '../../../assets/ui/MenuItems/profile.svg';
import { useState, useContext, useEffect } from 'react';
import { SideMenuContext } from './SideMenuContext';
import { useNavigate, useLocation } from 'react-router-dom';

type CollapsibleProps = {
  $collapsed?: boolean;
};

type MenuItemProps = CollapsibleProps & {
  $selected?: boolean;
  onClick?: () => void;
};

const menuItemsMap: Record<string, { mainItem: string; subItems?: Record<string, string> }> = {
  '/analytics': { mainItem: 'analytics' },
  '/credits': { mainItem: 'contracts', subItems: { '/credits': 'contracts' } },
  '/contracts-control': { mainItem: 'contracts', subItems: { '/contracts-control': 'contracts-control' } },
  '/clients': { mainItem: 'clients', subItems: { '/clients': 'clients' } },
  '/blacklist': { mainItem: 'clients', subItems: { '/blacklist': 'blacklist' } },
  '/queue': { mainItem: 'clients', subItems: { '/queue': 'queue' } },
  '/pending-payments': { mainItem: 'payments', subItems: { '/pending-payments': 'pending-payments' } },
  '/payments': { mainItem: 'payments', subItems: { '/payments': 'payments-journal' } },
  '/investors': { mainItem: 'investors', subItems: { '/investors': 'investors' } },
  '/investors-report': { mainItem: 'investors', subItems: { '/investors-report': 'investors-report' } },
  '/products': { mainItem: 'references', subItems: { '/products': 'products' } },
  '/budget': { mainItem: 'finance', subItems: { '/budget': 'budget' } },
  '/income': { mainItem: 'finance', subItems: { '/income': 'income' } },
  '/expenses': { mainItem: 'finance', subItems: { '/expenses': 'expenses' } },
  '/profile': { mainItem: 'profile' }
};

const SideMenu = () => {
  const { 
    collapsed, 
    toggleCollapsed,
    selectedSideMenuItem,
    setSelectedSideMenuItem,
    setSelectedTopMenuItem
  } = useContext(SideMenuContext);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Определяем выбранный элемент меню на основе текущего пути
    const currentPath = location.pathname;
    const menuItem = menuItemsMap[currentPath];
    
    if (menuItem) {
      setSelectedSideMenuItem(menuItem.mainItem);
      if (menuItem.subItems) {
        setExpandedItem(menuItem.mainItem);
        const subItemKey = Object.keys(menuItem.subItems).find(key => currentPath.startsWith(key));
        if (subItemKey) {
          setSelectedSideMenuItem(menuItem.subItems[subItemKey]);
        }
      }
    }
  }, [location.pathname, setSelectedSideMenuItem]);

  const toggleItem = (item: string) => {
    if (collapsed) {
      toggleCollapsed();
      setTimeout(() => setExpandedItem(item), 300);
    } else {
      if (expandedItem === item) {
        setExpandedItem(null);
      } else {
        setExpandedItem(item);
      }
    }
  };

  const handleMenuItemClick = (item: string, path: string) => {
    setSelectedSideMenuItem(item);
    setSelectedTopMenuItem(null);
    navigate(path);
  };

  const handleSubMenuItemClick = (item: string, path: string) => {
    setSelectedSideMenuItem(item);
    setSelectedTopMenuItem(null);
    navigate(path);
  };

  const toggleMenu = () => {
    toggleCollapsed();
    setExpandedItem(null);
  };

  return (
    <SideMenuContainer $collapsed={collapsed}>
      <ArrowIcon 
        src={arrow} 
        alt="arrow" 
        onClick={toggleMenu}
        $collapsed={collapsed}
      />
      {!collapsed && <Logo src={logo} alt="logo" />}
      
      <MenuList $collapsed={collapsed}>
        <MenuItem 
          onClick={() => handleMenuItemClick('analytics', '/analytics')}
          $collapsed={collapsed}
          $selected={selectedSideMenuItem === 'analytics'}
        >
          <Icon src={analyticsIcon} $collapsed={collapsed} $selected={selectedSideMenuItem === 'analytics'} />
          {!collapsed && <MenuItemText>Аналитика</MenuItemText>}
        </MenuItem>
        
        {!collapsed && <Divider />}
        
        <MenuItem 
          onClick={() => toggleItem('contracts')}
          $collapsed={collapsed}
          $selected={selectedSideMenuItem === 'contracts' || 
                    selectedSideMenuItem === 'contracts-control'}
        >
          <Icon 
            src={contractsIcon} 
            $collapsed={collapsed} 
            $selected={selectedSideMenuItem === 'contracts' || selectedSideMenuItem === 'contracts-control'} 
          />
          {!collapsed && <MenuItemText>Договоры</MenuItemText>}
        </MenuItem>
        {!collapsed && expandedItem === 'contracts' && (
          <SubMenu>
            <SubMenuLine />
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('contracts', '/credits')}
              $selected={selectedSideMenuItem === 'contracts'}
            >
              Договоры
            </SubMenuItem>
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('contracts-control', '/contracts-control')}
              $selected={selectedSideMenuItem === 'contracts-control'}
            >
              Контроль договоров
            </SubMenuItem>
          </SubMenu>
        )}
        
        <MenuItem 
          onClick={() => toggleItem('clients')}
          $collapsed={collapsed}
          $selected={selectedSideMenuItem === 'clients' || 
                    selectedSideMenuItem === 'blacklist' ||
                    selectedSideMenuItem === 'queue'}
        >
          <Icon 
            src={clientsIcon} 
            $collapsed={collapsed} 
            $selected={selectedSideMenuItem === 'clients' || 
                      selectedSideMenuItem === 'blacklist' ||
                      selectedSideMenuItem === 'queue'} 
          />
          {!collapsed && <MenuItemText>Клиенты</MenuItemText>}
        </MenuItem>
        {!collapsed && expandedItem === 'clients' && (
          <SubMenu>
            <SubMenuLine />
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('clients', '/clients')}
              $selected={selectedSideMenuItem === 'clients'}
            >
              Клиенты
            </SubMenuItem>
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('blacklist', '/blacklist')}
              $selected={selectedSideMenuItem === 'blacklist'}
            >
              Чёрный список
            </SubMenuItem>
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('queue', '/queue')}
              $selected={selectedSideMenuItem === 'queue'}
            >
              Очередь
            </SubMenuItem>
          </SubMenu>
        )}
        
        <MenuItem 
          onClick={() => toggleItem('payments')}
          $collapsed={collapsed}
          $selected={selectedSideMenuItem === 'pending-payments' || 
                    selectedSideMenuItem === 'payments-journal'}
        >
          <Icon 
            src={paymentsIcon} 
            $collapsed={collapsed} 
            $selected={selectedSideMenuItem === 'pending-payments' || 
                      selectedSideMenuItem === 'payments-journal'} 
          />
          {!collapsed && <MenuItemText>Платежи</MenuItemText>}
        </MenuItem>
        {!collapsed && expandedItem === 'payments' && (
          <SubMenu>
            <SubMenuLine />
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('pending-payments', '/pending-payments')}
              $selected={selectedSideMenuItem === 'pending-payments'}
            >
              Ожидаемые
            </SubMenuItem>
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('payments-journal', '/payments')}
              $selected={selectedSideMenuItem === 'payments-journal'}
            >
              Журнал
            </SubMenuItem>
          </SubMenu>
        )}
        
        <MenuItem 
          onClick={() => toggleItem('investors')}
          $collapsed={collapsed}
          $selected={selectedSideMenuItem === 'investors' || 
                    selectedSideMenuItem === 'investors-report'}
        >
          <Icon 
            src={investorsIcon} 
            $collapsed={collapsed} 
            $selected={selectedSideMenuItem === 'investors' || 
                      selectedSideMenuItem === 'investors-report'} 
          />
          {!collapsed && <MenuItemText>Инвесторы</MenuItemText>}
        </MenuItem>
        {!collapsed && expandedItem === 'investors' && (
          <SubMenu>
            <SubMenuLine />
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('investors', '/investors')}
              $selected={selectedSideMenuItem === 'investors'}
            >
              Инвесторы
            </SubMenuItem>
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('investors-report', '/investors-report')}
              $selected={selectedSideMenuItem === 'investors-report'}
            >
              Отчёт для инвесторов
            </SubMenuItem>
          </SubMenu>
        )}
        
        <MenuItem 
          onClick={() => toggleItem('references')}
          $collapsed={collapsed}
          $selected={selectedSideMenuItem === 'products'}
        >
          <Icon 
            src={referencesIcon} 
            $collapsed={collapsed} 
            $selected={selectedSideMenuItem === 'products'} 
          />
          {!collapsed && <MenuItemText>Справочники</MenuItemText>}
        </MenuItem>
        {!collapsed && expandedItem === 'references' && (
          <SubMenu>
            <SubMenuLine />
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('products', '/products')}
              $selected={selectedSideMenuItem === 'products'}
            >
              Товары
            </SubMenuItem>
          </SubMenu>
        )}
        
        <MenuItem 
          onClick={() => toggleItem('finance')}
          $collapsed={collapsed}
          $selected={selectedSideMenuItem === 'budget' || 
                    selectedSideMenuItem === 'income' ||
                    selectedSideMenuItem === 'expenses'}
        >
          <Icon 
            src={financeIcon} 
            $collapsed={collapsed} 
            $selected={selectedSideMenuItem === 'budget' || 
                      selectedSideMenuItem === 'income' ||
                      selectedSideMenuItem === 'expenses'} 
          />
          {!collapsed && <MenuItemText>Финансы</MenuItemText>}
        </MenuItem>
        {!collapsed && expandedItem === 'finance' && (
          <SubMenu>
            <SubMenuLine />
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('budget', '/budget')}
              $selected={selectedSideMenuItem === 'budget'}
            >
              Бюджет
            </SubMenuItem>
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('income', '/income')}
              $selected={selectedSideMenuItem === 'income'}
            >
              Доходы
            </SubMenuItem>
            <SubMenuItem 
              onClick={() => handleSubMenuItemClick('expenses', '/expenses')}
              $selected={selectedSideMenuItem === 'expenses'}
            >
              Расходы
            </SubMenuItem>
          </SubMenu>
        )}
        
        {!collapsed && <Divider />}
        
        <MenuItem 
          onClick={() => handleMenuItemClick('profile', '/profile')}
          $collapsed={collapsed}
          $selected={selectedSideMenuItem === 'profile'}
        >
          <Icon src={profileIcon} $collapsed={collapsed} $selected={selectedSideMenuItem === 'profile'} />
          {!collapsed && <MenuItemText>Профиль</MenuItemText>}
        </MenuItem>
      </MenuList>
      
      <RightBorder $collapsed={collapsed} />
    </SideMenuContainer>
  );
};

const MenuItem = styled.div<MenuItemProps>`
  display: flex;
  align-items: center;
  padding: ${({ $collapsed }) => ($collapsed ? '15px 0' : '15px 17px')};
  margin-bottom: 3px;
  cursor: pointer;
  border-radius: 8px;
  width: ${({ $collapsed }) => ($collapsed ? '45px' : '100%')};\
  height: 35px;
  max-width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  color: ${({ $selected }) => $selected ? '#000' : '#50555c'};
  background-color: ${({ $selected }) => $selected ? 'rgba(209, 213, 219, 1)' : 'transparent'};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  
  &:hover {
    background-color: ${({ $selected }) => $selected ? 'rgba(209, 213, 219, 1)' : 'rgba(209, 213, 219, 0.5)'};
    color: #000;
    
    img {
      filter: ${({ $selected }) => $selected ? 'brightness(0)' : 'brightness(0.7)'};
    }
  }
`;

const SubMenuItem = styled.div<{ $selected?: boolean }>`
  padding: 4px 9px 4px 9px;
  margin-bottom: 3px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  color: ${({ $selected }) => $selected ? '#000' : '#50555c'};
  text-align: left;
  font-weight: 500;
  position: relative;
  background-color: ${({ $selected }) => $selected ? 'rgba(209, 213, 219, 1)' : 'transparent'};

  &:hover {
    background-color: ${({ $selected }) => $selected ? 'rgba(209, 213, 219, 1)' : 'rgba(209, 213, 219, 0.5)'};
    color: #000;
  }
`;

const Icon = styled.img<CollapsibleProps & { $selected?: boolean }>`
  width: 21px;
  height: 21px;
  margin-right: ${({ $collapsed }) => ($collapsed ? '0' : '17px')};
  transition: all 0.2s ease;
  filter: ${({ $selected }) => $selected ? 'brightness(0)' : 'brightness(0.7)'};
`;

const RightBorder = styled.div<CollapsibleProps>`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 1px;
  background-color: rgba(209, 213, 219, 1);
  transition: all 0.3s ease;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
`;

const SideMenuContainer = styled.div<CollapsibleProps>`
  width: ${({ $collapsed }) => ($collapsed ? '70px' : '315px')};
  height: 100vh;
  background-color: rgba(249, 250, 250, 1);
  color: rgba(80, 85, 92, 1);
  position: fixed;
  left: 0;
  top: 0;
  padding: 22px 17px;
  box-sizing: border-box;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: all 0.3s ease;
  box-shadow: 1px 0 7px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const MenuList = styled.div<CollapsibleProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ArrowIcon = styled.img<CollapsibleProps>`
  width: 22px;
  height: 22px;
  margin-bottom: 28px;
  cursor: pointer;
  transform: ${({ $collapsed }) => ($collapsed ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.3s ease;
`;

const Logo = styled.img`
  width: 85%;
  max-width: 196px;
  align-self: center;
  margin-bottom: 42px;
`;

const MenuItemText = styled.span`
  font-size: 15px;
  font-weight: 500;
`;

const SubMenu = styled.div`
  margin-left: 45px;
  padding-left: 0;
  width: calc(100% - 45px);
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
`;

const SubMenuLine = styled.div`
  position: absolute;
  left: -4px;
  top: 0;
  height: 100%;
  width: 1px;
  background-color: rgba(209, 213, 219, 0.8);
  border-radius: 1px;
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background-color: rgba(209, 213, 219, 1);
  margin: 14px 0;
`;

export default SideMenu;
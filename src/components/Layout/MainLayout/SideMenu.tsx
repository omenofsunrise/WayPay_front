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
import { useAuth } from '../../../сontext/AuthContext';
import { getAutoCollapseMenuSetting } from '../../modal/SettingsModal';

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
  '/credit-control': { mainItem: 'contracts', subItems: { '/credit-control': 'contracts-control' } },
  '/clients': { mainItem: 'clients', subItems: { '/clients': 'clients' } },
  '/blacklist': { mainItem: 'clients', subItems: { '/blacklist': 'blacklist' } },
  '/credit-application': { mainItem: 'clients', subItems: { '/credit-application': 'credit-application' } },
  '/queue': { mainItem: 'clients', subItems: { '/queue': 'queue' } },
  '/schedules': { mainItem: 'payments', subItems: { '/schedules': 'pending-payments' } },
  '/payments': { mainItem: 'payments', subItems: { '/payments': 'payments-journal' } },
  '/investors': { mainItem: 'investors', subItems: { '/investors': 'investors' } },
  '/investors-report': { mainItem: 'investors', subItems: { '/investors-report': 'investors-report' } },
  '/products': { mainItem: 'references', subItems: { '/products': 'products' } },
  '/black-catalog': { mainItem: 'references', subItems: { '/black-catalog': 'black-catalog' } },
  '/registration-requests': { mainItem: 'references', subItems: { '/registration-requests': 'registration-requests' } },
  '/budget': { mainItem: 'finance', subItems: { '/budget': 'budget' } },
  '/payments-income': { mainItem: 'finance', subItems: { '/payments-income': 'payments-income' } },
  '/profile': { mainItem: 'profile' },
  '/about': { mainItem: 'about' },
  '/admin': { mainItem: 'admin' },
  '/investors-pool': { 
    mainItem: 'investors', 
    subItems: { '/investors-pool': 'investors-pool' } 
  },
};

const SideMenu = () => {
  const { 
    collapsed, 
    toggleCollapsed,
    selectedSideMenuItem,
    setSelectedSideMenuItem,
  } = useContext(SideMenuContext);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    mainItem: string;
  }>({ visible: false, x: 0, y: 0, mainItem: '' });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole, hasPermission, denyPermission, isSuperAdminCompany } = useAuth();
  
  const menuItemPermissions: Record<string, () => boolean> = {
    'analytics': () => hasPermission('VIEW_ANALYTIC', true) || hasRole('директор') || hasRole('суперадмин') || hasPermission('MANAGE_ACCOUNTING', true),
    'contracts': () => true, // Базовый доступ к договорам
    'contracts-control': () => hasRole('админ') || hasRole('директор') || hasRole('суперадмин'),
    'clients': () => true, // Базовый доступ к клиентам
    'blacklist': () => true, // Базовый доступ к черному списку
    'credit-application': () => denyPermission('FORBID_CREDIT_APPLICATIONS'),
    'queue': () => true, // Базовый доступ к очереди
    'pending-payments': () => true, // Базовый доступ к платежам
    'payments-journal': () => true, // Базовый доступ к журналу платежей
    'investors': () => hasRole('админ') || hasRole('директор') || hasRole('суперадмин'),
    'investors-report': () => hasRole('админ') || hasRole('директор') || hasRole('суперадмин'),
    'investors-pool': () => hasRole('админ') || hasRole('директор') || hasRole('суперадмин'),
    'products': () => true, // Базовый доступ к товарам
    'black-catalog': () => true, // Базовый доступ к черному каталогу
    'registration-requests': () => isSuperAdminCompany(),
    'budget': () => hasPermission('MANAGE_ACCOUNTING', true),
    'payments-income': () => hasPermission('MANAGE_ACCOUNTING', true),
    'profile': () => true, // Профиль доступен всем
    'admin': () => hasRole('суперадмин'),
    'about': () => true, // О программе доступно всем
  };

  const checkMenuItemPermission = (menuItemKey: string): boolean => {
    const permissionCheck = menuItemPermissions[menuItemKey];
    return permissionCheck ? permissionCheck() : true;
  };

  const getCurrentMenuItem = () => {
    const currentPath = location.pathname;
    const menuItem = menuItemsMap[currentPath];
    
    if (menuItem) {
      if (menuItem.subItems) {
        const subItemKey = Object.keys(menuItem.subItems).find(key => currentPath.startsWith(key));
        if (subItemKey) {
          return menuItem.subItems[subItemKey];
        }
      }
      return menuItem.mainItem;
    }
    return null;
  };

  useEffect(() => {
    const currentMenuItem = getCurrentMenuItem();
    if (currentMenuItem) {
      setSelectedSideMenuItem(currentMenuItem);
      const menuItem = menuItemsMap[location.pathname];
      if (menuItem?.subItems) {
        setExpandedItem(menuItem.mainItem);
      }
    }
  }, [location.pathname, setSelectedSideMenuItem]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, mainItem: '' });
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleMainMenuItemClick = (item: string, path?: string, hasSubItems?: boolean) => {
    if (collapsed && hasSubItems) {
      return;
    }
    
    if (path) {
      handleMenuItemClick(item, path);
    } else if (hasSubItems) {
      toggleItem(item);
    }
  };

  const handleCollapsedMenuClick = (e: React.MouseEvent, mainItem: string, hasSubItems: boolean) => {
    if (!collapsed) return;
    
    e.stopPropagation();
    
    if (hasSubItems) {
      const rect = e.currentTarget.getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: rect.right + 5,
        y: rect.top,
        mainItem
      });
    } else {
      const path = getPathByMainItem(mainItem);
      if (path) {
        handleMenuItemClick(mainItem, path);
      }
    }
  };

  const getPathByMainItem = (mainItem: string): string | null => {
    const entries = Object.entries(menuItemsMap);
    for (const [path, item] of entries) {
      if (item.mainItem === mainItem && !item.subItems) {
        return path;
      }
    }
    return null;
  };

  const getSubItems = (mainItem: string): { key: string; label: string; path: string }[] => {
    const subItems: { key: string; label: string; path: string }[] = [];
    
    Object.entries(menuItemsMap).forEach(([path, item]) => {
      if (item.mainItem === mainItem && item.subItems) {
        Object.entries(item.subItems).forEach(([subPath, subKey]) => {
          if (checkMenuItemPermission(subKey)) {
            const label = getSubItemLabel(subKey);
            if (label) {
              subItems.push({ key: subKey, label, path: subPath });
            }
          }
        });
      }
    });
    
    return subItems;
  };

  const getSubItemLabel = (subItemKey: string): string => {
    const labels: Record<string, string> = {
      'contracts': 'Договоры',
      'contracts-control': 'Контроль договоров',
      'clients': 'Клиенты',
      'blacklist': 'Чёрный список',
      'credit-application': 'Заявки',
      'queue': 'Очередь',
      'pending-payments': 'Ожидаемые',
      'payments-journal': 'Журнал',
      'investors': 'Инвесторы',
      'investors-report': 'Отчёт для инвесторов',
      'investors-pool': 'Пулы инвесторов',
      'products': 'Товары',
      'black-catalog': 'Чёрный каталог',
      'registration-requests': 'Заявки на регистрацию',
      'budget': 'Бюджет',
      'payments-income': 'Доходы от платежей'
    };
    
    return labels[subItemKey] || subItemKey;
  };

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
    navigate(path);
    setContextMenu({ visible: false, x: 0, y: 0, mainItem: '' });
    
    if (getAutoCollapseMenuSetting() && !collapsed) {
      toggleCollapsed();
    }
  };

  const handleSubMenuItemClick = (item: string, path: string) => {
    setSelectedSideMenuItem(item);
    navigate(path);
    setContextMenu({ visible: false, x: 0, y: 0, mainItem: '' });
    
    if (getAutoCollapseMenuSetting() && !collapsed) {
      toggleCollapsed();
    }
  };

  const toggleMenu = () => {
    toggleCollapsed();
    setExpandedItem(null);
    setContextMenu({ visible: false, x: 0, y: 0, mainItem: '' });
  };

  const handleContextMenuAction = (action: string, path: string) => {
    handleSubMenuItemClick(action, path);
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
        {/* Основное меню с возможностью прокрутки */}
        <ScrollableMenuContent>
          {(hasPermission('VIEW_ANALYTIC', true) || hasRole('директор') || hasRole('суперадмин') || hasPermission('MANAGE_ACCOUNTING', true)) && (
            <MenuItem 
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, 'analytics', false);
                } else {
                  handleMenuItemClick('analytics', '/analytics');
                }
              }}
              $collapsed={collapsed}
              $selected={selectedSideMenuItem === 'analytics'}
            >
              <Icon src={analyticsIcon} $collapsed={collapsed} $selected={selectedSideMenuItem === 'analytics'} />
              {!collapsed && <MenuItemText>Аналитика</MenuItemText>}
            </MenuItem>
          )}
          
          {!collapsed && <Divider />}
          
          {/* Contracts Menu */}
          <MenuItem 
            onClick={(e) => {
              if (collapsed) {
                handleCollapsedMenuClick(e, 'contracts', true);
              } else {
                handleMainMenuItemClick('contracts', undefined, true);
              }
            }}
            $collapsed={collapsed}
            $selected={selectedSideMenuItem === 'contracts' || 
                      selectedSideMenuItem === 'contracts-control'}
          >
            <Icon 
              src={contractsIcon} 
              $collapsed={collapsed} 
              $selected={selectedSideMenuItem === 'contracts' || selectedSideMenuItem === 'contracts-control'} 
            />
            {!collapsed && (
              <>
                <MenuItemText>Договоры</MenuItemText>
                <ExpandArrow 
                  width="14" 
                  height="8" 
                  viewBox="0 0 14 8" 
                  fill="none" 
                  $expanded={expandedItem === 'contracts'}
                >
                  <path 
                    d="M1 1.32422L7 7.32422L13 1.32422" 
                    stroke="#50555C" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </ExpandArrow>
              </>
            )}
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
              {(hasRole('админ') || hasRole('директор') || hasRole('суперадмин')) && (
                <SubMenuItem 
                  onClick={() => handleSubMenuItemClick('contracts-control', '/credit-control')}
                  $selected={selectedSideMenuItem === 'contracts-control'}
                >
                  Контроль договоров
                </SubMenuItem>
              )}
            </SubMenu>
          )}
          
          {/* Clients Menu */}
          <MenuItem 
            onClick={(e) => {
              if (collapsed) {
                handleCollapsedMenuClick(e, 'clients', true);
              } else {
                handleMainMenuItemClick('clients', undefined, true);
              }
            }}
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
            {!collapsed && (
              <>
                <MenuItemText>Клиенты</MenuItemText>
                <ExpandArrow 
                  width="14" 
                  height="8" 
                  viewBox="0 0 14 8" 
                  fill="none" 
                  $expanded={expandedItem === 'clients'}
                >
                  <path 
                    d="M1 1.32422L7 7.32422L13 1.32422" 
                    stroke="#50555C" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </ExpandArrow>
              </>
            )}
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
              {(denyPermission('FORBID_CREDIT_APPLICATIONS', true) && 
                <SubMenuItem 
                  onClick={() => handleSubMenuItemClick('credit-application', '/credit-application')}
                  $selected={selectedSideMenuItem === 'credit-application'}
                >
                  Заявки
                </SubMenuItem>
              )}
              <SubMenuItem 
                onClick={() => handleSubMenuItemClick('queue', '/queue')}
                $selected={selectedSideMenuItem === 'queue'}
              >
                Очередь
              </SubMenuItem>
            </SubMenu>
          )}
          
          {/* Payments Menu */}
          <MenuItem 
            onClick={(e) => {
              if (collapsed) {
                handleCollapsedMenuClick(e, 'payments', true);
              } else {
                handleMainMenuItemClick('payments', undefined, true);
              }
            }}
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
            {!collapsed && (
              <>
                <MenuItemText>Платежи</MenuItemText>
                <ExpandArrow 
                  width="14" 
                  height="8" 
                  viewBox="0 0 14 8" 
                  fill="none" 
                  $expanded={expandedItem === 'payments'}
                >
                  <path 
                    d="M1 1.32422L7 7.32422L13 1.32422" 
                    stroke="#50555C" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </ExpandArrow>
              </>
            )}
          </MenuItem>
          
          {!collapsed && expandedItem === 'payments' && (
            <SubMenu>
              <SubMenuLine />
              <SubMenuItem 
                onClick={() => handleSubMenuItemClick('pending-payments', '/schedules')}
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
          
          {/* Investors Menu */}
          {(hasRole('админ') || hasRole('директор') || hasRole('суперадмин')) && (
            <MenuItem 
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, 'investors', true);
                } else {
                  handleMainMenuItemClick('investors', undefined, true);
                }
              }}
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
              {!collapsed && (
                <>
                  <MenuItemText>Инвесторы</MenuItemText>
                  <ExpandArrow 
                    width="14" 
                    height="8" 
                    viewBox="0 0 14 8" 
                    fill="none" 
                    $expanded={expandedItem === 'investors'}
                  >
                    <path 
                      d="M1 1.32422L7 7.32422L13 1.32422" 
                      stroke="#50555C" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </ExpandArrow>
                </>
              )}
            </MenuItem>
          )}
          
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
              <SubMenuItem 
                onClick={() => handleSubMenuItemClick('investors-pool', '/investors-pool')}
                $selected={selectedSideMenuItem === 'investors-pool'}
              >
                Пулы инвесторов
              </SubMenuItem>
            </SubMenu>
          )}
          
          {/* References Menu */}
          <MenuItem 
            onClick={(e) => {
              if (collapsed) {
                handleCollapsedMenuClick(e, 'references', true);
              } else {
                handleMainMenuItemClick('references', undefined, true);
              }
            }}
            $collapsed={collapsed}
            $selected={selectedSideMenuItem === 'products'}
          >
            <Icon 
              src={referencesIcon} 
              $collapsed={collapsed} 
              $selected={selectedSideMenuItem === 'products'} 
            />
            {!collapsed && (
              <>
                <MenuItemText>Справочники</MenuItemText>
                <ExpandArrow 
                  width="14" 
                  height="8" 
                  viewBox="0 0 14 8" 
                  fill="none" 
                  $expanded={expandedItem === 'references'}
                >
                  <path 
                    d="M1 1.32422L7 7.32422L13 1.32422" 
                    stroke="#50555C" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </ExpandArrow>
              </>
            )}
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
              <SubMenuItem 
                onClick={() => handleSubMenuItemClick('black-catalog', '/black-catalog')}
                $selected={selectedSideMenuItem === 'black-catalog'}
              >
                Чёрный каталог
              </SubMenuItem>
              {(isSuperAdminCompany()) && (
                <SubMenuItem 
                  onClick={() => handleSubMenuItemClick('registration-requests', '/registration-requests')}
                  $selected={selectedSideMenuItem === 'registration-requests'}
                >
                  Заявки на регистрацию
                </SubMenuItem>
              )}
            </SubMenu>
          )}
          
          {/* Finance Menu */}
          {(hasPermission('MANAGE_ACCOUNTING', true)) && (
            <MenuItem 
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, 'finance', true);
                } else {
                  handleMainMenuItemClick('finance', undefined, true);
                }
              }}
              $collapsed={collapsed}
              $selected={selectedSideMenuItem === 'budget'} 
            >
              <Icon 
                src={financeIcon} 
                $collapsed={collapsed} 
                $selected={selectedSideMenuItem === 'budget'} 
              />
              {!collapsed && (
                <>
                  <MenuItemText>Финансы</MenuItemText>
                  <ExpandArrow 
                    width="14" 
                    height="8" 
                    viewBox="0 0 14 8" 
                    fill="none" 
                    $expanded={expandedItem === 'finance'}
                  >
                    <path 
                      d="M1 1.32422L7 7.32422L13 1.32422" 
                      stroke="#50555C" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </ExpandArrow>
                </>
              )}
            </MenuItem>
          )}
          
          {!collapsed && expandedItem === 'finance' && (hasPermission('MANAGE_ACCOUNTING', true)) && (
            <SubMenu>
              <SubMenuLine />
              <SubMenuItem 
                onClick={() => handleSubMenuItemClick('budget', '/budget')}
                $selected={selectedSideMenuItem === 'budget'}
              >
                Бюджет
              </SubMenuItem>
              <SubMenuItem 
                onClick={() => handleSubMenuItemClick('payments-income', '/payments-income')}
                $selected={selectedSideMenuItem === 'payments-income'}
              >
                Доходы от платежей
              </SubMenuItem>
            </SubMenu>
          )}
        </ScrollableMenuContent>

        <BottomMenuSection>
          {!collapsed && <Divider />}
          
          {/* Profile */}
          <MenuItem 
            onClick={(e) => {
              if (collapsed) {
                handleCollapsedMenuClick(e, 'profile', false);
              } else {
                handleMenuItemClick('profile', '/profile');
              }
            }}
            $collapsed={collapsed}
            $selected={selectedSideMenuItem === 'profile'}
          >
            <Icon src={profileIcon} $collapsed={collapsed} $selected={selectedSideMenuItem === 'profile'} />
            {!collapsed && <MenuItemText>Профиль</MenuItemText>}
          </MenuItem>

          {/* Admin Panel */}
          {hasRole('суперадмин') && (
            <MenuItem 
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, 'admin', false);
                } else {
                  handleMenuItemClick('admin', '/admin');
                }
              }}
              $collapsed={collapsed}
              $selected={selectedSideMenuItem === 'admin'}
            >
              <Icon 
                src={analyticsIcon}
                $collapsed={collapsed} 
                $selected={selectedSideMenuItem === 'admin'} 
              />
              {!collapsed && <MenuItemText>Админ-панель</MenuItemText>}
            </MenuItem>
          )}
        </BottomMenuSection>
                  {/* About - всегда в самом низу */}
          <MenuItem
            onClick={(e) => {
              if (collapsed) {
                handleCollapsedMenuClick(e, 'about', false);
              } else {
                handleMenuItemClick('about', '/about');
              }
            }}
            $collapsed={collapsed}
            $selected={selectedSideMenuItem === 'about'}
          >
            {!collapsed ? (
              <>
                <AboutIcon $selected={selectedSideMenuItem === 'about'}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                          stroke={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                          strokeWidth="1.25" 
                          strokeLinecap="round"/>
                    <path d="M11 12V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12Z" 
                          fill={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                          stroke={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                          strokeWidth="1.25" 
                          strokeLinecap="round"/>
                    <path d="M13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8C11 8.55229 11.4477 9 12 9C12.5523 9 13 8.55229 13 8Z" 
                          fill={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                          stroke={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                          strokeWidth="1.25" 
                          strokeLinecap="round"/>
                  </svg>
                </AboutIcon>
                <MenuItemText>О программе</MenuItemText>
              </>
            ) : (
              <AboutIconCollapsed $selected={selectedSideMenuItem === 'about'}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                        stroke={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                        strokeWidth="1.25" 
                        strokeLinecap="round"/>
                  <path d="M11 12V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12Z" 
                        fill={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                        stroke={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                        strokeWidth="1.25" 
                        strokeLinecap="round"/>
                  <path d="M13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8C11 8.55229 11.4477 9 12 9C12.5523 9 13 8.55229 13 8Z" 
                        fill={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                        stroke={selectedSideMenuItem === 'about' ? "#000" : "#50555C"} 
                        strokeWidth="1.25" 
                        strokeLinecap="round"/>
                </svg>
              </AboutIconCollapsed>
            )}
          </MenuItem>
      </MenuList>
      
      {/* Context Menu для свернутого состояния */}
      {contextMenu.visible && (
        <ContextMenu
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {getSubItems(contextMenu.mainItem).map((item) => (
            <ContextMenuItem
              key={item.key}
              onClick={() => handleContextMenuAction(item.key, item.path)}
              $selected={selectedSideMenuItem === item.key}
            >
              {item.label}
            </ContextMenuItem>
          ))}
        </ContextMenu>
      )}
      
      <RightBorder $collapsed={collapsed} />
    </SideMenuContainer>
  );
};

const ContextMenu = styled.div`
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 8px;
  z-index: 1000;
  min-width: 180px;
`;

const ContextMenuItem = styled.div<{ $selected?: boolean }>`
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: ${({ $selected }) => ($selected ? '#000' : '#50555c')};
  background-color: ${({ $selected }) => ($selected ? 'rgba(209, 213, 219, 1)' : 'transparent')};
  
  &:hover {
    background-color: ${({ $selected }) => ($selected ? 'rgba(209, 213, 219, 1)' : 'rgba(209, 213, 219, 0.5)')};
    color: #000;
  }
`;

const ScrollableMenuContent = styled.div`
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
  
  -ms-overflow-style: none;  /* IE и Edge */
  scrollbar-width: none;  /* Firefox */
`;

const BottomMenuSection = styled.div`
  width: 100%;
  margin-bottom: auto;
`;

const MenuItem = styled.div<MenuItemProps>`
  display: flex;
  align-items: center;
  padding: ${({ $collapsed }) => ($collapsed ? '15px 0' : '15px 17px')};
  margin-bottom: 3px;
  cursor: pointer;
  border-radius: 8px;
  width: ${({ $collapsed }) => ($collapsed ? '45px' : '100%')};
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
  height: 100%;
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

const ExpandArrow = styled.svg<{ $expanded: boolean }>`
  margin-left: auto;
  transition: transform 0.2s ease;
  transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0)')};
`;

const AboutIcon = styled.div<{ $selected?: boolean }>`
  width: 24px;
  height: 24px;
  margin-right: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AboutIconCollapsed = styled.div<{ $selected?: boolean }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default SideMenu;
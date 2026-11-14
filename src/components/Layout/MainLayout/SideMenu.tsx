import styled from "styled-components";
import arrow from "../../../assets/ui/arrow.svg";
import logo from "../../../assets/logos/vectorLogo.svg";
import analyticsIcon from "../../../assets/ui/MenuItems/analitic.svg";
import contractsIcon from "../../../assets/ui/MenuItems/credits.svg";
import clientsIcon from "../../../assets/ui/MenuItems/clients.svg";
import paymentsIcon from "../../../assets/ui/MenuItems/payments.svg";
import investorsIcon from "../../../assets/ui/MenuItems/investors.svg";
import financeIcon from "../../../assets/ui/MenuItems/finance.svg";
import profileIcon from "../../../assets/ui/MenuItems/profile.svg";
import blackCatalogIcon from "../../../assets/ui/MenuItems/oldclients.svg";
import { useState, useContext, useEffect } from "react";
import { SideMenuContext } from "./SideMenuContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../сontext/AuthContext";
import { getAutoCollapseMenuSetting } from "../../modal/SettingsModal";
import { FILE_BASE_URL } from "../../../api/client";
import { getInitials, generateAvatar } from "../../../utils/avatarUtils";
import { authStorage } from "../../../api/utils/auth-storage";
import useCompany from "../../../api/hooks/useCompany";
import React from "react";
import type { CommonInfo } from "../../../api/types/company";
import { formatDate, getLicenseDateColor } from "../../../utils/dateFormatter";
import { usePwaInstall } from "../../../hooks/usePwaInstall";
import InstallAppHelpModal from "../../modal/InstallAppHelpModal";

type CollapsibleProps = {
  $collapsed?: boolean;
};

type MenuItemProps = CollapsibleProps & {
  $selected?: boolean;
  onClick?: () => void;
};

const menuItemsMap: Record<
  string,
  { mainItem: string; subItems?: Record<string, string> }
> = {
  "/admin": { mainItem: "admin" },
  "/analytics": { mainItem: "analytics" },
  "/credits": { mainItem: "contracts", subItems: { "/credits": "contracts" } },
  "/credit-control": {
    mainItem: "contracts",
    subItems: { "/credit-control": "contracts-control" },
  },
  // Подпункт у «Клиентов» один (чёрный список переехал в карточки), поэтому
  // пункт без раскрытия — сразу ведёт на страницу.
  "/clients": { mainItem: "clients" },
  // '/credit-application': { mainItem: 'clients', subItems: { '/credit-application': 'credit-application' } },
  "/schedules": {
    mainItem: "payments",
    subItems: { "/schedules": "pending-payments" },
  },
  "/schedule-calendar": {
    mainItem: "payments",
    subItems: { "/schedule-calendar": "payments-calendar" },
  },
  "/payments": {
    mainItem: "payments",
    subItems: { "/payments": "payments-journal" },
  },
  "/investors": { mainItem: "investors" },
  "/investors-v2": { mainItem: "investors" },
  "/investors-report": { mainItem: "investors" },
  "/investors-pool": { mainItem: "investors" },
  "/black-catalog": { mainItem: "black-catalog" },
  "/finance": { mainItem: "finance" },
  "/calc": { mainItem: "calc" },
  "/profile": { mainItem: "profile" },
  "/settings": { mainItem: "settings" },
};

const SideMenu = () => {
  const {
    collapsed,
    toggleCollapsed,
    selectedSideMenuItem,
    setSelectedSideMenuItem,
  } = useContext(SideMenuContext);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const { getCommonInfo } = useCompany();
  const [commonInfo, setCommonInfo] = React.useState<CommonInfo | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    mainItem: string;
  }>({ visible: false, x: 0, y: 0, mainItem: "" });

  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole, hasPermission, denyPermission, authInfo } = useAuth();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const handleInstallApp = async () => {
    if (isInstalling) return;

    if (!canInstall) {
      setShowInstallHelp(true);
      return;
    }

    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCommonInfo();
        setCommonInfo(data);
      } catch (err) {
        console.error(err);
      } finally {
      }
    };

    fetchData();
  }, [getCommonInfo]);

  const getDaysUntilExpiry = (dateString: string): string => {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `Осталось ${diffDays} дней`;
    if (diffDays === 0) return "Срок истекает сегодня";
    return `Просрочено на ${Math.abs(diffDays)} дней`;
  };

  const employee = authInfo?.employee;
  const licenceDate = commonInfo?.licenceDate ?? new Date();
  const currentDate = formatDate(licenceDate);
  const daysUntilExpiry = getDaysUntilExpiry(licenceDate);
  const licenseDateColor = getLicenseDateColor(daysUntilExpiry);

  const firstName = employee?.fullName ? employee.fullName.split(" ")[0] : "";

  const avatarSrc = employee?.photoPath
    ? `${FILE_BASE_URL}${employee.photoPath}`
    : generateAvatar(getInitials(employee?.fullName || ""), 40);

  const menuItemPermissions: Record<string, () => boolean> = {
    analytics: () =>
      hasPermission("VIEW_ANALYTIC", true) ||
      hasRole("директор") ||
      hasRole("суперадмин") ||
      hasPermission("MANAGE_ACCOUNTING", true),
    contracts: () => true,
    "contracts-control": () =>
      hasRole("админ") || hasRole("директор") || hasRole("суперадмин"),
    clients: () => true,
    // 'credit-application': () => denyPermission('FORBID_CREDIT_APPLICATIONS'),
    "pending-payments": () => true,
    "payments-calendar": () =>
      hasRole("админ") ||
      hasRole("директор") ||
      hasRole("суперадмин") ||
      hasPermission("MANAGE_ACCOUNTING", true),
    "payments-journal": () => true,
    investors: () =>
      hasRole("админ") || hasRole("директор") || hasRole("суперадмин"),
    "black-catalog": () => true,
    finance: () => hasPermission("MANAGE_ACCOUNTING", true),
    calc: () => true,
    profile: () => true,
    settings: () => true,
    admin: () => hasRole("суперадмин"),
  };

  const checkMenuItemPermission = (menuItemKey: string): boolean => {
    const permissionCheck = menuItemPermissions[menuItemKey];
    return permissionCheck ? permissionCheck() : true;
  };

  const getCurrentMenuItem = () => {
    const currentPath = location.pathname;

    if (
      currentPath.startsWith("/finance") ||
      currentPath.startsWith("/budget") ||
      currentPath.startsWith("/payments-income")
    ) {
      return "finance";
    }

    const menuItem = menuItemsMap[currentPath];

    if (menuItem) {
      if (menuItem.subItems) {
        const subItemKey = Object.keys(menuItem.subItems).find((key) =>
          currentPath.startsWith(key)
        );
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
      setContextMenu({ visible: false, x: 0, y: 0, mainItem: "" });
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleMainMenuItemClick = (
    item: string,
    path?: string,
    hasSubItems?: boolean
  ) => {
    if (collapsed && hasSubItems) {
      return;
    }

    if (path) {
      handleMenuItemClick(item, path);
    } else if (hasSubItems) {
      toggleItem(item);
    }
  };

  const handleCollapsedMenuClick = (
    e: React.MouseEvent,
    mainItem: string,
    hasSubItems: boolean
  ) => {
    if (!collapsed) return;

    e.stopPropagation();

    if (hasSubItems) {
      const rect = e.currentTarget.getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: rect.right + 5,
        y: rect.top,
        mainItem,
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

  const getSubItems = (
    mainItem: string
  ): { key: string; label: string; path: string }[] => {
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
      contracts: "Договоры",
      "contracts-control": "Контроль договоров",
      clients: "Клиенты",
      // 'credit-application': 'Заявки',
      "pending-payments": "Ожидаемые",
      "payments-calendar": "Календарь",
      "payments-journal": "Журнал",
      investors: "Инвесторы",
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
    setContextMenu({ visible: false, x: 0, y: 0, mainItem: "" });

    if (getAutoCollapseMenuSetting() && !collapsed) {
      toggleCollapsed();
    }
  };

  const handleSubMenuItemClick = (item: string, path: string) => {
    setSelectedSideMenuItem(item);
    navigate(path);
    setContextMenu({ visible: false, x: 0, y: 0, mainItem: "" });

    if (getAutoCollapseMenuSetting() && !collapsed) {
      toggleCollapsed();
    }
  };

  const toggleMenu = () => {
    toggleCollapsed();
    setExpandedItem(null);
    setContextMenu({ visible: false, x: 0, y: 0, mainItem: "" });
  };

  const handleContextMenuAction = (action: string, path: string) => {
    handleSubMenuItemClick(action, path);
  };

  const handleLogout = () => {
    authStorage.clear();
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/auth";
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  // --- Кастомизация порядка пунктов меню (drag & drop) ---
  const DEFAULT_MENU_ORDER = [
    "analytics",
    "contracts",
    "clients",
    "payments",
    "investors",
    "finance",
    "calc",
    "black-catalog",
    "settings",
    "admin",
  ];
  const MENU_ORDER_STORAGE_KEY = "sideMenuOrder";

  const [menuOrder, setMenuOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(MENU_ORDER_STORAGE_KEY);
      const saved: string[] = raw ? JSON.parse(raw) : [];
      const order = saved.filter((k) => DEFAULT_MENU_ORDER.includes(k));
      // Новые/отсутствующие пункты добавляем в конец, в дефолтном порядке
      DEFAULT_MENU_ORDER.forEach((k) => {
        if (!order.includes(k)) order.push(k);
      });
      return order;
    } catch {
      return [...DEFAULT_MENU_ORDER];
    }
  });
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dragOverAfter, setDragOverAfter] = useState(false);

  useEffect(() => {
    localStorage.setItem(MENU_ORDER_STORAGE_KEY, JSON.stringify(menuOrder));
  }, [menuOrder]);

  const handleMenuDrop = (targetKey: string, after: boolean) => {
    if (draggingKey && draggingKey !== targetKey) {
      setMenuOrder((prev) => {
        const next = prev.filter((k) => k !== draggingKey);
        let idx = next.indexOf(targetKey);
        if (idx === -1) idx = next.length;
        else if (after) idx += 1; // вставка ПОСЛЕ целевого пункта (нужно для последнего места)
        next.splice(idx, 0, draggingKey);
        return next;
      });
    }
    setDraggingKey(null);
    setDragOverKey(null);
  };

  // Определяет, отпускаем ли мы в нижнюю половину пункта (значит — вставка после него)
  const isAfter = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientY > rect.top + rect.height / 2;
  };

  // Пропсы для перетаскиваемой обёртки пункта меню.
  // Порядок задаётся через CSS order, чтобы не перекраивать разметку.
  const dragProps = (key: string) => ({
    draggable: !collapsed,
    style: { order: menuOrder.indexOf(key) },
    $dragging: draggingKey === key,
    $dragOver: dragOverKey === key && draggingKey !== key,
    $dragOverAfter: dragOverAfter,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      setDraggingKey(key);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (draggingKey && draggingKey !== key) {
        setDragOverKey(key);
        setDragOverAfter(isAfter(e));
      }
    },
    onDragLeave: () => {
      setDragOverKey((k) => (k === key ? null : k));
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      handleMenuDrop(key, isAfter(e));
    },
    onDragEnd: () => {
      setDraggingKey(null);
      setDragOverKey(null);
    },
  });

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
        <ScrollableMenuContent>
          {(hasPermission("VIEW_ANALYTIC", true) ||
            hasRole("директор") ||
            hasRole("суперадмин") ||
            hasPermission("MANAGE_ACCOUNTING", true)) && (
            <DraggableRow {...dragProps("analytics")}>
              <MenuItem
                onClick={(e) => {
                  if (collapsed) {
                    handleCollapsedMenuClick(e, "analytics", false);
                  } else {
                    handleMenuItemClick("analytics", "/analytics");
                  }
                }}
                $collapsed={collapsed}
                $selected={selectedSideMenuItem === "analytics"}
              >
                <Icon
                  src={analyticsIcon}
                  $collapsed={collapsed}
                  $selected={selectedSideMenuItem === "analytics"}
                />
                {!collapsed && <MenuItemText>Аналитика</MenuItemText>}
              </MenuItem>
              {!collapsed && <Divider />}
            </DraggableRow>
          )}

          <DraggableRow {...dragProps("contracts")}>
            <MenuItem
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, "contracts", true);
                } else {
                  handleMainMenuItemClick("contracts", undefined, true);
                }
              }}
              $collapsed={collapsed}
              $selected={
                selectedSideMenuItem === "contracts" ||
                selectedSideMenuItem === "contracts-control"
              }
            >
              <Icon
                src={contractsIcon}
                $collapsed={collapsed}
                $selected={
                  selectedSideMenuItem === "contracts" ||
                  selectedSideMenuItem === "contracts-control"
                }
              />
              {!collapsed && (
                <>
                  <MenuItemText>Договоры</MenuItemText>
                  <ExpandArrow
                    width="14"
                    height="8"
                    viewBox="0 0 14 8"
                    fill="none"
                    $expanded={expandedItem === "contracts"}
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

            {!collapsed && expandedItem === "contracts" && (
              <SubMenu>
                <SubMenuLine />
                <SubMenuItem
                  onClick={() =>
                    handleSubMenuItemClick("contracts", "/credits")
                  }
                  $selected={selectedSideMenuItem === "contracts"}
                >
                  Договоры
                </SubMenuItem>
                {(hasRole("админ") ||
                  hasRole("директор") ||
                  hasRole("суперадмин")) && (
                  <SubMenuItem
                    onClick={() =>
                      handleSubMenuItemClick(
                        "contracts-control",
                        "/credit-control"
                      )
                    }
                    $selected={selectedSideMenuItem === "contracts-control"}
                  >
                    Контроль договоров
                  </SubMenuItem>
                )}
              </SubMenu>
            )}
          </DraggableRow>

          <DraggableRow {...dragProps("clients")}>
            <MenuItem
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, "clients", false);
                } else {
                  handleMenuItemClick("clients", "/clients");
                }
              }}
              $collapsed={collapsed}
              $selected={selectedSideMenuItem === "clients"}
            >
              <Icon
                src={clientsIcon}
                $collapsed={collapsed}
                $selected={selectedSideMenuItem === "clients"}
              />
              {!collapsed && <MenuItemText>Клиенты</MenuItemText>}
            </MenuItem>
          </DraggableRow>

          <DraggableRow {...dragProps("payments")}>
            <MenuItem
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, "payments", true);
                } else {
                  handleMainMenuItemClick("payments", undefined, true);
                }
              }}
              $collapsed={collapsed}
              $selected={
                selectedSideMenuItem === "pending-payments" ||
                selectedSideMenuItem === "payments-calendar" ||
                selectedSideMenuItem === "payments-journal"
              }
            >
              <Icon
                src={paymentsIcon}
                $collapsed={collapsed}
                $selected={
                  selectedSideMenuItem === "pending-payments" ||
                  selectedSideMenuItem === "payments-calendar" ||
                  selectedSideMenuItem === "payments-journal"
                }
              />
              {!collapsed && (
                <>
                  <MenuItemText>Платежи</MenuItemText>
                  <ExpandArrow
                    width="14"
                    height="8"
                    viewBox="0 0 14 8"
                    fill="none"
                    $expanded={expandedItem === "payments"}
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

            {!collapsed && expandedItem === "payments" && (
              <SubMenu>
                <SubMenuLine />
                <SubMenuItem
                  onClick={() =>
                    handleSubMenuItemClick("pending-payments", "/schedules")
                  }
                  $selected={selectedSideMenuItem === "pending-payments"}
                >
                  Ожидаемые
                </SubMenuItem>
                {(hasRole("админ") ||
                  hasRole("директор") ||
                  hasRole("суперадмин") ||
                  hasPermission("MANAGE_ACCOUNTING", true)) && (
                  <SubMenuItem
                    onClick={() =>
                      handleSubMenuItemClick(
                        "payments-calendar",
                        "/schedule-calendar"
                      )
                    }
                    $selected={selectedSideMenuItem === "payments-calendar"}
                  >
                    Календарь
                  </SubMenuItem>
                )}
                <SubMenuItem
                  onClick={() =>
                    handleSubMenuItemClick("payments-journal", "/payments")
                  }
                  $selected={selectedSideMenuItem === "payments-journal"}
                >
                  Журнал
                </SubMenuItem>
              </SubMenu>
            )}
          </DraggableRow>

          {(hasRole("админ") ||
            hasRole("директор") ||
            hasRole("суперадмин")) && (
            <DraggableRow {...dragProps("investors")}>
              <MenuItem
                onClick={(e) => {
                  if (collapsed) {
                    handleCollapsedMenuClick(e, "investors", false);
                  } else {
                    handleMenuItemClick("investors", "/investors");
                  }
                }}
                $collapsed={collapsed}
                $selected={selectedSideMenuItem === "investors"}
              >
                <Icon
                  src={investorsIcon}
                  $collapsed={collapsed}
                  $selected={selectedSideMenuItem === "investors"}
                />
                {!collapsed && <MenuItemText>Инвесторы</MenuItemText>}
              </MenuItem>
            </DraggableRow>
          )}

          {hasPermission("MANAGE_ACCOUNTING", true) && (
            <DraggableRow {...dragProps("finance")}>
              <MenuItem
                onClick={(e) => {
                  if (collapsed) {
                    handleCollapsedMenuClick(e, "finance", false);
                  } else {
                    handleMenuItemClick("finance", "/finance");
                  }
                }}
                $collapsed={collapsed}
                $selected={selectedSideMenuItem === "finance"}
              >
                <Icon
                  src={financeIcon}
                  $collapsed={collapsed}
                  $selected={selectedSideMenuItem === "finance"}
                />
                {!collapsed && <MenuItemText>Финансы</MenuItemText>}
              </MenuItem>
            </DraggableRow>
          )}

          <DraggableRow {...dragProps("calc")}>
            <MenuItem
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, "calc", false);
                } else {
                  handleMenuItemClick("calc", "/calc");
                }
              }}
              $collapsed={collapsed}
              $selected={selectedSideMenuItem === "calc"}
            >
              <Icon
                src={financeIcon}
                $collapsed={collapsed}
                $selected={selectedSideMenuItem === "calc"}
              />
              {!collapsed && <MenuItemText>Конструктор</MenuItemText>}
            </MenuItem>
          </DraggableRow>

          <DraggableRow {...dragProps("black-catalog")}>
            <MenuItem
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, "black-catalog", false);
                } else {
                  handleMenuItemClick("black-catalog", "/black-catalog");
                }
              }}
              $collapsed={collapsed}
              $selected={selectedSideMenuItem === "black-catalog"}
            >
              <Icon
                src={blackCatalogIcon || analyticsIcon}
                $collapsed={collapsed}
                $selected={selectedSideMenuItem === "black-catalog"}
              />
              {!collapsed && <MenuItemText>ЧС+</MenuItemText>}
            </MenuItem>
          </DraggableRow>

          {/* Пункт "Настройки" ведет на /settings */}
          <DraggableRow {...dragProps("settings")}>
            <MenuItem
              onClick={(e) => {
                if (collapsed) {
                  handleCollapsedMenuClick(e, "settings", false);
                } else {
                  handleMenuItemClick("settings", "/settings");
                }
              }}
              $collapsed={collapsed}
              $selected={selectedSideMenuItem === "settings"}
            >
              <Icon
                src={profileIcon}
                $collapsed={collapsed}
                $selected={selectedSideMenuItem === "settings"}
              />
              {!collapsed && <MenuItemText>Настройки</MenuItemText>}
            </MenuItem>
          </DraggableRow>

          {hasRole("суперадмин") && (
            <DraggableRow {...dragProps("admin")}>
              <MenuItem
                onClick={(e) => {
                  if (collapsed) {
                    handleCollapsedMenuClick(e, "admin", false);
                  } else {
                    handleMenuItemClick("admin", "/admin");
                  }
                }}
                $collapsed={collapsed}
                $selected={selectedSideMenuItem === "admin"}
              >
                <Icon
                  src={analyticsIcon}
                  $collapsed={collapsed}
                  $selected={selectedSideMenuItem === "admin"}
                />
                {!collapsed && <MenuItemText>Админ-панель</MenuItemText>}
              </MenuItem>
            </DraggableRow>
          )}
        </ScrollableMenuContent>
      </MenuList>

      {!isInstalled && (
        <InstallAppButton
          type="button"
          onClick={handleInstallApp}
          disabled={isInstalling}
          $collapsed={collapsed}
          title="Установить WayPay на компьютер"
          aria-label="Установить WayPay на компьютер"
        >
          {/* В стиле иконки «Экспорт» (тонкий контур), но по смыслу другая:
              монитор со стрелкой вниз — «установить на компьютер». */}
          <svg
            width="19"
            height="19"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="1.25"
              y="1.5"
              width="15.5"
              height="10.75"
              rx="1.75"
              stroke="currentColor"
              strokeWidth="1.1"
            />
            <path
              d="M9 4V9M6.75 6.875L9 9.125L11.25 6.875M9 12.25V16.25M5.75 16.5H12.25"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!collapsed && (
            <span>{isInstalling ? "Установка..." : "Установить приложение"}</span>
          )}
        </InstallAppButton>
      )}

      {/* Блок с профилем - теперь всегда в самом низу */}
      {employee &&
        (collapsed ? (
          <CollapsedUserProfileBlock
            onClick={handleProfileClick}
            $selected={selectedSideMenuItem === "profile"}
          >
            <CollapsedUserAvatar src={avatarSrc} alt={employee.fullName} />
          </CollapsedUserProfileBlock>
        ) : (
          <UserProfileBlock
            onClick={handleProfileClick}
            $selected={selectedSideMenuItem === "profile"}
          >
            <UserAvatar src={avatarSrc} alt={employee.fullName} />
            <UserInfo>
              <UserFullName>{employee.fullName}</UserFullName>
              <UserRole>{employee.role}</UserRole>
              <UserDate $color={licenseDateColor}>{currentDate}</UserDate>
            </UserInfo>
            <LogoutButton
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Выйти"
            >
              <svg width="18" height="18" viewBox="0 0 16 17" fill="none">
                <path
                  d="M7.5 0.625C7.72302 0.625247 7.93753 0.710644 8.0997 0.863742C8.26187 1.01684 8.35946 1.22608 8.37253 1.44872C8.3856 1.67136 8.31316 1.89058 8.17002 2.0616C8.02688 2.23262 7.82383 2.34253 7.60237 2.36888L7.5 2.375H3.125C2.91068 2.37503 2.70383 2.45371 2.54367 2.59613C2.38352 2.73854 2.2812 2.93478 2.25612 3.14762L2.25 3.25V13.75C2.25003 13.9643 2.32871 14.1712 2.47113 14.3313C2.61354 14.4915 2.80978 14.5938 3.02262 14.6189L3.125 14.625H7.0625C7.28552 14.6252 7.50003 14.7106 7.6622 14.8637C7.82437 15.0168 7.92196 15.2261 7.93503 15.4487C7.9481 15.6714 7.87566 15.8906 7.73252 16.0616C7.58938 16.2326 7.38633 16.3425 7.16487 16.3689L7.0625 16.375H3.125C2.45544 16.375 1.81117 16.1192 1.32402 15.6599C0.836869 15.2005 0.543656 14.5724 0.504375 13.904L0.5 13.75V3.25C0.499963 2.58044 0.755785 1.93617 1.21512 1.44902C1.67446 0.961869 2.30259 0.668656 2.971 0.629375L3.125 0.625H7.5ZM12.4936 5.406L14.9681 7.88138C15.1322 8.04546 15.2243 8.26798 15.2243 8.5C15.2243 8.73202 15.1322 8.95454 14.9681 9.11862L12.4936 11.594C12.3294 11.7581 12.1068 11.8502 11.8747 11.8501C11.6426 11.85 11.42 11.7577 11.2559 11.5936C11.0919 11.4294 10.9997 11.2067 10.9998 10.9746C10.9999 10.7425 11.0922 10.5199 11.2564 10.3559L12.2372 9.375H7.5C7.26794 9.375 7.04538 9.28281 6.88128 9.11872C6.71719 8.95462 6.625 8.73206 6.625 8.5C6.625 8.26794 6.71719 8.04538 6.88128 7.88128C7.04538 7.71719 7.26794 7.625 7.5 7.625H12.2372L11.2564 6.64412C11.0922 6.48006 10.9999 6.25748 10.9998 6.02537C10.9997 5.79326 11.0919 5.57062 11.2559 5.40644C11.42 5.24225 11.6426 5.14997 11.8747 5.14989C12.1068 5.1498 12.3294 5.24193 12.4936 5.406Z"
                  fill="#50555C"
                />
              </svg>
            </LogoutButton>
          </UserProfileBlock>
        ))}

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

      <InstallAppHelpModal
        isOpen={showInstallHelp}
        onClose={() => setShowInstallHelp(false)}
      />

      <RightBorder $collapsed={collapsed} />
    </SideMenuContainer>
  );
};

const UserProfileBlock = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 1px 17px;
  margin: 8px 0;
  background-color: ${({ $selected }) =>
    $selected ? "rgba(209, 213, 219, 1)" : "#F3F4F6"};
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ $selected }) =>
      $selected ? "rgba(209, 213, 219, 1)" : "#E5E7EB"};
  }
`;

const CollapsedUserProfileBlock = styled.div<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
  border-radius: 8px;
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${({ $selected }) =>
    $selected ? "rgba(209, 213, 219, 1)" : "transparent"};
  padding: ${({ $selected }) => ($selected ? "8px 0" : "8px 0")};

  &:hover {
    background-color: ${({ $selected }) =>
      $selected ? "rgba(209, 213, 219, 1)" : "rgba(209, 213, 219, 0.5)"};
  }
`;

const CollapsedUserAvatar = styled.img`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const UserFullName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`;

const UserRole = styled.div`
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`;

const UserDate = styled.div<{ $color?: string }>`
  font-size: 12px;
  color: ${({ $color }) => $color || "#9CA3AF"};
  margin-top: 2px;
  text-align: left;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);

    svg path {
      fill: #000;
    }
  }
`;

const InstallAppButton = styled.button<CollapsibleProps>`
  width: 100%;
  min-height: 40px;
  margin: 8px 0 2px;
  padding: ${({ $collapsed }) => ($collapsed ? "0" : "0 14px")};
  border: 1px solid rgba(0, 139, 139, 0.35);
  border-radius: 8px;
  background: rgba(0, 139, 139, 0.08);
  color: #007d88;
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
  gap: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  svg {
    flex-shrink: 0;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 139, 139, 0.15);
    border-color: rgba(0, 139, 139, 0.55);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 139, 139, 0.4);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }
`;

const ContextMenu = styled.div`
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 8px;
  z-index: 1000;
  min-width: 180px;
`;

const ContextMenuItem = styled.div<{ $selected?: boolean }>`
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: ${({ $selected }) => ($selected ? "#000" : "#50555c")};
  background-color: ${({ $selected }) =>
    $selected ? "rgba(209, 213, 219, 1)" : "transparent"};

  &:hover {
    background-color: ${({ $selected }) =>
      $selected ? "rgba(209, 213, 219, 1)" : "rgba(209, 213, 219, 0.5)"};
    color: #000;
  }
`;

const ScrollableMenuContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
`;

// Перетаскиваемая обёртка пункта меню (drag & drop для кастомизации порядка)
const DraggableRow = styled.div<{
  $dragging?: boolean;
  $dragOver?: boolean;
  $dragOverAfter?: boolean;
}>`
  width: 100%;
  position: relative;
  user-select: none;
  border-radius: 8px;
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};
  transition: opacity 0.15s ease;

  &[draggable="true"] {
    cursor: grab;
  }
  &[draggable="true"]:active {
    cursor: grabbing;
  }

  ${({ $dragOver, $dragOverAfter }) =>
    $dragOver &&
    ($dragOverAfter
      ? `box-shadow: inset 0 -3px 0 rgba(0, 125, 136, 1);`
      : `box-shadow: inset 0 3px 0 rgba(0, 125, 136, 1);`)}
`;

const MenuItem = styled.div<MenuItemProps>`
  display: flex;
  align-items: center;
  padding: ${({ $collapsed }) => ($collapsed ? "15px 0" : "15px 17px")};
  margin-bottom: 3px;
  cursor: pointer;
  border-radius: 8px;
  width: ${({ $collapsed }) => ($collapsed ? "45px" : "100%")};
  height: 35px;
  max-width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  color: ${({ $selected }) => ($selected ? "#000" : "#50555c")};
  background-color: ${({ $selected }) =>
    $selected ? "rgba(209, 213, 219, 1)" : "transparent"};
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};

  &:hover {
    background-color: ${({ $selected }) =>
      $selected ? "rgba(209, 213, 219, 1)" : "rgba(209, 213, 219, 0.5)"};
    color: #000;

    img {
      filter: ${({ $selected }) =>
        $selected ? "brightness(0)" : "brightness(0.7)"};
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
  color: ${({ $selected }) => ($selected ? "#000" : "#50555c")};
  text-align: left;
  font-weight: 500;
  position: relative;
  background-color: ${({ $selected }) =>
    $selected ? "rgba(209, 213, 219, 1)" : "transparent"};

  &:hover {
    background-color: ${({ $selected }) =>
      $selected ? "rgba(209, 213, 219, 1)" : "rgba(209, 213, 219, 0.5)"};
    color: #000;
  }
`;

const Icon = styled.img<CollapsibleProps & { $selected?: boolean }>`
  width: 21px;
  height: 21px;
  margin-right: ${({ $collapsed }) => ($collapsed ? "0" : "17px")};
  transition: all 0.2s ease;
  filter: ${({ $selected }) =>
    $selected ? "brightness(0)" : "brightness(0.7)"};
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
  width: ${({ $collapsed }) => ($collapsed ? "70px" : "315px")};
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
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
`;

const ArrowIcon = styled.img<CollapsibleProps>`
  width: 22px;
  height: 22px;
  margin-bottom: 28px;
  cursor: pointer;
  transform: ${({ $collapsed }) =>
    $collapsed ? "rotate(180deg)" : "rotate(0)"};
  transition: transform 0.3s ease;
`;

const Logo = styled.img`
  width: 85%;
  max-width: 196px;
  align-self: center;
  margin-bottom: 22px;
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
  transform: ${({ $expanded }) => ($expanded ? "rotate(180deg)" : "rotate(0)")};
`;

export default SideMenu;

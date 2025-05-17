import { createContext } from 'react';

interface SideMenuContextType {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export const SideMenuContext = createContext<SideMenuContextType>({
  collapsed: false,
  toggleCollapsed: () => {},
});
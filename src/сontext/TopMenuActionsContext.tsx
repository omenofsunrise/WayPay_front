import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface TopMenuActionsContextType {
  rightAction: ReactNode | null;
  setRightAction: (node: ReactNode | null) => void;
}

const TopMenuActionsContext = createContext<TopMenuActionsContextType>({
  rightAction: null,
  setRightAction: () => {},
});

export const TopMenuActionsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [rightAction, setRightActionState] = useState<ReactNode | null>(null);
  const setRightAction = useCallback((node: ReactNode | null) => {
    setRightActionState(node);
  }, []);

  return (
    <TopMenuActionsContext.Provider value={{ rightAction, setRightAction }}>
      {children}
    </TopMenuActionsContext.Provider>
  );
};

export const useTopMenuActions = () => useContext(TopMenuActionsContext);

import styled from "styled-components";
import { motion, type HTMLMotionProps } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

export interface ContextMenuItem {
  label: string | React.ReactNode;
  action?: () => void;
  color?: string;
  submenu?: ContextMenuItem[];
  disabled?: boolean;
  dividerBefore?: boolean;
}

interface ContextMenuProps extends HTMLMotionProps<"div"> {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
  ...props
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const getAdjustedPosition = () => {
    if (!menuRef.current) return { x, y };

    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scrollY = window.scrollY || window.pageYOffset;

    let adjustedX = x;
    let adjustedY = y;

    if (adjustedX + menuWidth > windowWidth) {
      adjustedX = x - menuWidth;
    }

    if (adjustedY + menuHeight > windowHeight) {
      adjustedY = y - menuHeight;
    }

    return { x: adjustedX, y: adjustedY };
  };

  const position = getAdjustedPosition();

  // Если справа от меню не помещается подменю — раскрываем его влево.
  const submenuOpensLeft = (() => {
    const rect = menuRef.current?.getBoundingClientRect();
    if (!rect) return false;
    const SUBMENU_WIDTH = 220;
    return rect.right + SUBMENU_WIDTH > window.innerWidth;
  })();

  const handleItemClick = (item: ContextMenuItem, index: number) => {
    if (item.submenu) {
      setActiveSubmenu(activeSubmenu === index ? null : index);
    } else if (item.action) {
      item.action();
      onClose();
    }
  };

  const handleMouseEnter = (index: number) => {
    if (items[index].submenu) {
      setActiveSubmenu(index);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Проверяем, не покидаем ли мы меню полностью
    if (!menuRef.current?.contains(e.relatedTarget as Node)) {
      setActiveSubmenu(null);
    }
  };

  return (
    <ContextMenuContainer
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {items.map((item, index) => (
        <ContextMenuItemWrapper
          key={index}
          $hasSubmenu={!!item.submenu}
          $disabled={item.disabled}
          $dividerBefore={item.dividerBefore}
        >
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                handleItemClick(item, index);
              }
            }}
            onMouseEnter={() => !item.disabled && handleMouseEnter(index)}
            whileHover={
              !item.disabled
                ? {
                    backgroundColor:
                      item.color === "#EF4444" ? "#FEF2F2" : "#f3f4f6",
                  }
                : {}
            }
            initial={{ backgroundColor: "#ffffff" }}
            $color={item.color}
            $disabled={item.disabled}
          >
            <MenuItemContent>
              {item.label}
              {item.submenu && (
                <SubmenuArrow>
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path
                      d="M1.5 1.5L6 6L1.5 10.5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </SubmenuArrow>
              )}
            </MenuItemContent>
          </ContextMenuItem>

          {item.submenu && activeSubmenu === index && (
            <SubmenuContainer
              $openLeft={submenuOpensLeft}
              initial={{ opacity: 0, x: submenuOpensLeft ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: submenuOpensLeft ? -10 : 10 }}
              transition={{ duration: 0.15 }}
            >
              <ContextMenu
                x={0}
                y={0} // Подменю выравнивается по своему пункту
                items={item.submenu}
                onClose={() => setActiveSubmenu(null)}
              />
            </SubmenuContainer>
          )}
        </ContextMenuItemWrapper>
      ))}
    </ContextMenuContainer>
  );
};

const ContextMenuContainer = styled(motion.div)`
  position: absolute;
  background: #ffffff;
  border: 1px solid #eceff3;
  border-radius: 10px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16),
    0 2px 6px rgba(15, 23, 42, 0.08);
  padding: 6px;
  z-index: 1000;
  min-width: 200px;
  width: auto;
  overflow: visible;
`;

const ContextMenuItemWrapper = styled.div<{
  $hasSubmenu?: boolean;
  $disabled?: boolean;
  $dividerBefore?: boolean;
}>`
  position: relative;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  ${({ $dividerBefore }) =>
    $dividerBefore &&
    `
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #E5E7EB;
  `}
`;

const ContextMenuItem = styled(motion.div)<{
  $color?: string;
  $disabled?: boolean;
}>`
  padding: 9px 12px;
  border-radius: 7px;
  font-size: 14px;
  line-height: 1.2;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  color: ${({ $color, $disabled }) =>
    $disabled ? "#9aa1ab" : $color || "#1f2937"};
  white-space: nowrap;
  position: relative;
  transition: background-color 0.12s ease;
`;

const MenuItemContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const SubmenuArrow = styled.span`
  display: inline-flex;
  align-items: center;
  color: #9aa1ab;
`;

const SubmenuContainer = styled(motion.div)<{ $openLeft?: boolean }>`
  position: absolute;
  top: 0;
  z-index: 1001;
  ${({ $openLeft }) =>
    $openLeft
      ? "right: 100%; margin-right: 2px;"
      : "left: 100%; margin-left: 2px;"}
`;

export default ContextMenu;

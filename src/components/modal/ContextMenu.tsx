import styled from 'styled-components';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
  label: string;
  action: () => void;
  color?: string;
}

interface ContextMenuProps extends HTMLMotionProps<"div"> {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, ...props }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const getAdjustedPosition = () => {
    if (!menuRef.current) return { x, y };

    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Учитываем прокрутку страницы
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let adjustedX = x + scrollX;
    let adjustedY = y + scrollY;

    // Проверяем, чтобы меню не выходило за границы окна
    if (adjustedX + menuWidth > windowWidth + scrollX) {
      adjustedX = x + scrollX - menuWidth;
    }

    if (adjustedY + menuHeight > windowHeight + scrollY) {
      adjustedY = y + scrollY - menuHeight;
    }

    return { x: adjustedX, y: adjustedY };
  };

  const position = getAdjustedPosition();

  return (
    <ContextMenuContainer
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute', // Меняем fixed на absolute
        top: position.y,
        left: position.x,
      }}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {items.map((item, index) => (
        <ContextMenuItem
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            item.action();
            onClose();
          }}
          whileHover={{ backgroundColor: '#f3f4f6' }}
          initial={{ backgroundColor: '#ffffff' }}
          $color={item.color}
        >
          {item.label}
        </ContextMenuItem>
      ))}
    </ContextMenuContainer>
  );
};

const ContextMenuContainer = styled(motion.div)`
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 4px 0;
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
`;

const ContextMenuItem = styled(motion.div)<{ $color?: string }>`
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  color: ${({ $color }) => $color || '#333'};
`;

export default ContextMenu;
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import ContextMenu, { type ContextMenuItem } from "./ContextMenu";

/** Цвет опасного пункта: ContextMenu подсвечивает его красным фоном. */
export const DANGER_COLOR = "#EF4444";

interface FloatingContextMenuProps {
  /** Координаты клика (clientX / clientY). */
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

// ContextMenu сдвигает себя на 8px от точки привязки.
const MENU_OFFSET = 8;
const MARGIN = 8;

/**
 * Меню по правому клику в общем стиле сайта (как в таблицах, например
 * «Управление лицензиями»). Рисуется в body поверх всего, не вылезает за
 * край экрана и закрывается по клику мимо, прокрутке, Esc и изменению окна.
 */
const FloatingContextMenu: React.FC<FloatingContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const menu = ref.current?.firstElementChild as HTMLElement | null;
    if (!menu) return;

    const width = menu.offsetWidth + MENU_OFFSET;
    const height = menu.offsetHeight + MENU_OFFSET;
    let left = x;
    let top = y;
    if (left + width > window.innerWidth - MARGIN)
      left = window.innerWidth - width - MARGIN;
    if (top + height > window.innerHeight - MARGIN)
      top = window.innerHeight - height - MARGIN;

    setPos({ left: Math.max(0, left), top: Math.max(0, top) });
  }, [x, y, items]);

  useEffect(() => {
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (items.length === 0) return null;

  return createPortal(
    <Positioner
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      style={{
        left: pos?.left ?? x,
        top: pos?.top ?? y,
        visibility: pos ? "visible" : "hidden",
      }}
      // Через портал события React всё равно всплывают к родителю (карточке,
      // строке): гасим их, чтобы клик по меню не срабатывал как клик по ней.
      onClick={stop}
      onDoubleClick={stop}
      onMouseDown={stop}
      onMouseUp={stop}
      onTouchStart={stop}
      onTouchEnd={stop}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <ContextMenu x={0} y={0} items={items} onClose={onClose} />
    </Positioner>,
    document.body
  );
};

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

const Positioner = styled(motion.div)`
  position: fixed;
  z-index: 10000;
`;

export default FloatingContextMenu;

import React, { useState, useRef, useLayoutEffect } from "react";
import styled from "styled-components";
import type { Credit } from "../../../api/types/credit";
import type { TableAction } from "../tables/CustomTable";
import ContextMenu, { type ContextMenuItem } from "../../modal/ContextMenu";
import CreditCard, { type CreditCardField } from "./CreditCard";

interface CreditCardListProps {
  credits: Credit[];
  fields: CreditCardField[];
  getRowData: (credit: Credit) => any[];
  getSubtitle?: (credit: Credit) => React.ReactNode;
  selectedIndices?: number[];
  highlightedCreditId?: number | null;
  onToggleSelect?: (rowIndex: number) => void;
  onRowClick?: (rowIndex: number) => void;
  onRowDoubleClick?: (rowIndex: number) => void;
  onToggleFavourite?: (credit: Credit) => void;
  contextMenuActions?: TableAction[];
  multiSelect?: boolean;
  emptyText?: string;
}

interface MenuState {
  x: number;
  y: number;
  rowIndex: number;
  rowData: any[];
}

const CreditCardList: React.FC<CreditCardListProps> = ({
  credits,
  fields,
  getRowData,
  getSubtitle,
  selectedIndices = [],
  highlightedCreditId = null,
  onToggleSelect,
  onRowClick,
  onRowDoubleClick,
  onToggleFavourite,
  contextMenuActions = [],
  multiSelect = false,
  emptyText = "Договоров нет",
}) => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  // Позиция меню после обрезки по границам экрана (вычисляется по факту рендера).
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(
    null
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleActions = (rowData: any[]) =>
    contextMenuActions.filter(
      (action) =>
        typeof action.shouldShow !== "function" || action.shouldShow(rowData)
    );

  const openMenu = (e: React.MouseEvent, rowIndex: number, rowData: any[]) => {
    if (contextMenuActions.length === 0) return;
    e.preventDefault();
    setMenuPos(null);
    setMenu({ x: e.clientX, y: e.clientY, rowIndex, rowData });
  };

  // После рендера измеряем реальные размеры меню (offsetWidth/Height не зависят
  // от анимации масштаба) и прижимаем его к границам окна, чтобы пункты не уходили за экран.
  useLayoutEffect(() => {
    if (!menu) {
      setMenuPos(null);
      return;
    }
    const content = menuRef.current?.firstElementChild as HTMLElement | null;
    if (!content) return;

    const MARGIN = 8;
    const width = content.offsetWidth;
    const height = content.offsetHeight;

    let left = menu.x;
    let top = menu.y;
    if (left + width > window.innerWidth - MARGIN) {
      left = window.innerWidth - width - MARGIN;
    }
    if (top + height > window.innerHeight - MARGIN) {
      top = window.innerHeight - height - MARGIN;
    }
    left = Math.max(MARGIN, left);
    top = Math.max(MARGIN, top);
    setMenuPos({ left, top });
  }, [menu]);

  if (credits.length === 0) {
    return <Empty>{emptyText}</Empty>;
  }

  return (
    <Wrapper>
      {credits.map((credit, rowIndex) => {
        const rowData = getRowData(credit);
        return (
          <CreditCard
            key={credit.id}
            credit={credit}
            fields={fields}
            subtitle={getSubtitle?.(credit)}
            selected={selectedIndices.includes(rowIndex)}
            highlighted={highlightedCreditId === credit.id}
            onClick={() => onRowClick?.(rowIndex)}
            onDoubleClick={() => onRowDoubleClick?.(rowIndex)}
            onContextMenu={(e) => openMenu(e, rowIndex, rowData)}
            onToggleSelect={
              multiSelect ? () => onToggleSelect?.(rowIndex) : undefined
            }
            onToggleFavourite={
              onToggleFavourite ? () => onToggleFavourite(credit) : undefined
            }
            onActionMenu={
              contextMenuActions.length > 0
                ? (e) => openMenu(e, rowIndex, rowData)
                : undefined
            }
          />
        );
      })}

      {menu && (
        <MenuPositioner
          ref={menuRef}
          style={{
            left: menuPos?.left ?? menu.x,
            top: menuPos?.top ?? menu.y,
            visibility: menuPos ? "visible" : "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ContextMenu
            x={0}
            y={0}
            items={visibleActions(menu.rowData).map(
              (action): ContextMenuItem => {
                const item: ContextMenuItem = {
                  label: action.label,
                  color: action.color,
                  disabled: action.disabled,
                };
                if (action.getSubmenu) {
                  item.submenu = action.getSubmenu(menu.rowData);
                } else {
                  item.action = () => {
                    action.action(menu.rowData, menu.rowIndex);
                    setMenu(null);
                  };
                }
                return item;
              }
            )}
            onClose={() => setMenu(null)}
          />
        </MenuPositioner>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const Empty = styled.div`
  text-align: center;
  padding: 40px 16px;
  color: #6b7280;
  font-size: 14px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
`;

const MenuPositioner = styled.div`
  position: fixed;
  z-index: 1000;
`;

export default CreditCardList;

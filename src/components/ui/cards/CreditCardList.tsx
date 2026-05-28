import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { Credit } from '../../../api/types/credit';
import type { TableAction } from '../tables/CustomTable';
import CreditCard, { type CreditCardField } from './CreditCard';

interface CreditCardListProps {
  credits: Credit[];
  fields: CreditCardField[];
  getRowData: (credit: Credit) => any[];
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
  selectedIndices = [],
  highlightedCreditId = null,
  onToggleSelect,
  onRowClick,
  onRowDoubleClick,
  onToggleFavourite,
  contextMenuActions = [],
  multiSelect = false,
  emptyText = 'Договоров нет',
}) => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [menu]);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) {
      setMenuPos(null);
      return;
    }
    const margin = 8;
    const { width, height } = menuRef.current.getBoundingClientRect();
    const left = Math.max(margin, Math.min(menu.x, window.innerWidth - width - margin));
    const top = Math.max(margin, Math.min(menu.y, window.innerHeight - height - margin));
    setMenuPos({ top, left });
  }, [menu]);

  const openMenu = (e: React.MouseEvent, rowIndex: number, rowData: any[]) => {
    if (contextMenuActions.length === 0) return;
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, rowIndex, rowData });
  };

  if (credits.length === 0) {
    return <Empty>{emptyText}</Empty>;
  }

  const visibleActions = (rowData: any[]) =>
    contextMenuActions.filter(action =>
      typeof action.shouldShow !== 'function' || action.shouldShow(rowData)
    );

  return (
    <Wrapper>
      {credits.map((credit, rowIndex) => {
        const rowData = getRowData(credit);
        return (
          <CreditCard
            key={credit.id}
            credit={credit}
            fields={fields}
            selected={selectedIndices.includes(rowIndex)}
            highlighted={highlightedCreditId === credit.id}
            onClick={() => onRowClick?.(rowIndex)}
            onDoubleClick={() => onRowDoubleClick?.(rowIndex)}
            onContextMenu={(e) => openMenu(e, rowIndex, rowData)}
            onToggleSelect={multiSelect ? () => onToggleSelect?.(rowIndex) : undefined}
            onToggleFavourite={onToggleFavourite ? () => onToggleFavourite(credit) : undefined}
            onActionMenu={contextMenuActions.length > 0 ? (e) => openMenu(e, rowIndex, rowData) : undefined}
          />
        );
      })}

      {menu && (
        <Menu
          ref={menuRef}
          style={{
            top: menuPos?.top ?? menu.y,
            left: menuPos?.left ?? menu.x,
            visibility: menuPos ? 'visible' : 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {visibleActions(menu.rowData).map((action, i) => (
            <MenuItem
              key={`${action.label}-${i}`}
              $color={action.color}
              onClick={() => {
                action.action(menu.rowData, menu.rowIndex);
                setMenu(null);
              }}
            >
              {action.label}
            </MenuItem>
          ))}
        </Menu>
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
  color: #6B7280;
  font-size: 14px;
  border: 1px dashed #E5E7EB;
  border-radius: 12px;
  background: #F9FAFB;
`;

const Menu = styled.div`
  position: fixed;
  z-index: 1000;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  padding: 6px;
  min-width: 220px;
  max-width: calc(100vw - 16px);
  max-height: calc(100vh - 16px);
  overflow-y: auto;
`;

const MenuItem = styled.div<{ $color?: string }>`
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: ${p => p.$color ?? '#111827'};
  transition: background-color 0.15s;

  &:hover {
    background: ${p => (p.$color === '#EF4444' || p.$color === '#B91C1C' ? '#FEF2F2' : '#F3F4F6')};
  }
`;

export default CreditCardList;

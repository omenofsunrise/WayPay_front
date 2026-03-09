import styled from 'styled-components';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ContextMenu, { type ContextMenuItem } from '../../modal/ContextMenu';

type Alignment = 'left' | 'center' | 'right';

export interface Column {
  name: string;
  isSortable?: boolean;
  align?: Alignment;
  isHidden?: boolean;
}

export interface TableAction {
  label: string;
  action: (rowData: any[], rowIndex: number) => void;
  color?: string;
  disabled?: boolean;
  shouldShow?: (rowData: any[]) => boolean;
  getSubmenu?: (rowData: any[]) => ContextMenuItem[];
  showOnHover?: boolean;
}

export interface RowStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number | 'initial' | 'inherit';
  hoverBackgroundColor?: string;
}

interface CreditsTableProps {
  columns: Column[];
  data: any[][];
  onRowDoubleClick?: (rowData: any[], rowIndex: number) => void;
  contextMenuActions?: TableAction[] | ((rowData: any[]) => TableAction[]);
  onSort?: (columnIndex: number) => void;
  onRowClick?: (rowData: any[], rowIndex: number) => void;
  onMultiSelectChange?: (selectedIndices: number[]) => void;
  sortConfig?: {
    key: number | null;
    direction: 'asc' | 'desc';
  };
  selectedRow?: number | number[];
  fixedHeight?: string;
  hasTotalsRow?: boolean;
  debtChecker?: (rowData: any[]) => boolean;
  rowStyles?: { [rowIndex: number]: RowStyle };
  isLoading?: boolean;
  multiSelect?: boolean;
  selectableRows?: number[];
}

const CustomTable: React.FC<CreditsTableProps> = ({ 
  columns, 
  data, 
  onRowDoubleClick,
  contextMenuActions = [],
  onSort,
  sortConfig,
  onRowClick,
  onMultiSelectChange,
  selectedRow: externalSelectedRow,
  fixedHeight,
  hasTotalsRow,
  debtChecker,
  rowStyles = {},
  isLoading,
  multiSelect = false,
  selectableRows
}) => {
  const [internalSelectedRows, setInternalSelectedRows] = useState<number[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex: number | null;
  } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const LONG_PRESS_DURATION = 500;

  const externalSelectedRows = externalSelectedRow === undefined 
    ? undefined 
    : Array.isArray(externalSelectedRow) 
      ? externalSelectedRow 
      : [externalSelectedRow];

  const selectedRows = externalSelectedRows !== undefined 
    ? externalSelectedRows 
    : internalSelectedRows;

  const handleSort = (columnIndex: number) => {
    if (!columns[columnIndex].isSortable || !onSort) return;
    onSort(columnIndex);
  };

  const defaultDebtChecker = (row: any[]) => {
    const debtCell = row[8];
    if (typeof debtCell === 'string') {
      const debtValue = parseFloat(debtCell.replace(/[^\d.]/g, ''));
      return debtValue > 0;
    }
    return false;
  };

  const checkDebt = debtChecker || defaultDebtChecker;

  const isRowSelectable = (rowIndex: number, isTotalsRow: boolean) => {
    if (isTotalsRow) return false;
    if (!selectableRows) return true;
    return selectableRows.includes(rowIndex);
  };

  const handleRowClick = (rowIndex: number, isTotalsRow: boolean, event: React.MouseEvent) => {
    if (isTotalsRow) return;
    
    if (!isRowSelectable(rowIndex, isTotalsRow)) return;

    let newSelectedRows: number[] = [];

    if (multiSelect) {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      const isShiftPressed = event.shiftKey;

      if (isShiftPressed && selectedRows.length > 0) {
        const lastSelected = selectedRows[selectedRows.length - 1];
        const start = Math.min(lastSelected, rowIndex);
        const end = Math.max(lastSelected, rowIndex);
        
        newSelectedRows = [...selectedRows];
        for (let i = start; i <= end; i++) {
          if (isRowSelectable(i, false) && !newSelectedRows.includes(i)) {
            newSelectedRows.push(i);
          }
        }
      } else if (isCtrlPressed) {
        if (selectedRows.includes(rowIndex)) {
          newSelectedRows = selectedRows.filter(idx => idx !== rowIndex);
        } else {
          newSelectedRows = [...selectedRows, rowIndex];
        }
      } else {
        newSelectedRows = [rowIndex];
      }
    } else {
      newSelectedRows = [rowIndex];
    }

    newSelectedRows.sort((a, b) => a - b);

    if (externalSelectedRows === undefined) {
      setInternalSelectedRows(newSelectedRows);
    }

    if (onMultiSelectChange && multiSelect) {
      onMultiSelectChange(newSelectedRows);
    }

    if (onRowClick) {
      if (multiSelect) {
        onRowClick(data[rowIndex], rowIndex);
      } else {
        onRowClick(data[rowIndex], rowIndex);
      }
    }
  };

  const handleRowDoubleClick = (row: any[], rowIndex: number, isTotalsRow: boolean) => {
    if (isTotalsRow || !onRowDoubleClick) return;
    onRowDoubleClick(row, rowIndex);
  };

  const handleContextMenu = (event: React.MouseEvent, rowIndex: number, isTotalsRow: boolean) => {
    if (isTotalsRow) return;
    event.preventDefault();
    showContextMenu(event, rowIndex);
  };

  const showContextMenu = (event: React.MouseEvent | React.TouchEvent, rowIndex: number) => {
    if (contextMenuActions.length === 0) return;
    
    event.preventDefault();
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    setContextMenu({
      x: clientX,
      y: clientY,
      rowIndex
    });
  };

  const handleTouchStart = (event: React.TouchEvent, rowIndex: number, isTotalsRow: boolean) => {
    if (isTotalsRow || contextMenuActions.length === 0) return;
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    longPressTimer.current = window.setTimeout(() => {
      showContextMenu(event, rowIndex);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };
  
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) closeContextMenu();
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [contextMenu]);

  const getRowStyle = (rowIndex: number, isTotalsRow: boolean, isDebtRow: boolean): RowStyle => {
    if (isTotalsRow) {
      return { backgroundColor: '#FFFFFF', color: '#000000', fontWeight: 'bold' };
    }
    
    const customStyle = rowStyles[rowIndex] || {};
    
    if (selectedRows.includes(rowIndex)) {
      return {
        backgroundColor: customStyle.backgroundColor || '#007D88',
        color: customStyle.color || '#FFFFFF',
        fontWeight: customStyle.fontWeight || 'normal'
      };
    }
    
    return {
      backgroundColor: customStyle.backgroundColor || '#FFFFFF',
      color: customStyle.color || 'inherit',
      fontWeight: customStyle.fontWeight || 'normal'
    };
  };

  const getHoverBackgroundColor = (rowIndex: number, isTotalsRow: boolean, isDebtRow: boolean): string => {
    if (isTotalsRow) return '#FFFFFF';
    
    if (!isRowSelectable(rowIndex, isTotalsRow)) return '#FFFFFF';
    
    const rowStyle = getRowStyle(rowIndex, isTotalsRow, isDebtRow);
    if (rowStyle.hoverBackgroundColor) return rowStyle.hoverBackgroundColor;
    
    if (selectedRows.includes(rowIndex)) return '#007D88';
    if (data[rowIndex][data[rowIndex].length - 1] === false) return '#51D5B4CC';
    
    return '#F3F4F6';
  };

  const renderContextMenu = () => {
    if (!contextMenu || contextMenu.rowIndex === null || contextMenuActions.length === 0) return null;

    const rowData = data[contextMenu.rowIndex];
    if (!rowData) return null;

    const filteredActions = (typeof contextMenuActions === 'function' 
      ? contextMenuActions(rowData) 
      : contextMenuActions
    ).filter(action => 
      typeof action === 'object' && 
      (typeof action.shouldShow !== 'function' || 
      action.shouldShow(rowData))
    );

    if (filteredActions.length === 0) return null;

    return (
      <ContextMenuWrapper
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed', 
          left: contextMenu.x,
          top: contextMenu.y,
          zIndex: 1000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ContextMenu
          items={filteredActions.map((action, index) => {
            const menuItem: ContextMenuItem = {
              label: action.label,
              color: action.color,
              disabled: action.disabled
            };

            if (action.getSubmenu && action.showOnHover) {
              menuItem.submenu = action.getSubmenu(rowData);
            } else if (action.getSubmenu) {
              menuItem.submenu = action.getSubmenu(rowData);
            } else if (action.action) {
              menuItem.action = () => {
                action.action(rowData, contextMenu.rowIndex!);
                closeContextMenu();
              };
            }

            return menuItem;
          })}
          onClose={closeContextMenu}
          x={0}
          y={0}
        />
      </ContextMenuWrapper>
    );
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!multiSelect) return;
      
      const target = event.target as HTMLElement;
      const isClickInsideTable = tableRef.current?.contains(target);
      
      if (!isClickInsideTable && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (externalSelectedRows === undefined && internalSelectedRows.length > 0) {
          setInternalSelectedRows([]);
        }
        if (onMultiSelectChange) {
          onMultiSelectChange([]);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [multiSelect, externalSelectedRows, internalSelectedRows, onMultiSelectChange]);

  return (
    <TableContainer
      ref={tableRef}
    >
      {isLoading ? (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      ) : (
        <>
          <StyledTable>
            <TableHeader>
              <TableRow $isHeader>
                {multiSelect && (
                  <HeaderCell
                    $align="center"
                    $isFirst={true}
                    style={{ width: '50px' }}
                  >
                  </HeaderCell>
                )}
                {columns.map((column, index) => (
                  !column.isHidden && (
                  <HeaderCell 
                    key={index} 
                    $isSortable={column.isSortable}
                    $isActive={sortConfig?.key === index}
                    onClick={() => handleSort(index)}
                    $align={column.align || 'center'}
                    $isFirst={index === 0 && !multiSelect}
                    $isLast={index === columns.length - 1}
                  >
                    <HeaderContent $align={column.align || 'center'}>
                      {column.name}
                      {column.isSortable && (
                        <SortIcon 
                          $direction={sortConfig?.key === index ? sortConfig.direction : 'asc'}
                          animate={{
                            rotate: sortConfig?.key === index && sortConfig.direction === 'desc' ? 180 : 0,
                            color: sortConfig?.key === index ? '#007D88' : '#6B7280'
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.77734 2.92383L5.25 3.45117L3.26953 1.47656L3.26367 12H2.51367L2.51953 1.45898L0.527344 3.45117L0 2.92383L2.88867 0.0351562L5.77734 2.92383ZM10.5059 8.54883L11.0391 9.07617L8.15039 11.9648L5.25586 9.07617L5.78906 8.54883L7.76953 10.5293L7.76367 0H8.51367L8.51953 10.5352L10.5059 8.54883Z" fill="currentColor"/>
                          </svg>
                        </SortIcon>
                      )}
                    </HeaderContent>
                  </HeaderCell>
                  )
                ))}
              </TableRow>
            </TableHeader>
            <TableBody $fixedHeight={fixedHeight}>
              <AnimatePresence>
                {data.map((row, rowIndex) => {
                  const isTotalsRow = hasTotalsRow && rowIndex === data.length - 1;
                  const isDebtRow = !isTotalsRow && checkDebt(row);
                  const isSelectable = isRowSelectable(rowIndex, isTotalsRow);
                  const rowStyle = getRowStyle(rowIndex, isTotalsRow, isDebtRow);
                  const hoverBackgroundColor = getHoverBackgroundColor(rowIndex, isTotalsRow, isDebtRow);
                  const isSelected = selectedRows.includes(rowIndex);

                  return (
                    <TableRow 
                      key={`row-${rowIndex}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        backgroundColor: rowStyle.backgroundColor || '#FFFFFF',
                        color: rowStyle.color || 'inherit',
                        fontWeight: rowStyle.fontWeight || 'normal'
                      }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      $isLast={rowIndex === data.length - 1}
                      $isSelected={isSelected}
                      $isTotalsRow={isTotalsRow}
                      $isSelectable={isSelectable}
                      onClick={(e) => handleRowClick(rowIndex, isTotalsRow, e)}
                      onDoubleClick={() => handleRowDoubleClick(row, rowIndex, isTotalsRow)}
                      onContextMenu={(e) => handleContextMenu(e, rowIndex, isTotalsRow)}
                      onTouchStart={(e) => handleTouchStart(e, rowIndex, isTotalsRow)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                      whileHover={isSelectable ? {
                          backgroundColor: hoverBackgroundColor,
                          transition: { duration: 0.15 }
                        } : {}}
                      style={{
                        backgroundColor: rowStyle.backgroundColor || '#FFFFFF',
                        color: rowStyle.color || 'inherit',
                        fontWeight: rowStyle.fontWeight || 'normal',
                        cursor: isSelectable ? 'pointer' : 'default'
                      }}
                    >
                      {multiSelect && (
                        <BodyCell 
                          $align="center"
                          $isFirst={true}
                          $isTotalsCell={isTotalsRow}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '50px' }}
                        >
                          {isSelectable && (
                            <CheckboxContainer>
                              <CheckboxInput
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(rowIndex, isTotalsRow, { ctrlKey: true } as React.MouseEvent);
                                }}
                              />
                              <CheckboxMark $checked={isSelected}>
                                {isSelected && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </CheckboxMark>
                            </CheckboxContainer>
                          )}
                        </BodyCell>
                      )}
                      {row.map((cell, cellIndex) => (
                        !columns[cellIndex]?.isHidden && (
                        <BodyCell 
                          key={cellIndex}
                          $align={columns[cellIndex]?.align || 'center'}
                          $isFirst={cellIndex === 0 && !multiSelect}
                          $isLast={cellIndex === row.length - 1}
                          $isTotalsCell={isTotalsRow}
                          $isBeforeTotals={isTotalsRow && cellIndex < row.findIndex(cell => cell === 'Итого:')}
                        >
                          {cell}
                        </BodyCell>
                        )
                      ))}
                    </TableRow>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </StyledTable>
          
          <AnimatePresence>
            {renderContextMenu()}
          </AnimatePresence>
        </>
      )}
    </TableContainer>
  );
};

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007D88;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: auto;
  position: relative;
  background-color: #FFFFFF;
  color: #000000;
  height: 100%;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #FFFFFF;
  box-sizing: border-box;
  
  th, td {
    box-sizing: border-box;
    position: relative;
    border-right: 0.5px solid #D1D5DB;
  }

  th:last-child,
  td:last-child {
    border-right: none;
  }

  tbody tr:last-child {
    border-bottom: none;
  }
`;

const ContextMenuWrapper = styled(motion.div)`
  z-index: 1000;
  pointer-events: auto;
`;

const TableHeader = styled.thead`
  text-align: center;
  position: relative;
`;

const TableBody = styled.tbody<{ $fixedHeight?: string }>`
  ${({ $fixedHeight }) => $fixedHeight && `
    display: block;
    overflow-y: auto;
  `}
  position: relative;
`;

const TableRow = styled(motion.tr)<{ 
  $isLast?: boolean; 
  $isSelected?: boolean;
  $isTotalsRow?: boolean;
  $isSelectable?: boolean;
  $isHeader?: boolean;
}>`
  position: relative;
  cursor: ${({ $isTotalsRow, $isSelectable, $isHeader }) => {
    if ($isHeader) return 'default';
    if ($isTotalsRow) return 'default';
    return $isSelectable ? 'pointer' : 'default';
  }};
  font-weight: ${({ $isTotalsRow }) => ($isTotalsRow ? 'bold' : 'normal')};

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 1%;
    width: 98%;
    height: 1px;
    background: #D1D5DB;
    display: ${({ $isLast, $isTotalsRow }) => ($isLast || $isTotalsRow ? 'none' : 'block')};
  }
`;

const HeaderCell = styled.th<{ 
  $isSortable?: boolean; 
  $isActive?: boolean;
  $align?: Alignment;
  $isFirst?: boolean;
  $isLast?: boolean;
}>`
  padding: 16px;
  padding-left: ${({ $isFirst }) => ($isFirst ? '16px' : '16px')};
  padding-right: ${({ $isLast }) => ($isLast ? '16px' : '16px')};
  text-align: ${({ $align }) => $align};
  font-weight: 500;
  position: relative;
  cursor: ${({ $isSortable }) => ($isSortable ? 'pointer' : 'default')};
  transition: all 0.2s ease;
  background-color: #FFFFFF;
  color: ${({ $isActive }) => ($isActive ? '#007D88' : 'inherit')};

  &:hover {
    background-color: ${({ $isSortable }) => ($isSortable ? '#F3F4F6' : 'inherit')};
  }
`;

const HeaderContent = styled.div<{ $align?: Alignment }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-content: ${({ $align }) => 
    $align === 'right' ? 'flex-end' : 
    $align === 'center' ? 'center' : 'flex-start'};
  width: 100%;
`;

const SortIcon = styled(motion.span)<{ $direction: 'asc' | 'desc' }>`
  display: inline-flex;
  align-items: center;
`;

const BodyCell = styled.td<{ 
  $align?: Alignment; 
  $isFirst?: boolean; 
  $isLast?: boolean;
  $isTotalsCell?: boolean;
  $isBeforeTotals?: boolean;
}>`
  padding: 5px;
  padding-left: ${({ $isFirst }) => ($isFirst ? '12px' : '12px')};
  padding-right: ${({ $isLast }) => ($isLast ? '12px' : '12px')};
  text-align: ${({ $align }) => $align};
  vertical-align: middle;
  border-right: ${({ $isBeforeTotals, $isTotalsCell }) => 
    ($isBeforeTotals || $isTotalsCell) ? 'none' : '0.5px solid #D1D5DB'};
`;

const CheckboxContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const CheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 1;
  
  &:checked + div {
    background-color: #007D88;
    border-color: #007D88;
  }
  
  &:hover + div {
    border-color: #007D88;
  }
`;

const CheckboxMark = styled.div<{ $checked: boolean }>`
  width: 18px;
  height: 18px;
  border: 2px solid ${({ $checked }) => $checked ? '#007D88' : '#D1D5DB'};
  border-radius: 4px;
  background-color: ${({ $checked }) => $checked ? '#007D88' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  svg {
    opacity: ${({ $checked }) => $checked ? 1 : 0};
    transition: opacity 0.2s ease;
  }
`;

export default CustomTable;
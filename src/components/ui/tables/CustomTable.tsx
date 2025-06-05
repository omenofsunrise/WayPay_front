import styled from 'styled-components';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ContextMenu from '../../modal/ContextMenu';

type Alignment = 'left' | 'center' | 'right';

interface Column {
  name: string;
  isSortable?: boolean;
  align?: Alignment;
  isHidden?: boolean;
}

interface TableAction {
  label: string;
  action: (rowData: any[], rowIndex: number) => void;
  color?: string;
}

export interface RowStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number | 'initial' | 'inherit';
}

interface CreditsTableProps {
  columns: Column[];
  data: any[][];
  onRowDoubleClick?: (rowData: any[], rowIndex: number) => void;
  contextMenuActions?: TableAction[];
  onSort?: (columnIndex: number) => void;
  onRowClick?: (rowData: any[], rowIndex: number) => void;
  sortConfig?: {
    key: number | null;
    direction: 'asc' | 'desc';
  };
  selectedRow?: number;
  fixedHeight?: string;
  hasTotalsRow?: boolean;
  debtChecker?: (rowData: any[]) => boolean;
  rowStyles?: { [rowIndex: number]: RowStyle }; // New prop for custom row styles
}

const CustomTable: React.FC<CreditsTableProps> = ({ 
  columns, 
  data, 
  onRowDoubleClick,
  contextMenuActions = [],
  onSort,
  sortConfig,
  onRowClick,
  selectedRow: externalSelectedRow,
  fixedHeight,
  hasTotalsRow,
  debtChecker,
  rowStyles = {}, // Default to empty object
}) => {
  const [internalSelectedRow, setInternalSelectedRow] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex: number | null;
  } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const selectedRow = externalSelectedRow !== undefined ? externalSelectedRow : internalSelectedRow;

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

  const handleRowClick = (rowIndex: number) => {
    const newSelectedRow = rowIndex === selectedRow ? null : rowIndex;
    if (externalSelectedRow === undefined) {
      setInternalSelectedRow(newSelectedRow);
    }
    if (onRowClick) {
      onRowClick(data[rowIndex], rowIndex);
    }
  };

  const handleRowDoubleClick = (row: any[], rowIndex: number) => {
    if (onRowDoubleClick) {
      onRowDoubleClick(row, rowIndex);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, rowIndex: number) => {
    event.preventDefault();
    
    if (contextMenuActions.length === 0) return;
    
    if (tableRef.current) {
      const rect = tableRef.current.getBoundingClientRect();
      const menuWidth = 200;
      const menuItemHeight = 40;
      const menuHeight = contextMenuActions.length * menuItemHeight;
      
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;
      
      if (x + menuWidth > rect.width) {
        x = rect.width - menuWidth;
      }
      
      if (y + menuHeight > rect.height) {
        y = rect.height - menuHeight;
      }
      
      x = Math.max(0, x);
      y = Math.max(0, y);

      setContextMenu({
        x,
        y,
        rowIndex
      });
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
    };
  }, [contextMenu]);

  // Function to get row style with fallbacks
  const getRowStyle = (rowIndex: number, isTotalsRow: boolean, isDebtRow: boolean): RowStyle => {
    if (isTotalsRow) {
      return { backgroundColor: 'white', color: 'black', fontWeight: 'bold' };
    }
    
    // Apply custom row style if defined
    const customStyle = rowStyles[rowIndex] || {};
    
    // For selected row, override background and text color unless custom style specifies them
    if (rowIndex === selectedRow) {
      return {
        backgroundColor: customStyle.backgroundColor || '#007D88', // Дефолтный цвет выбранной строки
        color: customStyle.color || 'white',
        fontWeight: customStyle.fontWeight || 'normal'
      };
    }
    
    // For debt rows, apply custom style or default
    if (isDebtRow) {
      return {
        backgroundColor: customStyle.backgroundColor || 'rgba(232, 216, 216, 1)',
        color: customStyle.color || 'inherit',
        fontWeight: customStyle.fontWeight || 'normal'
      };
    }
    
    // For other rows, apply custom style or default
    return {
      backgroundColor: customStyle.backgroundColor || 'white',
      color: customStyle.color || 'inherit',
      fontWeight: customStyle.fontWeight || 'normal'
    };
  };

  return (
    <TableContainer
      ref={tableRef}
    >
      <StyledTable>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              !column.isHidden && (
              <HeaderCell 
                key={index} 
                $isSortable={column.isSortable}
                $isActive={sortConfig?.key === index}
                onClick={() => handleSort(index)}
                $align={column.align || 'center'}
                $isFirst={index === 0}
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
              const rowStyle = getRowStyle(rowIndex, isTotalsRow, isDebtRow);

              return (
                <TableRow 
                  key={`row-${rowIndex}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    backgroundColor: rowStyle.backgroundColor || 'white',
                    color: rowStyle.color || 'inherit',
                    fontWeight: rowStyle.fontWeight || 'normal'
                  }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  $isLast={rowIndex === data.length - 1}
                  $isSelected={rowIndex === selectedRow}
                  $isTotalsRow={isTotalsRow}
                  onClick={() => !isTotalsRow && handleRowClick(rowIndex)}
                  onDoubleClick={() => !isTotalsRow && handleRowDoubleClick(row, rowIndex)}
                  onContextMenu={(e) => !isTotalsRow && handleContextMenu(e, rowIndex)}
                  whileHover={{
                    backgroundColor: isTotalsRow ? 'white' : 
                                    rowIndex === selectedRow ? '#007D88' : 
                                    isDebtRow ? 'rgba(232, 216, 216, 0.8)' :
                                    row[row.length - 1] === false ? 'rgba(81, 213, 180, 0.8)' : '#F3F4F6'
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    !columns[cellIndex]?.isHidden && (
                    <BodyCell 
                      key={cellIndex}
                      $align={columns[cellIndex]?.align || 'center'}
                      $isFirst={cellIndex === 0}
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
        {contextMenu && contextMenuActions.length > 0 && (
          <ContextMenuWrapper
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ContextMenu
              items={contextMenuActions.map(action => ({
                label: action.label,
                action: () => {
                  action.action(data[contextMenu.rowIndex!], contextMenu.rowIndex!);
                  closeContextMenu();
                },
                color: action.color
              }))}
              onClose={closeContextMenu} x={0} y={0}            />
          </ContextMenuWrapper>
        )}
      </AnimatePresence>
    </TableContainer>
  );
};

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: auto;
  position: relative;
  background-color: white;
  color: black;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-sizing: border-box;
  
  th, td {
    box-sizing: border-box;
    position: relative;
    border-right: 0.5px solid rgba(209, 213, 219, 1);
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
`;

const TableHeader = styled.thead`
  text-align: center;
  position: relative;
`;

const TableBody = styled.tbody<{ $fixedHeight?: string }>`
  ${({ $fixedHeight }) => $fixedHeight && `
    display: block;
    overflow-y: auto;
    max-height: calc(${$fixedHeight} - 57px); // Subtract header height
  `}
`;

const TableRow = styled(motion.tr)<{ 
  $isLast?: boolean; 
  $isSelected?: boolean;
  $isTotalsRow?: boolean;
}>`
  position: relative;
  cursor: ${({ $isTotalsRow }) => ($isTotalsRow ? 'default' : 'pointer')};
  font-weight: ${({ $isTotalsRow }) => ($isTotalsRow ? 'bold' : 'normal')};

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 1%;
    width: 98%;
    height: 1px;
    background: rgba(209, 213, 219, 1);
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
  padding-left: ${({ $isFirst }) => ($isFirst ? '50px' : '16px')};
  padding-right: ${({ $isLast }) => ($isLast ? '50px' : '16px')};
  text-align: ${({ $align }) => $align};
  font-weight: 500;
  position: relative;
  cursor: ${({ $isSortable }) => ($isSortable ? 'pointer' : 'default')};
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 1);
  color: ${({ $isActive }) => ($isActive ? '#007D88' : 'inherit')};

  &:hover {
    background-color: ${({ $isSortable }) => ($isSortable ? 'rgba(243, 244, 246, 1)' : 'inherit')};
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
  padding: 16px;
  padding-left: ${({ $isFirst }) => ($isFirst ? '50px' : '16px')};
  padding-right: ${({ $isLast }) => ($isLast ? '50px' : '16px')};
  text-align: ${({ $align }) => $align};
  vertical-align: middle;
  border-right: ${({ $isBeforeTotals, $isTotalsCell }) => 
    ($isBeforeTotals || $isTotalsCell) ? 'none' : '0.5px solid rgba(209, 213, 219, 1)'};
`;

const TotalsRow = styled.tr`
  background-color: #f5f5f5;
  font-weight: bold;
  
  td {
    padding: 12px 16px;
    border-top: 2px solid #ddd;
  }
`;

export default CustomTable;
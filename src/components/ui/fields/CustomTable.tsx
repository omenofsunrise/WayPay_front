import styled from 'styled-components';
import { useState } from 'react';

interface Column {
  name: string;
  isSortable?: boolean;
}

interface CreditsTableProps {
  columns: Column[];
  data: any[][];
}

const CustomTable: React.FC<CreditsTableProps> = ({ columns, data }) => {
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'ascending' | 'descending' } | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleSort = (columnIndex: number) => {
    if (!columns[columnIndex].isSortable) return;
    
    setIsSorting(true);
    
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === columnIndex) {
      direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    }
    
    setTimeout(() => {
      setSortConfig({ key: columnIndex, direction });
      setIsSorting(false);
    }, 200);
  };

  const handleRowClick = (rowIndex: number) => {
    setSelectedRow(rowIndex === selectedRow ? null : rowIndex);
  };

  const sortedData = [...data];
  if (sortConfig !== null) {
    sortedData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  return (
    <TableContainer>
      <StyledTable>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <HeaderCell 
                key={index} 
                $isSortable={column.isSortable}
                $isActive={sortConfig?.key === index}
                onClick={() => handleSort(index)}
              >
                <HeaderContent>
                  {column.name}
                  {column.isSortable && (
                    <SortIcon $direction={sortConfig?.key === index ? sortConfig.direction : 'ascending'}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.77734 2.92383L5.25 3.45117L3.26953 1.47656L3.26367 12H2.51367L2.51953 1.45898L0.527344 3.45117L0 2.92383L2.88867 0.0351562L5.77734 2.92383ZM10.5059 8.54883L11.0391 9.07617L8.15039 11.9648L5.25586 9.07617L5.78906 8.54883L7.76953 10.5293L7.76367 0H8.51367L8.51953 10.5352L10.5059 8.54883Z" fill="currentColor"/>
                      </svg>
                    </SortIcon>
                  )}
                </HeaderContent>
              </HeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody $isSorting={isSorting}>
          {sortedData.map((row, rowIndex) => (
            <TableRow 
              key={rowIndex} 
              $isLast={rowIndex === sortedData.length - 1}
              $isSelected={rowIndex === selectedRow}
              onClick={() => handleRowClick(rowIndex)}
            >
              {row.map((cell, cellIndex) => (
                <BodyCell key={cellIndex}>{cell}</BodyCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
};


const TableContainer = styled.div`
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 20px;
  overflow: hidden;
  color: rgba(0, 0, 0, 1)
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: rgba(255, 255, 255, 1);
`;

const TableHeader = styled.thead`
  text-align: center;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 1%;
    width: 98%;
    height: 1px;
    background: rgba(209, 213, 219, 1);
  }
`;

const TableBody = styled.tbody<{ $isSorting?: boolean }>`
  transition: opacity 0.2s ease;
  opacity: ${({ $isSorting }) => ($isSorting ? 0.7 : 1)};
`;

const TableRow = styled.tr<{ $isLast?: boolean; $isSelected?: boolean }>`
  position: relative;
  transition: background-color 0.2s ease;
  background-color: ${({ $isSelected }) => ($isSelected ? 'rgba(0, 125, 136, 1)' : 'transparent')};
  color: ${({ $isSelected }) => ($isSelected ? 'white' : 'inherit')};

  &:hover {
    background-color: ${({ $isSelected }) => 
      $isSelected ? 'rgba(0, 125, 136, 1)' : 'rgba(209, 213, 219, 1)'};
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 1%;
    width: 98%;
    height: 1px;
    background: rgba(209, 213, 219, 1);
    display: ${({ $isLast }) => ($isLast ? 'none' : 'block')};
  }
`;

const HeaderCell = styled.th<{ $isSortable?: boolean; $isActive?: boolean }>`
  padding: 12px 16px;
  text-align: center;
  font-weight: 500;
  border-right: none;
  position: relative;
  cursor: ${({ $isSortable }) => ($isSortable ? 'pointer' : 'default')};
  transition: background-color 0.2s ease;
  background-color: rgba(255, 255, 255, 1);

  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
`;

const HeaderContent = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const SortIcon = styled.span<{ $direction: 'ascending' | 'descending' }>`
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s ease, color 0.2s ease;
  transform: ${({ $direction }) => 
    $direction === 'descending' ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const BodyCell = styled.td`
  padding: 12px 16px;
  border-right: none;
  transition: background-color 0.2s ease;
`;

export default CustomTable;
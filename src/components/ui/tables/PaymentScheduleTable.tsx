import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { formatMoney } from '../../../utils/formatPrice';

export interface PaymentScheduleItem {
  id: number;
  date: string;
  remainingAmount: number;
  requiredPayment: number;
  comment: string;
}

interface PaymentScheduleTableProps {
  data: PaymentScheduleItem[];
  onDataChange?: (data: PaymentScheduleItem[]) => void;
  isLoading?: boolean;
}

const PaymentScheduleTable = ({ data, onDataChange }: PaymentScheduleTableProps) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <TableContainer>
      <StyledTable>
        <TableHeader>
          <tr>
            <HeaderCell>Дата</HeaderCell>
            <HeaderCell>Остаток</HeaderCell>
            <HeaderCell>Платёж</HeaderCell>
            <HeaderCell>Примечание</HeaderCell>
          </tr>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <StyledTableRow 
              key={item.id}
              onMouseEnter={() => setHoveredRow(item.id)}
              onMouseLeave={() => setHoveredRow(null)}
              $isHovered={hoveredRow === item.id}
            >
              <BodyCell>{item.date}</BodyCell>
              <BodyCell>{formatMoney(item.remainingAmount.toString())}</BodyCell>
              <BodyCell>{formatMoney(item.requiredPayment.toString())}</BodyCell>
              <BodyCell>{item.comment}</BodyCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
};

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 16px;
  height: 220px;
  overflow: auto;
  position: relative;
  background-color: white;
  margin-left: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-sizing: border-box;
  table-layout: fixed;

  th, td {
    box-sizing: border-box;
    position: relative;
    border-right: 1px solid #e2e8f0;
  }

  th:last-child,
  td:last-child {
    border-right: none;
  }

  tbody tr:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.thead`
  background-color: white;
  color: black;
  position: sticky;
  top: 0;
  z-index: 10;
  
  th {
    border-bottom: 1px solid #e2e8f0;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #edf2f7;
  }
`;

const StyledTableRow = styled(motion.tr)<{ $isHovered: boolean }>`
  background-color: ${props => props.$isHovered ? 'rgba(232, 216, 216, 1)' : 'white'};
  transition: background-color 0.2s ease;
`;

const HeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
  width: 25%;
  min-width: 100px;
`;

const BodyCell = styled.td`
  padding: 12px 16px;
  vertical-align: middle;
  position: relative;
  color: black;
`;

export default PaymentScheduleTable;
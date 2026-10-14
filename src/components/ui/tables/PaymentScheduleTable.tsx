import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { formatMoney } from '../../../utils/formatPrice';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

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

const PaymentScheduleTable = ({ data, isLoading }: PaymentScheduleTableProps) => {
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
          {data.map((item) => {
            return (
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
            );
          })}
        </TableBody>
      </StyledTable>
      {data.length === 0 && (
        <EmptyState role="status" aria-live="polite">
          <EmptyIcon>
            <CalendarMonthOutlinedIcon />
          </EmptyIcon>
          <EmptyTitle>
            {isLoading ? 'Рассчитываем график…' : 'График выплат пока пуст'}
          </EmptyTitle>
          {!isLoading && (
            <EmptyDescription>
              Заполните параметры слева — платежи будут
              <br />рассчитаны автоматически.
            </EmptyDescription>
          )}
        </EmptyState>
      )}
    </TableContainer>
  );
};

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 16px;
  height: 100%;
  min-height: 430px;
  overflow: auto;
  position: relative;
  background-color: white;
  margin-left: auto;
`;

const EmptyState = styled.div`
  position: absolute;
  inset: 55px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin-bottom: 18px;
  border-radius: 50%;
  background: rgba(22, 139, 150, 0.08);
  color: rgba(20, 125, 135, 0.48);

  & svg {
    width: 48px;
    height: 48px;
  }
`;

const EmptyTitle = styled.div`
  margin-bottom: 8px;
  color: #101828;
  font-size: 20px;
  font-weight: 600;
`;

const EmptyDescription = styled.div`
  color: #7b8aa5;
  font-size: 15px;
  line-height: 1.45;
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

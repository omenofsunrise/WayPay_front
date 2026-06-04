import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";

import PageLayout from "../components/ui/Layouts/PageLayout";
import CustomTable, { type Column } from "../components/ui/tables/CustomTable";
import Checkbox from "../components/ui/CheckBoxes/Checkbox";
import Pagination from "../components/ui/fields/CustomPagination";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import usePaymentPending from "../api/hooks/usePaymentPending";
import { formatMoney } from "../utils/formatPrice";
import { formatDate } from "../utils/dateFormatter";

const PAGE_SIZE = 10;

const PaymentPendingPage = () => {
  const {
    isLoading,
    error,
    items,
    processingId,
    getPaymentPendings,
    confirmPayment,
    rejectPayment,
    clearError,
  } = usePaymentPending();

  const [page, setPage] = useState(1);
  const [includeTransferred, setIncludeTransferred] = useState(false);

  const load = useCallback(() => {
    getPaymentPendings({ page, pageSize: PAGE_SIZE, includeTransferred });
  }, [getPaymentPendings, page, includeTransferred]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (id: number) => {
    try {
      await confirmPayment(id);
    } catch {
      // ошибка показана через error
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Отклонить платёж?")) return;
    try {
      await rejectPayment(id);
    } catch {
      // ошибка показана через error
    }
  };

  const columns: Column[] = [
    { name: "Договор", align: "left" },
    { name: "Сумма", align: "center" },
    { name: "Дата", align: "center" },
    { name: "Примечание", align: "left" },
    { name: "Статус", align: "center" },
    { name: "Действия", align: "center" },
  ];

  // Эндпоинт возвращает массив без общего количества, поэтому считаем
  // синтетический total: полная страница => есть следующая.
  const hasNextPage = items.length === PAGE_SIZE;
  const syntheticTotal =
    (page - 1) * PAGE_SIZE + items.length + (hasNextPage ? 1 : 0);

  const tableData = items.map((item) => [
    `№ ${item.creditId}`,
    formatMoney(String(item.amount ?? 0)),
    formatDate(item.createdAt),
    item.notes || "—",
    item.isTransferred ? "Переведён" : "Ожидает",
    <Actions key={`actions-${item.id}`}>
      <ConfirmButton
        disabled={processingId === item.id || item.isTransferred}
        onClick={() => handleConfirm(item.id)}
      >
        Подтвердить
      </ConfirmButton>
      <RejectButton
        disabled={processingId === item.id}
        onClick={() => handleReject(item.id)}
      >
        Отклонить
      </RejectButton>
    </Actions>,
  ]);

  return (
    <PageLayout>
      <PageContainer>
        <PageHeader>
          <Title>Платежи с приёмки</Title>
          <Checkbox
            checked={includeTransferred}
            onChange={(value) => {
              setPage(1);
              setIncludeTransferred(value);
            }}
            label="Показывать переведённые"
          />
        </PageHeader>

        {error && (
          <ErrorMessage onClick={clearError} style={{ cursor: "pointer" }}>
            {error}
          </ErrorMessage>
        )}

        <TableContainer>
          <CustomTable
            columns={columns}
            data={tableData}
            isLoading={isLoading}
          />
        </TableContainer>

        {!isLoading && items.length === 0 && !error && (
          <EmptyState>Платежей с приёмки нет</EmptyState>
        )}

        <PaginationLayout>
          <Pagination
            key={includeTransferred ? "transferred" : "pending"}
            total={syntheticTotal}
            current={page}
            onChange={setPage}
            itemsPerPage={PAGE_SIZE}
          />
        </PaginationLayout>
      </PageContainer>
    </PageLayout>
  );
};

export default PaymentPendingPage;

const PageContainer = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ErrorMessage = styled.div`
  background-color: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
`;

const TableContainer = styled.div`
  flex: 1;
  min-height: 300px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const BaseActionButton = styled.button`
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled(BaseActionButton)`
  background-color: #007d88;
  color: white;

  &:hover:not(:disabled) {
    background-color: #006670;
  }
`;

const RejectButton = styled(BaseActionButton)`
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;

  &:hover:not(:disabled) {
    background-color: #fecaca;
  }
`;

const EmptyState = styled.div`
  padding: 32px;
  text-align: center;
  color: #6b7280;
  font-size: 15px;
`;

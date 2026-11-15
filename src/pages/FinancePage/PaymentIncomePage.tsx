import { useState, useCallback, useEffect } from "react";
import ExportButton from "../../components/ui/Buttons/ExportButton";
import CustomInput from "../../components/ui/fields/CustomInput";
import Pagination from "../../components/ui/fields/CustomPagination";
import CustomTable from "../../components/ui/tables/CustomTable";
import FilterField from "../../components/ui/Layouts/FilterField";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import PaginationLayout from "../../components/ui/Layouts/PaginationLayout";
import CountInfoTitle from "../../components/ui/Text/CountInfoTitle";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import usePayment from "../../api/hooks/usePayment";
import useExport from "../../api/hooks/useExport";
import paymentService from "../../api/services/paymentService";
import type { Payment, PaymentParams } from "../../api/types/payment";
import { formatDate } from "../../utils/dateFormatter";
import { formatMoney } from "../../utils/formatPrice";
import { useAuth } from "../../сontext/AuthContext";
import CustomSelect from "../../components/ui/fields/CustomSelect";
import InvestorSelect from "../../components/ui/fields/InvestorSelect";
import styled from "styled-components";

const PaymentHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(0, 3fr);
  align-items: center;
  gap: 32px;
  width: 100%;

  > ${CustomTitle} {
    margin: 0;
  }

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const PaymentTotals = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  align-items: stretch;
  gap: 16px;
  width: 100%;
`;

const PaymentMetric = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-left: 2px solid rgba(0, 125, 136, 0.22);
`;

const PaymentMetricLabel = styled.span`
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
`;

const PaymentMetricValue = styled.span`
  color: #222;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
`;

const PaymentIncomePage = () => {
  const currentDate = new Date();
  const [fullnameFilter, setFullnameFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const pageSize = 10;
  const { authInfo, denyPermission } = useAuth();

  // Запрещающие права: у кого права нет — видит итоги, как и раньше.
  const showTotalIncome = denyPermission("FORBID_TOTAL_INCOME");
  const showTotalPayouts = denyPermission("FORBID_TOTAL_PAYOUTS");
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Отбор по дню внутри выбранного месяца. Пусто — весь месяц, как было.
  // Нужны именно дни, а не полные даты: месяц и год уже заданы соседними
  // полями, повторять их в календаре незачем.
  const [dayFrom, setDayFrom] = useState("");
  const [dayTo, setDayTo] = useState("");
  const [investorName, setInvestorName] = useState("");
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(
    null
  );
  const [incomePart, setIncomePart] = useState<
    "total" | "company" | "investor"
  >("total");

  const incomePartOptions = [
    { value: "total", label: "Прибыль: общая" },
    { value: "company", label: "Прибыль: компании" },
    { value: "investor", label: "Прибыль: инвестора" },
  ];

  const months = [
    { value: "1", label: "Январь" },
    { value: "2", label: "Февраль" },
    { value: "3", label: "Март" },
    { value: "4", label: "Апрель" },
    { value: "5", label: "Май" },
    { value: "6", label: "Июнь" },
    { value: "7", label: "Июль" },
    { value: "8", label: "Август" },
    { value: "9", label: "Сентябрь" },
    { value: "10", label: "Октябрь" },
    { value: "11", label: "Ноябрь" },
    { value: "12", label: "Декабрь" },
  ];

  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const columnToApiSortMap: Record<number, string> = {
    0: "creditId",
    1: "clientFullname",
    2: "paymentAmount",
    3: "paymentDate",
  };

  const handleInvestorChange = (name: string, id?: number) => {
    console.log(id);
    setInvestorName(name);
    setSelectedInvestorId(id || null);
    setCurrentPage(1);
  };

  const clearInvestorFilter = () => {
    setInvestorName("");
    setSelectedInvestorId(null);
    setCurrentPage(1);
  };

  const { exportData, isExporting, exportProgress } = useExport<Payment>();

  const {
    isLoading,
    error,
    data: paymentsData,
    getPayments,
    confirmPayment,
    deletePayment,
  } = usePayment();

  const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const dayOptions = [
    { value: "", label: "Любой" },
    ...Array.from({ length: daysInSelectedMonth }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    })),
  ];

  // В коротком месяце выбранный день может перестать существовать: был 31-й,
  // переключили на февраль. Молча оставлять такое нельзя — отбор стал бы
  // пустым без видимой причины.
  useEffect(() => {
    if (dayFrom && parseInt(dayFrom) > daysInSelectedMonth) setDayFrom("");
    if (dayTo && parseInt(dayTo) > daysInSelectedMonth) setDayTo("");
  }, [daysInSelectedMonth, dayFrom, dayTo]);

  const getDateRangeForMonth = (month: number, year: number) => {
    function getDaysInMonth(year: number, month: number) {
      return new Date(year, month, 0).getDate();
    }

    const lastDay = getDaysInMonth(year, month);

    // Пусто — значит граница не задана: от первого дня месяца и до последнего.
    const from = dayFrom ? parseInt(dayFrom) : 1;
    const to = dayTo ? parseInt(dayTo) : lastDay;

    // Перепутанные местами дни не считаем ошибкой: меньший становится началом.
    const first = Math.min(Math.max(Math.min(from, to), 1), lastDay);
    const last = Math.min(Math.max(Math.max(from, to), first), lastDay);

    const dateFrom = new Date(Date.UTC(year, month - 1, first, 0, 0, 0, 0));
    const dateTo = new Date(Date.UTC(year, month - 1, last, 23, 59, 59, 999));

    return {
      dateFrom,
      dateTo,
    };
  };

  const loadPayments = useCallback(async () => {
    const { dateFrom, dateTo } = getDateRangeForMonth(
      selectedMonth,
      selectedYear
    );

    const params: PaymentParams = {
      page: currentPage,
      pageSize,
      clientFullname: fullnameFilter || undefined,
      investorNickname: investorName || undefined,
      dateFrom,
      dateTo,
    };

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    await getPayments(params);
  }, [
    currentPage,
    fullnameFilter,
    sortConfig,
    selectedMonth,
    selectedYear,
    dayFrom,
    dayTo,
    investorName,
    getPayments,
  ]);

  useEffect(() => {
    loadPayments();
  }, [
    currentPage,
    fullnameFilter,
    sortConfig,
    selectedMonth,
    selectedYear,
    selectedInvestorId,
    loadPayments,
  ]);

  const handleFilterChange = (value: string) => {
    setFullnameFilter(value);
    setCurrentPage(1);
  };

  const handleSort = (columnIndex: number) => {
    if (!columnToApiSortMap[columnIndex]) return;

    setSortConfig((prev) => {
      if (prev.key === columnIndex) {
        return {
          key: columnIndex,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key: columnIndex,
        direction: "asc",
      };
    });
  };

  const handleExport = async () => {
    try {
      const { dateFrom, dateTo } = getDateRangeForMonth(
        selectedMonth,
        selectedYear
      );

      await exportData({
        fetchData: async (page, pageSize) => {
          const params: PaymentParams = {
            page,
            pageSize,
            clientFullname: fullnameFilter || undefined,
            investorNickname: investorName || undefined,
            dateFrom,
            dateTo,
            sortBy:
              sortConfig.key !== null
                ? columnToApiSortMap[sortConfig.key]
                : undefined,
            sortDirection: sortConfig.direction,
          };

          const result = await paymentService.getPayments(params);
          return {
            items: Array.isArray(result?.items) ? result.items : [],
            totalCount: result?.totalCount || 0,
          };
        },
        fileName: "payments_export",
        transformData: (payment) => ({
          "Договор №": payment.creditId,
          ФИО: payment.clientFullName,
          Платёж: payment.paymentAmount,
          "Дата платежа": payment.paymentDate
            ? formatDate(payment.paymentDate)
            : "",
          "Тип платежа": payment.type === "cash" ? "Наличными" : "Картой",
          "Платёж принял": payment.investorNickname || "",
          Подтверждён: payment.accepted ? "Да" : "Нет",
        }),
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const formatPaymentsData = (payments: Payment[] | undefined) => {
    if (!payments) return [];

    return payments.map((payment) => [
      payment.creditId?.toString() || "",
      payment.clientFullName || "",
      formatMoney(payment.paymentAmount?.toString() || "0"),
      payment.paymentDate ? formatDate(payment.paymentDate) : "",
      payment.income === undefined
        ? "0"
        : formatMoney(payment.income.toString()),
      payment.employeeFullName || "",
      payment.accepted ? "Да" : "Нет",
    ]);
  };

  const handleConfirmPayment = async (rowData: any[]) => {
    const rowIndex = tableData.indexOf(rowData);
    const payment = paymentsData?.items[rowIndex];

    if (!payment) return;

    if (window.confirm("Вы уверены, что хотите подтвердить этот платёж?")) {
      try {
        await confirmPayment(payment.id);
        loadPayments();
      } catch (err) {
        console.error("Ошибка при подтверждении платежа:", err);
      }
    }
  };

  const handleDeletePayment = async (rowData: any[]) => {
    const rowIndex = tableData.indexOf(rowData);
    const payment = paymentsData?.items[rowIndex];

    if (!payment) return;

    if (payment.accepted) {
      alert("Нельзя удалить подтверждённый платёж");
      return;
    }

    if (window.confirm("Вы уверены, что хотите удалить этот платёж?")) {
      try {
        await deletePayment(payment.id);
        loadPayments();
      } catch (err) {
        console.error("Ошибка при удалении платежа:", err);
        alert(err instanceof Error ? err.message : "Не удалось удалить платёж");
      }
    }
  };

  const tableData = formatPaymentsData(paymentsData?.items);

  const expectedIncomeByPart = {
    total: paymentsData?.expectedIncome,
    company: paymentsData?.expectedCompanyIncome,
    investor: paymentsData?.expectedInvestorIncome,
  }[incomePart];

  const expectedIncomeLabel = {
    total: "Ожидаемая прибыль",
    company: "Ожидаемая прибыль компании",
    investor: "Ожидаемая прибыль инвестора",
  }[incomePart];

  const tableActions = [
    {
      label: "Подтвердить",
      action: handleConfirmPayment,
      color: "#007D88",
      shouldShow: (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const payment = paymentsData?.items[rowIndex];
        return (
          payment &&
          !payment.accepted &&
          authInfo?.employee.permissions.includes("MANAGE_ACCOUNTING")
        );
      },
    },
    {
      label: "Удалить",
      action: handleDeletePayment,
      color: "#EF4444",
      shouldShow: (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const payment = paymentsData?.items[rowIndex];
        return payment && !payment.accepted;
      },
    },
  ];

  return (
    <PageLayout>
      <PaymentHeader>
        <CustomTitle>Доходы по платежам</CustomTitle>
        {/* <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                /> */}
        <PaymentTotals>
          {showTotalIncome && (
            <PaymentMetric>
              <PaymentMetricLabel>Прибыль</PaymentMetricLabel>
              <PaymentMetricValue>
                {formatMoney(paymentsData?.totalIncome?.toString() || "0")}
              </PaymentMetricValue>
            </PaymentMetric>
          )}
          {showTotalPayouts && (
            <PaymentMetric>
              <PaymentMetricLabel>Доход</PaymentMetricLabel>
              <PaymentMetricValue>
                {formatMoney(paymentsData?.totalPayments?.toString() || "0")}
              </PaymentMetricValue>
            </PaymentMetric>
          )}
          {showTotalPayouts && (
            <PaymentMetric>
              <PaymentMetricLabel>Ожидаемый доход</PaymentMetricLabel>
              <PaymentMetricValue>
                {formatMoney(paymentsData?.expectedPayments?.toString() || "0")}
              </PaymentMetricValue>
            </PaymentMetric>
          )}
          {showTotalIncome && (
            <PaymentMetric>
              <PaymentMetricLabel>{expectedIncomeLabel}</PaymentMetricLabel>
              <PaymentMetricValue>
                {formatMoney(expectedIncomeByPart?.toString() || "0")}
              </PaymentMetricValue>
            </PaymentMetric>
          )}
        </PaymentTotals>
      </PaymentHeader>

      <FilterField>
        <CustomInput
          inputType="text"
          placeholder="ФИО"
          value={fullnameFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
        />
        <CustomSelect
          placeholder="Месяц"
          value={selectedMonth.toString()}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          options={months}
          style={{ flex: "0 1 200px" }}
        />
        <CustomSelect
          placeholder="Год"
          value={selectedYear.toString()}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          options={years}
          style={{ flex: "0 1 150px" }}
        />
        <CustomSelect
          placeholder="День от"
          value={dayFrom}
          onChange={(e) => {
            setDayFrom(e.target.value);
            setCurrentPage(1);
          }}
          options={dayOptions}
          style={{ flex: "0 1 120px" }}
        />
        <CustomSelect
          placeholder="День до"
          value={dayTo}
          onChange={(e) => {
            setDayTo(e.target.value);
            setCurrentPage(1);
          }}
          options={dayOptions}
          style={{ flex: "0 1 120px" }}
        />
        <InvestorSelect
          placeholder="Инвестор"
          value={investorName}
          onChange={(value) => {
            // Обработка ручного ввода или очистки

            setInvestorName(value);
            setCurrentPage(1);
          }}
          onInvestorSelect={(investor) => {
            // handleInvestorChange(investor.name, investor.id);
          }}
        />
        <CustomSelect<"total" | "company" | "investor">
          placeholder="Часть дохода"
          value={incomePart}
          onChange={(event) => setIncomePart(event.target.value)}
          options={incomePartOptions}
          style={{ flex: "0 1 210px" }}
        />
      </FilterField>

      {isLoading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}

      {!isLoading && !error && (
        <>
          <CustomTable
            columns={[
              { name: "Договор №", isSortable: true, align: "center" },
              { name: "ФИО", isSortable: true, align: "left" },
              { name: "Платёж", isSortable: true, align: "right" },
              { name: "Дата платежа", isSortable: true, align: "right" },
              { name: "Доход с платежа, руб", align: "right" },
              { name: "Платёж принял", align: "left" },
              { name: "Подтверждён", align: "center" },
            ]}
            data={tableData}
            onSort={handleSort}
            sortConfig={sortConfig}
            contextMenuActions={tableActions}
          />

          <PaginationLayout>
            <CountInfoTitle total={paymentsData?.totalCount || 0} />

            <Pagination
              total={paymentsData?.totalCount || 0}
              current={currentPage}
              onChange={setCurrentPage}
              itemsPerPage={pageSize}
            />
          </PaginationLayout>
        </>
      )}
    </PageLayout>
  );
};

export default PaymentIncomePage;

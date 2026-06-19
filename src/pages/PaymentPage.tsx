import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable, {
  type RowStyle,
} from "../components/ui/tables/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import usePayment from "../api/hooks/usePayment";
import useExport from "../api/hooks/useExport";
import paymentService from "../api/services/paymentService";
import type { Payment, PaymentParams, PaymentTab } from "../api/types/payment";
import { formatDate, parseDateInput } from "../utils/dateFormatter";
import { formatMoney } from "../utils/formatPrice";
import { useAuth } from "../сontext/AuthContext";
import InvestorSelect from "../components/ui/fields/InvestorSelect";
import CustomCalendar from "../components/ui/fields/CustomCalendar";
import PrintOptionModal from "../components/modal/PrintOptionModal";
import PaymentConfirmationGenerator from "../utils/doxcUtils/paymentConfirmationGenerator";
import PrintIcon from "../assets/ui/print.svg?react";
import UserSelect from "../components/ui/fields/UserSelect";
import { useEmployee } from "../api/hooks/useEmployee";
import CustomSelect from "../components/ui/fields/CustomSelect";
import useBankCards from "../api/hooks/useBankCard";
import type { EmployeeFullnames } from "../api/types/employee";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import { useResponsivePageSize } from "../utils/useResponsivePageSize";

// Человекочитаемое название типа платежа (наличные / карта / место оплаты)
const formatPaymentType = (payment: Payment): string => {
  switch (payment.type) {
    case "cash":
      return "Наличными";
    case "card":
      return `Картой ${payment.bankCardDetails}`;
    case "paymentPlace":
      return "Место оплаты";
    default:
      return "";
  }
};

const PaymentPage = () => {
  const [fullnameFilter, setFullnameFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const { authInfo, denyPermission, refresh } = useAuth();
  const [investorName, setInvestorName] = useState("");
  const [investorId, setInvestorId] = useState<number | null>(null);
  const [isPool, setIsPool] = useState(false);
  const [employeeFullname, setEmployeeFullname] = useState("");
  const [confirmedFilter, setConfirmedFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [bankCardId, setBankCardId] = useState<number>(0);
  const [employees, setEmployees] = useState<EmployeeFullnames[]>([]);
  const [isPageSizeReady, setIsPageSizeReady] = useState(false);
  const columnToApiSortMap: Record<number, string> = {
    0: "creditId",
    1: "clientFullname",
    2: "paymentAmount",
    3: "paymentDate",
  };
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPaymentForPrint, setSelectedPaymentForPrint] =
    useState<Payment | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const { exportData, isExporting, exportProgress } = useExport<Payment>();

  const { pageSize: responsivePageSize, containerRef } = useResponsivePageSize({
    defaultPageSize: 10,
    minPageSize: 1,
    maxPageSize: 50,
    rowHeight: 30,
    headerHeight: 300,
    paginationHeight: 60,
  });

  const pageSizeRef = useRef(responsivePageSize);
  const itemsPerPage = responsivePageSize;

  const { fetchEmployeeFullnames } = useEmployee();
  const { bankCards, getAll: getBankCards } = useBankCards();

  const {
    isLoading,
    error,
    data: paymentsData,
    getPayments,
    confirmPayment,
    confirmPaymentList,
    deletePayment,
  } = usePayment();

  // Обновляем ref при изменении pageSize
  useEffect(() => {
    pageSizeRef.current = responsivePageSize;
    setIsPageSizeReady(true);
  }, [responsivePageSize]);

  useEffect(() => {
    if (authInfo) {
      loadPayments();
    }
  }, [authInfo?.employee.permissions, confirmPaymentList]);

  useEffect(() => {
    refresh().then(() => {});
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeeList = await fetchEmployeeFullnames();
        if (employeeList) {
          setEmployees(employeeList);
        }
      } catch (err) {
        console.error("Ошибка при загрузке сотрудников:", err);
      }
    };

    loadEmployees();
  }, []);

  useEffect(() => {
    getBankCards({ pageSize: 50 });
  }, [getBankCards]);

  const employeeOptions = [
    {
      value: "",
      label: "Все",
      avatar: null,
    },
    ...employees.map((employee) => ({
      value: employee.fullName,
      label: employee.fullName,
      avatar: employee.photoPath,
    })),
  ];

  const getPaymentTab = useCallback(
    async (paymentId: number): Promise<PaymentTab | null> => {
      try {
        const result = await paymentService.getPaymentTab(paymentId);
        return result;
      } catch (err) {
        console.error("Ошибка при получении данных для документа:", err);
        return null;
      }
    },
    []
  );

  const paymentConfirmationGenerator = new PaymentConfirmationGenerator(
    getPaymentTab
  );

  const handleDateFromFilterChange = (value: string) => {
    setDateFromFilter(value);
    setCurrentPage(1);
  };

  const handleDateToFilterChange = (value: string) => {
    setDateToFilter(value);
    setCurrentPage(1);
  };

  const formParams = (): PaymentParams => {
    const params: PaymentParams = {
      page: currentPage,
      pageSize: itemsPerPage,
      clientFullname: fullnameFilter.trim() || undefined,
      employeeFullname: employeeFullname.trim() || undefined,
      dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
      dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined,
    };

    // Добавляем фильтр по инвестору/пулу в зависимости от типа
    if (investorId !== null) {
      if (isPool) {
        params.poolId = investorId === 0 ? undefined : investorId;
      } else {
        params.investorId = investorId === 0 ? undefined : investorId;
      }
    }

    // Добавляем фильтр по типу платежа (наличные/карта/место оплаты)
    // и по конкретной карте, если выбрана оплата картой
    if (typeFilter !== "all") {
      params.paymentType = typeFilter as PaymentParams["paymentType"];
      if (typeFilter === "card" && bankCardId) {
        params.bankCardId = bankCardId;
      }
    }

    return params;
  };

  const loadPayments = useCallback(async () => {
    if (!isPageSizeReady) return;

    const params: PaymentParams = formParams();

    if (confirmedFilter === "confirmed") {
      params.confirmed = true;
    } else if (confirmedFilter === "not-confirmed") {
      params.confirmed = false;
    }

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    await getPayments(params);
  }, [
    currentPage,
    fullnameFilter,
    investorId,
    isPool,
    employeeFullname,
    confirmedFilter,
    typeFilter,
    bankCardId,
    dateFromFilter,
    dateToFilter,
    sortConfig,
    getPayments,
    itemsPerPage,
    isPageSizeReady,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPageSizeReady) {
        loadPayments();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    currentPage,
    fullnameFilter,
    investorId,
    isPool,
    employeeFullname,
    confirmedFilter,
    typeFilter,
    bankCardId,
    dateFromFilter,
    dateToFilter,
    sortConfig,
    loadPayments,
    isPageSizeReady,
  ]);

  const handleFilterChange = (value: string) => {
    setFullnameFilter(value);
    setCurrentPage(1);
  };

  const handleInvestorChange = (name: string) => {
    setInvestorName(name);
    setCurrentPage(1);
  };

  const handleInvestorSelect = (investorData: {
    id: number;
    nickname: string;
    fullName: string;
    phoneNumber: string;
    investorPie: number;
    investmentAmount: number;
    balance: number;
    type: "investor" | "pool";
  }) => {
    // Сохраняем имя для отображения в поле
    setInvestorName(investorData.nickname || investorData.fullName || "");

    // Сохраняем ID и тип для фильтрации
    setInvestorId(investorData.id);
    setIsPool(investorData.type === "pool");

    setCurrentPage(1);
  };

  const handleEmployeeChange = (event: { target: { value: string } }) => {
    setEmployeeFullname(
      event.target.value === "Все" ? undefined : event.target.value
    );
    setCurrentPage(1);
  };

  const handleConfirmedChange = (event: { target: { value: string } }) => {
    setConfirmedFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleTypeChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    setTypeFilter(value);
    // Сбрасываем выбранную карту, если выбран не «Картой»
    if (value !== "card") {
      setBankCardId(0);
    }
    setCurrentPage(1);
  };

  const handleBankCardChange = (event: { target: { value: number } }) => {
    setBankCardId(event.target.value);
    setCurrentPage(1);
  };

  const handleClearInvestorFilter = () => {
    setInvestorName("");
    setInvestorId(null);
    setIsPool(false);
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
      await exportData({
        fetchData: async (page, pageSize) => {
          const params: PaymentParams = {
            page,
            pageSize,
            clientFullname: fullnameFilter.trim() || undefined,
            employeeFullname: employeeFullname.trim() || undefined,
            dateFrom: dateFromFilter
              ? parseDateInput(dateFromFilter)
              : undefined,
            dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined,
            sortBy:
              sortConfig.key !== null
                ? columnToApiSortMap[sortConfig.key]
                : undefined,
            sortDirection: sortConfig.direction,
          };

          // Добавляем фильтр по инвестору/пулу для экспорта
          if (investorId !== null) {
            if (isPool) {
              params.poolId = investorId;
            } else {
              params.investorId = investorId;
            }
          }

          // Добавляем фильтр по подтверждению для экспорта
          if (confirmedFilter === "confirmed") {
            params.confirmed = true;
          } else if (confirmedFilter === "not-confirmed") {
            params.confirmed = false;
          }

          // Добавляем фильтр по типу платежа и карте для экспорта
          if (typeFilter !== "all") {
            params.paymentType = typeFilter as PaymentParams["paymentType"];
            if (typeFilter === "card" && bankCardId) {
              params.bankCardId = bankCardId;
            }
          }

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
          Платёж: formatMoney(payment.paymentAmount.toString()),
          "Дата платежа": payment.paymentDate
            ? formatDate(payment.paymentDate)
            : "",
          "Тип платежа": formatPaymentType(payment),
          "Платёж принял": payment.employeeFullName || "",
          Подтверждён: payment.accepted ? "Да" : "Нет",
        }),
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const formatPaymentsData = (payments: Payment[] | undefined) => {
    if (!payments) return [];

    const formattedData = payments.map((payment) => [
      payment.creditId?.toString() || "",
      payment.clientFullName || "",
      formatMoney(payment.paymentAmount?.toString() || "0"),
      payment.paymentDate ? formatDate(payment.paymentDate) : "",
      formatPaymentType(payment),
      payment.employeeFullName || "",
      payment.accepted ? "Да" : "Нет",
      payment.investorNickname || "",
      payment.id.toString(),
    ]);

    if (payments.length > 0) {
      const totalsRow = [
        "",
        "Итого",
        `${formatMoney(paymentsData.totalPayments.toString())}`,
        "",
        "",
        "",
        "",
        "",
      ];
      formattedData.push(totalsRow);
    }

    return formattedData;
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

    if (window.confirm("Вы уверены, что хотите удалить этот платёж?")) {
      try {
        await deletePayment(payment.id);
        loadPayments();
      } catch (err) {
        console.error("Ошибка при удалении платежа:", err);
      }
    }
  };

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    const id = rowData[rowData.length - 1];
    console.log(rowData);
    const payment = paymentsData?.items.find((c) => c.id === Number(id));
    if (payment) {
      setSelectedPaymentForPrint(payment);
    }
  };

  const handlePrintPayment = async (rowData: any[]) => {
    const paymentId = parseInt(rowData[8]);
    const payment = paymentsData?.items.find((p) => p.id === paymentId);

    if (!payment) {
      console.error("Платёж не найден для печати");
      return;
    }

    setSelectedPaymentForPrint(payment);
    setIsPrintModalOpen(true);
  };

  const handlePrintOptionSelect = async (optionKey: string) => {
    if (!selectedPaymentForPrint) return;

    try {
      setIsGeneratingDoc(true);

      if (optionKey === "paymentConfirmation") {
        console.log(
          "Генерация подтверждения оплаты для платежа:",
          selectedPaymentForPrint
        );

        await paymentConfirmationGenerator.generatePaymentConfirmation(
          selectedPaymentForPrint.id
        );

        console.log("Документ успешно сгенерирован и сохранен");
      }
    } catch (error) {
      console.error("Ошибка при генерации документа:", error);
      alert(
        `Произошла ошибка при генерации документа: ${
          error instanceof Error ? error.message : "Неизвестная ошибка"
        }`
      );
    } finally {
      setIsGeneratingDoc(false);
      setIsPrintModalOpen(false);
      setSelectedPaymentForPrint(null);
    }
  };

  const rowStyles = useMemo(() => {
    if (!paymentsData?.items) return {};

    const styles: { [rowIndex: number]: RowStyle } = {};

    paymentsData.items.forEach((payment, rowIndex) => {
      const baseStyle: RowStyle = {
        backgroundColor: "#FFFFFF",
        color: "#000000",
        fontWeight: "normal",
      };

      if (!payment.accepted) {
        baseStyle.color = "#FF5A5A";
      }

      if (selectedPaymentForPrint?.id === payment.id) {
        baseStyle.backgroundColor = "#007D88";
        baseStyle.color = "#FFFFFF";
        baseStyle.hoverBackgroundColor = "#007D88";
      }

      styles[rowIndex] = baseStyle;
    });

    return styles;
  }, [paymentsData?.items, selectedPaymentForPrint]);

  const tableData = formatPaymentsData(paymentsData?.items);

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
      label: "Печать чека",
      action: handlePrintPayment,
      color: "#8B5CF6",
      shouldShow: (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const payment = paymentsData?.items[rowIndex];
        return payment;
      },
    },
  ];

  if (denyPermission("FORBID_DELETING_PAYMENTS")) {
    tableActions.push({
      label: "Удалить",
      action: handleDeletePayment,
      color: "#EF4444",
      shouldShow: (rowData: any[]) => {
        const rowIndex = tableData.indexOf(rowData);
        const payment = paymentsData?.items[rowIndex];
        return (
          (payment && !payment.accepted) ||
          authInfo?.employee.permissions.includes("MANAGE_ACCOUNTING")
        );
      },
    });
  }

  const confirmedOptions = [
    { value: "all", label: "Все" },
    { value: "confirmed", label: "Подтверждённые" },
    { value: "not-confirmed", label: "Не подтверждённые" },
  ];

  const typeOptions = [
    { value: "all", label: "Все" },
    { value: "cash", label: "Наличными" },
    { value: "card", label: "Картой" },
  ];

  const bankCardOptions = [
    { value: 0, label: "Все карты" },
    ...bankCards.map((card) => ({
      value: card.id,
      label: card.details,
    })),
  ];

  return (
    <PageLayout ref={containerRef}>
      <TitleField>
        <CustomTitle>История платежей</CustomTitle>
        {authInfo?.employee.permissions.includes("MANAGE_ACCOUNTING") && (
          <DarkCyanButton
            style={{ marginTop: "15px", marginRight: "20px" }}
            onClick={async () => {
              if (
                window.confirm(
                  "Вы уверены, что хотите подтвердить оплаты по всем платежам выбранных фильтров?"
                )
              ) {
                try {
                  // Ждём подтверждения
                  await confirmPaymentList(formParams());

                  // После успешного подтверждения обновляем данные
                  await loadPayments();

                  // Можно показать сообщение об успехе
                  alert("Все платежи успешно подтверждены!");
                } catch (error) {
                  console.error("Ошибка при подтверждении платежей:", error);
                  alert("Произошла ошибка при подтверждении платежей");
                }
              }
            }}
          >
            Подтвердить все платежи по указанным фильтрам
          </DarkCyanButton>
        )}
        <ExportButton
          icon={<PrintIcon />}
          onClick={() => {
            if (!selectedPaymentForPrint) {
              alert("Пожалуйста, выберите платёж в таблице (клик по строке)");
              return;
            }
            setIsPrintModalOpen(true);
          }}
        >
          Печать
        </ExportButton>
        <ExportButton
          onClick={handleExport}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />
      </TitleField>

      <FilterField style={{ gap: "15px" }}>
        <CustomInput
          inputType="text"
          placeholder="Клиент"
          value={fullnameFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
        />
        <InvestorSelect
          placeholder="Инвестор/Пул"
          value={investorName}
          onChange={handleInvestorChange}
          onInvestorSelect={handleInvestorSelect}
          includePools={true}
          onClear={handleClearInvestorFilter}
        />
        <UserSelect
          placeholder="Сотрудник"
          value={employeeFullname}
          onChange={handleEmployeeChange}
          options={employeeOptions}
        />
        <CustomSelect
          placeholder="Статус подтверждения"
          value={confirmedFilter}
          onChange={handleConfirmedChange}
          options={confirmedOptions}
        />
        <CustomSelect
          placeholder="Тип платежа"
          value={typeFilter}
          onChange={handleTypeChange}
          options={typeOptions}
        />
        {typeFilter === "card" && (
          <CustomSelect<number>
            placeholder="Карта"
            value={bankCardId}
            onChange={handleBankCardChange}
            options={bankCardOptions}
          />
        )}
        <CustomCalendar
          prefix="От"
          value={dateFromFilter}
          onChange={handleDateFromFilterChange}
        />
        <CustomCalendar
          prefix="До"
          value={dateToFilter}
          onChange={handleDateToFilterChange}
        />
      </FilterField>

      {!isLoading && !error && paymentsData && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "24px",
            padding: "12px 16px",
            margin: "0 0 20px 0",
            background: "rgba(249, 250, 250, 1)",
            border: "1px solid rgba(229, 231, 235, 1)",
            borderRadius: "8px",
            color: "rgba(80, 85, 92, 1)",
            fontSize: "14px",
          }}
        >
          <span style={{ fontWeight: 600, color: "rgba(0, 125, 136, 1)" }}>
            Итоги:
          </span>
          <span>
            Платежей:{" "}
            <b style={{ color: "#000" }}>{paymentsData.totalCount ?? 0}</b>
          </span>
          <span>
            Сумма платежей:{" "}
            <b style={{ color: "#000" }}>
              {formatMoney((paymentsData.totalPayments ?? 0).toString())}
            </b>
          </span>
          <span>
            Доход:{" "}
            <b style={{ color: "#000" }}>
              {formatMoney((paymentsData.totalIncome ?? 0).toString())}
            </b>
          </span>
        </div>
      )}

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
              { name: "Тип платежа", align: "left" },
              { name: "Платёж принял", align: "left" },
              { name: "Подтверждён", align: "center" },
              { name: "Инвестор/Пул", align: "left", isHidden: true },
              { name: "id", align: "center", isHidden: true },
            ]}
            data={tableData}
            rowStyles={rowStyles}
            onSort={handleSort}
            sortConfig={sortConfig}
            onRowClick={handleRowClick}
            contextMenuActions={tableActions}
          />

          <PaginationLayout>
            <CountInfoTitle total={paymentsData?.totalCount || 0} />

            <Pagination
              total={paymentsData?.totalCount || 0}
              current={currentPage}
              onChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
            />
          </PaginationLayout>
        </>
      )}

      <PrintOptionModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedPaymentForPrint(null);
        }}
        onSelect={handlePrintOptionSelect}
        selectedPayment={selectedPaymentForPrint}
        modalTitle="Печать чека"
        printOptions={[
          {
            key: "paymentConfirmation",
            label: isGeneratingDoc ? "Генерация..." : "Чек",
            enabled: !isGeneratingDoc,
          },
        ]}
      />
    </PageLayout>
  );
};

export default PaymentPage;

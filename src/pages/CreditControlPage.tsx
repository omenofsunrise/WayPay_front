import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ListFilter } from "lucide-react";
import filterArrow from "../assets/ui/arrow.svg";

// Ширина выезжающей панели фильтров (на столько отодвигается контент). Как у бокового меню.
const FILTER_PANEL_WIDTH = 360;
import CustomTitle from "../components/ui/Text/CustomTitle";
import TitleField from "../components/ui/Layouts/TitleLayout";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import CustomTable, {
  type RowStyle,
} from "../components/ui/tables/CustomTable";
import CreditCardList from "../components/ui/cards/CreditCardList";
import type { CreditCardField } from "../components/ui/cards/CreditCard";
import Pagination from "../components/ui/fields/CustomPagination";
import PageLayout from "../components/ui/Layouts/PageLayout";
import { getCollapseFiltersOnClickSetting } from "../components/modal/SettingsModal";
import Tabs from "../components/ui/fields/Tabs";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import { useNavigate } from "react-router-dom";
import useCredit from "../api/hooks/useCredit";
import type { Credit } from "../api/types/credit";
import useExport from "../api/hooks/useExport";
import creditService from "../api/services/creditService";
import { formatDate } from "../utils/dateFormatter";
import NewPaymentModal from "../components/modal/NewPaymentModal";
import ViewCreditModal from "../components/modal/ViewCreditModal";
import { formatMoney } from "../utils/formatPrice";
import usePayment from "../api/hooks/usePayment";
import styled from "styled-components";
import { Container } from "react-bootstrap";
import CustomCalendar from "../components/ui/fields/CustomCalendar";
import { useAuth } from "../сontext/AuthContext";
import InvestorSelect from "../components/ui/fields/InvestorSelect";
import ObjectTypeSelect from "../components/ui/fields/ObjectTypeSelect";
import CustomSelect from "../components/ui/fields/CustomSelect";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import paymentService from "../api/services/paymentService";
import type { PaymentTab } from "../api/types/payment";
import PaymentConfirmationGenerator from "../utils/doxcUtils/paymentConfirmationGenerator";
import { useResponsivePageSize } from "../utils/useResponsivePageSize";
import { useUiSettings } from "../utils/uiSettings";

interface EmptyStarIconProps {
  isSelected?: boolean;
}

const CreditControlPage = () => {
  const colors = {
    primary: "#007D88",
  };
  const FILTERS_STORAGE_KEY = "creditControlFilters";

  const savedFilters = useMemo(() => {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error(
        "Ошибка чтения фильтров контроля договоров из localStorage:",
        error
      );
      return null;
    }
  }, []);

  const uiSettings = useUiSettings();
  const isListMode = uiSettings.creditsDisplayMode === "list";
  const [accumulatedItems, setAccumulatedItems] = useState<Credit[]>([]);
  const accumulatedItemsRef = useRef<Credit[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  // Модальное окно с фильтрами (открывается иконкой в шапке)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [contractNumber, setContractNumber] = useState(
    () => savedFilters?.contractNumber ?? ""
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [investorName, setInvestorName] = useState(
    () => savedFilters?.investorName ?? ""
  );
  const [selectedInvestmentSource, setSelectedInvestmentSource] = useState<{
    type: "investor" | "pool";
    id: number;
    name: string;
  } | null>(() => savedFilters?.selectedInvestmentSource ?? null);
  const [clientFullName, setClientFullName] = useState(
    () => savedFilters?.clientFullName ?? ""
  );
  const [fromDate, setFromDate] = useState<string>(
    () => savedFilters?.fromDate ?? ""
  );
  const [toDate, setToDate] = useState<string>(
    () => savedFilters?.toDate ?? ""
  );
  const [fromCreationDate, setFromCreationDate] = useState<string>(
    () => savedFilters?.fromCreationDate ?? ""
  );
  const [toCreationDate, setToCreationDate] = useState<string>(
    () => savedFilters?.toCreationDate ?? ""
  );
  const [rublesIncomeFrom, setRublesIncomeFrom] = useState<string>(
    () => savedFilters?.rublesIncomeFrom ?? ""
  );
  const [rublesIncomeTo, setRublesIncomeTo] = useState<string>(
    () => savedFilters?.rublesIncomeTo ?? ""
  );
  const [percentsIncomeFrom, setPercentsIncomeFrom] = useState<string>(
    () => savedFilters?.percentsIncomeFrom ?? ""
  );
  const [percentsIncomeTo, setPercentsIncomeTo] = useState<string>(
    () => savedFilters?.percentsIncomeTo ?? ""
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const [objectType, setObjectType] = useState<string>(
    () => savedFilters?.objectType ?? ""
  );
  const [creditTypeId, setCreditTypeId] = useState<number | null>(() =>
    typeof savedFilters?.creditTypeId === "number"
      ? savedFilters.creditTypeId
      : null
  );
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "desc" });
  const [filters, setFilters] = useState<{
    isFavourite?: boolean;
    isActive?: boolean;
    myCredits?: boolean;
    debt?: boolean;
    inDebt?: boolean;
  }>(() => savedFilters?.filters ?? {});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const { createPayment } = usePayment();
  const [isPageSizeReady, setIsPageSizeReady] = useState(false);
  const { pageSize: responsivePageSize, containerRef } = useResponsivePageSize({
    defaultPageSize: 10,
    minPageSize: 1,
    maxPageSize: 50,
    rowHeight: 35,
    headerHeight: 300,
    paginationHeight: 60,
  });
  const pageSizeRef = useRef(responsivePageSize);
  const itemsPerPage = responsivePageSize;

  const columnToApiSortMap: Record<number, string> = {
    1: "id",
    2: "date",
    4: "accured",
    5: "income_percents",
    6: "income_rubles",
  };
  const { hasPermission, hasRole, forbiddenRole, denyPermission } = useAuth();
  const { exportData, isExporting, exportProgress } = useExport<Credit>();
  const {
    isLoading,
    error,
    data: creditsData,
    getCredits,
    toggleFavourite,
    acceptCredit,
    acceptCredits,
  } = useCredit();
  const displayedCredits = isListMode
    ? accumulatedItems
    : creditsData?.items ?? [];
  const navigate = useNavigate();
  const [approvalStatus, setApprovalStatus] = useState<string>(
    () => savedFilters?.approvalStatus ?? ""
  );
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);

  useEffect(() => {
    pageSizeRef.current = responsivePageSize;
    setIsPageSizeReady(true);
  }, [responsivePageSize]);

  const shouldShowMyCreditsTab =
    hasRole("директор") ||
    hasRole("суперадмин") ||
    hasPermission("VIEW_ALL_CREDITS", true);

  const tabs = [
    { id: "all", label: "Все" },
    ...(shouldShowMyCreditsTab ? [{ id: "my", label: "Свои" }] : []),
    { id: "favourite", label: "Избранные" },
    { id: "debtors", label: "Просрочка" },
    { id: "inDebt", label: "В долг" },
    { id: "archive", label: "В архиве" },
  ];

  const [activeTab, setActiveTab] = useState<string>(() =>
    typeof savedFilters?.activeTab === "string" ? savedFilters.activeTab : "all"
  );

  // Функция для подсчета количества активных фильтров (исключая выбранную вкладку)
  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (contractNumber) count++;
    if (investorName) count++;
    if (clientFullName) count++;
    if (fromDate) count++;
    if (toDate) count++;
    if (fromCreationDate) count++;
    if (toCreationDate) count++;
    if (rublesIncomeFrom) count++;
    if (rublesIncomeTo) count++;
    if (percentsIncomeFrom) count++;
    if (percentsIncomeTo) count++;
    if (objectType) count++;
    if (approvalStatus) count++;

    // Исключаем фильтры от вкладок из подсчета
    const filterKeys = Object.keys(filters);
    if (filterKeys.length > 0) {
      // Проверяем, что это не фильтры от вкладок
      const hasNonTabFilters = filterKeys.some(
        (key) =>
          !["isFavourite", "myCredits", "debt", "inDebt", "isActive"].includes(
            key
          )
      );

      if (hasNonTabFilters) count++;
    }

    return count;
  }, [
    contractNumber,
    investorName,
    selectedInvestmentSource,
    clientFullName,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    rublesIncomeFrom,
    rublesIncomeTo,
    percentsIncomeFrom,
    percentsIncomeTo,
    objectType,
    approvalStatus,
    creditTypeId,
    filters,
  ]);

  const handleEditCredit = (rowData: any[]) => {
    const [_, id] = rowData;
    navigate(`/new-credit/${id}`);
  };

  useEffect(() => {
    const payload = {
      contractNumber,
      investorName,
      selectedInvestmentSource,
      clientFullName,
      fromDate,
      toDate,
      fromCreationDate,
      toCreationDate,
      rublesIncomeFrom,
      rublesIncomeTo,
      percentsIncomeFrom,
      percentsIncomeTo,
      objectType,
      creditTypeId,
      approvalStatus,
      activeTab,
      filters,
    };

    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [
    contractNumber,
    investorName,
    selectedInvestmentSource,
    clientFullName,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    rublesIncomeFrom,
    rublesIncomeTo,
    percentsIncomeFrom,
    percentsIncomeTo,
    objectType,
    creditTypeId,
    approvalStatus,
    activeTab,
    filters,
  ]);

  const hasActiveFilters = useMemo(() => {
    // Проверяем наличие активных фильтров, исключая фильтры от вкладок
    return (
      Boolean(
        contractNumber ||
          investorName ||
          selectedInvestmentSource ||
          clientFullName ||
          fromDate ||
          toDate ||
          fromCreationDate ||
          toCreationDate ||
          rublesIncomeFrom ||
          rublesIncomeTo ||
          percentsIncomeFrom ||
          percentsIncomeTo ||
          objectType ||
          approvalStatus ||
          (creditTypeId !== null && creditTypeId !== undefined)
      ) ||
      (Object.keys(filters).length > 0 &&
        // Проверяем, что это не фильтры от вкладок
        Object.keys(filters).some(
          (key) =>
            ![
              "isFavourite",
              "myCredits",
              "debt",
              "inDebt",
              "isActive",
            ].includes(key)
        ))
    );
  }, [
    contractNumber,
    investorName,
    selectedInvestmentSource,
    clientFullName,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    rublesIncomeFrom,
    rublesIncomeTo,
    percentsIncomeFrom,
    percentsIncomeTo,
    objectType,
    approvalStatus,
    creditTypeId,
    filters,
  ]);

  const resetFilters = useCallback(() => {
    setContractNumber("");
    setInvestorName("");
    setSelectedInvestmentSource(null);
    setClientFullName("");
    setFromDate("");
    setToDate("");
    setFromCreationDate("");
    setToCreationDate("");
    setRublesIncomeFrom("");
    setRublesIncomeTo("");
    setPercentsIncomeFrom("");
    setPercentsIncomeTo("");
    setObjectType("");
    setCreditTypeId(null);
    setApprovalStatus("");

    // Сохраняем только фильтры от текущей вкладки
    let newFilters = {};
    switch (activeTab) {
      case "my":
        newFilters = { myCredits: true };
        break;
      case "favourite":
        newFilters = { isFavourite: true };
        break;
      case "archive":
        newFilters = { isActive: false };
        break;
      case "debtors":
        newFilters = { debt: true };
        break;
      case "inDebt":
        newFilters = { inDebt: true };
        break;
      default:
        newFilters = {};
        break;
    }

    setFilters(newFilters);
    setSortConfig({ key: null, direction: "desc" });
    setCurrentPage(1);

    // Не удаляем фильтры полностью из localStorage, обновляем их
    const payload = {
      contractNumber: "",
      investorName: "",
      selectedInvestmentSource: null,
      clientFullName: "",
      fromDate: "",
      toDate: "",
      fromCreationDate: "",
      toCreationDate: "",
      rublesIncomeFrom: "",
      rublesIncomeTo: "",
      percentsIncomeFrom: "",
      percentsIncomeTo: "",
      objectType: "",
      creditTypeId: null,
      approvalStatus: "",
      activeTab,
      filters: newFilters,
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [activeTab]);

  const approvalOptions = [
    { value: "", label: "Все" },
    { value: "confirmed", label: "Подтверждённые" },
    { value: "notConfirmed", label: "Неподтверждённые" },
  ];

  // Единый источник параметров фильтрации для запросов кредитов.
  // Используется и таблицей (loadCredits), и экспортом (handleExport),
  // чтобы экспорт всегда учитывал ровно те же фильтры, что и список.
  const buildCreditParams = useCallback(
    (page: number, pageSize: number) => ({
      page,
      pageSize,
      name: contractNumber || undefined,
      creditTypeId: creditTypeId || undefined,
      clientFullname: clientFullName || undefined,
      investorNickname:
        selectedInvestmentSource?.type === "pool"
          ? undefined
          : investorName || undefined,
      investorPoolId:
        selectedInvestmentSource?.type === "pool"
          ? selectedInvestmentSource.id
          : undefined,
      dateFrom: fromDate ? new Date(fromDate) : undefined,
      dateTo: toDate ? new Date(toDate) : undefined,
      createdAt: fromCreationDate ? new Date(fromCreationDate) : undefined,
      createdTo: toCreationDate ? new Date(toCreationDate) : undefined,
      accepted: approvalStatus
        ? approvalStatus === "confirmed"
          ? true
          : false
        : undefined,
      rublesIncomeFrom:
        rublesIncomeFrom && !isNaN(Number(rublesIncomeFrom))
          ? Number(rublesIncomeFrom)
          : undefined,
      rublesIncomeTo:
        rublesIncomeTo && !isNaN(Number(rublesIncomeTo))
          ? Number(rublesIncomeTo)
          : undefined,
      percentsIncomeFrom:
        percentsIncomeFrom && !isNaN(Number(percentsIncomeFrom))
          ? Number(percentsIncomeFrom)
          : undefined,
      percentsIncomeTo:
        percentsIncomeTo && !isNaN(Number(percentsIncomeTo))
          ? Number(percentsIncomeTo)
          : undefined,
      sortBy:
        sortConfig.key !== null
          ? columnToApiSortMap[sortConfig.key]
          : undefined,
      sortDirection: sortConfig.direction,
      ...filters,
    }),
    [
      contractNumber,
      creditTypeId,
      clientFullName,
      investorName,
      selectedInvestmentSource,
      fromDate,
      toDate,
      fromCreationDate,
      toCreationDate,
      approvalStatus,
      rublesIncomeFrom,
      rublesIncomeTo,
      percentsIncomeFrom,
      percentsIncomeTo,
      sortConfig,
      filters,
    ]
  );

  const loadCredits = useCallback(async () => {
    if (!isPageSizeReady) return;

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаем новый AbortController и захватываем его локально
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    const params = buildCreditParams(currentPage, itemsPerPage);

    const result = await getCredits(params, signal);

    if (isListMode && result && !signal.aborted) {
      const items = result.items || [];
      const next =
        currentPage === 1 ? items : [...accumulatedItemsRef.current, ...items];
      accumulatedItemsRef.current = next;
      setAccumulatedItems(next);
      setHasMore(next.length < (result.totalCount || 0) && items.length > 0);
    }
    if (!signal.aborted) {
      setIsLoadingMore(false);
    }
  }, [
    buildCreditParams,
    currentPage,
    itemsPerPage,
    isPageSizeReady,
    isListMode,
  ]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (isPageSizeReady) {
      loadCredits();
    }
  }, [loadCredits, isPageSizeReady]);

  // Сброс накопленного списка при смене фильтров/режима
  useEffect(() => {
    accumulatedItemsRef.current = [];
    setAccumulatedItems([]);
    setHasMore(true);
    if (isListMode) {
      setCurrentPage(1);
    }
  }, [
    isListMode,
    contractNumber,
    investorName,
    selectedInvestmentSource,
    clientFullName,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    rublesIncomeFrom,
    rublesIncomeTo,
    percentsIncomeFrom,
    percentsIncomeTo,
    objectType,
    creditTypeId,
    approvalStatus,
    activeTab,
    filters,
    sortConfig,
  ]);

  // Бесконечная прокрутка
  useEffect(() => {
    if (!isListMode) return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;
    if (!hasMore) return;
    if (isLoading || isLoadingMore) return;
    if (accumulatedItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsLoadingMore(true);
          setCurrentPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isListMode, hasMore, isLoading, isLoadingMore, accumulatedItems.length]);

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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    let newFilters = {};
    switch (tabId) {
      case "my":
        newFilters = { myCredits: true };
        break;
      case "favourite":
        newFilters = { isFavourite: true };
        break;
      case "archive":
        newFilters = { isActive: false };
        break;
      case "debtors":
        newFilters = { debt: true };
        break;
      case "inDebt":
        newFilters = { inDebt: true };
        break;
      default:
        newFilters = {};
        break;
    }

    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleObjectTypeChange = (value: string) => {
    setObjectType(value);
    if (!value) {
      setCreditTypeId(null);
    }
    setCurrentPage(1);
  };

  const handleObjectTypeSelect = (objectType: {
    id: number;
    name: string;
    entityType: string;
  }) => {
    setCreditTypeId(objectType.id);
    setObjectType(objectType.name);
    setCurrentPage(1);
  };

  const handleDeleteCredit = async (rowData: any[]) => {
    const [_, id] = rowData;
    if (window.confirm("Вы уверены, что хотите удалить этот договор?")) {
      try {
        await creditService.deleteCredit(Number(id));
        loadCredits();
      } catch (err) {
        console.error("Ошибка при удалении договора:", err);
      }
    }
  };

  const handleOpenPaymentModal = (rowData: any[]) => {
    const [_, id, __, clientFullName] = rowData;
    const credit = displayedCredits.find((c) => c.id === Number(id));
    if (credit) {
      setSelectedCredit(credit);
      setIsPaymentModalOpen(true);
    }
  };

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

  const handlePrintReceipt = async (paymentId: number) => {
    try {
      await paymentConfirmationGenerator.generatePaymentConfirmation(paymentId);
      console.log("Чек успешно сгенерирован");
    } catch (error) {
      console.error("Ошибка при печати чека:", error);
      alert("Платёж создан, но произошла ошибка при печати чека");
    }
  };

  const handleSavePayment = async (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: "cash" | "card";
  }) => {
    try {
      if (!selectedCredit) return;

      const paymentRequest = {
        creditId: selectedCredit.id,
        paymentAmount: paymentData.principalAmount,
        datePayment: paymentData.paymentDate,
        type: paymentData.paymentMethod,
      };

      const result = await createPayment(paymentRequest);

      await loadCredits();
      setIsPaymentModalOpen(false);
      return result;
    } catch (error) {
      console.error("Ошибка при сохранении платежа:", error);
    }
  };

  const handleAccept = async (rowData: any[]) => {
    const [_, id] = rowData;
    const credit = displayedCredits.find((c) => c.id === Number(id));
    if (credit) {
      try {
        await acceptCredit(credit.id);
        // Обновляем список договоров после подтверждения
        await loadCredits();
      } catch (error) {
        console.error("Ошибка при подтверждении договора:", error);
      }
    }
  };

  const tableActions = [
    {
      label: "Подтвердить договор",
      action: handleAccept,
      color: "#007d88",
      shouldShow: (rowData: any[]) => {
        const [_, id] = rowData;
        const credit = displayedCredits.find((c) => c.id === Number(id));

        return (
          hasPermission("MANAGE_ACCOUNTING", true) &&
          credit &&
          !credit.hasCounterApproved
        );
      },
    },
    {
      label: "Добавить платёж",
      action: handleOpenPaymentModal,
      color: "#008b8b",
      shouldShow: () => denyPermission("MANAGE_ACCOUNTING", true),
    },
    {
      label: "Редактировать",
      action: handleEditCredit,
      color: "#007d88",
      shouldShow: () => hasPermission("EDIT_CREDITS", true),
    },
    {
      label: "Удалить",
      action: handleDeleteCredit,
      color: "#EF4444",
      shouldShow: () =>
        hasPermission("DELETE_CREDITS") &&
        denyPermission("MANAGE_ACCOUNTING", true),
    },
  ];

  const handleExport = async () => {
    try {
      await exportData({
        fetchData: async (page, pageSize) => {
          // Те же параметры фильтрации, что и в таблице — экспорт учитывает все фильтры
          const params = buildCreditParams(page, pageSize);

          const result = await creditService.getCredits(params);
          return {
            items: Array.isArray(result.items) ? result.items : [],
            totalCount: result.totalCount || 0,
          };
        },
        fileName: "credits_control_export",
        transformData: (credit) => {
          const creditDate =
            typeof credit.creditDate === "string"
              ? new Date(credit.creditDate)
              : credit.creditDate;

          return {
            "Номер договора": credit.id,
            "Дата договора": creditDate ? formatDate(creditDate) : "Нет данных",
            "ФИО сотрудника": credit.employeeName || "Нет данных",
            "Стоимость товара": formatMoney(
              credit.totalClean?.toString() || "0"
            ),
            "Доход в рублях": formatMoney(
              credit.incomeRubles?.toString() || "0"
            ),
            "Доход в %": `${credit.incomePercents || 0}%`,
            Начислено: formatMoney(credit.accured?.toString() || "0"),
          };
        },
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Произошла ошибка при экспорте. Пожалуйста, попробуйте еще раз.");
    }
  };

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    const [_, id] = rowData;
    const credit = displayedCredits.find((c) => c.id === Number(id));
    if (credit) {
      setSelectedCredit(credit);
    }
  };

  const formatCreditData = (credits: Credit[] | undefined) => {
    if (!credits) return [];

    const formattedData = credits.map((credit) => [
      credit.isFavourite ? (
        <StarIcon
          key={`star-${credit.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavourite(credit.id);
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.74804 1.33325L9.81738 5.81859L14.7227 6.40059L11.096 9.75392L12.0587 14.5993L7.74804 12.1866L3.43738 14.5999L4.40004 9.75459L0.773376 6.39992L5.67938 5.81792L7.74804 1.33325Z"
              fill="#50555C"
              stroke="#50555C"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </StarIcon>
      ) : (
        <EmptyStarIcon
          key={`star-${credit.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavourite(credit.id);
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.74804 1.33325L9.81738 5.81859L14.7227 6.40059L11.096 9.75392L12.0587 14.5993L7.74804 12.1866L3.43738 14.5999L4.40004 9.75459L0.773376 6.39992L5.67938 5.81792L7.74804 1.33325Z"
              stroke="#50555C"
              stroke-linejoin="round"
            />
          </svg>
        </EmptyStarIcon>
      ),
      credit.id.toString(),
      formatDate(credit.creditDate),
      credit.employeeName,
      `${formatMoney(credit.totalClean.toString())}`,
      `${formatMoney(credit.firstPayment.toString())}`,
      `${credit.incomePercents.toString() + "%"}`,
      `${formatMoney(credit.incomeRubles.toString())}`,
      `${formatMoney(credit.accured?.toString() || "")}`,
      credit.debt > 0,
      credit.isActive,
    ]);

    if (credits.length > 0) {
      const totalsRow = [
        "",
        "",
        "",
        "Итого",
        `${formatMoney(creditsData.totalPrice.toString())}`,
        `${formatMoney(creditsData.totalFirstPayment.toString())}`,
        ``,
        `${formatMoney(creditsData.totalIncomeRubles.toString())}`,
        `${formatMoney(creditsData.totalAccured.toString())}`,
        false,
      ];
      formattedData.push(totalsRow);
    }

    return formattedData;
  };

  const handleConfirmAllCredits = useCallback(async () => {
    // Подтверждение у пользователя
    const confirmMessage = `Вы действительно хотите подтвердить ВСЕ договоры, соответствующие текущим фильтрам?

Это действие нельзя отменить. Продолжить?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsConfirmingAll(true);

    try {
      // Формируем параметры фильтрации для подтверждения
      const params = {
        name: contractNumber || undefined,
        clientFullname: clientFullName || undefined,
        investorNickname:
          selectedInvestmentSource?.type === "pool"
            ? undefined
            : investorName || undefined,
        investorPoolId:
          selectedInvestmentSource?.type === "pool"
            ? selectedInvestmentSource.id
            : undefined,
        dateFrom: fromDate ? new Date(fromDate) : undefined,
        dateTo: toDate ? new Date(toDate) : undefined,
        createdAt: fromCreationDate ? new Date(fromCreationDate) : undefined,
        createdTo: toCreationDate ? new Date(toCreationDate) : undefined,
        accepted: approvalStatus
          ? approvalStatus === "confirmed"
            ? true
            : false
          : undefined,
        rublesIncomeFrom:
          rublesIncomeFrom && !isNaN(Number(rublesIncomeFrom))
            ? Number(rublesIncomeFrom)
            : undefined,
        rublesIncomeTo:
          rublesIncomeTo && !isNaN(Number(rublesIncomeTo))
            ? Number(rublesIncomeTo)
            : undefined,
        percentsIncomeFrom:
          percentsIncomeFrom && !isNaN(Number(percentsIncomeFrom))
            ? Number(percentsIncomeFrom)
            : undefined,
        percentsIncomeTo:
          percentsIncomeTo && !isNaN(Number(percentsIncomeTo))
            ? Number(percentsIncomeTo)
            : undefined,
        creditTypeId: creditTypeId || undefined,
        ...filters,
      };

      await acceptCredits(params);

      // Показываем сообщение об успехе
      alert("Все договоры по указанным фильтрам успешно подтверждены");

      // Обновляем список договоров
      await loadCredits();
    } catch (error) {
      console.error("Ошибка при массовом подтверждении договоров:", error);
      alert(
        "Произошла ошибка при подтверждении договоров. Пожалуйста, попробуйте еще раз."
      );
    } finally {
      setIsConfirmingAll(false);
    }
  }, [
    acceptCredits,
    contractNumber,
    clientFullName,
    investorName,
    objectType,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    rublesIncomeFrom,
    rublesIncomeTo,
    percentsIncomeFrom,
    percentsIncomeTo,
    activeTab,
    filters,
    selectedInvestmentSource,
    creditTypeId,
    approvalStatus,
    loadCredits,
  ]);

  const rowStyles = useMemo(() => {
    if (!displayedCredits || displayedCredits.length === 0) return {};

    const styles: { [rowIndex: number]: RowStyle } = {};

    displayedCredits.forEach((credit, rowIndex) => {
      const baseStyle: RowStyle = {
        backgroundColor: "#FFFFFF",
        color: "#000000",
        fontWeight: "normal",
        hoverBackgroundColor: "#F3F4F6",
      };

      if (credit.debt > 0) {
        baseStyle.backgroundColor = "#E8D8D8";
      }

      if (!credit.isActive) {
        baseStyle.backgroundColor = "#E8F5E8";
        baseStyle.color = "#1B5E20";
      }

      if (!credit.hasCounterApproved) {
        baseStyle.color = "#FF5A5A";
      }

      if (selectedCredit?.id === credit.id) {
        baseStyle.backgroundColor = "#007D88";
        baseStyle.color = "#FFFFFF";
      }

      styles[rowIndex] = baseStyle;
    });

    return styles;
  }, [displayedCredits, selectedCredit]);

  const handleRowDoubleClick = (rowData: any[]) => {
    const [_, id] = rowData;
    setViewingCreditId(Number(id));
    setIsViewModalOpen(true);
  };

  // Авто-сворачивание панели фильтров: работает только если включено в
  // Персональных настройках. По клику в рабочей области раздела (карточки,
  // вкладки, выделение договора) сворачиваем открытую панель.
  const collapseFiltersOnSectionClick = () => {
    if (isFilterModalOpen && getCollapseFiltersOnClickSetting()) {
      setIsFilterModalOpen(false);
    }
  };

  return (
    <PageLayout
      ref={containerRef}
      style={{
        paddingRight: isFilterModalOpen ? FILTER_PANEL_WIDTH : 0,
        transition: "padding-right 0.3s ease",
        height: "calc(100vh - 56px)",
        overflow: "hidden",
      }}
    >
      <FilterIconButton
        type="button"
        onClick={() => setIsFilterModalOpen((v) => !v)}
        $hasActiveFilters={hasActiveFilters}
        aria-label="Фильтр"
        title="Фильтр"
      >
        <ListFilter size={20} strokeWidth={2.2} />
        {hasActiveFilters && getActiveFiltersCount > 0 && (
          <FilterBadge>{getActiveFiltersCount}</FilterBadge>
        )}
      </FilterIconButton>

      <TitleField>
        <CustomTitle>Контроль договоров</CustomTitle>
      </TitleField>

      <FilterPanel $open={isFilterModalOpen}>
        <FilterPanelInner
          onKeyDown={(e) => {
            if (e.key === "Enter" && getCollapseFiltersOnClickSetting()) {
              e.preventDefault();
              setIsFilterModalOpen(false);
            }
          }}
        >
          <FilterModalHeader>
            <span>Фильтр</span>
            <CollapseArrow
              src={filterArrow}
              alt=""
              onClick={() => setIsFilterModalOpen(false)}
              title="Свернуть"
            />
          </FilterModalHeader>
          <FilterGrid>
            <FilterSlot>
              <FilterSlotLabel>№ Договора</FilterSlotLabel>
              <CustomInput
                inputType="text"
                placeholder="Например, 19265"
                value={contractNumber}
                onChange={(e) => {
                  setContractNumber(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </FilterSlot>

            <FilterSlot>
              <FilterSlotLabel>ФИО клиента</FilterSlotLabel>
              <CustomInput
                inputType="fullname"
                placeholder="Поиск по ФИО"
                value={clientFullName}
                onChange={(e) => {
                  setClientFullName(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </FilterSlot>

            <FilterSlot>
              <FilterSlotLabel>Папка</FilterSlotLabel>
              <ObjectTypeSelect
                value={objectType}
                onChange={handleObjectTypeChange}
                onObjectTypeSelect={handleObjectTypeSelect}
                placeholder="Любая"
                customPlaceholder="Папка"
                hideClearButton={false}
              />
            </FilterSlot>

            <FilterSlot>
              <FilterSlotLabel>Инвестор</FilterSlotLabel>
              <InvestorSelect
                placeholder="Любой"
                value={investorName}
                onChange={(name) => {
                  setInvestorName(name);
                  setSelectedInvestmentSource(null);
                  setCurrentPage(1);
                }}
                onInvestorSelect={(investor) => {
                  setInvestorName(investor.nickname || investor.fullName || "");
                  setSelectedInvestmentSource({
                    type: investor.type || "investor",
                    id: investor.id,
                    name: investor.nickname || investor.fullName || "",
                  });
                  setCurrentPage(1);
                }}
                includePools
              />
            </FilterSlot>

            <FilterSlot>
              <FilterSlotLabel>Статус подтверждения</FilterSlotLabel>
              <CustomSelect
                placeholder="Любой"
                customPlaceholder="Статус подтверждения"
                options={approvalOptions}
                value={approvalStatus}
                onChange={(event) => {
                  setApprovalStatus(event.target.value);
                  setCurrentPage(1);
                }}
                hasError={false}
                disabled={false}
              />
            </FilterSlot>
          </FilterGrid>

          <FilterGroupRow>
            <FilterGroup>
              <FilterGroupTitle>Даты</FilterGroupTitle>

              <FilterSlot>
                <FilterSlotLabel>Дата договора</FilterSlotLabel>
                <RangeRow>
                  <CustomCalendar
                    prefix="от:"
                    placeholder="дд-мм-гггг"
                    value={fromDate}
                    onChange={(date) => {
                      setFromDate(date);
                      setCurrentPage(1);
                    }}
                  />
                  <RangeDash>–</RangeDash>
                  <CustomCalendar
                    prefix="до:"
                    placeholder="дд-мм-гггг"
                    value={toDate}
                    onChange={(date) => {
                      setToDate(date);
                      setCurrentPage(1);
                    }}
                  />
                </RangeRow>
              </FilterSlot>

              <FilterSlot>
                <FilterSlotLabel>Дата создания</FilterSlotLabel>
                <RangeRow>
                  <CustomCalendar
                    prefix="от:"
                    placeholder="дд-мм-гггг"
                    value={fromCreationDate}
                    onChange={(date) => {
                      setFromCreationDate(date);
                      setCurrentPage(1);
                    }}
                  />
                  <RangeDash>–</RangeDash>
                  <CustomCalendar
                    prefix="до:"
                    placeholder="дд-мм-гггг"
                    value={toCreationDate}
                    onChange={(date) => {
                      setToCreationDate(date);
                      setCurrentPage(1);
                    }}
                  />
                </RangeRow>
              </FilterSlot>
            </FilterGroup>

            <FilterGroup>
              <FilterGroupTitle>Доход</FilterGroupTitle>

              <FilterSlot>
                <FilterSlotLabel>Доход, руб</FilterSlotLabel>
                <RangeRow>
                  <CustomInput
                    inputType="number"
                    placeholder="От"
                    value={rublesIncomeFrom}
                    onChange={(e) => {
                      setRublesIncomeFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <RangeDash>–</RangeDash>
                  <CustomInput
                    inputType="number"
                    placeholder="До"
                    value={rublesIncomeTo}
                    onChange={(e) => {
                      setRublesIncomeTo(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </RangeRow>
              </FilterSlot>

              <FilterSlot>
                <FilterSlotLabel>Доход, %</FilterSlotLabel>
                <RangeRow>
                  <CustomInput
                    inputType="number"
                    placeholder="От"
                    value={percentsIncomeFrom}
                    onChange={(e) => {
                      setPercentsIncomeFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <RangeDash>–</RangeDash>
                  <CustomInput
                    inputType="number"
                    placeholder="До"
                    value={percentsIncomeTo}
                    onChange={(e) => {
                      setPercentsIncomeTo(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </RangeRow>
              </FilterSlot>
            </FilterGroup>
          </FilterGroupRow>

          <FilterModalFooter>
            <DarkCyanButton
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              Сбросить фильтры
            </DarkCyanButton>

            {hasPermission("MANAGE_ACCOUNTING", true) && (
              <DarkCyanButton
                onClick={handleConfirmAllCredits}
                disabled={isConfirmingAll}
              >
                {isConfirmingAll ? (
                  <>
                    <SpinnerIcon />
                    Подтверждение...
                  </>
                ) : (
                  "Подтвердить все по фильтрам"
                )}
              </DarkCyanButton>
            )}

            <ExportButton
              onClick={handleExport}
              isExporting={isExporting}
              exportProgress={exportProgress}
            >
              Экспорт по фильтру
            </ExportButton>
          </FilterModalFooter>
        </FilterPanelInner>
      </FilterPanel>

      <StickyHeader onClick={collapseFiltersOnSectionClick}>
        {creditsData && forbiddenRole("сотрудник") && (
          <ControlSummaryStrip>
            <ControlSummaryItem>
              <ControlSummaryLabel>Всего договоров</ControlSummaryLabel>
              <ControlSummaryValue>
                {creditsData.totalCount}
              </ControlSummaryValue>
            </ControlSummaryItem>
            <ControlSummaryItem>
              <ControlSummaryLabel>Стоимость</ControlSummaryLabel>
              <ControlSummaryValue>
                {formatMoney(creditsData.totalPrice.toString())}
              </ControlSummaryValue>
            </ControlSummaryItem>
            <ControlSummaryItem>
              <ControlSummaryLabel>Аванс</ControlSummaryLabel>
              <ControlSummaryValue>
                {formatMoney(creditsData.totalFirstPayment.toString())}
              </ControlSummaryValue>
            </ControlSummaryItem>
            <ControlSummaryItem>
              <ControlSummaryLabel>Доход, руб</ControlSummaryLabel>
              <ControlSummaryValue>
                {formatMoney(creditsData.totalIncomeRubles.toString())}
              </ControlSummaryValue>
            </ControlSummaryItem>
            <ControlSummaryItem>
              <ControlSummaryLabel>Начислено</ControlSummaryLabel>
              <ControlSummaryValue>
                {formatMoney(creditsData.totalAccured.toString())}
              </ControlSummaryValue>
            </ControlSummaryItem>
          </ControlSummaryStrip>
        )}

        <SecondRaw>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
        </SecondRaw>
      </StickyHeader>

      <ScrollArea onClick={collapseFiltersOnSectionClick}>
        {isLoading && (!isListMode || displayedCredits.length === 0) && (
          <div>Загрузка...</div>
        )}
        {error && <div>Ошибка: {error}</div>}

        {!error &&
          (!isLoading || (isListMode && displayedCredits.length > 0)) && (
            <>
              <CreditCardList
                credits={displayedCredits}
                fields={
                  [
                    "employee",
                    "totalClean",
                    "firstPayment",
                    "incomePercents",
                    "incomeRubles",
                    "accured",
                  ] as CreditCardField[]
                }
                getRowData={(credit) => [
                  null,
                  credit.id.toString(),
                  formatDate(credit.creditDate),
                  credit.employeeName,
                  formatMoney((credit.totalClean ?? 0).toString()),
                  formatMoney((credit.firstPayment ?? 0).toString()),
                  `${credit.incomePercents ?? 0}%`,
                  formatMoney((credit.incomeRubles ?? 0).toString()),
                  formatMoney((credit.accured ?? 0).toString()),
                  (credit.debt ?? 0) > 0,
                  credit.isActive,
                ]}
                highlightedCreditId={selectedCredit?.id ?? null}
                onRowClick={(rowIndex) => {
                  const credit = displayedCredits[rowIndex];
                  if (credit) setSelectedCredit(credit);
                }}
                onRowDoubleClick={(rowIndex) => {
                  const credit = displayedCredits[rowIndex];
                  if (credit) {
                    setViewingCreditId(credit.id);
                    setIsViewModalOpen(true);
                  }
                }}
                onToggleFavourite={(credit) => toggleFavourite(credit.id)}
                contextMenuActions={tableActions}
              />

              {isListMode ? (
                <>
                  {hasMore && <LoadMoreSentinel ref={loadMoreSentinelRef} />}
                  {isLoadingMore ? (
                    <ListLoadingIndicator>Загрузка…</ListLoadingIndicator>
                  ) : (
                    <ListBottomSpacer />
                  )}
                </>
              ) : (
                <PaginationLayout>
                  <Pagination
                    total={creditsData?.totalCount || 0}
                    current={currentPage}
                    onChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                  />
                </PaginationLayout>
              )}
            </>
          )}
      </ScrollArea>

      <NewPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleSavePayment}
        creditId={selectedCredit?.id || 0}
        clientName={selectedCredit?.clientFullName || ""}
        investorName={selectedCredit?.investorNickname || ""}
        clientPhone={selectedCredit?.clientPhone || ""}
        currentDebt={selectedCredit?.rest || 0}
        currentMonthDebt={selectedCredit?.currentMonthDebt || 0}
        onPrintReceipt={handlePrintReceipt}
        clientId={selectedCredit?.clientId}
      />

      <ViewCreditModal
        id={viewingCreditId || 0}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </PageLayout>
  );
};

// Иконка-кнопка фильтра — только иконка, вверху справа рядом с колокольчиком/настройками
// (TopMenu: настройки right:10, колокольчик right:50; фильтр ставим левее — right:92).
const FilterIconButton = styled.button<{ $hasActiveFilters: boolean }>`
  position: fixed;
  top: 10px;
  right: 92px;
  z-index: 110;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(209, 213, 219, 1);
  background: #ffffff;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.$hasActiveFilters ? "#007D88" : "#374151")};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  outline: none;

  &:hover {
    background-color: rgba(209, 213, 219, 0.5);
    color: #007d88;
  }

  &:active {
    background-color: rgba(209, 213, 219, 0.7);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  svg {
    display: block;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: ${(props) => (props.$hasActiveFilters ? "#007D88" : "#374151")};
    stroke: currentColor;
    opacity: 1;
    pointer-events: none;
  }
`;

// Правая панель фильтров — поведение как у бокового меню (SideMenu):
// position: fixed у правого края, плавно выезжает за 0.3s, контент отодвигается
// через padding-right у PageLayout. top: 56px — чтобы не перекрывать верхнее меню
// (TopMenu с уведомлениями).
const FilterPanel = styled.div<{ $open: boolean }>`
  position: fixed;
  top: 56px;
  right: 0;
  height: calc(100vh - 56px);
  width: ${FILTER_PANEL_WIDTH}px;
  background: #ffffff;
  box-shadow: -1px 0 7px rgba(0, 0, 0, 0.08);
  border-left: 1px solid rgba(209, 213, 219, 1);
  z-index: 100;
  transform: ${({ $open }) => ($open ? "translateX(0)" : "translateX(100%)")};
  transition: transform 0.3s ease;
  overflow: hidden;
`;

const FilterPanelInner = styled.div`
  width: ${FILTER_PANEL_WIDTH}px;
  height: 100%;
  box-sizing: border-box;
  padding: 18px 16px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(209, 213, 219, 1);
    border-radius: 3px;
  }

  /* Компактные поля ввода фильтра — уже и чуть ниже. */
  input {
    min-height: 32px;
    padding-top: 6px;
    padding-bottom: 6px;
    font-size: 13px;
  }
`;

// Стрелка сворачивания — как ArrowIcon у бокового меню (тот же ассет, поворот).
const CollapseArrow = styled.img`
  width: 22px;
  height: 22px;
  cursor: pointer;
  transform: rotate(180deg);
  transition: transform 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const FilterModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;

const FilterModalFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 14px;

  & button {
    height: auto;
    margin: 0;
    padding: 6px 12px;
    font-size: 13px;
    border-radius: 8px;
  }
`;

const FilterBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background-color: #ff4444;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: auto;
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FilterField = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 0;
  align-items: center;
`;

const InputWrapper = styled.div`
  flex: 1;
  min-width: 0;
  position: relative;
`;

const SecondRaw = styled.div`
  display: flex;
  height: 60px;
  margin: 7px 0 0;
  gap: 15px;
  background-color: transparent;
  justify-content: space-between;
  align-items: center;
`;

const StarIcon = styled.div`
  cursor: pointer;
  color: gold;
  font-size: 1.2rem;
  user-select: none;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const EmptyStarIcon = styled.div<EmptyStarIconProps>`
  cursor: pointer;
  width: 24px;
  height: 24px;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
    path {
      stroke: #50555c;
    }
  }
`;

const InputTitle = styled.p`
  color: black;
  width: 153px;
  text-align: center;
  white-space: nowrap;
`;

const IncomeContainer = styled.div`
  display: flex;
  flex-direction: row;
  max-width: 600px;
  align-items: center;
  flex-grow: 1;
`;

const SpinnerIcon = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadMoreSentinel = styled.div`
  width: 100%;
  height: 1px;
`;

const ListLoadingIndicator = styled.div`
  padding: 12px 0 32px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
`;

const ListBottomSpacer = styled.div`
  height: 32px;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px 10px;
`;

const FilterSlot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const FilterSlotLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const RangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  > *:first-child,
  > *:last-child {
    flex: 1;
    min-width: 0;
  }
`;

const RangeDash = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

// Группировка родственных фильтров (даты, доход) в карточки с заголовком,
// чтобы похожие диапазоны визуально не сливались и не путались.
const FilterGroupRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 12px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 280px;
  min-width: 0;
  padding: 10px 14px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
`;

const FilterGroupTitle = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

// Быстрые фильтры, вынесенные из модального окна прямо на страницу
const QuickFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin: 7px 0 0;
`;

const QuickFilterSlot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1 1 220px;
  max-width: 320px;
`;

// Статичная «шапка» списка: статистика + вкладки. Не скроллится —
// прокручивается только ScrollArea с карточками под ней.
const StickyHeader = styled.div`
  flex-shrink: 0;
  background: rgba(249, 250, 250, 1);
  padding-bottom: 6px;
`;

// Внутренний скролл-контейнер только для карточек. Занимает оставшуюся
// высоту страницы; шапка над ним остаётся на месте.
const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(209, 213, 219, 1);
    border-radius: 4px;
  }
`;

const ControlSummaryStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  padding: 14px 16px;
  margin-top: 16px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
  border: 1px solid #ccfbf1;
  border-radius: 12px;
  color: #0f766e;
`;

const ControlSummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  border-left: 3px solid #0f766e;
`;

const ControlSummaryLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const ControlSummaryValue = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #0f766e;
`;

export default CreditControlPage;

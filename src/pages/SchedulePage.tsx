import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable, {
  type RowStyle,
} from "../components/ui/tables/CustomTable";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import useSchedule from "../api/hooks/useSchedule";
import useExport from "../api/hooks/useExport";
import type { ScheduleDetails, ScheduleParams } from "../api/types/schedule";
import scheduleService from "../api/services/scheduleService";
import { formatDate, parseDateInput } from "../utils/dateFormatter";
import CustomCalendar from "../components/ui/fields/CustomCalendar";
import styled from "styled-components";
import { formatMoney } from "../utils/formatPrice";
import InvestorSelect from "../components/ui/fields/InvestorSelect";
import ObjectTypeSelect from "../components/ui/fields/ObjectTypeSelect";
import useCompany from "../api/hooks/useCompany";
import Tabs from "../components/ui/fields/Tabs";
import SchedulePieChart from "../components/Dashboards/SchedulePieChart";
import type { ScheduleAnalitycResponse } from "../api/types/analytic";
import PaginationDots from "../components/ui/Pagination/PaginationDots";
import useAnalytic from "../api/hooks/useAnalytic";
import NewPaymentModal from "../components/modal/NewPaymentModal";
import usePayment from "../api/hooks/usePayment";
import creditService from "../api/services/creditService";
import type { Credit } from "../api/types/credit";
import { useAuth } from "../сontext/AuthContext";
import ViewCreditModal from "../components/modal/ViewCreditModal";
import {
  sendWhatsAppMessage,
  sendCustomWhatsAppMessage,
} from "../utils/sendWhatsAppMessage";
import useSender from "../api/hooks/useSender";
import PaymentConfirmationGenerator from "../utils/doxcUtils/paymentConfirmationGenerator";
import type { PaymentTab } from "../api/types/payment";
import paymentService from "../api/services/paymentService";
import { useResponsivePageSize } from "../utils/useResponsivePageSize";
import BaseModal from "../components/modal/BASE/modalCRUBase";
import { Info } from "lucide-react";

const CheckIcon = () => (
  <svg
    width="16"
    height="11"
    viewBox="0 0 16 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.3227 1.73849C15.5053 1.54252 15.6047 1.28333 15.6 1.01552C15.5952 0.747705 15.4867 0.492182 15.2973 0.30278C15.1079 0.113379 14.8524 0.00488629 14.5846 0.000161053C14.3168 -0.00456418 14.0576 0.0948468 13.8616 0.277449L5.63297 8.50612L2.22848 5.10163C2.03251 4.91903 1.77332 4.81961 1.50551 4.82434C1.23769 4.82907 0.982171 4.93756 0.792769 5.12696C0.603368 5.31636 0.494877 5.57188 0.490151 5.8397C0.485426 6.10751 0.584836 6.3667 0.767438 6.56266L4.90245 10.6977C5.09628 10.8913 5.35902 11 5.63297 11C5.90691 11 6.16966 10.8913 6.36349 10.6977L15.3227 1.73849Z"
      fill="#50555C"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.8437 3.11431C16.8886 2.14984 15.751 1.38511 14.4974 0.864691C13.2437 0.344271 11.899 0.078567 10.5416 0.083064C4.85413 0.083064 0.218709 4.71848 0.218709 10.406C0.218709 12.2289 0.697876 13.9997 1.59371 15.5622L0.135376 20.9164L5.60413 19.4789C7.11454 20.3018 8.81246 20.7393 10.5416 20.7393C16.2291 20.7393 20.8645 16.1039 20.8645 10.4164C20.8645 7.65598 19.7916 5.06223 17.8437 3.11431ZM10.5416 18.9893C8.99996 18.9893 7.48954 18.5726 6.16663 17.7914L5.85413 17.6039L2.60413 18.4581L3.46871 15.2914L3.26038 14.9685C2.40365 13.6008 1.94884 12.0198 1.94788 10.406C1.94788 5.67681 5.80204 1.82265 10.5312 1.82265C12.8229 1.82265 14.9791 2.71848 16.5937 4.34348C17.3933 5.13917 18.027 6.08571 18.4579 7.1282C18.8888 8.17068 19.1085 9.28836 19.1041 10.4164C19.125 15.1456 15.2708 18.9893 10.5416 18.9893ZM15.25 12.5726C14.9895 12.4476 13.7187 11.8226 13.4895 11.7289C13.25 11.6456 13.0833 11.6039 12.9062 11.8539C12.7291 12.1143 12.2395 12.6976 12.0937 12.8643C11.9479 13.0414 11.7916 13.0622 11.5312 12.9268C11.2708 12.8018 10.4375 12.5206 9.45829 11.6456C8.68746 10.9581 8.17704 10.1143 8.02079 9.8539C7.87496 9.59348 7.99996 9.45806 8.13538 9.32265C8.24996 9.20806 8.39579 9.02056 8.52079 8.87473C8.64579 8.7289 8.69788 8.61431 8.78121 8.44765C8.86454 8.27056 8.82288 8.12473 8.76038 7.99973C8.69788 7.87473 8.17704 6.6039 7.96871 6.08306C7.76038 5.58306 7.54163 5.64556 7.38538 5.63515H6.88538C6.70829 5.63515 6.43746 5.69765 6.19788 5.95806C5.96871 6.21848 5.30204 6.84348 5.30204 8.11431C5.30204 9.38515 6.22913 10.6143 6.35413 10.781C6.47913 10.9581 8.17704 13.5622 10.7604 14.6768C11.375 14.9476 11.8541 15.1039 12.2291 15.2185C12.8437 15.4164 13.4062 15.3851 13.8541 15.3226C14.3541 15.2497 15.3854 14.6976 15.5937 14.0935C15.8125 13.4893 15.8125 12.9789 15.7395 12.8643C15.6666 12.7497 15.5104 12.6976 15.25 12.5726Z"
      fill="#2CB742"
    />
  </svg>
);

const GuarantorWhatsAppIcon = () => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.8437 3.11431C16.8886 2.14984 15.751 1.38511 14.4974 0.864691C13.2437 0.344271 11.899 0.078567 10.5416 0.083064C4.85413 0.083064 0.218709 4.71848 0.218709 10.406C0.218709 12.2289 0.697876 13.9997 1.59371 15.5622L0.135376 20.9164L5.60413 19.4789C7.11454 20.3018 8.81246 20.7393 10.5416 20.7393C16.2291 20.7393 20.8645 16.1039 20.8645 10.4164C20.8645 7.65598 19.7916 5.06223 17.8437 3.11431ZM10.5416 18.9893C8.99996 18.9893 7.48954 18.5726 6.16663 17.7914L5.85413 17.6039L2.60413 18.4581L3.46871 15.2914L3.26038 14.9685C2.40365 13.6008 1.94884 12.0198 1.94788 10.406C1.94788 5.67681 5.80204 1.82265 10.5312 1.82265C12.8229 1.82265 14.9791 2.71848 16.5937 4.34348C17.3933 5.13917 18.027 6.08571 18.4579 7.1282C18.8888 8.17068 19.1085 9.28836 19.1041 10.4164C19.125 15.1456 15.2708 18.9893 10.5416 18.9893ZM15.25 12.5726C14.9895 12.4476 13.7187 11.8226 13.4895 11.7289C13.25 11.6456 13.0833 11.6039 12.9062 11.8539C12.7291 12.1143 12.2395 12.6976 12.0937 12.8643C11.9479 13.0414 11.7916 13.0622 11.5312 12.9268C11.2708 12.8018 10.4375 12.5206 9.45829 11.6456C8.68746 10.9581 8.17704 10.1143 8.02079 9.8539C7.87496 9.59348 7.99996 9.45806 8.13538 9.32265C8.24996 9.20806 8.39579 9.02056 8.52079 8.87473C8.64579 8.7289 8.69788 8.61431 8.78121 8.44765C8.86454 8.27056 8.82288 8.12473 8.76038 7.99973C8.69788 7.87473 8.17704 6.6039 7.96871 6.08306C7.76038 5.58306 7.54163 5.64556 7.38538 5.63515H6.88538C6.70829 5.63515 6.43746 5.69765 6.19788 5.95806C5.96871 6.21848 5.30204 6.84348 5.30204 8.11431C5.30204 9.38515 6.22913 10.6143 6.35413 10.781C6.47913 10.9581 8.17704 13.5622 10.7604 14.6768C11.375 14.9476 11.8541 15.1039 12.2291 15.2185C12.8437 15.4164 13.4062 15.3851 13.8541 15.3226C14.3541 15.2497 15.3854 14.6976 15.5937 14.0935C15.8125 13.4893 15.8125 12.9789 15.7395 12.8643C15.6666 12.7497 15.5104 12.6976 15.25 12.5726Z"
      fill="#F5A623"
    />
  </svg>
);

const NotifyCell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
`;

type TabType = "calendar" | "schedule" | "table";

interface SchedulePageProps {
  initialTab?: TabType;
  hiddenTabs?: TabType[];
  title?: string;
}

const ACTIVE_TAB_STORAGE_KEY = "schedule_page_active_tab";

// Интерфейс для выбранной сущности
interface SelectedEntity {
  id: number;
  name: string;
  type: "investor" | "pool";
}

interface SelectedObjectType {
  id: number;
  name: string;
}

type SchedulePaymentStatus =
  | "paid"
  | "overdue"
  | "transferred"
  | "called"
  | "pending";

const schedulePaymentStatusMeta: Record<
  SchedulePaymentStatus,
  {
    label: string;
    background: string;
    border: string;
    accent: string;
    color: string;
  }
> = {
  paid: {
    label: "Оплачен",
    background: "#f0fdf4",
    border: "#86efac",
    accent: "#22c55e",
    color: "#166534",
  },
  overdue: {
    label: "Просрочен",
    background: "#fef2f2",
    border: "#fca5a5",
    accent: "#ef4444",
    color: "#991b1b",
  },
  transferred: {
    label: "Перенесен",
    background: "#eff6ff",
    border: "#93c5fd",
    accent: "#3b82f6",
    color: "#1d4ed8",
  },
  called: {
    label: "Обзвонен",
    background: "#ecfeff",
    border: "#67e8f9",
    accent: "#0891b2",
    color: "#155e75",
  },
  pending: {
    label: "Ожидает",
    background: "#fffbeb",
    border: "#fde68a",
    accent: "#f59e0b",
    color: "#92400e",
  },
};

const toDateInputValue = (date: Date | string): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

const getCalendarClientName = (payment: ScheduleDetails): string => {
  return payment.clientName?.trim() || "Без имени";
};

const getCalendarClientKey = (payment: ScheduleDetails): string => {
  return `${getCalendarClientName(payment)}|${payment.clientPhone || ""}`;
};

const formatMoneyValue = (value?: number | string | null): string => {
  return formatMoney(String(value ?? 0));
};

const getDayKey = (date: Date | string): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(parsed.getDate()).padStart(2, "0")}`;
};

// Колонки календаря — это конкретные даты платежей (по дням), а не месяцы.
// Берём все уникальные даты, по которым есть платежи, и сортируем по возрастанию.
const getCalendarDaysByPayments = (payments: ScheduleDetails[]) => {
  const daysMap = new Map<string, { key: string; label: string }>();

  payments.forEach((payment) => {
    const parsed = new Date(payment.paymentDate);
    if (Number.isNaN(parsed.getTime())) return;
    const key = getDayKey(parsed);
    if (!key || daysMap.has(key)) return;
    daysMap.set(key, {
      key,
      label: parsed.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }),
    });
  });

  return Array.from(daysMap.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );
};

const isSchedulePaid = (schedule: ScheduleDetails): boolean => {
  return (
    schedule.status === "Payed" || Boolean(schedule.payed ?? schedule.isPaid)
  );
};

const isScheduleOverdue = (schedule: ScheduleDetails): boolean => {
  if (schedule.status === "Overdue") return true;
  if (schedule.status === "Pending" || schedule.status === "Payed")
    return false;
  if (isSchedulePaid(schedule)) return false;
  const paymentDate = new Date(schedule.paymentDate);
  paymentDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return paymentDate < today;
};

const isSchedulePendingSoon = (schedule: ScheduleDetails): boolean => {
  if (schedule.status === "Pending") return true;
  if (isSchedulePaid(schedule) || isScheduleOverdue(schedule)) return false;

  const paymentDate = new Date(schedule.paymentDate);
  paymentDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilPayment = Math.ceil(
    (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilPayment >= 0 && daysUntilPayment <= 3;
};

const isScheduleTransferred = (schedule: ScheduleDetails): boolean => {
  const text = `${schedule.comment || ""} ${
    schedule.userComment || ""
  }`.toLowerCase();
  return text.includes("перенес") || text.includes("перенос");
};

const getSchedulePaymentStatus = (
  schedule: ScheduleDetails
): SchedulePaymentStatus => {
  if (isSchedulePaid(schedule)) return "paid";
  if (isScheduleTransferred(schedule)) return "transferred";
  if (isScheduleOverdue(schedule)) return "overdue";
  if (schedule.notified) return "called";
  return isSchedulePendingSoon(schedule) ? "pending" : "called";
};

const getDefaultCalendarDateRange = () => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  end.setDate(28);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const addDaysToIsoDate = (date: string, days: number): string => {
  const parsed = new Date(date);
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().split("T")[0];
};

const todayIsoDate = (): string => new Date().toISOString().split("T")[0];

// Когда фильтр дат не выбран, календарь работает как бесконечная лента:
// показываем окно дат вокруг сегодняшнего дня и расширяем его при скролле к краю.
const CALENDAR_PAST_DAYS = 30;
const CALENDAR_FUTURE_DAYS = 90;
const CALENDAR_WINDOW_STEP_DAYS = 30;
// Ограничение, чтобы окно не разрасталось бесконечно при длительном скролле.
const CALENDAR_MAX_SPAN_DAYS = 720;
const CALENDAR_SCROLL_EDGE_PX = 140;

const SchedulePage = ({
  initialTab = "table",
  hiddenTabs = ["calendar"],
  title = "Ожидаемые платежи",
}: SchedulePageProps = {}) => {
  const isTabHidden = useCallback(
    (tab: TabType) => hiddenTabs.includes(tab),
    [hiddenTabs]
  );
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as TabType;
    return savedTab &&
      (savedTab === "calendar" ||
        savedTab === "schedule" ||
        savedTab === "table") &&
      !hiddenTabs.includes(savedTab)
      ? savedTab
      : initialTab;
  });

  const [clientNameFilter, setClientNameFilter] = useState("");
  const [calendarSearch, setCalendarSearch] = useState("");
  const [calendarSearchQuery, setCalendarSearchQuery] = useState("");
  const [calendarDateFrom, setCalendarDateFrom] = useState("");
  const [calendarDateTo, setCalendarDateTo] = useState("");
  const [calendarOverdueOnly, setCalendarOverdueOnly] = useState(false);
  const [calendarOverdues, setCalendarOverdues] = useState("");
  const [calendarDateRangeWarning, setCalendarDateRangeWarning] = useState("");
  const [calendarObjectTypeName, setCalendarObjectTypeName] = useState("");
  const [selectedCalendarObjectType, setSelectedCalendarObjectType] =
    useState<SelectedObjectType | null>(null);
  const [calendarPage, setCalendarPage] = useState(1);
  // Окно дат для режима бесконечного скролла (когда фильтр дат не задан).
  const [calendarWindowStart, setCalendarWindowStart] = useState(() =>
    addDaysToIsoDate(todayIsoDate(), -CALENDAR_PAST_DAYS)
  );
  const [calendarWindowEnd, setCalendarWindowEnd] = useState(() =>
    addDaysToIsoDate(todayIsoDate(), CALENDAR_FUTURE_DAYS)
  );
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  // Запоминаем scrollWidth перед подгрузкой слева, чтобы вернуть позицию скролла
  // после появления новых колонок (иначе лента «прыгает»).
  const calendarAnchorWidthRef = useRef<number | null>(null);
  const calendarExtendingRef = useRef(false);
  const [selectedCalendarSchedule, setSelectedCalendarSchedule] =
    useState<ScheduleDetails | null>(null);
  const [scheduleComment, setScheduleComment] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isStatusInfoModalOpen, setIsStatusInfoModalOpen] = useState(false);
  const [isSavingScheduleComment, setIsSavingScheduleComment] = useState(false);
  const [investorFilter, setInvestorFilter] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(
    null
  );
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [tableObjectTypeName, setTableObjectTypeName] = useState("");
  const [selectedTableObjectType, setSelectedTableObjectType] =
    useState<SelectedObjectType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] =
    useState<ScheduleDetails | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const { hasRole, hasPermission } = useAuth();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const [isPageSizeReady, setIsPageSizeReady] = useState(false);
  const { getScheduleAnalityc } = useAnalytic();
  const { createPayment } = usePayment();
  const { GetFilledGuarantorSchedule } = useSender();
  const [scheduleAnalytics, setScheduleAnalytics] = useState<
    ScheduleAnalitycResponse[]
  >([]);
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const columnToApiSortMap: Record<number, string> = {
    0: "creditid",
    1: "client",
    2: "amount",
    3: "date",
  };

  // Используем хук для адаптивного размера страницы
  const { pageSize: responsivePageSize, containerRef } = useResponsivePageSize({
    defaultPageSize: 10,
    minPageSize: 1,
    maxPageSize: 50,
    rowHeight: 30,
    headerHeight: 300,
    paginationHeight: 65,
  });

  const pageSizeRef = useRef(responsivePageSize);
  const itemsPerPage = responsivePageSize;

  const { exportData, isExporting, exportProgress } =
    useExport<ScheduleDetails>();

  const {
    isLoading,
    error,
    scheduleData,
    calendarData,
    calendarSummary,
    getList,
    getCalendar,
    updateSchedule,
  } = useSchedule();

  const shouldShowScheduleTab =
    hasRole("директор") ||
    hasRole("суперадмин") ||
    hasPermission("MANAGE_ACCOUNTING", true) ||
    hasRole("админ");

  const saveActiveTabToStorage = useCallback((tab: TabType) => {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
  }, []);

  const getFallbackTab = useCallback((): TabType => {
    if (!isTabHidden("table")) return "table";
    if (!isTabHidden("calendar")) return "calendar";
    if (!isTabHidden("schedule")) return "schedule";
    return "table";
  }, [isTabHidden]);

  // Обновляем ref при изменении pageSize
  useEffect(() => {
    pageSizeRef.current = responsivePageSize;
    setIsPageSizeReady(true);
  }, [responsivePageSize]);

  useEffect(() => {
    if (
      isTabHidden(activeTab) ||
      (!shouldShowScheduleTab && activeTab === "schedule")
    ) {
      setActiveTab(getFallbackTab());
    }
  }, [shouldShowScheduleTab, activeTab, isTabHidden, getFallbackTab]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      saveActiveTabToStorage(tab);
    },
    [saveActiveTabToStorage]
  );

  useEffect(() => {
    const loadScheduleAnalytics = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const result = await getScheduleAnalityc(currentYear);
        if (result) {
          setScheduleAnalytics(result);
        }
      } catch (err) {
        console.error("Ошибка загрузки аналитики графика:", err);
      }
    };

    if (activeTab === "schedule") {
      loadScheduleAnalytics();
    }
  }, [activeTab, getScheduleAnalityc]);

  useEffect(() => {
    const container = chartsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const chartHeight =
        container.scrollHeight / (scheduleAnalytics.length - 1 || 1);
      const newIndex = Math.floor(scrollTop / chartHeight);

      if (
        newIndex !== currentChartIndex &&
        newIndex >= 0 &&
        newIndex < (scheduleAnalytics.length - 1 || 1)
      ) {
        setCurrentChartIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scheduleAnalytics.length, currentChartIndex]);

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingCreditId(null);
  };

  const handlePrintReceipt = async (paymentId: number) => {
    try {
      await paymentConfirmationGenerator.generatePaymentConfirmation(paymentId);
      console.log("Чек успешно сгенерирован");
    } catch (error) {
      console.error("Ошибка при печати чека:", error);
      alert("Платёж создан, но произошла ошибка при печати чека");
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentChartIndex(index);
    const container = chartsContainerRef.current;
    if (container) {
      const chartHeight =
        container.scrollHeight / (scheduleAnalytics.length - 1 || 1);
      container.scrollTo({
        top: index * chartHeight,
        behavior: "smooth",
      });
    }
  };

  const handleOpenPaymentModal = async (schedule: ScheduleDetails) => {
    try {
      const credit = await creditService.getCreditById(schedule.creditId);
      setSelectedCredit(credit);
      setSelectedScheduleForPayment(schedule);
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error("Ошибка при загрузке данных кредита:", error);
      alert("Не удалось загрузить данные кредита");
    }
  };

  const handleSavePayment = async (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: "cash" | "card";
    bankCardId?: number;
  }) => {
    try {
      if (!selectedScheduleForPayment) return;

      const paymentRequest = {
        creditId: selectedScheduleForPayment.creditId,
        paymentAmount: paymentData.principalAmount,
        datePayment: paymentData.paymentDate,
        type: paymentData.paymentMethod,
        bankCardId: paymentData.bankCardId,
      };

      const result = await createPayment(paymentRequest);

      await loadSchedules();
      setIsPaymentModalOpen(false);
      setSelectedScheduleForPayment(null);
      setSelectedCredit(null);

      return result;
    } catch (error) {
      console.error("Ошибка при сохранении платежа:", error);
      throw error;
    }
  };

  const getRowStyles = (
    tableData: any[][],
    scheduleData?: { items: ScheduleDetails[] }
  ): Record<number, RowStyle> => {
    const styles: Record<number, RowStyle> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!scheduleData?.items) return styles;

    scheduleData.items.forEach((schedule, index) => {
      const paymentDate = new Date(schedule.paymentDate);
      paymentDate.setHours(0, 0, 0, 0);

      if (index === selectedRow) {
        styles[index] = {
          backgroundColor: "#007D88",
          color: "white",
          fontWeight: "normal",
        };
      } else if (paymentDate < today) {
        styles[index] = {
          backgroundColor: "#FFEBEE",
          color: "black",
          fontWeight: "normal",
        };
      } else {
        styles[index] = {
          backgroundColor: "white",
          color: "black",
          fontWeight: "normal",
        };
      }
    });

    return styles;
  };

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    setSelectedRow(rowIndex === selectedRow ? null : rowIndex);
  };

  const handleRowDoubleClick = (rowData: any[]) => {
    const schedule = scheduleData?.items.find(
      (s) => s.creditId.toString() === rowData[0] && s.clientName === rowData[1]
    );

    if (schedule) {
      setViewingCreditId(schedule.creditId);
      setIsViewModalOpen(true);
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

  const loadSchedules = useCallback(async () => {
    if (!isPageSizeReady) return;

    const params: ScheduleParams = {
      page: currentPage,
      pageSize: itemsPerPage,
      clientName: clientNameFilter || undefined,
      dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
      dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined,
      creditTypeId: selectedTableObjectType?.id || undefined,
    };

    if (selectedEntity && selectedEntity.id != 0) {
      if (selectedEntity.type === "investor") {
        params.investorId = selectedEntity.id;
      } else if (selectedEntity.type === "pool") {
        params.poolId = selectedEntity.id;
      }
    }

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    await getList(params);
  }, [
    currentPage,
    clientNameFilter,
    investorFilter,
    dateFromFilter,
    dateToFilter,
    selectedTableObjectType,
    sortConfig,
    selectedEntity,
    getList,
    itemsPerPage,
    isPageSizeReady,
  ]);

  useEffect(() => {
    if (activeTab === "table" && isPageSizeReady) {
      loadSchedules();
    }
  }, [
    currentPage,
    clientNameFilter,
    investorFilter,
    dateFromFilter,
    dateToFilter,
    selectedTableObjectType,
    sortConfig,
    loadSchedules,
    activeTab,
    selectedEntity,
    isPageSizeReady,
  ]);

  const hasCalendarDateFilter = Boolean(calendarDateFrom || calendarDateTo);

  const loadCalendarSchedules = useCallback(async () => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (hasCalendarDateFilter) {
      // Режим фильтра: используем выбранные даты с ограничением диапазона в 120 дней.
      startDate = calendarDateFrom || undefined;
      let safeEndDate = calendarDateTo;
      if (
        calendarDateFrom &&
        calendarDateTo &&
        getDaysBetween(calendarDateFrom, calendarDateTo) > 120
      ) {
        safeEndDate = addDaysToIsoDate(calendarDateFrom, 120);
        setCalendarDateTo(safeEndDate);
        setCalendarDateRangeWarning("Диапазон календаря ограничен 120 днями.");
      } else {
        setCalendarDateRangeWarning("");
      }
      endDate = safeEndDate || undefined;
    } else {
      // Режим бесконечной ленты: окно дат вокруг сегодняшнего дня.
      setCalendarDateRangeWarning("");
      startDate = calendarWindowStart;
      endDate = calendarWindowEnd;
    }

    await getCalendar({
      StartDate: startDate ? parseDateInput(startDate) : undefined,
      EndDate: endDate ? parseDateInput(endDate) : undefined,
      Search: calendarSearchQuery || undefined,
      Overdue: calendarOverdueOnly || undefined,
      Overdues: calendarOverdues ? Number(calendarOverdues) : undefined,
      ClientsCount: 50,
      ClientsPage: calendarPage,
      CreditTypeId: selectedCalendarObjectType?.id || undefined,
    });

    calendarExtendingRef.current = false;
  }, [
    hasCalendarDateFilter,
    calendarDateFrom,
    calendarDateTo,
    calendarWindowStart,
    calendarWindowEnd,
    calendarSearchQuery,
    calendarOverdueOnly,
    calendarOverdues,
    selectedCalendarObjectType,
    calendarPage,
    getCalendar,
  ]);

  useEffect(() => {
    if (activeTab === "calendar") {
      loadCalendarSchedules();
    }
  }, [activeTab, loadCalendarSchedules]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCalendarSearchQuery(calendarSearch.trim());
      setCalendarPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [calendarSearch]);

  // Бесконечная лента: при подкрутке к краю расширяем окно дат и подгружаем данные.
  // Работает только когда фильтр дат не выбран.
  const handleCalendarScroll = useCallback(() => {
    if (hasCalendarDateFilter || isLoading || calendarExtendingRef.current) {
      return;
    }
    const el = calendarScrollRef.current;
    if (!el) return;

    if (
      getDaysBetween(calendarWindowStart, calendarWindowEnd) >=
      CALENDAR_MAX_SPAN_DAYS
    ) {
      return;
    }

    const atLeftEdge = el.scrollLeft <= CALENDAR_SCROLL_EDGE_PX;
    const atRightEdge =
      el.scrollLeft + el.clientWidth >=
      el.scrollWidth - CALENDAR_SCROLL_EDGE_PX;

    if (atLeftEdge) {
      calendarExtendingRef.current = true;
      // Запоминаем текущую ширину, чтобы после prepend вернуть позицию.
      calendarAnchorWidthRef.current = el.scrollWidth;
      setCalendarWindowStart((prev) =>
        addDaysToIsoDate(prev, -CALENDAR_WINDOW_STEP_DAYS)
      );
    } else if (atRightEdge) {
      calendarExtendingRef.current = true;
      setCalendarWindowEnd((prev) =>
        addDaysToIsoDate(prev, CALENDAR_WINDOW_STEP_DAYS)
      );
    }
  }, [
    hasCalendarDateFilter,
    isLoading,
    calendarWindowStart,
    calendarWindowEnd,
  ]);

  // После prepend новых колонок слева возвращаем позицию скролла, чтобы лента не «прыгала».
  useLayoutEffect(() => {
    const el = calendarScrollRef.current;
    if (el && calendarAnchorWidthRef.current !== null) {
      const delta = el.scrollWidth - calendarAnchorWidthRef.current;
      if (delta > 0) {
        el.scrollLeft += delta;
      }
      calendarAnchorWidthRef.current = null;
    }
  }, [calendarData]);

  const handleClientNameFilterChange = (value: string) => {
    setClientNameFilter(value);
    setCurrentPage(1);
  };

  const handleInvestorFilterChange = (value: string) => {
    setInvestorFilter(value);
    setSelectedEntity(null);
    setCurrentPage(1);
  };

  const handleEntitySelect = (investor: {
    id: number;
    nickname: string;
    fullName: string;
    phoneNumber: string;
    investorPie: number;
    investmentAmount: number;
    balance: number;
    type?: "investor" | "pool";
  }) => {
    setInvestorFilter(investor.nickname || investor.fullName);
    setSelectedEntity({
      id: investor.id,
      name: investor.nickname || investor.fullName,
      type: investor.type || "investor",
    });
    setCurrentPage(1);
  };

  const handleDateFromFilterChange = (value: string) => {
    setDateFromFilter(value);
    setCurrentPage(1);
  };

  const handleDateToFilterChange = (value: string) => {
    setDateToFilter(value);
    setCurrentPage(1);
  };

  const handleCalendarObjectTypeNameChange = (value: string) => {
    setCalendarObjectTypeName(value);
    if (!value) {
      setSelectedCalendarObjectType(null);
    }
    setCalendarPage(1);
  };

  const handleCalendarObjectTypeSelect = (objectType: SelectedObjectType) => {
    setSelectedCalendarObjectType(objectType);
    setCalendarObjectTypeName(objectType.name);
    setCalendarPage(1);
  };

  const handleTableObjectTypeNameChange = (value: string) => {
    setTableObjectTypeName(value);
    if (!value) {
      setSelectedTableObjectType(null);
    }
    setCurrentPage(1);
  };

  const handleTableObjectTypeSelect = (objectType: SelectedObjectType) => {
    setSelectedTableObjectType(objectType);
    setTableObjectTypeName(objectType.name);
    setCurrentPage(1);
  };

  const openScheduleCommentModal = (schedule: ScheduleDetails) => {
    setIsViewModalOpen(false);
    setViewingCreditId(null);
    setSelectedCalendarSchedule(schedule);
    setScheduleComment(schedule.userComment || "");
    setScheduleDate(toDateInputValue(schedule.paymentDate));
    setIsCommentModalOpen(true);
  };

  const handleCalendarPaymentClick = (
    event: React.MouseEvent,
    schedule: ScheduleDetails
  ) => {
    event.preventDefault();
    event.stopPropagation();
    openScheduleCommentModal(schedule);
  };

  const handleCalendarCellClick = (payments: ScheduleDetails[]) => {
    if (payments.length === 1) {
      openScheduleCommentModal(payments[0]);
    }
  };

  const handleSaveScheduleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendarSchedule || !scheduleDate) return;

    setIsSavingScheduleComment(true);
    const success = await updateSchedule({
      id: selectedCalendarSchedule.id,
      date: new Date(scheduleDate).toISOString(),
      userComment: scheduleComment.trim() || null,
    });
    setIsSavingScheduleComment(false);

    if (!success) {
      alert("Не удалось сохранить комментарий");
      return;
    }

    setIsCommentModalOpen(false);
    setSelectedCalendarSchedule(null);

    if (activeTab === "calendar") {
      await loadCalendarSchedules();
    }

    if (activeTab === "table") {
      await loadSchedules();
    }
  };

  const handleOpenPaymentFromScheduleModal = async () => {
    if (!selectedCalendarSchedule) return;
    await handleOpenPaymentModal(selectedCalendarSchedule);
    setIsCommentModalOpen(false);
  };

  const handleNotifyFromScheduleModal = async () => {
    if (!selectedCalendarSchedule) return;
    const success = await sendWhatsAppMessage(
      selectedCalendarSchedule.id,
      selectedCalendarSchedule.clientPhone
    );

    if (success) {
      await loadCalendarSchedules();
      if (activeTab === "table") {
        await loadSchedules();
      }
    }
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
          const params: ScheduleParams = {
            page,
            pageSize,
            clientName: clientNameFilter || undefined,
            investorNickname: investorFilter || undefined,
            dateFrom: dateFromFilter
              ? parseDateInput(dateFromFilter)
              : undefined,
            dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined,
            creditTypeId: selectedTableObjectType?.id || undefined,
            sortBy:
              sortConfig.key !== null
                ? columnToApiSortMap[sortConfig.key]
                : undefined,
            sortDirection: sortConfig.direction,
          };

          if (selectedEntity && selectedEntity.id != 0) {
            if (selectedEntity.type === "investor") {
              params.investorId = selectedEntity.id;
            } else if (selectedEntity.type === "pool") {
              params.poolId = selectedEntity.id;
            }
          }

          const result = await scheduleService.getList(params);
          return {
            items: Array.isArray(result.items) ? result.items : [],
            totalCount: result.totalCount || 0,
          };
        },
        fileName: "schedules_export",
        transformData: (schedule) => ({
          "Договор №": schedule.creditId,
          ФИО: schedule.clientName,
          Телефон: schedule.clientPhone,
          "ФИО поручителя": schedule.guarantorFullname,
          "Телефон поручителя": schedule.guarantorPhone,
          Платеж: formatMoneyValue(schedule.paymentAmount),
          "Дата платежа": formatDate(schedule.paymentDate),
          Комментарий: schedule.userComment || "",
          Уведомлен: schedule.notified ? "Да" : "Нет",
        }),
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const tableActions = [
    {
      label: "Договор",
      action: (rowData: any[]) => {
        const schedule = scheduleData?.items.find(
          (s) =>
            s.creditId.toString() === rowData[0] && s.clientName === rowData[1]
        );

        if (schedule) {
          const schedule = scheduleData?.items.find(
            (s) =>
              s.creditId.toString() === rowData[0] &&
              s.clientName === rowData[1]
          );

          if (schedule) {
            setViewingCreditId(schedule.creditId);
            setIsViewModalOpen(true);
          }
        }
      },
      color: "#007D88",
    },
    {
      label: "Добавить платёж",
      action: (rowData: any[]) => {
        const schedule = scheduleData?.items.find(
          (s) =>
            s.creditId.toString() === rowData[0] && s.clientName === rowData[1]
        );

        if (schedule) {
          handleOpenPaymentModal(schedule);
        }
      },
      color: "#008b8b",
    },
    {
      label: "Дата/комментарий",
      action: (_rowData: any[], rowIndex: number) => {
        const schedule = scheduleData?.items[rowIndex];
        if (schedule) {
          openScheduleCommentModal(schedule);
        }
      },
      color: "#3B82F6",
    },
  ];

  const tableData =
    scheduleData?.items.map((schedule) => {
      const formattedAmount = formatMoneyValue(schedule.paymentAmount);
      const formattedDate = formatDate(schedule.paymentDate);

      const handleWhatsAppClick = async () => {
        const success = await sendWhatsAppMessage(
          schedule.id,
          schedule.clientPhone
        );

        if (success) {
          loadSchedules();
        }
      };

      const handleGuarantorWhatsAppClick = async () => {
        if (!schedule.guarantorPhone) return;
        const message = await GetFilledGuarantorSchedule(schedule.id);
        if (!message) {
          alert("Не удалось получить сообщение для поручителя");
          return;
        }
        await sendCustomWhatsAppMessage(schedule.guarantorPhone, message);
      };

      return [
        schedule.creditId.toString(),
        schedule.clientName,
        formattedAmount,
        formattedDate,
        schedule.userComment || "—",
        <NotifyCell>
          {schedule.notified ? (
            <IconButton
              onClick={handleWhatsAppClick}
              title="Отправить повторно"
            >
              <CheckIcon />
            </IconButton>
          ) : (
            <IconButton
              onClick={handleWhatsAppClick}
              title="Отправить уведомление"
            >
              <WhatsAppIcon />
            </IconButton>
          )}
          {schedule.guarantorPhone && (
            <IconButton
              onClick={handleGuarantorWhatsAppClick}
              title="Отправить данные договора поручителю"
            >
              <GuarantorWhatsAppIcon />
            </IconButton>
          )}
        </NotifyCell>,
      ];
    }) || [];

  const rowStyles = getRowStyles(tableData, scheduleData);

  const mainChart = scheduleAnalytics[0];

  const additionalCharts = scheduleAnalytics.slice(1);

  const loadScheduleAnalyticsForYear = async (year: number) => {
    try {
      const result = await getScheduleAnalityc(year);
      if (result) {
        setScheduleAnalytics(result);
      }
    } catch (err) {
      console.error("Ошибка загрузки аналитики графика:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "schedule") {
      loadScheduleAnalyticsForYear(selectedYear);
    }
  }, [activeTab, selectedYear, getScheduleAnalityc]);

  const renderMainChart = () => {
    if (!mainChart) {
      return <EmptyChart>Нет данных для отображения</EmptyChart>;
    }

    return (
      <MainChartCard>
        <SchedulePieChart
          title={`${mainChart.title}`}
          data={mainChart}
          isMainChart={true}
          currentYear={selectedYear}
          onYearChange={(year) => {
            setSelectedYear(year);
            loadScheduleAnalyticsForYear(year);
          }}
        />
      </MainChartCard>
    );
  };

  const renderAdditionalCharts = () => {
    if (additionalCharts.length === 0) {
      return <EmptyChart>Нет дополнительных данных</EmptyChart>;
    }

    return (
      <ChartsScrollContainer ref={chartsContainerRef}>
        {additionalCharts.map((chartData, index) => (
          <ChartCard key={index}>
            <SchedulePieChart title={`${chartData.title}`} data={chartData} />
          </ChartCard>
        ))}
      </ChartsScrollContainer>
    );
  };

  const safeCalendarData = Array.isArray(calendarData) ? calendarData : [];
  const calendarDays = getCalendarDaysByPayments(safeCalendarData);
  const calendarClients = Array.from(
    new Map(
      safeCalendarData.map((item) => {
        const key = getCalendarClientKey(item);
        return [key, { key, name: getCalendarClientName(item) }];
      })
    ).values()
  );
  const calendarPaymentsByClient = safeCalendarData.reduce((acc, item) => {
    const clientKey = getCalendarClientKey(item);
    const dayKey = getDayKey(item.paymentDate);
    if (!dayKey) return acc;
    if (!acc[clientKey]) acc[clientKey] = {};
    if (!acc[clientKey][dayKey]) acc[clientKey][dayKey] = [];
    acc[clientKey][dayKey].push(item);
    return acc;
  }, {} as Record<string, Record<string, ScheduleDetails[]>>);

  const tabs = [
    ...(shouldShowScheduleTab && !isTabHidden("calendar")
      ? [
          {
            id: "calendar",
            label: "Календарь",
            content: (
              <>
                <CalendarToolbar>
                  <CalendarFilterGroup>
                    <SearchField>
                      <CustomInput
                        inputType="text"
                        placeholder="Поиск по ФИО"
                        value={calendarSearch}
                        onChange={(e) => setCalendarSearch(e.target.value)}
                      />
                      {calendarSearch && (
                        <SearchClearButton
                          type="button"
                          onClick={() => {
                            setCalendarSearch("");
                            setCalendarSearchQuery("");
                            setCalendarPage(1);
                          }}
                          aria-label="Очистить поиск"
                        >
                          ×
                        </SearchClearButton>
                      )}
                    </SearchField>
                  </CalendarFilterGroup>
                  <CalendarFilterGroup>
                    <ObjectTypeSelect
                      value={calendarObjectTypeName}
                      onChange={handleCalendarObjectTypeNameChange}
                      onObjectTypeSelect={handleCalendarObjectTypeSelect}
                      placeholder="Папка договора"
                      entityType="credit"
                    />
                  </CalendarFilterGroup>
                  <CalendarFilterGroup>
                    <CustomCalendar
                      prefix="От"
                      value={calendarDateFrom}
                      onChange={(date) => {
                        setCalendarDateFrom(date);
                        setCalendarPage(1);
                      }}
                    />
                  </CalendarFilterGroup>
                  <CalendarFilterGroup>
                    <CustomCalendar
                      prefix="До"
                      value={calendarDateTo}
                      onChange={(date) => {
                        setCalendarDateTo(date);
                        setCalendarPage(1);
                      }}
                    />
                  </CalendarFilterGroup>
                  <CalendarFilterGroup>
                    <CustomInput
                      inputType="number"
                      placeholder="Кол-во просрочек"
                      value={calendarOverdues}
                      min="1"
                      onChange={(e) => {
                        setCalendarOverdues(
                          e.target.value.replace(/[^0-9]/g, "")
                        );
                        setCalendarPage(1);
                      }}
                    />
                  </CalendarFilterGroup>
                  <CalendarSwitchLabel>
                    <CalendarSwitchInput
                      type="checkbox"
                      checked={calendarOverdueOnly}
                      onChange={(e) => {
                        setCalendarOverdueOnly(e.target.checked);
                        setCalendarPage(1);
                      }}
                    />
                    <CalendarSwitchSlider />
                    <span>Только просрочки</span>
                  </CalendarSwitchLabel>
                  <CalendarInfoButton
                    type="button"
                    onClick={() => setIsStatusInfoModalOpen(true)}
                    title="Статусы платежей"
                  >
                    <Info size={16} strokeWidth={2.2} />
                    <span>Статусы платежей</span>
                  </CalendarInfoButton>
                </CalendarToolbar>
                {calendarDateRangeWarning && (
                  <CalendarWarning>{calendarDateRangeWarning}</CalendarWarning>
                )}
                <CalendarSummaryBar>
                  <CalendarSummaryItem>
                    <CalendarSummaryLabel>Всего платежей</CalendarSummaryLabel>
                    <CalendarSummaryValue>
                      {calendarSummary.totalCount}
                    </CalendarSummaryValue>
                  </CalendarSummaryItem>
                  <CalendarSummaryItem>
                    <CalendarSummaryLabel>Просрочек</CalendarSummaryLabel>
                    <CalendarSummaryValue
                      $danger={calendarSummary.totalOverdues > 0}
                    >
                      {calendarSummary.totalOverdues}
                    </CalendarSummaryValue>
                  </CalendarSummaryItem>
                  <CalendarSummaryItem>
                    <CalendarSummaryLabel>Сумма просрочек</CalendarSummaryLabel>
                    <CalendarSummaryValue
                      $danger={calendarSummary.overduesAmount > 0}
                    >
                      {formatMoneyValue(calendarSummary.overduesAmount)}
                    </CalendarSummaryValue>
                  </CalendarSummaryItem>
                </CalendarSummaryBar>
                {error && <div>Ошибка: {error}</div>}
                {!error && (
                  <CalendarGridScroll
                    ref={calendarScrollRef}
                    onScroll={handleCalendarScroll}
                  >
                    {isLoading && (
                      <CalendarLoadingOverlay>Загрузка…</CalendarLoadingOverlay>
                    )}
                    <CalendarGrid $columns={calendarDays.length}>
                      <CalendarHeaderCell>Клиент / дата</CalendarHeaderCell>
                      {calendarDays.map((day) => (
                        <CalendarHeaderCell key={day.key}>
                          {day.label}
                        </CalendarHeaderCell>
                      ))}

                      {calendarClients.length === 0 && (
                        <CalendarEmptyCell $columns={calendarDays.length + 1}>
                          Нет платежей за выбранный период
                        </CalendarEmptyCell>
                      )}

                      {calendarClients.map((client) => [
                        <CalendarClientCell key={`${client.key}-client`}>
                          {client.name}
                        </CalendarClientCell>,
                        ...calendarDays.map((day) => {
                          const payments =
                            calendarPaymentsByClient[client.key]?.[day.key] ||
                            [];
                          return (
                            <CalendarPaymentCell
                              key={`${client.key}-${day.key}`}
                              $isClickable={payments.length > 0}
                              onClick={() => handleCalendarCellClick(payments)}
                            >
                              {payments.length === 0 ? (
                                <CalendarEmptyMark>—</CalendarEmptyMark>
                              ) : (
                                payments.map((payment) => {
                                  const status =
                                    getSchedulePaymentStatus(payment);
                                  return (
                                    <PaymentChip
                                      key={payment.id}
                                      type="button"
                                      $status={status}
                                      $hasComment={Boolean(
                                        payment.userComment?.trim()
                                      )}
                                      onClick={(event) =>
                                        handleCalendarPaymentClick(
                                          event,
                                          payment
                                        )
                                      }
                                      title="Открыть платеж"
                                    >
                                      <PaymentChipAmount>
                                        {formatMoneyValue(
                                          payment.paymentAmount
                                        )}
                                      </PaymentChipAmount>
                                      <PaymentChipDate>
                                        {formatDate(payment.paymentDate)}
                                      </PaymentChipDate>
                                    </PaymentChip>
                                  );
                                })
                              )}
                            </CalendarPaymentCell>
                          );
                        }),
                      ])}
                    </CalendarGrid>
                  </CalendarGridScroll>
                )}
              </>
            ),
          },
        ]
      : []),
    ...(shouldShowScheduleTab && !isTabHidden("schedule")
      ? [
          {
            id: "schedule",
            label: "График",
            content: (
              <ScheduleContainer>
                <LeftContainer>{renderMainChart()}</LeftContainer>
                <RightContainer>
                  {renderAdditionalCharts()}
                  {additionalCharts.length > 0 && (
                    <ChartsNavigation>
                      <PaginationDots
                        count={additionalCharts.length}
                        activeIndex={currentChartIndex}
                        onClick={handleDotClick}
                        className="vertical"
                      />
                    </ChartsNavigation>
                  )}
                </RightContainer>
              </ScheduleContainer>
            ),
          },
        ]
      : []),
    ...(!isTabHidden("table")
      ? [
          {
            id: "table",
            label: "Таблица",
            content: (
              <>
                <FilterContainer>
                  <FilterField>
                    <InputWrapper>
                      <CustomInput
                        inputType="text"
                        placeholder="Клиент"
                        value={clientNameFilter}
                        onChange={(e) =>
                          handleClientNameFilterChange(e.target.value)
                        }
                      />
                    </InputWrapper>
                    <InputWrapper>
                      <InvestorSelect
                        placeholder="Инвестор или пул"
                        value={investorFilter}
                        onChange={handleInvestorFilterChange}
                        onInvestorSelect={handleEntitySelect}
                        includePools={true}
                      />
                    </InputWrapper>
                    <InputWrapper>
                      <ObjectTypeSelect
                        value={tableObjectTypeName}
                        onChange={handleTableObjectTypeNameChange}
                        onObjectTypeSelect={handleTableObjectTypeSelect}
                        placeholder="Папка договора"
                        entityType="credit"
                      />
                    </InputWrapper>
                    <DateInputWrapper>
                      <CustomCalendar
                        prefix="От"
                        value={dateFromFilter}
                        onChange={handleDateFromFilterChange}
                      />
                    </DateInputWrapper>
                    <DateInputWrapper>
                      <CustomCalendar
                        prefix="До"
                        value={dateToFilter}
                        onChange={handleDateToFilterChange}
                      />
                    </DateInputWrapper>
                  </FilterField>
                </FilterContainer>

                {isLoading && <div>Загрузка...</div>}
                {error && <div>Ошибка: {error}</div>}

                {!isLoading && !error && (
                  <>
                    <CustomTable
                      columns={[
                        { name: "Договор №", isSortable: true },
                        { name: "ФИО", isSortable: true, align: "left" },
                        { name: "Платёж", isSortable: true, align: "right" },
                        {
                          name: "Дата платежа",
                          isSortable: true,
                          align: "right",
                        },
                        { name: "Комментарий", align: "left" },
                        { name: "Уведомлён", align: "center" },
                      ]}
                      data={tableData}
                      onSort={handleSort}
                      onRowClick={handleRowClick}
                      onRowDoubleClick={handleRowDoubleClick}
                      sortConfig={sortConfig}
                      rowStyles={rowStyles}
                      selectedRow={selectedRow}
                      contextMenuActions={tableActions}
                    />

                    <PaginationLayout>
                      <CountInfoTitle total={scheduleData?.totalCount || 0} />

                      <Pagination
                        total={scheduleData?.totalCount || 0}
                        current={currentPage}
                        onChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                      />
                    </PaginationLayout>
                  </>
                )}
              </>
            ),
          },
        ]
      : []),
  ];

  const selectedScheduleStatus = selectedCalendarSchedule
    ? getSchedulePaymentStatus(selectedCalendarSchedule)
    : "pending";

  return (
    <PageLayout ref={containerRef}>
      {activeTab !== "calendar" && (
        <TitleField>
          <CustomTitle>{title}</CustomTitle>
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            exportProgress={exportProgress}
          />
        </TitleField>
      )}

      {tabs.length > 1 ? (
        <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      ) : (
        tabs[0]?.content
      )}

      {isCommentModalOpen && selectedCalendarSchedule && (
        <BaseModal
          title="Платеж из календаря"
          onClose={() => setIsCommentModalOpen(false)}
          onCancel={() => setIsCommentModalOpen(false)}
          onSave={handleSaveScheduleComment}
          saveButtonText="Сохранить"
          isSubmitting={isSavingScheduleComment}
          width="720px"
        >
          <ScheduleCommentForm>
            <ScheduleModalHeaderCard $status={selectedScheduleStatus}>
              <ScheduleModalHeaderMain>
                <ScheduleModalClientName>
                  {selectedCalendarSchedule.clientName || "Без имени"}
                </ScheduleModalClientName>
              </ScheduleModalHeaderMain>
              <ScheduleModalMetaGrid>
                <ScheduleModalMetaItem>
                  <ScheduleModalLabel>Договор</ScheduleModalLabel>
                  <ScheduleModalValue>
                    №{selectedCalendarSchedule.creditId}
                  </ScheduleModalValue>
                </ScheduleModalMetaItem>
                <ScheduleModalMetaItem>
                  <ScheduleModalLabel>Платеж</ScheduleModalLabel>
                  <ScheduleModalValue>
                    {formatMoneyValue(selectedCalendarSchedule.paymentAmount)}
                  </ScheduleModalValue>
                </ScheduleModalMetaItem>
                <ScheduleModalMetaItem>
                  <ScheduleModalLabel>Остаток</ScheduleModalLabel>
                  <ScheduleModalValue>
                    {formatMoneyValue(selectedCalendarSchedule.rest)}
                  </ScheduleModalValue>
                </ScheduleModalMetaItem>
                <ScheduleModalMetaItem>
                  <ScheduleModalLabel>Телефон клиента</ScheduleModalLabel>
                  <ScheduleModalValue>
                    {selectedCalendarSchedule.clientPhone || "Нет данных"}
                  </ScheduleModalValue>
                </ScheduleModalMetaItem>
                {selectedCalendarSchedule.guarantorFullname && (
                  <ScheduleModalMetaItem>
                    <ScheduleModalLabel>Поручитель</ScheduleModalLabel>
                    <ScheduleModalValue>
                      {selectedCalendarSchedule.guarantorFullname}
                    </ScheduleModalValue>
                  </ScheduleModalMetaItem>
                )}
                {selectedCalendarSchedule.guarantorPhone && (
                  <ScheduleModalMetaItem>
                    <ScheduleModalLabel>Телефон поручителя</ScheduleModalLabel>
                    <ScheduleModalValue>
                      {selectedCalendarSchedule.guarantorPhone}
                    </ScheduleModalValue>
                  </ScheduleModalMetaItem>
                )}
              </ScheduleModalMetaGrid>
            </ScheduleModalHeaderCard>

            <ScheduleOperationsRow>
              <ScheduleOperationButton
                type="button"
                onClick={handleOpenPaymentFromScheduleModal}
              >
                Добавить платеж
              </ScheduleOperationButton>
              <ScheduleOperationButton
                type="button"
                onClick={handleNotifyFromScheduleModal}
              >
                Отправить уведомление
              </ScheduleOperationButton>
            </ScheduleOperationsRow>

            <ModalField>
              <InputLabel>Дата платежа</InputLabel>
              <CustomCalendar
                prefix=""
                value={scheduleDate}
                onChange={setScheduleDate}
              />
            </ModalField>

            <ModalField>
              <InputLabel>Комментарий</InputLabel>
              <CommentTextarea
                value={scheduleComment}
                onChange={(e) => setScheduleComment(e.target.value)}
                placeholder="Комментарий по платежу"
                rows={4}
              />
            </ModalField>
          </ScheduleCommentForm>
        </BaseModal>
      )}

      {isStatusInfoModalOpen && (
        <BaseModal
          title="Статусы платежей"
          onClose={() => setIsStatusInfoModalOpen(false)}
          onCancel={() => setIsStatusInfoModalOpen(false)}
          hideSaveButton
          width="520px"
        >
          <StatusInfoList>
            {(
              Object.keys(schedulePaymentStatusMeta) as SchedulePaymentStatus[]
            ).map((status) => (
              <StatusInfoItem key={status}>
                <StatusInfoDot $status={status} />
                <StatusInfoTitle>
                  {schedulePaymentStatusMeta[status].label}
                </StatusInfoTitle>
              </StatusInfoItem>
            ))}
          </StatusInfoList>
        </BaseModal>
      )}

      <NewPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedScheduleForPayment(null);
          setSelectedCredit(null);
        }}
        onSubmit={handleSavePayment}
        creditId={selectedScheduleForPayment?.creditId || 0}
        clientName={selectedScheduleForPayment?.clientName || ""}
        investorName={selectedCredit?.investorNickname || ""}
        clientPhone={selectedScheduleForPayment?.clientPhone || ""}
        currentDebt={selectedCredit?.rest || 0}
        currentMonthDebt={selectedScheduleForPayment?.paymentAmount || 0}
        onPrintReceipt={handlePrintReceipt}
      />

      <ViewCreditModal
        id={viewingCreditId || 0}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
    </PageLayout>
  );
};

const ScheduleContainer = styled.div`
  display: flex;
  gap: 20px;
  height: 600px;
`;

const LeftContainer = styled.div`
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RightContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 20px;
`;

const ChartsNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChartsScrollContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-right: 10px;

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const MainChartCard = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChartCard = styled.div``;

const EmptyChart = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
  background: white;
  border-radius: 8px;
  padding: 20px;
`;

const FilterContainer = styled.div`
  margin-bottom: 20px;
`;

const FilterField = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
`;

const InputWrapper = styled.div`
  flex: 1;
  min-width: 200px;
`;

const DateInputWrapper = styled.div`
  flex: 1;
  min-width: 180px;
`;

const FilterInfo = styled.div`
  margin-bottom: 16px;
  padding: 8px 12px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  color: #0050b3;
  font-size: 14px;
`;

const CalendarToolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
`;

const CalendarFilterGroup = styled.div`
  min-width: 210px;
`;

const SearchField = styled.div`
  position: relative;
  width: 100%;
`;

const SearchClearButton = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #e5e7eb;
  color: #374151;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #d1d5db;
  }
`;

const CalendarSwitchLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const CalendarSwitchInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

const CalendarSwitchSlider = styled.span`
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background-color 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.24);
    transition: transform 0.2s ease;
  }

  ${CalendarSwitchInput}:checked + & {
    background: #007d88;
  }

  ${CalendarSwitchInput}:checked + &::after {
    transform: translateX(18px);
  }
`;

const CalendarInfoButton = styled.button`
  height: 34px;
  padding: 0 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #007d88;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    border-color: #007d88;
    background: #f0fdfa;
  }
`;

const CalendarWarning = styled.div`
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  font-size: 14px;
`;

const CalendarSummaryBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
`;

const CalendarSummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 140px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
`;

const CalendarSummaryLabel = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const CalendarSummaryValue = styled.span<{ $danger?: boolean }>`
  font-size: 18px;
  font-weight: 700;
  color: ${(props) => (props.$danger ? "#dc2626" : "#111827")};
`;

const CalendarGridScroll = styled.div`
  position: relative;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  max-height: calc(100vh - 280px);
`;

const CalendarLoadingOverlay = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(248, 250, 252, 0.92);
  border-bottom: 1px solid #e2e8f0;
`;

const CalendarGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: 260px repeat(
      ${(props) => props.$columns},
      minmax(130px, 160px)
    );
  min-width: max-content;
`;

const CalendarHeaderCell = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 10px 12px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  text-align: center;

  &:first-child {
    left: 0;
    z-index: 3;
    text-align: left;
  }
`;

const CalendarClientCell = styled.div`
  position: sticky;
  left: 0;
  z-index: 1;
  padding: 10px 12px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
`;

const CalendarPaymentCell = styled.div<{ $isClickable?: boolean }>`
  min-height: 70px;
  padding: 6px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: stretch;
  justify-content: center;
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
`;

const CalendarEmptyMark = styled.span`
  color: #cbd5e1;
  text-align: center;
  font-size: 13px;
`;

const CalendarEmptyCell = styled.div<{ $columns: number }>`
  grid-column: span ${(props) => props.$columns};
  padding: 28px;
  color: #6b7280;
  text-align: center;
`;

const PaymentChip = styled.button<{
  $status: SchedulePaymentStatus;
  $hasComment: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  min-height: 58px;
  padding: 7px 8px;
  border: 1px solid
    ${(props) => schedulePaymentStatusMeta[props.$status].border};
  border-left: 3px solid
    ${(props) => schedulePaymentStatusMeta[props.$status].accent};
  border-radius: 7px;
  background: ${(props) => schedulePaymentStatusMeta[props.$status].background};
  color: #111827;
  cursor: pointer;

  &::after {
    content: ${(props) => (props.$hasComment ? '"💬"' : '""')};
    position: absolute;
    top: 3px;
    right: 5px;
    font-size: 10px;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
    transform: translateY(-1px);
  }
`;

const PaymentChipAmount = styled.span`
  font-size: 12px;
  font-weight: 800;
`;

const PaymentChipDate = styled.span`
  font-size: 11px;
  color: #64748b;
`;

const ScheduleCommentForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px;
`;

const ScheduleModalHeaderCard = styled.div<{ $status: SchedulePaymentStatus }>`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid
    ${(props) => schedulePaymentStatusMeta[props.$status].border};
  border-left: 4px solid
    ${(props) => schedulePaymentStatusMeta[props.$status].accent};
  background: ${(props) => schedulePaymentStatusMeta[props.$status].background};
  color: #111827;
`;

const ScheduleModalHeaderMain = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const ScheduleModalClientName = styled.strong`
  color: #111827;
  font-size: 18px;
  line-height: 1.25;
`;

const ScheduleModalMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ScheduleModalMetaItem = styled.div`
  min-width: 0;
  padding: 10px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.72);
`;

const ScheduleModalLabel = styled.div`
  margin-bottom: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.25;
`;

const ScheduleModalValue = styled.div`
  color: #111827;
  font-size: 14px;
  line-height: 1.3;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

const StatusInfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px;
`;

const StatusInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusInfoDot = styled.span<{ $status: SchedulePaymentStatus }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(props) => schedulePaymentStatusMeta[props.$status].accent};
`;

const StatusInfoTitle = styled.div`
  color: #111827;
  font-size: 14px;
  font-weight: 700;
`;

const ScheduleOperationsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ScheduleOperationButton = styled.button`
  min-height: 38px;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: #007d88;
    color: #007d88;
    background: #f8fbfb;
  }
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputLabel = styled.label`
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

export default SchedulePage;

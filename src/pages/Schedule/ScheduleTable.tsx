import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import CustomTable, {
  type RowStyle,
} from "../../components/ui/tables/CustomTable";
import Pagination from "../../components/ui/fields/CustomPagination";
import PaginationLayout from "../../components/ui/Layouts/PaginationLayout";
import CountInfoTitle from "../../components/ui/Text/CountInfoTitle";
import CustomInput from "../../components/ui/fields/CustomInput";
import CustomCalendar from "../../components/ui/fields/CustomCalendar";
import InvestorSelect from "../../components/ui/fields/InvestorSelect";
import ObjectTypeSelect from "../../components/ui/fields/ObjectTypeSelect";
import DarkCyanButton from "../../components/ui/Buttons/DarkCyanButton";
import NewPaymentModal from "../../components/modal/NewPaymentModal";
import ViewCreditModal from "../../components/modal/ViewCreditModal";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import useSchedule from "../../api/hooks/useSchedule";
import usePayment from "../../api/hooks/usePayment";
import creditService from "../../api/services/creditService";
import paymentService from "../../api/services/paymentService";
import type { ScheduleDetails, ScheduleParams } from "../../api/types/schedule";
import type { Credit } from "../../api/types/credit";
import type { PaymentTab } from "../../api/types/payment";
import { formatDate, parseDateInput } from "../../utils/dateFormatter";
import { formatMoney } from "../../utils/formatPrice";
import PaymentConfirmationGenerator from "../../utils/doxcUtils/paymentConfirmationGenerator";
import {
  sendWhatsAppMessage,
  sendCustomWhatsAppMessage,
} from "../../utils/sendWhatsAppMessage";
import useSender from "../../api/hooks/useSender";
import scheduleService from "../../api/services/scheduleService";
import type { VisitMode } from "../../api/types/schedule";
import usePersistedState from "../../hooks/usePersistedState";
import { useUiSettings, colorForPaymentDate } from "../../utils/uiSettings";
import {
  useScrollMemory,
  restoreScroll,
  forgetScroll,
} from "../../utils/listPosition";

interface ScheduleTableProps {
  isListMode: boolean;
  pageSize: number;
  shouldBeVisited?: boolean;
}

export interface ScheduleFilters {
  clientName?: string;
  investorName?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: string;
  amountTo?: string;
  objectTypeId?: number;
  entityId?: number;
  entityType?: "investor" | "pool";
  sortKey?: number | null;
  sortDirection?: "asc" | "desc";
  shouldBeVisited?: boolean;
}

export interface ScheduleTableHandle {
  getFilters: () => ScheduleFilters;
}

interface SelectedEntity {
  id: number;
  name: string;
  type: "investor" | "pool";
}

interface SelectedObjectType {
  id: number;
  name: string;
}

export const CheckIcon = () => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
    <path
      d="M15.3227 1.73849C15.5053 1.54252 15.6047 1.28333 15.6 1.01552C15.5952 0.747705 15.4867 0.492182 15.2973 0.30278C15.1079 0.113379 14.8524 0.00488629 14.5846 0.000161053C14.3168 -0.00456418 14.0576 0.0948468 13.8616 0.277449L5.63297 8.50612L2.22848 5.10163C2.03251 4.91903 1.77332 4.81961 1.50551 4.82434C1.23769 4.82907 0.982171 4.93756 0.792769 5.12696C0.603368 5.31636 0.494877 5.57188 0.490151 5.8397C0.485426 6.10751 0.584836 6.3667 0.767438 6.56266L4.90245 10.6977C5.09628 10.8913 5.35902 11 5.63297 11C5.90691 11 6.16966 10.8913 6.36349 10.6977L15.3227 1.73849Z"
      fill="#50555C"
    />
  </svg>
);

export const WhatsAppIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
    <path
      d="M17.8437 3.11431C16.8886 2.14984 15.751 1.38511 14.4974 0.864691C13.2437 0.344271 11.899 0.078567 10.5416 0.083064C4.85413 0.083064 0.218709 4.71848 0.218709 10.406C0.218709 12.2289 0.697876 13.9997 1.59371 15.5622L0.135376 20.9164L5.60413 19.4789C7.11454 20.3018 8.81246 20.7393 10.5416 20.7393C16.2291 20.7393 20.8645 16.1039 20.8645 10.4164C20.8645 7.65598 19.7916 5.06223 17.8437 3.11431ZM10.5416 18.9893C8.99996 18.9893 7.48954 18.5726 6.16663 17.7914L5.85413 17.6039L2.60413 18.4581L3.46871 15.2914L3.26038 14.9685C2.40365 13.6008 1.94884 12.0198 1.94788 10.406C1.94788 5.67681 5.80204 1.82265 10.5312 1.82265C12.8229 1.82265 14.9791 2.71848 16.5937 4.34348C17.3933 5.13917 18.027 6.08571 18.4579 7.1282C18.8888 8.17068 19.1085 9.28836 19.1041 10.4164C19.125 15.1456 15.2708 18.9893 10.5416 18.9893ZM15.25 12.5726C14.9895 12.4476 13.7187 11.8226 13.4895 11.7289C13.25 11.6456 13.0833 11.6039 12.9062 11.8539C12.7291 12.1143 12.2395 12.6976 12.0937 12.8643C11.9479 13.0414 11.7916 13.0622 11.5312 12.9268C11.2708 12.8018 10.4375 12.5206 9.45829 11.6456C8.68746 10.9581 8.17704 10.1143 8.02079 9.8539C7.87496 9.59348 7.99996 9.45806 8.13538 9.32265C8.24996 9.20806 8.39579 9.02056 8.52079 8.87473C8.64579 8.7289 8.69788 8.61431 8.78121 8.44765C8.86454 8.27056 8.82288 8.12473 8.76038 7.99973C8.69788 7.87473 8.17704 6.6039 7.96871 6.08306C7.76038 5.58306 7.54163 5.64556 7.38538 5.63515H6.88538C6.70829 5.63515 6.43746 5.69765 6.19788 5.95806C5.96871 6.21848 5.30204 6.84348 5.30204 8.11431C5.30204 9.38515 6.22913 10.6143 6.35413 10.781C6.47913 10.9581 8.17704 13.5622 10.7604 14.6768C11.375 14.9476 11.8541 15.1039 12.2291 15.2185C12.8437 15.4164 13.4062 15.3851 13.8541 15.3226C14.3541 15.2497 15.3854 14.6976 15.5937 14.0935C15.8125 13.4893 15.8125 12.9789 15.7395 12.8643C15.6666 12.7497 15.5104 12.6976 15.25 12.5726Z"
      fill="#2CB742"
    />
  </svg>
);

export const GuarantorWhatsAppIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
    <path
      d="M17.8437 3.11431C16.8886 2.14984 15.751 1.38511 14.4974 0.864691C13.2437 0.344271 11.899 0.078567 10.5416 0.083064C4.85413 0.083064 0.218709 4.71848 0.218709 10.406C0.218709 12.2289 0.697876 13.9997 1.59371 15.5622L0.135376 20.9164L5.60413 19.4789C7.11454 20.3018 8.81246 20.7393 10.5416 20.7393C16.2291 20.7393 20.8645 16.1039 20.8645 10.4164C20.8645 7.65598 19.7916 5.06223 17.8437 3.11431ZM10.5416 18.9893C8.99996 18.9893 7.48954 18.5726 6.16663 17.7914L5.85413 17.6039L2.60413 18.4581L3.46871 15.2914L3.26038 14.9685C2.40365 13.6008 1.94884 12.0198 1.94788 10.406C1.94788 5.67681 5.80204 1.82265 10.5312 1.82265C12.8229 1.82265 14.9791 2.71848 16.5937 4.34348C17.3933 5.13917 18.027 6.08571 18.4579 7.1282C18.8888 8.17068 19.1085 9.28836 19.1041 10.4164C19.125 15.1456 15.2708 18.9893 10.5416 18.9893ZM15.25 12.5726C14.9895 12.4476 13.7187 11.8226 13.4895 11.7289C13.25 11.6456 13.0833 11.6039 12.9062 11.8539C12.7291 12.1143 12.2395 12.6976 12.0937 12.8643C11.9479 13.0414 11.7916 13.0622 11.5312 12.9268C11.2708 12.8018 10.4375 12.5206 9.45829 11.6456C8.68746 10.9581 8.17704 10.1143 8.02079 9.8539C7.87496 9.59348 7.99996 9.45806 8.13538 9.32265C8.24996 9.20806 8.39579 9.02056 8.52079 8.87473C8.64579 8.7289 8.69788 8.61431 8.78121 8.44765C8.86454 8.27056 8.82288 8.12473 8.76038 7.99973C8.69788 7.87473 8.17704 6.6039 7.96871 6.08306C7.76038 5.58306 7.54163 5.64556 7.38538 5.63515H6.88538C6.70829 5.63515 6.43746 5.69765 6.19788 5.95806C5.96871 6.21848 5.30204 6.84348 5.30204 8.11431C5.30204 9.38515 6.22913 10.6143 6.35413 10.781C6.47913 10.9581 8.17704 13.5622 10.7604 14.6768C11.375 14.9476 11.8541 15.1039 12.2291 15.2185C12.8437 15.4164 13.4062 15.3851 13.8541 15.3226C14.3541 15.2497 15.3854 14.6976 15.5937 14.0935C15.8125 13.4893 15.8125 12.9789 15.7395 12.8643C15.6666 12.7497 15.5104 12.6976 15.25 12.5726Z"
      fill="#F5A623"
    />
  </svg>
);

// Сервер отвергает запрос с pageSize больше сотни.
const MAX_PAGE_SIZE = 100;

const columnToApiSortMap: Record<number, string> = {
  0: "creditid",
  1: "clientname",
  2: "payment",
  3: "date",
};

const ScheduleTable = forwardRef<ScheduleTableHandle, ScheduleTableProps>(
  ({ isListMode, pageSize, shouldBeVisited }, ref) => {
  const { getList, updateSchedule, isLoading, error, scheduleData } =
    useSchedule();
  const { createPayment } = usePayment();
  const { GetFilledGuarantorSchedule } = useSender();

  // Фильтры переживают уход со страницы: при переключении разделов
  // набранное больше не сбрасывается. Ключи разведены по вкладке, потому что
  // «Ожидаемые» и «Посещённые» — это один компонент с разными наборами.
  const store = `schedule.${shouldBeVisited ? "visited" : "expected"}`;

  const [clientNameFilter, setClientNameFilter] = usePersistedState(
    `${store}.clientName`,
    ""
  );
  const [investorFilter, setInvestorFilter] = usePersistedState(
    `${store}.investor`,
    ""
  );
  const [selectedEntity, setSelectedEntity] =
    usePersistedState<SelectedEntity | null>(`${store}.entity`, null);
  const [dateFromFilter, setDateFromFilter] = usePersistedState(
    `${store}.dateFrom`,
    ""
  );
  const [dateToFilter, setDateToFilter] = usePersistedState(
    `${store}.dateTo`,
    ""
  );
  const [amountFromFilter, setAmountFromFilter] = usePersistedState(
    `${store}.amountFrom`,
    ""
  );
  const [amountToFilter, setAmountToFilter] = usePersistedState(
    `${store}.amountTo`,
    ""
  );
  const [tableObjectTypeName, setTableObjectTypeName] = usePersistedState(
    `${store}.objectTypeName`,
    ""
  );
  const [selectedTableObjectType, setSelectedTableObjectType] =
    usePersistedState<SelectedObjectType | null>(`${store}.objectType`, null);

  // Номер страницы переживает уход в другой раздел: человек долистал до
  // нужного платежа, отошёл свериться и вернулся — возвращать его в начало
  // выдачи незачем. Смена любого фильтра по-прежнему сбрасывает на первую.
  const [currentPage, setCurrentPage] = usePersistedState(
    `${store}.page`,
    1
  );
  // По умолчанию сортируем по дате платежа, от ближайшей: в графике это
  // первое, что ищут глазами. Ключ хранения сменён намеренно — у тех, кто
  // уже открывал страницу, лежит старое значение без сортировки, и без
  // смены ключа новый порядок к ним бы не применился.
  const [sortConfig, setSortConfig] = usePersistedState<{
    key: number | null;
    direction: "asc" | "desc";
  }>(`${store}.sort.v2`, { key: 3, direction: "asc" });

  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [accumulatedItems, setAccumulatedItems] = useState<ScheduleDetails[]>(
    []
  );
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const accumulatedItemsRef = useRef<ScheduleDetails[]>([]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] =
    useState<ScheduleDetails | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [selectedCalendarSchedule, setSelectedCalendarSchedule] =
    useState<ScheduleDetails | null>(null);
  const [scheduleComment, setScheduleComment] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isSavingScheduleComment, setIsSavingScheduleComment] = useState(false);

  const isFirstRender = useRef(true);

  // Сортировка фильтром не считается: сбрасывать порядок столбцов вместе с
  // отбором никто не ждёт.
  const hasActiveFilters = Boolean(
    clientNameFilter ||
      investorFilter ||
      selectedEntity ||
      tableObjectTypeName ||
      selectedTableObjectType ||
      dateFromFilter ||
      dateToFilter ||
      amountFromFilter ||
      amountToFilter
  );

  const resetPage = useCallback(() => {
    // Отбор изменился — прежнее место в списке потеряло смысл.
    forgetScroll(`${store}.list.scroll`);
    setCurrentPage(1);
    if (isListMode) {
      accumulatedItemsRef.current = [];
      setAccumulatedItems([]);
      setHasMore(true);
    }
  }, [isListMode, store]);

  const resetFilters = useCallback(() => {
    setClientNameFilter("");
    setInvestorFilter("");
    setSelectedEntity(null);
    setTableObjectTypeName("");
    setSelectedTableObjectType(null);
    setDateFromFilter("");
    setDateToFilter("");
    setAmountFromFilter("");
    setAmountToFilter("");
    resetPage();
  }, [
    setClientNameFilter,
    setInvestorFilter,
    setSelectedEntity,
    setTableObjectTypeName,
    setSelectedTableObjectType,
    setDateFromFilter,
    setDateToFilter,
    setAmountFromFilter,
    setAmountToFilter,
    resetPage,
  ]);


  // Сохранённая страница может оказаться за пределами выдачи: фильтр сузили,
  // платежи закрыли. Тогда человек увидел бы пустоту — возвращаем в начало.
  useEffect(() => {
    if (isListMode) return;
    const total = scheduleData?.totalCount ?? 0;
    if (!total) return;
    const pages = Math.ceil(total / pageSize);
    if (pages > 0 && currentPage > pages) setCurrentPage(1);
  }, [isListMode, scheduleData, pageSize, currentPage, setCurrentPage]);

  const displayedSchedules = isListMode
    ? accumulatedItems
    : scheduleData?.items ?? [];

  const scrollKey = `${store}.list.scroll`;
  useScrollMemory(scrollKey, isListMode);
  const restoredRef = useRef(false);

  const loadSchedules = useCallback(async () => {
    // Возврат в список: строк в памяти нет, а номер страницы восстановлен из
    // хранилища. Накопленное надо поднять целиком, иначе человек увидел бы
    // середину списка без всего, что над ней.
    const isRestoring =
      isListMode && currentPage > 1 && accumulatedItemsRef.current.length === 0;

    const params: ScheduleParams = {
      page: currentPage,
      pageSize: pageSize,
      clientName: clientNameFilter || undefined,
      dateFrom: dateFromFilter ? parseDateInput(dateFromFilter) : undefined,
      dateTo: dateToFilter ? parseDateInput(dateToFilter) : undefined,
      amountFrom: amountFromFilter ? Number(amountFromFilter) : undefined,
      amountTo: amountToFilter ? Number(amountToFilter) : undefined,
      creditTypeId: selectedTableObjectType?.id || undefined,
      schouldBeVisited: shouldBeVisited || undefined,
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

    if (isRestoring) {
      // Сервер не отдаёт больше сотни строк за раз, поэтому поднимаем
      // накопленное несколькими запросами подряд.
      const needed = pageSize * currentPage;
      const chunk = Math.min(MAX_PAGE_SIZE, Math.max(pageSize, 1));
      const collected: ScheduleDetails[] = [];
      let total = 0;

      for (let part = 1; collected.length < needed; part++) {
        const portion = await getList({ ...params, page: part, pageSize: chunk });
        if (!portion) break;

        const items = portion.items || [];
        collected.push(...items);
        total = portion.totalCount || 0;

        if (items.length < chunk) break;
      }

      const seenIds = new Set<number>();
      const restored = collected.filter((it) => {
        if (seenIds.has(it.id)) return false;
        seenIds.add(it.id);
        return true;
      });

      accumulatedItemsRef.current = restored;
      setAccumulatedItems(restored);
      setHasMore(restored.length < total && restored.length > 0);
      setIsLoadingMore(false);

      if (!restoredRef.current) {
        restoredRef.current = true;
        restoreScroll(scrollKey);
      }
      return;
    }

    const result = await getList(params);

    if (isListMode && result) {
      const items = result.items || [];
      const merged =
        currentPage === 1 ? items : [...accumulatedItemsRef.current, ...items];
      const seen = new Set<number>();
      const next = merged.filter((it) => {
        if (seen.has(it.id)) return false;
        seen.add(it.id);
        return true;
      });
      accumulatedItemsRef.current = next;
      setAccumulatedItems(next);
      setHasMore(next.length < (result.totalCount || 0) && items.length > 0);
    }
    setIsLoadingMore(false);
  }, [
    currentPage,
    clientNameFilter,
    dateFromFilter,
    dateToFilter,
    amountFromFilter,
    amountToFilter,
    selectedTableObjectType,
    sortConfig,
    selectedEntity,
    getList,
    pageSize,
    isListMode,
    shouldBeVisited,
  ]);

  const handleClientNameChange = useCallback(
    (value: string) => {
      setClientNameFilter(value);
      resetPage();
    },
    [resetPage]
  );

  const handleSetVisited = useCallback(
    async (schedule: ScheduleDetails, mode: VisitMode, schouldBe: boolean) => {
      setVisitError(null);
      try {
        await scheduleService.setVisited({
          currentId: schedule.id,
          creditId: schedule.creditId,
          mode,
          nearestCount: mode === 2 ? 3 : null,
          schouldBe,
        });
        loadSchedules();
      } catch {
        setVisitError("Не удалось отметить как выездной");
      }
    },
    [loadSchedules]
  );

  const handleInvestorChange = useCallback(
    (value: string) => {
      setInvestorFilter(value);
      resetPage();
    },
    [resetPage]
  );

  const handleEntitySelect = useCallback(
    (investor: {
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
      resetPage();
    },
    [resetPage]
  );

  const handleDateFromChange = useCallback(
    (value: string) => {
      setDateFromFilter(value);
      resetPage();
    },
    [resetPage]
  );

  const handleDateToChange = useCallback(
    (value: string) => {
      setDateToFilter(value);
      resetPage();
    },
    [resetPage]
  );

  const handleObjectTypeNameChange = useCallback(
    (value: string) => {
      setTableObjectTypeName(value);
      if (!value) setSelectedTableObjectType(null);
      resetPage();
    },
    [resetPage]
  );

  const handleObjectTypeSelect = useCallback(
    (type: SelectedObjectType) => {
      setSelectedTableObjectType(type);
      setTableObjectTypeName(type.name);
      resetPage();
    },
    [resetPage]
  );

  const handleSort = useCallback(
    (columnIndex: number) => {
      if (!columnToApiSortMap[columnIndex]) return;
      setSortConfig((prev) => ({
        key: columnIndex,
        direction:
          prev.key === columnIndex && prev.direction === "asc" ? "desc" : "asc",
      }));
      resetPage();
    },
    [resetPage]
  );

  useEffect(() => {
    if (!isListMode) return;
    const sentinel = loadMoreSentinelRef.current;
    if (
      !sentinel ||
      !hasMore ||
      isLoading ||
      isLoadingMore ||
      accumulatedItems.length === 0
    )
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true);
          setCurrentPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isListMode, hasMore, isLoading, isLoadingMore, accumulatedItems.length]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadSchedules();
      return;
    }
    loadSchedules();
  }, [loadSchedules]);

  useImperativeHandle(
    ref,
    () => ({
      getFilters: () => ({
        clientName: clientNameFilter || undefined,
        investorName: investorFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        amountFrom: amountFromFilter || undefined,
        amountTo: amountToFilter || undefined,
        objectTypeId: selectedTableObjectType?.id,
        entityId: selectedEntity?.id,
        entityType: selectedEntity?.type,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
        shouldBeVisited,
      }),
    }),
    [
      clientNameFilter,
      investorFilter,
      dateFromFilter,
      dateToFilter,
      amountFromFilter,
      amountToFilter,
      selectedTableObjectType,
      selectedEntity,
      sortConfig,
      shouldBeVisited,
    ]
  );

  const handleRowClick = useCallback(
    (_rowData: any[], rowIndex: number) => {
      setSelectedRow(rowIndex === selectedRow ? null : rowIndex);
    },
    [selectedRow]
  );

  const handleRowDoubleClick = useCallback(
    (rowData: any[]) => {
      const schedule = displayedSchedules.find(
        (s) =>
          s.creditId.toString() === rowData[0] && s.clientName === rowData[1]
      );
      if (schedule) {
        setViewingCreditId(schedule.creditId);
        setIsViewModalOpen(true);
      }
    },
    [displayedSchedules]
  );

  const handleOpenPaymentModal = useCallback(
    async (schedule: ScheduleDetails) => {
      try {
        const credit = await creditService.getCreditById(schedule.creditId);
        setSelectedCredit(credit);
        setSelectedScheduleForPayment(schedule);
        setIsPaymentModalOpen(true);
      } catch (error) {
        console.error("Ошибка при загрузке данных кредита:", error);
        alert("Не удалось загрузить данные кредита");
      }
    },
    []
  );

  const handleSavePayment = useCallback(
    async (paymentData: {
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
        await createPayment(paymentRequest);
        await loadSchedules();
        setIsPaymentModalOpen(false);
        setSelectedScheduleForPayment(null);
        setSelectedCredit(null);
      } catch (error) {
        console.error("Ошибка при сохранении платежа:", error);
        throw error;
      }
    },
    [selectedScheduleForPayment, createPayment, loadSchedules]
  );

  const openScheduleCommentModal = useCallback((schedule: ScheduleDetails) => {
    setIsViewModalOpen(false);
    setViewingCreditId(null);
    setSelectedCalendarSchedule(schedule);
    setScheduleComment(schedule.userComment || "");
    setScheduleDate(new Date(schedule.paymentDate).toISOString().split("T")[0]);
    setIsCommentModalOpen(true);
  }, []);

  const handleSaveScheduleComment = useCallback(
    async (e: React.FormEvent) => {
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
      await loadSchedules();
    },
    [
      selectedCalendarSchedule,
      scheduleDate,
      scheduleComment,
      updateSchedule,
      loadSchedules,
    ]
  );

  const handleWhatsAppClick = useCallback(
    async (schedule: ScheduleDetails) => {
      const success = await sendWhatsAppMessage(
        schedule.id,
        schedule.clientPhone
      );
      if (success) await loadSchedules();
    },
    [loadSchedules]
  );

  const handleGuarantorWhatsAppClick = useCallback(
    async (schedule: ScheduleDetails) => {
      if (!schedule.guarantorPhone) return;
      const message = await GetFilledGuarantorSchedule(schedule.id);
      if (!message) {
        alert("Не удалось получить сообщение для поручителя");
        return;
      }
      await sendCustomWhatsAppMessage(schedule.guarantorPhone, message);
    },
    [GetFilledGuarantorSchedule]
  );

  const getPaymentTab = useCallback(
    async (paymentId: number): Promise<PaymentTab | null> => {
      try {
        return await paymentService.getPaymentTab(paymentId);
      } catch (err) {
        console.error("Ошибка при получении данных для документа:", err);
        return null;
      }
    },
    []
  );

  const paymentConfirmationGenerator = useMemo(
    () => new PaymentConfirmationGenerator(getPaymentTab),
    [getPaymentTab]
  );

  const handlePrintReceipt = useCallback(
    async (paymentId: number) => {
      try {
        await paymentConfirmationGenerator.generatePaymentConfirmation(
          paymentId
        );
        console.log("Чек успешно сгенерирован");
      } catch (error) {
        console.error("Ошибка при печати чека:", error);
        alert("Платёж создан, но произошла ошибка при печати чека");
      }
    },
    [paymentConfirmationGenerator]
  );

  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewingCreditId(null);
  }, []);

  const { paymentColorRules } = useUiSettings();

  const tableData = useMemo(
    () =>
      displayedSchedules.map((schedule) => {
        const formattedAmount = formatMoney(
          String(schedule.paymentAmount ?? 0)
        );
        const formattedDate = formatDate(schedule.paymentDate);

        return [
          schedule.creditId.toString(),
          schedule.clientName,
          formattedAmount,
          formattedDate,
          schedule.userComment || "—",
          <NotifyCell>
            <IconButton
              onClick={() => handleWhatsAppClick(schedule)}
              title={
                schedule.notified
                  ? "Отправить повторно"
                  : "Отправить уведомление"
              }
            >
              {schedule.notified ? <CheckIcon /> : <WhatsAppIcon />}
            </IconButton>
            {schedule.guarantorPhone && (
              <IconButton
                onClick={() => handleGuarantorWhatsAppClick(schedule)}
                title="Отправить данные договора поручителю"
              >
                <GuarantorWhatsAppIcon />
              </IconButton>
            )}
          </NotifyCell>,
        ];
      }),
    [displayedSchedules, handleWhatsAppClick, handleGuarantorWhatsAppClick]
  );

  const rowStyles = useMemo(() => {
    const base = getRowStyles(displayedSchedules, selectedRow);
    if (paymentColorRules.length === 0) return base;

    // Раскраска по правилам из персональных настроек: чем ближе платёж, тем
    // заметнее строка. Поверх базовых стилей, но ниже выделения выбранной —
    // её getRowStyles ставит сам, и перебивать выбор цветом правила нельзя.
    const withColors: typeof base = { ...base };
    displayedSchedules.forEach((schedule, index) => {
      if (index === selectedRow) return;

      const color = colorForPaymentDate(
        schedule.paymentDate,
        paymentColorRules
      );
      if (color) {
        withColors[index] = { ...withColors[index], backgroundColor: color };
      }
    });

    return withColors;
  }, [displayedSchedules, selectedRow, paymentColorRules]);

  const findSchedule = useCallback(
    (rowData: any[]) =>
      displayedSchedules.find(
        (s) =>
          s.creditId.toString() === rowData[0] &&
          s.clientName === rowData[1] &&
          formatDate(s.paymentDate) === rowData[3]
      ),
    [displayedSchedules]
  );

  const tableActions = useCallback(
    (rowData: any[]) => {
      const schedule = findSchedule(rowData);
      const byIndex = displayedSchedules.find(
        (s) =>
          s.creditId.toString() === rowData[0] && s.clientName === rowData[1]
      );

      const visitActions = schedule?.shouldBeVisited
        ? [
            {
              label: "Убрать из выездных",
              action: () => handleSetVisited(schedule!, 0, false),
              color: "#EF4444",
              dividerBefore: true,
            },
          ]
        : [
            {
              label: "Выездной (текущий)",
              action: () => schedule && handleSetVisited(schedule, 0, true),
              color: "#F59E0B",
              dividerBefore: true,
            },
            {
              label: "Выездной (все по договору)",
              action: () => schedule && handleSetVisited(schedule, 3, true),
              color: "#F59E0B",
            },
            {
              label: "Выездной (ближайшие 3)",
              action: () => schedule && handleSetVisited(schedule, 2, true),
              color: "#F59E0B",
            },
            {
              label: "Выездной (все клиента)",
              action: () => schedule && handleSetVisited(schedule, 1, true),
              color: "#F59E0B",
            },
          ];

      return [
        {
          label: "Договор",
          action: () => {
            if (byIndex) {
              setViewingCreditId(byIndex.creditId);
              setIsViewModalOpen(true);
            }
          },
          color: "#007D88",
        },
        {
          label: "Добавить платёж",
          action: () => {
            if (byIndex) handleOpenPaymentModal(byIndex);
          },
          color: "#008b8b",
        },
        {
          label: "Дата/комментарий",
          action: (_rd: any[], rowIndex: number) => {
            const s = displayedSchedules[rowIndex];
            if (s) openScheduleCommentModal(s);
          },
          color: "#3B82F6",
        },
        ...visitActions,
      ];
    },
    [
      displayedSchedules,
      findSchedule,
      handleOpenPaymentModal,
      openScheduleCommentModal,
      handleSetVisited,
    ]
  );

  const totalAmount = useMemo(() => {
    return displayedSchedules.reduce(
      (sum, item) => sum + (item.paymentAmount || 0),
      0
    );
  }, [displayedSchedules]);

  const totalCount = isListMode
    ? accumulatedItems.length
    : scheduleData?.totalCount || 0;

  return (
    <>
      <FilterContainer>
        <FilterField>
          <FilterFieldItem>
            <InputWrapper>
              <CustomInput
                inputType="text"
                placeholder="Клиент"
                value={clientNameFilter}
                onChange={(e) => handleClientNameChange(e.target.value)}
              />
            </InputWrapper>
            <InputWrapper>
              <InvestorSelect
                placeholder="Инвестор или пул"
                value={investorFilter}
                onChange={handleInvestorChange}
                onInvestorSelect={handleEntitySelect}
                includePools={true}
              />
            </InputWrapper>
            <InputWrapper>
              <ObjectTypeSelect
                value={tableObjectTypeName}
                onChange={handleObjectTypeNameChange}
                onObjectTypeSelect={handleObjectTypeSelect}
                placeholder="Папка договора"
                entityType="credit"
              />
            </InputWrapper>
            <DateInputWrapper>
              <CustomCalendar
                prefix="От"
                value={dateFromFilter}
                onChange={handleDateFromChange}
              />
            </DateInputWrapper>
            <DateInputWrapper>
              <CustomCalendar
                prefix="До"
                value={dateToFilter}
                onChange={handleDateToChange}
              />
            </DateInputWrapper>
            <InputWrapper>
              <CustomInput
                inputType="ufloat"
                placeholder="Сумма от"
                value={amountFromFilter}
                onChange={(e) => {
                  setAmountFromFilter(e.target.value);
                  resetPage();
                }}
              />
            </InputWrapper>
            <InputWrapper>
              <CustomInput
                inputType="ufloat"
                placeholder="Сумма до"
                value={amountToFilter}
                onChange={(e) => {
                  setAmountToFilter(e.target.value);
                  resetPage();
                }}
              />
            </InputWrapper>
            <ResetWrapper>
              <DarkCyanButton
                type="button"
                style={{ margin: 0, height: 40, fontSize: 14 }}
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                Сброс по фильтрам
              </DarkCyanButton>
            </ResetWrapper>
          </FilterFieldItem>
        </FilterField>
      </FilterContainer>

      {!isLoading && !error && displayedSchedules.length > 0 && (
        <SummaryBlock>
          <SummaryLabel>Итоги:</SummaryLabel>
          <SummaryItem>
            Ожидается: <b>{totalCount}</b>
          </SummaryItem>
          <SummaryItem>
            Сумма ожидаемых платежей:{" "}
            <b>{formatMoney(totalAmount.toString())}</b>
          </SummaryItem>
        </SummaryBlock>
      )}

      {isLoading && (!isListMode || displayedSchedules.length === 0) && (
        <div>Загрузка...</div>
      )}
      {!isLoading &&
        !error &&
        displayedSchedules.length === 0 &&
        shouldBeVisited && <EmptyVisited>Нет выездных клиентов</EmptyVisited>}
      {error && <div>Ошибка: {error}</div>}
      {visitError && (
        <VisitErrorMessage onClick={() => setVisitError(null)}>
          {visitError}
        </VisitErrorMessage>
      )}

      {!error &&
        (!isLoading || (isListMode && displayedSchedules.length > 0)) && (
          <>
            <CustomTable
              columns={[
                { name: "Договор №", isSortable: true },
                { name: "ФИО", isSortable: true, align: "left" },
                { name: "Платёж", isSortable: true, align: "right" },
                { name: "Дата платежа", isSortable: true, align: "right" },
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
                <CountInfoTitle total={scheduleData?.totalCount || 0} />
                <Pagination
                  total={scheduleData?.totalCount || 0}
                  current={currentPage}
                  onChange={setCurrentPage}
                  itemsPerPage={pageSize}
                />
              </PaginationLayout>
            )}
          </>
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

      {isCommentModalOpen && selectedCalendarSchedule && (
        <BaseModal
          title="Редактирование платежа"
          onClose={() => setIsCommentModalOpen(false)}
          onCancel={() => setIsCommentModalOpen(false)}
          onSave={handleSaveScheduleComment}
          saveButtonText="Сохранить"
          isSubmitting={isSavingScheduleComment}
          width="720px"
        >
          <CommentForm>
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
          </CommentForm>
        </BaseModal>
      )}
    </>
  );
  }
);

ScheduleTable.displayName = "ScheduleTable";

const getRowStyles = (
  schedules: ScheduleDetails[],
  selectedRow: number | null
): Record<number, RowStyle> => {
  const styles: Record<number, RowStyle> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  schedules.forEach((schedule, index) => {
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

const FilterContainer = styled.div`
  margin-bottom: 20px;
`;

const FilterField = styled.div`
  width: 100%;
`;

const FilterFieldItem = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  flex-wrap: wrap;
`;

const InputWrapper = styled.div`
  flex: 1;
  min-width: 200px;
`;

const DateInputWrapper = styled.div`
  flex: 1;
  min-width: 180px;
`;

const ResetWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

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

const CommentForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px;
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

const SummaryBlock = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
  padding: 12px 16px;
  margin: 0 0 20px 0;
  background: rgba(249, 250, 250, 1);
  border: 1px solid rgba(229, 231, 235, 1);
  border-radius: 8px;
  color: rgba(80, 85, 92, 1);
  font-size: 14px;
`;

const SummaryLabel = styled.span`
  font-weight: 600;
  color: rgba(0, 125, 136, 1);
`;

const SummaryItem = styled.span`
  b {
    color: #000;
  }
`;

const EmptyVisited = styled.div`
  padding: 48px 32px;
  text-align: center;
  color: #6b7280;
  font-size: 15px;
`;

const VisitErrorMessage = styled.div`
  background-color: #fee2e2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #fecaca;
  cursor: pointer;
  font-size: 14px;
`;

export default ScheduleTable;

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ListFilter } from "lucide-react";
import { getCollapseFiltersOnClickSetting } from "../components/modal/SettingsModal";
import CustomInput from "../components/ui/fields/CustomInput";
import CustomTable, {
  type RowStyle,
} from "../components/ui/tables/CustomTable";
import CreditCardList from "../components/ui/cards/CreditCardList";
import type { CreditCardField } from "../components/ui/cards/CreditCard";
import Pagination from "../components/ui/fields/CustomPagination";
import PageLayout from "../components/ui/Layouts/PageLayout";
import styled from "styled-components";
import Tabs from "../components/ui/fields/Tabs";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import { useNavigate, useParams } from "react-router-dom";
import useCredit from "../api/hooks/useCredit";
import {
  InvestmentSourceType,
  type Credit,
  type SetInvestmentSourceRequest,
} from "../api/types/credit";
import useExport from "../api/hooks/useExport";
import ExportButton from "../components/ui/Buttons/ExportButton";
import creditService from "../api/services/creditService";
import { formatDate } from "../utils/dateFormatter";
import NewPaymentModal from "../components/modal/NewPaymentModal";
import ViewCreditModal from "../components/modal/ViewCreditModal";
import { formatMoney } from "../utils/formatPrice";
import usePayment from "../api/hooks/usePayment";
import CustomCalendar from "../components/ui/fields/CustomCalendar";
import { useAuth } from "../сontext/AuthContext";
import PrintOptionModal from "../components/modal/PrintOptionModal";
import ClientLinkModal from "../components/modal/ClientLinkModal";
import DocxGenerator from "../utils/doxcUtils/docxGenerator";
import InvestorSelect from "../components/ui/fields/InvestorSelect";
import ObjectTypeSelect from "../components/ui/fields/ObjectTypeSelect";
import PaymentConfirmationGenerator from "../utils/doxcUtils/paymentConfirmationGenerator";
import paymentService from "../api/services/paymentService";
import { extractErrorMessage } from "../api/utils/errorMessage";
import type { PaymentTab } from "../api/types/payment";
import InvestorSelectModal from "../components/modal/CrudInherited/InvestorSelectModal";
import AddButton from "../components/ui/Buttons/AddButton";
import type {
  ObjectType,
  ObjectTypeCreateRequest,
  ObjectTypeUpdateRequest,
} from "../api/types/objectType";
import useObjectTypes from "../api/hooks/useObjectType";
import CreateObjectTypeModal from "../components/modal/CrudInherited/CreateObjectTypeModal";
import EditButton from "../components/ui/Buttons/EditButton";
import DeleteButton from "../components/ui/Buttons/DeleteButton";
import EditObjectTypeModal from "../components/modal/CrudInherited/EditObjectTypeModal";
import type { ContextMenuItem } from "../components/modal/ContextMenu";
import {
  createWhatsAppMessageWithoutPhone,
  sendWhatsAppMessageToPhone,
} from "../utils/sendWhatsAppMessage";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import { useResponsivePageSize } from "../utils/useResponsivePageSize";
import { useUiSettings } from "../utils/uiSettings";
import usePersistedState from "../hooks/usePersistedState";
import {
  useScrollMemory,
  restoreScroll,
  forgetScroll,
} from "../utils/listPosition";
import useSender from "../api/hooks/useSender";
import { useTopMenuActions } from "../сontext/TopMenuActionsContext";

type ShareOption = "contractData" | "paymentHistory" | "paymentSchedule";

interface ShareOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: ShareOption) => void;
  selectedCredit?: Credit | null;
  modalTitle?: string;
}

// Компонент модалки "Поделиться"
const ShareOptionModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedCredit,
  modalTitle = "Поделиться",
}: ShareOptionModalProps) => {
  const options = [
    {
      key: "contractData",
      label: "Данными договора",
      enabled: !!selectedCredit,
    },
    {
      key: "paymentHistory",
      label: "Историей платежей",
      enabled: !!selectedCredit,
    },
    // { key: 'paymentSchedule', label: 'Расписанием платежей', enabled: !!selectedCredit }
  ];

  const handleSelect = (optionKey: ShareOption) => {
    if (selectedCredit) {
      onSelect(optionKey);
    } else {
      console.error("No credit selected for sharing");
      onClose();
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{modalTitle}</ModalTitle>
        <PrintOptions>
          {options.map(
            (option) =>
              option.enabled !== false && (
                <PrintOption
                  key={option.key}
                  onClick={() => handleSelect(option.key as any)}
                  disabled={!option.enabled}
                >
                  {option.label}
                </PrintOption>
              )
          )}
        </PrintOptions>
      </ModalContent>
    </ModalOverlay>
  );
};

interface EmptyStarIconProps {
  isSelected?: boolean;
}

// Ключи должны совпадать с кейсами CreditSortingExtensions.ApplySorting на
// бэке — сортировка серверная, произвольную строку он молча проигнорирует и
// отдаст порядок по умолчанию (id по убыванию).
const SORT_OPTIONS: { key: string | null; label: string }[] = [
  { key: null, label: "По умолчанию" },
  { key: "debt", label: "Сумма просрочки" },
  { key: "overdue_days", label: "Дни просрочки" },
  { key: "upcoming", label: "Приближающийся платёж" },
  { key: "amount", label: "Сумма договора" },
  { key: "rest", label: "Остаток" },
  { key: "payed", label: "Уплачено" },
  { key: "date", label: "Дата договора" },
  { key: "client", label: "ФИО клиента" },
];

const CreditPage = () => {
  const colors = {
    primary: "#007D88",
  };
  // Сервер отвергает запрос с pageSize больше сотни.
  const MAX_PAGE_SIZE = 100;
  const FILTERS_STORAGE_KEY = "creditsFilters";
  const { id, tab } = useParams<{ id?: string; tab?: string }>();
  const savedFilters = useMemo(() => {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Ошибка чтения фильтров договоров из localStorage:", error);
      return null;
    }
  }, []);

  const initialTab = useMemo(() => {
    if (tab) {
      return tab;
    }

    if (location.pathname === "/credits/in-debt") {
      return "inDebt";
    }

    return typeof savedFilters?.activeTab === "string"
      ? savedFilters.activeTab
      : "all";
  }, [tab, savedFilters]);

  const uiSettings = useUiSettings();
  const isListMode = uiSettings.creditsDisplayMode === "list";
  const { setRightAction } = useTopMenuActions();
  const [accumulatedItems, setAccumulatedItems] = useState<Credit[]>([]);
  const accumulatedItemsRef = useRef<Credit[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const [contractNumber, setContractNumber] = useState(
    () => savedFilters?.contractNumber ?? ""
  );
  // Номер страницы переживает уход в другой раздел: человек долистал до
  // нужного платежа, отошёл свериться и вернулся — возвращать его в начало
  // выдачи незачем. Смена любого фильтра по-прежнему сбрасывает на первую.
  const [currentPage, setCurrentPage] = usePersistedState(
    "creditsFilters.page",
    1
  );
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
  const [objectType, setObjectType] = useState<string>(
    () => savedFilters?.objectType ?? ""
  );
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [creditTypeId, setCreditTypeId] = useState<number | null>(() =>
    typeof savedFilters?.creditTypeId === "number"
      ? savedFilters.creditTypeId
      : null
  );
  const [clientAddress, setClientAddress] = useState<string>(
    () => savedFilters?.clientAddress ?? ""
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "desc" });
  const [filters, setFilters] = useState<{
    isFavourite?: boolean;
    isActive?: boolean;
    myCredits?: boolean;
    debt?: boolean;
    inDebt?: boolean;
    Terminated?: boolean;
    objectTypeId?: number;
  }>(() => savedFilters?.filters ?? {});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCreditId, setViewingCreditId] = useState<number | null>(null);
  const { createPayment, generatePaymentHistoryMessage } = usePayment();
  const { GetFilledPayments, GetFilledCredit, GetFilledCredits } = useSender();
  const [isCreateTabModalOpen, setIsCreateTabModalOpen] = useState(false);
  const [isEditTabModalOpen, setIsEditTabModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<ObjectType | null>(null);
  const [customTabs, setCustomTabs] = useState<ObjectType[]>([]);
  // Папки-категории (entityType "credit") — те же, что в фильтре «Папка».
  // Нужны, чтобы переносить договор не только в кастомные вкладки.
  const [creditFolders, setCreditFolders] = useState<ObjectType[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isPageSizeReady, setIsPageSizeReady] = useState(false);
  const { pageSize: responsivePageSize, containerRef } = useResponsivePageSize({
    defaultPageSize: 6,
    minPageSize: 5,
    maxPageSize: 50,
    rowHeight: 130,
    headerHeight: 300,
    paginationHeight: 60,
  });
  const pageSizeRef = useRef(responsivePageSize);
  // В постраничном режиме показываем ровно столько договоров, сколько помещается
  // на экран, чтобы листать страницами без прокрутки. В режиме ленты грузим
  // более крупными пачками, чтобы бесконечный скролл не дёргался.
  const itemsPerPage = isListMode
    ? Math.max(responsivePageSize, 20)
    : responsivePageSize;
  const { authInfo, hasPermission, hasRole, denyPermission, forbiddenRole } =
    useAuth();
  const isPoolV2 = authInfo?.employee?.poolV2 ?? false;
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  // Новое состояние для модалки "Поделиться"
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isClientLinkModalOpen, setIsClientLinkModalOpen] = useState(false);
  // Состояние панели фильтров. Если авто-сворачивание ВЫКЛ — фильтр всегда
  // открыт. Если ВКЛ — восстанавливаем сохранённое состояние (по умолчанию
  // свёрнут), чтобы он сворачивался, когда не используется.
  const FILTER_OPEN_STORAGE_KEY = "creditsFilterOpen";
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(() => {
    if (!getCollapseFiltersOnClickSetting()) return true;
    return localStorage.getItem(FILTER_OPEN_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(FILTER_OPEN_STORAGE_KEY, String(isFilterModalOpen));
  }, [isFilterModalOpen]);
  const { exportData, isExporting, exportProgress } = useExport<Credit>();
  const {
    isLoading,
    error,
    data: creditsData,
    getCredits,
    toggleFavourite,
    toggleTerminated,
    getDocsData,
    setInvestmentSource,
    acceptCredit,
    acceptCredits,
  } = useCredit();

  // Сохранённая страница может оказаться за пределами выдачи: фильтр сузили,
  // платежи закрыли. Тогда человек увидел бы пустоту — возвращаем в начало.
  useEffect(() => {
    if (isListMode) return;
    const total = creditsData?.totalCount ?? 0;
    if (!total) return;
    const pages = Math.ceil(total / itemsPerPage);
    if (pages > 0 && currentPage > pages) setCurrentPage(1);
  }, [isListMode, creditsData, itemsPerPage, currentPage, setCurrentPage]);

  const rawCredits = isListMode ? accumulatedItems : creditsData?.items ?? [];
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedCreditForPrint, setSelectedCreditForPrint] =
    useState<Credit | null>(null);
  const [isInvestorSelectModalOpen, setIsInvestorSelectModalOpen] =
    useState(false);
  // Пачка договоров, для которых сейчас выбирается источник финансирования.
  // Одиночный перенос — частный случай со списком из одного элемента.
  const [creditsForFunding, setCreditsForFunding] = useState<Credit[]>([]);
  const {
    isLoading: isObjectTypesLoading,
    objectTypes,
    create: createObjectType,
    update: updateObjectType,
    deleteObjectType: deleteObjectTypeApi,
    getAll: getAllObjectTypes,
  } = useObjectTypes();

  useEffect(() => {
    pageSizeRef.current = responsivePageSize;
    setIsPageSizeReady(true);
  }, [responsivePageSize]);

  const shouldShowMyCreditsTab =
    hasRole("директор") ||
    hasRole("суперадмин") ||
    hasPermission("VIEW_ALL_CREDITS", true);

  useEffect(() => {
    loadCustomTabs();
    loadCreditFolders();
  }, []);

  const handleMultiSelectChange = useCallback((selectedIndices: number[]) => {
    setSelectedRows(selectedIndices);
  }, []);

  // Функция для массовой печати
  const handleMassPrint = async (selectedIndices: number[]) => {
    try {
      const docxGenerator = new DocxGenerator(getDocsData);

      for (const rowIndex of selectedIndices) {
        const credit = displayedCredits[rowIndex];
        if (credit) {
          // Генерируем стандартный договор для каждого выбранного кредита
          await docxGenerator.generateFromCreditData(credit.id);
        }
      }

      alert(`Сгенерировано документов: ${selectedIndices.length}`);
    } catch (error) {
      console.error("Ошибка при массовой печати:", error);
      alert("Произошла ошибка при печати некоторых документов");
    }
  };

  const handleMassShare = async (selectedIndices: number[]) => {
    try {
      const creditIds = selectedIndices
        .map((rowIndex) => displayedCredits[rowIndex]?.id)
        .filter((id): id is number => typeof id === "number");

      if (creditIds.length === 0) {
        alert("Не удалось определить выбранные договоры");
        return;
      }

      const message = await GetFilledCredits(creditIds);
      if (!message) {
        alert("Не удалось получить сообщение для отправки");
        return;
      }

      const whatsappUrl = createWhatsAppMessageWithoutPhone(message);
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Ошибка при массовой рассылке:", error);
      alert("Произошла ошибка при подготовке сообщения");
    }
  };

  const generateShareMessage = useCallback(
    async (option: ShareOption): Promise<string> => {
      if (!selectedCreditForPrint) return "";

      const credit = selectedCreditForPrint;
      switch (option) {
        case "contractData":
          return (await GetFilledCredit(credit.id)) || "";

        case "paymentHistory":
          return (await GetFilledPayments(credit.id)) || "";

        case "paymentSchedule":
          return await generatePaymentHistoryMessage(credit);

        default:
          return "";
      }
    },
    [
      selectedCreditForPrint,
      GetFilledCredit,
      GetFilledPayments,
      generatePaymentHistoryMessage,
    ]
  );

  const handleShareOptionSelect = useCallback(
    async (option: ShareOption, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!selectedCreditForPrint) {
        alert("Договор не выбран");
        setIsShareModalOpen(false);
        return;
      }

      const clientPhone = selectedCreditForPrint.clientPhone;

      if (!clientPhone) {
        alert("У клиента не указан номер телефона");
        setIsShareModalOpen(false);
        return;
      }

      const message = await generateShareMessage(option);
      if (message) {
        const success = sendWhatsAppMessageToPhone(clientPhone, message);

        if (success) {
          console.log(`Сообщение отправлено на номер: ${clientPhone}`);
        } else {
          alert("Не удалось открыть WhatsApp. Проверьте номер телефона.");
        }
      } else {
        alert("Не удалось получить сообщение для отправки");
      }
      setIsShareModalOpen(false);
    },
    [generateShareMessage, selectedCreditForPrint]
  );

  // Универсальное подменю переноса: категории используют set-category,
  // папки используют set-credit-type.
  const getMoveMenuItems = (
    creditId: number,
    onDone: () => void,
    targets: ObjectType[],
    emptyHint: string,
    setTarget: (creditId: number, objectTypeId: number | null) => Promise<void>
  ): ContextMenuItem[] => {
    const handleSet = async (objectTypeId: number | null) => {
      try {
        await setTarget(creditId, objectTypeId);
        onDone();
      } catch (error) {
        console.error("Ошибка при переносе договора:", error);
        alert(extractErrorMessage(error, "Произошла ошибка при переносе договора"));
      }
    };

    if (targets.length === 0) {
      return [{ label: emptyHint, color: "#999", disabled: true }];
    }

    return [
      { label: "Убрать", action: () => handleSet(null), color: "#666" },
      ...targets.map((t) => ({
        label: t.name,
        action: () => handleSet(t.id),
        color: "#007d88",
      })),
    ];
  };

  const loadCustomTabs = useCallback(async () => {
    const result = await getAllObjectTypes({
      entityType: "creditTab",
    });
    if (result) {
      setCustomTabs(result.items);
    }
  }, [getAllObjectTypes]);

  const loadCreditFolders = useCallback(async () => {
    const result = await getAllObjectTypes({
      entityType: "credit",
      pageSize: 100,
    });
    if (result) {
      setCreditFolders(
        result.items.filter(
          (item) => item.name.trim().toLocaleLowerCase("ru-RU") !== "в долг"
        )
      );
    }
  }, [getAllObjectTypes]);

  const getTabs = useCallback(() => {
    const baseTabs = [
      { id: "all", label: "Все" },
      ...(shouldShowMyCreditsTab ? [{ id: "my", label: "Свои" }] : []),
      { id: "favourite", label: "Избранные" },
      { id: "debtors", label: "Просрочка" },
      { id: "inDebt", label: "В долг" },
      { id: "archive", label: "В архиве" },
      { id: "terminated", label: "Расторгнутые" },
    ];

    const customTabItems = customTabs.map((tab) => ({
      id: `tab-${tab.id}`,
      label: (
        <TabLabel>
          {tab.name}
          <TabActions>
            <EditButton
              onClick={(e) => {
                e.stopPropagation();
                setEditingTab(tab);
                setIsEditTabModalOpen(true);
              }}
              size={25}
            />
            <DeleteButton
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Удалить вкладку "${tab.name}"?`)) {
                  handleDeleteTab(tab.id);
                }
              }}
              size={25}
            />
          </TabActions>
        </TabLabel>
      ),
      objectTypeId: tab.id,
    }));

    return [...baseTabs, ...customTabItems];
  }, [shouldShowMyCreditsTab, customTabs]);

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Набор договоров по каждой вкладке (в т.ч. «Расторгнутые») формирует бэкенд
  // по параметрам запроса. Клиентскую дофильтрацию убрали: иначе список и итоги
  // могли расходиться с тем, что реально вернул бэк (и приводить к
  // неожиданным последствиям).
  const displayedCredits = rawCredits;

  const handleCreateTab = useCallback(
    async (tabData: ObjectTypeCreateRequest) => {
      if (customTabs.length >= 5) {
        alert("Максимальное количество вкладок - 5");
        return false;
      }

      try {
        const result = await createObjectType(tabData);
        if (result) {
          await loadCustomTabs();
          setIsCreateTabModalOpen(false);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Ошибка при создании вкладки:", error);
        return false;
      }
    },
    [createObjectType, customTabs.length, loadCustomTabs]
  );

  const handleEditTab = useCallback(
    async (updateData: ObjectTypeUpdateRequest) => {
      if (!editingTab) return false;

      try {
        const result = await updateObjectType(editingTab.id, updateData);
        if (result) {
          await loadCustomTabs();
          setIsEditTabModalOpen(false);
          setEditingTab(null);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Ошибка при редактировании вкладки:", error);
        return false;
      }
    },
    [editingTab, updateObjectType, loadCustomTabs]
  );

  const handleDeleteTab = useCallback(
    async (tabId: number) => {
      try {
        await deleteObjectTypeApi(tabId);
        await loadCustomTabs();

        if (activeTab === `tab-${tabId}`) {
          setActiveTab("all");
        }

        alert("Вкладка успешно удалена");
      } catch (error) {
        console.error("Ошибка при удалении вкладки:", error);
        alert("Произошла ошибка при удалении вкладки");
      }
    },
    [deleteObjectTypeApi, loadCustomTabs, activeTab]
  );

  useEffect(() => {
    if (id) {
      const creditId = parseInt(id);
      if (!isNaN(creditId)) {
        setViewingCreditId(creditId);
        setIsViewModalOpen(true);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!isViewModalOpen && id) {
      navigate("/credits", { replace: true });
    }
  }, [isViewModalOpen, id, navigate]);

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingCreditId(null);
  };

  const setFundingSourceForBatch = async (
    batch: Credit[],
    sourceRequest: SetInvestmentSourceRequest,
    availableBalance?: number
  ) => {
    if (batch.length === 0) return;

    // Бэк умеет только по одному договору за запрос и коммитит каждый отдельно,
    // общей транзакции на пачку нет. Поэтому сначала прикидываем, хватит ли
    // кассы на всё сразу: иначе на середине пачки прилетит «Недостаточно
    // средств», а предыдущие договоры уже перенесены и касса списана без
    // отката. Проверка предварительная — решающее слово всё равно за бэком,
    // он считает остаток заново на каждом договоре.
    const required = batch.reduce(
      (sum, credit) => sum + (credit.totalClean - credit.firstPayment),
      0
    );
    if (typeof availableBalance === "number" && required > availableBalance) {
      alert(
        "Недостаточно средств в кассе.\n" +
          `Нужно: ${formatMoney(required.toString())}\n` +
          `Доступно: ${formatMoney(availableBalance.toString())}`
      );
      return;
    }

    const failures: string[] = [];
    let transferred = 0;

    // Строго последовательно: параллельные запросы гонялись бы за одну и ту же
    // кассу, и проверка остатка на бэке перестала бы быть достоверной.
    for (const credit of batch) {
      try {
        await setInvestmentSource(credit.id, sourceRequest);
        transferred += 1;
      } catch (err) {
        console.error(
          `Ошибка при установке источника финансирования (договор ${credit.id}):`,
          err
        );
        failures.push(
          `№${credit.id} ${credit.clientFullName ?? ""}: ${extractErrorMessage(
            err,
            "не удалось перенести"
          )}`
        );
      }
    }

    await loadCredits();
    setCreditsForFunding([]);
    setSelectedRows([]);

    if (failures.length === 0) {
      alert(
        batch.length === 1
          ? "Источник финансирования успешно установлен"
          : `Перенесено договоров: ${transferred}`
      );
      return;
    }

    // Отката нет: успешные договоры уже закоммичены на бэке. Перечисляем, что
    // именно не прошло, чтобы это можно было доделать руками.
    alert(
      `Перенесено ${transferred} из ${batch.length}.\n\n` +
        `Не удалось:\n${failures.join("\n")}`
    );
  };

  // Как и остальные массовые действия на странице: отмечено больше одного
  // договора — работаем по всем отмеченным, иначе по строке, откуда позвали.
  const handleSelectFundingSource = async (rowData: any[]) => {
    const getSelectedFundingCredits = () => {
      if (selectedRows.length > 1) {
        return selectedRows
          .map((index) => displayedCredits[index])
          .filter((credit): credit is Credit => Boolean(credit));
      }

      const [_, id] = rowData;
      const credit = displayedCredits.find((c) => c.id === Number(id));
      return credit ? [credit] : [];
    };

    const batch = getSelectedFundingCredits();
    if (batch.length === 0) return;

    if (isPoolV2) {
      await setFundingSourceForBatch(batch, {
        sourceType: InvestmentSourceType.None,
        entityId: null,
      });
      return;
    }

    if (selectedRows.length > 1) {
      setCreditsForFunding(batch);
      setIsInvestorSelectModalOpen(true);
      return;
    }

    setCreditsForFunding(batch);
    setIsInvestorSelectModalOpen(true);
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
      objectType,
      creditTypeId,
      clientAddress,
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
    objectType,
    creditTypeId,
    clientAddress,
    activeTab,
    filters,
  ]);

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
    if (objectType) count++;
    if (clientAddress) count++;

    // Исключаем фильтры от вкладок из подсчета
    const filterKeys = Object.keys(filters);
    if (filterKeys.length > 0) {
      // Проверяем, что это не фильтры от вкладок
      const hasNonTabFilters = filterKeys.some(
        (key) =>
          ![
            "isFavourite",
            "myCredits",
            "debt",
            "inDebt",
            "isActive",
            "Terminated",
            "objectTypeId",
          ].includes(key) ||
          (key === "objectTypeId" && !activeTab.startsWith("tab-"))
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
    objectType,
    creditTypeId,
    clientAddress,
    filters,
    activeTab,
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
          objectType ||
          clientAddress ||
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
              "Terminated",
              "objectTypeId",
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
    objectType,
    creditTypeId,
    clientAddress,
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
    setObjectType("");
    setCreditTypeId(null);
    setClientAddress("");

    // Сохраняем только фильтры от текущей вкладки
    let newFilters = {};
    if (activeTab.startsWith("tab-")) {
      const objectTypeId = parseInt(activeTab.replace("tab-", ""));
      newFilters = { objectTypeId };
    } else {
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
        case "terminated":
          newFilters = { Terminated: true };
          break;
        default:
          newFilters = {};
          break;
      }
    }

    setFilters(newFilters);
    setSortConfig({ key: null, direction: "desc" });
    setCurrentPage(1);
    setSelectedRows([]);

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
      objectType: "",
      creditTypeId: null,
      activeTab,
      filters: newFilters,
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [activeTab]);

  const handleAccept = async (rowData: any[]) => {
    const [_, id] = rowData;
    const credit = displayedCredits.find((c) => c.id === Number(id));
    if (credit) {
      try {
        await acceptCredit(credit.id);
        await loadCredits();
      } catch (error) {
        console.error("Ошибка при подтверждении договора:", error);
      }
    }
  };

  const handleFundingSourceSubmit = async (entity: {
    id: number;
    type: "investor" | "pool";
    balance?: number;
  }) => {
    // Модалка закрывает себя сама сразу после onSubmit, поэтому список берём
    // из замыкания — сброс состояния ниже на него уже не влияет.
    const batch = creditsForFunding;
    if (batch.length === 0) return;

    const sourceRequest: SetInvestmentSourceRequest = {
      sourceType:
        entity.type === "investor"
          ? InvestmentSourceType.Investor
          : InvestmentSourceType.InvestorPool,
      entityId: entity.id,
    };

    await setFundingSourceForBatch(batch, sourceRequest, entity.balance);
  };

  const handleMoveToDebt = async (rowData: any[]) => {
    const [_, id] = rowData;
    const creditId = Number(id);

    if (!Number.isFinite(creditId)) {
      alert("Не удалось определить договор");
      return;
    }

    try {
      await setInvestmentSource(creditId, {
        sourceType: InvestmentSourceType.InDebt,
        entityId: 0,
      });
      await loadCredits();
    } catch (error) {
      console.error("Ошибка при переносе договора в долг:", error);
      alert(extractErrorMessage(error, "Произошла ошибка при переносе договора в долг"));
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

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    const [_, id] = rowData;
    const credit = displayedCredits.find((c) => c.id === Number(id));
    if (credit) {
      // Для обратной совместимости устанавливаем selectedCreditForPrint
      setSelectedCreditForPrint(credit);
    }
  };

  const handleEditCredit = (rowData: any[]) => {
    const [_, id] = rowData;
    navigate(`/new-credit/${id}`);
  };

  const handlePrintOptionSelect = async (
    option: "sale" | "saleSinglePage" | "schedules" | "guaranteeConsent"
  ) => {
    if (!selectedCreditForPrint) return;

    const docxGenerator = new DocxGenerator(getDocsData);

    if (option === "sale") {
      await docxGenerator.generateFromCreditData(selectedCreditForPrint.id);
    } else if (option === "saleSinglePage") {
      await docxGenerator.generateFromCreditData(
        selectedCreditForPrint.id,
        "/Docs/salesContractSinglePage.docx"
      );
    } else if (option === "schedules") {
      await docxGenerator.generateFromCreditData(
        selectedCreditForPrint.id,
        "/Docs/schedules.docx"
      );
    } else if (option === "guaranteeConsent") {
      await docxGenerator.generateFromCreditData(
        selectedCreditForPrint.id,
        "/Docs/guaranteeandConsentAgreement.docx"
      );
    }

    setIsPrintModalOpen(false);
  };

  const handlePrintReceipt = async (paymentId: number) => {
    try {
      console.log("ПОЧАЛОСЬ");
      await paymentConfirmationGenerator.generatePaymentConfirmation(paymentId);
      console.log("Чек успешно сгенерирован");
    } catch (error) {
      console.error("Ошибка при печати чека:", error);
      alert("Платёж создан, но произошла ошибка при печати чека");
    }
  };

  const includeAllStates = useMemo(() => {
    const excludedTabs = [
      "favourite",
      "archive",
      "debtors",
      "inDebt",
      "terminated",
    ];
    if (excludedTabs.includes(activeTab)) {
      return false;
    }

    return (
      contractNumber.trim() !== "" ||
      clientFullName.trim() !== "" ||
      investorName.trim() !== "" ||
      (creditTypeId !== null &&
        creditTypeId !== undefined &&
        creditTypeId !== 0)
    );
  }, [
    contractNumber,
    clientFullName,
    investorName,
    objectType,
    selectedInvestmentSource,
    creditTypeId,
  ]);

  const SCROLL_KEY = "creditsFilters.list.scroll";
  // Сброс накопленного списка срабатывает и при открытии страницы, где
  // ничего не менялось. Первый прогон пропускаем, иначе он затирал бы
  // восстановленное место.
  const filtersSettledRef = useRef(false);
  useScrollMemory(SCROLL_KEY, isListMode);
  const restoredRef = useRef(false);

  const loadCredits = useCallback(async () => {
    if (!isPageSizeReady) return;
    // Отменяем предыдущий запрос, если он есть
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаем новый AbortController и захватываем его локально
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    const shouldInclude = includeAllStates;

    // Возврат в список: строк в памяти нет, а номер страницы восстановлен из
    // хранилища. Накопленное надо поднять целиком, иначе человек увидел бы
    // середину списка без всего, что над ней.
    const isRestoring =
      isListMode && currentPage > 1 && accumulatedItemsRef.current.length === 0;

    const params = {
      page: currentPage,
      pageSize: itemsPerPage,
      name: contractNumber || undefined,
      clientFullname: clientFullName || undefined,
      includeAllStates: shouldInclude ? true : undefined,
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
      CreatedAt: fromCreationDate ? new Date(fromCreationDate) : undefined,
      CreatedTo: toCreationDate ? new Date(toCreationDate) : undefined,
      creditTypeId: creditTypeId || undefined,
      clientAddress: clientAddress || undefined,
      sortBy: sortConfig.key ?? undefined,
      sortDirection: sortConfig.direction,
      ...filters,
    };

    if (isRestoring) {
      // Сервер не отдаёт больше сотни строк за раз, поэтому поднимаем
      // накопленное несколькими запросами подряд.
      const needed = itemsPerPage * currentPage;
      const chunk = Math.min(MAX_PAGE_SIZE, Math.max(itemsPerPage, 1));
      const collected: Credit[] = [];
      let total = 0;

      for (let part = 1; collected.length < needed; part++) {
        const portion = await getCredits(
          { ...params, page: part, pageSize: chunk },
          signal
        );
        if (!portion || signal.aborted) break;

        const items = portion.items || [];
        collected.push(...items);
        total = portion.totalCount || 0;

        if (items.length < chunk) break;
      }

      if (!signal.aborted) {
        const seenIds = new Set<number>();
        const restored = collected.filter((c) => {
          if (seenIds.has(c.id)) return false;
          seenIds.add(c.id);
          return true;
        });

        accumulatedItemsRef.current = restored;
        setAccumulatedItems(restored);
        setHasMore(restored.length < total && restored.length > 0);
        setIsLoadingMore(false);

        if (!restoredRef.current) {
          restoredRef.current = true;
          restoreScroll(SCROLL_KEY);
        }
      }
      return;
    }

    const result = await getCredits(params, signal);

    if (isListMode && result && !signal.aborted) {
      const items = result.items || [];
      const existingIds = new Set(accumulatedItemsRef.current.map((c) => c.id));
      const next =
        currentPage === 1
          ? items
          : [
              ...accumulatedItemsRef.current,
              ...items.filter((c) => !existingIds.has(c.id)),
            ];
      accumulatedItemsRef.current = next;
      setAccumulatedItems(next);
      setHasMore(next.length < (result.totalCount || 0) && items.length > 0);
    }
    if (!signal.aborted) {
      setIsLoadingMore(false);
    }
  }, [
    currentPage,
    includeAllStates,
    clientFullName,
    investorName,
    isPageSizeReady,
    fromDate,
    toDate,
    toCreationDate,
    fromCreationDate,
    creditTypeId,
    clientAddress,
    sortConfig,
    filters,
    contractNumber,
    selectedInvestmentSource,
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
    if (!filtersSettledRef.current) {
      filtersSettledRef.current = true;
      return;
    }

    accumulatedItemsRef.current = [];
    setAccumulatedItems([]);
    setHasMore(true);
    if (isListMode) {
      // Отбор изменился — прежнее место в списке потеряло смысл.
      forgetScroll(SCROLL_KEY);
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
    objectType,
    creditTypeId,
    activeTab,
    filters,
    sortConfig,
  ]);

  useEffect(() => {
    setRightAction(
      <FilterIconButton
        type="button"
        onClick={() => setIsFilterModalOpen((v) => !v)}
        $hasActiveFilters={hasActiveFilters}
        aria-label="Фильтр"
        title="Фильтр"
      >
        <ListFilter
          aria-hidden="true"
          size={20}
          strokeWidth={2.2}
          color={hasActiveFilters ? "#007D88" : "#50555C"}
        />
        {hasActiveFilters && getActiveFiltersCount > 0 && (
          <FilterBadge>{getActiveFiltersCount}</FilterBadge>
        )}
      </FilterIconButton>
    );
    return () => setRightAction(null);
  }, [hasActiveFilters, getActiveFiltersCount, setRightAction]);

  // Бесконечная прокрутка: подгружаем следующую страницу при достижении сентинела
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

  // Повторный клик по активному пункту переключает направление, поэтому одна
  // и та же кнопка даёт и убывание, и возрастание.
  // Первый клик — по убыванию: на «Просрочке» в первую очередь нужны самые
  // крупные долги, а не нулевые.
  const handleSortChange = (key: string | null) => {
    setCurrentPage(1);
    setSelectedRows([]);
    setSortConfig((prev) => {
      if (key === null) return { key: null, direction: "desc" };
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    let newFilters = {};
    if (tabId.startsWith("tab-")) {
      const objectTypeId = parseInt(tabId.replace("tab-", ""));
      newFilters = { objectTypeId };
    } else {
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
        case "terminated":
          newFilters = { Terminated: true };
          break;
        default:
          newFilters = {};
          break;
      }
    }

    setFilters(newFilters);
    setCurrentPage(1);
    setSelectedRows([]); // Сбрасываем выбор при смене вкладки
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
      setSelectedCreditForPrint(credit);
      setIsPaymentModalOpen(true);
    }
  };

  const handleSavePayment = async (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: "cash" | "card";
    bankCardId?: number;
  }) => {
    try {
      if (!selectedCreditForPrint) return;

      const paymentRequest = {
        creditId: selectedCreditForPrint.id,
        paymentAmount: paymentData.principalAmount,
        datePayment: paymentData.paymentDate,
        type: paymentData.paymentMethod,
        bankCardId: paymentData.bankCardId,
      };

      const result = await createPayment(paymentRequest);

      await loadCredits();
      setIsPaymentModalOpen(false);
      return result;
    } catch (error) {
      console.error("Ошибка при сохранении платежа:", error);
    }
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
        includeAllStates: includeAllStates ? true : undefined,
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
        CreatedAt: fromCreationDate ? new Date(fromCreationDate) : undefined,
        CreatedTo: toCreationDate ? new Date(toCreationDate) : undefined,
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
    hasActiveFilters,
    contractNumber,
    clientFullName,
    investorName,
    objectType,
    fromDate,
    toDate,
    fromCreationDate,
    toCreationDate,
    activeTab,
    filters,
    includeAllStates,
    selectedInvestmentSource,
    creditTypeId,
    loadCredits,
  ]);

  // Экспорт всех договоров по текущему фильтру.
  const handleExport = async () => {
    try {
      await exportData({
        fetchData: async (page, pageSize) => {
          const params = {
            page,
            pageSize,
            creditId: contractNumber || undefined,
            clientFullname: clientFullName || undefined,
            investorNickname: investorName || undefined,
            dateFrom: fromDate ? new Date(fromDate) : undefined,
            dateTo: toDate ? new Date(toDate) : undefined,
            creditTypeId: creditTypeId || undefined,
            sortBy: sortConfig.key ?? undefined,
            sortDirection: sortConfig.direction,
            ...filters,
          };

          const result = await creditService.getCredits(params);
          return {
            items: Array.isArray(result.items) ? result.items : [],
            totalCount: result.totalCount || 0,
          };
        },
        fileName: "credits_export",
        transformData: (credit) => {
          const creditDate =
            typeof credit.creditDate === "string"
              ? new Date(credit.creditDate)
              : credit.creditDate;

          return {
            ID: credit.id,
            "Дата договора": creditDate
              ? creditDate.toLocaleDateString()
              : "Нет данных",
            "ФИО покупателя": credit.clientFullName,
            Телефон: credit.clientPhone || "Нет данных",
            "Стоимость товара": formatMoney(credit.totalClean?.toString()),
            "Первоначальный взнос": formatMoney(
              credit.firstPayment?.toString()
            ),
            Начислено: formatMoney(credit.totalAmount?.toString() || "0"),
            Уплачено: formatMoney(credit.payed?.toString() || "0"),
            Остаток: formatMoney(credit.rest?.toString() || "0"),
            Просрочка: formatMoney(credit.debt?.toString() || "0"),
          };
        },
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Произошла ошибка при экспорте. Пожалуйста, попробуйте еще раз.");
    }
  };

  // Экспорт конкретного набора договоров (для действий по строке / по выбранным).
  const exportCredits = async (credits: Credit[]) => {
    if (credits.length === 0) return;
    try {
      await exportData({
        fetchData: async () => ({ items: credits, totalCount: credits.length }),
        fileName:
          credits.length === 1 ? `credit_${credits[0].id}` : "credits_export",
        transformData: (credit) => {
          const creditDate =
            typeof credit.creditDate === "string"
              ? new Date(credit.creditDate)
              : credit.creditDate;
          return {
            ID: credit.id,
            "Дата договора": creditDate
              ? creditDate.toLocaleDateString()
              : "Нет данных",
            "ФИО покупателя": credit.clientFullName,
            Телефон: credit.clientPhone || "Нет данных",
            "Стоимость товара": formatMoney(credit.totalClean?.toString()),
            "Первоначальный взнос": formatMoney(
              credit.firstPayment?.toString()
            ),
            Начислено: formatMoney(credit.totalAmount?.toString() || "0"),
            Уплачено: formatMoney(credit.payed?.toString() || "0"),
            Остаток: formatMoney(credit.rest?.toString() || "0"),
            Просрочка: formatMoney(credit.debt?.toString() || "0"),
          };
        },
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Произошла ошибка при экспорте. Пожалуйста, попробуйте еще раз.");
    }
  };

  // Действия по строке. Если выбрано несколько договоров — применяем ко всем выбранным.
  const getRowCredit = (rowData: any[]): Credit | undefined =>
    displayedCredits.find((c) => c.id === Number(rowData[1]));

  const handleRowShare = (rowData: any[]) => {
    if (selectedRows.length > 1) {
      if (
        window.confirm(
          `Вы выбрали ${selectedRows.length} договора(ов). Отправить данные по всем выбранным?`
        )
      ) {
        handleMassShare(selectedRows);
      }
      return;
    }
    const credit = getRowCredit(rowData);
    if (credit) {
      setSelectedCreditForPrint(credit);
      setIsShareModalOpen(true);
    }
  };

  const handleRowClientLink = (rowData: any[]) => {
    const credit = getRowCredit(rowData);
    if (credit) {
      setSelectedCreditForPrint(credit);
      setIsClientLinkModalOpen(true);
    }
  };

  const handleRowPrint = (rowData: any[]) => {
    if (selectedRows.length > 1) {
      if (
        window.confirm(
          `Вы выбрали ${selectedRows.length} договора(ов). Сгенерировать документы для всех выбранных?`
        )
      ) {
        handleMassPrint(selectedRows);
      }
      return;
    }
    const credit = getRowCredit(rowData);
    if (credit) {
      setSelectedCreditForPrint(credit);
      setIsPrintModalOpen(true);
    }
  };

  const handleRowExport = (rowData: any[]) => {
    if (selectedRows.length > 1) {
      const credits = selectedRows
        .map((i) => displayedCredits[i])
        .filter((c): c is Credit => Boolean(c));
      if (
        window.confirm(`Экспортировать ${credits.length} выбранных договоров?`)
      ) {
        exportCredits(credits);
      }
      return;
    }
    const credit = getRowCredit(rowData);
    if (credit) exportCredits([credit]);
  };

  let fundingSourceActionLabel = "Выбрать источник финансирования";
  if (isPoolV2) {
    fundingSourceActionLabel = "Убрать из В долг";
  } else if (selectedRows.length > 1) {
    fundingSourceActionLabel = `Перенести в активные (${selectedRows.length})`;
  }

  const tableActions = [
    {
      label: "Подтвердить договор",
      action: handleAccept,
      color: "#007D88",
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
      color: "#10B981",
    },
    {
      label: "Поделиться",
      action: handleRowShare,
      color: "#3B82F6",
    },
    {
      label: "Ссылка для клиента",
      action: handleRowClientLink,
      color: "#3B82F6",
    },
    {
      label: "Печать",
      action: handleRowPrint,
      color: "#3B82F6",
    },
    {
      label: fundingSourceActionLabel,
      action: handleSelectFundingSource,
      color: "#6B7280",
      shouldShow: (rowData: any[]) =>
        activeTab === "inDebt" &&
        (hasRole("директор") || hasRole("суперадмин")) &&
        denyPermission("MANAGE_ACCOUNTING", true),
    },
    {
      label: "Перенести в долг",
      action: handleMoveToDebt,
      color: "#6B7280",
      shouldShow: () =>
        activeTab !== "inDebt" &&
        (hasRole("директор") || hasRole("суперадмин")) &&
        denyPermission("MANAGE_ACCOUNTING", true),
    },
    {
      label: "Перенести в категорию",
      action: (rowData: any[]) => {
        console.log("Перенос в категорию для:", rowData);
      },
      color: "#6B7280",
      getSubmenu: (rowData: any[]) => {
        const [_, id] = rowData;
        const creditId = Number(id);
        return getMoveMenuItems(
          creditId,
          loadCredits,
          customTabs,
          "Сначала создайте категорию (вкладку сверху)",
          creditService.setCategory.bind(creditService)
        );
      },
      showOnHover: true,
    },
    {
      label: "Перенести в папку",
      action: (rowData: any[]) => {
        console.log("Перенос в папку для:", rowData);
      },
      color: "#6B7280",
      getSubmenu: (rowData: any[]) => {
        const [_, id] = rowData;
        const creditId = Number(id);
        return getMoveMenuItems(
          creditId,
          loadCredits,
          creditFolders,
          "Папок пока нет",
          creditService.setCreditType.bind(creditService)
        );
      },
      showOnHover: true,
    },
    {
      label: "Редактировать",
      action: handleEditCredit,
      color: "#6366F1",
      shouldShow: (rowData: any[]) => hasPermission("EDIT_CREDITS", true),
    },
    {
      label: "Восстановить из расторгнутых",
      action: (rowData: any[]) => {
        const [_, id] = rowData;
        const credit = displayedCredits.find((c) => c.id === Number(id));
        if (!credit) return;
        if (
          !window.confirm(
            "Договор будет возвращён в актуальные. " +
              "Сумма снова спишется с кассы пула или инвестора. Продолжить?"
          )
        )
          return;
        toggleTerminated(credit.id).then((ok) => {
          if (ok) loadCredits();
        });
      },
      color: "#10B981",
      shouldShow: (rowData: any[]) => {
        const [_, id] = rowData;
        const credit = displayedCredits.find((c) => c.id === Number(id));
        return (
          !!credit && credit.terminated && hasPermission("EDIT_CREDITS", true)
        );
      },
    },
    {
      label: "Расторгнуть",
      action: (rowData: any[]) => {
        const [_, id] = rowData;
        const credit = displayedCredits.find((c) => c.id === Number(id));
        if (!credit) return;
        if (
          !window.confirm(
            "Договор будет переведён в «Расторгнутые». " +
              "Сумма, использованная при выдаче, автоматически вернётся в кассу пула или инвестора. " +
              "Продолжить?"
          )
        )
          return;
        toggleTerminated(credit.id).then((ok) => {
          if (ok) loadCredits();
        });
      },
      color: "#F59E0B",
      dividerBefore: true,
      shouldShow: (rowData: any[]) => {
        const [_, id] = rowData;
        const credit = displayedCredits.find((c) => c.id === Number(id));
        return (
          !!credit && !credit.terminated && hasPermission("EDIT_CREDITS", true)
        );
      },
    },
    {
      label: "Удалить",
      action: handleDeleteCredit,
      color: "#EF4444",
      dividerBefore: true,
      shouldShow: (rowData: any[]) =>
        hasPermission("DELETE_CREDITS") &&
        denyPermission("MANAGE_ACCOUNTING", true),
    },
  ];

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

      if (credit.terminated) {
        baseStyle.backgroundColor = "#F3E8FF";
        baseStyle.color = "#6B21A8";
      }

      if (!credit.hasCounterApproved) {
        baseStyle.backgroundColor = "#FFD6D6";
        baseStyle.color = "#B91C1C";
      }

      // Подсветка выбранных строк
      if (selectedRows.includes(rowIndex)) {
        baseStyle.backgroundColor = "#E3F2FD";
        baseStyle.color = "#1565C0";
      }

      // Подсветка строки при одиночном выборе
      if (
        selectedCreditForPrint?.id === credit.id &&
        selectedRows.length === 1
      ) {
        baseStyle.backgroundColor = "#007D88";
        baseStyle.color = "#FFFFFF";
      }

      styles[rowIndex] = baseStyle;
    });

    return styles;
  }, [displayedCredits, selectedCreditForPrint, selectedRows]);

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
      credit.clientFullName,
      `${formatMoney(credit.totalClean.toString())}`,
      `${formatMoney(credit.firstPayment?.toString() || "")}`,
      `${formatMoney(credit.accured?.toString() || "")}`,
      `${formatMoney(credit.payed.toString())}`,
      `${formatMoney(credit.rest.toString())}`,
      `${formatMoney(credit.rest.toString())}`,
      `${formatMoney(credit.debt.toString())}`,
      credit.isActive,
    ]);

    if (
      credits.length > 0 &&
      (hasRole("админ") ||
        hasRole("директор") ||
        hasRole("суперадмин") ||
        hasPermission("MANAGE_ACCOUNTING"))
    ) {
      const totalsRow = [
        "",
        "",
        "",
        "Итого",
        `${formatMoney(creditsData.totalPrice.toString())}`,
        `${formatMoney(creditsData.totalFirstPayment.toString())}`,
        `${formatMoney(creditsData.totalAccured.toString())}`,
        `${formatMoney(creditsData.totalPayed.toString())}`,
        `${formatMoney(creditsData.totalRest.toString())}`,
        `${formatMoney(creditsData.totalRest.toString())}`,
        `${formatMoney(creditsData.totalDebt.toString())}`,
        "",
      ];
      formattedData.push(totalsRow);
    }

    return formattedData;
  };

  const handleRowDoubleClick = (rowData: any[]) => {
    const [_, id] = rowData;
    setViewingCreditId(Number(id));
    setIsViewModalOpen(true);
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

  // Добавим индикатор выбранных строк
  const SelectedCount = () => {
    if (selectedRows.length === 0) return null;

    return (
      <SelectedCountBadge>Выбрано: {selectedRows.length}</SelectedCountBadge>
    );
  };

  // Авто-сворачивание панели фильтров: только если включено в Персональных
  // настройках. Клик по рабочей области (карточки, вкладки, выделение договора)
  // сворачивает открытую панель.
  const collapseFiltersOnSectionClick = () => {
    if (isFilterModalOpen && getCollapseFiltersOnClickSetting()) {
      setIsFilterModalOpen(false);
    }
  };

  return (
    <FilterAwarePageLayout ref={containerRef} $filterOpen={isFilterModalOpen}>
      <FilterBackdrop
        $visible={isFilterModalOpen}
        onClick={() => setIsFilterModalOpen(false)}
      />

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
              <FilterSlotLabel>Адрес / Район</FilterSlotLabel>
              <CustomInput
                inputType="text"
                placeholder="Поиск по адресу"
                value={clientAddress}
                onChange={(e) => {
                  setClientAddress(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </FilterSlot>

            <FilterSlot>
              <FilterSlotLabel>Сортировка</FilterSlotLabel>
              <SortChipRow>
                {SORT_OPTIONS.map((option) => {
                  const isActive = sortConfig.key === option.key;
                  return (
                    <SortChip
                      key={option.key ?? "default"}
                      type="button"
                      $active={isActive}
                      onClick={() => handleSortChange(option.key)}
                      title={
                        option.key === null
                          ? "Порядок по умолчанию"
                          : isActive
                          ? "Нажмите ещё раз, чтобы изменить направление"
                          : "Сортировать по убыванию"
                      }
                    >
                      {option.label}
                      {isActive && option.key !== null && (
                        <SortArrow>
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </SortArrow>
                      )}
                    </SortChip>
                  );
                })}
              </SortChipRow>
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
                    placeholder=""
                    value={fromDate}
                    onChange={(date) => {
                      setFromDate(date);
                      setCurrentPage(1);
                    }}
                  />
                  <RangeDash>–</RangeDash>
                  <CustomCalendar
                    prefix="до:"
                    placeholder=""
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
                    placeholder=""
                    value={fromCreationDate}
                    onChange={(date) => {
                      setFromCreationDate(date);
                      setCurrentPage(1);
                    }}
                  />
                  <RangeDash>–</RangeDash>
                  <CustomCalendar
                    prefix="до:"
                    placeholder=""
                    value={toCreationDate}
                    onChange={(date) => {
                      setToCreationDate(date);
                      setCurrentPage(1);
                    }}
                  />
                </RangeRow>
              </FilterSlot>
            </FilterGroup>
          </FilterGroupRow>

          {creditsData && (
            <FilterTotalCount>
              <FilterTotalLabel>Всего договоров</FilterTotalLabel>
              <FilterTotalValue>{creditsData.totalCount}</FilterTotalValue>
            </FilterTotalCount>
          )}

          <FilterModalFooter>
            <DarkCyanButton
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              Сбросить фильтры
            </DarkCyanButton>

            <ExportButton
              onClick={handleExport}
              isExporting={isExporting}
              exportProgress={exportProgress}
            >
              Экспорт по фильтру
            </ExportButton>
          </FilterModalFooter>

          {hasPermission("MANAGE_ACCOUNTING", true) && (
            <FilterConfirmAllRow>
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
            </FilterConfirmAllRow>
          )}
        </FilterPanelInner>
      </FilterPanel>

      <StickyHeader onClick={collapseFiltersOnSectionClick}>
        {creditsData && forbiddenRole("сотрудник") && (
          <SummaryStrip>
            <SummaryItem>
              <SummaryLabel>Стоимость</SummaryLabel>
              <SummaryValue>
                {formatMoney(creditsData.totalPrice.toString())}
              </SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Аванс</SummaryLabel>
              <SummaryValue>
                {formatMoney(creditsData.totalFirstPayment.toString())}
              </SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Начислено</SummaryLabel>
              <SummaryValue>
                {formatMoney(creditsData.totalAccured.toString())}
              </SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Уплачено</SummaryLabel>
              <SummaryValue>
                {formatMoney(creditsData.totalPayed.toString())}
              </SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Остаток</SummaryLabel>
              <SummaryValue>
                {formatMoney(creditsData.totalRest.toString())}
              </SummaryValue>
            </SummaryItem>
            <SummaryItem $danger={(creditsData.totalDebt ?? 0) > 0}>
              <SummaryLabel>Долг</SummaryLabel>
              <SummaryValue $danger={(creditsData.totalDebt ?? 0) > 0}>
                {formatMoney(creditsData.totalDebt.toString())}
              </SummaryValue>
            </SummaryItem>
          </SummaryStrip>
        )}

        <SecondRaw style={{ color: "white" }}>
          <Tabs
            tabs={getTabs()}
            activeTab={activeTab}
            onChange={handleTabChange}
          />

          {customTabs.length < 5 && (
            <AddButton
              onClick={() => setIsCreateTabModalOpen(true)}
              tooltip="Добавить вкладку"
              margin="0 auto 15px 15px"
              size={24}
            />
          )}

          <SelectedCount />
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
                    "totalClean",
                    "firstPayment",
                    "accured",
                    "payed",
                    "rest",
                    "debt",
                  ] as CreditCardField[]
                }
                getRowData={(credit) => [
                  null,
                  credit.id.toString(),
                  formatDate(credit.creditDate),
                  credit.clientFullName,
                  formatMoney((credit.totalClean ?? 0).toString()),
                  formatMoney((credit.firstPayment ?? 0).toString()),
                  formatMoney((credit.accured ?? 0).toString()),
                  formatMoney((credit.payed ?? 0).toString()),
                  formatMoney((credit.rest ?? 0).toString()),
                  formatMoney((credit.rest ?? 0).toString()),
                  formatMoney((credit.debt ?? 0).toString()),
                  credit.isActive,
                ]}
                selectedIndices={selectedRows}
                highlightedCreditId={selectedCreditForPrint?.id ?? null}
                multiSelect
                onToggleSelect={(rowIndex) => {
                  setSelectedRows((prev) =>
                    prev.includes(rowIndex)
                      ? prev.filter((i) => i !== rowIndex)
                      : [...prev, rowIndex]
                  );
                }}
                onRowClick={(rowIndex) => {
                  const credit = displayedCredits[rowIndex];
                  if (credit) setSelectedCreditForPrint(credit);
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
                    onChange={(page) => {
                      setCurrentPage(page);
                      setSelectedRows([]); // Сбрасываем выбор при смене страницы
                    }}
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
        creditId={selectedCreditForPrint?.id || 0}
        clientName={selectedCreditForPrint?.clientFullName || ""}
        investorName={selectedCreditForPrint?.investorNickname || ""}
        clientPhone={selectedCreditForPrint?.clientPhone || ""}
        currentDebt={selectedCreditForPrint?.rest || 0}
        currentMonthDebt={selectedCreditForPrint?.currentMonthDebt || 0}
        onPrintReceipt={handlePrintReceipt}
        clientId={selectedCreditForPrint?.clientId}
      />

      <ViewCreditModal
        id={viewingCreditId || 0}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        onOpenCredit={(newId) => setViewingCreditId(newId)}
      />

      <PrintOptionModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onSelect={handlePrintOptionSelect}
        selectedCredit={selectedCreditForPrint}
      />

      {/* Новая модалка для кнопки "Поделиться" */}
      <ShareOptionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSelect={handleShareOptionSelect}
        selectedCredit={selectedCreditForPrint}
      />

      <ClientLinkModal
        isOpen={isClientLinkModalOpen}
        clientId={selectedCreditForPrint?.clientId}
        clientName={selectedCreditForPrint?.clientFullName}
        onClose={() => setIsClientLinkModalOpen(false)}
      />

      <InvestorSelectModal
        isOpen={isInvestorSelectModalOpen}
        onClose={() => {
          setIsInvestorSelectModalOpen(false);
          setCreditsForFunding([]);
        }}
        onSubmit={handleFundingSourceSubmit}
        includePools={true}
      />

      <CreateObjectTypeModal
        isOpen={isCreateTabModalOpen}
        onClose={() => setIsCreateTabModalOpen(false)}
        onSubmit={handleCreateTab}
        entityType="creditTab"
        maxTabs={5}
        currentTabCount={customTabs.length}
      />

      <EditObjectTypeModal
        isOpen={isEditTabModalOpen}
        onClose={() => {
          setIsEditTabModalOpen(false);
          setEditingTab(null);
        }}
        onSubmit={handleEditTab}
        initialData={editingTab}
        entityType="creditTab"
      />
    </FilterAwarePageLayout>
  );
};

// Иконка-кнопка фильтра — рядом с колокольчиком/настройками в TopMenu.
// Кнопки 36px с шагом 46px дают одинаковый зазор 10px:
// настройки right:10 → колокол right:56 → фильтр right:102.
const FilterIconButton = styled.button<{ $hasActiveFilters: boolean }>`
  position: relative;
  z-index: 101;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.$hasActiveFilters ? "#007D88" : "#374151")};
  transition: all 0.3s ease;
  outline: none;

  &:hover {
    background-color: rgba(209, 213, 219, 0.5);
    border-color: transparent;
    color: ${(props) => (props.$hasActiveFilters ? "#007D88" : "#000000")};
  }

  &:active {
    background-color: rgba(209, 213, 219, 0.7);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  svg {
    display: block !important;
    width: 20px !important;
    height: 20px !important;
    flex-shrink: 0;
    color: currentColor !important;
    stroke: currentColor !important;
    fill: none !important;
    opacity: 1 !important;
    pointer-events: none;
  }

  svg * {
    stroke: currentColor !important;
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

// Ширина выезжающей панели фильтров (на столько отодвигается контент). Как у бокового меню.
const FILTER_PANEL_WIDTH = 360;

// Контент-обёртка: на широких экранах отодвигается под выехавший фильтр,
// на узких (≤1280px) фильтр выезжает поверх, поэтому отступ убираем.
const FilterAwarePageLayout = styled(PageLayout)<{ $filterOpen: boolean }>`
  padding-right: ${({ $filterOpen }) =>
    $filterOpen ? FILTER_PANEL_WIDTH : 0}px;
  transition: padding-right 0.3s ease;
  height: calc(100vh - var(--header-height, 56px));
  overflow: hidden;

  @media (max-width: 1280px) {
    padding-right: 0;
  }
`;

const FilterBackdrop = styled.div<{ $visible: boolean }>`
  display: none;

  @media (max-width: 1280px) {
    display: ${({ $visible }) => ($visible ? "block" : "none")};
    position: fixed;
    inset: var(--header-height, 56px) 0 0 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 99;
  }
`;

const FilterPanel = styled.div<{ $open: boolean }>`
  position: fixed;
  top: var(--header-height, 56px);
  right: 0;
  height: calc(100vh - var(--header-height, 56px));
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
  display: flex;
  flex-direction: column;

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

// Кнопка «Подтвердить все по фильтрам» — прижата к самому низу панели
// (margin-top: auto), на всю ширину, с разделителем сверху.
const FilterConfirmAllRow = styled.div`
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;

  & button {
    width: 100%;
    height: auto;
    margin: 0;
    padding: 8px 12px;
    font-size: 13px;
    border-radius: 8px;
  }
`;

// Статичная «шапка» списка: статистика + вкладки. Не скроллится —
// прокручивается только ScrollArea с карточками под ней.
const StickyHeader = styled.div`
  flex-shrink: 0;
  background: rgba(249, 250, 250, 1);
  padding-bottom: 6px;
`;

// Внутренний скролл-контейнер только для карточек.
const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: 2px;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(209, 213, 219, 1);
    border-radius: 4px;
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

// Счётчик «Всего договоров» в футере фильтра. Прижат влево (margin-right: auto),
// кнопки футера остаются справа.
const FilterTotalCount = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  box-sizing: border-box;
  margin-top: 12px;
  /* Выравниваем по левому краю блоков фильтра выше (без отступа/бордюра,
     которые раньше сдвигали «Всего договоров» вправо). */
  padding: 4px 0;
`;

const FilterTotalLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const FilterTotalValue = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #0f766e;
`;

const FilterField = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  position: relative;
  margin-top: 0;
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
  background-color: transparent;
  justify-content: space-between;
  align-items: center;
  position: relative;
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

const TabLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TabActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${TabLabel}:hover & {
    opacity: 1;
  }
`;

const SelectedCountBadge = styled.div`
  background-color: #007d88;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  margin-left: 15px;
  margin-bottom: 15px;
`;

// Стили для модалки "Поделиться" (можно вынести в отдельный файл)
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? "flex" : "none")};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: black;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  color: black;
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
`;

const PrintOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PrintOption = styled.button<{ disabled?: boolean }>`
  padding: 12px;
  background-color: ${({ disabled }) => (disabled ? "#f9f9f9" : "#f5f5f5")};
  border: 1px solid ${({ disabled }) => (disabled ? "#eee" : "#ddd")};
  border-radius: 4px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  text-align: center;
  transition: background-color 0.2s;
  color: ${({ disabled }) => (disabled ? "#999" : "black")};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? "#f9f9f9" : "#e9e9e9")};
    border-color: ${({ disabled }) =>
      disabled ? "#eee" : "rgba(0, 125, 136, 1)"};
  }
`;

const ShareIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.00001 2.50216C9.00098 1.91022 9.20982 1.33743 9.59224 0.885601C9.97466 0.43377 10.5049 0.132162 11.0887 0.0343785C11.6725 -0.0634049 12.2721 0.0489702 12.7809 0.351533C13.2896 0.654095 13.6747 1.12725 13.8675 1.6869C14.0604 2.24655 14.0485 2.85645 13.8341 3.4082C13.6197 3.95995 13.2167 4.41782 12.6965 4.70044C12.1764 4.98305 11.5729 5.0721 10.9934 4.95176C10.4138 4.83141 9.89563 4.50948 9.53101 4.04316L4.91502 6.35116C5.02912 6.77597 5.02912 7.22336 4.91502 7.64816L9.53302 9.95816C9.91574 9.47098 10.4657 9.14326 11.0764 9.03854C11.687 8.93382 12.3147 9.05956 12.8379 9.39139C13.3611 9.72321 13.7424 10.2375 13.908 10.8345C14.0736 11.4315 14.0116 12.0687 13.734 12.6226C13.4564 13.1765 12.9831 13.6076 12.4057 13.8323C11.8284 14.057 11.1882 14.0594 10.6092 13.8389C10.0302 13.6184 9.55374 13.1908 9.27213 12.6389C8.99051 12.0871 8.92383 11.4504 9.08502 10.8522L4.46702 8.54216C4.14602 8.95136 3.7054 9.25027 3.20652 9.39725C2.70765 9.54423 2.17535 9.53196 1.68377 9.36216C1.19219 9.19236 0.765807 8.87348 0.464002 8.44992C0.162198 8.02637 0 7.51924 0 6.99916C0 6.47908 0.162198 5.97195 0.464002 5.5484C0.765807 5.12485 1.19219 4.80596 1.68377 4.63616C2.17535 4.46636 2.70765 4.45409 3.20652 4.60107C3.7054 4.74805 4.14602 5.04696 4.46702 5.45616L9.08502 3.14916C9.02854 2.93813 8.99996 2.72062 9.00001 2.50216ZM11.502 1.00016C11.1038 1.00016 10.7219 1.15835 10.4403 1.43994C10.1587 1.72153 10.0005 2.10344 10.0005 2.50166C10.0005 2.89988 10.1587 3.2818 10.4403 3.56338C10.7219 3.84497 11.1038 4.00316 11.502 4.00316C11.9002 4.00316 12.2821 3.84497 12.5637 3.56338C12.8453 3.2818 13.0035 2.89988 13.0035 2.50166C13.0035 2.10344 12.8453 1.72153 12.5637 1.43994C12.2821 1.15835 11.9002 1.00016 11.502 1.00016ZM11.5 10.0002C11.1022 10.0002 10.7207 10.1582 10.4394 10.4395C10.1581 10.7208 10 11.1023 10 11.5002C10 11.898 10.1581 12.2795 10.4394 12.5608C10.7207 12.8421 11.1022 13.0002 11.5 13.0002C11.8978 13.0002 12.2794 12.8421 12.5607 12.5608C12.842 12.2795 13 11.898 13 11.5002C13 11.1023 12.842 10.7208 12.5607 10.4395C12.2794 10.1582 11.8978 10.0002 11.5 10.0002ZM1.00002 7.00016C1.00002 7.19714 1.03881 7.3922 1.1142 7.57419C1.18958 7.75617 1.30007 7.92153 1.43936 8.06082C1.57864 8.20011 1.744 8.3106 1.92599 8.38598C2.10798 8.46136 2.30303 8.50016 2.50002 8.50016C2.697 8.50016 2.89205 8.46136 3.07404 8.38598C3.25603 8.3106 3.42139 8.20011 3.56068 8.06082C3.69996 7.92153 3.81045 7.75617 3.88583 7.57419C3.96122 7.3922 4.00002 7.19714 4.00002 7.00016C4.00002 6.60234 3.84198 6.22081 3.56068 5.9395C3.27937 5.6582 2.89784 5.50016 2.50002 5.50016C2.10219 5.50016 1.72066 5.6582 1.43936 5.9395C1.15805 6.22081 1.00002 6.60234 1.00002 7.00016Z"
      fill="black"
    />
  </svg>
);

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
  grid-template-columns: 1fr;
  gap: 8px 10px;
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

const SortChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const SortChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? "#007d88" : "rgba(209, 213, 219, 1)")};
  background: ${({ $active }) => ($active ? "#e6f4f5" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#00666f" : "#4b5563")};
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  line-height: 1.2;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;

  &:hover {
    border-color: #007d88;
    color: #00666f;
  }
`;

const SortArrow = styled.span`
  font-size: 11px;
  line-height: 1;
`;

const SummaryStrip = styled.div`
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

const SummaryItem = styled.div<{ $danger?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  border-left: 3px solid ${(p) => (p.$danger ? "#EF4444" : "#0F766E")};
`;

const SummaryLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const SummaryValue = styled.span<{ $danger?: boolean }>`
  font-size: 15px;
  font-weight: 600;
  color: ${(p) => (p.$danger ? "#B91C1C" : "#0F766E")};
`;

export default CreditPage;

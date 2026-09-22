import { useState, useCallback, useEffect, useRef } from "react";
import PageLayout from "../../components/ui/Layouts/PageLayout";
import TitleField from "../../components/ui/Layouts/TitleLayout";
import Tabs from "../../components/ui/fields/Tabs";
import ExportButton from "../../components/ui/Buttons/ExportButton";
import { useAuth } from "../../сontext/AuthContext";
import { useUiSettings } from "../../utils/uiSettings";
import { useResponsivePageSize } from "../../utils/useResponsivePageSize";
import useExport from "../../api/hooks/useExport";
import type { ScheduleDetails, ScheduleParams } from "../../api/types/schedule";
import scheduleService from "../../api/services/scheduleService";
import { parseDateInput, formatDate } from "../../utils/dateFormatter";
import { formatMoney } from "../../utils/formatPrice";
import ScheduleTable, {
  type ScheduleFilters,
  type ScheduleTableHandle,
} from "./ScheduleTable";
import ScheduleCharts from "./ScheduleCharts";
import ScheduleCalendar from "./ScheduleCalendar";

type TabType = "calendar" | "schedule" | "table" | "visited";

interface SchedulePageProps {
  initialTab?: TabType;
  hiddenTabs?: TabType[];
  title?: string;
}

const ACTIVE_TAB_STORAGE_KEY = "schedule_page_active_tab";

const SchedulePage = ({
  initialTab = "table",
  hiddenTabs = ["calendar"],
}: SchedulePageProps = {}) => {
  const { hasRole, hasPermission } = useAuth();
  const uiSettings = useUiSettings();
  const isListMode = uiSettings.paymentsDisplayMode === "list";

  const { pageSize: responsivePageSize, containerRef } = useResponsivePageSize({
    defaultPageSize: 10,
    minPageSize: 1,
    maxPageSize: 50,
    rowHeight: 30,
    headerHeight: 300,
    paginationHeight: 65,
  });

  const { exportData, isExporting, exportProgress } =
    useExport<ScheduleDetails>();
  const scheduleTableRef = useRef<ScheduleTableHandle>(null);
  const visitedTableRef = useRef<ScheduleTableHandle>(null);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as TabType;
    return savedTab &&
      (savedTab === "calendar" ||
        savedTab === "schedule" ||
        savedTab === "table" ||
        savedTab === "visited") &&
      !hiddenTabs.includes(savedTab)
      ? savedTab
      : initialTab;
  });

  const isTabHidden = useCallback(
    (tab: TabType) => hiddenTabs.includes(tab),
    [hiddenTabs]
  );

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

  const handleExport = useCallback(
    async (filters: ScheduleFilters) => {
      try {
        const columnToApiSortMap: Record<number, string> = {
          0: "creditid",
          1: "client",
          2: "amount",
          3: "date",
        };

        await exportData({
          fetchData: async (page, pageSize) => {
            const params: ScheduleParams = {
              page,
              pageSize,
              clientName: filters.clientName || undefined,
              investorNickname: filters.investorName || undefined,
              dateFrom: filters.dateFrom
                ? parseDateInput(filters.dateFrom)
                : undefined,
              dateTo: filters.dateTo
                ? parseDateInput(filters.dateTo)
                : undefined,
              creditTypeId: filters.objectTypeId || undefined,
              schouldBeVisited: filters.shouldBeVisited || undefined,
              sortBy:
                filters.sortKey !== null && filters.sortKey !== undefined
                  ? columnToApiSortMap[filters.sortKey]
                  : undefined,
              sortDirection: filters.sortDirection,
            };

            if (filters.entityId && filters.entityId !== 0) {
              if (filters.entityType === "investor") {
                params.investorId = filters.entityId;
              } else if (filters.entityType === "pool") {
                params.poolId = filters.entityId;
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
            Платеж: formatMoney(String(schedule.paymentAmount ?? 0)),
            "Дата платежа": formatDate(schedule.paymentDate),
            Комментарий: schedule.userComment || "",
            Уведомлен: schedule.notified ? "Да" : "Нет",
          }),
        });
      } catch (error) {
        console.error("Export failed:", error);
      }
    },
    [exportData]
  );

  const handleExportClick = useCallback(() => {
    const tableRef =
      activeTab === "visited" ? visitedTableRef : scheduleTableRef;
    handleExport(tableRef.current?.getFilters() ?? {});
  }, [activeTab, handleExport]);

  const tabs = [
    ...(shouldShowScheduleTab && !isTabHidden("calendar")
      ? [
          {
            id: "calendar",
            label: "Календарь",
            content: <ScheduleCalendar />,
          },
        ]
      : []),
    ...(shouldShowScheduleTab && !isTabHidden("schedule")
      ? [
          {
            id: "schedule",
            label: "График",
            content: <ScheduleCharts />,
          },
        ]
      : []),
    ...(!isTabHidden("table")
      ? [
          {
            id: "table",
            label: "Таблица",
            content: (
              <ScheduleTable
                key="table"
                ref={scheduleTableRef}
                isListMode={isListMode}
                pageSize={responsivePageSize}
              />
            ),
          },
        ]
      : []),
    {
      id: "visited",
      label: "Выездные клиенты",
      content: (
        <ScheduleTable
          key="visited"
          ref={visitedTableRef}
          isListMode={isListMode}
          pageSize={responsivePageSize}
          shouldBeVisited={true}
        />
      ),
    },
  ];

  const exportButton =
    activeTab !== "calendar" ? (
      <ExportButton
        onClick={handleExportClick}
        isExporting={isExporting}
        exportProgress={exportProgress}
        style={{ margin: 0 }}
      />
    ) : undefined;

  return (
    <PageLayout ref={containerRef}>
      {tabs.length > 1 ? (
        // Вкладки («График», «Таблица») и кнопка «Экспорт» в одном ряду.
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          addButton={exportButton}
        />
      ) : (
        <>
          {exportButton && (
            <TitleField>
              <div style={{ marginLeft: "auto" }}>{exportButton}</div>
            </TitleField>
          )}
          {tabs[0]?.content}
        </>
      )}
    </PageLayout>
  );
};

export default SchedulePage;

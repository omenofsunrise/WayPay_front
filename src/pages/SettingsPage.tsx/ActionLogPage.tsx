import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import useActionLog from "../../api/hooks/useActionLog";
import type {
  ActionLogDetails,
  ActionLogEntity,
  ActionLogRecord,
} from "../../api/types/actionLog";
import ActionLogFields from "../../components/ui/ActionLogFields";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import CustomInput from "../../components/ui/fields/CustomInput";
import CustomSelect from "../../components/ui/fields/CustomSelect";
import Pagination from "../../components/ui/fields/CustomPagination";
import PeriodField from "../../components/ui/fields/PeriodField";
import FilterField from "../../components/ui/Layouts/FilterField";
import PaginationLayout from "../../components/ui/Layouts/PaginationLayout";
import CountInfoTitle from "../../components/ui/Text/CountInfoTitle";
import CustomTable, {
  type Column,
  type RowStyle,
  type TableAction,
} from "../../components/ui/tables/CustomTable";
import { useAuth } from "../../сontext/AuthContext";

const PAGE_SIZE = 20;

const ACTION_OPTIONS = [
  { value: "", label: "Все действия" },
  { value: "created", label: "Создание" },
  { value: "updated", label: "Изменение" },
  { value: "deleted", label: "Удаление" },
];

const moment = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const fullMoment = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const asIsoDate = (date: Date) => date.toISOString().slice(0, 10);

// Дата из календаря приходит как дд.мм.гггг, а бэкенду нужна гггг-мм-дд.
const normalizeDate = (value?: string) => {
  if (!value) return "";

  const parts = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (parts) return `${parts[3]}-${parts[2]}-${parts[1]}`;

  return value.slice(0, 10);
};

/**
 * PeriodField отдаёт только название периода, даты считает тот, кто его
 * показывает. Своя дата приходит отдельными значениями.
 */
const periodToRange = (period: string): { from: string; to: string } => {
  const today = new Date();
  const start = new Date(today);

  switch (period) {
    case "Last7Days":
      start.setDate(today.getDate() - 6);
      return { from: asIsoDate(start), to: asIsoDate(today) };
    case "Last31Days":
      start.setDate(today.getDate() - 30);
      return { from: asIsoDate(start), to: asIsoDate(today) };
    case "ThisMonth":
      return {
        from: asIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: asIsoDate(today),
      };
    case "PreviousMonth":
      return {
        from: asIsoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        to: asIsoDate(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    case "ThisYear":
      return {
        from: asIsoDate(new Date(today.getFullYear(), 0, 1)),
        to: asIsoDate(today),
      };
    case "PreviousYear":
      return {
        from: asIsoDate(new Date(today.getFullYear() - 1, 0, 1)),
        to: asIsoDate(new Date(today.getFullYear() - 1, 11, 31)),
      };
    default:
      return { from: "", to: "" };
  }
};

const ActionLogPage = () => {
  const { getPage, getEntities, getById, isLoading, error } = useActionLog();
  const { authInfo } = useAuth();
  // Журнал можно выключить в данных компании: тогда новые действия не пишутся,
  // а записанное лежит до конца трёхмесячного хранения.
  const loggingEnabled = authInfo?.employee.actionLogEnabled ?? true;

  const [records, setRecords] = useState<ActionLogRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [entities, setEntities] = useState<ActionLogEntity[]>([]);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState("");

  const [details, setDetails] = useState<ActionLogDetails | null>(null);

  const filters = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      entity: entity || undefined,
      action: action || undefined,
      search: search.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [currentPage, entity, action, search, dateFrom, dateTo]
  );

  const load = useCallback(async () => {
    const result = await getPage(filters);
    if (result) {
      setRecords(result.items ?? []);
      setTotalCount(result.totalCount ?? 0);
    }
  }, [filters, getPage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getEntities().then(setEntities);
  }, [getEntities]);

  const handlePeriodChange = (
    value: string,
    startDate?: string,
    endDate?: string
  ) => {
    setPeriod(value);

    if (value === "Custom") {
      setDateFrom(normalizeDate(startDate));
      setDateTo(normalizeDate(endDate));
    } else {
      const range = periodToRange(value);
      setDateFrom(range.from);
      setDateTo(range.to);
    }

    setCurrentPage(1);
  };

  const openDetails = useCallback(
    async (record?: ActionLogRecord) => {
      if (!record?.hasDetails) return;
      const full = await getById(record.id);
      if (full) setDetails(full);
    },
    [getById]
  );

  const columns: Column[] = useMemo(() => {
    const list: Column[] = [
      { name: "Когда", align: "left" },
      { name: "Кто", align: "left" },
      { name: "Что сделал", align: "left" },
      { name: "Объект", align: "left" },
    ];

    return list;
  }, []);

  const tableData = useMemo(
    () =>
      records.map((record) => {
        const object = [record.title, record.entityId && `№ ${record.entityId}`]
          .filter(Boolean)
          .join("  ");

        const row = [
          moment(record.createdAt),
          record.employeeName,
          `${record.actionName} ${record.entityNameAccusative}`,
          object || "—",
        ];

        return row;
      }),
    [records]
  );

  // Удаление помечаем цветом строки: именно его ищут, когда открывают журнал.
  const rowStyles = useMemo(() => {
    const styles: Record<number, RowStyle> = {};

    records.forEach((record, index) => {
      if (record.action === "deleted") {
        styles[index] = { color: "#B71C1C" };
      }
    });

    return styles;
  }, [records]);

  const tableActions: TableAction[] = [
    {
      label: "Подробнее",
      action: (_rowData, rowIndex) => openDetails(records[rowIndex]),
      color: "#007D88",
      shouldShow: (rowData) => {
        const index = tableData.indexOf(rowData);
        return Boolean(records[index]?.hasDetails);
      },
    },
  ];

  return (
    <>
      <FilterField>
        <PeriodField
          value={period}
          placeholder="Период"
          onChange={handlePeriodChange}
        />

        <CustomSelect
          placeholder="Все объекты"
          value={entity}
          options={[
            { value: "", label: "Все объекты" },
            ...entities.map((item) => ({
              value: item.entity,
              label: item.name,
            })),
          ]}
          onChange={(event) => {
            setEntity(event.target.value);
            setCurrentPage(1);
          }}
        />

        <CustomSelect
          placeholder="Все действия"
          value={action}
          options={ACTION_OPTIONS}
          onChange={(event) => {
            setAction(event.target.value);
            setCurrentPage(1);
          }}
        />

        <CustomInput
          inputType="text"
          placeholder="Договор, клиент, сумма"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </FilterField>

      {!loggingEnabled && (
        <Notice>
          Логирование выключено в данных компании: новые действия не
          записываются. Уже записанное хранится три месяца.
        </Notice>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      <CustomTable
        columns={columns}
        data={tableData}
        rowStyles={rowStyles}
        isLoading={isLoading}
        contextMenuActions={tableActions}
        onRowClick={(_rowData: unknown, rowIndex: number) =>
          openDetails(records[rowIndex])
        }
        onRowDoubleClick={(_rowData: unknown, rowIndex: number) =>
          openDetails(records[rowIndex])
        }
      />

      {!isLoading && records.length === 0 && (
        <EmptyText>
          За выбранный период записей нет. Журнал ведётся с момента его
          включения и хранится три месяца.
        </EmptyText>
      )}

      <PaginationLayout>
        <CountInfoTitle total={totalCount} />
        <Pagination
          total={totalCount}
          current={currentPage}
          onChange={setCurrentPage}
          itemsPerPage={PAGE_SIZE}
        />
      </PaginationLayout>

      {details && (
        <BaseModal
          isOpen={true}
          title={`${details.employeeName} ${details.actionName} ${details.entityNameAccusative}`}
          onClose={() => setDetails(null)}
          onCancel={() => setDetails(null)}
          hideSaveButton
          cancelButtonText="Закрыть"
          width="640px"
        >
          <ModalBody>
            <ModalHead>
              <Badge $action={details.action}>{details.actionName}</Badge>
              <span>{fullMoment(details.createdAt)}</span>
              {details.title && <Separator>·</Separator>}
              {details.title && <strong>{details.title}</strong>}
              {details.entityId && <Separator>·</Separator>}
              {details.entityId && <span>№ {details.entityId}</span>}
            </ModalHead>

            <ActionLogFields fields={details.fields ?? []} />
          </ModalBody>
        </BaseModal>
      )}
    </>
  );
};

const Notice = styled.div`
  margin-bottom: 14px;
  padding: 10px 14px;
  border: 1px solid rgba(245, 166, 35, 0.4);
  border-left: 3px solid #f5a623;
  border-radius: 8px;
  background: rgba(245, 166, 35, 0.08);
  font-size: 14px;
  color: rgba(80, 85, 92, 1);
`;

const ErrorText = styled.div`
  margin-bottom: 12px;
  font-size: 14px;
  color: #b71c1c;
`;

const EmptyText = styled.div`
  padding: 24px 0;
  font-size: 14px;
  color: rgba(80, 85, 92, 1);
  text-align: center;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
`;

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: rgba(80, 85, 92, 1);
`;

const Badge = styled.span<{ $action: string }>`
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $action }) =>
    $action === "deleted"
      ? "#B71C1C"
      : $action === "created"
      ? "#007D88"
      : "#2563EB"};
  background: ${({ $action }) =>
    $action === "deleted"
      ? "rgba(239, 68, 68, 0.1)"
      : $action === "created"
      ? "rgba(0, 125, 136, 0.1)"
      : "rgba(59, 130, 246, 0.1)"};
`;

const Separator = styled.span`
  color: #cbd5e1;
`;

export default ActionLogPage;

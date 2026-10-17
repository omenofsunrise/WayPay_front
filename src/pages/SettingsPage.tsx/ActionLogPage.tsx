import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import useActionLog from "../../api/hooks/useActionLog";
import type {
  ActionLogDetails,
  ActionLogEntity,
  ActionLogRecord,
} from "../../api/types/actionLog";
import BaseModal from "../../components/modal/BASE/modalCRUBase";
import { useAuth } from "../../сontext/AuthContext";

const PAGE_SIZE = 25;

const ACTIONS = [
  { value: "", label: "Все действия" },
  { value: "created", label: "Создание" },
  { value: "updated", label: "Изменение" },
  { value: "deleted", label: "Удаление" },
];

const formatMoment = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

// Значения из снимка приходят как есть: числа, даты, перечисления. Приводим
// к человеческому виду, не теряя того, что в них было.
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "да" : "нет";
  if (typeof value === "string") {
    const asDate = /^\d{4}-\d{2}-\d{2}T/.test(value) ? new Date(value) : null;
    if (asDate && !Number.isNaN(asDate.getTime())) return formatMoment(value);
    return value;
  }
  if (typeof value === "number") return new Intl.NumberFormat("ru-RU").format(value);
  return JSON.stringify(value);
};

const isChange = (value: unknown): value is { was: unknown; now: unknown } =>
  typeof value === "object" &&
  value !== null &&
  ("was" in (value as object) || "now" in (value as object));

const ActionLogPage = () => {
  const { getPage, getEntities, getById, isLoading } = useActionLog();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("суперадмин");

  const [records, setRecords] = useState<ActionLogRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [entities, setEntities] = useState<ActionLogEntity[]>([]);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [details, setDetails] = useState<ActionLogDetails | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      entity: entity || undefined,
      action: action || undefined,
      search: search.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [page, entity, action, search, dateFrom, dateTo]
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

  const openDetails = async (record: ActionLogRecord) => {
    if (!record.hasDetails) return;
    const full = await getById(record.id);
    if (full) setDetails(full);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const payloadEntries = details?.payload ? Object.entries(details.payload) : [];

  return (
    <Wrapper>
      <Filters>
        <Field>
          <Label>С даты</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </Field>
        <Field>
          <Label>По дату</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </Field>
        <Field>
          <Label>Объект</Label>
          <Select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все объекты</option>
            {entities.map((item) => (
              <option key={item.entity} value={item.entity}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Действие</Label>
          <Select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            {ACTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field $wide>
          <Label>Поиск</Label>
          <Input
            type="text"
            placeholder="Номер договора, имя клиента, сумма"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </Field>
      </Filters>

      {isLoading && records.length === 0 ? (
        <Muted>Загрузка…</Muted>
      ) : records.length === 0 ? (
        <Muted>За выбранный период записей нет.</Muted>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Когда</Th>
              <Th>Кто</Th>
              {isSuperAdmin && <Th>Компания</Th>}
              <Th>Что сделал</Th>
              <Th>Объект</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <Row
                key={record.id}
                $clickable={record.hasDetails}
                onClick={() => openDetails(record)}
              >
                <Td>{formatMoment(record.createdAt)}</Td>
                <Td>{record.employeeName}</Td>
                {isSuperAdmin && <Td>{record.companyName || "—"}</Td>}
                <Td>
                  <Action $action={record.action}>{record.actionName}</Action>{" "}
                  {record.entityName}
                </Td>
                <Td>
                  {record.title || "—"}
                  {record.entityId && <Dim> №{record.entityId}</Dim>}
                </Td>
                <Td>{record.hasDetails && <Dim>подробнее</Dim>}</Td>
              </Row>
            ))}
          </tbody>
        </Table>
      )}

      {totalPages > 1 && (
        <Pager>
          <PagerButton
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Назад
          </PagerButton>
          <Muted>
            Страница {page} из {totalPages}, всего {totalCount}
          </Muted>
          <PagerButton
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Вперёд
          </PagerButton>
        </Pager>
      )}

      {details && (
        <BaseModal
          isOpen={true}
          title={`${details.employeeName} ${details.actionName} ${details.entityName}`}
          onClose={() => setDetails(null)}
          onCancel={() => setDetails(null)}
          hideSaveButton
          cancelButtonText="Закрыть"
          width="620px"
        >
          <ModalBody>
            <ModalHead>
              {formatMoment(details.createdAt)}
              {details.title && ` · ${details.title}`}
              {details.entityId && ` · №${details.entityId}`}
            </ModalHead>

            {payloadEntries.length === 0 ? (
              <Muted>Подробностей не сохранилось.</Muted>
            ) : (
              <DetailsTable>
                <tbody>
                  {payloadEntries.map(([field, value]) => (
                    <tr key={field}>
                      <DetailsField>{field}</DetailsField>
                      <DetailsValue>
                        {isChange(value) ? (
                          <>
                            <Was>{formatValue(value.was)}</Was>
                            <Arrow>→</Arrow>
                            <Now>{formatValue(value.now)}</Now>
                          </>
                        ) : (
                          formatValue(value)
                        )}
                      </DetailsValue>
                    </tr>
                  ))}
                </tbody>
              </DetailsTable>
            )}
          </ModalBody>
        </BaseModal>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 16px 0 32px;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
`;

const Field = styled.div<{ $wide?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: ${({ $wide }) => ($wide ? "1 1 240px" : "0 0 auto")};
`;

const Label = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const Input = styled.input`
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  font-size: 14px;
  color: #344054;
  width: 100%;
  box-sizing: border-box;
`;

const Select = styled.select`
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  font-size: 14px;
  color: #344054;
  background: #fff;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const Row = styled.tr<{ $clickable?: boolean }>`
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    background: ${({ $clickable }) => ($clickable ? "#f9fafb" : "transparent")};
  }
`;

const Td = styled.td`
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
`;

const Action = styled.span<{ $action: string }>`
  font-weight: 600;
  color: ${({ $action }) =>
    $action === "deleted" ? "#b91c1c" : $action === "created" ? "#047857" : "#2563eb"};
`;

const Dim = styled.span`
  color: #9ca3af;
  font-size: 13px;
`;

const Muted = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const Pager = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
`;

const PagerButton = styled.button`
  padding: 8px 14px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
`;

const ModalHead = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const DetailsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const DetailsField = styled.td`
  padding: 7px 10px 7px 0;
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  vertical-align: top;
  width: 40%;
`;

const DetailsValue = styled.td`
  padding: 7px 0;
  font-size: 14px;
  color: #111827;
  word-break: break-word;
`;

const Was = styled.span`
  color: #b91c1c;
  text-decoration: line-through;
`;

const Arrow = styled.span`
  margin: 0 6px;
  color: #9ca3af;
`;

const Now = styled.span`
  color: #047857;
  font-weight: 600;
`;

export default ActionLogPage;

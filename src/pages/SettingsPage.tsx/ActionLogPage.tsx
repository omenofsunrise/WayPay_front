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

// Дата дня для заголовка группы: «Сегодня», «Вчера» или «16 октября».
const dayTitle = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(date, today)) return "Сегодня";
  if (sameDay(date, yesterday)) return "Вчера";

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

const timeOnly = (value: string) =>
  new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

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

  // Записи приходят по убыванию времени, остаётся разложить их по дням.
  const groups = useMemo(() => {
    const byDay = new Map<string, ActionLogRecord[]>();

    records.forEach((record) => {
      const day = dayTitle(record.createdAt);
      const list = byDay.get(day) ?? [];
      list.push(record);
      byDay.set(day, list);
    });

    return Array.from(byDay.entries());
  }, [records]);

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
        groups.map(([day, dayRecords]) => (
          <Group key={day}>
            <DayTitle>{day}</DayTitle>
            {dayRecords.map((record) => (
              <Line
                key={record.id}
                $clickable={record.hasDetails}
                onClick={() => openDetails(record)}
              >
                <Time>{timeOnly(record.createdAt)}</Time>
                <Sentence>
                  <Who>{record.employeeName}</Who> {record.actionName}{" "}
                  <Action $action={record.action}>
                    {record.entityNameAccusative}
                  </Action>
                  {record.entityId && <Dim> № {record.entityId}</Dim>}
                  {record.title && <Subject> — {record.title}</Subject>}
                  {isSuperAdmin && record.companyName && (
                    <Dim> · {record.companyName}</Dim>
                  )}
                </Sentence>
                {record.hasDetails && <Toggle>подробнее</Toggle>}
              </Line>
            ))}
          </Group>
        ))
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
              {dayTitle(details.createdAt)}, {timeOnly(details.createdAt)}
              {details.title && ` · ${details.title}`}
              {details.entityId && ` · № ${details.entityId}`}
            </ModalHead>

            <ActionLogFields fields={details.fields ?? []} />
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





const Action = styled.span<{ $action: string }>`
  font-weight: 600;
  color: ${({ $action }) =>
    $action === "deleted" ? "#b91c1c" : $action === "created" ? "#047857" : "#2563eb"};
`;

const Dim = styled.span`
  color: #9ca3af;
  font-size: 13px;
`;

const Group = styled.div`
  margin-bottom: 18px;
`;

const DayTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
`;

const Line = styled.div<{ $clickable?: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid #eef0f3;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 6px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    background: ${({ $clickable }) => ($clickable ? "#f9fafb" : "#fff")};
  }
`;

const Time = styled.span`
  flex: 0 0 44px;
  font-size: 13px;
  color: #9ca3af;
`;

const Sentence = styled.span`
  flex: 1;
  font-size: 14px;
  color: #111827;
  line-height: 1.4;
`;

const Who = styled.span`
  font-weight: 600;
`;

const Subject = styled.span`
  color: #374151;
`;

const Toggle = styled.span`
  color: #9ca3af;
  font-size: 13px;
  white-space: nowrap;
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







export default ActionLogPage;

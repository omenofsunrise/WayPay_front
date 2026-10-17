import { useEffect, useState } from "react";
import styled from "styled-components";
import useActionLog from "../../api/hooks/useActionLog";
import type { ActionLogDetails } from "../../api/types/actionLog";
import { useAuth } from "../../сontext/AuthContext";

interface Props {
  // Как объект называется в коде: Credit, Payment, Client.
  entity: string;
  entityId?: string | number | null;
}

const formatMoment = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

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

/**
 * История одного объекта: кто его создавал, менял и удалял. Журнал доступен
 * только директору и суперадмину, поэтому остальным ничего не показываем —
 * иначе человек увидел бы пустой блок и решил, что история пропала.
 */
const EntityHistory = ({ entity, entityId }: Props) => {
  const { getForEntity } = useActionLog();
  const { hasRole } = useAuth();
  const allowed = hasRole("директор") || hasRole("суперадмин");

  const [records, setRecords] = useState<ActionLogDetails[]>([]);
  const [status, setStatus] = useState<"loading" | "done">("loading");
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (!allowed || !entityId) return;

    let cancelled = false;
    setStatus("loading");

    getForEntity(entity, String(entityId)).then((result) => {
      if (cancelled) return;
      setRecords(result);
      setStatus("done");
    });

    return () => {
      cancelled = true;
    };
  }, [allowed, entity, entityId, getForEntity]);

  if (!allowed) return null;

  if (status === "loading") return <Muted>Загрузка истории…</Muted>;

  if (records.length === 0)
    return <Muted>Записей нет: журнал ведётся с момента его включения.</Muted>;

  return (
    <List>
      {records.map((record) => {
        const entries = record.payload ? Object.entries(record.payload) : [];
        const isOpen = openId === record.id;

        return (
          <Item key={record.id}>
            <Head
              type="button"
              onClick={() => setOpenId(isOpen ? null : record.id)}
              $clickable={entries.length > 0}
            >
              <Moment>{formatMoment(record.createdAt)}</Moment>
              <Who>{record.employeeName}</Who>
              <Action $action={record.action}>{record.actionName}</Action>
              {entries.length > 0 && <Toggle>{isOpen ? "скрыть" : "подробнее"}</Toggle>}
            </Head>

            {isOpen && entries.length > 0 && (
              <Details>
                {entries.map(([field, value]) => (
                  <DetailsRow key={field}>
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
                  </DetailsRow>
                ))}
              </Details>
            )}
          </Item>
        );
      })}
    </List>
  );
};

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  background: #fff;
  overflow: hidden;
`;

const Head = styled.button<{ $clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  text-align: left;
  font-size: 14px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
`;

const Moment = styled.span`
  color: #6b7280;
  font-size: 13px;
  white-space: nowrap;
`;

const Who = styled.span`
  color: #111827;
  font-weight: 500;
`;

const Action = styled.span<{ $action: string }>`
  font-weight: 600;
  color: ${({ $action }) =>
    $action === "deleted" ? "#b91c1c" : $action === "created" ? "#047857" : "#2563eb"};
`;

const Toggle = styled.span`
  margin-left: auto;
  color: #9ca3af;
  font-size: 13px;
`;

const Details = styled.div`
  padding: 4px 12px 12px;
  border-top: 1px solid #f3f4f6;
`;

const DetailsRow = styled.div`
  display: flex;
  gap: 10px;
  padding: 5px 0;
`;

const DetailsField = styled.div`
  flex: 0 0 40%;
  font-size: 13px;
  color: #6b7280;
`;

const DetailsValue = styled.div`
  flex: 1;
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

const Muted = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

export default EntityHistory;

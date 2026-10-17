import { useEffect, useState } from "react";
import styled from "styled-components";
import useActionLog from "../../api/hooks/useActionLog";
import type { ActionLogDetails } from "../../api/types/actionLog";
import ActionLogFields from "./ActionLogFields";
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
        const hasFields = (record.fields ?? []).length > 0;
        const isOpen = openId === record.id;

        return (
          <Item key={record.id}>
            <Head
              type="button"
              onClick={() => setOpenId(isOpen ? null : record.id)}
              $clickable={hasFields}
            >
              <Moment>{formatMoment(record.createdAt)}</Moment>
              <Who>{record.employeeName}</Who>
              <Action $action={record.action}>{record.actionName}</Action>
              {hasFields && <Toggle>{isOpen ? "скрыть" : "подробнее"}</Toggle>}
            </Head>

            {isOpen && hasFields && (
              <Details>
                <ActionLogFields fields={record.fields} />
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







const Muted = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

export default EntityHistory;

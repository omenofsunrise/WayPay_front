import { useState } from "react";
import styled from "styled-components";
import type { ActionLogField } from "../../api/types/actionLog";

interface Props {
  fields: ActionLogField[];
}

/**
 * Поля записи журнала. Понятное показываем сразу, служебное — по кнопке:
 * внутренние идентификаторы и признаки нужны редко, а мешают всегда.
 */
const ActionLogFields = ({ fields }: Props) => {
  const [showAll, setShowAll] = useState(false);

  const plain = fields.filter((field) => !field.technical);
  const technical = fields.filter((field) => field.technical);
  const visible = showAll ? [...plain, ...technical] : plain;

  if (fields.length === 0) return <Muted>Подробностей не сохранилось.</Muted>;

  return (
    <>
      {visible.length === 0 ? (
        <Muted>Понятных полей нет, посмотрите служебные.</Muted>
      ) : (
        <Rows>
          {visible.map((field) => (
            <Row key={field.field}>
              <Name $technical={field.technical}>{field.name}</Name>
              <Value>
                {field.isChange ? (
                  <>
                    <Was>{field.was || "—"}</Was>
                    <Arrow>→</Arrow>
                    <Now>{field.now || "—"}</Now>
                  </>
                ) : (
                  field.now || "—"
                )}
              </Value>
            </Row>
          ))}
        </Rows>
      )}

      {technical.length > 0 && (
        <Toggle type="button" onClick={() => setShowAll((value) => !value)}>
          {showAll
            ? "скрыть служебные поля"
            : `показать все поля (ещё ${technical.length})`}
        </Toggle>
      )}
    </>
  );
};

const Rows = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);

  &:last-child {
    border-bottom: 0;
  }
`;

const Name = styled.div<{ $technical?: boolean }>`
  flex: 0 0 42%;
  font-size: 13px;
  color: ${({ $technical }) => ($technical ? "#9ca3af" : "#6b7280")};
`;

const Value = styled.div`
  flex: 1;
  font-size: 14px;
  color: #111827;
  word-break: break-word;
`;

const Was = styled.span`
  color: #b71c1c;
  text-decoration: line-through;
`;

const Arrow = styled.span`
  margin: 0 6px;
  color: #9ca3af;
`;

const Now = styled.span`
  color: #007d88;
  font-weight: 600;
`;

const Muted = styled.div`
  font-size: 14px;
  color: rgba(80, 85, 92, 1);
`;

const Toggle = styled.button`
  margin-top: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #007d88;
  font-size: 13px;
  cursor: pointer;
`;

export default ActionLogFields;

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import useClientFeedback from "../../api/hooks/useClientFeedback";
import { FEEDBACK_MARK_OPTIONS } from "../../api/types/clientFeedback";
import type { FeedbackMark } from "../../api/types/clientFeedback";
import BaseModal from "./BASE/modalCRUBase";

interface ClientFeedbackModalProps {
  isOpen: boolean;
  clientId: number | null;
  clientName?: string;
  onClose: () => void;
}

const ClientFeedbackModal: React.FC<ClientFeedbackModalProps> = ({
  isOpen,
  clientId,
  clientName,
  onClose,
}) => {
  const { createFeedback, isSubmitting } = useClientFeedback();
  const [mark, setMark] = useState<FeedbackMark | null>(null);
  const [stars, setStars] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  // Сброс состояния при каждом открытии.
  useEffect(() => {
    if (isOpen) {
      setMark(null);
      setStars(0);
      setComment("");
    }
  }, [isOpen]);

  if (!isOpen || !clientId) return null;

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!mark) return;
    const ok = await createFeedback({
      clientId,
      mark,
      stars: stars || undefined,
      comment: comment.trim() || undefined,
    });
    if (ok) onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title="Как прошёл клиент?"
      subtitle={clientName || "Оцените взаимодействие с клиентом"}
      appearance="compact-form"
      width="500px"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSave}
      cancelButtonText="Пропустить"
      saveButtonText="Отправить"
      isSaveDisabled={!mark || !stars}
      isSubmitting={isSubmitting}
      submittingText="Отправка…"
    >
      <Card>
        <Hint>
          Последний платёж по договору. Оцените клиента в пару кликов.
        </Hint>

        <Marks>
          {FEEDBACK_MARK_OPTIONS.map((opt) => (
            <MarkChip
              key={opt.value}
              type="button"
              $active={mark === opt.value}
              $positive={opt.positive}
              onClick={() => setMark(opt.value)}
            >
              {opt.label}
            </MarkChip>
          ))}
        </Marks>

        <Stars>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              type="button"
              $filled={n <= stars}
              onClick={() => setStars(n === stars ? 0 : n)}
              aria-label={`${n} звёзд`}
            >
              ★
            </Star>
          ))}
        </Stars>

        <CommentField
          placeholder="Комментарий (необязательно)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

      </Card>
    </BaseModal>
  );
};

const Card = styled.div`
  padding: 6px 34px 24px;
  text-align: left;
`;

const Hint = styled.div`
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
`;

const Marks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 4px;
`;

const MarkChip = styled.button<{ $active: boolean; $positive: boolean }>`
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid
    ${(p) => (p.$active ? (p.$positive ? "#10b981" : "#ef4444") : "#d1d5db")};
  background: ${(p) =>
    p.$active ? (p.$positive ? "#10b981" : "#ef4444") : "#fff"};
  color: ${(p) => (p.$active ? "#fff" : "#374151")};

  &:hover {
    border-color: ${(p) => (p.$positive ? "#10b981" : "#ef4444")};
  }
`;

const Stars = styled.div`
  display: flex;
  gap: 4px;
  margin: 14px 0 12px;
`;

const Star = styled.button<{ $filled: boolean }>`
  background: none;
  border: none;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  color: ${(p) => (p.$filled ? "#f59e0b" : "#d1d5db")};
  transition: color 0.15s ease;
`;

const CommentField = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  min-height: 56px;
  resize: vertical;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #111827;
  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

export default ClientFeedbackModal;

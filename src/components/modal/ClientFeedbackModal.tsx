import React, { useEffect, useState } from "react";
import styled from "styled-components";
import useClientFeedback from "../../api/hooks/useClientFeedback";
import { FEEDBACK_MARK_OPTIONS } from "../../api/types/clientFeedback";
import type { FeedbackMark } from "../../api/types/clientFeedback";

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

  const handleSave = async () => {
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
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Как прошёл клиент?</Title>
          <Close onClick={onClose}>×</Close>
        </Header>
        {clientName && <Subtitle>{clientName}</Subtitle>}
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

        <Actions>
          <SkipButton type="button" onClick={onClose}>
            Пропустить
          </SkipButton>
          <SaveButton
            type="button"
            onClick={handleSave}
            disabled={!mark || isSubmitting}
          >
            {isSubmitting ? "Сохранение…" : "Сохранить"}
          </SaveButton>
        </Actions>
      </Card>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 22px;
  width: 440px;
  max-width: 92vw;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;

const Close = styled.button`
  background: none;
  border: none;
  font-size: 26px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  &:hover {
    color: #111827;
  }
`;

const Subtitle = styled.div`
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #007d88;
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

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
`;

const SkipButton = styled.button`
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    background: #f3f4f6;
  }
`;

const SaveButton = styled.button`
  padding: 9px 18px;
  border-radius: 8px;
  border: none;
  background: #007d88;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #005f66;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default ClientFeedbackModal;

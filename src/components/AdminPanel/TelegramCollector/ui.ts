import styled from "styled-components";

// Общие стили страницы «Telegram → ЧС+» — в духе соседних вкладок админ-панели.

export const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Произошла ошибка";
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
};

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const Muted = styled.div`
  color: #667085;
  font-size: 13px;
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid #e4e7ec;
  border-radius: 10px;
  background: #fff;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const Title = styled.div`
  color: #101828;
  font-size: 16px;
  font-weight: 600;
`;

export const Badges = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export type BadgeTone = "green" | "red" | "gray" | "teal" | "amber";

const tones: Record<BadgeTone, [string, string]> = {
  green: ["#067647", "#ecfdf3"],
  red: ["#b42318", "#fef3f2"],
  gray: ["#475467", "#f2f4f7"],
  teal: ["#007d88", "#e6f3f4"],
  amber: ["#b54708", "#fffaeb"],
};

export const Badge = styled.span<{ $tone: BadgeTone }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  color: ${({ $tone }) => tones[$tone][0]};
  background: ${({ $tone }) => tones[$tone][1]};
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  button {
    width: auto;
    padding: 0 16px;
    min-height: 38px;
  }
`;

export const SecondaryButton = styled.button<{ $danger?: boolean }>`
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid ${({ $danger }) => ($danger ? "#fecdca" : "#d0d5dd")};
  border-radius: 8px;
  color: ${({ $danger }) => ($danger ? "#b42318" : "#344054")};
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ $danger }) => ($danger ? "#fef3f2" : "#f9fafb")};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const SuccessMessage = styled.div`
  padding: 11px 14px;
  border: 1px solid #abefc6;
  border-radius: 8px;
  color: #067647;
  background: #ecfdf3;
  font-size: 14px;
`;

export const ErrorMessage = styled.div`
  padding: 11px 14px;
  border: 1px solid #fecdca;
  border-radius: 8px;
  color: #b42318;
  background: #fef3f2;
  font-size: 14px;
`;

export const Empty = styled.div`
  padding: 40px 16px;
  border: 1px dashed #e4e7ec;
  border-radius: 10px;
  color: #667085;
  background: #f9fafb;
  font-size: 14px;
  text-align: center;
`;

export const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 30px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  color: #344054;
  font-size: 13px;
  font-weight: 600;
`;

export const Hint = styled.div`
  color: #667085;
  font-size: 12px;
  line-height: 1.4;
`;

export const TextArea = styled.textarea`
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

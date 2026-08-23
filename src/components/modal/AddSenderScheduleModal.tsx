import React, { useEffect, useState } from "react";
import styled from "styled-components";
import BaseModal from "./BASE/modalCRUBase";
import CustomInput from "../ui/fields/CustomInput";
import type {
  CreateSenderSetting,
  SenderSettingResponse,
} from "../../api/types/sender";
import {
  buildSenderSetting,
  isDuplicateSetting,
} from "../../api/utils/senderSchedule";
import type { ScheduleType } from "../../api/utils/senderSchedule";

// ─── Icons ────────────────────────────────────────────────────────────────────

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 2v4M8 2v4M3 10h18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 16l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 9v4M12 17h.01"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface TypeOption {
  type: ScheduleType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  needsDays: boolean;
  daysLabel: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: "upcoming",
    title: "Предстоящий",
    subtitle: "Напомнить заранее",
    icon: <BellIcon />,
    needsDays: true,
    daysLabel: "За сколько дней до платежа отправить напоминание?",
  },
  {
    type: "onDay",
    title: "В день платежа",
    subtitle: "В день оплаты",
    icon: <CalendarIcon />,
    needsDays: false,
    daysLabel: "",
  },
  {
    type: "overdue",
    title: "Просрочка",
    subtitle: "После пропуска",
    icon: <AlertIcon />,
    needsDays: true,
    daysLabel: "Через сколько дней после платежа сообщить о просрочке?",
  },
];

interface AddSenderScheduleModalProps {
  isOpen: boolean;
  existing: SenderSettingResponse[];
  onClose: () => void;
  onConfirm: (setting: CreateSenderSetting) => Promise<void> | void;
}

const AddSenderScheduleModal: React.FC<AddSenderScheduleModalProps> = ({
  isOpen,
  existing,
  onClose,
  onConfirm,
}) => {
  const [selectedType, setSelectedType] = useState<ScheduleType | null>(null);
  const [days, setDays] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setDays(1);
      setIsSaving(false);
    }
  }, [isOpen]);

  const option = TYPE_OPTIONS.find((o) => o.type === selectedType) ?? null;
  const setting = selectedType ? buildSenderSetting(selectedType, days) : null;
  const duplicate = setting ? isDuplicateSetting(existing, setting) : false;
  const daysInvalid =
    !!option?.needsDays && (!Number.isFinite(days) || days < 1);
  const canConfirm = !!selectedType && !daysInvalid && !duplicate && !isSaving;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm || !setting) return;
    setIsSaving(true);
    try {
      await onConfirm(setting);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal
      title="Добавить рассылку"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleConfirm}
      isSaveDisabled={!canConfirm}
      isSubmitting={isSaving}
      saveButtonText="Добавить"
      width="480px"
    >
      <ModalBody>
        <SectionLabel>Когда отправлять сообщение?</SectionLabel>
        <CardGrid>
          {TYPE_OPTIONS.map((opt) => (
            <TypeCard
              key={opt.type}
              type="button"
              $active={selectedType === opt.type}
              onClick={() => setSelectedType(opt.type)}
            >
              <CardIcon $active={selectedType === opt.type}>
                {opt.icon}
              </CardIcon>
              <CardTitle>{opt.title}</CardTitle>
              <CardSubtitle>{opt.subtitle}</CardSubtitle>
            </TypeCard>
          ))}
        </CardGrid>

        {option?.needsDays && (
          <DaysSection>
            <SectionLabel>{option.daysLabel}</SectionLabel>
            <DaysRow>
              <DaysInputWrapper>
                <CustomInput
                  type="number"
                  inputType="number"
                  value={Number.isFinite(days) ? days.toString() : ""}
                  onChange={(e) => setDays(parseInt(e.target.value, 10))}
                  min={1}
                />
              </DaysInputWrapper>
              <DaysSuffix>дн.</DaysSuffix>
            </DaysRow>
          </DaysSection>
        )}

        {selectedType === "onDay" && (
          <HintBox>
            Сообщение придёт клиенту в день, когда нужно внести платёж.
          </HintBox>
        )}

        {duplicate && <ErrorBox>Такая рассылка уже добавлена.</ErrorBox>}
      </ModalBody>
    </BaseModal>
  );
};

// ─── Styled components ─────────────────────────────────────────────────────────

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 24px 8px;
`;

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const TypeCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$active ? "rgba(0, 125, 136, 1)" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "rgba(0, 125, 136, 0.06)" : "white")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(0, 125, 136, 0.6);
  }
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid rgba(0, 125, 136, 1);
    outline-offset: 2px;
  }
`;

const CardIcon = styled.div<{ $active: boolean }>`
  color: ${(p) => (p.$active ? "rgba(0, 125, 136, 1)" : "#6b7280")};
  display: flex;
`;

const CardTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
`;

const CardSubtitle = styled.div`
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
`;

const DaysSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DaysRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DaysInputWrapper = styled.div`
  width: 100px;

  input {
    max-width: none !important;
  }
`;

const DaysSuffix = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const HintBox = styled.div`
  font-size: 13px;
  color: #50555c;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 10px 12px;
`;

const ErrorBox = styled.div`
  font-size: 13px;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 12px;
`;

export default AddSenderScheduleModal;

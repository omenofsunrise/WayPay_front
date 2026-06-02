import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { BellRing, CalendarCheck, AlertTriangle } from "lucide-react";
import DarkCyanButton from "../ui/Buttons/DarkCyanButton";
import GrayButton from "../ui/Buttons/GrayButton";
import type {
  CreateSenderSetting,
  SenderSettingResponse,
} from "../../api/types/sender";
import {
  buildSenderSetting,
  isDuplicateSetting,
} from "../../api/utils/senderSchedule";
import type { ScheduleType } from "../../api/utils/senderSchedule";

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
    icon: <BellRing size={24} />,
    needsDays: true,
    daysLabel: "За сколько дней до платежа отправить напоминание?",
  },
  {
    type: "onDay",
    title: "В день платежа",
    subtitle: "В день оплаты",
    icon: <CalendarCheck size={24} />,
    needsDays: false,
    daysLabel: "",
  },
  {
    type: "overdue",
    title: "Просрочка",
    subtitle: "После пропуска",
    icon: <AlertTriangle size={24} />,
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

  if (!isOpen) return null;

  const option = TYPE_OPTIONS.find((o) => o.type === selectedType) ?? null;
  const setting = selectedType ? buildSenderSetting(selectedType, days) : null;
  const duplicate = setting ? isDuplicateSetting(existing, setting) : false;
  const daysInvalid =
    !!option?.needsDays && (!Number.isFinite(days) || days < 1);
  const canConfirm = !!selectedType && !daysInvalid && !duplicate && !isSaving;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = async () => {
    if (!canConfirm || !setting) return;
    setIsSaving(true);
    try {
      await onConfirm(setting);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>Добавить рассылку</ModalHeader>
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
                <DaysInput
                  type="number"
                  min={1}
                  value={Number.isFinite(days) ? days : ""}
                  onChange={(e) => setDays(parseInt(e.target.value, 10))}
                />
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
        <ModalFooter>
          <GrayButton onClick={onClose} disabled={isSaving}>
            Отмена
          </GrayButton>
          <DarkCyanButton onClick={handleConfirm} disabled={!canConfirm}>
            {isSaving ? "Добавление..." : "Добавить"}
          </DarkCyanButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 460px;
  max-width: 90%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const ModalBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const SectionLabel = styled.div`
  font-size: 14px;
  color: #50555c;
  font-weight: 500;
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
  border: 2px solid
    ${(props) => (props.$active ? "rgba(0, 125, 136, 1)" : "#e5e7eb")};
  background-color: ${(props) =>
    props.$active ? "rgba(0, 125, 136, 0.06)" : "white"};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(0, 125, 136, 0.6);
  }
`;

const CardIcon = styled.div<{ $active: boolean }>`
  color: ${(props) => (props.$active ? "rgba(0, 125, 136, 1)" : "#6b7280")};
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

const DaysInput = styled.input`
  width: 90px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #007d88;
    box-shadow: 0 0 0 3px rgba(0, 125, 136, 0.1);
  }
`;

const DaysSuffix = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const HintBox = styled.div`
  font-size: 13px;
  color: #50555c;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 10px 12px;
`;

const ErrorBox = styled.div`
  font-size: 13px;
  color: #b91c1c;
  background-color: #fef2f2;
  border-radius: 8px;
  padding: 10px 12px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export default AddSenderScheduleModal;

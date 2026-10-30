import { useEffect, useState } from "react";
import styled from "styled-components";

import type {
  ExcellBackupSubscription,
  Messenger,
} from "../../../api/types/excellBackup";
import DarkCyanButton from "../../../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../../../components/ui/fields/CustomInput";

interface MessengerMeta {
  label: string;
  icon: string;
  placeholder: string;
  hint: string;
}

const MESSENGER_META: Record<Messenger, MessengerMeta> = {
  Telegram: {
    label: "Telegram",
    icon: "✈️",
    placeholder: "@username или +7 999 123-45-67",
    hint: "Например: @ivan_petrov или +7 999 123-45-67",
  },
  WhatsApp: {
    label: "WhatsApp",
    icon: "💬",
    placeholder: "+7 999 123-45-67",
    hint: "Номер телефона в международном формате, например: +7 999 123-45-67",
  },
  Email: {
    label: "Почта",
    icon: "✉️",
    placeholder: "name@example.com",
    hint: "Email-адрес, например: backups@company.ru",
  },
};

interface Props {
  messenger: Messenger;
  subscription: ExcellBackupSubscription | null;
  isSaving: boolean;
  onSave: (contact: string) => Promise<void>;
  onDelete: () => void;
}

const MessengerBackupCard = ({
  messenger,
  subscription,
  isSaving,
  onSave,
  onDelete,
}: Props) => {
  const meta = MESSENGER_META[messenger];
  const isConfigured = !!subscription;

  const [isEditing, setIsEditing] = useState(false);
  const [contact, setContact] = useState(subscription?.contact ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setContact(subscription?.contact ?? "");
    setIsEditing(false);
    setLocalError(null);
  }, [subscription]);

  const showInput = isEditing || !isConfigured;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = contact.trim();
    if (!trimmed) {
      setLocalError("Укажите контакт");
      return;
    }
    setLocalError(null);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      // ошибка уже показана тостом в родителе — остаёмся в режиме ввода
    }
  };

  const handleCancel = () => {
    setContact(subscription?.contact ?? "");
    setLocalError(null);
    setIsEditing(false);
  };

  return (
    <Card>
      <Header>
        <MessengerName>
          <Icon>{meta.icon}</Icon>
          {meta.label}
        </MessengerName>
        <StatusBadge $active={isConfigured}>
          {isConfigured ? "Активно" : "Не настроено"}
        </StatusBadge>
      </Header>

      <Divider />

      {showInput ? (
        <Form onSubmit={handleSave}>
          <Label>Контакт</Label>
          <CustomInput
            inputType="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={meta.placeholder}
            autoFocus={!isConfigured}
          />
          <HintText>{meta.hint}</HintText>
          {localError && <ErrorText>{localError}</ErrorText>}
          <Actions>
            <DarkCyanButton
              type="submit"
              disabled={isSaving}
              style={{ width: "auto", padding: "10px 20px" }}
            >
              {isSaving
                ? "Сохранение..."
                : isConfigured
                ? "Сохранить"
                : "Подключить"}
            </DarkCyanButton>
            {isConfigured && (
              <SecondaryButton
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Отмена
              </SecondaryButton>
            )}
          </Actions>
        </Form>
      ) : (
        <ViewMode>
          <ContactRow>
            <ContactLabel>Контакт:</ContactLabel>
            <ContactValue>{subscription!.contact}</ContactValue>
          </ContactRow>
          <Actions>
            <SecondaryButton
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
            >
              Изменить
            </SecondaryButton>
            <DangerButton type="button" onClick={onDelete} disabled={isSaving}>
              Отключить
            </DangerButton>
          </Actions>
        </ViewMode>
      )}
    </Card>
  );
};

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const MessengerName = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const Icon = styled.span`
  font-size: 22px;
  line-height: 1;
`;

const StatusBadge = styled.span<{ $active?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${(p) => (p.$active ? "rgba(16, 185, 129, 0.12)" : "#f3f4f6")};
  color: ${(p) => (p.$active ? "#047857" : "#6b7280")};
  white-space: nowrap;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const HintText = styled.p`
  margin: 0;
  font-size: 12.5px;
  color: #6b7280;
  line-height: 1.5;
`;

const ErrorText = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  color: #b71c1c;
  font-size: 13px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`;

const SecondaryButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(SecondaryButton)`
  color: #b91c1c;
  border-color: #fecaca;

  &:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #f87171;
  }
`;

const ViewMode = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ContactRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
`;

const ContactLabel = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

const ContactValue = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  word-break: break-all;
`;

export default MessengerBackupCard;
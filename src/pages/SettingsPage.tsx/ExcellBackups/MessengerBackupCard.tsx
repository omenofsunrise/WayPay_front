import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import styled from "styled-components";

import type {
  ExcellBackupSubscription,
  Messenger,
} from "../../../api/types/excellBackup";
import DarkCyanButton from "../../../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../../../components/ui/fields/CustomInput";
import { normalizeContact, validateContact } from "./contactValidation";

interface MessengerMeta {
  label: string;
  icon: string;
  placeholder: string;
  hint: string;
  instruction: ReactNode;
}

const TelegramInstructions = () => (
  <InstructionDetails>
    <InstructionSummary>Как узнать свой Telegram ID</InstructionSummary>
    <InstructionBody>
      <ol>
        <li>
          Откройте Telegram и найдите бота <code>@WayPay_Crm_bot</code>.
        </li>
        <li>Нажмите «/start» и дождитесь ответа.</li>
        <li>
          Бот пришлёт ваш числовой ID — например, <code>899491283</code>.
        </li>
        <li>Скопируйте это число и вставьте в поле выше.</li>
      </ol>
      <p>
        ID состоит только из цифр. Ник (@username), телефон и ссылка на профиль
        не подходят.
      </p>
    </InstructionBody>
  </InstructionDetails>
);

const WhatsAppInstructions = () => (
  <InstructionBlock>
    <p>
      Укажите номер в международном формате: код страны и номер, только цифры.
    </p>
    <p>
      Например: <code>79999999999</code> (7 — код России).
    </p>
    <p>
      Номера в национальном формате (начинаются с 8) не подходят — замените 8
      на 7.
    </p>
  </InstructionBlock>
);

const EmailInstructions = () => (
  <InstructionBlock>
    <p>Укажите email, на который будут приходить выгрузки.</p>
    <p>
      Например: <code>ivane_mymail@yandex.ru</code> или{" "}
      <code>backups@company.ru</code>.
    </p>
  </InstructionBlock>
);

const MESSENGER_META: Record<Messenger, MessengerMeta> = {
  Telegram: {
    label: "Telegram",
    icon: "✈️",
    placeholder: "899491283",
    hint: "Числовой Telegram ID — только цифры, без @ и пробелов",
    instruction: <TelegramInstructions />,
  },
  WhatsApp: {
    label: "WhatsApp",
    icon: "💬",
    placeholder: "79999999999",
    hint: "Международный формат без + и пробелов: код страны + номер",
    instruction: <WhatsAppInstructions />,
  },
  Email: {
    label: "Почта",
    icon: "✉️",
    placeholder: "ivane_mymail@yandex.ru",
    hint: "Email, на который будут приходить выгрузки",
    instruction: <EmailInstructions />,
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
  const validate = validateContact[messenger];

  const handleChange = (value: string) => {
    setContact(value);
    if (localError) setLocalError(null);
  };

  const handleBlur = () => {
    const trimmed = contact.trim();
    if (!trimmed) return; // пустое поле не «ругаем» на blur, только на submit
    setLocalError(validate(trimmed));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = contact.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    try {
      await onSave(normalizeContact(messenger, trimmed));
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
        <Form onSubmit={handleSave} noValidate>
          <Label>Контакт</Label>
          <CustomInput
            inputType="text"
            value={contact}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={meta.placeholder}
            autoFocus={!isConfigured}
          />
          <HintText>{meta.hint}</HintText>
          {localError && <ErrorText>{localError}</ErrorText>}
          {meta.instruction}
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

/* ---------- styled ---------- */

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
  line-height: 1.45;
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

/* ---------- instructions ---------- */

const codeBase = `
  code {
    background: #eef2ff;
    color: #1e3a8a;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12.5px;
  }
`;

const InstructionBlock = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.55;

  p {
    margin: 0 0 6px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  ${codeBase}
`;

const InstructionDetails = styled.details`
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.55;
  overflow: hidden;
`;

const InstructionSummary = styled.summary`
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
  color: #1f2937;
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;

  &::-webkit-details-marker {
    display: none;
  }

  &::before {
    content: "▸";
    display: inline-block;
    color: #6b7280;
    transition: transform 0.15s ease;
  }

  details[open] > &::before {
    transform: rotate(90deg);
  }
`;

const InstructionBody = styled.div`
  padding: 10px 14px 14px;
  border-top: 1px solid #e5e7eb;

  ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }
  li {
    margin-bottom: 4px;
  }
  p {
    margin: 0;
  }
  ${codeBase}
`;

export default MessengerBackupCard;
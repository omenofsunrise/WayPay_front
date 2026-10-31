import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import styled from "styled-components";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { Check, ChevronRight, Mail, Pencil } from "lucide-react";

import type {
  ExcellBackupSubscription,
  Messenger,
} from "../../../api/types/excellBackup";
import WayPayButton from "../../../components/ui/Buttons/WayPayButton";
import { normalizeContact, validateContact } from "./contactValidation";

interface MessengerMeta {
  label: string;
  fieldLabel: string;
  placeholder: string;
  hint: string;
}

const MESSENGER_META: Record<Messenger, MessengerMeta> = {
  Telegram: {
    label: "Telegram",
    fieldLabel: "Telegram ID",
    placeholder: "899491283",
    hint: "Только цифры, без @ и пробелов",
  },
  WhatsApp: {
    label: "WhatsApp",
    fieldLabel: "Номер телефона",
    placeholder: "+7 (999) 999-99-99",
    hint: "Резервная копия придёт в WhatsApp.",
  },
  Email: {
    label: "Почта",
    fieldLabel: "Электронная почта",
    placeholder: "mail@company.ru",
    hint: "Резервная копия придёт на этот адрес.",
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
  const isConfigured = Boolean(subscription);
  const [isEditing, setIsEditing] = useState(false);
  const [contact, setContact] = useState(subscription?.contact ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setContact(subscription?.contact ?? "");
    setIsEditing(false);
    setLocalError(null);
  }, [subscription]);

  const validate = validateContact[messenger];
  const showInput = isEditing || !isConfigured;

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
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
      // Родитель показывает ошибку через toast. Оставляем форму открытой.
    }
  };

  const handleCancel = () => {
    setContact(subscription?.contact ?? "");
    setLocalError(null);
    setIsEditing(false);
  };

  return (
    <Card as="form" onSubmit={handleSave} noValidate>
      <CardHeader>
        <MessengerTitle>
          <MessengerIcon $messenger={messenger}>
            <MessengerGlyph messenger={messenger} />
          </MessengerIcon>
          <span>{meta.label}</span>
        </MessengerTitle>
        <StatusBadge $active={isConfigured}>
          {isConfigured && <Check aria-hidden="true" />}
          {isConfigured ? "Подключён" : "Не подключён"}
        </StatusBadge>
      </CardHeader>

      <Divider />

      <CardBody>
        <FieldLabel htmlFor={`backup-contact-${messenger}`}>
          {meta.fieldLabel}
        </FieldLabel>

        {showInput ? (
          <ContactInput
            id={`backup-contact-${messenger}`}
            value={contact}
            onChange={(event) => {
              setContact(event.target.value);
              if (localError) setLocalError(null);
            }}
            onBlur={() => {
              const trimmed = contact.trim();
              if (trimmed) setLocalError(validate(trimmed));
            }}
            placeholder={meta.placeholder}
            inputMode={messenger === "Email" ? "email" : "text"}
            autoComplete={messenger === "Email" ? "email" : "off"}
            $hasError={Boolean(localError)}
            autoFocus={isEditing}
          />
        ) : (
          <ContactValue>{formatContact(messenger, subscription!.contact)}</ContactValue>
        )}

        <HintText>{meta.hint}</HintText>
        {localError && <ErrorText>{localError}</ErrorText>}

        {messenger === "Telegram" && (
          <InstructionDetails>
            <InstructionSummary>
              <ChevronRight aria-hidden="true" />
              Как узнать Telegram ID
            </InstructionSummary>
            <InstructionBody>
              Откройте в Telegram бота <code>@WayPay_Crm_bot</code>, нажмите
              «/start» и вставьте полученный числовой ID в поле выше.
            </InstructionBody>
          </InstructionDetails>
        )}
      </CardBody>

      <CardActions $single={!isConfigured}>
        {showInput ? (
          <>
            <WayPayButton
              type="submit"
              variant="primary"
              loading={isSaving}
              fullWidth={!isConfigured}
            >
              {isConfigured ? "Сохранить" : `Подключить ${meta.label}`}
            </WayPayButton>
            {isConfigured && (
              <WayPayButton
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={handleCancel}
              >
                Отмена
              </WayPayButton>
            )}
          </>
        ) : (
          <>
            <WayPayButton
              type="button"
              variant="secondary"
              icon={<Pencil size={15} aria-hidden="true" />}
              disabled={isSaving}
              onClick={() => setIsEditing(true)}
            >
              Изменить
            </WayPayButton>
            <DisconnectButton
              type="button"
              disabled={isSaving}
              onClick={onDelete}
            >
              Отключить
            </DisconnectButton>
          </>
        )}
      </CardActions>
    </Card>
  );
};

const formatContact = (messenger: Messenger, value: string) => {
  if (messenger !== "WhatsApp") return value;

  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(
      7,
      9
    )}-${digits.slice(9, 11)}`;
  }

  return value.startsWith("+") ? value : `+${value}`;
};

const MessengerGlyph = ({ messenger }: { messenger: Messenger }) => {
  if (messenger === "Telegram") {
    return <FaTelegramPlane aria-hidden="true" />;
  }

  if (messenger === "WhatsApp") {
    return <FaWhatsapp aria-hidden="true" />;
  }

  return <Mail aria-hidden="true" />;
};

const Card = styled.div`
  min-width: 0;
  min-height: 360px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  border: 1px solid #dfe6ec;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.035);
`;

const CardHeader = styled.div`
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const MessengerTitle = styled.h3`
  min-width: 0;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
`;

const MessengerIcon = styled.span<{ $messenger: Messenger }>`
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${({ $messenger }) =>
    $messenger === "WhatsApp" ? "#e6f8ef" : "#e8f7f8"};
  color: ${({ $messenger }) =>
    $messenger === "WhatsApp" ? "#12a968" : "#008b98"};
  line-height: 0;

  svg {
    width: 24px;
    height: 24px;
    display: block;
    fill: ${({ $messenger }) => ($messenger === "Email" ? "none" : "currentColor")};
    stroke: ${({ $messenger }) => ($messenger === "Email" ? "currentColor" : "none")};
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  min-height: 32px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#e5f7f3" : "#f2f4f7")};
  color: ${({ $active }) => ($active ? "#00877f" : "#7b8496")};
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1;

  svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const Divider = styled.div`
  height: 1px;
  margin: 14px 0 18px;
  background: #e4e9ee;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const FieldLabel = styled.label`
  margin-bottom: 8px;
  color: #5f6f89;
  font-size: 13px;
  font-weight: 500;
`;

const ContactInput = styled.input<{ $hasError: boolean }>`
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  box-sizing: border-box;
  border: 1px solid ${({ $hasError }) => ($hasError ? "#dc2626" : "#cbd5df")};
  border-radius: 7px;
  outline: none;
  background: #fff;
  color: #172033;
  font: inherit;
  font-size: 14px;

  &:focus {
    border-color: #008b98;
    box-shadow: 0 0 0 2px rgba(0, 139, 152, 0.09);
  }

  &::placeholder {
    color: #9aa4b6;
  }
`;

const ContactValue = styled.div`
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border: 1px solid #d2dae3;
  border-radius: 7px;
  background: #fff;
  color: #172033;
  font-size: 14px;
  word-break: break-word;
`;

const HintText = styled.p`
  min-height: 18px;
  margin: 8px 0 0;
  color: #8a95a9;
  font-size: 12px;
  line-height: 1.45;
`;

const ErrorText = styled.div`
  margin-top: 8px;
  padding: 7px 9px;
  border-radius: 7px;
  background: #fff1f2;
  color: #b42318;
  font-size: 12px;
  line-height: 1.4;
`;

const InstructionDetails = styled.details`
  margin-top: 10px;
  color: #008792;
  font-size: 12px;
`;

const InstructionSummary = styled.summary`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  list-style: none;
  user-select: none;

  &::-webkit-details-marker {
    display: none;
  }

  svg {
    width: 13px;
    height: 13px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.15s ease;
  }

  details[open] & svg {
    transform: rotate(90deg);
  }
`;

const InstructionBody = styled.div`
  margin-top: 8px;
  padding: 9px 10px;
  border-radius: 7px;
  background: #f7fafb;
  color: #667085;
  line-height: 1.45;

  code {
    color: #007d88;
  }
`;

const CardActions = styled.div<{ $single: boolean }>`
  min-height: 58px;
  margin-top: auto;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: ${({ $single }) => ($single ? "stretch" : "space-between")};
  gap: 10px;
  border-top: 1px solid #e4e9ee;

  > button:first-child {
    ${({ $single }) => ($single ? "flex: 1;" : "min-width: 118px;")}
  }
`;

const DisconnectButton = styled.button`
  min-height: 36px;
  padding: 7px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #dc2626;
  font: inherit;
  font-size: 13px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #fff1f2;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export default MessengerBackupCard;

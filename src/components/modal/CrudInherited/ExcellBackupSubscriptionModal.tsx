import { useEffect, useState } from "react";
import styled from "styled-components";
import BaseModal from "../BASE/modalCRUBase";
import CustomInput from "../../ui/fields/CustomInput";
import CustomSelect from "../../ui/fields/CustomSelect";
import Checkbox from "../../ui/CheckBoxes/Checkbox";
import type {
  ExcellBackupSubscription,
  ExcellBackupSubscriptionPayload,
  Messenger,
} from "../../../api/types/excellBackup";
import { BACKUP_ITEM, MESSENGER_OPTIONS } from "../../../api/types/excellBackup";

interface Props {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ExcellBackupSubscriptionPayload) => Promise<void> | void;
  initialData: ExcellBackupSubscription | null;
  isSubmitting: boolean;
}

const messengerSelectOptions = MESSENGER_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

const ExcellBackupSubscriptionModal = ({
  mode,
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting,
}: Props) => {
  const [messenger, setMessenger] = useState<Messenger>("Telegram");
  const [contact, setContact] = useState("");
  const [credits, setCredits] = useState(true);
  const [clients, setClients] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && initialData) {
      setMessenger(
        (MESSENGER_OPTIONS.find((o) => o.value === initialData.messenger)?.value ??
          "Telegram") as Messenger
      );
      setContact(initialData.contact);
      setCredits((initialData.items & BACKUP_ITEM.Credits) !== 0);
      setClients((initialData.items & BACKUP_ITEM.Clients) !== 0);
    } else {
      setMessenger("Telegram");
      setContact("");
      setCredits(true);
      setClients(true);
    }
    setLocalError(null);
  }, [isOpen, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!contact.trim()) {
      setLocalError("Укажите контакт");
      return;
    }
    if (!credits && !clients) {
      setLocalError("Выберите хотя бы один тип бэкапа");
      return;
    }

    const items =
      (credits ? BACKUP_ITEM.Credits : 0) | (clients ? BACKUP_ITEM.Clients : 0);

    await onSave({ messenger, contact: contact.trim(), items });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title={mode === "create" ? "Новая подписка" : "Редактирование подписки"}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSubmitting={isSubmitting}
      width="480px"
    >
      <Form>
        <Field>
          <Label>Мессенджер</Label>
          <CustomSelect
            value={messenger}
            onChange={(e) => setMessenger(e.target.value as Messenger)}
            options={messengerSelectOptions}
            placeholder="Выберите мессенджер"
            dropdownInPortal
          />
        </Field>

        <Field>
          <Label>Контакт</Label>
          <CustomInput
            inputType="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Телефон, @username или ID"
          />
        </Field>

        {localError && <ErrorText>{localError}</ErrorText>}
      </Form>
    </BaseModal>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 30px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const CheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
`;

const ErrorText = styled.div`
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  color: #b71c1c;
  font-size: 13px;
`;

export default ExcellBackupSubscriptionModal;
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { FaPlus } from "react-icons/fa";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import StarIcon from "@mui/icons-material/Star";
import type { ClientContact, ContactType } from "../../api/types/client";
import useClient from "../../api/hooks/useClient";
import CustomSelect from "./fields/CustomSelect";
import CustomInput from "./fields/CustomInput";
import PhoneModalInput from "./fields/PhoneModalInput";

const isPhoneType = (type: ContactType) =>
  type === "WhatsAppPhone" || type === "AdditionalPhone";

const normalizePhone = (value: string) => value.replace(/\D/g, "");

interface ContactsEditorProps {
  clientId: number;
  contacts: ClientContact[];
  onChange?: (contacts: ClientContact[]) => void;
  readOnly?: boolean;
  /** Текущий основной WhatsApp-номер клиента (secondPhone). */
  mainWhatsApp?: string;
  /** Вызывается при выборе номера как основного для WhatsApp. */
  onSetMainWhatsApp?: (value: string) => void;
}

const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string }[] = [
  { value: "WhatsAppPhone", label: "WhatsApp" },
  { value: "AdditionalPhone", label: "Доп. телефон" },
  { value: "Email", label: "Email" },
  { value: "Telegram", label: "Telegram" },
];

const TYPE_LABEL: Record<ContactType, string> = {
  WhatsAppPhone: "WhatsApp",
  AdditionalPhone: "Доп. телефон",
  Email: "Email",
  Telegram: "Telegram",
};

const ContactsEditor: React.FC<ContactsEditorProps> = ({
  clientId,
  contacts,
  onChange,
  readOnly = false,
  mainWhatsApp,
  onSetMainWhatsApp,
}) => {
  const { createContact, updateContact, deleteContact, getClientContacts } =
    useClient();
  const [items, setItems] = useState<ClientContact[]>(contacts || []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<ContactType>("WhatsAppPhone");
  const [newValue, setNewValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(contacts || []);
  }, [contacts]);

  const commitItems = (next: ClientContact[]) => {
    setItems(next);
    onChange?.(next);
  };

  const placeholderForType = (type: ContactType) => {
    switch (type) {
      case "Email":
        return "name@example.com";
      case "Telegram":
        return "@username";
      default:
        return "+7...";
    }
  };

  const cleanValueForSubmit = (value: string, type: ContactType): string => {
    const trimmed = value.trim();
    if (isPhoneType(type)) {
      return trimmed.replace(/\D/g, "");
    }
    return trimmed;
  };

  const refreshFromServer = async (): Promise<ClientContact[] | null> => {
    if (!clientId) return null;
    const fresh = await getClientContacts(clientId);
    if (fresh) commitItems(fresh);
    return fresh;
  };

  const handleAdd = async () => {
    if (!newValue.trim() || !clientId) return;
    setBusy(true);
    setError(null);
    const payload = cleanValueForSubmit(newValue, newType);
    const {
      ok,
      data,
      error: apiError,
    } = await createContact(clientId, newType, payload);
    if (!ok) {
      setBusy(false);
      setError(apiError || "Не удалось добавить контакт");
      return;
    }
    if (data) {
      commitItems([...items, data]);
    } else {
      await refreshFromServer();
    }
    setBusy(false);
    setNewValue("");
    setNewType("WhatsAppPhone");
    setIsAdding(false);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingValue.trim()) return;
    const contact = items.find((c) => c.id === id);
    if (!contact) return;
    setBusy(true);
    setError(null);
    const payload = cleanValueForSubmit(editingValue, contact.type);
    const { ok, data, error: apiError } = await updateContact(id, payload);
    if (!ok) {
      setBusy(false);
      setError(apiError || "Не удалось обновить контакт");
      return;
    }
    if (data) {
      commitItems(
        items.map((c) =>
          c.id === id ? { ...c, value: data.value || payload } : c
        )
      );
    } else {
      commitItems(
        items.map((c) => (c.id === id ? { ...c, value: payload } : c))
      );
    }
    setBusy(false);
    setEditingId(null);
    setEditingValue("");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить контакт?")) return;
    setBusy(true);
    setError(null);
    const { ok, error: apiError } = await deleteContact(id);
    setBusy(false);
    if (!ok) {
      setError(apiError || "Не удалось удалить контакт");
      return;
    }
    commitItems(items.filter((c) => c.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingValue("");
    }
  };

  const startEdit = (contact: ClientContact) => {
    setEditingId(contact.id);
    setEditingValue(contact.value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  return (
    <Wrapper>
      {error && <ErrorText>{error}</ErrorText>}

      {items.length === 0 && !isAdding && (
        <EmptyText>Контактов пока нет</EmptyText>
      )}

      <List>
        {items.map((contact) => {
          const isEditing = editingId === contact.id;
          const canBeMainWhatsApp =
            !!onSetMainWhatsApp && isPhoneType(contact.type);
          const isMainWhatsApp =
            canBeMainWhatsApp &&
            !!mainWhatsApp &&
            normalizePhone(contact.value) === normalizePhone(mainWhatsApp);
          const renderEditor = () => {
            if (isPhoneType(contact.type)) {
              return (
                <PhoneModalInput
                  name={`contact-${contact.id}`}
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  placeholder={placeholderForType(contact.type)}
                />
              );
            }
            return (
              <CustomInput
                name={`contact-${contact.id}`}
                inputType="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                placeholder={placeholderForType(contact.type)}
              />
            );
          };

          return (
            <ItemCard key={contact.id}>
              <TopRow>
                <BadgeColumn>
                  <TypeBadge $type={contact.type}>
                    {TYPE_LABEL[contact.type] ?? contact.type}
                  </TypeBadge>
                </BadgeColumn>

                <ValueColumn>
                  {isEditing ? (
                    renderEditor()
                  ) : (
                    <ValueLine>
                      <Value>{contact.value}</Value>
                      {isMainWhatsApp && (
                        <MainBadge>Основной WhatsApp</MainBadge>
                      )}
                    </ValueLine>
                  )}
                </ValueColumn>

                {!isEditing && !readOnly && (
                  <InlineActions>
                    {canBeMainWhatsApp && (
                      <IconButton
                        type="button"
                        onClick={() => onSetMainWhatsApp?.(contact.value)}
                        disabled={busy || isMainWhatsApp}
                        title={
                          isMainWhatsApp
                            ? "Основной номер WhatsApp"
                            : "Сделать основным WhatsApp"
                        }
                        aria-label="Сделать основным WhatsApp"
                        $active={isMainWhatsApp}
                      >
                        {isMainWhatsApp ? (
                          <StarIcon fontSize="small" />
                        ) : (
                          <StarOutlineOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    )}
                    <IconButton
                      type="button"
                      onClick={() => startEdit(contact)}
                      disabled={busy}
                      title="Изменить"
                      aria-label="Изменить"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      type="button"
                      onClick={() => handleDelete(contact.id)}
                      disabled={busy}
                      title="Удалить"
                      aria-label="Удалить"
                      $danger
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </InlineActions>
                )}
              </TopRow>

              {isEditing && (
                <ActionRow>
                  <PrimaryButton
                    type="button"
                    onClick={() => handleSaveEdit(contact.id)}
                    disabled={busy || !editingValue.trim()}
                  >
                    Сохранить
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={cancelEdit}
                    disabled={busy}
                  >
                    Отмена
                  </SecondaryButton>
                </ActionRow>
              )}
            </ItemCard>
          );
        })}
      </List>

      {!readOnly && (
        <>
          {isAdding ? (
            <AddCard>
              <AddFields>
                <FieldGroup>
                  <SelectBox>
                    <CustomSelect<ContactType>
                      options={CONTACT_TYPE_OPTIONS}
                      value={newType}
                      onChange={(e) => {
                        setNewType(e.target.value);
                        setNewValue("");
                      }}
                      placeholder="Тип"
                      dropdownInPortal
                    />
                  </SelectBox>
                </FieldGroup>

                <FieldGroup>
                  {isPhoneType(newType) ? (
                    <PhoneModalInput
                      name="new-contact"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={placeholderForType(newType)}
                    />
                  ) : (
                    <CustomInput
                      name="new-contact"
                      inputType="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={placeholderForType(newType)}
                    />
                  )}
                </FieldGroup>

                <ActionRow>
                  <PrimaryButton
                    type="button"
                    onClick={handleAdd}
                    disabled={busy || !newValue.trim()}
                  >
                    Сохранить
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewValue("");
                      setNewType("WhatsAppPhone");
                    }}
                    disabled={busy}
                  >
                    Отмена
                  </SecondaryButton>
                </ActionRow>
              </AddFields>
            </AddCard>
          ) : (
            <AddButton
              type="button"
              onClick={() => setIsAdding(true)}
              disabled={busy || !clientId}
              title="Добавить контакт"
              aria-label="Добавить контакт"
            >
              <FaPlus size={12} />
            </AddButton>
          )}
        </>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const EmptyText = styled.div`
  font-size: 13px;
  color: #6b7280;
  padding: 4px 0;
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 12px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ItemCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
`;

const AddCard = styled(ItemCard)`
  width: min(100%, 880px);
  box-sizing: border-box;
  padding: 12px;
  border-style: dashed;
  border-color: #007d88;
  background: rgba(0, 125, 136, 0.03);
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr auto;
  align-items: center;
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr auto;
  }
`;

const BadgeColumn = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 640px) {
    grid-column: 1 / -1;
  }
`;

const ValueColumn = styled.div`
  min-width: 0;
`;

const InlineActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 480px) {
    & > button {
      flex: 1;
    }
  }
`;

const AddFields = styled.div`
  display: grid;
  grid-template-columns: 180px minmax(260px, 1fr) auto;
  gap: 12px;
  align-items: center;

  @media (max-width: 760px) {
    grid-template-columns: 160px minmax(0, 1fr);

    ${ActionRow} {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;

    ${ActionRow} {
      grid-column: auto;
    }
  }
`;

const FieldGroup = styled.div`
  min-width: 0;
`;

const TypeBadge = styled.span<{ $type: ContactType }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  background: ${({ $type }) => {
    switch ($type) {
      case "WhatsAppPhone":
        return "rgba(37, 211, 102, 0.14)";
      case "Telegram":
        return "rgba(34, 158, 217, 0.14)";
      case "Email":
        return "rgba(0, 125, 136, 0.14)";
      default:
        return "rgba(107, 114, 128, 0.14)";
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case "WhatsAppPhone":
        return "#0d8a3f";
      case "Telegram":
        return "#1c7ab5";
      case "Email":
        return "#007D88";
      default:
        return "#4b5563";
    }
  }};
`;

const Value = styled.span`
  font-size: 14px;
  color: #111827;
  word-break: break-all;
`;

const SelectBox = styled.div`
  width: 100%;

  & > div > div {
    max-width: none;
  }
`;

const PrimaryButton = styled.button`
  background: #007d88;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #006670;
    border-color: transparent;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  background: #fff;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const IconButton = styled.button<{ $danger?: boolean; $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid
    ${({ $danger, $active }) =>
      $danger ? "#fecaca" : $active ? "#fcd34d" : "#d1d5db"};
  background: ${({ $danger, $active }) =>
    $danger ? "#fef2f2" : $active ? "#fffbeb" : "#f9fafb"};
  color: ${({ $danger, $active }) =>
    $danger ? "#dc2626" : $active ? "#d97706" : "#4b5563"};
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
  flex-shrink: 0;

  & svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    background: ${({ $danger }) => ($danger ? "#fee2e2" : "#f3f4f6")};
    border-color: ${({ $danger }) => ($danger ? "#fca5a5" : "#9ca3af")};
  }

  &:disabled {
    opacity: ${({ $active }) => ($active ? 1 : 0.5)};
    cursor: ${({ $active }) => ($active ? "default" : "not-allowed")};
  }
`;

const ValueLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
`;

const MainBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(37, 211, 102, 0.14);
  color: #0d8a3f;
  white-space: nowrap;
`;

const AddButton = styled.button`
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  border: none;
  background: #007d88;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover:not(:disabled) {
    background: #006670;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default ContactsEditor;

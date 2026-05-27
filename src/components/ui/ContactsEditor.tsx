import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaPlus } from 'react-icons/fa';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import type { ClientContact, ContactType } from '../../api/types/client';
import useClient from '../../api/hooks/useClient';
import CustomSelect from './fields/CustomSelect';
import CustomInput from './fields/CustomInput';
import PhoneModalInput from './fields/PhoneModalInput';

const isPhoneType = (type: ContactType) =>
  type === 'WhatsAppPhone' || type === 'AdditionalPhone';

interface ContactsEditorProps {
  clientId: number;
  contacts: ClientContact[];
  onChange?: (contacts: ClientContact[]) => void;
  readOnly?: boolean;
}

const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string }[] = [
  { value: 'WhatsAppPhone', label: 'WhatsApp' },
  { value: 'AdditionalPhone', label: 'Доп. телефон' },
  { value: 'Email', label: 'Email' },
  { value: 'Telegram', label: 'Telegram' },
];

const TYPE_LABEL: Record<ContactType, string> = {
  WhatsAppPhone: 'WhatsApp',
  AdditionalPhone: 'Доп. телефон',
  Email: 'Email',
  Telegram: 'Telegram',
};

const ContactsEditor: React.FC<ContactsEditorProps> = ({
  clientId,
  contacts,
  onChange,
  readOnly = false,
}) => {
  const { createContact, updateContact, deleteContact, getClientContacts } = useClient();
  const [items, setItems] = useState<ClientContact[]>(contacts || []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<ContactType>('WhatsAppPhone');
  const [newValue, setNewValue] = useState('');
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
      case 'Email':
        return 'name@example.com';
      case 'Telegram':
        return '@username';
      default:
        return '+7...';
    }
  };

  const cleanValueForSubmit = (value: string, type: ContactType): string => {
    const trimmed = value.trim();
    if (isPhoneType(type)) {
      return trimmed.replace(/\D/g, '');
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
    const { ok, data, error: apiError } = await createContact(clientId, newType, payload);
    if (!ok) {
      setBusy(false);
      setError(apiError || 'Не удалось добавить контакт');
      return;
    }
    if (data) {
      commitItems([...items, data]);
    } else {
      await refreshFromServer();
    }
    setBusy(false);
    setNewValue('');
    setNewType('WhatsAppPhone');
    setIsAdding(false);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingValue.trim()) return;
    const contact = items.find(c => c.id === id);
    if (!contact) return;
    setBusy(true);
    setError(null);
    const payload = cleanValueForSubmit(editingValue, contact.type);
    const { ok, data, error: apiError } = await updateContact(id, payload);
    if (!ok) {
      setBusy(false);
      setError(apiError || 'Не удалось обновить контакт');
      return;
    }
    if (data) {
      commitItems(items.map(c => (c.id === id ? { ...c, value: data.value || payload } : c)));
    } else {
      commitItems(items.map(c => (c.id === id ? { ...c, value: payload } : c)));
    }
    setBusy(false);
    setEditingId(null);
    setEditingValue('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить контакт?')) return;
    setBusy(true);
    setError(null);
    const { ok, error: apiError } = await deleteContact(id);
    setBusy(false);
    if (!ok) {
      setError(apiError || 'Не удалось удалить контакт');
      return;
    }
    commitItems(items.filter(c => c.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingValue('');
    }
  };

  const startEdit = (contact: ClientContact) => {
    setEditingId(contact.id);
    setEditingValue(contact.value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  return (
    <Wrapper>
      {error && <ErrorText>{error}</ErrorText>}

      {items.length === 0 && !isAdding && (
        <EmptyText>Контактов пока нет</EmptyText>
      )}

      <List>
        {items.map(contact => {
          const isEditing = editingId === contact.id;
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
                  <TypeBadge $type={contact.type}>{TYPE_LABEL[contact.type] ?? contact.type}</TypeBadge>
                </BadgeColumn>

                <ValueColumn>
                  {isEditing ? renderEditor() : <Value>{contact.value}</Value>}
                </ValueColumn>

                {!isEditing && !readOnly && (
                  <InlineActions>
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
                  <SecondaryButton type="button" onClick={cancelEdit} disabled={busy}>
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
              <TopRow>
                <BadgeColumn>
                  <SelectBox>
                    <CustomSelect<ContactType>
                      options={CONTACT_TYPE_OPTIONS}
                      value={newType}
                      onChange={(e) => {
                        setNewType(e.target.value);
                        setNewValue('');
                      }}
                      placeholder="Тип"
                    />
                  </SelectBox>
                </BadgeColumn>

                <ValueColumn>
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
                </ValueColumn>
              </TopRow>

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
                    setNewValue('');
                    setNewType('WhatsAppPhone');
                  }}
                  disabled={busy}
                >
                  Отмена
                </SecondaryButton>
              </ActionRow>
            </AddCard>
          ) : (
            <AddButton type="button" onClick={() => setIsAdding(true)} disabled={busy || !clientId}>
              <FaPlus size={10} />
              Добавить контакт
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
  border-style: dashed;
  border-color: #007D88;
  background: rgba(0, 125, 136, 0.04);
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr auto;
  align-items: center;
  gap: 12px;
`;

const BadgeColumn = styled.div`
  display: flex;
  align-items: center;
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
`;

const TypeBadge = styled.span<{ $type: ContactType }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $type }) => {
    switch ($type) {
      case 'WhatsAppPhone':
        return 'rgba(37, 211, 102, 0.14)';
      case 'Telegram':
        return 'rgba(34, 158, 217, 0.14)';
      case 'Email':
        return 'rgba(0, 125, 136, 0.14)';
      default:
        return 'rgba(107, 114, 128, 0.14)';
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'WhatsAppPhone':
        return '#0d8a3f';
      case 'Telegram':
        return '#1c7ab5';
      case 'Email':
        return '#007D88';
      default:
        return '#4b5563';
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
`;

const PrimaryButton = styled.button`
  background: #007D88;
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

const IconButton = styled.button<{ $danger?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid ${({ $danger }) => ($danger ? '#fecaca' : '#d1d5db')};
  background: ${({ $danger }) => ($danger ? '#fef2f2' : '#f9fafb')};
  color: ${({ $danger }) => ($danger ? '#dc2626' : '#4b5563')};
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
  flex-shrink: 0;

  & svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    background: ${({ $danger }) => ($danger ? '#fee2e2' : '#f3f4f6')};
    border-color: ${({ $danger }) => ($danger ? '#fca5a5' : '#9ca3af')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddButton = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px dashed #007D88;
  background: transparent;
  color: #007D88;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover:not(:disabled) {
    background: rgba(0, 125, 136, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default ContactsEditor;

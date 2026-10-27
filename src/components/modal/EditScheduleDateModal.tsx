import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import CustomCalendar from '../ui/fields/CustomCalendar';
import BaseModal from './BASE/modalCRUBase';

interface EditScheduleDateModalProps {
  isOpen: boolean;
  ids: number[];
  initialDate?: string;
  onClose: () => void;
  onConfirm: (date: string) => Promise<void> | void;
}

const EditScheduleDateModal: React.FC<EditScheduleDateModalProps> = ({
  isOpen,
  ids,
  initialDate,
  onClose,
  onConfirm,
}) => {
  const [date, setDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        const d = new Date(initialDate);
        if (!isNaN(d.getTime())) {
          const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          setDate(utc.toISOString().split('T')[0]);
        } else {
          setDate('');
        }
      } else {
        setDate('');
      }
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!date || isSaving) return;
    setIsSaving(true);
    try {
      await onConfirm(date);
    } finally {
      setIsSaving(false);
    }
  };

  const count = ids.length;
  const title = count > 1
    ? `Изменить дату платежей (${count})`
    : 'Изменить дату платежа';

  return (
    <BaseModal
      isOpen={isOpen}
      title={title}
      subtitle="Выберите новую дату для графика платежей"
      appearance="compact-form"
      width="500px"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleConfirm}
      isSaveDisabled={!date}
      isSubmitting={isSaving}
    >
      <ModalBody>
        <Label>Новая дата платежа</Label>
        <CustomCalendar
          prefix=""
          value={date}
          onChange={(v) => setDate(v)}
        />
      </ModalBody>
    </BaseModal>
  );
};

const ModalBody = styled.div`
  padding: 6px 34px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
`;

const Label = styled.div`
  font-size: 14px;
  color: #50555c;
`;

export default EditScheduleDateModal;

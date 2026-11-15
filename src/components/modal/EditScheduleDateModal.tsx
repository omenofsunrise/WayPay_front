import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import DarkCyanButton from '../ui/Buttons/DarkCyanButton';
import GrayButton from '../ui/Buttons/GrayButton';
import CustomCalendar from '../ui/fields/CustomCalendar';

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = async () => {
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
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <Label>Новая дата платежа</Label>
          <CustomCalendar
            prefix=""
            value={date}
            onChange={(v) => setDate(v)}
          />
        </ModalBody>
        <ModalFooter>
          <GrayButton onClick={onClose} disabled={isSaving}>Отмена</GrayButton>
          <DarkCyanButton onClick={handleConfirm} disabled={!date || isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </DarkCyanButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 420px;
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
  gap: 8px;
`;

const Label = styled.div`
  font-size: 14px;
  color: #50555c;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export default EditScheduleDateModal;

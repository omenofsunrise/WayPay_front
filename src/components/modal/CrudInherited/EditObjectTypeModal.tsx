import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { ObjectType, ObjectTypeUpdateRequest } from '../../../api/types/objectType';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';

interface EditObjectTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ObjectTypeUpdateRequest) => Promise<boolean>;
  initialData: ObjectType | null;
  entityType: string;
}

const EditObjectTypeModal: React.FC<EditObjectTypeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  entityType
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Название вкладки обязательно');
      return;
    }

    if (name.length > 50) {
      setError('Название не должно превышать 50 символов');
      return;
    }

    if (name === initialData?.name) {
      setError('Название не изменилось');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const success = await onSubmit({
        name: name.trim()
      });

      if (success) {
        onClose();
      } else {
        setError('Не удалось обновить вкладку');
      }
    } catch (err) {
      setError('Ошибка при обновлении вкладки');
      console.error('Error updating object type:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const isSaveDisabled = !name.trim() || name.length > 50 || name === initialData?.name;

  // Если модальное окно закрыто, не рендерим ничего
  if (!isOpen) {
    return null;
  }

  return (
    <BaseModal
      onClose={onClose}
      onCancel={handleCancel}
      onSave={handleSubmit}
      title="Редактировать вкладку"
      width="400px"
      isSaveDisabled={isSaveDisabled}
      isSubmitting={isSubmitting}
      mode="edit"
      saveButtonText="Сохранить"
    >
      <ModalContent>
        <InputSection>
          <CustomInput
            inputType="text"
            placeholder="Введите новое название вкладки"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength={50}
          />
          <CharCount>
            {name.length}/50 символов
          </CharCount>
        </InputSection>
        
        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
      </ModalContent>
    </BaseModal>
  );
};

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 10px;
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CharCount = styled.span`
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: -5px;
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  font-size: 14px;
  padding: 8px 12px;
  background-color: #ffebee;
  border-radius: 4px;
  border: 1px solid #ffcdd2;
`;

const HintText = styled.p`
  margin: 0;
  color: #666;
  font-size: 12px;
  text-align: center;
  font-style: italic;
`;

export default EditObjectTypeModal;
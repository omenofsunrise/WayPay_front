import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { EntityType, ObjectTypeCreateRequest } from '../../../api/types/objectType';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';

interface CreateObjectTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ObjectTypeCreateRequest) => Promise<boolean>;
  entityType: EntityType;
  maxTabs: number;
  currentTabCount: number;
}

const CreateObjectTypeModal: React.FC<CreateObjectTypeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  entityType,
  maxTabs,
  currentTabCount
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
    }
  }, [isOpen]);

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

    if (currentTabCount >= maxTabs) {
      setError(`Достигнут лимит вкладок (${maxTabs})`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const success = await onSubmit({
        name: name.trim(),
        entityType
      });

      if (success) {
        onClose();
      } else {
        setError('Не удалось создать вкладку');
      }
    } catch (err) {
      setError('Ошибка при создании вкладки');
      console.error('Error creating object type:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const isSaveDisabled = !name.trim() || name.length > 50 || currentTabCount >= maxTabs;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      onCancel={handleCancel}
      onSave={handleSubmit}
      title="Создать новую вкладку"
      width="400px"
      isSaveDisabled={isSaveDisabled}
      isSubmitting={isSubmitting}
      mode="create"
      saveButtonText="Создать"
    >
      <ModalContent>
        <InfoSection>
          <InfoText>
            Создано вкладок: <strong>{currentTabCount} из {maxTabs}</strong>
          </InfoText>
          {currentTabCount >= maxTabs && (
            <LimitWarning>
              Достигнут максимальный лимит вкладок
            </LimitWarning>
          )}
        </InfoSection>

        <InputSection>
          <CustomInput
            inputType="text"
            placeholder="Введите название вкладки"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength={50}
            disabled={currentTabCount >= maxTabs}
          />
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
  gap: 20px;
  padding: 0 10px;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoText = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
  text-align: center;
`;

const LimitWarning = styled.div`
  color: #ff6b35;
  font-size: 14px;
  text-align: center;
  font-weight: 500;
  padding: 8px;
  background-color: #fff3e0;
  border-radius: 4px;
  border: 1px solid #ffcc80;
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
  color: #888;
  font-size: 12px;
  text-align: center;
  font-style: italic;
`;

export default CreateObjectTypeModal;
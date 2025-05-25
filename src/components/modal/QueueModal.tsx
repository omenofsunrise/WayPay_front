import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from './BASE/modalCRUBase';
import CustomInput from '../ui/fields/CustomInput';
import ModalInfoTitle from '../ui/Text/ModalInfoTitle';
import PhoneModalInput from '../ui/fields/PhoneModalInput';
import Button from '../ui/Buttons/DarkCyanButton';
import ClientModal from './ClientModal';
import ToggleSwitch from '../ui/Toggles/ToggleSwitch';
import styled from 'styled-components';
import ClientSelectModal from './ClientSelectModal';

interface QueueWithClient {
  id: number;
  sum: number;
  clientId: number;
  priority: 1 | 2;
  positionInQueue: number;
  createdAt: Date;
  clientFullName?: string;
  clientPhone?: string;
}

type QueueModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (queueData: Omit<QueueWithClient, 'id'>) => void;
  initialData?: QueueWithClient;
};

// Стилизованные компоненты
const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const InputLabel = styled.span`
  min-width: 140px;
  text-align: right;
  font-size: 14px;
`;

const InputContainer = styled.div`
  flex: 1;
`;

const ClientInfoContainer = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const QueueModal: React.FC<QueueModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    id: 0,
    sum: 0,
    clientId: 0,
    priority: false,
    positionInQueue: 0,
    createdAt: new Date(),
    clientFullName: '',
    clientPhone: ''
  },
}) => {
  const [formData, setFormData] = useState<Omit<QueueWithClient, 'id'>>({
    sum: initialData.sum,
    clientId: initialData.clientId,
    priority: initialData.priority === 1 ? 1 : 2,
    positionInQueue: initialData.positionInQueue,
    createdAt: initialData.createdAt,
    clientFullName: initialData.clientFullName || '',
    clientPhone: initialData.clientPhone || ''
  });

  const uiPriority = formData.priority === 1;

  const [validationErrors, setValidationErrors] = useState({
    sum: false,
    clientId: false
  });

  const [errorMessages, setErrorMessages] = useState({
    sum: '',
    clientId: ''
  });

  const [touchedFields, setTouchedFields] = useState({
    sum: false,
    clientId: false
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        sum: initialData.sum,
        clientId: initialData.clientId,
        priority: initialData.priority === 1 ? 1 : 2,
        positionInQueue: initialData.positionInQueue,
        createdAt: initialData.createdAt,
        clientFullName: initialData.clientFullName || '',
        clientPhone: initialData.clientPhone || ''
      });
      setValidationErrors({
        sum: false,
        clientId: false
      });
      setErrorMessages({
        sum: '',
        clientId: ''
      });
      setTouchedFields({
        sum: false,
        clientId: false
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (mode === 'view') return;

    const newErrorMessages = {
      sum: '',
      clientId: ''
    };

    // Sum validation
    if (formData.sum <= 0) {
      newErrorMessages.sum = 'Сумма должна быть больше 0';
    }

    // Client ID validation
    if (formData.clientId <= 0) {
      newErrorMessages.clientId = 'Необходимо указать клиента';
    }

    setErrorMessages(newErrorMessages);

    const errors = {
      sum: !!newErrorMessages.sum,
      clientId: !!newErrorMessages.clientId
    };

    setValidationErrors(errors);
  }, [formData, mode]);

  const isSaveDisabled = () => {
    if (mode === 'view') return true;

    // Check for validation errors
    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return true;

    // For edit mode, check if there are changes
    if (mode === 'edit') {
      const isChanged = (
        formData.sum !== initialData.sum ||
        formData.clientId !== initialData.clientId ||
        formData.priority !== initialData.priority
      );
      return !isChanged;
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched to show errors
    setTouchedFields({
      sum: true,
      clientId: true
    });

    // Check validity
    const isValid = !Object.values(validationErrors).some(Boolean);
    if (!isValid) {
      return;
    }

    onSubmit(formData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sum' || name === 'clientId' ? Number(value) : value
    }));
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handlePriorityChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      priority: checked ? 1 : 2 // true → 1, false → 2
    }));
  };

  const handleSelectClient = (client: { id: number; fullName: string; phone: string }) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientFullName: client.fullName,
      clientPhone: client.phone
    }));
    setIsClientModalOpen(false);
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Создание записи в очереди';
      case 'edit': return 'Редактирование записи в очереди';
      case 'view': return 'Просмотр записи в очереди';
      default: return 'Очередь';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <BaseModal
        title={getTitle()}
        onClose={onClose}
        onCancel={onClose}
        onSave={handleSubmit}
        isSaveDisabled={isSaveDisabled()}
        mode={mode}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px' }}>
            <ModalInfoTitle>Основная информация</ModalInfoTitle>
            
            <InputRow>
              <InputLabel>Сумма:</InputLabel>
              <InputContainer>
                <CustomInput
                  name="sum"
                  inputType="rubles"
                  placeholder="Введите сумму"
                  value={formData.sum.toString()}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  hasError={touchedFields.sum && validationErrors.sum}
                  errorMessage={touchedFields.sum ? errorMessages.sum : undefined}
                />
              </InputContainer>
            </InputRow>
            
            <InputRow>
              <InputLabel>Клиент:</InputLabel>
              <InputContainer>
                {formData.clientId ? (
                  <ClientInfoContainer>
                    <div>{formData.clientFullName}</div>
                    <div>{formData.clientPhone}</div>
                    {mode !== 'view' && (
                      <Button 
                        type="button" 
                        onClick={() => setIsClientModalOpen(true)}
                      >
                        Изменить клиента
                      </Button>
                    )}
                  </ClientInfoContainer>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => setIsClientModalOpen(true)}
                  >
                    Выбрать клиента
                  </Button>
                )}
                {touchedFields.clientId && validationErrors.clientId && (
                  <div style={{ color: 'red', fontSize: '12px' }}>
                    {errorMessages.clientId}
                  </div>
                )}
              </InputContainer>
            </InputRow>
            
            <InputRow>
              <InputLabel>Приоритет:</InputLabel>
              <InputContainer>
                <ToggleSwitch
                  checked={uiPriority}
                  onChange={handlePriorityChange}
                  disabled={mode === 'view'}
                />
                <span style={{ marginLeft: '8px' }}>
                  {formData.priority ? 'Высокий приоритет' : 'Обычный приоритет'}
                </span>
              </InputContainer>
            </InputRow>
          </div>
        </form>
      </BaseModal>

      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={(client) => handleSelectClient({
          id: client.id,
          fullName: client.fullName,
          phone: client.phone
        })}
      />
    </>
  );
};

export default QueueModal;
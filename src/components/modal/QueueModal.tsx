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
import { InputContainer, InputLabel, InputRow } from '../Containers/InputComponents';
import { formatPrice } from '../../utils/formatPrice';

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

const ClientInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const ClientInput = styled.input`
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: ${props => props.disabled ? '#f5f5f5' : 'white'};
  color: #333;
  pointer-events: none;
`;

const ClientInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f5f5f5;
`;

const ClientName = styled.span`
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
`;

const ClientPhone = styled.span`
  font-size: 13px;
  color: #666;
`;

const ClientSelectButton = styled.button`
  position: absolute;
  right: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ClearClientButton = styled.button`
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: #999;
  font-size: 30px;
  
  &:hover {
    color: #666;
  }
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
    priority: 2,
    positionInQueue: 0,
    createdAt: new Date(),
    clientFullName: '',
    clientPhone: ''
  },
}) => {
  const [formData, setFormData] = useState<Omit<QueueWithClient, 'id'>>({
    sum: initialData.sum,
    clientId: initialData.clientId,
    priority: initialData.priority,
    positionInQueue: initialData.positionInQueue,
    createdAt: initialData.createdAt,
    clientFullName: initialData.clientFullName || '',
    clientPhone: initialData.clientPhone || ''
  });

  const [displaySum, setDisplaySum] = useState<string>(initialData.sum.toString());

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
        priority: initialData.priority,
        positionInQueue: initialData.positionInQueue,
        createdAt: initialData.createdAt,
        clientFullName: initialData.clientFullName || '',
        clientPhone: initialData.clientPhone || ''
      });
      setDisplaySum(initialData.sum.toString());
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

    // Sum validation - используем formData.sum, который уже числовой
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
    
    if (name === 'sum') {
      // Обновляем displaySum для отображения в input
      setDisplaySum(value);
      
      // Преобразуем форматированное значение обратно в число для formData
      const numericValue = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'clientId' ? Number(value) : value
      }));
    }
    
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handlePriorityChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      priority: checked ? 1 : 2
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

  const handleClearClient = () => {
    setFormData(prev => ({
      ...prev,
      clientId: 0,
      clientFullName: '',
      clientPhone: ''
    }));
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
          <div style={{ padding: '20px', marginRight: "40px" }}>           
            <InputRow>
              <InputLabel>Клиент:</InputLabel>
              <InputContainer>
                {mode === 'view' ? (
                  <ClientInfoContainer>
                    <ClientName>{formData.clientFullName || 'Не указан'}</ClientName>
                    {formData.clientPhone && (
                      <ClientPhone>{formData.clientPhone}</ClientPhone>
                    )}
                  </ClientInfoContainer>
                ) : (
                  <ClientInputWrapper>
                    <ClientInput
                      type="text"
                      value={formData.clientFullName || ''}
                      placeholder="Выберите клиента"
                      readOnly
                    />
                    {formData.clientId > 0 && (
                      <ClearClientButton 
                        type="button" 
                        onClick={handleClearClient}
                      >
                        ×
                      </ClearClientButton>
                    )}
                  </ClientInputWrapper>
                )}
                {touchedFields.clientId && validationErrors.clientId && (
                  <div style={{ color: 'red', fontSize: '12px' }}>
                    {errorMessages.clientId}
                  </div>
                )}
              </InputContainer>
              {mode !== 'view' && (
                <ClientSelectButton 
                  type="button" 
                  onClick={() => setIsClientModalOpen(true)}
                >
                  <svg width="27" height="6" viewBox="0 0 27 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.915 0C1.31175 0 0 1.31175 0 2.915C0 4.51825 1.31175 5.83 2.915 5.83C4.51825 5.83 5.83 4.51825 5.83 2.915C5.83 1.31175 4.51825 0 2.915 0ZM23.32 0C21.7167 0 20.405 1.31175 20.405 2.915C20.405 4.51825 21.7167 5.83 23.32 5.83C24.9233 5.83 26.235 4.51825 26.235 2.915C26.235 1.31175 24.9233 0 23.32 0ZM13.1175 0C11.5142 0 10.2025 1.31175 10.2025 2.915C10.2025 4.51825 11.5142 5.83 13.1175 5.83C14.7207 5.83 16.0325 4.51825 16.0325 2.915C16.0325 1.31175 14.7207 0 13.1175 0Z" fill="#50555C"/>
                  </svg>
                </ClientSelectButton>
              )}
            </InputRow>
            
            <InputRow>
              <InputLabel>Сумма:</InputLabel>
              <InputContainer>
                <CustomInput
                  name="sum"
                  inputType="rubles"
                  placeholder="Введите сумму"
                  value={formatPrice(displaySum)}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  hasError={touchedFields.sum && validationErrors.sum}
                  errorMessage={touchedFields.sum ? errorMessages.sum : undefined}
                />
              </InputContainer>
            </InputRow>
            
            <InputRow>
              <InputContainer>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ToggleSwitch
                    checked={uiPriority}
                    onChange={handlePriorityChange}
                    disabled={mode === 'view'}
                  />
                  <span style={{ marginLeft: '8px' }}>
                    {formData.priority === 1 ? 'Высокий приоритет' : 'Обычный приоритет'}
                  </span>
                </div>
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
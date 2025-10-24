import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import ModalInfoTitle from '../../ui/Text/ModalInfoTitle';
import PhoneModalInput from '../../ui/fields/PhoneModalInput';
import Button from '../../ui/Buttons/DarkCyanButton';
import ClientModal from './ClientModal';
import ToggleSwitch from '../../ui/Toggles/ToggleSwitch';
import styled from 'styled-components';
import ClientSelectModal from './ClientSelectModal';
import { InputContainer, InputLabel, InputRow } from '../../Containers/InputComponents';
import { formatMoney } from '../../../utils/formatPrice';
import EntitySelectContainer from '../../ui/Layouts/EntitySelectContainer';

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

  const [displaySum, setDisplaySum] = useState<string>(initialData.sum?.toString() || '0');

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
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'view') return;

    const newErrorMessages = {
      sum: '',
      clientId: ''
    };

    if (formData.sum <= 0) {
      newErrorMessages.sum = 'Сумма должна быть больше 0';
    }

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

    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return true;

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
    
    setTouchedFields({
      sum: true,
      clientId: true
    });

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
      setDisplaySum(value);
      
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
              <EntitySelectContainer
                mode={mode}
                primaryValue={formData.clientFullName || ''}
                secondaryValue={formData.clientPhone}
                placeholder="Выберите клиента"
                onSelect={() => setIsClientModalOpen(true)}
                onClear={handleClearClient}
                disabled={mode === 'view'}
                hasError={touchedFields.clientId && validationErrors.clientId}
                errorMessage={touchedFields.clientId ? errorMessages.clientId : undefined}
              />
            </InputContainer>
          </InputRow>
            
            <InputRow>
              <InputLabel>Сумма:</InputLabel>
              <InputContainer>
                <CustomInput
                  name="sum"
                  inputType="rubles"
                  placeholder="Введите сумму"
                  value={formatMoney(displaySum)}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  hasError={touchedFields.sum && validationErrors.sum}
                  errorMessage={touchedFields.sum ? errorMessages.sum : undefined}
                />
              </InputContainer>
            </InputRow>
            
            <InputRow>
              <InputContainer>
                <div style={{ display: 'flex', alignItems: 'center', color: "black" }}>
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
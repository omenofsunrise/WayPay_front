import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from './modalBase';
import CustomInput from '../ui/fields/CustomInput';
import ModalInfoTitle from '../ui/Text/ModalInfoTitle';
import PhoneModalInput from '../ui/fields/PhoneModalInput';

interface QueueWithClient {
  id: number;
  sum: number;
  clientId: number;
  priority: number;
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
    priority: 0,
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

  const [validationErrors, setValidationErrors] = useState({
    sum: false,
    clientId: false,
    priority: false
  });

  const [errorMessages, setErrorMessages] = useState({
    sum: '',
    clientId: '',
    priority: ''
  });

  const [touchedFields, setTouchedFields] = useState({
    sum: false,
    clientId: false,
    priority: false
  });

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
      setValidationErrors({
        sum: false,
        clientId: false,
        priority: false
      });
      setErrorMessages({
        sum: '',
        clientId: '',
        priority: ''
      });
      setTouchedFields({
        sum: false,
        clientId: false,
        priority: false
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (mode === 'view') return;

    const newErrorMessages = {
      sum: '',
      clientId: '',
      priority: ''
    };

    // Sum validation
    if (formData.sum <= 0) {
      newErrorMessages.sum = 'Сумма должна быть больше 0';
    }

    // Client ID validation
    if (formData.clientId <= 0) {
      newErrorMessages.clientId = 'Необходимо указать клиента';
    }

    // Priority validation (0-10)
    if (formData.priority < 0 || formData.priority > 10) {
      newErrorMessages.priority = 'Приоритет должен быть от 0 до 10';
    }

    setErrorMessages(newErrorMessages);

    const errors = {
      sum: !!newErrorMessages.sum,
      clientId: !!newErrorMessages.clientId,
      priority: !!newErrorMessages.priority
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
      clientId: true,
      priority: true
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
      [name]: name === 'sum' || name === 'clientId' || name === 'priority' 
        ? Number(value) 
        : value
    }));
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
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
    <BaseModal
      title={getTitle()}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={isSaveDisabled()}
      mode={mode}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <ModalInfoTitle>Основная информация</ModalInfoTitle>
          
          <CustomInput
            name="sum"
            inputType="number"
            placeholder="Сумма"
            value={formData.sum.toString()}
            onChange={handleInputChange}
            disabled={mode === 'view'}
            hasError={touchedFields.sum && validationErrors.sum}
            errorMessage={touchedFields.sum ? errorMessages.sum : undefined}
          />
          
          <CustomInput
            name="clientId"
            inputType="number"
            placeholder="ID клиента"
            value={formData.clientId.toString()}
            onChange={handleInputChange}
            disabled={mode === 'view'}
            hasError={touchedFields.clientId && validationErrors.clientId}
            errorMessage={touchedFields.clientId ? errorMessages.clientId : undefined}
          />
          
          {formData.clientFullName && (
            <CustomInput
              inputType="text"
              placeholder="ФИО клиента"
              value={formData.clientFullName}
              disabled
            />
          )}
          
          {formData.clientPhone && (
            <PhoneModalInput
                name="clientPhone"
                value={formData.clientPhone}
                onChange={() => {}}
                placeholder="Телефон клиента"
                disabled={true}
            />
          )}
          
          <CustomInput
            name="priority"
            inputType="number"
            placeholder="Приоритет (0-10)"
            value={formData.priority.toString()}
            onChange={handleInputChange}
            disabled={mode === 'view'}
            hasError={touchedFields.priority && validationErrors.priority}
            errorMessage={touchedFields.priority ? errorMessages.priority : undefined}
          />
          
          <ModalInfoTitle>Информация о записи</ModalInfoTitle>
          
          <CustomInput
            inputType="text"
            placeholder="Позиция в очереди"
            value={formData.positionInQueue.toString()}
            disabled
          />
          
          <CustomInput
            inputType="text"
            placeholder="Дата создания"
            value={formData.createdAt.toLocaleString()}
            disabled
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default QueueModal;
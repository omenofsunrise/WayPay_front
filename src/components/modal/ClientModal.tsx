import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from './modalBase';
import CustomInput from '../ui/fields/CustomInput';

interface Client {
  id: number;
  fullName: string;
  phone: string;
  doc: string;
  birthdate: Date;
}

type ClientModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: Omit<Client, 'id'>) => void;
  initialData?: Client;
};

export const ClientModal: React.FC<ClientModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    id: 0,
    fullName: '',
    phone: '',
    doc: '',
    birthdate: new Date()
  },
}) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    fullName: initialData.fullName,
    phone: initialData.phone,
    doc: initialData.doc,
    birthdate: initialData.birthdate
  });
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({
    fullName: false,
    phone: false
  });

  useEffect(() => {
    setFormData({
      fullName: initialData.fullName,
      phone: initialData.phone,
      doc: initialData.doc,
      birthdate: initialData.birthdate
    });
    setValidationErrors({
      fullName: false,
      phone: false
    });
  }, [initialData]);

  useEffect(() => {
    const isFullNameValid = formData.fullName.trim().length > 0;
    const isPhoneValid = formData.phone.trim().length > 0;
    
    const isFullNameChanged = formData.fullName !== initialData.fullName;
    const isPhoneChanged = formData.phone !== initialData.phone;
    const isDocChanged = formData.doc !== initialData.doc;
    const isBirthdateChanged = formData.birthdate.getTime() !== initialData.birthdate.getTime();
    
    if (mode === 'create') {
      setIsSaveDisabled(!isFullNameValid || !isPhoneValid);
    } else if (mode === 'edit') {
      setIsSaveDisabled(
        !isFullNameValid || 
        !isPhoneValid || 
        (!isFullNameChanged && 
         !isPhoneChanged && 
         !isDocChanged && 
         !isBirthdateChanged)
      );
    }
  }, [formData, initialData, mode]);

  const handleSubmit = () => {
    const errors = {
      fullName: formData.fullName.trim().length === 0,
      phone: formData.phone.trim().length === 0
    };
    
    setValidationErrors(errors);
    
    if (errors.fullName || errors.phone) {
      return;
    }
    
    onSubmit(formData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name as keyof typeof validationErrors] && value.trim().length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      birthdate: new Date(e.target.value)
    }));
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Создание клиента';
      case 'edit':
        return 'Редактирование клиента';
      case 'view':
        return 'Просмотр клиента';
      default:
        return 'Клиент';
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title={getTitle()}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={mode !== 'view' && isSaveDisabled}
      mode={mode}
    >
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <CustomInput
          name="fullName"
          inputType="text"
          placeholder="ФИО клиента"
          value={formData.fullName}
          onChange={handleInputChange}
          disabled={mode === 'view'}
          hasError={validationErrors.fullName}
          errorMessage={validationErrors.fullName ? "Поле не может быть пустым" : undefined}
        />
        
        <CustomInput
          name="phone"
          inputType="text"
          placeholder="Телефон"
          value={formData.phone}
          onChange={handleInputChange}
          disabled={mode === 'view'}
          hasError={validationErrors.phone}
          errorMessage={validationErrors.phone ? "Поле не может быть пустым" : undefined}
        />
        
        <CustomInput
          name="doc"
          inputType="text"
          placeholder="Документ"
          value={formData.doc}
          onChange={handleInputChange}
          disabled={mode === 'view'}
        />
        
        <CustomInput
          inputType="text"
          placeholder="Дата рождения"
          value={formData.birthdate.toISOString().split('T')[0]}
          onChange={handleDateChange}
          disabled={mode === 'view'}
        />
      </div>
    </BaseModal>
  );
};
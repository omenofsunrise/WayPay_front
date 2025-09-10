import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import PhoneModalInput from '../../ui/fields/PhoneModalInput';
import { formatDate, parseDateInput } from '../../../utils/dateFormatter';

interface BlacklistClient {
  id: number;
  fullName: string;
  phone: string;
  birthdate: Date | null;
  debt: number;
  secondPhone?: string;
  doc?: string;
  docIssueDate?: Date | null;
  docIssueYear?: number;
  registrationAddress?: string | null;
  creditIds?: string[];
  creditRestTerms?: string[];
  hasPassportPhoto?: boolean;
}

type BlacklistModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: Partial<BlacklistClient>) => void;
  initialData?: Partial<BlacklistClient>;
};

export const BlackCatalogModal: React.FC<BlacklistModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    fullName: '',
    phone: '',
    birthdate: null,
    doc: '',
    docIssueDate: null,
    registrationAddress: '',
    secondPhone: ''
  },
}) => {
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    phone: initialData.phone || '',
    birthdate: initialData.birthdate ? formatDate(initialData.birthdate) : '',
    doc: initialData.doc || '',
    docIssueDate: initialData.docIssueDate ? formatDate(initialData.docIssueDate) : '',
    registrationAddress: initialData.registrationAddress || '',
    secondPhone: initialData.secondPhone || ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        birthdate: initialData.birthdate ? formatDate(initialData.birthdate) : '',
        doc: initialData.doc || '',
        docIssueDate: initialData.docIssueDate ? formatDate(initialData.docIssueDate) : '',
        registrationAddress: initialData.registrationAddress || '',
        secondPhone: initialData.secondPhone || ''
      });
      setValidationErrors({});
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    validateForm();
  }, [formData, mode, initialData]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'ФИО обязательно';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Телефон обязателен';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Неверный формат телефона';
    }

    if (formData.birthdate) {
      const birthDate = parseDateInput(formData.birthdate);
      if (!birthDate || birthDate > new Date()) {
        errors.birthdate = 'Неверная дата рождения';
      }
    }

    if (formData.docIssueDate) {
      const issueDate = parseDateInput(formData.docIssueDate);
      if (!issueDate || issueDate > new Date()) {
        errors.docIssueDate = 'Неверная дата выдачи';
      }
    }

    setValidationErrors(errors);

    // Проверка, можно ли сохранить
    const hasErrors = Object.keys(errors).length > 0;
    const isFormEmpty = !formData.fullName.trim() || !formData.phone.trim();
    
    if (mode === 'create') {
      setIsSaveDisabled(hasErrors || isFormEmpty);
    } else if (mode === 'edit') {
      const isChanged = 
        formData.fullName !== initialData.fullName ||
        formData.phone !== initialData.phone ||
        formData.birthdate !== (initialData.birthdate ? formatDate(initialData.birthdate) : '') ||
        formData.doc !== initialData.doc ||
        formData.docIssueDate !== (initialData.docIssueDate ? formatDate(initialData.docIssueDate) : '') ||
        formData.registrationAddress !== initialData.registrationAddress ||
        formData.secondPhone !== initialData.secondPhone;
      
      setIsSaveDisabled(hasErrors || !isChanged);
    } else if (mode === 'view') {
      setIsSaveDisabled(true);
    }
  };

  const handlePhoneChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(field, e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const submitData: Partial<BlacklistClient> = {
      fullName: formData.fullName.trim(),
      phone: formData.phone,
      birthdate: formData.birthdate ? parseDateInput(formData.birthdate) : null,
      doc: formData.doc.trim() || undefined,
      docIssueDate: formData.docIssueDate ? parseDateInput(formData.docIssueDate) : null,
      registrationAddress: formData.registrationAddress.trim() || undefined,
      secondPhone: formData.secondPhone.trim() || undefined
    };

    onSubmit(submitData);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Добавить в чёрный список';
      case 'edit':
        return 'Редактировать клиента';
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
      isSaveDisabled={isSaveDisabled}
      mode={mode}
      width="600px"
    >
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <CustomInput
          inputType="fullname"
          placeholder="ФИО клиента *"
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          disabled={mode === 'view'}
          hasError={!!validationErrors.fullName}
          errorMessage={validationErrors.fullName}
        />

        <PhoneModalInput
          name="phone"
          value={formData.phone}
          onChange={handlePhoneChange('phone')}
          disabled={mode === 'view'}
          hasError={!!validationErrors.phone}
          errorMessage={validationErrors.phone}
          placeholder="Основной телефон *"
        />

        <CustomInput
          inputType="date"
          placeholder="Дата рождения"
          value={formData.birthdate}
          onChange={(e) => handleInputChange('birthdate', e.target.value)}
          disabled={mode === 'view'}
          hasError={!!validationErrors.birthdate}
          errorMessage={validationErrors.birthdate}
        />

        <CustomInput
          inputType="text"
          placeholder="Серия и номер документа"
          value={formData.doc}
          onChange={(e) => handleInputChange('doc', e.target.value)}
          disabled={mode === 'view'}
        />

        <CustomInput
          inputType="date"
          placeholder="Дата выдачи документа"
          value={formData.docIssueDate}
          onChange={(e) => handleInputChange('docIssueDate', e.target.value)}
          disabled={mode === 'view'}
          hasError={!!validationErrors.docIssueDate}
          errorMessage={validationErrors.docIssueDate}
        />

        <CustomInput
          inputType="text"
          placeholder="Адрес регистрации"
          value={formData.registrationAddress}
          onChange={(e) => handleInputChange('registrationAddress', e.target.value)}
          disabled={mode === 'view'}
        />
      </div>
    </BaseModal>
  );
};

export default BlackCatalogModal;
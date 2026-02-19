import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import PhoneModalInput from '../../ui/fields/PhoneModalInput';
import { formatDate, parseBlacklistDate } from '../../../utils/dateFormatter';

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
  address?: string | null;
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
  initialData = {},
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    birthdate: '',
    doc: '',
    docIssueDate: '',
    address: '',
    secondPhone: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  // Инициализация формы при открытии или изменении initialData
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        birthdate: initialData.birthdate ? formatDate(initialData.birthdate) : '',
        doc: initialData.doc || '',
        docIssueDate: initialData.docIssueDate ? formatDate(initialData.docIssueDate) : '',
        address: initialData.address || '',
        secondPhone: initialData.secondPhone || ''
      });
      setValidationErrors({});
    }
  }, [isOpen, initialData]);

  // Валидация формы
  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Проверка ФИО (обязательное поле)
    if (!formData.fullName.trim()) {
      errors.fullName = 'ФИО обязательно для заполнения';
    }

    // Проверка телефона
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Неверный формат телефона';
    }

    // Проверка даты рождения
    if (formData.birthdate) {
      const birthDate = parseBlacklistDate(formData.birthdate);
      console.log(birthDate);
      if (!birthDate) {
        errors.birthdate = 'Неверная дата рождения';
      }
    }

    // Проверка даты выдачи документа
    if (formData.docIssueDate) {
      const issueDate = parseBlacklistDate(formData.docIssueDate);
      if (!issueDate || issueDate > new Date()) {
        errors.docIssueDate = 'Неверная дата выдачи';
      }
    }

    setValidationErrors(errors);
    
    // В режиме редактирования проверяем, были ли изменения
    if (mode === 'edit' && initialData) {
      const isChanged = 
        formData.fullName !== initialData.fullName ||
        formData.phone !== initialData.phone ||
        formData.birthdate !== (initialData.birthdate ? formatDate(initialData.birthdate) : '') ||
        formData.doc !== initialData.doc ||
        formData.docIssueDate !== (initialData.docIssueDate ? formatDate(initialData.docIssueDate) : '') ||
        formData.address !== initialData.address ||
        formData.secondPhone !== initialData.secondPhone;
      
      setIsSaveDisabled(!isChanged || Object.keys(errors).length > 0);
    } else {
      setIsSaveDisabled(Object.keys(errors).length > 0);
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

    // Подготавливаем данные для отправки
    const submitData: Partial<BlacklistClient> = {};

    // Добавляем только заполненные поля
    if (formData.fullName.trim()) {
      submitData.fullName = formData.fullName.trim();
    }

    if (formData.phone) {
      submitData.phone = formData.phone;
    }

    // Преобразуем дату рождения из строки в Date объект
    if (formData.birthdate) {
      submitData.birthdate = parseBlacklistDate(formData.birthdate);
    } else {
      submitData.birthdate = null; // Явно указываем null, если дата не заполнена
    }

    if (formData.doc.trim()) {
      submitData.doc = formData.doc.trim();
    }

    // Преобразуем дату выдачи документа
    if (formData.docIssueDate) {
      submitData.docIssueDate = parseBlacklistDate(formData.docIssueDate);
    } else {
      submitData.docIssueDate = null;
    }

    if (formData.address.trim()) {
      submitData.address = formData.address.trim();
    }

    if (formData.secondPhone.trim()) {
      submitData.secondPhone = formData.secondPhone.trim();
    }

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Очищаем ошибку для измененного поля
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
      width="500px"
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
          placeholder="Основной телефон"
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
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          disabled={mode === 'view'}
        />
      </div>
    </BaseModal>
  );
};

export default BlackCatalogModal;
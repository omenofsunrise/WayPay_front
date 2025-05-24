import React, { useState, useEffect } from 'react';
import BaseModal, { type ModalMode } from './BASE/modalCRUBase';
import CustomInput from '../ui/fields/CustomInput';
import ModalInfoTitle from '../ui/Text/ModalInfoTitle';
import PhoneModalInput from '../ui/fields/PhoneModalInput';
import { InputContainer, InputLabel, InputRow } from '../Containers/InputComponents';

interface Client {
  id: number;
  fullName: string;
  phone: string;
  doc: string;
  birthdate: string; // Changed from Date to string
  docIssueDate: string; // Changed from Date to string
}

type ClientModalProps = {
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: Omit<Client, 'id'>) => void;
  initialData?: Client;
};

const validateDate = (dateStr: string, minAge: number, maxAge: number): { isValid: boolean; error?: string; date?: Date } => {
  if (!dateStr) {
    return { isValid: false, error: 'Поле обязательно для заполнения' };
  }

  // Check format dd.mm.yyyy
  const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!dateRegex.test(dateStr)) {
    return { isValid: false, error: 'Формат даты: дд.мм.гггг' };
  }

  const [day, month, year] = dateStr.split('.').map(Number);
  
  // Basic date validation
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { isValid: false, error: 'Некорректная дата' };
  }

  const today = new Date();
  const age = today.getFullYear() - year - 
    (today.getMonth() < month - 1 || 
     (today.getMonth() === month - 1 && today.getDate() < day) ? 1 : 0);

  if (age < minAge) {
    return { isValid: false, error: `Возраст должен быть не менее ${minAge} лет` };
  }

  if (age > maxAge) {
    return { isValid: false, error: `Возраст должен быть не более ${maxAge} лет` };
  }

  return { isValid: true, date };
};

const ClientModal: React.FC<ClientModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData = {
    id: 0,
    fullName: '',
    phone: '',
    doc: '',
    birthdate: '',
    docIssueDate: ''
  },
}) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    fullName: initialData.fullName,
    phone: initialData.phone,
    doc: initialData.doc,
    birthdate: initialData.birthdate,
    docIssueDate: initialData.docIssueDate
  });

  const [validationErrors, setValidationErrors] = useState({
    fullName: false,
    phone: false,
    birthdate: false,
    doc: false,
    docIssueDate: false
  });

  const [errorMessages, setErrorMessages] = useState({
    fullName: '',
    phone: '',
    birthdate: '',
    doc: '',
    docIssueDate: ''
  });

  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    phone: false,
    birthdate: false,
    doc: false,
    docIssueDate: false
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: initialData.fullName,
        phone: initialData.phone,
        doc: initialData.doc,
        birthdate: initialData.birthdate,
        docIssueDate: initialData.docIssueDate
      });
      setValidationErrors({
        fullName: false,
        phone: false,
        birthdate: false,
        doc: false,
        docIssueDate: false
      });
      setErrorMessages({
        fullName: '',
        phone: '',
        birthdate: '',
        doc: '',
        docIssueDate: ''
      });
      setTouchedFields({
        fullName: false,
        phone: false,
        birthdate: false,
        doc: false,
        docIssueDate: false
      });
    }
  }, [initialData, isOpen]);

  // Validation on data change
  useEffect(() => {
    if (mode === 'view') return;

    const newErrorMessages = {
      fullName: '',
      phone: '',
      birthdate: '',
      doc: '',
      docIssueDate: ''
    };

    // Full name validation (at least 2 words)
    if (formData.fullName.trim().split(/\s+/).length < 2) {
      newErrorMessages.fullName = 'Укажите фамилию и имя (минимум 2 слова)';
    } else if (formData.fullName.trim().length === 0) {
      newErrorMessages.fullName = 'Поле обязательно для заполнения';
    }

    // Phone validation (example: 8 (123) 456-78-90)
    const phoneRegex = /^(\+7|8)\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      newErrorMessages.phone = 'Введите телефон';
    } else if (formData.phone.trim().length === 0) {
      newErrorMessages.phone = 'Поле обязательно для заполнения';
    }

    // Birthdate validation (18-100 years)
    const birthdateValidation = validateDate(formData.birthdate, 18, 100);
    if (!birthdateValidation.isValid) {
      newErrorMessages.birthdate = birthdateValidation.error || '';
    }

    // Document validation (series and number: 4 digits, space, 6 digits)
    const docRegex = /^\d{4}\s\d{6}$/;
    if (!docRegex.test(formData.doc.trim())) {
      newErrorMessages.doc = 'Введите документ';
    } else if (formData.doc.trim().length === 0) {
      newErrorMessages.doc = 'Поле обязательно для заполнения';
    }

    // Document issue date validation (not older than 90 years and not in the future)
    const docIssueValidation = validateDate(formData.docIssueDate, 0, 90);
    if (!docIssueValidation.isValid) {
      newErrorMessages.docIssueDate = docIssueValidation.error || '';
    } else if (docIssueValidation.date) {
      const today = new Date();
      if (docIssueValidation.date > today) {
        newErrorMessages.docIssueDate = 'Дата выдачи не может быть в будущем';
      }
    }

    setErrorMessages(newErrorMessages);

    const errors = {
      fullName: !!newErrorMessages.fullName,
      phone: !!newErrorMessages.phone,
      birthdate: !!newErrorMessages.birthdate,
      doc: !!newErrorMessages.doc,
      docIssueDate: !!newErrorMessages.docIssueDate
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
        formData.fullName !== initialData.fullName ||
        formData.phone !== initialData.phone ||
        formData.doc !== initialData.doc ||
        formData.birthdate !== initialData.birthdate ||
        formData.docIssueDate !== initialData.docIssueDate
      );
      return !isChanged;
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched to show errors
    setTouchedFields({
      fullName: true,
      phone: true,
      birthdate: true,
      doc: true,
      docIssueDate: true
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
      [name]: value
    }));
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Создание клиента';
      case 'edit': return 'Редактирование клиента';
      case 'view': return 'Просмотр клиента';
      default: return 'Клиент';
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
          
          <InputRow>
            <InputLabel>ФИО:</InputLabel>
            <InputContainer>
              <CustomInput
                name="fullName"
                inputType="fullname"
                placeholder="ФИО клиента"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={touchedFields.fullName && validationErrors.fullName}
                errorMessage={touchedFields.fullName ? errorMessages.fullName : undefined}
              />
            </InputContainer>
          </InputRow>
          
          <InputRow>
            <InputLabel>Телефон:</InputLabel>
            <InputContainer>
              <PhoneModalInput
                name="phone"
                placeholder="Телефон"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={touchedFields.phone && validationErrors.phone}
                errorMessage={touchedFields.phone ? errorMessages.phone : undefined}
              />
            </InputContainer>
          </InputRow>
          
          <InputRow>
            <InputLabel>Дата рождения:</InputLabel>
            <InputContainer>
              <CustomInput
                name="birthdate"
                inputType="date"
                placeholder="дд.мм.гггг"
                value={formData.birthdate}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={touchedFields.birthdate && validationErrors.birthdate}
                errorMessage={touchedFields.birthdate ? errorMessages.birthdate : undefined}
              />
            </InputContainer>
          </InputRow>
          
          <ModalInfoTitle>Паспортные данные</ModalInfoTitle>
          
          <InputRow>
            <InputLabel>Паспорт:</InputLabel>
            <InputContainer>
              <CustomInput
                name="doc"
                inputType="doc"
                placeholder="Серия и номер"
                value={formData.doc}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={touchedFields.doc && validationErrors.doc}
                errorMessage={touchedFields.doc ? errorMessages.doc : undefined}
              />
            </InputContainer>
          </InputRow>
          
          <InputRow>
            <InputLabel>Дата выдачи:</InputLabel>
            <InputContainer>
              <CustomInput
                name="docIssueDate"
                inputType="date"
                placeholder="дд.мм.гггг"
                value={formData.docIssueDate}
                onChange={handleInputChange}
                disabled={mode === 'view'}
                hasError={touchedFields.docIssueDate && validationErrors.docIssueDate}
                errorMessage={touchedFields.docIssueDate ? errorMessages.docIssueDate : undefined}
              />
            </InputContainer>
          </InputRow>
        </div>
      </form>
    </BaseModal>
  );
};

export default ClientModal;